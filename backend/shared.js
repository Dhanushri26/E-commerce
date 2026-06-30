import { randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";


let docClientInstance = null;

export const getDbClient = () => {
  if (!docClientInstance) {
    const isLocal = process.env.IS_LOCAL === "true";
    
    const clientConfig = {
      region: process.env.AWS_REGION || "ap-southeast-1"
    };

    // Only inject local endpoints if explicitly testing offline
    if (isLocal) {
      clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT || "http://localhost:8000";
      clientConfig.credentials = { accessKeyId: "local", secretAccessKey: "local" };
    }

    const client = new DynamoDBClient(clientConfig);
    docClientInstance = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true }
    });
  }

  return {
    docClient: docClientInstance,
    tableName: process.env.TABLE_NAME || "JewelCart"
  };
};
// ==========================================
// CONSTANTS & ENUMS (Unchanged)
// ==========================================
export const ROLES = Object.freeze({
  ADMIN: "Admin",
  BUSINESS: "Business",
  CUSTOMER: "Customer",
});

// ... Keep your other constants (ORDER_STATUS, PAYMENT_STATUS, etc.) exactly the same

// ==========================================
// STATELESS DYNAMODB CONNECTION (No Pool Management Required)
// ==========================================
let docClient = null;

export const getDbClient = () => {
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  if (!tableName) {
    throw new Error("Missing DYNAMODB_TABLE_NAME environment variable.");
  }

  if (!docClient) {
    // The AWS SDK automatically handles connection pooling and keep-alive optimization
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
    docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }

  return { docClient, tableName };
};

// ==========================================
// SERVERLESS IDEMPOTENCY LOCKS (Migrated to DynamoDB)
// ==========================================
export const checkOrAcquireLock = async (idempotencyKey, context) => {
  if (!idempotencyKey) {
    return { acquired: true, existing: null };
  }

  const { docClient, tableName } = getDbClient();
  const pk = `IDEMPOTENCY#${idempotencyKey}`;
  const sk = "LOCK";
  
  // Calculate epoch timestamp in seconds for DynamoDB's native TTL feature
  const ttlEpochSeconds = Math.floor((Date.now() + 5 * 60 * 1000) / 1000); 

  try {
    // ConditionExpression ensures atomic execution. If PK/SK exists, it fails safely.
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          PK: pk,
          SK: sk,
          status: "PROCESSING",
          ttl: ttlEpochSeconds, 
          createdAt: new Date().toISOString(),
          ownerId: context?.userId || "anonymous",
        },
        ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
      })
    );
    return { acquired: true, existing: null };
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      // Lock already exists, fetch it to return its current status/body
      const result = await docClient.send(
        new GetCommand({
          TableName: tableName,
          Key: { PK: pk, SK: sk },
        })
      );
      return { acquired: false, existing: result.Item || null };
    }
    throw error;
  }
};

export const releaseOrResolveLock = async (idempotencyKey, responsePayload) => {
  if (!idempotencyKey) return;

  const { docClient, tableName } = getDbClient();
  const pk = `IDEMPOTENCY#${idempotencyKey}`;
  const sk = "LOCK";
  const ttlEpochSeconds = Math.floor((Date.now() + 5 * 60 * 1000) / 1000);

  await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { PK: pk, SK: sk },
      UpdateExpression: "SET #status = :status, responseBody = :body, #ttl = :ttl, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#status": "status",
        "#ttl": "ttl",
      },
      ExpressionAttributeValues: {
        ":status": "COMPLETED",
        ":body": responsePayload,
        ":ttl": ttlEpochSeconds,
        ":updatedAt": new Date().toISOString(),
      },
    })
  );
};

// ... Keep your API Gateway mapping functions (parseJsonBody, buildResponse, extractUserContext) exactly the same