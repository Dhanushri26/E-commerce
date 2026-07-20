import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Input({
  label,
  icon: Icon,
  error,
  clearable,
  onClear,
  value,
  className,
  containerClassName,
  ...props
}) {
  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      )}
      <div className="group relative">
        {Icon && (
          <Icon
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600"
          />
        )}
        <input
          value={value}
          className={cn(
            'w-full rounded-xl border border-slate-200 bg-white py-3 text-sm text-slate-900',
            'outline-none transition-all placeholder:text-slate-400',
            'focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10',
            Icon ? 'pl-11 pr-4' : 'px-4',
            clearable && value ? 'pr-10' : '',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500/10',
            className
          )}
          {...props}
        />
        {clearable && value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Clear"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}
