import { cn } from '../../lib/utils';

const variants = {
  default: 'bg-slate-100 text-slate-700',
  primary: 'bg-indigo-100 text-indigo-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
  discount: 'bg-red-500 text-white',
  outline: 'border border-slate-200 bg-white text-slate-600',
};

export function Badge({ children, variant = 'default', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
