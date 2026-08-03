import { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  Loader2,
  Share2,
  Star,
  ShoppingCart,
  Truck,
  ShieldCheck,
  RotateCcw,
  Package,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { getProductById, normalizeProduct } from '../api/products';
import { useAppContext } from '../context/AppContext';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';

// Derive spec entries from product data — generic, no jewellery hardcoding
function buildSpecs(product) {
  const specs = [];
  const skip = new Set([
    'id',
    'productId',
    'name',
    'title',
    'description',
    'imageUrl',
    'image',
    'price',
    'msrp',
    'discount',
    'stock',
    'badge',
    'rating',
    'reviews',
    'category',
  ]);
  Object.entries(product).forEach(([key, val]) => {
    if (skip.has(key) || !val || typeof val === 'object') return;
    // Format key: camelCase → Title Case
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
    specs.push({ label, value: String(val) });
  });
  return specs;
}

export function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart, addToWishlist, wishlist, showToast } = useAppContext();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('description'); // description | specs | reviews

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    getProductById(id)
      .then((data) => {
        const raw = data?.product ?? data?.item ?? data;
        setProduct(normalizeProduct(raw));
      })
      .catch((err) => {
        console.error('[ProductDetailPage] fetch error:', err);
        setError('Product not found or unavailable.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const isWishlisted = useMemo(() => wishlist.some((w) => w.id === id || w.productId === id), [wishlist, id]);

  const specs = useMemo(() => (product ? buildSpecs(product) : []), [product]);

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-2xl bg-slate-200" />
          <div className="space-y-4">
            <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
            <div className="h-8 w-3/4 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
            <div className="mt-6 h-12 w-48 animate-pulse rounded-xl bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center lg:px-8">
        <Package className="mx-auto text-slate-300" size={48} />
        <p className="mt-4 text-lg font-semibold text-slate-700">{error || 'Product not found.'}</p>
        <p className="mt-2 text-slate-400">The item you're looking for may have been removed or is unavailable.</p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition"
        >
          <ArrowLeft size={16} /> Back to Products
        </Link>
      </div>
    );
  }

  const inStock = (product.stock ?? 10) > 0;
  const oldPrice = product.discount > 0 ? (product.price / (1 - product.discount / 100)).toFixed(0) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 page-enter">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-slate-400">
        <Link to="/" className="hover:text-indigo-600 transition">
          Home
        </Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-indigo-600 transition">
          Products
        </Link>
        {product.category && (
          <>
            <ChevronRight size={12} />
            <span className="text-slate-500">{product.category}</span>
          </>
        )}
        <ChevronRight size={12} />
        <span className="text-slate-700 font-medium line-clamp-1 max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        {/* ── Left: Image ──────────────────────────────── */}
        <div className="space-y-3">
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
            <img
              src={product.image}
              alt={product.name}
              id={`product-image-${product.id}`}
              className="h-[480px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {product.discount > 0 && (
              <div className="absolute left-4 top-4">
                <Badge variant="discount">-{product.discount}%</Badge>
              </div>
            )}
            {product.badge && (
              <div className="absolute left-4 top-4">
                <Badge variant="primary">{product.badge}</Badge>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Details ───────────────────────────── */}
        <div>
          {product.category && (
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">{product.category}</p>
          )}
          <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-900 lg:text-4xl">{product.name}</h1>

          {/* Rating */}
          {(product.rating || product.reviews) && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    className={s <= Math.round(product.rating ?? 0) ? 'text-amber-400' : 'text-slate-200'}
                    fill="currentColor"
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-slate-700">{product.rating ?? 'N/A'}</span>
              {product.reviews && <span className="text-sm text-slate-400">({product.reviews} reviews)</span>}
            </div>
          )}

          {/* Price */}
          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-slate-900">₹{Number(product.price).toLocaleString('en-IN')}</span>
            {oldPrice && (
              <span className="text-lg text-slate-400 line-through">₹{Number(oldPrice).toLocaleString('en-IN')}</span>
            )}
            {product.discount > 0 && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                {product.discount}% OFF
              </span>
            )}
          </div>

          {/* Stock indicator */}
          <div className="mt-4 flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', inStock ? 'bg-emerald-500' : 'bg-red-500')} />
            <span className={cn('text-sm font-medium', inStock ? 'text-emerald-700' : 'text-red-600')}>
              {inStock ? `In Stock${product.stock ? ` (${product.stock} left)` : ''}` : 'Out of Stock'}
            </span>
          </div>

          {/* Delivery */}
          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Truck size={16} className="text-indigo-500" />
              <span>Free delivery on orders above ₹1,500</span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-sm text-slate-600">
              <Zap size={16} className="text-amber-500" />
              <span>Express delivery available in 2–4 days</span>
            </div>
          </div>

          {/* Quantity + CTA */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-600">Qty:</span>
              <div className="flex items-center overflow-hidden rounded-xl border border-slate-200">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-50 transition"
                  id={`qty-dec-${product.id}`}
                >
                  −
                </button>
                <span className="min-w-[2.5rem] text-center text-sm font-semibold text-slate-900">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-50 transition"
                  id={`qty-inc-${product.id}`}
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  const p = { ...product, quantity: qty };
                  addToCart(p);
                }}
                disabled={!inStock}
                id={`add-to-cart-${product.id}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                <ShoppingCart size={18} />
                Add to Cart
              </button>
              <button
                onClick={() => addToWishlist(product)}
                id={`add-to-wishlist-${product.id}`}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-5 py-3.5 font-semibold transition',
                  isWishlisted
                    ? 'border-red-200 bg-red-50 text-red-600'
                    : 'border-slate-200 text-slate-700 hover:border-red-200 hover:text-red-500'
                )}
              >
                <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
                {isWishlisted ? 'Wishlisted' : 'Wishlist'}
              </button>
              <button className="rounded-xl border border-slate-200 p-3.5 text-slate-500 transition hover:bg-slate-50">
                <Share2 size={18} />
              </button>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-100 pt-5">
            {[
              { icon: ShieldCheck, text: 'Secure Checkout' },
              { icon: RotateCcw, text: '30-Day Returns' },
              { icon: Package, text: 'Tracked Delivery' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs text-slate-500">
                <Icon size={14} className="text-indigo-500" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs: Description / Specs / Reviews ────────────────── */}
      <div className="mt-12">
        <div className="flex border-b border-slate-200">
          {[
            { key: 'description', label: 'Description' },
            { key: 'specs', label: 'Specifications' },
            { key: 'reviews', label: `Reviews${product.reviews ? ` (${product.reviews})` : ''}` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-6 py-3 text-sm font-semibold transition border-b-2 -mb-px',
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6">
          {activeTab === 'description' && (
            <p className="leading-relaxed text-slate-600">
              {product.description || 'No description available for this product.'}
            </p>
          )}

          {activeTab === 'specs' &&
            (specs.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {specs.map(({ label, value }) => (
                  <div key={label} className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
                    <span className="min-w-[100px] text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {label}
                    </span>
                    <span className="text-sm text-slate-700">{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No specifications available.</p>
            ))}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-slate-900">{product.rating ?? '—'}</div>
                <div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={20}
                        className={s <= Math.round(product.rating ?? 0) ? 'text-amber-400' : 'text-slate-200'}
                        fill="currentColor"
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{product.reviews ?? 0} customer reviews</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 italic">Detailed reviews coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
