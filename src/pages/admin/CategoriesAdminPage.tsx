import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  listCategories,
  removeCategory,
  saveCategory,
  type CategoryDraft,
} from '../../services/admin'
import { useToast } from '../../features/toast/context'
import type { Category } from '../../types/db'

const emptyDraft: CategoryDraft = {
  name: '',
  description: null,
  sort_order: 0,
  is_active: true,
}

export function CategoriesAdminPage() {
  const { notify } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<CategoryDraft | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setCategories(await listCategories())
      setStatus('ready')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSave() {
    if (!draft) return
    if (!draft.name.trim()) {
      notify('Category name is required', 'error')
      return
    }
    setBusy(true)
    try {
      await saveCategory({ ...draft, name: draft.name.trim() })
      notify('Category saved', 'success')
      setDraft(null)
      await load()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Save failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(category: Category) {
    if (!window.confirm(`Delete "${category.name}"?`)) return
    try {
      await removeCategory(category.id)
      notify('Category deleted', 'success')
      await load()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Delete failed', 'error')
    }
  }

  if (status === 'loading') return <LoadingState label="Loading categories…" />
  if (status === 'error')
    return <ErrorState description={error ?? undefined} onRetry={load} />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-espresso-900">Categories</h1>
        <Button onClick={() => setDraft({ ...emptyDraft })}>New category</Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Create your first menu category to organise items."
          action={<Button onClick={() => setDraft({ ...emptyDraft })}>New category</Button>}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-4 shadow-card"
            >
              <div className="flex flex-col">
                <span className="flex items-center gap-2 font-semibold text-espresso-900">
                  {category.name}
                  {!category.is_active ? (
                    <Badge tone="muted">Hidden</Badge>
                  ) : null}
                </span>
                {category.description ? (
                  <span className="text-sm text-coffee-600">
                    {category.description}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-coffee-500">
                  Order {category.sort_order}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDraft({
                      id: category.id,
                      name: category.name,
                      description: category.description,
                      sort_order: category.sort_order,
                      is_active: category.is_active,
                    })
                  }
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(category)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Edit category' : 'New category'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={handleSave}>
              Save
            </Button>
          </div>
        }
      >
        {draft ? (
          <div className="flex flex-col gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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
              <label className="flex items-center gap-2 pt-6 text-sm">
                <input
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={(event) =>
                    setDraft({ ...draft, is_active: event.target.checked })
                  }
                />
                <span className="font-medium text-espresso-900">Visible</span>
              </label>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
