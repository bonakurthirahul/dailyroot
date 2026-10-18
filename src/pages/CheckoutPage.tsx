import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { useCart } from '../features/cart/context'
import { useTableContext } from '../features/table/context'
import { useSettings } from '../features/settings/useSettings'
import { createOrder } from '../services/orders'
import { computeCartTotals } from '../lib/pricing'
import { formatCurrency } from '../lib/format'
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '../types/db'
import { cn } from '../lib/cn'

export function CheckoutPage() {
  const { lines, clear } = useCart()
  const { table, token } = useTableContext()
  const { settings } = useSettings()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('counter')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submittingRef = useRef(false)

  const totals = useMemo(
    () =>
      computeCartTotals(lines, {
        taxEnabled: settings?.tax_enabled ?? false,
        taxRate: settings?.tax_rate ?? 0,
      }),
    [lines, settings],
  )

  if (lines.length === 0) {
    return (
      <Container className="py-16">
        <EmptyState
          title="Nothing to check out"
          description="Your cart is empty. Add a few items first."
          action={<Button onClick={() => navigate('/menu')}>Browse menu</Button>}
        />
      </Container>
    )
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please tell us your name so we can call your order.')
      return
    }

    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    try {
      const result = await createOrder({
        table_token: token,
        customer_name: name.trim(),
        customer_phone: phone.trim() ? phone.trim() : null,
        notes: notes.trim() ? notes.trim() : null,
        payment_method: paymentMethod,
        items: lines.map((line) => ({
          menu_item_id: line.menu_item_id,
          variant_id: line.variant_id,
          option_ids: line.modifiers.map((modifier) => modifier.option_id),
          quantity: line.quantity,
          notes: line.notes,
        })),
      })
      clear()
      navigate(`/order/${result.tracking_token}?placed=1`)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'We could not place your order. Please try again.',
      )
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <Container className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[1.4fr_1fr]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <h1 className="font-display text-3xl text-espresso-900">Checkout</h1>

        {!table ? (
          <p className="rounded-xl border border-caramel-500/30 bg-caramel-400/10 px-4 py-3 text-sm text-espresso-800">
            No table selected. We'll prepare your order for the counter.
          </p>
        ) : (
          <p className="text-sm text-coffee-700">
            Delivering to{' '}
            <span className="font-semibold">{table.label}</span>
          </p>
        )}

        <div className="flex flex-col gap-4 rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-5 shadow-card">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-espresso-900">
              Your name <span className="text-berry-500">*</span>
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={60}
              placeholder="e.g. Ananya"
              className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-espresso-900">
              Phone (optional)
            </span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="tel"
              maxLength={20}
              placeholder="For order updates if you step away"
              className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-espresso-900">
              Order notes (optional)
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              maxLength={240}
              placeholder="Allergies, timing, or anything else we should know"
              className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
            />
          </label>
        </div>

        <fieldset className="flex flex-col gap-3 rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-5 shadow-card">
          <legend className="px-1 text-sm font-semibold text-espresso-900">
            Payment method
          </legend>
          {(['counter', 'upi'] as PaymentMethod[]).map((method) => (
            <label
              key={method}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition',
                paymentMethod === method
                  ? 'border-espresso-900 bg-cream-100'
                  : 'border-coffee-600/20 hover:border-coffee-600/50',
              )}
            >
              <input
                type="radio"
                name="payment-method"
                value={method}
                checked={paymentMethod === method}
                onChange={() => setPaymentMethod(method)}
                className="mt-1"
              />
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-espresso-900">
                  {PAYMENT_METHOD_LABELS[method]}
                </span>
                <span className="text-xs text-coffee-600">
                  {method === 'upi'
                    ? 'Pay by UPI. Your order stays pending until payment is verified by staff.'
                    : 'Place your order now and settle the bill at the counter.'}
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        {error ? (
          <p role="alert" className="text-sm font-medium text-berry-500">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" loading={submitting}>
          {submitting ? 'Placing order…' : 'Place order'}
        </Button>
      </form>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="flex flex-col gap-4 rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-5 shadow-card">
          <h2 className="font-display text-xl text-espresso-900">
            Order summary
          </h2>
          <ul className="flex flex-col gap-2 text-sm">
            {lines.map((line) => (
              <li key={line.uid} className="flex justify-between gap-3">
                <span className="text-coffee-700">
                  {line.quantity} × {line.name}
                  {line.variant_name ? ` (${line.variant_name})` : ''}
                </span>
                <span className="shrink-0 text-espresso-900">
                  {formatCurrency(line.unit_price * line.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="flex flex-col gap-2 border-t border-coffee-600/10 pt-3 text-sm">
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
            <div className="flex justify-between text-base font-semibold text-espresso-900">
              <dt>Total</dt>
              <dd>{formatCurrency(totals.total)}</dd>
            </div>
          </dl>
          <p className="text-xs text-coffee-500">
            Final totals are calculated securely on the server when your order
            is created.
          </p>
        </div>
      </aside>
    </Container>
  )
}
