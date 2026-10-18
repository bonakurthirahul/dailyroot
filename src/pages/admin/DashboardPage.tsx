import { Link } from 'react-router-dom'
import { StatCard } from '../../components/ui/StatCard'
import { LoadingState } from '../../components/ui/LoadingState'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import { OrderStatusBadge } from '../../components/ui/OrderStatusBadge'
import { useOrders } from '../../features/admin/useOrders'
import { buildReport } from '../../services/admin'
import { formatCurrency, relativeTime, formatDateInput } from '../../lib/format'
import { isTerminalStatus } from '../../lib/orders'

export function DashboardPage() {
  const { status, orders, error, reload } = useOrders()

  if (status === 'loading') return <LoadingState label="Loading dashboard…" />
  if (status === 'error')
    return (
      <ErrorState
        title="Couldn't load dashboard"
        description={error ?? undefined}
        onRetry={reload}
      />
    )

  const today = formatDateInput()
  const report = buildReport(orders, { from: today, to: today })
  const activeOrders = orders.filter(
    (order) => !isTerminalStatus(order.status),
  )
  const pendingPayments = orders.filter(
    (order) =>
      order.status !== 'cancelled' && order.payment_status !== 'paid',
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-espresso-900">Dashboard</h1>
        <p className="text-sm text-coffee-700">
          Today at a glance · {activeOrders.length} active order
          {activeOrders.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Orders today"
          value={report.orderCount}
          hint={`${report.cancelledOrders} cancelled`}
        />
        <StatCard
          label="Sales today"
          value={formatCurrency(report.grossSales)}
          tone="accent"
        />
        <StatCard
          label="Paid"
          value={formatCurrency(report.paidSales)}
          hint={`${formatCurrency(report.pendingPayments)} pending`}
        />
        <StatCard
          label="Avg. order"
          value={formatCurrency(report.averageOrderValue)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-espresso-900">
              Active orders
            </h2>
            <Link
              to="/admin/orders"
              className="text-sm font-medium text-coffee-700 hover:underline"
            >
              View all
            </Link>
          </div>
          {activeOrders.length === 0 ? (
            <EmptyState
              title="No active orders"
              description="New orders will appear here the moment guests place them."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {activeOrders.slice(0, 6).map((order) => (
                <li key={order.id}>
                  <Link
                    to={`/admin/orders/${order.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-4 shadow-card transition hover:border-coffee-600/40"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-espresso-900">
                        {order.reference}
                      </span>
                      <span className="text-xs text-coffee-600">
                        {order.table_label ?? 'Counter'} ·{' '}
                        {relativeTime(order.placed_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-coffee-700">
                        {formatCurrency(order.total)}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-xl text-espresso-900">
            Payment follow-ups
          </h2>
          {pendingPayments.length === 0 ? (
            <EmptyState
              title="All settled"
              description="No outstanding payments right now."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {pendingPayments.slice(0, 6).map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-caramel-500/30 bg-caramel-400/10 p-4"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-espresso-900">
                      {order.reference}
                    </span>
                    <span className="text-xs text-coffee-600">
                      {order.table_label ?? 'Counter'}
                    </span>
                  </div>
                  <Link
                    to={`/admin/orders/${order.id}`}
                    className="text-sm font-medium text-coffee-700 hover:underline"
                  >
                    Manage
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
