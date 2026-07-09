import { useState } from 'react'
import { Link } from 'react-router-dom'

export function CheckoutPage() {
  const [step, setStep] = useState(1)
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-700">Luxury Checkout</p>
        <h1 className="mt-2 text-3xl text-stone-800">A seamless and private buying experience</h1>
        <div className="mt-8 flex flex-wrap gap-3 text-sm text-stone-600">
          {['Shipping', 'Billing', 'Review', 'Payment', 'Confirmation'].map((label, index) => (
            <div key={label} className={`rounded-full px-4 py-2 ${step === index + 1 ? 'bg-stone-900 text-white' : 'bg-stone-100'}`}>{label}</div>
          ))}
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.7fr]">
          <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
            <h2 className="text-xl text-stone-800">Shipping details</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input className="rounded-full border border-stone-200 bg-white px-4 py-3" placeholder="Full Name" />
              <input className="rounded-full border border-stone-200 bg-white px-4 py-3" placeholder="Phone" />
              <input className="rounded-full border border-stone-200 bg-white px-4 py-3 md:col-span-2" placeholder="Address" />
              <input className="rounded-full border border-stone-200 bg-white px-4 py-3" placeholder="City" />
              <input className="rounded-full border border-stone-200 bg-white px-4 py-3" placeholder="Pincode" />
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep((prev) => Math.max(1, prev - 1))} className="rounded-full border border-stone-200 px-5 py-3 text-sm text-stone-700">Back</button>
              <button onClick={() => setStep((prev) => Math.min(5, prev + 1))} className="rounded-full bg-stone-900 px-5 py-3 text-sm text-white">Continue</button>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-stone-200 p-6">
            <h2 className="text-xl text-stone-800">Order Preview</h2>
            <div className="mt-6 space-y-3 text-sm text-stone-600">
              <div className="flex justify-between"><span>Diamond Ring</span><span>₹18,900</span></div>
              <div className="flex justify-between"><span>Emerald Pendant</span><span>₹24,500</span></div>
              <div className="flex justify-between border-t border-stone-200 pt-3 font-semibold text-stone-900"><span>Total</span><span>₹43,400</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
