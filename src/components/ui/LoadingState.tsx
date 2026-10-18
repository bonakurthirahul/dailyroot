import { cn } from '../../lib/cn'
import { Spinner } from './Spinner'

interface LoadingStateProps {
  label?: string
  className?: string
}

export function LoadingState({
  label = 'Loading…',
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-coffee-600/10 bg-cream-50/60 px-6 py-16 text-center',
        className,
      )}
    >
      <Spinner className="text-coffee-600" />
      <p className="text-sm font-medium text-coffee-700">{label}</p>
    </div>
  )
}
