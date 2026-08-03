import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Rating({ value = 0, reviews, size = 'sm', showCount = true, className }) {
  const iconSize = size === 'lg' ? 20 : size === 'md' ? 16 : 14;

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5 text-amber-400">
        <Star size={iconSize} fill="currentColor" className="text-amber-400" />
        <span className={cn('font-semibold text-slate-800', size === 'lg' ? 'text-lg' : 'text-sm')}>
          {Number(value).toFixed(1)}
        </span>
      </div>
      {showCount && reviews != null && <span className="text-slate-500 text-sm">({reviews} reviews)</span>}
    </div>
  );
}
