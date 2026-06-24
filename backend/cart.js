import {
  buildResponse,
  createErrorResponse,
  createAuditFields,
  extractUserContext,
  getCollection,
  getPathParam,
  parseJsonBody,
  updateAuditFields,
} from "./shared.js";

const getCartPartition = (userContext) => {
  if (userContext.isBusiness && userContext.businessId) {
    return `CART#${userContext.businessId}`;
  }
  return `CART#${userContext.userId}`;
};

const normalizeQuantity = (value) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizePrice = (value) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const canReadCart = (userContext) => Boolean(userContext?.isAuthenticated);
const canModifyCart = (userContext) => Boolean(userContext?.isAuthenticated);
const canAccessItem = (userContext, item) => {
  if (!item) {
    return false;
  }

  if (userContext.isAdmin) {
    return true;
  }

  if (userContext.isBusiness && userContext.businessId) {
    return item.businessId === userContext.businessId;
  }

  return item.ownerId === userContext.userId;
};

const getActiveCartItemFilter = (cartPartition, productId = null) => {
  const filter = {
    PK: cartPartition,
    SK: { $regex: /^ITEM#/ },
    isDeleted: { $ne: true },
  };

  if (productId) {
    filter.SK = `ITEM#${productId}`;
  }

  return filter;
};

const getProductDocument = async (coll, productId) => {
  if (!productId) {
    return null;
  }

  return coll.findOne({ PK: `PRODUCT#${productId}`, SK: "METADATA", isDeleted: { $ne: true } }, { projection: { _id: 0 } });
};

const getInventoryDocument = async (coll, productId) => {
  if (!productId) {
    return null;
  }

  return coll.findOne({ PK: `INVENTORY#${productId}`, SK: "STOCK", isDeleted: { $ne: true } }, { projection: { _id: 0 } });
};

const isProductCartEligible = (product) => {
  if (!product) {
    return false;
  }

  if (product.isDeleted || product.is_deleted || product.deletedAt) {
    return false;
  }

  const isActive = product.isActive ?? product.is_active;
  if (isActive === false) {
    return false;
  }

  return true;
};

const resolveUnitPrice = (product, userContext) => {
  if (!product) {
    return 0;
  }

  const businessPrice = product.b2bPrice ?? product.businessPrice ?? product.customPrice ?? product.price ?? product.msrp;
  const customerPrice = product.unitPrice ?? product.price ?? product.msrp;
  return normalizePrice(userContext.isBusiness ? businessPrice : customerPrice);
};

const buildCartItemResponse = (item) => ({
  ...item,
  quantity: Number(item.quantity ?? 0),
  unitPrice: Number(item.unitPrice ?? 0),
  subtotal: Number(item.subtotal ?? 0),
});

const calculateCartTotals = (items, userContext) => {
  const itemCount = items.reduce((total, item) => total + Number(item.quantity || 0), 0);
  const subtotal = items.reduce((total, item) => total + Number(item.subtotal || 0), 0);
  const estimatedTax = userContext.taxExempt ? 0 : subtotal * 0.08;
  return {
    itemCount,
    subtotal,
    estimatedTax,
    grandTotal: subtotal + estimatedTax,
  };
};

const upsertCartItem = async (coll, userContext, product, quantity, cartPartition) => {
  const unitPrice = resolveUnitPrice(product, userContext);
  const normalizedQuantity = Math.max(1, Math.round(quantity));
  const subtotal = unitPrice * normalizedQuantity;
  const now = new Date();
  const itemPayload = {
    PK: cartPartition,
    SK: `ITEM#${product.productId || product.product_id}`,
    cartId: cartPartition,
    productId: product.productId || product.product_id,
    productTitle: product.title || product.productTitle || product.name || null,
    productSku: product.sku || product.productSku || null,
    quantity: normalizedQuantity,
    unitPrice,
    subtotal,
    ownerId: userContext.userId,
    businessId: userContext.businessId || null,
    savedForLater: false,
    wishlistTransferEligible: false,
    couponCode: null,
    promotionId: null,
    pricingTier: null,
    pricingSource: userContext.isBusiness ? "business" : "standard",
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    ...createAuditFields(userContext.userId),
  };

  await coll.updateOne(
    { PK: cartPartition, SK: itemPayload.SK },
    { $set: itemPayload },
    { upsert: true }
  );

  return buildCartItemResponse(itemPayload);
};

export const handler = async (event) => {
  try {
    const method = event?.httpMethod || event?.requestContext?.httpMethod;
    const path = event?.rawPath || event?.path || "";
    const userContext = extractUserContext(event);

    if (method === "GET" && path === "/cart") {
      if (!canReadCart(userContext)) {
        return createErrorResponse(403, "Authentication required");
      }

      const coll = await getCollection();
      const cartPartition = getCartPartition(userContext);
      const items = await coll.find(getActiveCartItemFilter(cartPartition)).project({ _id: 0 }).sort({ createdAt: 1 }).toArray();
      return buildResponse(200, { cartId: cartPartition, items: items.map(buildCartItemResponse) });
    }

    if (method === "GET" && path === "/cart/summary") {
      if (!canReadCart(userContext)) {
        return createErrorResponse(403, "Authentication required");
      }

      const coll = await getCollection();
      const cartPartition = getCartPartition(userContext);
      const items = await coll.find(getActiveCartItemFilter(cartPartition)).project({ _id: 0 }).sort({ createdAt: 1 }).toArray();
      return buildResponse(200, { cartId: cartPartition, ...calculateCartTotals(items, userContext) });
    }

    if (method === "POST" && path === "/cart/items") {
      if (!canModifyCart(userContext)) {
        return createErrorResponse(403, "Authentication required");
      }

      const body = parseJsonBody(event);
      const productId = body.productId || body.product_id;
      const quantity = normalizeQuantity(body.quantity ?? body.qty ?? 1);
      if (!productId || !Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
        return createErrorResponse(422, "productId and a positive integer quantity are required");
      }

      const coll = await getCollection();
      const product = await getProductDocument(coll, productId);
      if (!product) {
        return createErrorResponse(404, "Product not found");
      }

      if (!isProductCartEligible(product)) {
        return createErrorResponse(409, "Product is not available for cart placement");
      }

      if (userContext.isCustomer && product.isB2BOnly) {
        return createErrorResponse(403, "B2B-only products are not available to standard customers");
      }

      const inventory = await getInventoryDocument(coll, productId);
      if (!inventory || normalizeQuantity(inventory.availableQuantity ?? inventory.available_quantity ?? 0) < quantity) {
        return createErrorResponse(409, "Insufficient inventory available");
      }

      const cartPartition = getCartPartition(userContext);
      const item = await coll.findOne(getActiveCartItemFilter(cartPartition, productId), { projection: { _id: 0 } });
      const nextQuantity = item ? Number(item.quantity || 0) + quantity : quantity;

      const itemPayload = {
        PK: cartPartition,
        SK: `ITEM#${productId}`,
        cartId: cartPartition,
        productId,
        productTitle: product.title || product.productTitle || product.name || null,
        productSku: product.sku || product.productSku || null,
        quantity: nextQuantity,
        unitPrice: resolveUnitPrice(product, userContext),
        subtotal: resolveUnitPrice(product, userContext) * nextQuantity,
        ownerId: userContext.userId,
        businessId: userContext.businessId || null,
        savedForLater: false,
        wishlistTransferEligible: false,
        couponCode: null,
        promotionId: null,
        pricingTier: null,
        pricingSource: userContext.isBusiness ? "business" : "standard",
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        createdAt: item?.createdAt || new Date(),
        updatedAt: new Date(),
        ...updateAuditFields(userContext.userId),
      };

      await coll.updateOne(
        { PK: cartPartition, SK: `ITEM#${productId}` },
        { $set: itemPayload },
        { upsert: true }
      );

      return buildResponse(201, buildCartItemResponse(itemPayload));
    }

    if (method === "PUT" && path.startsWith("/cart/items/")) {
      if (!canModifyCart(userContext)) {
        return createErrorResponse(403, "Authentication required");
      }

      const productId = getPathParam(event, 2);
      if (!productId) {
        return createErrorResponse(400, "productId is required");
      }

      const body = parseJsonBody(event);
      const quantity = normalizeQuantity(body.quantity ?? body.qty ?? 0);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return createErrorResponse(422, "quantity must be a positive integer");
      }

      const coll = await getCollection();
      const cartPartition = getCartPartition(userContext);
      const existingItem = await coll.findOne({ PK: cartPartition, SK: `ITEM#${productId}`, isDeleted: { $ne: true } }, { projection: { _id: 0 } });
      if (!existingItem) {
        return createErrorResponse(404, "Cart item not found");
      }

      if (!canAccessItem(userContext, existingItem)) {
        return createErrorResponse(403, "Access denied");
      }

      const product = await getProductDocument(coll, productId);
      if (!product || !isProductCartEligible(product)) {
        return createErrorResponse(409, "Product is not available for cart placement");
      }

      const inventory = await getInventoryDocument(coll, productId);
      if (!inventory || normalizeQuantity(inventory.availableQuantity ?? inventory.available_quantity ?? 0) < quantity) {
        return createErrorResponse(409, "Insufficient inventory available");
      }

      const unitPrice = resolveUnitPrice(product, userContext);
      const itemPayload = {
        ...existingItem,
        quantity,
        unitPrice,
        subtotal: unitPrice * quantity,
        updatedAt: new Date(),
        ...updateAuditFields(userContext.userId),
      };

      await coll.updateOne({ PK: cartPartition, SK: `ITEM#${productId}` }, { $set: itemPayload });
      return buildResponse(200, buildCartItemResponse(itemPayload));
    }

    if (method === "DELETE" && path.startsWith("/cart/items/")) {
      if (!canModifyCart(userContext)) {
        return createErrorResponse(403, "Authentication required");
      }

      const productId = getPathParam(event, 2);
      if (!productId) {
        return createErrorResponse(400, "productId is required");
      }

      const coll = await getCollection();
      const cartPartition = getCartPartition(userContext);
      const existingItem = await coll.findOne({ PK: cartPartition, SK: `ITEM#${productId}` }, { projection: { _id: 0 } });
      if (!existingItem) {
        return createErrorResponse(404, "Cart item not found");
      }

      if (!canAccessItem(userContext, existingItem)) {
        return createErrorResponse(403, "Access denied");
      }

      await coll.updateOne(
        { PK: cartPartition, SK: `ITEM#${productId}` },
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

      return buildResponse(200, { message: "Cart item removed" });
    }

    if (method === "DELETE" && path === "/cart/clear") {
      if (!canModifyCart(userContext)) {
        return createErrorResponse(403, "Authentication required");
      }

      const coll = await getCollection();
      const cartPartition = getCartPartition(userContext);
      await coll.updateMany(
        getActiveCartItemFilter(cartPartition),
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

      return buildResponse(200, { message: "Cart cleared" });
    }

    if (method === "POST" && path === "/cart/bulk-import") {
      if (!userContext.isBusiness && !userContext.isAdmin) {
        return createErrorResponse(403, "Only organizations or admins may use bulk import");
      }

      const body = parseJsonBody(event);
      const items = Array.isArray(body.items) ? body.items : [];
      if (items.length === 0) {
        return createErrorResponse(422, "items array is required");
      }

      const coll = await getCollection();
      const cartPartition = getCartPartition(userContext);
      let importedCount = 0;

      for (const item of items) {
        const productId = item.productId || item.product_id;
        const quantity = normalizeQuantity(item.quantity ?? item.qty ?? 1);
        if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
          continue;
        }

        const product = await getProductDocument(coll, productId);
        if (!product || !isProductCartEligible(product)) {
          continue;
        }

        if (userContext.isCustomer && product.isB2BOnly) {
          continue;
        }

        const inventory = await getInventoryDocument(coll, productId);
        if (!inventory || normalizeQuantity(inventory.availableQuantity ?? inventory.available_quantity ?? 0) < quantity) {
          continue;
        }

        const existingItem = await coll.findOne(getActiveCartItemFilter(cartPartition, productId), { projection: { _id: 0 } });
        const nextQuantity = existingItem ? Number(existingItem.quantity || 0) + quantity : quantity;
        const unitPrice = resolveUnitPrice(product, userContext);
        const itemPayload = {
          PK: cartPartition,
          SK: `ITEM#${productId}`,
          cartId: cartPartition,
          productId,
          productTitle: product.title || product.productTitle || product.name || null,
          productSku: product.sku || product.productSku || null,
          quantity: nextQuantity,
          unitPrice,
          subtotal: unitPrice * nextQuantity,
          ownerId: userContext.userId,
          businessId: userContext.businessId || null,
          savedForLater: false,
          wishlistTransferEligible: false,
          couponCode: null,
          promotionId: null,
          pricingTier: null,
          pricingSource: userContext.isBusiness ? "business" : "standard",
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          createdAt: existingItem?.createdAt || new Date(),
          updatedAt: new Date(),
          ...createAuditFields(userContext.userId),
        };

        await coll.updateOne({ PK: cartPartition, SK: `ITEM#${productId}` }, { $set: itemPayload }, { upsert: true });
        importedCount += 1;
      }

      return buildResponse(201, { imported: importedCount, cartId: cartPartition });
    }

    return createErrorResponse(404, "Route not found");
  } catch (error) {
    return createErrorResponse(500, "Unexpected cart service error", error.message);
  }
};
