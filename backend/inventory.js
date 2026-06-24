import {
  buildResponse,
  createErrorResponse,
  extractUserContext,
  getCollection,
  getPathParam,
  parseJsonBody,
} from "./shared.js";

export const handler = async (event) => {
  try {
    const method = event?.httpMethod || event?.requestContext?.httpMethod;
    const path = event?.rawPath || event?.path || "";
    const userContext = extractUserContext(event);

    if (method === "GET" && (path === "/inventory" || path === "/inventory/")) {
      const coll = await getCollection();
      const inventoryItems = await coll.find({ SK: "STOCK" }, { projection: { _id: 0 } }).toArray();
      const uniqueProductIds = new Set(
        inventoryItems
          .map((item) => item.product_id || item.PK?.replace(/^INVENTORY#/, ""))
          .filter(Boolean)
      );

      return buildResponse(200, {
        totalProducts: uniqueProductIds.size,
        items: inventoryItems,
      });
    }

    if (method === "GET" && path.startsWith("/inventory/")) {
      const productId = getPathParam(event, 1);
      if (!productId) {
        return createErrorResponse(400, "Product id is required");
      }

      const coll = await getCollection();
      const inventory = await coll.findOne({ PK: `INVENTORY#${productId}`, SK: "STOCK" }, { projection: { _id: 0 } });
      if (!inventory) {
        return createErrorResponse(404, "Inventory not found");
      }

      return buildResponse(200, inventory);
    }

    if (method === "PATCH" && path === "/inventory/reserve") {
      if (!userContext.isAuthenticated) {
        return createErrorResponse(403, "Authentication required");
      }

      const body = parseJsonBody(event);
      const requestedQuantity = Number(body.requested_quantity);
      const trackType = body.track_type || "UNIQUE";

      if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
        return createErrorResponse(422, "requested_quantity must be a positive integer");
      }

      const coll = await getCollection();
      const productId = body.product_id;
      if (!productId) {
        return createErrorResponse(422, "product_id is required");
      }

      const inventoryPk = `INVENTORY#${productId}`;
      const reservationTtl = new Date(Date.now() + 15 * 60 * 1000);

      const existingInventory = await coll.findOne({ PK: inventoryPk, SK: "STOCK" }, { projection: { _id: 0 } });
      if (!existingInventory) {
        return createErrorResponse(404, "Inventory not found");
      }

      const hasActiveReservation = existingInventory.reservation_status === "RESERVED"
        && existingInventory.reservation_ttl
        && new Date(existingInventory.reservation_ttl) > new Date();
      if (hasActiveReservation) {
        return createErrorResponse(409, "Inventory is already reserved");
      }

      if (trackType === "UNIQUE") {
        const availableQuantity = Number(existingInventory.available_quantity ?? 1);
        if (Number.isFinite(availableQuantity) && availableQuantity <= 0) {
          return createErrorResponse(409, "Insufficient inventory available");
        }

        const result = await coll.updateOne(
          { PK: inventoryPk, SK: "STOCK" },
          {
            $set: {
              reservation_status: "RESERVED",
              reservation_ttl: reservationTtl,
              updatedAt: new Date(),
            },
          }
        );

        if (result.matchedCount === 0) {
          return createErrorResponse(404, "Inventory not found");
        }

        if (result.modifiedCount === 0) {
          return createErrorResponse(409, "Inventory could not be reserved");
        }
      } else {
        const availableQuantity = Number(existingInventory.available_quantity ?? 0);
        if (!Number.isFinite(availableQuantity) || availableQuantity < requestedQuantity) {
          return createErrorResponse(409, "Insufficient inventory available");
        }

        const result = await coll.updateOne(
          {
            PK: inventoryPk,
            SK: "STOCK",
            available_quantity: { $gte: requestedQuantity },
          },
          {
            $inc: { available_quantity: -requestedQuantity },
            $set: {
              reservation_status: "RESERVED",
              reservation_ttl: reservationTtl,
              updatedAt: new Date(),
            },
          }
        );

        if (result.matchedCount === 0) {
          return createErrorResponse(409, "Insufficient inventory available");
        }

        if (result.modifiedCount === 0) {
          return createErrorResponse(409, "Inventory could not be reserved");
        }
      }

      const updatedInventory = await coll.findOne({ PK: inventoryPk, SK: "STOCK" }, { projection: { _id: 0 } });
      return buildResponse(200, updatedInventory);
    }

    return createErrorResponse(404, "Route not found");
  } catch (error) {
    return createErrorResponse(500, "Unexpected inventory service error", error.message);
  }
};
