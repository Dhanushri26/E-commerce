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

      if (trackType === "UNIQUE") {
        const result = await coll.updateOne(
          {
            PK: inventoryPk,
            SK: "STOCK",
            reservation_status: "AVAILABLE",
          },
          {
            $set: {
              reservation_status: "RESERVED",
              reservation_ttl: reservationTtl,
              updatedAt: new Date(),
            },
          }
        );

        if (result.modifiedCount === 0) {
          return createErrorResponse(409, "Inventory could not be reserved");
        }
      } else {
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

        if (result.modifiedCount === 0) {
          return createErrorResponse(409, "Insufficient inventory available");
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
