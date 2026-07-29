import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WishlistPage } from "../pages/WishlistPage";
import { useAppContext } from "../context/AppContext";
import { MemoryRouter } from "react-router-dom";

// Mock AppContext
vi.mock("../context/AppContext", () => ({
  useAppContext: vi.fn(),
}));

describe("WishlistPage Component", () => {
  const mockAddToCart = vi.fn();
  const mockRemoveFromWishlist = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when wishlist is empty", () => {
    useAppContext.mockReturnValue({
      wishlist: [],
      addToCart: mockAddToCart,
      removeFromWishlist: mockRemoveFromWishlist,
    });

    render(
      <MemoryRouter>
        <WishlistPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Your wishlist is empty")).toBeInTheDocument();
    expect(screen.getByText("Explore Products")).toBeInTheDocument();
  });

  it("renders the list of saved items in the wishlist grid", () => {
    const mockWishlist = [
      {
        id: "prod-1",
        name: "Ruby Pendant",
        price: 5000,
        discount: 10,
        category: "Pendants",
        description: "A beautiful heart pendant.",
        image: "ruby.png",
      },
      {
        productId: "prod-2",
        title: "Gold Ring",
        msrp: 12000,
        discount: 0,
        category: "Rings",
        description: "Classic gold band.",
      },
    ];

    useAppContext.mockReturnValue({
      wishlist: mockWishlist,
      addToCart: mockAddToCart,
      removeFromWishlist: mockRemoveFromWishlist,
    });

    render(
      <MemoryRouter>
        <WishlistPage />
      </MemoryRouter>
    );

    // Verify first item renders using its properties
    expect(screen.getByText("Ruby Pendant")).toBeInTheDocument();
    expect(screen.getByText("₹5,000")).toBeInTheDocument();
    expect(screen.getByText("10% off")).toBeInTheDocument();
    expect(screen.getByText("A beautiful heart pendant.")).toBeInTheDocument();

    // Verify second item renders using alternative fallback properties (title/msrp)
    expect(screen.getByText("Gold Ring")).toBeInTheDocument();
    expect(screen.getByText("₹12,000")).toBeInTheDocument();
    expect(screen.getByText("Classic gold band.")).toBeInTheDocument();
  });

  it("calls removeFromWishlist when trash icon is clicked", async () => {
    const user = userEvent.setup();
    const mockWishlist = [
      {
        id: "prod-1",
        name: "Ruby Pendant",
        price: 5000,
        discount: 0,
      },
    ];

    useAppContext.mockReturnValue({
      wishlist: mockWishlist,
      addToCart: mockAddToCart,
      removeFromWishlist: mockRemoveFromWishlist,
    });

    render(
      <MemoryRouter>
        <WishlistPage />
      </MemoryRouter>
    );

    const removeBtn = screen.getByRole("button", { name: /remove from wishlist/i });
    await user.click(removeBtn);

    expect(mockRemoveFromWishlist).toHaveBeenCalledWith("prod-1");
  });

  it("calls addToCart when 'Add to Cart' button is clicked", async () => {
    const user = userEvent.setup();
    const mockProduct = {
      id: "prod-1",
      name: "Ruby Pendant",
      price: 5000,
      discount: 0,
    };

    useAppContext.mockReturnValue({
      wishlist: [mockProduct],
      addToCart: mockAddToCart,
      removeFromWishlist: mockRemoveFromWishlist,
    });

    render(
      <MemoryRouter>
        <WishlistPage />
      </MemoryRouter>
    );

    const addToCartBtn = screen.getByRole("button", { name: /add to cart/i });
    await user.click(addToCartBtn);

    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct);
  });
});
