import { cn } from '../../lib/utils';
import { Button } from './Button';

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, actionTo, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-16 text-center',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-400">
          <Icon size={32} strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p>}
      {actionLabel && onAction && (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description, onRetry, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 px-6 py-16 text-center',
        className
      )}
    >
      <h3 className="text-lg font-semibold text-red-800">{title}</h3>
      {description && <p className="mt-2 text-sm text-red-600">{description}</p>}
      {onRetry && (
        <Button variant="outline" className="mt-6 border-red-200" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
