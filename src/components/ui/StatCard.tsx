import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface StatCardProps {
  label: string
  value: ReactNode
  hint?: string
  tone?: 'default' | 'accent'
  className?: string
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-2xl border p-5 shadow-card',
        tone === 'accent'
          ? 'border-espresso-900 bg-espresso-900 text-cream-100'
          : 'border-coffee-600/10 bg-cream-50/90 text-espresso-900',
        className,
      )}
    >
      <span
        className={cn(
          'text-xs font-medium uppercase tracking-wide',
          tone === 'accent' ? 'text-cream-300/70' : 'text-coffee-500',
        )}
      >
        {label}
      </span>
      <span className="font-display text-3xl">{value}</span>
      {hint ? (
        <span
          className={cn(
            'text-xs',
            tone === 'accent' ? 'text-cream-300/60' : 'text-coffee-500',
          )}
        >
          {hint}
        </span>
      ) : null}
    </div>
  )
}
