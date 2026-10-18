import { Badge } from '../../components/ui/Badge'
import { ItemImage } from '../../components/ui/ItemImage'
import { formatCurrency } from '../../lib/format'
import type { MenuTreeItem } from '../../types/db'
import { cn } from '../../lib/cn'

interface MenuItemCardProps {
  item: MenuTreeItem
  onSelect: (item: MenuTreeItem) => void
}

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
  const hasVariants = item.variants.length > 1
  const displayPrice = item.base_price
  const soldOut = !item.is_available

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border border-coffee-600/10 bg-cream-50/90 shadow-card transition',
        !soldOut && 'hover:-translate-y-0.5 hover:shadow-float',
      )}
    >
      <button
        type="button"
        onClick={() => !soldOut && onSelect(item)}
        disabled={soldOut}
        aria-label={`${item.name}, ${formatCurrency(displayPrice)}`}
        className="relative block aspect-[4/3] w-full overflow-hidden text-left disabled:cursor-not-allowed"
      >
        <ItemImage src={item.image_url} name={item.name} />
        {item.is_featured && !soldOut ? (
          <span className="absolute left-3 top-3">
            <Badge tone="coffee">Featured</Badge>
          </span>
        ) : null}
        {soldOut ? (
          <span className="absolute inset-0 flex items-center justify-center bg-espresso-950/60 text-sm font-semibold uppercase tracking-widest text-cream-100">
            Sold out
          </span>
        ) : null}
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg leading-snug text-espresso-900">
            {item.name}
          </h3>
          <span className="shrink-0 text-sm font-semibold text-coffee-700">
            {hasVariants ? 'from ' : ''}
            {formatCurrency(displayPrice)}
          </span>
        </div>
        {item.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-coffee-700/80">
            {item.description}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} tone="muted">
                {tag}
              </Badge>
            ))}
          </div>
          <button
            type="button"
            disabled={soldOut}
            onClick={() => onSelect(item)}
            className="rounded-full bg-espresso-900 px-4 py-1.5 text-xs font-semibold text-cream-50 transition hover:bg-espresso-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {soldOut ? 'Unavailable' : 'Add'}
          </button>
        </div>
      </div>
    </article>
  )
}
