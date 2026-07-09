import api from "./axios";

export const addCartItem = (data) =>
  api.post("/cart/items", data);

export const getCartItems = () =>
  api.get("/cart/items");

export const updateCartItem = (id, data) =>
  api.patch(`/cart/items/${id}`, data);

export const deleteCartItem = (id) =>
  api.delete(`/cart/items/${id}`);