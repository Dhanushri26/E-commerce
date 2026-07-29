import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPayments,
  createPayment,
  createPaymentIntent,
  verifyPayment,
  capturePayment,
  refundPayment,
  cancelPayment,
  verifyPurchaseOrder,
  updatePayment
} from "../api/payments";
import api from "../api/axios";

// Mock the axios instance
vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe("payments API service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPayments: lists payments logs", async () => {
    const mockPayments = { payments: [{ paymentId: "pay1", amount: 100 }] };
    api.get.mockResolvedValue({ data: mockPayments });

    const result = await getPayments();

    expect(api.get).toHaveBeenCalledWith("/payments");
    expect(result).toEqual(mockPayments);
  });

  it("createPayment: creates a payment record", async () => {
    const payload = { orderId: "o1", amount: 100, currency: "INR", paymentMethod: "CARD" };
    const mockResponse = { paymentId: "pay1", paymentStatus: "PAID" };
    api.post.mockResolvedValue({ data: mockResponse });

    const result = await createPayment(payload);

    expect(api.post).toHaveBeenCalledWith("/payments", payload);
    expect(result).toEqual(mockResponse);
  });

  it("createPaymentIntent: creates a payment intent", async () => {
    const payload = { orderId: "o1" };
    const mockResponse = { paymentId: "pay1", clientSecret: "secret123" };
    api.post.mockResolvedValue({ data: mockResponse });

    const result = await createPaymentIntent(payload);

    expect(api.post).toHaveBeenCalledWith("/payments/intent", payload);
    expect(result).toEqual(mockResponse);
  });

  it("verifyPayment: checks payment verification status", async () => {
    const payload = { orderId: "o1", paymentStatus: "PAID" };
    const mockResponse = { orderId: "o1", paymentStatus: "PAID" };
    api.post.mockResolvedValue({ data: mockResponse });

    const result = await verifyPayment(payload);

    expect(api.post).toHaveBeenCalledWith("/payments/verify", payload);
    expect(result).toEqual(mockResponse);
  });

  it("capturePayment: captures payment authorized balance", async () => {
    const payload = { paymentId: "pay1" };
    const mockResponse = { success: true };
    api.post.mockResolvedValue({ data: mockResponse });

    const result = await capturePayment(payload);

    expect(api.post).toHaveBeenCalledWith("/payments/capture", payload);
    expect(result).toEqual(mockResponse);
  });

  it("refundPayment: issues full or partial refund", async () => {
    const payload = { paymentId: "pay1", refundAmount: 50 };
    const mockResponse = { success: true };
    api.post.mockResolvedValue({ data: mockResponse });

    const result = await refundPayment(payload);

    expect(api.post).toHaveBeenCalledWith("/payments/refund", payload);
    expect(result).toEqual(mockResponse);
  });

  it("cancelPayment: cancels active or pending payments", async () => {
    const payload = { paymentId: "pay1" };
    const mockResponse = { success: true };
    api.post.mockResolvedValue({ data: mockResponse });

    const result = await cancelPayment(payload);

    expect(api.post).toHaveBeenCalledWith("/payments/cancel", payload);
    expect(result).toEqual(mockResponse);
  });

  it("verifyPurchaseOrder: checks B2B credit terms", async () => {
    const payload = { orderId: "o1", creditSafetyMargin: 10 };
    const mockResponse = { approved: true };
    api.post.mockResolvedValue({ data: mockResponse });

    const result = await verifyPurchaseOrder(payload);

    expect(api.post).toHaveBeenCalledWith("/payments/po-verify", payload);
    expect(result).toEqual(mockResponse);
  });

  it("updatePayment: changes payment properties and status", async () => {
    const paymentId = "pay1";
    const payload = { paymentStatus: "PAID" };
    const mockResponse = { success: true };
    api.put.mockResolvedValue({ data: mockResponse });

    const result = await updatePayment(paymentId, payload);

    expect(api.put).toHaveBeenCalledWith("/payments/pay1", payload);
    expect(result).toEqual(mockResponse);
  });
});
