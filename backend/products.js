import { randomUUID } from "node:crypto";
import {
  buildResponse,
  createErrorResponse,
  extractUserContext,
  getCollection,
  getPathParam,
  parseJsonBody,
  parseIdempotencyKey,
  checkOrAcquireLock,
  releaseOrResolveLock,
} from "./shared.js";

const VALID_TRACK_TYPES = new Set(["UNIQUE", "BULK"]);
const MAX_TITLE_LENGTH = 200;
const MAX_PRODUCT_ID_LENGTH = 128;

const fallbackProducts = [
  {
    id: "prod-001",
    title: "Ruby Heart Pendant",
    titleNormalized: "ruby heart pendant",
    msrp: 1299,
    is_b2b_only: false,
    track_type: "UNIQUE",
    businessId: null,
    isDeleted: false,
    createdAt: new Date("2024-01-15T00:00:00.000Z"),
  },
  {
    id: "prod-002",
    title: "Diamond Tennis Bracelet",
    titleNormalized: "diamond tennis bracelet",
    msrp: 2499,
    is_b2b_only: true,
    track_type: "UNIQUE",
    businessId: "biz-001",
    isDeleted: false,
    createdAt: new Date("2024-02-01T00:00:00.000Z"),
  },
  {
    id: "prod-003",
    title: "Pearl Stud Earrings",
    titleNormalized: "pearl stud earrings",
    msrp: 799,
    is_b2b_only: false,
    track_type: "UNIQUE",
    businessId: null,
    isDeleted: false,
    createdAt: new Date("2024-03-10T00:00:00.000Z"),
  },
];

const normalizeTitle = (title) => title.trim().toLowerCase();

const isActiveProduct = (product) => product?.isDeleted !== true;

const activeMetadataFilter = (extra = {}) => ({
  SK: "METADATA",
  isDeleted: { $ne: true },
  ...extra,
});

const mapFallbackProduct = (product) => ({
  id: product.id,
  title: product.title,
  msrp: product.msrp,
  is_b2b_only: product.is_b2b_only,
  track_type: product.track_type,
  businessId: product.businessId ?? null,
  createdAt: product.createdAt,
});

const canViewB2bProducts = (userContext) =>
  userContext.isAdmin || userContext.isBusiness;

const canModifyProduct = (userContext) =>
  userContext.isAdmin || userContext.isBusiness;

const ownsProduct = (userContext, product) => {
  if (userContext.isAdmin) {
    return true;
  }

  if (!userContext.isBusiness || !userContext.businessId) {
    return false;
  }

  return product.businessId === userContext.businessId;
};

const validateTitle = (title, { required = false } = {}) => {
  if (title === undefined || title === null) {
    return required ? "title is required" : null;
  }

  if (typeof title !== "string") {
    return "title must be a string";
  }

  const trimmed = title.trim();
  if (!trimmed) {
    return "title cannot be empty";
  }

  if (trimmed.length > MAX_TITLE_LENGTH) {
    return `title must be at most ${MAX_TITLE_LENGTH} characters`;
  }

  return null;
};

const validateMsrp = (msrp, { required = false } = {}) => {
  if (msrp === undefined || msrp === null) {
    return required ? "msrp is required" : null;
  }

  if (typeof msrp !== "number" || !Number.isFinite(msrp)) {
    return "msrp must be a finite number";
  }

  if (msrp <= 0) {
    return "msrp must be greater than 0";
  }

  return null;
};

const validateTrackType = (trackType, { required = false } = {}) => {
  if (trackType === undefined || trackType === null) {
    return required ? "track_type is required" : null;
  }

  if (typeof trackType !== "string" || !VALID_TRACK_TYPES.has(trackType)) {
    return `track_type must be one of: ${[...VALID_TRACK_TYPES].join(", ")}`;
  }

  return null;
};

const validateIsB2bOnly = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "boolean") {
    return "is_b2b_only must be a boolean";
  }

  return null;
};

const validateProductId = (id) => {
  if (id === undefined || id === null) {
    return null;
  }

  if (typeof id !== "string" || !id.trim()) {
    return "id must be a non-empty string";
  }

  if (id.length > MAX_PRODUCT_ID_LENGTH) {
    return `id must be at most ${MAX_PRODUCT_ID_LENGTH} characters`;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return "id may only contain letters, numbers, underscores, and hyphens";
  }

  return null;
};

const validateTiers = (tiers) => {
  if (tiers === undefined) {
    return null;
  }

  if (!Array.isArray(tiers)) {
    return "tiers must be an array";
  }

  const seenRatings = new Set();
  for (let index = 0; index < tiers.length; index += 1) {
    const tier = tiers[index];

    if (!tier || typeof tier !== "object") {
      return `tiers[${index}] must be an object`;
    }

    if (!tier.org_rating || typeof tier.org_rating !== "string" || !tier.org_rating.trim()) {
      return `tiers[${index}].org_rating is required and must be a non-empty string`;
    }

    if (seenRatings.has(tier.org_rating)) {
      return `tiers[${index}].org_rating must be unique within tiers`;
    }
    seenRatings.add(tier.org_rating);

    const minQty = Number(tier.min_qty);
    if (!Number.isFinite(minQty) || minQty <= 0 || !Number.isInteger(minQty)) {
      return `tiers[${index}].min_qty must be a positive integer`;
    }

    const customPrice = Number(tier.custom_price);
    if (!Number.isFinite(customPrice) || customPrice <= 0) {
      return `tiers[${index}].custom_price must be a positive number`;
    }
  }

  return null;
};

const validationErrorResponse = (errors) =>
  createErrorResponse(422, "Validation failed", { errors });

const validateCreateBody = (body) => {
  const errors = [
    validateTitle(body.title, { required: true }),
    validateMsrp(body.msrp, { required: true }),
    validateTrackType(body.track_type),
    validateIsB2bOnly(body.is_b2b_only),
    validateProductId(body.id),
    validateTiers(body.tiers),
  ].filter(Boolean);

  return errors;
};

const validateUpdateBody = (body) => {
  const hasUpdatableField =
    body.title !== undefined ||
    body.msrp !== undefined ||
    body.is_b2b_only !== undefined ||
    body.track_type !== undefined;

  if (!hasUpdatableField) {
    return ["At least one updatable field is required (title, msrp, is_b2b_only, track_type)"];
  }

  return [
    validateTitle(body.title),
    validateMsrp(body.msrp),
    validateTrackType(body.track_type),
    validateIsB2bOnly(body.is_b2b_only),
  ].filter(Boolean);
};

const findFallbackDuplicate = ({ id, titleNormalized, excludeId = null }) => {
  if (id) {
    const byId = fallbackProducts.find(
      (product) => isActiveProduct(product) && product.id === id && product.id !== excludeId
    );
    if (byId) {
      return { field: "id", value: id };
    }
  }

  if (titleNormalized) {
    const byTitle = fallbackProducts.find(
      (product) =>
        isActiveProduct(product) &&
        product.titleNormalized === titleNormalized &&
        product.id !== excludeId
    );
    if (byTitle) {
      return { field: "title", value: byTitle.title };
    }
  }

  return null;
};

const findDatabaseDuplicate = async (coll, { id, titleNormalized, excludeId = null }) => {
  if (id) {
    const byId = await coll.findOne(activeMetadataFilter({ id }));
    if (byId && byId.id !== excludeId) {
      return { field: "id", value: id };
    }
  }

  if (titleNormalized) {
    const byTitle = await coll.findOne(activeMetadataFilter({ titleNormalized }));
    if (byTitle && byTitle.id !== excludeId) {
      return { field: "title", value: byTitle.title };
    }
  }

  return null;
};

const duplicateErrorResponse = (duplicate) => {
  if (duplicate.field === "id") {
    return createErrorResponse(409, "A product with this id already exists", { productId: duplicate.value });
  }

  return createErrorResponse(409, "A product with this title already exists", { title: duplicate.value });
};

const buildTierDocs = (productId, tiers = []) =>
  tiers.map((tier) => ({
    PK: `PRODUCT#${productId}`,
    SK: `TIER#${tier.org_rating.trim()}`,
    min_qty: Number(tier.min_qty),
    custom_price: Number(tier.custom_price),
  }));

const updateFallbackProduct = (productId, body, userContext) => {
  const index = fallbackProducts.findIndex((entry) => entry.id === productId && isActiveProduct(entry));
  if (index === -1) {
    return null;
  }

  const existing = fallbackProducts[index];
  if (!ownsProduct(userContext, existing)) {
    return { forbidden: true };
  }

  const nextTitle = body.title !== undefined ? body.title.trim() : existing.title;
  const duplicate = findFallbackDuplicate({
    titleNormalized: normalizeTitle(nextTitle),
    excludeId: productId,
  });
  if (duplicate) {
    return { duplicate };
  }

  const updated = {
    ...existing,
    ...(body.title !== undefined ? { title: nextTitle, titleNormalized: normalizeTitle(nextTitle) } : {}),
    ...(body.msrp !== undefined ? { msrp: body.msrp } : {}),
    ...(body.is_b2b_only !== undefined ? { is_b2b_only: body.is_b2b_only } : {}),
    ...(body.track_type !== undefined ? { track_type: body.track_type } : {}),
    updatedAt: new Date(),
    updatedBy: userContext.userId,
  };

  fallbackProducts[index] = updated;
  return { product: mapFallbackProduct(updated) };
};

const softDeleteFallbackProduct = (productId, userContext) => {
  const index = fallbackProducts.findIndex((entry) => entry.id === productId && isActiveProduct(entry));
  if (index === -1) {
    return null;
  }

  const existing = fallbackProducts[index];
  if (!ownsProduct(userContext, existing)) {
    return { forbidden: true };
  }

  fallbackProducts[index] = {
    ...existing,
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: userContext.userId,
    updatedAt: new Date(),
    updatedBy: userContext.userId,
  };

  return { productId };
};

export const handler = async (event) => {
  try {
    const method = event?.httpMethod || event?.requestContext?.httpMethod;
    const path = event?.rawPath || event?.path || "";
    const userContext = extractUserContext(event);

    if (method === "GET" && path === "/products") {
      try {
        const coll = await getCollection();
        const filter = activeMetadataFilter();
        if (!canViewB2bProducts(userContext)) {
          filter.is_b2b_only = false;
        }
        const items = await coll.find(filter).project({ _id: 0 }).toArray();
        return buildResponse(200, { items });
      } catch (error) {
        console.warn("Falling back to in-memory product catalog because MongoDB is unavailable:", error.message);
        const items = fallbackProducts
          .filter((product) => isActiveProduct(product))
          .filter((product) => canViewB2bProducts(userContext) || !product.is_b2b_only)
          .map(mapFallbackProduct);
        return buildResponse(200, { items });
      }
    }

    if (method === "GET" && path.startsWith("/products/")) {
      const productId = getPathParam(event, 1);
      if (!productId) {
        return createErrorResponse(400, "Product id is required");
      }

      try {
        const coll = await getCollection();
        const product = await coll.findOne(
          activeMetadataFilter({ PK: `PRODUCT#${productId}`, id: productId }),
          { projection: { _id: 0 } }
        );
        if (!product) {
          return createErrorResponse(404, "Product not found");
        }

        if (!canViewB2bProducts(userContext) && product.is_b2b_only) {
          return createErrorResponse(404, "Product not found");
        }

        const responsePayload = { ...product };
        if (canViewB2bProducts(userContext)) {
          const tiers = await coll
            .find({ PK: `PRODUCT#${productId}`, SK: { $regex: /^TIER#/ } }, { projection: { _id: 0 } })
            .toArray();
          responsePayload.b2b_tiers = tiers;
        }

        return buildResponse(200, responsePayload);
      } catch (error) {
        console.warn("Falling back to in-memory product detail because MongoDB is unavailable:", error.message);
        const product = fallbackProducts.find((entry) => entry.id === productId && isActiveProduct(entry));
        if (!product) {
          return createErrorResponse(404, "Product not found");
        }

        if (!canViewB2bProducts(userContext) && product.is_b2b_only) {
          return createErrorResponse(404, "Product not found");
        }

        return buildResponse(200, mapFallbackProduct(product));
      }
    }

    if (method === "POST" && path === "/products") {
      if (!userContext.isAdmin) {
        return createErrorResponse(403, "Only admins can create products");
      }

      const idempotencyKey = parseIdempotencyKey(event);
      let lockResult = { acquired: true, existing: null };

      try {
        lockResult = await checkOrAcquireLock(idempotencyKey, userContext);
      } catch (error) {
        console.warn("Idempotency lock skipped because MongoDB is unavailable:", error.message);
      }

      if (!lockResult.acquired) {
        if (lockResult.existing?.responseBody) {
          return buildResponse(200, lockResult.existing.responseBody);
        }
        return createErrorResponse(409, "Idempotency lock already in progress");
      }

      try {
        const body = parseJsonBody(event);
        const validationErrors = validateCreateBody(body);
        if (validationErrors.length > 0) {
          return validationErrorResponse(validationErrors);
        }

        const productId = body.id?.trim() || randomUUID();
        const title = body.title.trim();
        const titleNormalized = normalizeTitle(title);
        const trackType = body.track_type || "UNIQUE";
        const metadataDoc = {
          PK: `PRODUCT#${productId}`,
          SK: "METADATA",
          id: productId,
          title,
          titleNormalized,
          msrp: body.msrp,
          is_b2b_only: Boolean(body.is_b2b_only),
          track_type: trackType,
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          createdAt: new Date(),
          ownerId: userContext.userId,
          businessId: body.businessId?.trim() || (userContext.isBusiness ? userContext.businessId : null),
          createdBy: userContext.userId,
          updatedBy: userContext.userId,
          updatedAt: new Date(),
        };

        const tierDocs = buildTierDocs(productId, body.tiers || []);

        try {
          const coll = await getCollection();
          const duplicate = await findDatabaseDuplicate(coll, { id: productId, titleNormalized });
          if (duplicate) {
            return duplicateErrorResponse(duplicate);
          }

          await coll.insertMany([metadataDoc, ...tierDocs]);
        } catch (databaseError) {
          if (databaseError?.code === 11000) {
            return createErrorResponse(409, "A product with this id or title already exists");
          }

          console.warn("MongoDB write failed, storing product in memory for local testing:", databaseError.message);
          const duplicate = findFallbackDuplicate({ id: productId, titleNormalized });
          if (duplicate) {
            return duplicateErrorResponse(duplicate);
          }

          fallbackProducts.push({
            id: productId,
            title: metadataDoc.title,
            titleNormalized,
            msrp: metadataDoc.msrp,
            is_b2b_only: metadataDoc.is_b2b_only,
            track_type: metadataDoc.track_type,
            businessId: metadataDoc.businessId,
            isDeleted: false,
            createdAt: metadataDoc.createdAt,
          });
        }

        const responsePayload = {
          productId,
          metadata: metadataDoc,
          tiers: tierDocs,
        };

        try {
          await releaseOrResolveLock(idempotencyKey, responsePayload);
        } catch (error) {
          console.warn("Failed to release idempotency lock:", error.message);
        }

        return buildResponse(201, responsePayload);
      } catch (error) {
        try {
          await releaseOrResolveLock(idempotencyKey, { error: error.message });
        } catch (lockError) {
          console.warn("Failed to release idempotency lock after error:", lockError.message);
        }

        return createErrorResponse(500, "Failed to create product", error.message);
      }
    }

    if (method === "PUT" && path.startsWith("/products/")) {
      const productId = getPathParam(event, 1);
      if (!productId) {
        return createErrorResponse(400, "Product id is required");
      }

      if (!canModifyProduct(userContext)) {
        return createErrorResponse(403, "Unauthorized");
      }

      const body = parseJsonBody(event);
      const validationErrors = validateUpdateBody(body);
      if (validationErrors.length > 0) {
        return validationErrorResponse(validationErrors);
      }

      const updates = {
        ...(body.title !== undefined ? { title: body.title.trim(), titleNormalized: normalizeTitle(body.title) } : {}),
        ...(body.msrp !== undefined ? { msrp: body.msrp } : {}),
        ...(body.is_b2b_only !== undefined ? { is_b2b_only: body.is_b2b_only } : {}),
        ...(body.track_type !== undefined ? { track_type: body.track_type } : {}),
        updatedAt: new Date(),
        updatedBy: userContext.userId,
      };

      try {
        const coll = await getCollection();
        const existing = await coll.findOne(activeMetadataFilter({ PK: `PRODUCT#${productId}`, id: productId }));

        if (!existing) {
          return createErrorResponse(404, "Product not found");
        }

        if (!ownsProduct(userContext, existing)) {
          return createErrorResponse(403, "You do not have permission to modify this product");
        }

        if (updates.titleNormalized) {
          const duplicate = await findDatabaseDuplicate(coll, {
            titleNormalized: updates.titleNormalized,
            excludeId: productId,
          });
          if (duplicate) {
            return duplicateErrorResponse(duplicate);
          }
        }

        await coll.updateOne(
          { PK: `PRODUCT#${productId}`, SK: "METADATA" },
          { $set: updates }
        );

        const updated = await coll.findOne(
          activeMetadataFilter({ PK: `PRODUCT#${productId}`, id: productId }),
          { projection: { _id: 0 } }
        );

        return buildResponse(200, {
          message: "Product updated successfully",
          product: updated,
        });
      } catch (error) {
        console.warn("Falling back to in-memory product update because MongoDB is unavailable:", error.message);
        const result = updateFallbackProduct(productId, body, userContext);
        if (!result) {
          return createErrorResponse(404, "Product not found");
        }
        if (result.forbidden) {
          return createErrorResponse(403, "You do not have permission to modify this product");
        }
        if (result.duplicate) {
          return duplicateErrorResponse(result.duplicate);
        }

        return buildResponse(200, {
          message: "Product updated successfully",
          product: result.product,
        });
      }
    }

    if (method === "DELETE" && path.startsWith("/products/")) {
      const productId = getPathParam(event, 1);
      if (!productId) {
        return createErrorResponse(400, "Product id is required");
      }

      if (!canModifyProduct(userContext)) {
        return createErrorResponse(403, "Unauthorized");
      }

      try {
        const coll = await getCollection();
        const existing = await coll.findOne(activeMetadataFilter({ PK: `PRODUCT#${productId}`, id: productId }));

        if (!existing) {
          return createErrorResponse(404, "Product not found");
        }

        if (!ownsProduct(userContext, existing)) {
          return createErrorResponse(403, "You do not have permission to delete this product");
        }

        await coll.updateOne(
          { PK: `PRODUCT#${productId}`, SK: "METADATA" },
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

        return buildResponse(200, {
          message: "Product deleted successfully",
          productId,
        });
      } catch (error) {
        console.warn("Falling back to in-memory product delete because MongoDB is unavailable:", error.message);
        const result = softDeleteFallbackProduct(productId, userContext);
        if (!result) {
          return createErrorResponse(404, "Product not found");
        }
        if (result.forbidden) {
          return createErrorResponse(403, "You do not have permission to delete this product");
        }

        return buildResponse(200, {
          message: "Product deleted successfully",
          productId,
        });
      }
    }

    return createErrorResponse(404, "Route not found");
  } catch (error) {
    console.error("PRODUCT ERROR:");
    console.error(error);
    console.error(error.stack);

    return createErrorResponse(500, "Unexpected product service error", error.message);
  }
};
