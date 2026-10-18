import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type BadgeTone = 'coffee' | 'caramel' | 'cream' | 'muted'

const toneStyles: Record<BadgeTone, string> = {
  coffee: 'bg-espresso-900 text-cream-50',
  caramel: 'bg-caramel-400/25 text-coffee-700',
  cream: 'bg-cream-200 text-espresso-800',
  muted: 'bg-cream-100 text-coffee-500',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

export function Badge({ tone = 'cream', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium tracking-wide',
        toneStyles[tone],
        className,
      )}
      {...rest}
    />
  )
}
