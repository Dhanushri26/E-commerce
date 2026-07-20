import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Eye, ShoppingCart } from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Rating } from './ui/Rating'
import { Price } from './ui/Price'
import { cn } from '../lib/utils'

export function ProductCard({
  product,
  onAddToCart,
  onAddToWishlist,
  isWishlisted = false,
  className,
}) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const id = product.id ?? product.productId
  const name = product.name ?? product.title ?? 'Product'
  const price = product.price ?? product.msrp ?? 0
  const image = product.image ?? product.imageUrl
  const inStock = (product.stock ?? 10) > 0
  const discount = product.discount ?? 0

  return (
    <motion.div
      layout
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm',
        'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
        className
      )}
    >
      <Link to={`/products/${id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
          {!imgLoaded && (
            <div className="absolute inset-0 skeleton-shimmer" />
          )}
          <img
            src={image}
            alt={name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={cn(
              'h-full w-full object-cover transition-transform duration-500 group-hover:scale-105',
              imgLoaded ? 'opacity-100' : 'opacity-0'
            )}
          />

          {discount > 0 && (
            <Badge variant="discount" className="absolute left-3 top-3">
              -{discount}%
            </Badge>
          )}
          {product.badge && (
            <Badge variant="primary" className="absolute left-3 top-3">
              {product.badge}
            </Badge>
          )}

          <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                onAddToWishlist?.(product)
              }}
              className={cn(
                'rounded-full bg-white/95 p-2.5 shadow-md backdrop-blur-sm transition-colors',
                isWishlisted ? 'text-red-500' : 'text-slate-600 hover:text-red-500'
              )}
              aria-label="Add to wishlist"
            >
              <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
            <Link
              to={`/products/${id}`}
              onClick={(e) => e.stopPropagation()}
              className="rounded-full bg-white/95 p-2.5 text-slate-600 shadow-md backdrop-blur-sm transition-colors hover:text-indigo-600"
              aria-label="Quick view"
            >
              <Eye size={16} />
            </Link>
          </div>

          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40">
              <Badge variant="outline" className="bg-white/90 text-slate-700">
                Out of Stock
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        {product.category && (
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {product.category}
          </p>
        )}
        <Link to={`/products/${id}`}>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900 transition-colors group-hover:text-indigo-600">
            {name}
          </h3>
        </Link>

        <div className="mt-2">
          <Rating value={product.rating ?? 4.5} reviews={product.reviews ?? 0} size="sm" />
        </div>

        <div className="mt-3 flex items-end justify-between gap-2">
          <Price price={price} discount={discount} size="sm" />
          <Badge
            variant={inStock ? 'success' : 'error'}
            className="shrink-0 text-[10px]"
          >
            {inStock ? 'In Stock' : 'Sold Out'}
          </Badge>
        </div>

        <Button
          size="sm"
          className="mt-4 w-full"
          disabled={!inStock}
          onClick={() => onAddToCart?.(product)}
        >
          <ShoppingCart size={14} />
          Add to Cart
        </Button>
      </div>
    </motion.div>
  )
}
