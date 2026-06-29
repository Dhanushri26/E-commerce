# 💎 JewelCart Backend

Backend for the **JewelCart** e-commerce application built with **Node.js** and **Express.js**. This project follows a simple service-based structure where each module handles a specific business domain such as products, orders, customers, inventory, payments, and cart management.

> **Note:** This repository currently contains only the backend implementation. Frontend and complete microservices separation will be added in future updates.

---

## 📂 Project Structure

```text 
backend/
├── node_modules/
├── .env
├── .gitignore
├── cart.js
├── customers.js
├── inventory.js
├── orders.js
├── payments.js
├── products.js
├── server.js
├── shared.js
├── package.json
└── package-lock.json
```

### File Description

| File           | Description                                                                          |
| -------------- | ------------------------------------------------------------------------------------ |
| `server.js`    | Main entry point of the application. Starts the Express server and registers routes. |
| `products.js`  | Product-related APIs and logic.                                                      |
| `customers.js` | Customer management APIs.                                                            |
| `cart.js`      | Shopping cart operations.                                                            |
| `orders.js`    | Order creation and management.                                                       |
| `payments.js`  | Payment-related endpoints.                                                           |
| `inventory.js` | Inventory and stock management.                                                      |
| `shared.js`    | Shared utilities or common functions used across modules.                            |
| `.env`         | Environment variables.                                                               |

---

## 🚀 Technologies Used

* Node.js
* Express.js
* JavaScript
* dotenv

---

## 📦 Installation

Clone the repository:

```bash
git clone <repository-url>
```

Move into the project directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

---

## ⚙️ Environment Variables

Create a `.env` file inside the `backend` directory.

Example:

```env
PORT=3000
```

Add any additional variables required by your application.

---

## 📌 Current Modules

* Product Management
* Customer Management
* Shopping Cart
* Orders
* Payments
* Inventory

---

## 🔮 Future Improvements

* Authentication and Authorization
* Database Integration
* API Documentation
* Docker Support
* Complete Microservices Architecture
* Frontend Integration

---

## 👨‍💻 Author

Developed as part of the **JewelCart** project using **Node.js**.

---

## 📄 License

This project is intended for learning and development purposes.

----------------------------

## 🌐 API Overview

The backend currently exposes RESTful APIs for the following modules.

### Health

| Method | Endpoint  | Description          |
| ------ | --------- | -------------------- |
| GET    | `/health` | Check backend status |

---

### Products

| Method | Endpoint               | Description          |
| ------ | ---------------------- | -------------------- |
| GET    | `/products`            | Get all products     |
| GET    | `/products/:productId` | Get a product by ID  |
| POST   | `/products`            | Create a new product |

---

### Cart

| Method | Endpoint                 | Description               |
| ------ | ------------------------ | ------------------------- |
| GET    | `/cart`                  | Get current user's cart   |
| GET    | `/cart/summary`          | Get cart summary          |
| POST   | `/cart/items`            | Add item to cart          |
| PUT    | `/cart/items/:productId` | Update cart item quantity |
| DELETE | `/cart/items/:productId` | Remove item from cart     |
| DELETE | `/cart/clear`            | Clear cart                |
| POST   | `/cart/bulk-import`      | Bulk import cart items    |

---

### Orders

| Method | Endpoint                  | Description        |
| ------ | ------------------------- | ------------------ |
| GET    | `/orders`                 | Get all orders     |
| GET    | `/orders/:orderId`        | Get order details  |
| POST   | `/orders`                 | Create a new order |
| PUT    | `/orders/:orderId/cancel` | Cancel an order    |

---

### Inventory

| Method | Endpoint                | Description                  |
| ------ | ----------------------- | ---------------------------- |
| GET    | `/inventory`            | View inventory               |
| GET    | `/inventory/:productId` | View inventory for a product |
| POST   | `/inventory`            | Add inventory record         |
| PATCH  | `/inventory/reserve`    | Reserve product stock        |

---

### Payments

| Method | Endpoint              | Description              |
| ------ | --------------------- | ------------------------ |
| GET    | `/payments`           | List payments            |
| POST   | `/payments`           | Create payment           |
| POST   | `/payments/intent`    | Create payment intent    |
| POST   | `/payments/verify`    | Verify payment           |
| POST   | `/payments/capture`   | Capture payment          |
| POST   | `/payments/refund`    | Refund payment           |
| POST   | `/payments/cancel`    | Cancel payment           |
| POST   | `/payments/po-verify` | Verify purchase order    |
| POST   | `/payments/webhook`   | Payment provider webhook |

---

## ⚠️ Error Responses

The API uses standard HTTP status codes.

| Status Code | Meaning                   |
| ----------- | ------------------------- |
| 200         | Request successful        |
| 201         | Resource created          |
| 400         | Bad request               |
| 403         | Unauthorized or forbidden |
| 404         | Resource not found        |
| 409         | Conflict                  |
| 422         | Validation failed         |

---

## 📝 Notes

* Responses are returned in **JSON** format.
* Configuration values are stored in the `.env` file.
* Some endpoints require authentication or admin privileges.
* This project currently contains the backend implementation only. Frontend integration and further modularization will be added in future updates.
