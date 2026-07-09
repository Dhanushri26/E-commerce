import { UserRound, MapPin, Heart, ShoppingBag, Settings } from 'lucide-react'

export function ProfilePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-700">Client Profile</p>
            <h1 className="mt-2 text-3xl text-stone-800">Welcome back, Anika.</h1>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-stone-200 bg-stone-50 px-4 py-3">
            <UserRound className="text-stone-600" />
            <span className="text-sm text-stone-700">Premium Member</span>
          </div>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[{ icon: MapPin, title: 'Saved Addresses', text: '2 verified addresses' }, { icon: Heart, title: 'Wishlist', text: '12 hearted pieces' }, { icon: ShoppingBag, title: 'Orders', text: '3 completed orders' }, { icon: Settings, title: 'Preferences', text: 'Personalized alerts' }].map((item) => {
            const Icon = item.icon
            return <div key={item.title} className="rounded-[1.25rem] border border-stone-200 bg-stone-50 p-5"><div className="inline-flex rounded-full bg-amber-100 p-2 text-amber-700"><Icon /></div><h2 className="mt-4 text-lg text-stone-800">{item.title}</h2><p className="mt-2 text-sm text-stone-600">{item.text}</p></div>
          })}
        </div>
      </div>
    </div>
  )
}
