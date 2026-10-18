import { useNavigate } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { SectionHeading } from '../components/ui/SectionHeading'
import { ItemImage } from '../components/ui/ItemImage'
import { formatCurrency } from '../lib/format'
import { useMenuData } from '../features/menu/useMenuData'
import { ItemDetailDialog } from '../features/menu/ItemDetailDialog'
import { useCart } from '../features/cart/context'
import { useToast } from '../features/toast/context'
import { useState } from 'react'
import type { CartLine, MenuTreeItem } from '../types/db'

const steps = [
  {
    title: 'Scan your table QR',
    body: 'Each table has a unique code. Scanning opens this menu with your table already selected.',
  },
  {
    title: 'Build your order',
    body: 'Choose sizes, milk, add-ons and note any special requests. Your cart updates instantly.',
  },
  {
    title: 'Pay your way',
    body: 'Pay by UPI or simply pay at the counter. Your order reaches the kitchen the moment you confirm.',
  },
  {
    title: 'Track in real time',
    body: 'Watch your order move from pending to preparing to served — no waiting around.',
  },
]

export function HomePage() {
  const navigate = useNavigate()
  const { status, items } = useMenuData()
  const { addLine } = useCart()
  const { notify } = useToast()
  const [selectedItem, setSelectedItem] = useState<MenuTreeItem | null>(null)

  const featured = items.filter((item) => item.is_featured).slice(0, 3)

  function handleAdd(line: CartLine) {
    addLine(line)
    notify(`${line.name} added to cart`, 'success')
  }

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden">
        <Container className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <Badge tone="caramel" className="w-fit">
              Scan · Order · Pay
            </Badge>
            <h1 className="font-display text-4xl leading-[1.05] text-espresso-900 sm:text-5xl lg:text-6xl">
              Your table-side cafe, reimagined for a&nbsp;premium experience.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-coffee-700/90">
              Skip the queue. Browse a curated menu, customise every cup and
              place your order from your phone — with live updates from our
              kitchen to your table.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate('/menu')}>
                Explore the menu
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/menu')}
              >
                I have a table QR
              </Button>
            </div>
            <dl className="mt-2 grid max-w-lg grid-cols-3 gap-4">
              {[
                ['4 min', 'Average order'],
                ['100%', 'Made to order'],
                ['UPI & cash', 'Flexible payment'],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="font-display text-2xl text-espresso-900">
                    {value}
                  </dt>
                  <dd className="text-xs uppercase tracking-wide text-coffee-500">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              {featured.length > 0
                ? featured.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className={`overflow-hidden rounded-2xl border border-coffee-600/10 shadow-card ${
                        index === 0 ? 'col-span-2 aspect-[16/10]' : 'aspect-square'
                      }`}
                    >
                      <ItemImage src={item.image_url} name={item.name} />
                    </button>
                  ))
                : status === 'ready'
                  ? [
                      'Latte',
                      'Cold Brew',
                      'Croissant',
                      'Tiramisu',
                    ].map((name) => (
                      <div
                        key={name}
                        className="aspect-square overflow-hidden rounded-2xl border border-coffee-600/10 shadow-card"
                      >
                        <ItemImage src={null} name={name} />
                      </div>
                    ))
                  : (
                    <>
                      <div className="col-span-2 aspect-[16/10] animate-pulse rounded-2xl bg-cream-200" />
                      <div className="aspect-square animate-pulse rounded-2xl bg-cream-200" />
                      <div className="aspect-square animate-pulse rounded-2xl bg-cream-200" />
                    </>
                  )}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-cream-50/60 py-14 sm:py-16">
        <Container className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="How it works"
            title="From scan to sip in four steps"
            description="A calm, mobile-first flow designed for busy service hours."
            align="center"
          />
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex flex-col gap-3 rounded-2xl border border-coffee-600/10 bg-cream-50 p-5 shadow-card"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-espresso-900 font-display text-cream-50">
                  {index + 1}
                </span>
                <h3 className="font-display text-lg text-espresso-900">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-coffee-700/80">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {featured.length > 0 ? (
        <section className="py-14 sm:py-16">
          <Container className="flex flex-col gap-8">
            <SectionHeading
              eyebrow="Guest favourites"
              title="Signature picks from our counter"
              description="A taste of what is waiting for you at the table."
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className="flex flex-col overflow-hidden rounded-2xl border border-coffee-600/10 bg-cream-50/90 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-float"
                >
                  <span className="block aspect-[4/3] overflow-hidden">
                    <ItemImage src={item.image_url} name={item.name} />
                  </span>
                  <span className="flex flex-col gap-1 p-4">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-display text-lg text-espresso-900">
                        {item.name}
                      </span>
                      <span className="text-sm font-semibold text-coffee-700">
                        {formatCurrency(item.base_price)}
                      </span>
                    </span>
                    <span className="line-clamp-2 text-sm text-coffee-700/80">
                      {item.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <section className="pb-16">
        <Container>
          <div className="flex flex-col items-center gap-5 rounded-3xl bg-espresso-900 px-6 py-12 text-center text-cream-100 shadow-float sm:px-12">
            <h2 className="max-w-2xl font-display text-3xl sm:text-4xl">
              Ready to order from your table?
            </h2>
            <p className="max-w-xl text-sm text-cream-200/80 sm:text-base">
              Scan the QR on your table or browse the menu to get started.
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/menu')}
            >
              Start your order
            </Button>
          </div>
        </Container>
      </section>

      <ItemDetailDialog
        item={selectedItem}
        open={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        onAdd={handleAdd}
      />
    </div>
  )
}
