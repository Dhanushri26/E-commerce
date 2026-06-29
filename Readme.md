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

## ▶️ Running the Server

Start the application:

```bash
npm start
```

or, if configured:

```bash
npm run dev
```

The server will start on the port specified in the `.env` file.

---

## ⚙️ Environment Variables

Create a `.env` file inside the `backend` directory.

Example:

```env
PORT=5000
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
