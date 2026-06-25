import { randomUUID } from "node:crypto";
import { MongoClient } from "mongodb";

let mongoClient = null;
let collection = null;
export const getCollection = async () => {
  console.log("getCollection called");

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;
  const collName = process.env.MONGODB_COLLECTION_NAME;

  console.log({
    uriExists: !!uri,
    dbName,
    collName,
  });

  try {
    if (!mongoClient) {
      console.log("Creating MongoClient");

      mongoClient = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      });

      console.log("Connecting...");
      await mongoClient.connect();
      console.log("Connected successfully");
    }

    const db = mongoClient.db(dbName);
    collection = db.collection(collName);

    return collection;
  } catch (err) {
    console.error("Mongo connection failed:", err);

    mongoClient = null;
    collection = null;

    throw err;
  }
};

const getHeaderValue = (event, headerNames) => {
  const headers = event?.headers || {};

  for (const headerName of headerNames) {
    const value = headers[headerName];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  const normalizedHeaders = Object.entries(headers).reduce((acc, [key, value]) => {
    acc[key.toLowerCase()] = value;
    return acc;
  }, {});

  for (const headerName of headerNames) {
    const value = normalizedHeaders[headerName.toLowerCase()];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const normalizeRoleName = (value) => String(value || "").trim().toLowerCase();

const deriveRoles = (groups = []) => {
  const normalizedGroups = groups
    .map((group) => String(group).trim())
    .filter(Boolean);

  const isAdmin = normalizedGroups.some((group) => normalizeRoleName(group) === normalizeRoleName(ROLES.ADMIN));
  const isBusiness = normalizedGroups.some((group) => normalizeRoleName(group) === normalizeRoleName(ROLES.BUSINESS));
  const isCustomer = normalizedGroups.some((group) => normalizeRoleName(group) === normalizeRoleName(ROLES.CUSTOMER)) || (!isAdmin && !isBusiness);

  return {
    groups: normalizedGroups,
    isAdmin,
    isBusiness,
    isCustomer,
  };
};


export const extractUserContext = (event) => {
  const claims = event?.requestContext?.authorizer?.jwt?.claims || {};
  const roleHeader = getHeaderValue(event, ["x-role", "x-user-role"]);

  if (roleHeader) {
    const rawGroups = roleHeader.split(",");
    const normalizedGroups = rawGroups
      .map((group) => String(group).trim())
      .filter(Boolean);

    const isAdmin = normalizedGroups.some((group) => normalizeRoleName(group) === normalizeRoleName(ROLES.ADMIN));
    const isBusiness = normalizedGroups.some((group) => normalizeRoleName(group) === normalizeRoleName(ROLES.BUSINESS));
    const isCustomer = normalizedGroups.some((group) => normalizeRoleName(group) === normalizeRoleName(ROLES.CUSTOMER)) || (!isAdmin && !isBusiness);

    return {
      userId: claims.sub || claims.username || "local-user",
      groups: normalizedGroups,
      businessId:
        claims["custom:business_id"] ||
        claims.business_id ||
        getHeaderValue(event, ["x-business-id"]) ||
        null,
      isAuthenticated: true,
      isAdmin,
      isBusiness,
      isCustomer,
      taxExempt:
        claims["custom:tax_exempt"] === "true" ||
        claims.tax_exempt === "true",
      creditLimit: Number(
        claims["custom:credit_limit"] ||
        claims.credit_limit ||
        0
      ),
    };
  }

  if (process.env.NODE_ENV === "development") {
    return {
      userId: "local-user",
      groups: [],
      businessId: null,
      isAuthenticated: true,
      isAdmin: false,
      isBusiness: false,
      isCustomer: true,
      taxExempt: false,
      creditLimit: 0,
    };
  }

  const rawGroups = claims["cognito:groups"] || claims.groups || [];

  const groups = Array.isArray(rawGroups)
    ? rawGroups
    : typeof rawGroups === "string"
      ? rawGroups.split(",")
      : [];

  const normalizedGroups = groups.map((group) =>
    String(group).trim()
  );

  const isAdmin = normalizedGroups.some((group) => normalizeRoleName(group) === normalizeRoleName(ROLES.ADMIN));
  const isBusiness = normalizedGroups.some((group) => normalizeRoleName(group) === normalizeRoleName(ROLES.BUSINESS));
  const isCustomer = normalizedGroups.some((group) => normalizeRoleName(group) === normalizeRoleName(ROLES.CUSTOMER)) || (!isAdmin && !isBusiness);

  return {
    userId: claims.sub || claims.username || "anonymous",
    groups: normalizedGroups,
    businessId:
      claims["custom:business_id"] ||
      claims.business_id ||
      null,
    isAuthenticated:
      Boolean(claims.sub || claims.username),
    isAdmin,
    isBusiness,
    isCustomer,
    taxExempt:
      claims["custom:tax_exempt"] === "true" ||
      claims.tax_exempt === "true",
    creditLimit: Number(
      claims["custom:credit_limit"] ||
      claims.credit_limit ||
      0
    ),
  };
};

export const parseJsonBody = (event) => {
  if (!event?.body) {
    return {};
  }

  if (typeof event.body === "object") {
    return event.body;
  }

  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
};

export const getPathParam = (event, index) => {
  const rawPath = event?.rawPath || event?.path || "";
  const segments = rawPath.split("/").filter(Boolean);
  return segments[index] || null;
};

export const parseIdempotencyKey = (event) => {
  return event?.headers?.["X-Idempotency-Key"] || event?.headers?.["x-idempotency-key"] || null;
};

export const checkOrAcquireLock = async (idempotencyKey, context) => {
  if (!idempotencyKey) {
    return { acquired: true, existing: null };
  }

  const coll = await getCollection();
  const pk = `IDEMPOTENCY#${idempotencyKey}`;
  const lockDoc = {
    PK: pk,
    SK: "LOCK",
    status: "PROCESSING",
    ttl: new Date(Date.now() + 5 * 60 * 1000),
    createdAt: new Date(),
    ownerId: context?.userId || "anonymous",
  };

  try {
    await coll.insertOne(lockDoc);
    return { acquired: true, existing: null };
  } catch (error) {
    if (error?.code === 11000) {
      const existing = await coll.findOne({ PK: pk, SK: "LOCK" });
      return { acquired: false, existing };
    }
    throw error;
  }
};

export const releaseOrResolveLock = async (idempotencyKey, responsePayload) => {
  if (!idempotencyKey) {
    return;
  }

  const coll = await getCollection();
  const pk = `IDEMPOTENCY#${idempotencyKey}`;
  await coll.updateOne(
    { PK: pk, SK: "LOCK" },
    {
      $set: {
        status: "COMPLETED",
        responseBody: responsePayload,
        ttl: new Date(Date.now() + 5 * 60 * 1000),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
};

export const buildResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(body),
});

export const createErrorResponse = (statusCode, message, details = null) =>
  buildResponse(statusCode, {
    error: message,
    ...(details ? { details } : {}),
  });

  export const ORDER_STATUS = Object.freeze({
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PENDING_MANAGEMENT_APPROVAL: "PENDING_MANAGEMENT_APPROVAL",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
});

export const ORDER_SOURCES = Object.freeze({
  B2C: "B2C",
  B2B: "B2B",
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: "PENDING",
  AUTHORIZED: "AUTHORIZED",
  CAPTURED: "CAPTURED",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
  CANCELLED: "CANCELLED",
});

export const ROLES = {
    ADMIN: "Admin",
    BUSINESS: "Business",
    CUSTOMER: "Customer",
  };
  
  export const ENTITY_TYPES = {
    PRODUCT: "PRODUCT",
    CUSTOMER: "CUSTOMER",
    CART: "CART",
    ORDER: "ORDER",
    PAYMENT: "PAYMENT",
  };
  
  export const generateId = () => randomUUID();
  
  export const createAuditFields = (userId) => ({
    createdBy: userId,
    updatedBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  export const updateAuditFields = (userId) => ({
    updatedBy: userId,
    updatedAt: new Date(),
  });



  export const hasRole = (context, role) => {
    switch (role) {
      case ROLES.ADMIN:
        return context?.isAdmin;
  
      case ROLES.BUSINESS:
        return context?.isBusiness;
  
      case ROLES.CUSTOMER:
        return context?.isCustomer;
  
      default:
        return false;
    }
  };
  
  export const authorize = (
    context,
    allowedRoles = []
  ) => {
    return allowedRoles.some((role) =>
      hasRole(context, role)
    );
  };