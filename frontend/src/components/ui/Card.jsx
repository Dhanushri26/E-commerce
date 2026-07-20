import { cn } from '../../lib/utils'

export function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white shadow-sm',
        hover && 'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }) {
  return <div className={cn('p-6 pb-0', className)}>{children}</div>
}

export function CardContent({ children, className }) {
  return <div className={cn('p-6', className)}>{children}</div>
}

export function CardFooter({ children, className }) {
  return <div className={cn('border-t border-slate-100 p-6 pt-4', className)}>{children}</div>
}
