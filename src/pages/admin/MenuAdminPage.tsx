import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import { ItemImage } from '../../components/ui/ItemImage'
import {
  listCategories,
  listMenuItems,
  listModifierGroups,
  removeMenuItem,
  saveMenuItem,
  setMenuItemAvailability,
  type MenuItemDraft,
} from '../../services/admin'
import { fetchMenuTree } from '../../services/menu'
import { useToast } from '../../features/toast/context'
import { formatCurrency } from '../../lib/format'
import type {
  Category,
  MenuItem,
  MenuTreeItem,
  ModifierGroup,
  ModifierOption,
} from '../../types/db'

type GroupWithOptions = ModifierGroup & { options: ModifierOption[] }

const emptyDraft = (categoryId: string): MenuItemDraft => ({
  category_id: categoryId,
  name: '',
  description: null,
  base_price: 0,
  is_available: true,
  is_featured: false,
  tags: [],
  sort_order: 0,
  variants: [],
  group_ids: [],
})

export function MenuAdminPage() {
  const { notify } = useToast()
  const [items, setItems] = useState<MenuItem[]>([])
  const [tree, setTree] = useState<MenuTreeItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [groups, setGroups] = useState<GroupWithOptions[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<MenuItemDraft | null>(null)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  const load = useCallback(async () => {
    try {
      const [itemsResult, categoriesResult, groupsResult, treeResult] =
        await Promise.all([
          listMenuItems(),
          listCategories(),
          listModifierGroups(),
          fetchMenuTree(),
        ])
      setItems(itemsResult)
      setCategories(categoriesResult)
      setGroups(groupsResult)
      setTree(treeResult)
      setStatus('ready')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load menu')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((category) => [category.id, category.name]))
    return (id: string) => map.get(id) ?? '—'
  }, [categories])

  const filtered = useMemo(
    () =>
      filter === 'all'
        ? items
        : items.filter((item) => item.category_id === filter),
    [items, filter],
  )

  async function handleSave() {
    if (!draft) return
    if (!draft.name.trim()) {
      notify('Item name is required', 'error')
      return
    }
    if (!draft.category_id) {
      notify('Choose a category', 'error')
      return
    }
    if (draft.base_price < 0) {
      notify('Price cannot be negative', 'error')
      return
    }
    setBusy(true)
    try {
      await saveMenuItem({
        ...draft,
        name: draft.name.trim(),
        variants: draft.variants.filter((variant) => variant.name.trim()),
      })
      notify('Menu item saved', 'success')
      setDraft(null)
      await load()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Save failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleToggle(item: MenuItem) {
    try {
      await setMenuItemAvailability(item.id, !item.is_available)
      await load()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Update failed', 'error')
    }
  }

  async function handleDelete(item: MenuItem) {
    if (!window.confirm(`Delete "${item.name}"?`)) return
    try {
      await removeMenuItem(item.id)
      notify('Item deleted', 'success')
      await load()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Delete failed', 'error')
    }
  }

  if (status === 'loading') return <LoadingState label="Loading menu…" />
  if (status === 'error')
    return <ErrorState description={error ?? undefined} onRetry={load} />

  const defaultCategory = categories[0]?.id ?? ''

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-espresso-900">Menu items</h1>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2 text-sm text-espresso-900 outline-none focus:border-coffee-600"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <Button
            disabled={categories.length === 0}
            onClick={() => setDraft(emptyDraft(defaultCategory))}
          >
            New item
          </Button>
        </div>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          title="Create a category first"
          description="Menu items belong to a category. Add a category, then create items."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No items yet"
          description="Add your first menu item to start selling."
          action={
            <Button onClick={() => setDraft(emptyDraft(defaultCategory))}>
              New item
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-coffee-600/10 bg-cream-50/90 shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-200/60 text-xs uppercase tracking-wide text-coffee-600">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="hidden px-4 py-3 sm:table-cell">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Availability</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-coffee-600/10 hover:bg-cream-100/60"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 shrink-0 overflow-hidden rounded-lg">
                        <ItemImage src={item.image_url} name={item.name} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-espresso-900">
                          {item.name}
                        </span>
                        {item.is_featured ? (
                          <Badge tone="caramel" className="w-fit">
                            Featured
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-coffee-700 sm:table-cell">
                    {categoryName(item.category_id)}
                  </td>
                  <td className="px-4 py-3 font-medium text-espresso-900">
                    {formatCurrency(item.base_price)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggle(item)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.is_available
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-berry-500/15 text-berry-500'
                      }`}
                    >
                      {item.is_available ? 'Available' : 'Sold out'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const node = tree.find(
                            (candidate) => candidate.id === item.id,
                          )
                          setDraft({
                            id: item.id,
                            category_id: item.category_id,
                            name: item.name,
                            description: item.description,
                            base_price: item.base_price,
                            is_available: item.is_available,
                            is_featured: item.is_featured,
                            tags: item.tags,
                            sort_order: item.sort_order,
                            variants:
                              node?.variants.map((variant) => ({
                                id: variant.id,
                                name: variant.name,
                                price_delta: variant.price_delta,
                              })) ?? [],
                            group_ids:
                              node?.modifier_groups.map(
                                (group) => group.id,
                              ) ?? [],
                          })
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Edit item' : 'New item'}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={handleSave}>
              Save item
            </Button>
          </div>
        }
      >
        {draft ? (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-espresso-900">Name</span>
                <input
                  value={draft.name}
                  onChange={(event) =>
                    setDraft({ ...draft, name: event.target.value })
                  }
                  className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-espresso-900">Category</span>
                <select
                  value={draft.category_id}
                  onChange={(event) =>
                    setDraft({ ...draft, category_id: event.target.value })
                  }
                  className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-espresso-900">Description</span>
              <textarea
                value={draft.description ?? ''}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    description: event.target.value || null,
                  })
                }
                rows={2}
                className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-espresso-900">
                  Base price (₹)
                </span>
                <input
                  type="number"
                  min={0}
                  value={draft.base_price}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      base_price: Number(event.target.value),
                    })
                  }
                  className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-espresso-900">
                  Sort order
                </span>
                <input
                  type="number"
                  value={draft.sort_order}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      sort_order: Number(event.target.value),
                    })
                  }
                  className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-espresso-900">
                  Tags (comma separated)
                </span>
                <input
                  value={draft.tags.join(', ')}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      tags: event.target.value
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    })
                  }
                  className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.is_available}
                  onChange={(event) =>
                    setDraft({ ...draft, is_available: event.target.checked })
                  }
                />
                <span className="font-medium text-espresso-900">Available</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.is_featured}
                  onChange={(event) =>
                    setDraft({ ...draft, is_featured: event.target.checked })
                  }
                />
                <span className="font-medium text-espresso-900">Featured</span>
              </label>
            </div>

            <section className="flex flex-col gap-2 rounded-xl border border-coffee-600/10 p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-espresso-900">
                  Variants (e.g. sizes)
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      variants: [
                        ...draft.variants,
                        { name: '', price_delta: 0 },
                      ],
                    })
                  }
                >
                  Add variant
                </Button>
              </div>
              {draft.variants.length === 0 ? (
                <p className="text-xs text-coffee-500">
                  No variants. Add one for sizes or portions.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {draft.variants.map((variant, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        value={variant.name}
                        placeholder="Regular"
                        onChange={(event) => {
                          const next = [...draft.variants]
                          next[index] = {
                            ...variant,
                            name: event.target.value,
                          }
                          setDraft({ ...draft, variants: next })
                        }}
                        className="flex-1 rounded-lg border border-coffee-600/20 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-coffee-600"
                      />
                      <input
                        type="number"
                        value={variant.price_delta}
                        onChange={(event) => {
                          const next = [...draft.variants]
                          next[index] = {
                            ...variant,
                            price_delta: Number(event.target.value),
                          }
                          setDraft({ ...draft, variants: next })
                        }}
                        className="w-24 rounded-lg border border-coffee-600/20 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-coffee-600"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            variants: draft.variants.filter(
                              (_, i) => i !== index,
                            ),
                          })
                        }
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="flex flex-col gap-2 rounded-xl border border-coffee-600/10 p-3">
              <h3 className="text-sm font-semibold text-espresso-900">
                Modifier groups
              </h3>
              {groups.length === 0 ? (
                <p className="text-xs text-coffee-500">
                  No modifier groups yet. Create them under Modifiers.
                </p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {groups.map((group) => {
                    const checked = draft.group_ids.includes(group.id)
                    return (
                      <label
                        key={group.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              group_ids: event.target.checked
                                ? [...draft.group_ids, group.id]
                                : draft.group_ids.filter(
                                    (id) => id !== group.id,
                                  ),
                            })
                          }
                        />
                        <span className="text-espresso-800">{group.name}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
