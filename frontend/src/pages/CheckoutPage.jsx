import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { createPaymentIntent } from "../api/payments";

const STEPS = ["Shipping", "Billing", "Review", "Payment", "Confirmation"];

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, createOrder, user } = useAppContext();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Shipping form state
  const [shipping, setShipping] = useState({
    fullName: user?.name || "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  // ── Cart totals ──
  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1),
    0
  );
  const tax = subtotal * 0.08;
  const shippingFee = subtotal > 15000 ? 0 : 650;
  const total = subtotal + tax + shippingFee;

  const handleShippingChange = (e) => {
    setShipping((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Place order + create payment intent ──
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      setError("Your cart is empty. Add items before placing an order.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // 1) Create order from current cart (Lambda reads cart from DynamoDB)
      const orderData = await createOrder(
        `Ship to: ${shipping.fullName}, ${shipping.address}, ${shipping.city} - ${shipping.pincode}`
      );
      const order = orderData.order;

      // 2) Create internal payment intent
      await createPaymentIntent({ orderId: order.orderId });

      setConfirmedOrder(order);
      setStep(5); // Jump to confirmation
    } catch (err) {
      console.error("[Checkout] Order failed:", err);
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Confirmation screen ──
  if (step === 5 && confirmedOrder) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 lg:px-8 text-center">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-12 shadow-sm">
          <CheckCircle2 className="mx-auto text-emerald-500" size={56} />
          <h1 className="mt-6 text-3xl text-stone-800">Order Confirmed!</h1>
          <p className="mt-3 text-stone-600">
            Thank you for your purchase. Your order has been placed successfully.
          </p>
          <div className="mt-6 rounded-[1.25rem] bg-stone-50 p-5 text-left text-sm text-stone-700">
            <p>
              <span className="font-semibold">Order ID:</span>{" "}
              #{confirmedOrder.orderId?.substring(0, 8).toUpperCase()}
            </p>
            <p className="mt-2">
              <span className="font-semibold">Status:</span>{" "}
              {confirmedOrder.orderStatus?.replace(/_/g, " ")}
            </p>
            <p className="mt-2">
              <span className="font-semibold">Total:</span> ₹
              {Number(confirmedOrder.totalAmount || total).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate("/orders")}
              className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white"
              id="goto-orders-btn"
            >
              View Orders
            </button>
            <button
              onClick={() => navigate("/jewelry")}
              className="rounded-full border border-stone-200 px-6 py-3 text-sm font-medium text-stone-700"
              id="continue-shopping-btn"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-700">Luxury Checkout</p>
        <h1 className="mt-2 text-3xl text-stone-800">A seamless and private buying experience</h1>

        {/* Step indicator */}
        <div className="mt-8 flex flex-wrap gap-3 text-sm text-stone-600">
          {STEPS.map((label, index) => (
            <div
              key={label}
              className={`rounded-full px-4 py-2 ${
                step === index + 1
                  ? "bg-stone-900 text-white"
                  : step > index + 1
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-stone-100"
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-6 rounded-[1rem] bg-rose-50 px-5 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.7fr]">
          {/* Left — Step content */}
          <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
            {/* Step 1 — Shipping */}
            {step === 1 && (
              <>
                <h2 className="text-xl text-stone-800">Shipping details</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <input
                    id="shipping-name"
                    name="fullName"
                    value={shipping.fullName}
                    onChange={handleShippingChange}
                    className="rounded-full border border-stone-200 bg-white px-4 py-3"
                    placeholder="Full Name"
                  />
                  <input
                    id="shipping-phone"
                    name="phone"
                    value={shipping.phone}
                    onChange={handleShippingChange}
                    className="rounded-full border border-stone-200 bg-white px-4 py-3"
                    placeholder="Phone"
                  />
                  <input
                    id="shipping-address"
                    name="address"
                    value={shipping.address}
                    onChange={handleShippingChange}
                    className="rounded-full border border-stone-200 bg-white px-4 py-3 md:col-span-2"
                    placeholder="Address"
                  />
                  <input
                    id="shipping-city"
                    name="city"
                    value={shipping.city}
                    onChange={handleShippingChange}
                    className="rounded-full border border-stone-200 bg-white px-4 py-3"
                    placeholder="City"
                  />
                  <input
                    id="shipping-pincode"
                    name="pincode"
                    value={shipping.pincode}
                    onChange={handleShippingChange}
                    className="rounded-full border border-stone-200 bg-white px-4 py-3"
                    placeholder="Pincode"
                  />
                </div>
              </>
            )}

            {/* Step 2 — Billing */}
            {step === 2 && (
              <>
                <h2 className="text-xl text-stone-800">Billing details</h2>
                <div className="mt-5 space-y-4">
                  <label className="flex items-center gap-3 rounded-[1rem] border border-stone-200 bg-white p-4 cursor-pointer">
                    <input type="radio" name="billing" defaultChecked className="accent-stone-900" />
                    <span className="text-sm text-stone-700">Same as shipping address</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-[1rem] border border-stone-200 bg-white p-4 cursor-pointer">
                    <input type="radio" name="billing" className="accent-stone-900" />
                    <span className="text-sm text-stone-700">Use a different billing address</span>
                  </label>
                </div>
              </>
            )}

            {/* Step 3 — Review */}
            {step === 3 && (
              <>
                <h2 className="text-xl text-stone-800">Review your order</h2>
                <div className="mt-5 space-y-3">
                  {cart.length === 0 ? (
                    <p className="text-stone-500">Your cart is empty.</p>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.productId || item.SK}
                        className="flex items-center gap-4 rounded-[1rem] border border-stone-200 bg-white p-4"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-stone-800">
                            {item.productTitle || item.name || "Product"}
                          </p>
                          <p className="text-sm text-stone-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-stone-900">
                          ₹{(Number(item.unitPrice || item.price || 0) * item.quantity).toLocaleString("en-IN")}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* Step 4 — Payment */}
            {step === 4 && (
              <>
                <h2 className="text-xl text-stone-800">Payment</h2>
                <p className="mt-2 text-sm text-stone-500">
                  Secure internal payment processing. Your order will be confirmed once placed.
                </p>
                <div className="mt-5 space-y-3">
                  <label className="flex items-center gap-3 rounded-[1rem] border border-stone-200 bg-white p-4 cursor-pointer">
                    <input type="radio" name="payment" defaultChecked className="accent-stone-900" />
                    <span className="text-sm text-stone-700">Pay on Delivery</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-[1rem] border border-stone-200 bg-white p-4 cursor-pointer">
                    <input type="radio" name="payment" className="accent-stone-900" />
                    <span className="text-sm text-stone-700">Bank Transfer / NEFT</span>
                  </label>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading || cart.length === 0}
                  id="place-order-btn"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-3.5 text-sm font-medium text-white disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Placing Order…
                    </>
                  ) : (
                    "Confirm & Place Order"
                  )}
                </button>
              </>
            )}

            {/* Navigation buttons (steps 1-3) */}
            {step < 4 && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep((p) => Math.max(1, p - 1))}
                  className="rounded-full border border-stone-200 px-5 py-3 text-sm text-stone-700"
                  id="checkout-back-btn"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep((p) => Math.min(4, p + 1))}
                  className="rounded-full bg-stone-900 px-5 py-3 text-sm text-white"
                  id="checkout-continue-btn"
                >
                  Continue
                </button>
              </div>
            )}
          </div>

          {/* Right — Order Preview (real cart data) */}
          <div className="rounded-[1.5rem] border border-stone-200 p-6">
            <h2 className="text-xl text-stone-800">Order Preview</h2>
            <div className="mt-6 space-y-3 text-sm text-stone-600">
              {cart.length === 0 ? (
                <p className="text-stone-400">No items in cart.</p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId || item.SK}
                    className="flex justify-between"
                  >
                    <span className="truncate pr-2">
                      {item.productTitle || item.name || "Product"}{" "}
                      <span className="text-stone-400">×{item.quantity}</span>
                    </span>
                    <span>
                      ₹
                      {(
                        Number(item.unitPrice || item.price || 0) * item.quantity
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))
              )}
              <div className="border-t border-stone-200 pt-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span>Shipping</span>
                  <span>{shippingFee === 0 ? "Free" : `₹${shippingFee}`}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span>Tax (8%)</span>
                  <span>₹{tax.toFixed(0)}</span>
                </div>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-3 font-semibold text-stone-900">
                <span>Grand Total</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
