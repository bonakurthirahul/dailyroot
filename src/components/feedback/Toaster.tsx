import { useToast, type ToastTone } from '../../features/toast/context'
import { cn } from '../../lib/cn'

const toneStyles: Record<ToastTone, string> = {
  success: 'border-emerald-600/30 bg-emerald-50 text-emerald-900',
  error: 'border-berry-500/30 bg-red-50 text-red-900',
  info: 'border-coffee-600/25 bg-cream-50 text-espresso-900',
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end"
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismiss(toast.id)}
          className={cn(
            'pointer-events-auto w-full max-w-sm rounded-xl border px-4 py-3 text-left text-sm font-medium shadow-float transition',
            toneStyles[toast.tone],
          )}
        >
          {toast.message}
        </button>
      ))}
    </div>
  )
}
