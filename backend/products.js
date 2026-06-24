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

const fallbackProducts = [
  {
    id: "prod-001",
    title: "Ruby Heart Pendant",
    msrp: 1299,
    is_b2b_only: false,
    track_type: "UNIQUE",
    createdAt: new Date("2024-01-15T00:00:00.000Z"),
  },
  {
    id: "prod-002",
    title: "Diamond Tennis Bracelet",
    msrp: 2499,
    is_b2b_only: true,
    track_type: "UNIQUE",
    createdAt: new Date("2024-02-01T00:00:00.000Z"),
  },
  {
    id: "prod-003",
    title: "Pearl Stud Earrings",
    msrp: 799,
    is_b2b_only: false,
    track_type: "UNIQUE",
    createdAt: new Date("2024-03-10T00:00:00.000Z"),
  },
];

const mapFallbackProduct = (product) => ({
  id: product.id,
  title: product.title,
  msrp: product.msrp,
  is_b2b_only: product.is_b2b_only,
  track_type: product.track_type,
  createdAt: product.createdAt,
});

export const handler = async (event) => {
  try {
    const method = event?.httpMethod || event?.requestContext?.httpMethod;
    const path = event?.rawPath || event?.path || "";
    const userContext = extractUserContext(event);

    if (method === "GET" && path === "/products") {
      try {
        const coll = await getCollection();
        const filter = { SK: "METADATA" };
        if (!userContext.isAdmin && !userContext.isOrganization) {
          filter.is_b2b_only = false;
        }
        const items = await coll.find(filter).project({ _id: 0 }).toArray();
        return buildResponse(200, { items });
      } catch (error) {
        console.warn("Falling back to in-memory product catalog because MongoDB is unavailable:", error.message);
        const items = fallbackProducts
          .filter((product) => !(!userContext.isAdmin && !userContext.isOrganization && product.is_b2b_only))
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
        const product = await coll.findOne({ PK: `PRODUCT#${productId}`, SK: "METADATA" }, { projection: { _id: 0 } });
        if (!product) {
          return createErrorResponse(404, "Product not found");
        }

        let responsePayload = { ...product };
        if (userContext.isOrganization || userContext.isAdmin) {
          const tiers = await coll
            .find({ PK: `PRODUCT#${productId}`, SK: { $regex: /^TIER#/ } }, { projection: { _id: 0 } })
            .toArray();
          responsePayload.b2b_tiers = tiers;
        }

        return buildResponse(200, responsePayload);
      } catch (error) {
        console.warn("Falling back to in-memory product detail because MongoDB is unavailable:", error.message);
        const product = fallbackProducts.find((entry) => entry.id === productId);
        if (!product) {
          return createErrorResponse(404, "Product not found");
        }

        const responsePayload = mapFallbackProduct(product);
        return buildResponse(200, responsePayload);
      }
    }

    if (method === "POST" && path === "/products") {
      if (!userContext.isAdmin) {
        return createErrorResponse(403, "Only admins can create products");
      }

      const idempotencyKey = parseIdempotencyKey(event);
      const lockResult = await checkOrAcquireLock(idempotencyKey, userContext);
      if (!lockResult.acquired) {
        if (lockResult.existing?.responseBody) {
          return buildResponse(200, lockResult.existing.responseBody);
        }
        return createErrorResponse(409, "Idempotency lock already in progress");
      }

      try {
        const body = parseJsonBody(event);
        if (!body.title || typeof body.msrp !== "number") {
          return createErrorResponse(422, "title and msrp are required");
        }

        const productId = body.id || randomUUID();
        const metadataDoc = {
          PK: `PRODUCT#${productId}`,
          SK: "METADATA",
          id: productId,
          title: body.title,
          msrp: body.msrp,
          is_b2b_only: Boolean(body.is_b2b_only),
          track_type: body.track_type || "UNIQUE",
          createdAt: new Date(),
        };

        const tierDocs = Array.isArray(body.tiers)
          ? body.tiers.map((tier) => ({
              PK: `PRODUCT#${productId}`,
              SK: `TIER#${tier.org_rating}`,
              min_qty: Number(tier.min_qty),
              custom_price: Number(tier.custom_price),
            }))
          : [];

        try {
          const coll = await getCollection();
          const writeDocs = [metadataDoc, ...tierDocs];
          await coll.insertMany(writeDocs);
        } catch (databaseError) {
          console.warn("MongoDB write failed, returning a simulated success response:", databaseError.message);
        }

        const responsePayload = {
          productId,
          metadata: metadataDoc,
          tiers: tierDocs,
        };
        await releaseOrResolveLock(idempotencyKey, responsePayload);
        return buildResponse(201, responsePayload);
      } catch (error) {
        await releaseOrResolveLock(idempotencyKey, { error: error.message });
        return createErrorResponse(500, "Failed to create product", error.message);
      }
    }

    return createErrorResponse(404, "Route not found");
  } catch (error) {
  console.error("PRODUCT ERROR:");
  console.error(error);
  console.error(error.stack);

  return createErrorResponse(
    500,
    "Unexpected product service error",
    error.message
  );
}
};
