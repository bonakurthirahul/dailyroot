import { useMemo, useState } from 'react'
import { CategoryTabs } from './CategoryTabs'
import { MenuItemCard } from './MenuItemCard'
import { ItemDetailDialog } from './ItemDetailDialog'
import { useMenuData } from './useMenuData'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { useCart } from '../cart/context'
import { useToast } from '../toast/context'
import type { CartLine, MenuTreeItem } from '../../types/db'

interface MenuBrowserProps {
  tableLabel?: string | null
  emptyHint?: string
}

export function MenuBrowser({ tableLabel, emptyHint }: MenuBrowserProps) {
  const { status, items, categories, error, reload } = useMenuData()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<MenuTreeItem | null>(null)
  const { addLine } = useCart()
  const { notify } = useToast()

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter((item) => {
      if (activeCategory && item.category_id !== activeCategory) return false
      if (!query) return true
      return (
        item.name.toLowerCase().includes(query) ||
        (item.description ?? '').toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    })
  }, [items, activeCategory, search])

  function handleAdd(line: CartLine) {
    addLine(line)
    notify(`${line.name} added to cart`, 'success')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <label className="relative block">
          <span className="sr-only">Search the menu</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search coffee, snacks, desserts…"
            className="w-full rounded-full border border-coffee-600/20 bg-cream-50/90 py-3 pl-11 pr-4 text-sm text-espresso-900 outline-none transition focus:border-coffee-600"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-coffee-500"
          >
            ⌕
          </span>
        </label>
        {tableLabel ? (
          <p className="text-sm text-coffee-700">
            Ordering for <span className="font-semibold">{tableLabel}</span>
          </p>
        ) : null}
      </div>

      {status === 'ready' ? (
        <CategoryTabs
          categories={categories}
          activeId={activeCategory}
          onSelect={setActiveCategory}
        />
      ) : null}

      {status === 'loading' ? (
        <LoadingState label="Brewing the menu…" />
      ) : status === 'error' ? (
        <ErrorState
          title="We couldn't load the menu"
          description={error ?? undefined}
          onRetry={reload}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No items found"
          description={
            emptyHint ??
            'Try a different search term or category, or clear your filters.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <MenuItemCard key={item.id} item={item} onSelect={setSelectedItem} />
          ))}
        </div>
      )}

      <ItemDetailDialog
        item={selectedItem}
        open={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        onAdd={handleAdd}
      />
    </div>
  )
}
