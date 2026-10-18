import { Button } from './Button'
import { cn } from '../../lib/cn'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this content. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-berry-500/25 bg-berry-500/5 px-6 py-14 text-center',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-full bg-berry-500/15 text-xl text-berry-500"
      >
        !
      </div>
      <h3 className="font-display text-xl text-espresso-900">{title}</h3>
      <p className="max-w-md text-sm text-coffee-700/80">{description}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}
