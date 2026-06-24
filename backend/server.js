import http from "node:http";
import dotenv from "dotenv";

import { handler as productsHandler } from "./products.js";
import { handler as inventoryHandler } from "./inventory.js";
import { handler as cartHandler } from "./cart.js";
import { handler as ordersHandler } from "./orders.js";
import { handler as paymentsHandler } from "./payments.js";
dotenv.config();
const PORT = Number(process.env.PORT || 3000);
const HANDLERS = [
  { prefix: "/products", handler: productsHandler },
  { prefix: "/inventory", handler: inventoryHandler },
  { prefix: "/cart", handler: cartHandler },
  { prefix: "/orders", handler: ordersHandler },
  { prefix: "/payments", handler: paymentsHandler },
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

  const matchedHandler = HANDLERS.find((entry) => path.startsWith(entry.prefix));
  if (!matchedHandler) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Route not found" }));
    return;
  }

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
        "cognito:groups": "Customer"
      },
    },
  },
},
  };

  try {
    const response = await matchedHandler.handler(event);
    res.writeHead(response.statusCode || 200, { "Content-Type": "application/json" });
    res.end(response.body || JSON.stringify(response));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`JewelCart backend listening on http://127.0.0.1:${PORT}`);
});
