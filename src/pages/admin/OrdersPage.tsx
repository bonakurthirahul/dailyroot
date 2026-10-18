import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LoadingState } from '../../components/ui/LoadingState'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from '../../components/ui/OrderStatusBadge'
import { useOrders } from '../../features/admin/useOrders'
import { formatCurrency, formatTime } from '../../lib/format'
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from '../../types/db'

export function OrdersPage() {
  const { status, orders, error, reload } = useOrders()
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  const tableOptions = useMemo(() => {
    const labels = new Set<string>()
    orders.forEach((order) => {
      if (order.table_label) labels.add(order.table_label)
    })
    return [...labels].sort()
  }, [orders])

  const [tableFilter, setTableFilter] = useState('all')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false
      if (tableFilter !== 'all' && (order.table_label ?? '') !== tableFilter)
        return false
      if (dateFilter && order.placed_at.slice(0, 10) !== dateFilter) return false
      if (!query) return true
      return (
        order.reference.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query)
      )
    })
  }, [orders, statusFilter, tableFilter, dateFilter, search])

  if (status === 'loading') return <LoadingState label="Loading orders…" />
  if (status === 'error')
    return (
      <ErrorState
        title="Couldn't load orders"
        description={error ?? undefined}
        onRetry={reload}
      />
    )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-espresso-900">Orders</h1>
        <button
          type="button"
          onClick={reload}
          className="rounded-full border border-coffee-600/25 px-4 py-2 text-sm font-medium text-espresso-900 hover:bg-cream-200"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-coffee-500">
          Search
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Reference or name"
            className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2 text-sm normal-case text-espresso-900 outline-none focus:border-coffee-600"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-coffee-500">
          Status
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as OrderStatus | 'all')
            }
            className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2 text-sm normal-case text-espresso-900 outline-none focus:border-coffee-600"
          >
            <option value="all">All statuses</option>
            {ORDER_STATUSES.map((option) => (
              <option key={option} value={option}>
                {ORDER_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-coffee-500">
          Table
          <select
            value={tableFilter}
            onChange={(event) => setTableFilter(event.target.value)}
            className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2 text-sm normal-case text-espresso-900 outline-none focus:border-coffee-600"
          >
            <option value="all">All tables</option>
            {tableOptions.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-coffee-500">
          Date
          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2 text-sm normal-case text-espresso-900 outline-none focus:border-coffee-600"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No orders match your filters"
          description="Try clearing the filters or choosing a different date."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-coffee-600/10 bg-cream-50/90 shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-200/60 text-xs uppercase tracking-wide text-coffee-600">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="hidden px-4 py-3 sm:table-cell">Table</th>
                <th className="hidden px-4 py-3 md:table-cell">Customer</th>
                <th className="hidden px-4 py-3 lg:table-cell">Time</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 sm:table-cell">Payment</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  className="border-t border-coffee-600/10 hover:bg-cream-100/60"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="font-semibold text-espresso-900 hover:underline"
                    >
                      {order.reference}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-coffee-700 sm:table-cell">
                    {order.table_label ?? 'Counter'}
                  </td>
                  <td className="hidden px-4 py-3 text-coffee-700 md:table-cell">
                    {order.customer_name}
                  </td>
                  <td className="hidden px-4 py-3 text-coffee-600 lg:table-cell">
                    {formatTime(order.placed_at)}
                  </td>
                  <td className="px-4 py-3 font-medium text-espresso-900">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <PaymentStatusBadge status={order.payment_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
