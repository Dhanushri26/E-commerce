import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getOrders,
  getOrderById,
  createOrder,
  cancelOrder,
  updateOrder
} from "../api/orders";
import api from "../api/axios";

// Mock the axios instance
vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe("orders API service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getOrders: fetches all orders list", async () => {
    const mockOrders = { orders: [{ orderId: "o1", totalAmount: 150 }] };
    api.get.mockResolvedValue({ data: mockOrders });

    const result = await getOrders();

    expect(api.get).toHaveBeenCalledWith("/orders");
    expect(result).toEqual(mockOrders);
  });

  it("getOrderById: fetches details of a specific order", async () => {
    const mockOrder = { orderId: "o1", totalAmount: 150, items: [] };
    api.get.mockResolvedValue({ data: mockOrder });

    const result = await getOrderById("o1");

    expect(api.get).toHaveBeenCalledWith("/orders/o1");
    expect(result).toEqual(mockOrder);
  });

  it("createOrder: submits order creation with idempotency key header", async () => {
    const payload = { notes: "Leave at door" };
    const mockCreated = { order: { orderId: "o2", totalAmount: 99 } };
    api.post.mockResolvedValue({ data: mockCreated });

    const result = await createOrder(payload);

    expect(api.post).toHaveBeenCalledWith(
      "/orders",
      payload,
      expect.objectContaining({
        headers: expect.objectContaining({
          "Idempotency-Key": expect.any(String),
        }),
      })
    );
    expect(result).toEqual(mockCreated);
  });

  it("cancelOrder: cancels order and updates status", async () => {
    const mockResponse = { message: "Order cancelled successfully" };
    api.put.mockResolvedValue({ data: mockResponse });

    const result = await cancelOrder("o1");

    expect(api.put).toHaveBeenCalledWith("/orders/o1/cancel");
    expect(result).toEqual(mockResponse);
  });

  it("updateOrder: updates order metadata", async () => {
    const payload = { notes: "Updated instructions" };
    const mockResponse = { success: true };
    api.put.mockResolvedValue({ data: mockResponse });

    const result = await updateOrder("o1", payload);

    expect(api.put).toHaveBeenCalledWith("/orders/o1", payload);
    expect(result).toEqual(mockResponse);
  });
});
