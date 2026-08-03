import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function WishlistPage() {
  const { wishlist, addToCart, removeFromWishlist } = useAppContext();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 page-enter">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 lg:text-3xl">Wishlist</h1>
          <p className="mt-1 text-sm text-slate-500">
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
        <Link to="/products" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition">
          Browse Products
        </Link>
      </div>

      {/* Empty state */}
      {wishlist.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <div className="rounded-full bg-red-50 p-6">
            <Heart className="text-red-300" size={40} />
          </div>
          <h2 className="mt-5 text-xl font-bold text-slate-800">Your wishlist is empty</h2>
          <p className="mt-2 max-w-xs text-sm text-slate-400">
            Save your favourite items here to find them easily later.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition"
          >
            Explore Products <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Grid */}
      {wishlist.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlist.map((product) => {
            const id = product.id ?? product.productId;
            const name = product.name ?? product.title ?? 'Product';
            const price = product.price ?? product.msrp ?? 0;

            return (
              <div
                key={id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Remove button */}
                <button
                  onClick={() => removeFromWishlist(id)}
                  className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-400 opacity-0 shadow-sm backdrop-blur-sm transition hover:text-red-500 group-hover:opacity-100"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 size={14} />
                </button>

                {/* Image */}
                <Link to={`/products/${id}`} className="block aspect-[4/3] overflow-hidden bg-slate-100">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <Heart size={32} />
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="flex flex-1 flex-col p-4">
                  {product.category && (
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{product.category}</p>
                  )}
                  <Link to={`/products/${id}`}>
                    <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900 hover:text-indigo-600 transition">
                      {name}
                    </h3>
                  </Link>
                  {product.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-400">{product.description}</p>
                  )}

                  <div className="mt-auto pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-base font-bold text-slate-900">
                        ₹{Number(price).toLocaleString('en-IN')}
                      </span>
                      {product.discount > 0 && (
                        <span className="text-xs font-semibold text-emerald-600">{product.discount}% off</span>
                      )}
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                      <ShoppingCart size={15} />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
