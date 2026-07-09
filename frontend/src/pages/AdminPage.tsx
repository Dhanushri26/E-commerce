import { BarChart3, Boxes, CreditCard, LayoutDashboard, Settings, ShoppingBag, Users } from 'lucide-react'

const stats = [
  { label: 'Revenue', value: '₹3.4Cr', icon: BarChart3 },
  { label: 'Orders', value: '1,284', icon: ShoppingBag },
  { label: 'Customers', value: '8,290', icon: Users },
  { label: 'Payments', value: '97%', icon: CreditCard },
]

export function AdminPage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8">
        <aside className="w-full rounded-[1.5rem] border border-stone-800 bg-stone-900 p-6 lg:w-72">
          <h1 className="text-2xl font-semibold tracking-[0.3em]">JEWELCART ADMIN</h1>
          <nav className="mt-8 space-y-2 text-sm text-stone-400">
            {['Dashboard', 'Products', 'Inventory', 'Orders', 'Payments', 'Customers', 'Analytics', 'Settings'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-full px-3 py-2 hover:bg-stone-800 hover:text-white">{item === 'Dashboard' ? <LayoutDashboard size={16} /> : item === 'Products' ? <Boxes size={16} /> : item === 'Inventory' ? <Boxes size={16} /> : item === 'Orders' ? <ShoppingBag size={16} /> : item === 'Payments' ? <CreditCard size={16} /> : item === 'Customers' ? <Users size={16} /> : item === 'Analytics' ? <BarChart3 size={16} /> : <Settings size={16} />} {item}</div>
            ))}
          </nav>
        </aside>
        <main className="flex-1 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => { const Icon = stat.icon; return <div key={stat.label} className="rounded-[1.25rem] border border-stone-800 bg-stone-900 p-5"><div className="flex items-center justify-between"><span className="text-sm text-stone-400">{stat.label}</span><Icon className="text-amber-500" /></div><p className="mt-4 text-2xl font-semibold">{stat.value}</p></div> })}
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[1.5rem] border border-stone-800 bg-stone-900 p-6">
              <h2 className="text-xl">Inventory Overview</h2>
              <div className="mt-6 space-y-4 text-sm text-stone-400">
                {['Diamond Rings', 'Emerald Necklaces', 'Rose Gold Bracelets', 'Luxury Watches'].map((item) => <div key={item} className="flex items-center justify-between rounded-2xl bg-stone-800 px-4 py-3"><span>{item}</span><span className="text-white">High demand</span></div>)}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-stone-800 bg-stone-900 p-6">
              <h2 className="text-xl">Recent Orders</h2>
              <div className="mt-6 space-y-4 text-sm text-stone-400">
                {['ORD-1042', 'ORD-1038', 'ORD-1032'].map((order) => <div key={order} className="rounded-2xl bg-stone-800 px-4 py-3">{order} • Payment cleared</div>)}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
