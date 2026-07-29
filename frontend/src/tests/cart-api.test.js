import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCartItems,
  getCartSummary,
  addCartItem,
  updateCartItem,
  deleteCartItem,
  clearCart,
  bulkImportCart
} from "../api/cart";
import api from "../api/axios";

// Mock the axios instance so we can test the service layer without real network calls.
vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("cart API service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getCartItems: fetches full cart items successfully", async () => {
    const mockData = { cartId: "CART#123", items: [{ productId: "p1", quantity: 2 }] };
    api.get.mockResolvedValue({ data: mockData });

    const result = await getCartItems();

    expect(api.get).toHaveBeenCalledWith("/cart");
    expect(result.data).toEqual(mockData);
  });

  it("getCartSummary: fetches cart summary totals successfully", async () => {
    const mockSummary = { itemCount: 2, subtotal: 100, grandTotal: 108 };
    api.get.mockResolvedValue({ data: mockSummary });

    const result = await getCartSummary();

    expect(api.get).toHaveBeenCalledWith("/cart/summary");
    expect(result.data).toEqual(mockSummary);
  });

  it("addCartItem: adds product item to cart", async () => {
    const payload = { productId: "p1", quantity: 1 };
    api.post.mockResolvedValue({ data: { success: true } });

    const result = await addCartItem(payload);

    expect(api.post).toHaveBeenCalledWith("/cart/items", payload);
    expect(result.data.success).toBe(true);
  });

  it("updateCartItem: updates quantity of cart item", async () => {
    const productId = "p1";
    const payload = { quantity: 5 };
    api.put.mockResolvedValue({ data: { success: true } });

    const result = await updateCartItem(productId, payload);

    expect(api.put).toHaveBeenCalledWith("/cart/items/p1", payload);
    expect(result.data.success).toBe(true);
  });

  it("deleteCartItem: removes product item from cart", async () => {
    const productId = "p1";
    api.delete.mockResolvedValue({ data: { success: true } });

    const result = await deleteCartItem(productId);

    expect(api.delete).toHaveBeenCalledWith("/cart/items/p1");
    expect(result.data.success).toBe(true);
  });

  it("clearCart: clears all items from cart", async () => {
    api.delete.mockResolvedValue({ data: { success: true } });

    const result = await clearCart();

    expect(api.delete).toHaveBeenCalledWith("/cart/clear");
    expect(result.data.success).toBe(true);
  });

  it("bulkImportCart: imports multiple items at once", async () => {
    const items = [
      { productId: "p1", quantity: 1 },
      { productId: "p2", quantity: 3 }
    ];
    api.post.mockResolvedValue({ data: { success: true } });

    const result = await bulkImportCart(items);

    expect(api.post).toHaveBeenCalledWith("/cart/bulk-import", { items });
    expect(result.data.success).toBe(true);
  });
});
