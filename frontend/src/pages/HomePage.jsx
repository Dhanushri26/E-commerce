 import { Link } from 'react-router-dom'
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Headphones, Zap, TrendingUp, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState, useMemo } from 'react'
import { getProducts, normalizeProduct } from '../api/products'
import { ProductCard } from '../components/ProductCard'
import { ProductGridSkeleton } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { useAppContext } from '../context/AppContext'
import { CATEGORIES, POPULAR_BRANDS } from '../constants/brand'

function normalizeItems(items) {
  return items.map(normalizeProduct)
}

function ProductSection({ title, subtitle, products, badge, viewAllLink }) {
  const { addToCart, addToWishlist, wishlist } = useAppContext()

  if (products.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <div className="flex items-end justify-between">
        <div>
          {badge && (
            <Badge variant="primary" className="mb-2">
              {badge}
            </Badge>
          )}
          <h2 className="text-2xl font-bold text-slate-900 lg:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
        </div>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="hidden items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 md:flex"
          >
            View All <ArrowRight size={16} />
          </Link>
        )}
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={addToCart}
            onAddToWishlist={addToWishlist}
            isWishlisted={wishlist.some(
              (w) => w.id === product.id || w.productId === product.id
            )}
          />
        ))}
      </div>
    </section>
  )
}

export function HomePage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getProducts()
      .then((data) => setProducts(normalizeItems(data.items || [])))
      .catch(() => setError('Unable to load products.'))
      .finally(() => setLoading(false))
  }, [])

  const newArrivals = useMemo(
    () => products.filter((p) => p.badge === 'New Arrival'),
    [products]
  )
  const bestSellers = useMemo(
    () => [...products].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)),
    [products]
  )
  const trending = useMemo(
    () => [...products].sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0)),
    [products]
  )
  const deals = useMemo(
    () => products.filter((p) => (p.discount ?? 0) > 0),
    [products]
  )
  const recentlyAdded = useMemo(() => products.slice(-8).reverse(), [products])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="skeleton-shimmer h-80 rounded-3xl" />
        <div className="mt-12">
          <ProductGridSkeleton count={4} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <ErrorState description={error} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  return (
    <div className="pb-8">
      {/* Hero Banner */}
      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-12">
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 p-8 text-white shadow-2xl lg:p-12"
          >
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-indigo-400/20 blur-2xl" />
            <div className="relative">
              <Badge className="bg-white/20 text-white backdrop-blur-sm">
                Summer Sale — Up to 40% Off
              </Badge>
              <h1 className="mt-6 text-4xl font-bold leading-tight lg:text-5xl">
                Shop smarter.<br />Live better.
              </h1>
              <p className="mt-4 max-w-md text-lg text-indigo-100">
                Discover thousands of products across fashion, electronics, home, and more — all in one place.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/products">
                  <Button className="bg-white text-indigo-700 hover:bg-indigo-50">
                    Shop Now
                  </Button>
                </Link>
                <Link to="/offers">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    View Deals
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="relative overflow-hidden rounded-3xl shadow-xl"
          >
            <img
              src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80"
              alt="Shopping experience"
              className="h-full min-h-[320px] w-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/80 to-transparent p-6">
              <p className="text-sm font-medium text-white/80">Featured Collection</p>
              <p className="text-xl font-bold text-white">Trending This Week</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:grid-cols-4 lg:px-8">
          {[
            { icon: Truck, label: 'Free Shipping', sub: 'On orders ₹1,500+' },
            { icon: ShieldCheck, label: 'Secure Payment', sub: '100% protected' },
            { icon: RotateCcw, label: 'Easy Returns', sub: '30-day policy' },
            { icon: Headphones, label: '24/7 Support', sub: 'Dedicated help' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3 px-2">
              <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                <Icon size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-xs text-slate-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Category Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <h2 className="text-2xl font-bold text-slate-900 lg:text-3xl">Shop by Category</h2>
        <p className="mt-1 text-slate-500">Browse our curated collections</p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={cat.path}
                className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
              >
                <span className="text-3xl">{cat.icon}</span>
                <p className="mt-3 text-sm font-semibold text-slate-800 group-hover:text-indigo-600">
                  {cat.label}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Collections */}
      <section className="bg-slate-100/80 py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 lg:text-3xl">Featured Collections</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Top Picks',
                desc: 'Hand-picked favorites loved by shoppers',
                image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyQbvZLRO2VINVatXZCNzllGT34NhZrxogTSi8h2OXbg&s=10',
                link: '/collections',
              },
              {
                title: 'Limited Drops',
                desc: 'Exclusive products available for a short time',
                image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80',
                link: '/new-arrivals',
              },
              {
                title: 'Premium Selection',
                desc: 'High-quality products for discerning buyers',
                image: 'https://images.unsplash.com/photo-1472851294601-062e0248b36f?auto=format&fit=crop&w=600&q=80',
                link: '/products',
              },
            ].map((col) => (
              <Link
                key={col.title}
                to={col.link}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-lg"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={col.image}
                    alt={col.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-900">{col.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{col.desc}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">
                    Explore <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Product sections */}
      <ProductSection
        title="Trending Now"
        subtitle="Most popular products this week"
        products={trending.length ? trending : products}
        badge="Trending"
        viewAllLink="/products"
      />

      <ProductSection
        title="Best Sellers"
        subtitle="Top-rated by our customers"
        products={bestSellers}
        badge="Best Sellers"
        viewAllLink="/products"
      />

      <ProductSection
        title="Today's Deals"
        subtitle="Limited-time discounts you don't want to miss"
        products={deals.length ? deals : products.slice(0, 4)}
        badge="Deals"
        viewAllLink="/offers"
      />

      <ProductSection
        title="New Arrivals"
        subtitle="Fresh products just added to our catalog"
        products={newArrivals.length ? newArrivals : recentlyAdded}
        badge="New"
        viewAllLink="/new-arrivals"
      />

      <ProductSection
        title="Recently Added"
        subtitle="The latest additions to ShopSphere"
        products={recentlyAdded}
        viewAllLink="/products"
      />

      {/* Popular Brands */}
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <h2 className="text-2xl font-bold text-slate-900">Popular Brands</h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {POPULAR_BRANDS.map((brand) => (
            <div
              key={brand}
              className="flex h-16 min-w-[120px] items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold tracking-wide text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
            >
              {brand}
            </div>
          ))}
        </div>
      </section>

      {/* Promo banner */}
      <section className="mx-auto max-w-7xl px-4 pb-12 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-900 p-8 text-white lg:flex lg:items-center lg:justify-between lg:p-12">
          <div>
            <div className="flex items-center gap-2 text-indigo-300">
              <Zap size={18} />
              <span className="text-sm font-semibold uppercase tracking-wide">Flash Sale</span>
            </div>
            <h2 className="mt-3 text-3xl font-bold">Extra 20% off selected items</h2>
            <p className="mt-2 text-slate-300">Use code SAVE20 at checkout. Limited time only.</p>
          </div>
          <Link to="/offers" className="mt-6 inline-block lg:mt-0">
            <Button className="bg-white text-slate-900 hover:bg-slate-100">
              Shop the Sale
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
