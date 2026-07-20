import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2, RefreshCw, ShoppingBag, ArrowRight, Tag } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { useState } from 'react'

export function CartPage() {
  const { cart, cartLoading, updateQuantity, removeFromCart, clearCartItems, loadCart } =
    useAppContext()
  const [coupon, setCoupon] = useState('')

  // Cart item identifier: Lambda returns productId (not id)
  const getKey = (item) => item.productId ?? item.SK ?? item.id

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + Number(item.unitPrice ?? item.price ?? 0) * Number(item.quantity ?? 1),
    0
  )
  const shipping = subtotal >= 1500 ? 0 : 99
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 page-enter">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 lg:text-3xl">Shopping Cart</h1>
          <p className="mt-1 text-sm text-slate-500">
            {cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadCart}
            disabled={cartLoading}
            id="cart-refresh-btn"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
          >
            <RefreshCw size={13} className={cartLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link to="/products" className="hidden text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition sm:block">
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {cart.length === 0 && !cartLoading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <div className="rounded-full bg-indigo-50 p-6">
            <ShoppingBag className="text-indigo-400" size={40} />
          </div>
          <h2 className="mt-5 text-xl font-bold text-slate-800">Your cart is empty</h2>
          <p className="mt-2 max-w-xs text-sm text-slate-400">
            Add products to your cart to see them here and proceed to checkout.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition"
          >
            Browse Products <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          {/* Items panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {/* Loading skeleton */}
            {cartLoading && cart.length === 0 && (
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div key={n} className="flex gap-4 animate-pulse rounded-xl border border-slate-100 p-4">
                    <div className="h-20 w-20 flex-shrink-0 rounded-xl bg-slate-200" />
                    <div className="flex-1 space-y-3 pt-1">
                      <div className="h-4 w-48 rounded-full bg-slate-200" />
                      <div className="h-3 w-28 rounded-full bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {cart.map((item) => {
                const key = getKey(item)
                const unitPrice = Number(item.unitPrice ?? item.price ?? 0)
                const lineTotal = unitPrice * Number(item.quantity ?? 1)

                return (
                  <div
                    key={key}
                    id={`cart-item-${key}`}
                    className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-slate-200 sm:flex-row sm:items-center"
                  >
                    {/* Image */}
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white border border-slate-200">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.productTitle}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <ShoppingBag size={22} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 line-clamp-1">
                        {item.productTitle ?? item.name ?? 'Product'}
                      </h3>
                      <p className="mt-0.5 text-sm text-slate-400">
                        ₹{unitPrice.toLocaleString('en-IN')} each
                      </p>
                      {/* Qty controls */}
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          id={`cart-dec-${key}`}
                          onClick={() => updateQuantity(key, Math.max(1, Number(item.quantity) - 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="min-w-[2rem] text-center text-sm font-semibold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          id={`cart-inc-${key}`}
                          onClick={() => updateQuantity(key, Number(item.quantity) + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Price + Remove */}
                    <div className="flex items-center justify-between sm:flex-col sm:items-end sm:gap-3">
                      <p className="font-bold text-slate-900">
                        ₹{lineTotal.toLocaleString('en-IN')}
                      </p>
                      <button
                        id={`cart-remove-${key}`}
                        onClick={() => removeFromCart(key)}
                        className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition"
                      >
                        <Trash2 size={13} />
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Clear all */}
            {cart.length > 0 && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  onClick={clearCartItems}
                  id="clear-cart-btn"
                  className="text-xs text-slate-400 hover:text-red-500 transition"
                >
                  Clear all items
                </button>
                <Link to="/products" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition sm:hidden">
                  Continue Shopping
                </Link>
              </div>
            )}
          </div>

          {/* Order summary panel */}
          <div className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Order Summary</h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({cart.length} items)</span>
                <span className="font-medium text-slate-800">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'font-semibold text-emerald-600' : 'font-medium text-slate-800'}>
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax (8%)</span>
                <span className="font-medium text-slate-800">₹{tax.toFixed(0)}</span>
              </div>
              {subtotal > 0 && subtotal < 1500 && (
                <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Add ₹{(1500 - subtotal).toLocaleString('en-IN')} more for free shipping!
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Coupon */}
            <div className="mt-5">
              <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Tag size={12} /> Coupon Code
              </label>
              <div className="flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Enter code"
                  id="coupon-input"
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
                />
                <button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                  Apply
                </button>
              </div>
            </div>

            <Link
              to="/checkout"
              id="proceed-to-checkout-btn"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white hover:bg-indigo-700 transition shadow-sm"
            >
              Proceed to Checkout <ArrowRight size={16} />
            </Link>

            <p className="mt-3 text-center text-xs text-slate-400">
              Secured by SSL · Payments encrypted
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
