import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from '../components/ui/OrderStatusBadge'
import { OrderTimeline } from '../features/tracking/OrderTimeline'
import { useTrackedOrder } from '../features/tracking/useTrackedOrder'
import { formatCurrency, formatDateTime } from '../lib/format'
import { PAYMENT_METHOD_LABELS } from '../types/db'

export function OrderTrackingPage() {
  const { token } = useParams<{ token: string }>()
  const [searchParams] = useSearchParams()
  const justPlaced = searchParams.get('placed') === '1'
  const { status, order, error, reload } = useTrackedOrder(token)

  const totalModifiers = useMemo(
    () =>
      order?.items.reduce(
        (sum, item) => sum + item.modifiers.length,
        0,
      ) ?? 0,
    [order],
  )

  if (status === 'loading') {
    return (
      <Container className="py-16">
        <LoadingState label="Locating your order…" />
      </Container>
    )
  }

  if (status === 'notfound') {
    return (
      <Container className="py-16">
        <EmptyState
          title="We couldn't find that order"
          description="This tracking link is invalid or has expired. Check the link from your confirmation, or ask a staff member."
          action={
            <Link
              to="/menu"
              className="rounded-full bg-espresso-900 px-5 py-2.5 text-sm font-medium text-cream-50"
            >
              Back to menu
            </Link>
          }
        />
      </Container>
    )
  }

  if (status === 'error' || !order) {
    return (
      <Container className="py-16">
        <ErrorState
          title="We couldn't load your order"
          description={error ?? undefined}
          onRetry={reload}
        />
      </Container>
    )
  }

  return (
    <Container className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col gap-6">
        {justPlaced ? (
          <div className="rounded-2xl border border-emerald-600/25 bg-emerald-50/80 px-5 py-4">
            <p className="font-semibold text-emerald-900">
              Order placed successfully
            </p>
            <p className="text-sm text-emerald-900/75">
              Thank you, {order.customer_name}. We're on it.
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-coffee-500">
                Order reference
              </p>
              <p className="font-display text-2xl text-espresso-900">
                {order.reference}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.payment_status} />
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-coffee-500">Table</dt>
              <dd className="font-medium text-espresso-900">
                {order.table_label ?? 'Counter'}
              </dd>
            </div>
            <div>
              <dt className="text-coffee-500">Placed</dt>
              <dd className="font-medium text-espresso-900">
                {formatDateTime(order.placed_at)}
              </dd>
            </div>
            <div>
              <dt className="text-coffee-500">Payment</dt>
              <dd className="font-medium text-espresso-900">
                {PAYMENT_METHOD_LABELS[order.payment_method]}
              </dd>
            </div>
            <div>
              <dt className="text-coffee-500">Total</dt>
              <dd className="font-medium text-espresso-900">
                {formatCurrency(order.total)}
              </dd>
            </div>
          </dl>
          {order.payment_method === 'upi' && order.payment_status !== 'paid' ? (
            <p className="rounded-xl border border-caramel-500/30 bg-caramel-400/10 px-4 py-3 text-xs text-espresso-800">
              UPI payment is pending verification by our staff. Your order is
              progressing regardless — we'll confirm payment at the counter.
            </p>
          ) : null}
        </div>

        {order.notes ? (
          <div className="rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-5 text-sm text-coffee-700 shadow-card">
            <p className="mb-1 text-xs uppercase tracking-wide text-coffee-500">
              Order notes
            </p>
            {order.notes}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-5 shadow-card">
          <h2 className="mb-4 font-display text-xl text-espresso-900">
            Order progress
          </h2>
          <OrderTimeline order={order} />
        </div>

        <div className="rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-5 shadow-card">
          <h2 className="mb-3 font-display text-xl text-espresso-900">
            Your items
          </h2>
          <ul className="flex flex-col gap-3 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <div>
                  <p className="font-medium text-espresso-900">
                    {item.quantity} × {item.name_snapshot}
                  </p>
                  {item.variant_name ? (
                    <p className="text-xs text-coffee-600">
                      {item.variant_name}
                    </p>
                  ) : null}
                  {item.modifiers.length > 0 ? (
                    <p className="text-xs text-coffee-600">
                      {item.modifiers
                        .map((modifier) => modifier.option_name)
                        .join(' · ')}
                    </p>
                  ) : null}
                  {item.notes ? (
                    <p className="text-xs italic text-coffee-500">
                      “{item.notes}”
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 text-espresso-900">
                  {formatCurrency(item.line_total)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-coffee-600/10 pt-3 text-base font-semibold text-espresso-900">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
          {totalModifiers > 0 ? (
            <p className="mt-2 text-xs text-coffee-500">
              Customisations included.
            </p>
          ) : null}
        </div>

        <Button variant="outline" onClick={reload}>
          Refresh status
        </Button>
        <p className="text-center text-xs text-coffee-500">
          This page updates automatically. Keep it open to follow your order.
        </p>
      </div>
    </Container>
  )
}
