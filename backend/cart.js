import {
  buildResponse,
  createErrorResponse,
  extractUserContext,
  getCollection,
  parseJsonBody,
} from "./shared.js";

const getCartPartition = (userContext) => {
  if (userContext.isOrganization && userContext.businessId) {
    return `CART#${userContext.businessId}`;
  }
  return `CART#${userContext.userId}`;
};

export const handler = async (event) => {
  try {
    const method = event?.httpMethod || event?.requestContext?.httpMethod;
    const path = event?.rawPath || event?.path || "";
    const userContext = extractUserContext(event);

    if (method === "GET" && path === "/cart") {
      if (!userContext.isAuthenticated) {
        return createErrorResponse(403, "Authentication required");
      }

      const coll = await getCollection();
      const items = await coll.find({ PK: getCartPartition(userContext) }).project({ _id: 0 }).toArray();
      const enrichedItems = [];

      for (const item of items) {
        if (userContext.isOrganization || userContext.isAdmin) {
          const matchingProduct = await coll.findOne({ PK: `PRODUCT#${item.product_id}`, SK: "METADATA" }, { projection: { _id: 0 } });
          const tierDocs = await coll.find({ PK: `PRODUCT#${item.product_id}`, SK: { $regex: /^TIER#/ } }, { projection: { _id: 0 } }).toArray();
          const applicableTier = tierDocs
            .filter((tier) => Number(item.quantity) >= Number(tier.min_qty))
            .sort((a, b) => Number(b.min_qty) - Number(a.min_qty))[0];
          const unitPrice = applicableTier ? Number(applicableTier.custom_price) : Number(matchingProduct?.msrp || item.msrp || 0);
          enrichedItems.push({
            ...item,
            title: item.title || matchingProduct?.title,
            calculated_unit_price: unitPrice,
            subtotal: unitPrice * Number(item.quantity || 0),
          });
        } else {
          enrichedItems.push(item);
        }
      }

      return buildResponse(200, { items: enrichedItems });
    }

    if (method === "POST" && path === "/cart/items") {
      if (!userContext.isAuthenticated) {
        return createErrorResponse(403, "Authentication required");
      }

      const body = parseJsonBody(event);
      const productId = body.product_id;
      const quantity = Number(body.quantity || 1);
      if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
        return createErrorResponse(422, "product_id and positive quantity are required");
      }

      const coll = await getCollection();
      const product = await coll.findOne({ PK: `PRODUCT#${productId}`, SK: "METADATA" }, { projection: { _id: 0 } });
      if (!product) {
        return createErrorResponse(404, "Product not found");
      }

      if (userContext.isCustomer && product.is_b2b_only) {
        return createErrorResponse(403, "B2B-only products are not available to standard customers");
      }

      const cartItem = {
        PK: getCartPartition(userContext),
        SK: `ITEM#${productId}`,
        product_id: productId,
        quantity,
        msrp: product.msrp,
        title: product.title,
        createdAt: new Date(),
      };

      await coll.updateOne(
        { PK: cartItem.PK, SK: cartItem.SK },
        { $set: cartItem },
        { upsert: true }
      );

      return buildResponse(201, cartItem);
    }

    if (method === "POST" && path === "/cart/bulk-import") {
      if (!userContext.isOrganization) {
        return createErrorResponse(403, "Only organizations may use bulk import");
      }

      const body = parseJsonBody(event);
      const items = Array.isArray(body.items) ? body.items : [];
      if (items.length === 0) {
        return createErrorResponse(422, "items array is required");
      }

      const coll = await getCollection();
      const docs = items.map((item) => ({
        PK: getCartPartition(userContext),
        SK: `ITEM#${item.product_id}`,
        product_id: item.product_id,
        quantity: Number(item.quantity || 1),
        msrp: Number(item.msrp || 0),
        title: item.title,
        createdAt: new Date(),
      }));

      await coll.insertMany(docs);
      return buildResponse(201, { imported: docs.length });
    }

    return createErrorResponse(404, "Route not found");
  } catch (error) {
    return createErrorResponse(500, "Unexpected cart service error", error.message);
  }
};
