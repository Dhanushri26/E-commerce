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
  ORDER_STATUS,
  ORDER_SOURCES,
  PAYMENT_STATUS,
  createAuditFields,
  updateAuditFields,
  ROLES,
} from "./shared.js";

const getCartPartition = (userContext) => {
  if (userContext.isBusiness && userContext.businessId) {
    return `CART#${userContext.businessId}`;
  }
  return `CART#${userContext.userId}`;
};

const getOrderOwnerPartition = (userContext) => {
  if (userContext.isBusiness && userContext.businessId) {
    return `BUSINESS#${userContext.businessId}`;
  }
  return `USER#${userContext.userId}`;
};

const activeOrderFilter = (extra = {}) => ({
  SK: "METADATA",
  isDeleted: { $ne: true },
  ...extra,
});

const isCancellableStatus = (status) =>
  [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PENDING_MANAGEMENT_APPROVAL].includes(status);

const canAccessOrder = (userContext, order) => {
  if (!order) {
    return false;
  }

  if (userContext.isAdmin) {
    return true;
  }

  if (userContext.isBusiness && userContext.businessId) {
    return order.businessId === userContext.businessId;
  }

  return order.userId === userContext.userId || order.ownerId === userContext.userId;
};

const buildOrderResponse = (order) => ({
  ...order,
  totalAmount: Number(order.totalAmount || 0),
});

const validationErrorResponse = (errors) => createErrorResponse(422, "Validation failed", { errors });

const writeOrderWithFallback = async (coll, writeOperation) => {
  if (typeof coll?.db?.client?.startSession !== "function") {
    return writeOperation(null);
  }

  const session = coll.db.client.startSession();
  try {
    return await session.withTransaction(async () => writeOperation(session));
  } catch (error) {
    const shouldFallback = process.env.NODE_ENV === "development" || /transaction|replica set|session|topology/i.test(error?.message || "");
    if (!shouldFallback) {
      throw error;
    }

    return writeOperation(null);
  } finally {
    await session.endSession();
  }
};

const getOrderMetadata = async (coll, orderId) => {
  if (!orderId) {
    return null;
  }

  return coll.findOne(activeOrderFilter({ PK: `ORDER#${orderId}` }), { projection: { _id: 0 } });
};

const listOrdersForContext = async (coll, userContext) => {
  if (userContext.isAdmin) {
    return coll.find(activeOrderFilter({ PK: { $regex: /^ORDER#/ } })).project({ _id: 0 }).toArray();
  }

  const partitionKey = userContext.isBusiness && userContext.businessId
    ? `BUSINESS#${userContext.businessId}`
    : `USER#${userContext.userId}`;

  const indexDocs = await coll.find({
    PK: partitionKey,
    SK: { $regex: /^ORDER#/ },
    isDeleted: { $ne: true },
  }).project({ _id: 0, orderId: 1, totalAmount: 1, orderStatus: 1 }).toArray();

  if (indexDocs.length === 0) {
    return [];
  }

  const orderIds = indexDocs.map((doc) => doc.orderId).filter(Boolean);
  const orders = await coll.find({
    PK: { $in: orderIds.map((id) => `ORDER#${id}`) },
    SK: "METADATA",
    isDeleted: { $ne: true },
  }).project({ _id: 0 }).toArray();

  return orders.sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
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
      const orders = await listOrdersForContext(coll, userContext);
      return buildResponse(200, { orders: orders.map(buildOrderResponse) });
    }

    if (method === "GET" && path.startsWith("/orders/")) {
      const orderId = getPathParam(event, 1);
      const isCancelRoute = path.split("/").filter(Boolean).length > 2 && path.endsWith("/cancel");
      if (!orderId || isCancelRoute) {
        if (!orderId) {
          return createErrorResponse(400, "Order id is required");
        }
      }

      const coll = await getCollection();
      const order = await getOrderMetadata(coll, orderId);
      if (!order) {
        return createErrorResponse(404, "Order not found");
      }

      if (!canAccessOrder(userContext, order)) {
        return createErrorResponse(403, "Access denied");
      }

      if (method === "GET") {
        return buildResponse(200, buildOrderResponse(order));
      }
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
        const cartPartition = getCartPartition(userContext);
        const cartItems = await coll.find({ PK: cartPartition }).project({ _id: 0 }).toArray();
        if (cartItems.length === 0) {
          return createErrorResponse(422, "Cart is empty");
        }

        const resolvedItems = [];
        for (const cartItem of cartItems) {
          const quantity = Number(cartItem.quantity || 0);
          if (!Number.isInteger(quantity) || quantity <= 0) {
            return createErrorResponse(422, "Each cart item must have a positive quantity");
          }

          const product = await coll.findOne({ PK: `PRODUCT#${cartItem.product_id}`, SK: "METADATA" }, { projection: { _id: 0 } });
          if (!product) {
            return createErrorResponse(404, `Product not found: ${cartItem.product_id}`);
          }

          const unitPrice = Number(product.msrp ?? cartItem.msrp ?? 0);
          if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
            return createErrorResponse(422, `Product price is invalid for ${cartItem.product_id}`);
          }

          resolvedItems.push({
            productId: cartItem.product_id,
            title: product.title || cartItem.title || "",
            quantity,
            unitPrice,
            lineTotal: Number((quantity * unitPrice).toFixed(2)),
          });
        }

        const totalAmount = Number(resolvedItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
        if (totalAmount <= 0) {
          return createErrorResponse(422, "Order total must be greater than zero");
        }

        const requestedOrderId = typeof body.orderId === "string" && body.orderId.trim() ? body.orderId.trim() : null;
        const orderId = requestedOrderId || randomUUID();
        const duplicateOrder = await getOrderMetadata(coll, orderId);
        if (duplicateOrder) {
          return createErrorResponse(409, "An order with this id already exists");
        }

        const approvalRequired = Boolean(body.approvalRequired) || (userContext.isBusiness && Number(userContext.creditLimit || 0) > 0 && totalAmount > Number(userContext.creditLimit || 0));
        const orderStatus = approvalRequired ? ORDER_STATUS.PENDING_MANAGEMENT_APPROVAL : ORDER_STATUS.PENDING_PAYMENT;
        const orderSource = userContext.isBusiness ? ORDER_SOURCES.B2B : ORDER_SOURCES.B2C;
        const orderDoc = {
          PK: `ORDER#${orderId}`,
          SK: "METADATA",
          orderId,
          userId: userContext.userId,
          ownerId: userContext.userId,
          businessId: userContext.businessId || null,
          items: resolvedItems,
          totalAmount,
          orderStatus,
          paymentStatus: PAYMENT_STATUS.PENDING,
          paymentId: null,
          orderSource,
          notes: typeof body.notes === "string" ? body.notes : "",
          tags: Array.isArray(body.tags) ? body.tags.filter((tag) => typeof tag === "string") : [],
          approvalRequired,
          approvedBy: null,
          approvedAt: null,
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          ...createAuditFields(userContext.userId),
        };

        const userOrderIndexDoc = {
          PK: `USER#${userContext.userId}`,
          SK: `ORDER#${orderId}`,
          orderId,
          totalAmount,
          orderStatus,
          isDeleted: false,
        };

        const businessOrderIndexDoc = userContext.isBusiness && userContext.businessId
          ? {
              PK: `BUSINESS#${userContext.businessId}`,
              SK: `ORDER#${orderId}`,
              orderId,
              totalAmount,
              orderStatus,
              isDeleted: false,
            }
          : null;

        await writeOrderWithFallback(coll, async (session) => {
          const writeOptions = session ? { session } : undefined;
          await coll.insertOne(orderDoc, writeOptions);
          await coll.insertOne(userOrderIndexDoc, writeOptions);
          if (businessOrderIndexDoc) {
            await coll.insertOne(businessOrderIndexDoc, writeOptions);
          }
          await coll.deleteMany({ PK: cartPartition }, writeOptions);
        });

        const responsePayload = { order: buildOrderResponse(orderDoc), userOrderIndex: userOrderIndexDoc, businessOrderIndex: businessOrderIndexDoc };
        await releaseOrResolveLock(idempotencyKey, responsePayload);
        return buildResponse(201, responsePayload);
      } catch (error) {
        await releaseOrResolveLock(idempotencyKey, { error: error.message });
        return createErrorResponse(500, "Failed to create order", error.message);
      }
    }

    if (method === "PUT" && path.startsWith("/orders/")) {
      const orderId = getPathParam(event, 1);
      const cancelRoute = path.split("/").filter(Boolean).length > 2 && path.endsWith("/cancel");
      if (!orderId) {
        return createErrorResponse(400, "Order id is required");
      }

      const coll = await getCollection();
      const order = await getOrderMetadata(coll, orderId);
      if (!order) {
        return createErrorResponse(404, "Order not found");
      }

      if (!canAccessOrder(userContext, order)) {
        return createErrorResponse(403, "Access denied");
      }

      if (cancelRoute) {
        if (!isCancellableStatus(order.orderStatus)) {
          return createErrorResponse(409, "Order cannot be cancelled at its current status");
        }

        const updatedOrder = {
          ...order,
          orderStatus: ORDER_STATUS.CANCELLED,
          paymentStatus: order.paymentStatus === PAYMENT_STATUS.PAID ? PAYMENT_STATUS.REFUNDED : order.paymentStatus || PAYMENT_STATUS.PENDING,
          updatedAt: new Date(),
          updatedBy: userContext.userId,
        };

        await coll.updateOne(
          { PK: `ORDER#${orderId}`, SK: "METADATA" },
          { $set: updatedOrder }
        );
        await coll.updateMany(
          { PK: { $in: [`USER#${order.userId || order.ownerId}`, ...(order.businessId ? [`BUSINESS#${order.businessId}`] : [])] }, SK: `ORDER#${orderId}` },
          { $set: {
            orderStatus: ORDER_STATUS.CANCELLED,
            updatedAt: new Date(),
          } }
        );

        return buildResponse(200, { order: buildOrderResponse(updatedOrder) });
      }

      const body = parseJsonBody(event);
      if (!body || Object.keys(body).length === 0) {
        return createErrorResponse(400, "At least one updatable field is required");
      }

      const updatePayload = {};
      if (body.notes !== undefined) {
        if (typeof body.notes !== "string") {
          return createErrorResponse(422, "notes must be a string");
        }
        updatePayload.notes = body.notes;
      }

      if (body.tags !== undefined) {
        if (!Array.isArray(body.tags)) {
          return createErrorResponse(422, "tags must be an array");
        }
        updatePayload.tags = body.tags.filter((tag) => typeof tag === "string");
      }

      if (body.orderSource !== undefined) {
        if (![ORDER_SOURCES.B2C, ORDER_SOURCES.B2B].includes(body.orderSource)) {
          return createErrorResponse(422, "orderSource must be B2C or B2B");
        }
        updatePayload.orderSource = body.orderSource;
      }

      if (body.approvalRequired !== undefined) {
        if (typeof body.approvalRequired !== "boolean") {
          return createErrorResponse(422, "approvalRequired must be a boolean");
        }
        updatePayload.approvalRequired = body.approvalRequired;
      }

      if (body.paymentStatus !== undefined) {
        if (typeof body.paymentStatus !== "string" || !body.paymentStatus.trim()) {
          return createErrorResponse(422, "paymentStatus must be a non-empty string");
        }
        updatePayload.paymentStatus = body.paymentStatus;
      }

      if (body.paymentId !== undefined) {
        updatePayload.paymentId = body.paymentId;
      }

      if (body.orderStatus !== undefined) {
        if (!userContext.isAdmin) {
          return createErrorResponse(403, "Only admins can update order status");
        }

        if (!Object.values(ORDER_STATUS).includes(body.orderStatus)) {
          return createErrorResponse(422, "orderStatus is invalid");
        }
        updatePayload.orderStatus = body.orderStatus;
      }

      if (Object.keys(updatePayload).length === 0) {
        return createErrorResponse(400, "At least one updatable field is required");
      }

      const updatedOrder = {
        ...order,
        ...updatePayload,
        ...updateAuditFields(userContext.userId),
      };

      await coll.updateOne(
        { PK: `ORDER#${orderId}`, SK: "METADATA" },
        { $set: updatedOrder }
      );

      await coll.updateMany(
        { PK: { $in: [`USER#${order.userId || order.ownerId}`, ...(order.businessId ? [`BUSINESS#${order.businessId}`] : [])] }, SK: `ORDER#${orderId}` },
        { $set: {
          orderStatus: updatedOrder.orderStatus,
          totalAmount: updatedOrder.totalAmount,
          updatedAt: updatedOrder.updatedAt,
        } }
      );

      return buildResponse(200, { order: buildOrderResponse(updatedOrder) });
    }

    if (method === "DELETE" && path.startsWith("/orders/")) {
      const orderId = getPathParam(event, 1);
      if (!orderId) {
        return createErrorResponse(400, "Order id is required");
      }

      const coll = await getCollection();
      const order = await getOrderMetadata(coll, orderId);
      if (!order) {
        return createErrorResponse(404, "Order not found");
      }

      if (!canAccessOrder(userContext, order)) {
        return createErrorResponse(403, "Access denied");
      }

      const softDeletedOrder = {
        ...order,
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userContext.userId,
        updatedAt: new Date(),
        updatedBy: userContext.userId,
      };

      await coll.updateOne(
        { PK: `ORDER#${orderId}`, SK: "METADATA" },
        { $set: softDeletedOrder }
      );
      await coll.updateMany(
        { PK: { $in: [`USER#${order.userId || order.ownerId}`, ...(order.businessId ? [`BUSINESS#${order.businessId}`] : [])] }, SK: `ORDER#${orderId}` },
        { $set: {
          isDeleted: true,
          deletedAt: softDeletedOrder.deletedAt,
          deletedBy: softDeletedOrder.deletedBy,
          updatedAt: softDeletedOrder.updatedAt,
        } }
      );

      return buildResponse(200, { order: buildOrderResponse(softDeletedOrder) });
    }

    return createErrorResponse(404, "Route not found");
  } catch (error) {
    return createErrorResponse(500, "Unexpected orders service error", error.message);
  }
};
