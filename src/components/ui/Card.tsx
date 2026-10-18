import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-coffee-600/10 bg-cream-50/90 shadow-card backdrop-blur-sm',
        className,
      )}
      {...rest}
    />
  )
}
