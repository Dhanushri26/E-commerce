# 🛒 ShopSphere Storefront Frontend

The frontend for the **ShopSphere** modern e-commerce platform. Built with **React**, **Vite**, **React Router v7**, **Tailwind CSS v4**, and **TanStack React Query**, fully integrated with AWS Cognito and API Gateway microservices.

---

## 🎨 Design System & Aesthetic
- **Indigo & Slate Theme:** Clean, neutral palette with vibrant highlights (Success: Emerald, Warning: Amber, Error: Red, Primary Accent: Indigo).
- **Responsive Layouts:** Seamless support for Desktop, Tablet, and Mobile viewport sizes without layout shifts.
- **Rich Visuals:** Rounded cards, dynamic hover micro-animations, custom scrollbars, and premium loading skeletons.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
```bash
npm install
```

### Run Locally (Development Mode)
```bash
npm run dev
```
The server will boot up locally at `http://localhost:5173`.

### Production Build
To build the production bundle:
```bash
npm run build
```
This generates the optimized, production-ready bundle inside the `dist/` directory.

### Run Unit Tests
To run Vitest verification suite:
```bash
npm test
```

---

## 📂 Architecture & Directory Details
- `/src/api/` — API clients & Axios interceptors with Cognito token authorization headers injection.
- `/src/components/` — Reusable components (`ProductCard`, `SearchBar`, etc.) and subfolders for UI elements & Admin panels.
- `/src/context/` — Context API logic managing global cart, wishlist, orders, user authentication session states.
- `/src/pages/` — Page level routing views (Home, Products, Details, Cart, Checkout, Profile, Wishlist, Admin).
- `/src/routes/` — Application routing definitions (`AppRoutes.jsx`).
- `/src/index.css` — Global CSS styling rules, custom animations, custom scrollbars, and Tailwind configuration.

---

## 📋 Technology Integrations
- **AWS Cognito Auth:** Fully integrated using `@aws-amplify/auth` v6.
- **REST APIs:** Axios client configured with CORS credentials proxy handles requests to Lambda endpoints.
- **State Caching:** TanStack React Query handles network caches efficiently.
