import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useAppContext } from '../context/AppContext'

export function CartPage() {
  const { cart, updateQuantity, removeFromCart } = useAppContext()

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 15000 ? 0 : 650
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-amber-700">Luxury Cart</p>
              <h1 className="mt-2 text-3xl text-stone-800">Your curated selection</h1>
            </div>
            <Link to="/jewelry" className="text-sm font-semibold text-stone-700">Continue shopping</Link>
          </div>
          <div className="mt-8 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex flex-col gap-4 rounded-[1.25rem] border border-stone-200 p-4 sm:flex-row sm:items-center">
                <img src={item.image} alt={item.name} className="h-24 w-full rounded-2xl object-cover sm:w-24" />
                <div className="flex-1">
                  <h3 className="text-lg text-stone-800">{item.name}</h3>
                  <p className="mt-1 text-sm text-stone-600">{item.category} • {item.metal}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="rounded-full border border-stone-200 p-2"><Minus size={14} /></button>
                    <span className="min-w-8 text-center font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="rounded-full border border-stone-200 p-2"><Plus size={14} /></button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-stone-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                  <button onClick={() => removeFromCart(item.id)} className="mt-3 inline-flex items-center gap-2 text-sm text-rose-700"><Trash2 size={14} /> Remove</button>
                </div>
              </div>
            ))}
            {cart.length === 0 && <div className="rounded-[1.25rem] border border-dashed border-stone-300 p-10 text-center text-stone-500">Your cart is ready for your next heirloom piece.</div>}
          </div>
        </div>
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl text-stone-800">Order Summary</h2>
          <div className="mt-6 space-y-3 text-sm text-stone-600">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>₹0</span></div>
            <div className="flex justify-between"><span>Tax</span><span>₹{tax.toFixed(0)}</span></div>
            <div className="mt-4 flex justify-between border-t border-stone-200 pt-4 text-base font-semibold text-stone-900"><span>Grand Total</span><span>₹{total.toLocaleString()}</span></div>
          </div>
          <label className="mt-6 block rounded-full border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">Coupon code <input className="ml-2 bg-transparent outline-none" placeholder="WELCOME10" /></label>
          <Link to="/checkout" className="mt-6 block rounded-full bg-stone-900 px-5 py-3 text-center font-medium text-white">Proceed to Checkout</Link>
        </div>
      </div>
    </div>
  )
}
