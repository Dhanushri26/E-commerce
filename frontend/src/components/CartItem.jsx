import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Price } from './ui/Price';
import { Button } from './ui/Button';
import { cn, formatPrice } from '../lib/utils';

export function CartItem({ item, onUpdateQuantity, onRemove }) {
  const key = item.productId ?? item.SK ?? item.id;
  const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
  const quantity = Number(item.quantity ?? 1);
  const lineTotal = unitPrice * quantity;
  const title = item.productTitle ?? item.name ?? 'Product';

  return (
    <div
      id={`cart-item-${key}`}
      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
    >
      <Link to={`/products/${key}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {item.image ? (
          <img src={item.image} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <ShoppingBag size={28} />
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link to={`/products/${key}`}>
          <h3 className="truncate text-base font-semibold text-slate-900 hover:text-indigo-600">{title}</h3>
        </Link>
        <p className="mt-1 text-sm text-slate-500">{formatPrice(unitPrice)} each</p>

        <div className="mt-3 flex items-center gap-2">
          <button
            id={`cart-dec-${key}`}
            onClick={() => onUpdateQuantity(key, Math.max(1, quantity - 1))}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50"
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span className="min-w-[2rem] text-center text-sm font-semibold">{quantity}</span>
          <button
            id={`cart-inc-${key}`}
            onClick={() => onUpdateQuantity(key, quantity + 1)}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50"
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <p className="text-lg font-bold text-slate-900">{formatPrice(lineTotal)}</p>
        <button
          id={`cart-remove-${key}`}
          onClick={() => onRemove(key)}
          className={cn('inline-flex items-center gap-1.5 text-sm text-red-600 transition hover:text-red-700')}
        >
          <Trash2 size={14} />
          Remove
        </button>
      </div>
    </div>
  );
}
