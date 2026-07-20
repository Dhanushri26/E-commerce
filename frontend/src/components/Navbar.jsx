import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  Heart,
  ShoppingBag,
  UserRound,
  Menu,
  X,
  ChevronDown,
  Bell,
  Package,
} from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { SearchBar } from './SearchBar'
import { getProducts, normalizeProduct } from '../api/products'
import { BRAND, CATEGORIES } from '../constants/brand'
import { cn } from '../lib/utils'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/products' },
  { label: 'Deals', to: '/offers' },
  { label: 'New Arrivals', to: '/new-arrivals' },
  { label: 'About', to: '/about' },
]

export function Navbar() {
  const { cart, wishlist, user, toast } = useAppContext()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [products, setProducts] = useState([])

  const cartCount = cart.reduce((sum, item) => sum + (item.quantity ?? 1), 0)

  useEffect(() => {
    getProducts()
      .then((data) => {
        const items = (data.items || []).map(normalizeProduct)
        setProducts(items)
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        {/* Top bar */}
        <div className="hidden border-b border-slate-100 bg-slate-900 px-4 py-1.5 text-center text-xs text-slate-300 lg:block">
          Free shipping on orders over ₹1,500 · Easy 30-day returns
        </div>

        <div className="mx-auto max-w-7xl px-4 py-3 lg:px-8">
          <div className="flex items-center gap-4 lg:gap-8">
            {/* Logo */}
            <Link
              to="/"
              className="shrink-0 text-xl font-bold tracking-tight text-slate-900"
            >
              <span className="text-indigo-600">Shop</span>Sphere
            </Link>

            {/* Categories dropdown - desktop */}
            <div className="relative hidden lg:block">
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Categories
                <ChevronDown
                  size={16}
                  className={cn('transition-transform', categoriesOpen && 'rotate-180')}
                />
              </button>
              {categoriesOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setCategoriesOpen(false)}
                  />
                  <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    {CATEGORIES.map((cat) => (
                      <Link
                        key={cat.label}
                        to={cat.path}
                        onClick={() => setCategoriesOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-indigo-50"
                      >
                        <span className="text-xl">{cat.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{cat.label}</p>
                          <p className="text-xs text-slate-500">{cat.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Search - desktop */}
            <SearchBar
              products={products}
              className="hidden flex-1 lg:block"
              onNavigate={() => setMobileOpen(false)}
            />

            {/* Actions */}
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <Link
                to="/orders"
                className="hidden rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 sm:block"
                title="Orders"
              >
                <Package size={20} />
              </Link>
              <button
                className="hidden rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 sm:block"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={20} />
              </button>
              <Link
                to="/wishlist"
                className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100"
              >
                <Heart size={20} />
                {wishlist.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              <Link
                to="/cart"
                className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                to="/profile"
                className="hidden rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 sm:block"
              >
                <UserRound size={20} />
              </Link>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 lg:hidden"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Search - mobile */}
          <div className="mt-3 lg:hidden">
            <SearchBar products={products} onNavigate={() => setMobileOpen(false)} />
          </div>

          {/* Desktop nav links */}
          <nav className="mt-3 hidden items-center gap-6 border-t border-slate-100 pt-3 lg:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'text-sm font-medium transition-colors',
                    isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
            <nav className="space-y-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-xl px-4 py-3 text-sm font-medium',
                      isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Categories
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.label}
                    to={cat.path}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {cat.icon} {cat.label}
                  </Link>
                ))}
              </div>
            </div>
            {user && (
              <p className="mt-4 px-4 text-xs text-slate-500">
                Signed in as {user.email}
              </p>
            )}
          </div>
        )}
      </header>

      {/* Toast notification */}
      {toast && (
        <div
          className={cn(
            'fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-6 py-3 text-sm font-medium shadow-lg',
            toast.type === 'success' && 'bg-emerald-600 text-white',
            toast.type === 'error' && 'bg-red-600 text-white',
            toast.type === 'info' && 'bg-slate-800 text-white'
          )}
        >
          {toast.message}
        </div>
      )}
    </>
  )
}
