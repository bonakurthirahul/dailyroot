import type { Category } from '../../types/db'
import { cn } from '../../lib/cn'

interface CategoryTabsProps {
  categories: Category[]
  activeId: string | null
  onSelect: (id: string | null) => void
}

export function CategoryTabs({
  categories,
  activeId,
  onSelect,
}: CategoryTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Menu categories"
      className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeId === null}
        onClick={() => onSelect(null)}
        className={cn(
          'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition',
          activeId === null
            ? 'bg-espresso-900 text-cream-50'
            : 'bg-cream-50/80 text-coffee-700 hover:bg-cream-200',
        )}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          role="tab"
          aria-selected={activeId === category.id}
          onClick={() => onSelect(category.id)}
          className={cn(
            'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition',
            activeId === category.id
              ? 'bg-espresso-900 text-cream-50'
              : 'bg-cream-50/80 text-coffee-700 hover:bg-cream-200',
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}
