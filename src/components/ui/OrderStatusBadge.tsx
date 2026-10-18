import {
  ORDER_STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
  PAYMENT_STATUS_LABELS,
} from '../../types/db'
import { cn } from '../../lib/cn'

const statusStyles: Record<OrderStatus, string> = {
  pending: 'bg-caramel-400/25 text-coffee-700',
  accepted: 'bg-sky-100 text-sky-800',
  preparing: 'bg-amber-100 text-amber-800',
  ready: 'bg-emerald-100 text-emerald-800',
  served: 'bg-cream-200 text-espresso-800',
  cancelled: 'bg-berry-500/15 text-berry-500',
}

const paymentStyles: Record<PaymentStatus, string> = {
  unpaid: 'bg-cream-200 text-espresso-700',
  pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  refunded: 'bg-cream-200 text-espresso-700',
  failed: 'bg-berry-500/15 text-berry-500',
}

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        statusStyles[status],
        className,
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  )
}

export function PaymentStatusBadge({
  status,
  className,
}: {
  status: PaymentStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        paymentStyles[status],
        className,
      )}
    >
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  )
}
