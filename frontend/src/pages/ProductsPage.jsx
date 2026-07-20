import { useMemo, useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SlidersHorizontal, Search, X, ChevronDown, LayoutGrid, List } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { getProducts, normalizeProduct } from '../api/products'
import { ProductCard } from '../components/ProductCard'
import { ProductGridSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

// ── Helpers ──────────────────────────────────────────────────────────────

// Map route → display filter label
function getRouteCategory(pathname) {
  switch (pathname) {
    case '/new-arrivals': return 'New Arrivals'
    case '/collections': return 'Collections'
    case '/gemstones': return 'Sale'
    default: return 'All'
  }
}

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'newest', label: 'Newest First' },
]

const RATING_OPTIONS = [4, 3, 2, 1]

// ── Component ─────────────────────────────────────────────────────────────

export function ProductsPage() {
  const location = useLocation()
  const { addToCart, addToWishlist, wishlist } = useAppContext()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter state
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('featured')
  const [minRating, setMinRating] = useState(0)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

  // Sync category from URL
  const [routeCategory] = useState(() => getRouteCategory(location.pathname))

  // Fetch products (unchanged API call)
  useEffect(() => {
    setLoading(true)
    getProducts()
      .then((data) => setProducts((data.items || []).map(normalizeProduct)))
      .catch(() => setError('Unable to load products. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  // Derived list of unique categories from backend data
  const productCategories = useMemo(
    () => ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))],
    [products]
  )
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Apply filters + sort
  const filteredProducts = useMemo(() => {
    let list = [...products]

    // Route-based filtering (new-arrivals, etc.)
    if (routeCategory === 'New Arrivals') list = list.filter((p) => p.badge === 'New Arrival')
    else if (routeCategory === 'Sale') list = list.filter((p) => (p.discount ?? 0) > 0)

    // Sidebar filters
    if (selectedCategory !== 'All') list = list.filter((p) => p.category === selectedCategory)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((p) =>
        `${p.name} ${p.description ?? ''} ${p.category ?? ''}`.toLowerCase().includes(q)
      )
    }
    if (minRating > 0) list = list.filter((p) => (p.rating ?? 0) >= minRating)
    if (inStockOnly) list = list.filter((p) => (p.stock ?? 10) > 0)

    // Sort
    switch (sort) {
      case 'price-low': return list.sort((a, b) => a.price - b.price)
      case 'price-high': return list.sort((a, b) => b.price - a.price)
      case 'rating': return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      case 'newest': return list.reverse()
      default: return list
    }
  }, [products, query, sort, selectedCategory, minRating, inStockOnly, routeCategory])

  const clearFilters = () => {
    setQuery('')
    setSelectedCategory('All')
    setMinRating(0)
    setInStockOnly(false)
    setSort('featured')
  }

  const hasActiveFilters = query || selectedCategory !== 'All' || minRating > 0 || inStockOnly

  // Page title from route
  const pageTitle = routeCategory !== 'All' ? routeCategory : 'All Products'

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 page-enter">
      {/* Page header */}
      <div className="mb-6">
        <nav className="mb-2 flex items-center gap-2 text-xs text-slate-400">
          <Link to="/" className="hover:text-indigo-600 transition">Home</Link>
          <span>/</span>
          <span className="text-slate-600 font-medium">{pageTitle}</span>
        </nav>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 lg:text-3xl">{pageTitle}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {loading ? 'Loading products…' : `${filteredProducts.length} products found`}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:w-64 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                id="products-search"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                id="products-sort"
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm outline-none transition focus:border-indigo-400 cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Filter toggle (mobile) */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 lg:hidden"
            >
              <SlidersHorizontal size={15} />
              Filters
              {hasActiveFilters && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-indigo-600" />}
            </button>

            {/* View mode */}
            <div className="hidden items-center gap-1 sm:flex">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-2 transition ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-lg p-2 transition ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar — desktop always visible, mobile overlay */}
        <aside
          className={`
            ${sidebarOpen ? 'fixed inset-y-0 left-0 z-50 flex flex-col shadow-2xl' : 'hidden'}
            lg:relative lg:flex lg:flex-col lg:z-auto lg:shadow-none
            w-64 flex-shrink-0 rounded-2xl border border-slate-200 bg-white p-5 h-fit
          `}
        >
          {/* Mobile sidebar header */}
          <div className="flex items-center justify-between lg:hidden mb-4">
            <h2 className="font-semibold text-slate-900">Filters</h2>
            <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full rounded-xl border border-dashed border-indigo-200 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition"
              >
                Clear All Filters
              </button>
            )}

            {/* Category */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Category</p>
              <div className="space-y-1">
                {productCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                      selectedCategory === cat
                        ? 'bg-indigo-50 font-semibold text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Minimum Rating */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Min. Rating</p>
              <div className="space-y-1">
                {RATING_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setMinRating(minRating === r ? 0 : r)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                      minRating === r ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-amber-400">{'★'.repeat(r)}</span>
                    <span>{r}+ stars</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Availability</p>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  id="in-stock-filter"
                  className="h-4 w-4 accent-indigo-600 rounded"
                />
                <span className="text-sm text-slate-700">In Stock Only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-red-600">
              <p className="font-medium">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 transition"
              >
                Try Again
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              title="No products found"
              description={hasActiveFilters ? "Try adjusting your filters or search term." : "No products are available right now."}
              actionLabel={hasActiveFilters ? "Clear Filters" : undefined}
              onAction={hasActiveFilters ? clearFilters : undefined}
            />
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'flex flex-col gap-4'
              }
            >
              {filteredProducts.map((product) => (
                viewMode === 'grid' ? (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addToCart}
                    onAddToWishlist={addToWishlist}
                    isWishlisted={wishlist.some((w) => w.id === product.id || w.productId === product.id)}
                  />
                ) : (
                  // List view card
                  <div key={product.id} className="flex gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                    <Link to={`/products/${product.id}`} className="block h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {product.image && (
                        <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
                      )}
                    </Link>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        {product.category && (
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{product.category}</p>
                        )}
                        <Link to={`/products/${product.id}`}>
                          <h3 className="mt-0.5 font-semibold text-slate-900 hover:text-indigo-600 transition line-clamp-1">{product.name}</h3>
                        </Link>
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2">{product.description}</p>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900">₹{Number(product.price).toLocaleString('en-IN')}</span>
                          {product.discount > 0 && (
                            <span className="ml-2 text-xs font-medium text-emerald-600">{product.discount}% off</span>
                          )}
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
