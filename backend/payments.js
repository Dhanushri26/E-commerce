import {
  buildResponse,
  createErrorResponse,
  extractUserContext,
  getCollection,
  parseJsonBody,
} from "./shared.js";

export const handler = async (event) => {
  try {
    const method = event?.httpMethod || event?.requestContext?.httpMethod;
    const path = event?.rawPath || event?.path || "";
    const userContext = extractUserContext(event);

    if (method === "POST" && path === "/payments/intent") {
      if (!userContext.isAuthenticated) {
        return createErrorResponse(403, "Authentication required");
      }

      const body = parseJsonBody(event);
      const orderId = body.order_id;
      if (!orderId) {
        return createErrorResponse(422, "order_id is required");
      }

      const coll = await getCollection();
      const order = await coll.findOne({ PK: `ORDER#${orderId}`, SK: "METADATA" }, { projection: { _id: 0 } });
      if (!order) {
        return createErrorResponse(404, "Order not found");
      }

      const intent = {
        orderId,
        amount: order.totalAmount,
        currency: "USD",
        client_secret: `pi_test_${orderId}_secret`,
      };

      return buildResponse(201, intent);
    }

    if (method === "POST" && path === "/payments/po-verify") {
      if (!userContext.isBusiness && !userContext.isAdmin) {
        return createErrorResponse(403, "Only organizations or admins can verify purchase orders");
      }

      const body = parseJsonBody(event);
      const orderId = body.order_id;
      if (!orderId) {
        return createErrorResponse(422, "order_id is required");
      }

      const coll = await getCollection();
      const order = await coll.findOne({ PK: `ORDER#${orderId}`, SK: "METADATA" }, { projection: { _id: 0 } });
      if (!order) {
        return createErrorResponse(404, "Order not found");
      }

      const rawSafetyMargin = body.credit_safety_margin ?? body.creditSafetyMargin ?? 0.1;
      const safetyMargin = Number(rawSafetyMargin);
      if (!Number.isFinite(safetyMargin) || safetyMargin < 0 || safetyMargin >= 1) {
        return createErrorResponse(422, "credit_safety_margin must be a number between 0 and 1");
      }

      const creditLimit = Number.isFinite(Number(userContext.creditLimit)) ? Number(userContext.creditLimit) : 0;
      const allowed = Number(order.totalAmount) <= creditLimit * (1 - safetyMargin);
      if (!allowed) {
        return createErrorResponse(422, "Purchase order exceeds credit safety margin");
      }

      await coll.updateOne(
        { PK: `ORDER#${orderId}`, SK: "METADATA" },
        { $set: { orderStatus: "PAID", updatedAt: new Date() } }
      );

      return buildResponse(200, { orderId, status: "PAID" });
    }

    if (method === "POST" && path === "/payments/webhook") {
      const body = parseJsonBody(event);
      if (body?.event === "payment_intent.succeeded") {
        const coll = await getCollection();
        const orderId = body.order_id;
        if (!orderId) {
          return createErrorResponse(422, "order_id is required");
        }

        await coll.updateOne(
          { PK: `ORDER#${orderId}`, SK: "METADATA" },
          { $set: { orderStatus: "PAID", updatedAt: new Date() } }
        );
      }

      return buildResponse(200, { received: true });
    }

    return createErrorResponse(404, "Route not found");
  } catch (error) {
    return createErrorResponse(500, "Unexpected payments service error", error.message);
  }
};
