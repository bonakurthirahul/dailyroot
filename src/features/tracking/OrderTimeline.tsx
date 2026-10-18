import {
  ORDER_STATUS_LABELS,
  type OrderStatus,
  type OrderStatusEvent,
} from '../../types/db'
import { formatTime } from '../../lib/format'
import { cn } from '../../lib/cn'

const PROGRESS: OrderStatus[] = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'served',
]

const STAGE_HINT: Record<OrderStatus, string> = {
  pending: 'We have received your order.',
  accepted: 'The kitchen has accepted your order.',
  preparing: 'Your order is being prepared.',
  ready: 'Your order is ready and on its way.',
  served: 'Enjoy! Your order has been served.',
  cancelled: 'This order was cancelled.',
}

function latestEvent(
  events: OrderStatusEvent[],
  status: OrderStatus,
): OrderStatusEvent | undefined {
  return [...events].reverse().find((event) => event.status === status)
}

export function OrderTimeline({ order }: { order: { status: OrderStatus; events: OrderStatusEvent[]; placed_at: string } }) {
  if (order.status === 'cancelled') {
    const cancelled = latestEvent(order.events, 'cancelled')
    return (
      <div className="rounded-2xl border border-berry-500/25 bg-berry-500/5 p-5">
        <p className="font-semibold text-berry-500">Order cancelled</p>
        <p className="text-sm text-coffee-700">{STAGE_HINT.cancelled}</p>
        {cancelled ? (
          <p className="mt-1 text-xs text-coffee-500">
            {formatTime(cancelled.created_at)}
          </p>
        ) : null}
      </div>
    )
  }

  const currentIndex = PROGRESS.indexOf(order.status)

  return (
    <ol className="flex flex-col gap-0">
      {PROGRESS.map((stage, index) => {
        const event = latestEvent(order.events, stage)
        const isComplete = index < currentIndex
        const isCurrent = index === currentIndex
        const timestamp =
          stage === 'pending' && !event ? order.placed_at : event?.created_at
        return (
          <li key={stage} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold',
                  isComplete && 'border-emerald-600 bg-emerald-600 text-white',
                  isCurrent && 'border-espresso-900 bg-espresso-900 text-cream-50',
                  !isComplete && !isCurrent && 'border-coffee-600/25 text-coffee-400',
                )}
              >
                {isComplete ? '✓' : index + 1}
              </span>
              {index < PROGRESS.length - 1 ? (
                <span
                  className={cn(
                    'my-1 w-0.5 flex-1',
                    index < currentIndex ? 'bg-emerald-600' : 'bg-coffee-600/20',
                  )}
                />
              ) : null}
            </div>
            <div className="pb-6">
              <p
                className={cn(
                  'font-medium',
                  isCurrent ? 'text-espresso-900' : 'text-coffee-700',
                )}
              >
                {ORDER_STATUS_LABELS[stage]}
              </p>
              {isCurrent ? (
                <p className="text-sm text-coffee-600">{STAGE_HINT[stage]}</p>
              ) : null}
              {timestamp ? (
                <p className="text-xs text-coffee-500">{formatTime(timestamp)}</p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
