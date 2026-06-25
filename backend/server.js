import http from "node:http";
import dotenv from "dotenv";
import { randomUUID } from "node:crypto";

import { handler as productsHandler } from "./products.js";
import { handler as inventoryHandler } from "./inventory.js";
import { handler as cartHandler } from "./cart.js";
import { handler as ordersHandler } from "./orders.js";
import { handler as paymentsHandler } from "./payments.js";
import { handler as customersHandler } from "./customers.js";


dotenv.config();
const PORT = Number(process.env.PORT || 3000);
const HANDLERS = [
  { prefix: "/products", handler: productsHandler },
  { prefix: "/inventory", handler: inventoryHandler },
  { prefix: "/cart", handler: cartHandler },
  { prefix: "/orders", handler: ordersHandler },
  { prefix: "/payments", handler: paymentsHandler },
  { prefix: "/customers", handler: customersHandler },
];

const parseBody = async (req) => {
  if (req.method === "GET" || req.method === "HEAD") {
    return null;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
  const path = url.pathname;

  if (path === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "jewelcart-backend" }));
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods":
        "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    });
  
    return res.end();
  }

  const matchedHandler = HANDLERS.find((entry) => path.startsWith(entry.prefix));
  if (!matchedHandler) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Route not found" }));
    return;
  }

  const role =
  req.headers["x-role"] ||
  "Customer";
  const body = await parseBody(req);
  const event = {
    httpMethod: req.method,
    path,
    rawPath: path,
    headers: Object.fromEntries(Object.entries(req.headers).map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : value])),
    body: body === null ? null : typeof body === "string" ? body : JSON.stringify(body),
    queryStringParameters: Object.fromEntries(url.searchParams.entries()),
    requestContext: {
  httpMethod: req.method,
  authorizer: {
    jwt: {
      claims: {
        sub: "local-user-001",
        username: "local-user",
        "cognito:groups": role
      },
    },
  },
},
requestId: randomUUID(),
requestTime: new Date().toISOString(),
  };

  try {
    const response = await matchedHandler.handler(event);
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      ...(response.headers || {}),
    };
    res.writeHead(response.statusCode || 200, headers);
    res.end(typeof response.body === "string" ? response.body : JSON.stringify(response.body ?? response));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`JewelCart backend listening on http://127.0.0.1:${PORT}`);
});
