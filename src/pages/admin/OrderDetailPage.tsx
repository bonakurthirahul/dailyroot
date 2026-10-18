import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/LoadingState'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from '../../components/ui/OrderStatusBadge'
import {
  confirmPayment,
  fetchOrderById,
  subscribeOrders,
  updateOrderStatus,
} from '../../services/orders'
import { useAuth } from '../../features/auth/context'
import { useToast } from '../../features/toast/context'
import { availableTransitions, canTransition } from '../../lib/orders'
import { formatCurrency, formatDateTime } from '../../lib/format'
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type OrderStatus,
  type OrderWithItems,
} from '../../types/db'

function actionLabel(status: OrderStatus): string {
  switch (status) {
    case 'accepted':
      return 'Accept order'
    case 'preparing':
      return 'Start preparing'
    case 'ready':
      return 'Mark ready'
    case 'served':
      return 'Mark served'
    case 'cancelled':
      return 'Cancel order'
    default:
      return ORDER_STATUS_LABELS[status]
  }
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, can } = useAuth()
  const { notify } = useToast()
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound' | 'error'>(
    'loading',
  )
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const result = await fetchOrderById(id)
      if (!result) {
        setStatus('notfound')
        return
      }
      setOrder(result)
      setStatus('ready')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load order')
      setStatus('error')
    }
  }, [id])

  useEffect(() => {
    void load()
    const unsubscribe = subscribeOrders(() => {
      void load()
    })
    return () => unsubscribe()
  }, [load])

  async function handleStatus(next: OrderStatus) {
    if (!order) return
    if (!canTransition(order.status, next)) {
      notify('That status change is not allowed.', 'error')
      return
    }
    setBusy(true)
    try {
      await updateOrderStatus(order.id, next, {
        id: user?.id ?? null,
        name: user?.full_name ?? null,
      })
      notify(`Order marked ${ORDER_STATUS_LABELS[next]}`, 'success')
      await load()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Update failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirmPayment() {
    if (!order) return
    setBusy(true)
    try {
      await confirmPayment(order.id, {
        id: user?.id ?? null,
        name: user?.full_name ?? null,
      })
      notify('Payment marked as received', 'success')
      await load()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Update failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (status === 'loading') return <LoadingState label="Loading order…" />
  if (status === 'notfound')
    return (
      <EmptyState
        title="Order not found"
        description="This order may have been removed."
        action={
          <Link
            to="/admin/orders"
            className="rounded-full bg-espresso-900 px-5 py-2.5 text-sm font-medium text-cream-50"
          >
            Back to orders
          </Link>
        }
      />
    )
  if (status === 'error' || !order)
    return (
      <ErrorState
        title="Couldn't load order"
        description={error ?? undefined}
        onRetry={load}
      />
    )

  const transitions = can('update_orders')
    ? availableTransitions(order.status)
    : []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/admin/orders"
            className="text-sm text-coffee-600 hover:underline"
          >
            ← Back to orders
          </Link>
          <h1 className="font-display text-3xl text-espresso-900">
            {order.reference}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.payment_status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-5 shadow-card">
            <h2 className="mb-3 font-display text-xl text-espresso-900">
              Items
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
            <div className="mt-4 flex flex-col gap-1 border-t border-coffee-600/10 pt-3 text-sm">
              <div className="flex justify-between text-coffee-700">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.tax_total > 0 ? (
                <div className="flex justify-between text-coffee-700">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax_total)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-base font-semibold text-espresso-900">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-5 shadow-card">
            <h2 className="mb-3 font-display text-xl text-espresso-900">
              Status history
            </h2>
            {order.events.length === 0 ? (
              <p className="text-sm text-coffee-600">No events yet.</p>
            ) : (
              <ol className="flex flex-col gap-2 text-sm">
                {order.events.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-center justify-between gap-3 border-b border-coffee-600/5 pb-2 last:border-0"
                  >
                    <span className="font-medium text-espresso-900">
                      {ORDER_STATUS_LABELS[event.status]}
                    </span>
                    <span className="text-xs text-coffee-500">
                      {formatDateTime(event.created_at)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-5 shadow-card">
            <h2 className="mb-3 font-display text-xl text-espresso-900">
              Guest
            </h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-coffee-500">Name</dt>
                <dd className="font-medium text-espresso-900">
                  {order.customer_name}
                </dd>
              </div>
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
                <dt className="text-coffee-500">Method</dt>
                <dd className="font-medium text-espresso-900">
                  {PAYMENT_METHOD_LABELS[order.payment_method]}
                </dd>
              </div>
              {order.customer_phone ? (
                <div className="col-span-2">
                  <dt className="text-coffee-500">Phone</dt>
                  <dd className="font-medium text-espresso-900">
                    {order.customer_phone}
                  </dd>
                </div>
              ) : null}
            </dl>
            {order.notes ? (
              <p className="mt-3 rounded-xl bg-cream-100 px-3 py-2 text-sm text-coffee-700">
                {order.notes}
              </p>
            ) : null}
          </section>

          {can('update_orders') ? (
            <section className="rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-5 shadow-card">
              <h2 className="mb-3 font-display text-xl text-espresso-900">
                Actions
              </h2>
              {transitions.length === 0 ? (
                <p className="text-sm text-coffee-600">
                  No further actions for a {ORDER_STATUS_LABELS[order.status].toLowerCase()} order.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {transitions.map((next) => (
                    <Button
                      key={next}
                      variant={next === 'cancelled' ? 'outline' : 'primary'}
                      disabled={busy}
                      onClick={() => handleStatus(next)}
                    >
                      {actionLabel(next)}
                    </Button>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {can('manage_payments') && order.payment_status !== 'paid' ? (
            <section className="rounded-2xl border border-caramel-500/30 bg-caramel-400/10 p-5">
              <h2 className="mb-2 font-display text-lg text-espresso-900">
                Payment
              </h2>
              <p className="mb-3 text-xs text-espresso-800">
                Confirm only after you have verified the payment was received.
                {order.payment_method === 'upi'
                  ? ' UPI transfers must be checked in your bank or UPI app — a screenshot is not proof.'
                  : ''}
              </p>
              <Button disabled={busy} onClick={handleConfirmPayment}>
                Mark payment received
              </Button>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}
