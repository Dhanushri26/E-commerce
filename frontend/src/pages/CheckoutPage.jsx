import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, ShieldCheck, LockKeyhole, Package } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { createPaymentIntent, updatePayment } from "../api/payments";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = ["Shipping", "Billing", "Review", "Payment", "Confirmation"];

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, createOrder, user } = useAppContext();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
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
    setProcessingPayment(true);
    setError("");

    try {
      // 1) Create order from current cart (Lambda reads cart from DynamoDB)
      const orderData = await createOrder(
        `Ship to: ${shipping.fullName}, ${shipping.address}, ${shipping.city} - ${shipping.pincode}`
      );
      const order = orderData.order;

      // 2) Create internal payment intent
      const intentData = await createPaymentIntent({ orderId: order.orderId });
      const paymentId = intentData.paymentId;

      // UX: simulate secure processing
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // 3) Mark payment as PAID in backend
      await updatePayment(paymentId, {
        paymentStatus: "PAID",
        transactionReference: `INTERNAL-TXN-${Date.now()}`,
      });

      order.orderStatus = "CONFIRMED";
      setConfirmedOrder(order);
      setStep(5);
    } catch (err) {
      console.error("[Checkout] Order failed:", err);
      setError(
        err.response?.data?.message ||
          "Something went wrong during payment processing. Please try again."
      );
    } finally {
      setLoading(false);
      setProcessingPayment(false);
    }
  };

  // ── Confirmation screen ──
  if (step === 5 && confirmedOrder) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-xl px-4 py-16 lg:px-8 text-center page-enter"
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50"
          >
            <CheckCircle2 className="text-emerald-500" size={48} strokeWidth={1.5} />
          </motion.div>
          <h1 className="mt-6 text-2xl font-bold text-slate-900">Order Confirmed!</h1>
          <p className="mt-2 text-slate-500">
            Thank you for your purchase. Your items will be on their way soon.
          </p>

          <div className="mt-8 rounded-xl bg-slate-50 p-5 text-left text-sm border border-slate-100">
            <div className="flex justify-between border-b border-slate-200 pb-3">
              <span className="font-semibold text-slate-600">Order ID</span>
              <span className="font-mono text-slate-900">#{confirmedOrder.orderId?.substring(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 py-3">
              <span className="font-semibold text-slate-600">Status</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                {confirmedOrder.orderStatus?.replace(/_/g, " ")}
              </span>
            </div>
            <div className="flex justify-between pt-3">
              <span className="font-semibold text-slate-600">Total Paid</span>
              <span className="font-bold text-slate-900">
                ₹{Number(confirmedOrder.totalAmount || total).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate("/orders")}
              className="rounded-xl bg-indigo-600 px-7 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition"
              id="goto-orders-btn"
            >
              View Orders
            </button>
            <button
              onClick={() => navigate("/products")}
              className="rounded-xl border border-slate-200 px-7 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              id="continue-shopping-btn"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 page-enter">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">

        {/* Payment Processing Overlay */}
        <AnimatePresence>
          {processingPayment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-white/85 backdrop-blur-md rounded-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="mb-6 h-14 w-14 rounded-full border-4 border-indigo-100 border-t-indigo-600"
                />
                <h3 className="text-xl font-bold text-slate-900">Processing Payment</h3>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <LockKeyhole size={14} /> Securely communicating with gateway…
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Secure Checkout</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 lg:text-3xl">Complete your order</h1>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex flex-wrap items-center gap-2 text-sm font-medium">
          {STEPS.map((label, index) => {
            const isCompleted = step > index + 1;
            const isActive = step === index + 1;
            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`flex h-8 items-center gap-1.5 rounded-full px-3.5 transition-all duration-300 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : isCompleted
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isCompleted && <CheckCircle2 size={13} />}
                  {label}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`h-px w-4 ${isCompleted ? "bg-emerald-300" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Error */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          {/* Left — Step content */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
            <AnimatePresence mode="wait">
              {/* Step 1 — Shipping */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                >
                  <h2 className="mb-5 text-lg font-bold text-slate-900">Shipping Details</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      id="shipping-name"
                      name="fullName"
                      value={shipping.fullName}
                      onChange={handleShippingChange}
                      className={inputCls}
                      placeholder="Full Name"
                    />
                    <input
                      id="shipping-phone"
                      name="phone"
                      value={shipping.phone}
                      onChange={handleShippingChange}
                      className={inputCls}
                      placeholder="Phone Number"
                    />
                    <input
                      id="shipping-address"
                      name="address"
                      value={shipping.address}
                      onChange={handleShippingChange}
                      className={`${inputCls} md:col-span-2`}
                      placeholder="Street Address"
                    />
                    <input
                      id="shipping-city"
                      name="city"
                      value={shipping.city}
                      onChange={handleShippingChange}
                      className={inputCls}
                      placeholder="City"
                    />
                    <input
                      id="shipping-pincode"
                      name="pincode"
                      value={shipping.pincode}
                      onChange={handleShippingChange}
                      className={inputCls}
                      placeholder="Pincode"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 2 — Billing */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                >
                  <h2 className="mb-5 text-lg font-bold text-slate-900">Billing Details</h2>
                  <div className="space-y-3">
                    {[
                      { id: 'billing-same', label: 'Same as shipping address', defaultChecked: true },
                      { id: 'billing-diff', label: 'Use a different billing address', defaultChecked: false },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className="flex cursor-pointer items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200"
                      >
                        <input
                          type="radio"
                          name="billing"
                          id={opt.id}
                          defaultChecked={opt.defaultChecked}
                          className="h-4 w-4 accent-indigo-600"
                        />
                        <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 3 — Review */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                >
                  <h2 className="mb-5 text-lg font-bold text-slate-900">Review Your Order</h2>
                  <div className="space-y-3">
                    {cart.length === 0 ? (
                      <p className="text-slate-400 text-sm">Your cart is empty.</p>
                    ) : (
                      cart.map((item) => (
                        <div
                          key={item.productId || item.SK}
                          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"
                        >
                          <Package size={18} className="text-indigo-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {item.productTitle || item.name || "Product"}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-bold text-slate-900 shrink-0">
                            ₹{(Number(item.unitPrice || item.price || 0) * item.quantity).toLocaleString("en-IN")}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 4 — Payment */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                >
                  <h2 className="mb-5 text-lg font-bold text-slate-900">Payment Method</h2>
                  <div className="mb-5 flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-800 border border-indigo-100">
                    <ShieldCheck size={16} className="text-indigo-600" />
                    Secure internal payment gateway active.
                  </div>
                  <div className="space-y-3">
                    {[
                      { id: 'pay-card', label: 'Credit or Debit Card', sub: 'Processed securely', defaultChecked: true },
                      { id: 'pay-bank', label: 'Bank Transfer', sub: 'NEFT / RTGS', defaultChecked: false },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className="flex cursor-pointer items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200"
                      >
                        <input
                          type="radio"
                          name="payment"
                          id={opt.id}
                          defaultChecked={opt.defaultChecked}
                          className="h-4 w-4 accent-indigo-600"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{opt.label}</p>
                          <p className="text-xs text-slate-400">{opt.sub}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading || cart.length === 0}
                    id="place-order-btn"
                    className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white transition hover:bg-indigo-700 hover:shadow-md disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>Confirm & Pay ₹{total.toLocaleString("en-IN")}</>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons (steps 1-3) */}
            {step < 4 && (
              <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
                <button
                  onClick={() => setStep((p) => Math.max(1, p - 1))}
                  className={`rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition ${step === 1 ? "invisible" : ""}`}
                  id="checkout-back-btn"
                >
                  Go Back
                </button>
                <button
                  onClick={() => setStep((p) => Math.min(4, p + 1))}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition"
                  id="checkout-continue-btn"
                >
                  Continue to {STEPS[step]}
                </button>
              </div>
            )}
          </div>

          {/* Right — Order Preview */}
          <div className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-slate-900">Order Preview</h2>
            <div className="space-y-3 text-sm">
              {cart.length === 0 ? (
                <p className="text-slate-400">No items in cart.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.productId || item.SK} className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">
                        {item.productTitle || item.name || "Product"}
                      </p>
                      <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-slate-900 shrink-0">
                      ₹{(Number(item.unitPrice || item.price || 0) * item.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-slate-800">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className={shippingFee === 0 ? 'font-semibold text-emerald-600' : 'font-medium text-slate-800'}>
                  {shippingFee === 0 ? "Free" : `₹${shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax (8%)</span>
                <span className="font-medium text-slate-800">₹{tax.toFixed(0)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <span className="font-bold text-slate-900">Grand Total</span>
              <span className="text-lg font-bold text-indigo-600">₹{total.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
