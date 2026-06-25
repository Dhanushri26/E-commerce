import { randomUUID } from "node:crypto";
import {
  buildResponse,
  createErrorResponse,
  extractUserContext,
  getCollection,
  getPathParam,
  parseJsonBody,
  createAuditFields,
  updateAuditFields,
  ORDER_STATUS,
} from "./shared.js";

const activeInventoryFilter = (extra = {}) => ({
  SK: "STOCK",
  isDeleted: { $ne: true },
  ...extra,
});

const normalizeQuantity = (value) => Number(value ?? 0);
const DEFAULT_INITIAL_INVENTORY_QUANTITY = 10;

const readInventoryByProduct = async (coll, productId) => {
  if (!productId) {
    return null;
  }

  return coll.findOne(activeInventoryFilter({ PK: `INVENTORY#${productId}` }), { projection: { _id: 0 } });
};

const buildInventoryResponse = (inventory) => ({
  ...inventory,
  availableQuantity: Number(inventory?.availableQuantity ?? inventory?.available_quantity ?? 0),
  reservedQuantity: Number(inventory?.reservedQuantity ?? inventory?.reserved_quantity ?? 0),
  damagedQuantity: Number(inventory?.damagedQuantity ?? inventory?.damaged_quantity ?? 0),
  reorderThreshold: Number(inventory?.reorderThreshold ?? inventory?.reorder_threshold ?? 0),
});

export const buildInventoryDocument = (productId, body = {}, userContext = {}) => {
  const availableQuantity = normalizeQuantity(
    body.availableQuantity ?? body.available_quantity ?? body.initialInventoryQuantity ?? body.initial_inventory_quantity ?? DEFAULT_INITIAL_INVENTORY_QUANTITY
  );

  return {
    PK: `INVENTORY#${productId}`,
    SK: "STOCK",
    inventoryId: body.inventoryId || randomUUID(),
    productId,
    availableQuantity,
    reservedQuantity: normalizeQuantity(body.reservedQuantity ?? body.reserved_quantity ?? 0),
    damagedQuantity: normalizeQuantity(body.damagedQuantity ?? body.damaged_quantity ?? 0),
    reorderThreshold: normalizeQuantity(body.reorderThreshold ?? body.reorder_threshold ?? 0),
    warehouseId: body.warehouseId || null,
    inventoryStatus: body.inventoryStatus || (availableQuantity > 0 ? "AVAILABLE" : "OUT_OF_STOCK"),
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    reservationStatus: "AVAILABLE",
    reservationTTL: null,
    reservedBy: null,
    reservedAt: null,
    ...createAuditFields(userContext.userId || "system"),
  };
};

export const ensureInventoryForProduct = async (coll, productId, body = {}, userContext = {}) => {
  if (!productId) {
    return null;
  }

  const existingInventory = await readInventoryByProduct(coll, productId);
  if (existingInventory) {
    return existingInventory;
  }

  const inventoryDoc = buildInventoryDocument(productId, body, userContext);
  await coll.insertOne(inventoryDoc);
  return inventoryDoc;
};

const canManageInventory = (userContext) => userContext.isAdmin;
const canReserveInventory = (userContext) => userContext.isAdmin || userContext.isBusiness;
const canReadInventory = (userContext) => userContext.isAdmin || userContext.isBusiness || userContext.isCustomer;

const validateInventoryPayload = (body) => {
  const errors = [];
  const availableQuantity = normalizeQuantity(body.availableQuantity ?? body.available_quantity);
  const reservedQuantity = normalizeQuantity(body.reservedQuantity ?? body.reserved_quantity);
  const damagedQuantity = normalizeQuantity(body.damagedQuantity ?? body.damaged_quantity);
  const reorderThreshold = normalizeQuantity(body.reorderThreshold ?? body.reorder_threshold);

  if (!Number.isFinite(availableQuantity) || availableQuantity < 0) {
    errors.push("availableQuantity must be a non-negative number");
  }
  if (!Number.isFinite(reservedQuantity) || reservedQuantity < 0) {
    errors.push("reservedQuantity must be a non-negative number");
  }
  if (!Number.isFinite(damagedQuantity) || damagedQuantity < 0) {
    errors.push("damagedQuantity must be a non-negative number");
  }
  if (!Number.isFinite(reorderThreshold) || reorderThreshold < 0) {
    errors.push("reorderThreshold must be a non-negative number");
  }

  if (typeof body.productId !== "string" || !body.productId.trim()) {
    errors.push("productId is required");
  }

  if (body.inventoryStatus && typeof body.inventoryStatus !== "string") {
    errors.push("inventoryStatus must be a string");
  }

  return errors;
};

const appendAuditEntry = async (coll, inventoryId, action, quantity, performedBy, reason = null) => {
  const auditEntry = {
    action,
    quantity,
    performedBy,
    timestamp: new Date(),
    reason,
  };

  await coll.updateOne(
    { PK: `INVENTORY#${inventoryId}`, SK: "AUDIT" },
    { $push: { entries: auditEntry } },
    { upsert: true }
  );
};

const expireReservations = async (coll) => {
  await coll.updateMany(
    activeInventoryFilter({ reservationStatus: "RESERVED", reservationTTL: { $lte: new Date() } }),
    {
      $set: {
        reservationStatus: "AVAILABLE",
        reservationTTL: null,
        reservedBy: null,
        reservedAt: null,
        updatedAt: new Date(),
      },
    }
  );
};

export const handler = async (event) => {
  try {
    const method = event?.httpMethod || event?.requestContext?.httpMethod;
    const path = event?.rawPath || event?.path || "";
    const userContext = extractUserContext(event);

    if (method === "GET" && (path === "/inventory" || path === "/inventory/")) {
      if (!canReadInventory(userContext)) {
        return createErrorResponse(403, "Access denied");
      }

      const coll = await getCollection();
      await expireReservations(coll);
      const inventoryItems = await coll.find(activeInventoryFilter()).project({ _id: 0 }).toArray();
      const uniqueProductIds = new Set(
        inventoryItems.map((item) => item.productId || item.product_id || item.PK?.replace(/^INVENTORY#/, "")).filter(Boolean)
      );

      return buildResponse(200, {
        totalProducts: uniqueProductIds.size,
        items: inventoryItems.map(buildInventoryResponse),
      });
    }

    if (method === "GET" && path.startsWith("/inventory/")) {
      const productId = getPathParam(event, 1);
      if (!productId) {
        return createErrorResponse(400, "Product id is required");
      }

      if (!canReadInventory(userContext)) {
        return createErrorResponse(403, "Access denied");
      }

      const coll = await getCollection();
      await expireReservations(coll);
      const inventory = await readInventoryByProduct(coll, productId);
      if (!inventory) {
        return createErrorResponse(404, "Inventory not found");
      }

      return buildResponse(200, buildInventoryResponse(inventory));
    }

    if (method === "POST" && path === "/inventory") {
      if (!canManageInventory(userContext)) {
        return createErrorResponse(403, "Access denied");
      }

      const body = parseJsonBody(event);
      const validationErrors = validateInventoryPayload(body);
      if (validationErrors.length > 0) {
        return createErrorResponse(422, "Validation failed", { errors: validationErrors });
      }

      const coll = await getCollection();
      const productId = body.productId.trim();
      const existingProduct = await coll.findOne({ PK: `PRODUCT#${productId}`, SK: "METADATA", isDeleted: { $ne: true } }, { projection: { _id: 0 } });
      if (!existingProduct) {
        return createErrorResponse(404, "Product not found");
      }

      const existingInventory = await readInventoryByProduct(coll, productId);
      if (existingInventory) {
        return createErrorResponse(409, "Inventory already exists for this product");
      }

      const inventoryDoc = buildInventoryDocument(productId, body, userContext);

      await coll.insertOne(inventoryDoc);
      return buildResponse(201, buildInventoryResponse(inventoryDoc));
    }

    if (method === "PUT" && path.startsWith("/inventory/")) {
      const productId = getPathParam(event, 1);
      if (!productId) {
        return createErrorResponse(400, "Product id is required");
      }

      if (!canManageInventory(userContext)) {
        return createErrorResponse(403, "Access denied");
      }

      const body = parseJsonBody(event);
      const coll = await getCollection();
      const inventory = await readInventoryByProduct(coll, productId);
      if (!inventory) {
        return createErrorResponse(404, "Inventory not found");
      }

      const updatePayload = {
        ...(body.availableQuantity !== undefined ? { availableQuantity: normalizeQuantity(body.availableQuantity) } : {}),
        ...(body.reservedQuantity !== undefined ? { reservedQuantity: normalizeQuantity(body.reservedQuantity) } : {}),
        ...(body.damagedQuantity !== undefined ? { damagedQuantity: normalizeQuantity(body.damagedQuantity) } : {}),
        ...(body.reorderThreshold !== undefined ? { reorderThreshold: normalizeQuantity(body.reorderThreshold) } : {}),
        ...(body.warehouseId !== undefined ? { warehouseId: body.warehouseId } : {}),
        ...(body.inventoryStatus !== undefined ? { inventoryStatus: body.inventoryStatus } : {}),
        ...updateAuditFields(userContext.userId),
      };

      if (Object.keys(updatePayload).length <= 1) {
        return createErrorResponse(400, "At least one updatable field is required");
      }

      await coll.updateOne({ PK: `INVENTORY#${productId}`, SK: "STOCK" }, { $set: updatePayload });
      const updatedInventory = await readInventoryByProduct(coll, productId);
      return buildResponse(200, buildInventoryResponse(updatedInventory));
    }

    if (method === "DELETE" && path.startsWith("/inventory/")) {
      const productId = getPathParam(event, 1);
      if (!productId) {
        return createErrorResponse(400, "Product id is required");
      }

      if (!canManageInventory(userContext)) {
        return createErrorResponse(403, "Access denied");
      }

      const coll = await getCollection();
      const inventory = await readInventoryByProduct(coll, productId);
      if (!inventory) {
        return createErrorResponse(404, "Inventory not found");
      }

      await coll.updateOne(
        { PK: `INVENTORY#${productId}`, SK: "STOCK" },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: userContext.userId,
            updatedAt: new Date(),
            updatedBy: userContext.userId,
          },
        }
      );

      return buildResponse(200, { message: "Inventory marked deleted" });
    }

    if (method === "PATCH" && path === "/inventory/reserve") {
      if (!canReserveInventory(userContext)) {
        return createErrorResponse(403, "Access denied");
      }

      const body = parseJsonBody(event);
      const requestedQuantity = Number(body.requestedQuantity ?? body.requested_quantity ?? 0);
      if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
        return createErrorResponse(422, "requestedQuantity must be a positive integer");
      }

      const productId = body.productId || body.product_id;
      if (!productId) {
        return createErrorResponse(422, "productId is required");
      }

      const coll = await getCollection();
      const inventory = await readInventoryByProduct(coll, productId);
      if (!inventory) {
        return createErrorResponse(404, "Inventory not found");
      }

      if (inventory.isDeleted) {
        return createErrorResponse(404, "Inventory not found");
      }

      const availableQuantity = Number(inventory.availableQuantity ?? inventory.available_quantity ?? 0);
      if (!Number.isFinite(availableQuantity) || availableQuantity < requestedQuantity) {
        return createErrorResponse(409, "Insufficient inventory available");
      }

      const reservationTTL = new Date(Date.now() + 15 * 60 * 1000);
      const result = await coll.updateOne(
        {
          PK: `INVENTORY#${productId}`,
          SK: "STOCK",
          availableQuantity: { $gte: requestedQuantity },
          isDeleted: { $ne: true },
        },
        {
          $inc: {
            availableQuantity: -requestedQuantity,
            reservedQuantity: requestedQuantity,
          },
          $set: {
            reservationStatus: "RESERVED",
            reservationTTL,
            reservedBy: userContext.userId,
            reservedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: userContext.userId,
          },
        }
      );

      if (result.matchedCount === 0 || result.modifiedCount === 0) {
        return createErrorResponse(409, "Inventory could not be reserved");
      }

      const updatedInventory = await readInventoryByProduct(coll, productId);
      await appendAuditEntry(coll, productId, "RESERVE", requestedQuantity, userContext.userId, "Inventory reservation");
      return buildResponse(200, buildInventoryResponse(updatedInventory));
    }

    if (method === "PATCH" && path === "/inventory/release") {
      if (!canReserveInventory(userContext)) {
        return createErrorResponse(403, "Access denied");
      }

      const body = parseJsonBody(event);
      const requestedQuantity = Number(body.requestedQuantity ?? body.requested_quantity ?? 0);
      if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
        return createErrorResponse(422, "requestedQuantity must be a positive integer");
      }

      const productId = body.productId || body.product_id;
      if (!productId) {
        return createErrorResponse(422, "productId is required");
      }

      const coll = await getCollection();
      const inventory = await readInventoryByProduct(coll, productId);
      if (!inventory) {
        return createErrorResponse(404, "Inventory not found");
      }

      const reservedQuantity = Number(inventory.reservedQuantity ?? inventory.reserved_quantity ?? 0);
      if (reservedQuantity < requestedQuantity) {
        return createErrorResponse(409, "Reserved quantity is insufficient");
      }

      const result = await coll.updateOne(
        { PK: `INVENTORY#${productId}`, SK: "STOCK", isDeleted: { $ne: true } },
        {
          $inc: {
            availableQuantity: requestedQuantity,
            reservedQuantity: -requestedQuantity,
          },
          $set: {
            reservationStatus: "AVAILABLE",
            reservationTTL: null,
            reservedBy: null,
            reservedAt: null,
            updatedAt: new Date(),
            updatedBy: userContext.userId,
          },
        }
      );

      if (result.matchedCount === 0 || result.modifiedCount === 0) {
        return createErrorResponse(409, "Inventory could not be released");
      }

      const updatedInventory = await readInventoryByProduct(coll, productId);
      await appendAuditEntry(coll, productId, "RELEASE", requestedQuantity, userContext.userId, "Inventory release");
      return buildResponse(200, buildInventoryResponse(updatedInventory));
    }

    if (method === "PATCH" && path === "/inventory/commit") {
      if (!canReserveInventory(userContext)) {
        return createErrorResponse(403, "Access denied");
      }

      const body = parseJsonBody(event);
      const requestedQuantity = Number(body.requestedQuantity ?? body.requested_quantity ?? 0);
      if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
        return createErrorResponse(422, "requestedQuantity must be a positive integer");
      }

      const productId = body.productId || body.product_id;
      if (!productId) {
        return createErrorResponse(422, "productId is required");
      }

      const coll = await getCollection();
      const inventory = await readInventoryByProduct(coll, productId);
      if (!inventory) {
        return createErrorResponse(404, "Inventory not found");
      }

      const reservedQuantity = Number(inventory.reservedQuantity ?? inventory.reserved_quantity ?? 0);
      if (reservedQuantity < requestedQuantity) {
        return createErrorResponse(409, "Reserved quantity is insufficient");
      }

      const result = await coll.updateOne(
        { PK: `INVENTORY#${productId}`, SK: "STOCK", isDeleted: { $ne: true } },
        {
          $inc: {
            reservedQuantity: -requestedQuantity,
          },
          $set: {
            reservationStatus: "COMMITTED",
            reservationTTL: null,
            reservedBy: null,
            reservedAt: null,
            updatedAt: new Date(),
            updatedBy: userContext.userId,
          },
        }
      );

      if (result.matchedCount === 0 || result.modifiedCount === 0) {
        return createErrorResponse(409, "Inventory could not be committed");
      }

      await appendAuditEntry(coll, productId, "COMMIT", requestedQuantity, userContext.userId, "Inventory commit");
      const updatedInventory = await readInventoryByProduct(coll, productId);
      return buildResponse(200, buildInventoryResponse(updatedInventory));
    }

    if (method === "PATCH" && path.startsWith("/inventory/") && path.endsWith("/adjust")) {
      if (!canManageInventory(userContext)) {
        return createErrorResponse(403, "Access denied");
      }

      const productId = getPathParam(event, 1);
      if (!productId) {
        return createErrorResponse(400, "Product id is required");
      }

      const body = parseJsonBody(event);
      const adjustment = Number(body.adjustment ?? body.quantity ?? 0);
      if (!Number.isFinite(adjustment)) {
        return createErrorResponse(422, "adjustment must be a number");
      }

      const coll = await getCollection();
      const inventory = await readInventoryByProduct(coll, productId);
      if (!inventory) {
        return createErrorResponse(404, "Inventory not found");
      }

      const nextAvailableQuantity = Number(inventory.availableQuantity ?? inventory.available_quantity ?? 0) + adjustment;
      if (nextAvailableQuantity < 0) {
        return createErrorResponse(409, "Adjustment would make available quantity negative");
      }

      await coll.updateOne(
        { PK: `INVENTORY#${productId}`, SK: "STOCK" },
        {
          $set: {
            availableQuantity: nextAvailableQuantity,
            inventoryStatus: body.inventoryStatus || inventory.inventoryStatus || "AVAILABLE",
            updatedAt: new Date(),
            updatedBy: userContext.userId,
          },
        }
      );

      await appendAuditEntry(coll, productId, "ADJUST", adjustment, userContext.userId, body.reason || "Manual adjustment");
      const updatedInventory = await readInventoryByProduct(coll, productId);
      return buildResponse(200, buildInventoryResponse(updatedInventory));
    }

    return createErrorResponse(404, "Route not found");
  } catch (error) {
    return createErrorResponse(500, "Unexpected inventory service error", error.message);
  }
};
