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

const getOrderOwnerPartition = (userContext) => {
  if (userContext.isOrganization && userContext.businessId) {
    return `BUSINESS#${userContext.businessId}`;
  }
  return `USER#${userContext.userId}`;
};

export const handler = async (event) => {
  try {
    const method = event?.httpMethod || event?.requestContext?.httpMethod;
    const path = event?.rawPath || event?.path || "";
    const userContext = extractUserContext(event);

    if (method === "GET" && path === "/orders") {
      if (!userContext.isAuthenticated) {
        return createErrorResponse(403, "Authentication required");
      }

      const coll = await getCollection();
      const pk = getOrderOwnerPartition(userContext);
      const orders = await coll.find({ PK: pk, SK: "METADATA" }).project({ _id: 0 }).toArray();
      return buildResponse(200, { orders });
    }

    if (method === "GET" && path.startsWith("/orders/")) {
      const orderId = getPathParam(event, 1);
      if (!orderId) {
        return createErrorResponse(400, "Order id is required");
      }

      const coll = await getCollection();
      const order = await coll.findOne({ PK: `ORDER#${orderId}`, SK: "METADATA" }, { projection: { _id: 0 } });
      if (!order) {
        return createErrorResponse(404, "Order not found");
      }

      if (!userContext.isAdmin && order.ownerId !== userContext.userId && order.businessId !== userContext.businessId) {
        return createErrorResponse(403, "Access denied");
      }

      return buildResponse(200, order);
    }

    if (method === "POST" && path === "/orders") {
      if (!userContext.isAuthenticated) {
        return createErrorResponse(403, "Authentication required");
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
        const coll = await getCollection();
        const cartItems = await coll.find({ PK: `CART#${userContext.isOrganization && userContext.businessId ? userContext.businessId : userContext.userId}` }).project({ _id: 0 }).toArray();
        if (cartItems.length === 0) {
          return createErrorResponse(422, "Cart is empty");
        }

        const totalAmount = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.msrp || 0), 0);
        const orderId = body.orderId || randomUUID();
        const orderStatus = userContext.isOrganization && userContext.creditLimit > 0 && totalAmount > userContext.creditLimit
          ? "PENDING_MANAGEMENT_APPROVAL"
          : "PENDING_PAYMENT";

        const orderDoc = {
          PK: `ORDER#${orderId}`,
          SK: "METADATA",
          orderId,
          totalAmount,
          orderStatus,
          ownerId: userContext.userId,
          businessId: userContext.businessId || null,
          createdAt: new Date(),
        };

        const corporateIndexDoc = userContext.isOrganization && userContext.businessId
          ? {
              PK: `BUSINESS#${userContext.businessId}`,
              SK: `ORDER#${orderId}`,
              orderId,
              totalAmount,
              status: orderStatus,
            }
          : null;

        const session = coll.db.client.startSession();
        try {
          await session.withTransaction(async () => {
            await coll.insertOne(orderDoc, { session });
            if (corporateIndexDoc) {
              await coll.insertOne(corporateIndexDoc, { session });
            }
            await coll.deleteMany({ PK: `CART#${userContext.isOrganization && userContext.businessId ? userContext.businessId : userContext.userId}` }, { session });
          });
        } finally {
          await session.endSession();
        }

        const responsePayload = { order: orderDoc, corporateIndex: corporateIndexDoc };
        await releaseOrResolveLock(idempotencyKey, responsePayload);
        return buildResponse(201, responsePayload);
      } catch (error) {
        await releaseOrResolveLock(idempotencyKey, { error: error.message });
        return createErrorResponse(500, "Failed to create order", error.message);
      }
    }

    return createErrorResponse(404, "Route not found");
  } catch (error) {
    return createErrorResponse(500, "Unexpected orders service error", error.message);
  }
};
