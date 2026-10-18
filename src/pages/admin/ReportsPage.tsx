import { useMemo, useState } from 'react'
import { StatCard } from '../../components/ui/StatCard'
import { LoadingState } from '../../components/ui/LoadingState'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import { useOrders } from '../../features/admin/useOrders'
import { buildReport } from '../../services/admin'
import { formatCurrency, formatDateInput } from '../../lib/format'

export function ReportsPage() {
  const { status, orders, error, reload } = useOrders()
  const [from, setFrom] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 6)
    return formatDateInput(date)
  })
  const [to, setTo] = useState(() => formatDateInput())

  const report = useMemo(
    () => buildReport(orders, { from, to }),
    [orders, from, to],
  )

  if (status === 'loading') return <LoadingState label="Building reports…" />
  if (status === 'error')
    return <ErrorState description={error ?? undefined} onRetry={reload} />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl text-espresso-900">Sales reports</h1>
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-coffee-500">
            From
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2 text-sm normal-case text-espresso-900 outline-none focus:border-coffee-600"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-coffee-500">
            To
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2 text-sm normal-case text-espresso-900 outline-none focus:border-coffee-600"
            />
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Orders" value={report.orderCount} hint={`${report.cancelledOrders} cancelled`} />
        <StatCard label="Gross sales" value={formatCurrency(report.grossSales)} tone="accent" />
        <StatCard label="Paid" value={formatCurrency(report.paidSales)} />
        <StatCard label="Outstanding" value={formatCurrency(report.pendingPayments)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-5 shadow-card">
          <h2 className="mb-3 font-display text-xl text-espresso-900">
            Top items
          </h2>
          {report.topItems.length === 0 ? (
            <p className="text-sm text-coffee-600">
              No sales in this period.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-coffee-500">
                <tr>
                  <th className="py-2">Item</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {report.topItems.map((item) => (
                  <tr key={item.name} className="border-t border-coffee-600/10">
                    <td className="py-2 text-espresso-900">{item.name}</td>
                    <td className="py-2 text-right text-coffee-700">
                      {item.quantity}
                    </td>
                    <td className="py-2 text-right font-medium text-espresso-900">
                      {formatCurrency(item.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-5 shadow-card">
          <h2 className="mb-3 font-display text-xl text-espresso-900">
            Daily totals
          </h2>
          {report.byDay.length === 0 ? (
            <EmptyState
              title="No data"
              description="Adjust the date range to see daily totals."
              className="border-0 bg-transparent py-6"
            />
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-coffee-500">
                <tr>
                  <th className="py-2">Date</th>
                  <th className="py-2 text-right">Orders</th>
                  <th className="py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {report.byDay.map((day) => (
                  <tr key={day.date} className="border-t border-coffee-600/10">
                    <td className="py-2 text-espresso-900">{day.date}</td>
                    <td className="py-2 text-right text-coffee-700">
                      {day.orders}
                    </td>
                    <td className="py-2 text-right font-medium text-espresso-900">
                      {formatCurrency(day.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  )
}
