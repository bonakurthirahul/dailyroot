import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-coffee-600/25 bg-cream-50/60 px-6 py-14 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="flex size-12 items-center justify-center rounded-full bg-cream-200 text-coffee-600">
          {icon}
        </div>
      ) : null}
      <h3 className="font-display text-xl text-espresso-900">{title}</h3>
      {description ? (
        <p className="max-w-md text-sm text-coffee-700/80">{description}</p>
      ) : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  )
}
