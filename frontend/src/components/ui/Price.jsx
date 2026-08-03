import { cn, formatPrice, getOriginalPrice, calcDiscountPercent } from '../../lib/utils';

export function Price({ price, originalPrice, discount, size = 'md', className }) {
  const current = Number(price) || 0;
  const original = originalPrice ?? (discount ? getOriginalPrice({ price: current, discount }) : null);
  const discountPct = discount ?? (original ? calcDiscountPercent(current, original) : 0);

  const sizeClasses = {
    sm: { price: 'text-base', original: 'text-sm' },
    md: { price: 'text-lg', original: 'text-sm' },
    lg: { price: 'text-2xl', original: 'text-base' },
    xl: { price: 'text-3xl', original: 'text-lg' },
  };

  return (
    <div className={cn('flex flex-wrap items-baseline gap-2', className)}>
      <span className={cn('font-bold text-slate-900', sizeClasses[size].price)}>{formatPrice(current)}</span>
      {original && original > current && (
        <>
          <span className={cn('text-slate-400 line-through', sizeClasses[size].original)}>{formatPrice(original)}</span>
          {discountPct > 0 && <span className="text-sm font-semibold text-emerald-600">{discountPct}% off</span>}
        </>
      )}
    </div>
  );
}
