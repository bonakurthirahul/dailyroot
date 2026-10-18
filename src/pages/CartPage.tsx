import { useNavigate } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ItemImage } from '../components/ui/ItemImage'
import { useCart } from '../features/cart/context'
import { useTableContext } from '../features/table/context'
import { useSettings } from '../features/settings/useSettings'
import { computeCartTotals } from '../lib/pricing'
import { formatCurrency } from '../lib/format'

export function CartPage() {
  const { lines, updateQuantity, removeLine, clear } = useCart()
  const { table } = useTableContext()
  const { settings } = useSettings()
  const navigate = useNavigate()

  const totals = computeCartTotals(lines, {
    taxEnabled: settings?.tax_enabled ?? false,
    taxRate: settings?.tax_rate ?? 0,
  })

  if (lines.length === 0) {
    return (
      <Container className="py-16">
        <EmptyState
          title="Your cart is empty"
          description="Add something delicious from the menu to get started."
          action={<Button onClick={() => navigate('/menu')}>Browse menu</Button>}
        />
      </Container>
    )
  }

  return (
    <Container className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[1.5fr_1fr]">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl text-espresso-900">Your cart</h1>
          <button
            type="button"
            onClick={clear}
            className="text-sm font-medium text-berry-500 hover:underline"
          >
            Clear cart
          </button>
        </div>

        {table ? (
          <p className="text-sm text-coffee-700">
            Ordering for{' '}
            <span className="font-semibold">{table.label}</span>
          </p>
        ) : (
          <p className="rounded-xl border border-caramel-500/30 bg-caramel-400/10 px-4 py-3 text-sm text-espresso-800">
            No table selected. You can still order, but scanning your table QR
            helps us deliver to you.
          </p>
        )}

        <ul className="flex flex-col gap-4">
          {lines.map((line) => (
            <li
              key={line.uid}
              className="flex gap-4 rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-3 shadow-card"
            >
              <div className="size-20 shrink-0 overflow-hidden rounded-xl">
                <ItemImage src={line.image_url} name={line.name} />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-espresso-900">
                      {line.name}
                    </h2>
                    {line.variant_name ? (
                      <p className="text-xs text-coffee-600">
                        {line.variant_name}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-sm font-semibold text-coffee-700">
                    {formatCurrency(line.unit_price * line.quantity)}
                  </span>
                </div>
                {line.modifiers.length > 0 ? (
                  <p className="text-xs text-coffee-600">
                    {line.modifiers
                      .map((modifier) => modifier.option_name)
                      .join(' · ')}
                  </p>
                ) : null}
                {line.notes ? (
                  <p className="text-xs italic text-coffee-500">
                    “{line.notes}”
                  </p>
                ) : null}
                <div className="mt-auto flex items-center justify-between pt-1">
                  <div className="flex items-center rounded-full border border-coffee-600/25">
                    <button
                      type="button"
                      aria-label={`Decrease ${line.name}`}
                      onClick={() => updateQuantity(line.uid, line.quantity - 1)}
                      className="px-3 py-1 text-lg text-espresso-800"
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-sm font-semibold">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`Increase ${line.name}`}
                      onClick={() => updateQuantity(line.uid, line.quantity + 1)}
                      className="px-3 py-1 text-lg text-espresso-800"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(line.uid)}
                    className="text-xs font-medium text-berry-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => navigate('/menu')}
        >
          ← Add more items
        </Button>
      </div>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="flex flex-col gap-4 rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-5 shadow-card">
          <h2 className="font-display text-xl text-espresso-900">
            Order summary
          </h2>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-coffee-700">
              <dt>Subtotal</dt>
              <dd>{formatCurrency(totals.subtotal)}</dd>
            </div>
            {settings?.tax_enabled && totals.tax_total > 0 ? (
              <div className="flex justify-between text-coffee-700">
                <dt>
                  {settings.tax_label} ({settings.tax_rate}%)
                </dt>
                <dd>{formatCurrency(totals.tax_total)}</dd>
              </div>
            ) : null}
            <div className="mt-1 flex justify-between border-t border-coffee-600/10 pt-3 text-base font-semibold text-espresso-900">
              <dt>Total</dt>
              <dd>{formatCurrency(totals.total)}</dd>
            </div>
          </dl>
          <Button size="lg" onClick={() => navigate('/checkout')}>
            Proceed to checkout
          </Button>
          <p className="text-center text-xs text-coffee-500">
            Prices are confirmed securely when you place the order.
          </p>
        </div>
      </aside>
    </Container>
  )
}
