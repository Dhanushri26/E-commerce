import { orders } from '../services/mockData'

export function OrdersPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-700">Order History</p>
        <h1 className="mt-2 text-3xl text-stone-800">Track every precious delivery.</h1>
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-[1.25rem] border border-stone-200 p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-stone-500">{order.id}</p>
                  <h2 className="mt-1 text-xl text-stone-800">{order.date}</h2>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">{order.paymentStatus}</span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">{order.status}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-stone-600">
                <span>{order.items.length} items</span>
                <span className="font-semibold text-stone-900">Total ₹{order.total.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
