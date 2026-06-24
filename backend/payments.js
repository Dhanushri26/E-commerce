import { randomUUID } from "node:crypto";
import {
  buildResponse,
  createErrorResponse,
  extractUserContext,
  getCollection,
  getPathParam,
  parseJsonBody,
  PAYMENT_STATUS,
  createAuditFields,
  updateAuditFields,
} from "./shared.js";

const activePaymentFilter = (extra = {}) => ({
  SK: "PAYMENT",
  isDeleted: { $ne: true },
  ...extra,
});

const canReadPayments = (userContext) => userContext.isAdmin || userContext.isBusiness || userContext.isCustomer;
const canManagePayments = (userContext) => userContext.isAdmin;
const canAccessPayment = (userContext, payment) => {
  if (!payment) {
    return false;
  }

  if (userContext.isAdmin) {
    return true;
  }

  if (userContext.isBusiness && userContext.businessId) {
    return payment.businessId === userContext.businessId;
  }

  return payment.ownerId === userContext.userId;
};

const buildPaymentResponse = (payment) => ({
  ...payment,
  amount: Number(payment.amount || 0),
});

const validatePaymentBody = (body) => {
  const errors = [];
  const amount = Number(body.amount ?? body.totalAmount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push("amount must be a positive number");
  }
  if (!body.orderId && !body.order_id) {
    errors.push("orderId is required");
  }
  if (typeof body.currency !== "string" || !body.currency.trim()) {
    errors.push("currency is required");
  }
  if (body.paymentMethod && typeof body.paymentMethod !== "string") {
    errors.push("paymentMethod must be a string");
  }
  return errors;
};

const getPaymentDocument = async (coll, paymentId) => {
  if (!paymentId) {
    return null;
  }
  return coll.findOne(activePaymentFilter({ PK: `PAYMENT#${paymentId}` }), { projection: { _id: 0 } });
};

const listPaymentsForContext = async (coll, userContext) => {
  const filter = activePaymentFilter();
  if (!userContext.isAdmin) {
    if (userContext.isBusiness && userContext.businessId) {
      filter.businessId = userContext.businessId;
    } else {
      filter.ownerId = userContext.userId;
    }
  }
  return coll.find(filter).project({ _id: 0 }).toArray();
};

const updateOrderPaymentStatus = async (coll, orderId, paymentStatus) => {
  if (!orderId) {
    return;
  }
  await coll.updateOne(
    { PK: `ORDER#${orderId}`, SK: "METADATA" },
    { $set: { paymentStatus, updatedAt: new Date() } }
  );
};

const verifyPurchaseOrder = async (coll, orderId, userContext, body = {}) => {
  const order = await coll.findOne({ PK: `ORDER#${orderId}`, SK: "METADATA" }, { projection: { _id: 0 } });
  if (!order) {
    return { error: createErrorResponse(404, "Order not found") };
  }

  const rawSafetyMargin = body.creditSafetyMargin ?? body.credit_safety_margin ?? 0.1;
  const safetyMargin = Number(rawSafetyMargin);
  if (!Number.isFinite(safetyMargin) || safetyMargin < 0 || safetyMargin >= 1) {
    return { error: createErrorResponse(422, "creditSafetyMargin must be a number between 0 and 1") };
  }

  const creditLimit = Number.isFinite(Number(userContext.creditLimit)) ? Number(userContext.creditLimit) : 0;
  const outstandingInvoices = Number(body.outstandingInvoices ?? body.outstanding_invoices ?? 0);
  const creditUtilization = Number(body.creditUtilization ?? body.credit_utilization ?? 0);
  const allowed = Number(order.totalAmount) <= creditLimit * (1 - safetyMargin) - outstandingInvoices - creditUtilization;
  if (!allowed) {
    return { error: createErrorResponse(422, "Purchase order exceeds approved credit envelope") };
  }

  return { order };
};

const validateWebhookPayload = (body) => {
  const source = body?.source || body?.provider || null;
  const eventName = body?.event || body?.type || null;
  if (!source || !eventName) {
    return false;
  }
  return Boolean(body?.data);
};

export const handler = async (event) => {
  try {
    const method = event?.httpMethod || event?.requestContext?.httpMethod;
    const path = event?.rawPath || event?.path || "";
    const userContext = extractUserContext(event);

    if (method === "POST" && path === "/payments") {
      if (!userContext.isAuthenticated) {
        return createErrorResponse(403, "Authentication required");
      }

      const body = parseJsonBody(event);
      const validationErrors = validatePaymentBody(body);
      if (validationErrors.length > 0) {
        return createErrorResponse(422, "Validation failed", { errors: validationErrors });
      }

      const coll = await getCollection();
      const orderId = body.orderId || body.order_id;
      const paymentId = body.paymentId || randomUUID();
      const paymentDoc = {
        PK: `PAYMENT#${paymentId}`,
        SK: "PAYMENT",
        paymentId,
        orderId,
        amount: Number(body.amount ?? body.totalAmount ?? 0),
        currency: body.currency,
        paymentMethod: body.paymentMethod || "UNKNOWN",
        paymentStatus: PAYMENT_STATUS.PENDING,
        transactionReference: body.transactionReference || null,
        ownerId: userContext.userId,
        businessId: userContext.businessId || null,
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        ...createAuditFields(userContext.userId),
      };

      await coll.insertOne(paymentDoc);
      return buildResponse(201, buildPaymentResponse(paymentDoc));
    }

    if (method === "GET" && (path === "/payments" || path === "/payments/")) {
      if (!canReadPayments(userContext)) {
        return createErrorResponse(403, "Access denied");
      }
      const coll = await getCollection();
      const payments = await listPaymentsForContext(coll, userContext);
      return buildResponse(200, { payments: payments.map(buildPaymentResponse) });
    }

    if (method === "GET" && path.startsWith("/payments/")) {
      const paymentId = getPathParam(event, 1);
      if (!paymentId) {
        return createErrorResponse(400, "Payment id is required");
      }
      const coll = await getCollection();
      const payment = await getPaymentDocument(coll, paymentId);
      if (!payment) {
        return createErrorResponse(404, "Payment not found");
      }
      if (!canAccessPayment(userContext, payment)) {
        return createErrorResponse(403, "Access denied");
      }
      return buildResponse(200, buildPaymentResponse(payment));
    }

    if (method === "PUT" && path.startsWith("/payments/")) {
      const paymentId = getPathParam(event, 1);
      if (!paymentId) {
        return createErrorResponse(400, "Payment id is required");
      }
      if (!canManagePayments(userContext)) {
        return createErrorResponse(403, "Access denied");
      }
      const body = parseJsonBody(event);
      const coll = await getCollection();
      const payment = await getPaymentDocument(coll, paymentId);
      if (!payment) {
        return createErrorResponse(404, "Payment not found");
      }
      const updatePayload = {
        ...(body.amount !== undefined ? { amount: Number(body.amount) } : {}),
        ...(body.currency !== undefined ? { currency: body.currency } : {}),
        ...(body.paymentMethod !== undefined ? { paymentMethod: body.paymentMethod } : {}),
        ...(body.paymentStatus !== undefined ? { paymentStatus: body.paymentStatus } : {}),
        ...(body.transactionReference !== undefined ? { transactionReference: body.transactionReference } : {}),
        ...updateAuditFields(userContext.userId),
      };
      if (Object.keys(updatePayload).length <= 1) {
        return createErrorResponse(400, "At least one updatable field is required");
      }
      await coll.updateOne({ PK: `PAYMENT#${paymentId}`, SK: "PAYMENT" }, { $set: updatePayload });
      if (body.paymentStatus === PAYMENT_STATUS.PAID) {
        await updateOrderPaymentStatus(coll, payment.orderId, PAYMENT_STATUS.PAID);
      }
      return buildResponse(200, { payment: buildPaymentResponse({ ...payment, ...updatePayload }) });
    }

    if (method === "DELETE" && path.startsWith("/payments/")) {
      const paymentId = getPathParam(event, 1);
      if (!paymentId) {
        return createErrorResponse(400, "Payment id is required");
      }
      if (!canManagePayments(userContext)) {
        return createErrorResponse(403, "Access denied");
      }
      const coll = await getCollection();
      const payment = await getPaymentDocument(coll, paymentId);
      if (!payment) {
        return createErrorResponse(404, "Payment not found");
      }
      await coll.updateOne(
        { PK: `PAYMENT#${paymentId}`, SK: "PAYMENT" },
        { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: userContext.userId, updatedAt: new Date(), updatedBy: userContext.userId } }
      );
      return buildResponse(200, { message: "Payment marked deleted" });
    }

    if (method === "POST" && path === "/payments/intent") {
      if (!userContext.isAuthenticated) {
        return createErrorResponse(403, "Authentication required");
      }
      const body = parseJsonBody(event);
      const orderId = body.orderId || body.order_id;
      if (!orderId) {
        return createErrorResponse(422, "orderId is required");
      }
      const coll = await getCollection();
      const order = await coll.findOne({ PK: `ORDER#${orderId}`, SK: "METADATA" }, { projection: { _id: 0 } });
      if (!order) {
        return createErrorResponse(404, "Order not found");
      }
      const intent = {
        paymentId: randomUUID(),
        orderId,
        amount: order.totalAmount,
        currency: "USD",
        paymentStatus: PAYMENT_STATUS.PENDING,
        clientSecret: `pi_test_${orderId}_secret`,
      };
      return buildResponse(201, intent);
    }

    if (method === "POST" && path === "/payments/verify") {
      if (!userContext.isAuthenticated) {
        return createErrorResponse(403, "Authentication required");
      }
      const body = parseJsonBody(event);
      const orderId = body.orderId || body.order_id;
      if (!orderId) {
        return createErrorResponse(422, "orderId is required");
      }
      const coll = await getCollection();
      const order = await coll.findOne({ PK: `ORDER#${orderId}`, SK: "METADATA" }, { projection: { _id: 0 } });
      if (!order) {
        return createErrorResponse(404, "Order not found");
      }
      const paymentStatus = body.paymentStatus || PAYMENT_STATUS.AUTHORIZED;
      await coll.updateOne({ PK: `ORDER#${orderId}`, SK: "METADATA" }, { $set: { paymentStatus, updatedAt: new Date() } });
      return buildResponse(200, { orderId, paymentStatus });
    }

    if (method === "POST" && path === "/payments/capture") {
      if (!canManagePayments(userContext)) {
        return createErrorResponse(403, "Access denied");
      }
      const body = parseJsonBody(event);
      const paymentId = body.paymentId || body.payment_id;
      if (!paymentId) {
        return createErrorResponse(422, "paymentId is required");
      }
      const coll = await getCollection();
      const payment = await getPaymentDocument(coll, paymentId);
      if (!payment) {
        return createErrorResponse(404, "Payment not found");
      }
      await coll.updateOne({ PK: `PAYMENT#${paymentId}`, SK: "PAYMENT" }, { $set: { paymentStatus: PAYMENT_STATUS.CAPTURED, updatedAt: new Date(), updatedBy: userContext.userId } });
      await updateOrderPaymentStatus(coll, payment.orderId, PAYMENT_STATUS.CAPTURED);
      return buildResponse(200, { paymentId, paymentStatus: PAYMENT_STATUS.CAPTURED });
    }

    if (method === "POST" && path === "/payments/refund") {
      if (!canManagePayments(userContext)) {
        return createErrorResponse(403, "Access denied");
      }
      const body = parseJsonBody(event);
      const paymentId = body.paymentId || body.payment_id;
      const refundAmount = Number(body.refundAmount ?? body.refund_amount ?? 0);
      if (!paymentId) {
        return createErrorResponse(422, "paymentId is required");
      }
      if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
        return createErrorResponse(422, "refundAmount must be a positive number");
      }
      const coll = await getCollection();
      const payment = await getPaymentDocument(coll, paymentId);
      if (!payment) {
        return createErrorResponse(404, "Payment not found");
      }
      await coll.updateOne({ PK: `PAYMENT#${paymentId}`, SK: "PAYMENT" }, { $set: { paymentStatus: PAYMENT_STATUS.REFUNDED, updatedAt: new Date(), updatedBy: userContext.userId, refundAmount, refundReason: body.refundReason || body.refund_reason || null, refundedAt: new Date(), refundedBy: userContext.userId } });
      await updateOrderPaymentStatus(coll, payment.orderId, PAYMENT_STATUS.REFUNDED);
      return buildResponse(200, { paymentId, paymentStatus: PAYMENT_STATUS.REFUNDED, refundAmount });
    }

    if (method === "POST" && path === "/payments/cancel") {
      if (!canManagePayments(userContext)) {
        return createErrorResponse(403, "Access denied");
      }
      const body = parseJsonBody(event);
      const paymentId = body.paymentId || body.payment_id;
      if (!paymentId) {
        return createErrorResponse(422, "paymentId is required");
      }
      const coll = await getCollection();
      const payment = await getPaymentDocument(coll, paymentId);
      if (!payment) {
        return createErrorResponse(404, "Payment not found");
      }
      await coll.updateOne({ PK: `PAYMENT#${paymentId}`, SK: "PAYMENT" }, { $set: { paymentStatus: PAYMENT_STATUS.CANCELLED, updatedAt: new Date(), updatedBy: userContext.userId } });
      await updateOrderPaymentStatus(coll, payment.orderId, PAYMENT_STATUS.CANCELLED);
      return buildResponse(200, { paymentId, paymentStatus: PAYMENT_STATUS.CANCELLED });
    }

    if (method === "POST" && path === "/payments/webhook") {
      const body = parseJsonBody(event);
      if (!validateWebhookPayload(body)) {
        return createErrorResponse(403, "Invalid webhook payload");
      }
      const coll = await getCollection();
      const orderId = body.orderId || body.order_id;
      if (!orderId) {
        return createErrorResponse(422, "orderId is required");
      }
      if (body.event === "payment_intent.succeeded" || body.event === "payment_intent.completed") {
        await coll.updateOne({ PK: `ORDER#${orderId}`, SK: "METADATA" }, { $set: { paymentStatus: PAYMENT_STATUS.PAID, updatedAt: new Date() } });
      }
      return buildResponse(200, { received: true });
    }

    if (method === "POST" && path === "/payments/po-verify") {
      if (!userContext.isBusiness && !userContext.isAdmin) {
        return createErrorResponse(403, "Only business or admins can verify purchase orders");
      }
      const body = parseJsonBody(event);
      const orderId = body.orderId || body.order_id;
      if (!orderId) {
        return createErrorResponse(422, "orderId is required");
      }
      const coll = await getCollection();
      const verification = await verifyPurchaseOrder(coll, orderId, userContext, body);
      if (verification.error) {
        return verification.error;
      }
      await coll.updateOne({ PK: `ORDER#${orderId}`, SK: "METADATA" }, { $set: { paymentStatus: PAYMENT_STATUS.PAID, updatedAt: new Date() } });
      return buildResponse(200, { orderId, paymentStatus: PAYMENT_STATUS.PAID });
    }

    return createErrorResponse(404, "Route not found");
  } catch (error) {
    return createErrorResponse(500, "Unexpected payments service error", error.message);
  }
};
