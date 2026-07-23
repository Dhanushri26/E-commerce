import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getInventory,
  getInventoryByProduct,
  createInventory,
  reserveInventory,
  updateInventory
} from "../api/inventory";
import api from "../api/axios";

// Mock the axios instance
vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("inventory API service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getInventory: fetches stock profile list", async () => {
    const mockInventory = { totalProducts: 1, items: [{ productId: "p1", availableQuantity: 10 }] };
    api.get.mockResolvedValue({ data: mockInventory });

    const result = await getInventory();

    expect(api.get).toHaveBeenCalledWith("/inventory");
    expect(result).toEqual(mockInventory);
  });

  it("getInventoryByProduct: fetches stock details for a single product", async () => {
    const mockProductInventory = { productId: "p1", availableQuantity: 10, reservedQuantity: 2 };
    api.get.mockResolvedValue({ data: mockProductInventory });

    const result = await getInventoryByProduct("p1");

    expect(api.get).toHaveBeenCalledWith("/inventory/p1");
    expect(result).toEqual(mockProductInventory);
  });

  it("createInventory: creates an inventory record", async () => {
    const payload = { productId: "p1", availableQuantity: 10 };
    const mockResponse = { success: true };
    api.post.mockResolvedValue({ data: mockResponse });

    const result = await createInventory(payload);

    expect(api.post).toHaveBeenCalledWith("/inventory", payload);
    expect(result).toEqual(mockResponse);
  });

  it("reserveInventory: submits stock reservation request", async () => {
    const payload = { productId: "p1", requestedQuantity: 2 };
    const mockResponse = { productId: "p1", reservationStatus: "SUCCESS" };
    api.patch.mockResolvedValue({ data: mockResponse });

    const result = await reserveInventory(payload);

    expect(api.patch).toHaveBeenCalledWith("/inventory/reserve", payload);
    expect(result).toEqual(mockResponse);
  });

  it("updateInventory: updates existing inventory profile", async () => {
    const productId = "p1";
    const payload = { availableQuantity: 25 };
    const mockResponse = { success: true };
    api.put.mockResolvedValue({ data: mockResponse });

    const result = await updateInventory(productId, payload);

    expect(api.put).toHaveBeenCalledWith("/inventory/p1", payload);
    expect(result).toEqual(mockResponse);
  });
});
