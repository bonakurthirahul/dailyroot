import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  listModifierGroups,
  removeModifierGroup,
  removeModifierOption,
  saveModifierGroup,
  saveModifierOption,
  type ModifierGroupDraft,
  type ModifierOptionDraft,
} from '../../services/admin'
import { useToast } from '../../features/toast/context'
import { formatCurrency } from '../../lib/format'
import type { ModifierGroup, ModifierOption } from '../../types/db'

type GroupWithOptions = ModifierGroup & { options: ModifierOption[] }

const emptyGroup = (order: number): ModifierGroupDraft => ({
  name: '',
  selection_type: 'single',
  is_required: false,
  min_select: 0,
  max_select: 1,
  sort_order: order,
})

export function ModifiersAdminPage() {
  const { notify } = useToast()
  const [groups, setGroups] = useState<GroupWithOptions[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [groupDraft, setGroupDraft] = useState<ModifierGroupDraft | null>(null)
  const [optionDraft, setOptionDraft] = useState<
    (ModifierOptionDraft & { groupName: string }) | null
  >(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setGroups(await listModifierGroups())
      setStatus('ready')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function saveGroup() {
    if (!groupDraft) return
    if (!groupDraft.name.trim()) {
      notify('Group name is required', 'error')
      return
    }
    setBusy(true)
    try {
      await saveModifierGroup(groupDraft)
      notify('Modifier group saved', 'success')
      setGroupDraft(null)
      await load()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Save failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function saveOption() {
    if (!optionDraft) return
    if (!optionDraft.name.trim()) {
      notify('Option name is required', 'error')
      return
    }
    setBusy(true)
    try {
      const { groupName: _groupName, ...payload } = optionDraft
      void _groupName
      await saveModifierOption(payload)
      notify('Option saved', 'success')
      setOptionDraft(null)
      await load()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Save failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function deleteGroup(group: GroupWithOptions) {
    if (!window.confirm(`Delete group "${group.name}" and its options?`)) return
    try {
      await removeModifierGroup(group.id)
      notify('Group deleted', 'success')
      await load()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Delete failed', 'error')
    }
  }

  async function deleteOption(option: ModifierOption) {
    if (!window.confirm(`Delete option "${option.name}"?`)) return
    try {
      await removeModifierOption(option.id)
      notify('Option deleted', 'success')
      await load()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Delete failed', 'error')
    }
  }

  if (status === 'loading') return <LoadingState label="Loading modifiers…" />
  if (status === 'error')
    return <ErrorState description={error ?? undefined} onRetry={load} />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-espresso-900">
            Modifier groups
          </h1>
          <p className="text-sm text-coffee-700">
            Reusable add-ons and choices shared across menu items.
          </p>
        </div>
        <Button
          onClick={() => setGroupDraft(emptyGroup(groups.length + 1))}
        >
          New group
        </Button>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="No modifier groups"
          description="Create groups like Milk choice, Size or Add-ons."
          action={
            <Button onClick={() => setGroupDraft(emptyGroup(1))}>
              New group
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex flex-col gap-3 rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-4 shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col">
                  <span className="font-display text-lg text-espresso-900">
                    {group.name}
                  </span>
                  <span className="flex flex-wrap items-center gap-1 text-xs text-coffee-500">
                    <Badge tone="muted">
                      {group.selection_type === 'single'
                        ? 'Single choice'
                        : 'Multiple'}
                    </Badge>
                    {group.is_required ? (
                      <Badge tone="caramel">Required</Badge>
                    ) : null}
                    {group.max_select != null ? (
                      <span>max {group.max_select}</span>
                    ) : null}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setGroupDraft({
                        id: group.id,
                        name: group.name,
                        selection_type: group.selection_type,
                        is_required: group.is_required,
                        min_select: group.min_select,
                        max_select: group.max_select,
                        sort_order: group.sort_order,
                      })
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteGroup(group)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <ul className="flex flex-col gap-1">
                {group.options.length === 0 ? (
                  <li className="text-xs text-coffee-500">No options yet.</li>
                ) : (
                  group.options.map((option) => (
                    <li
                      key={option.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-cream-100 px-3 py-1.5 text-sm"
                    >
                      <span className="text-espresso-800">
                        {option.name}
                        {option.price_delta > 0
                          ? ` · +${formatCurrency(option.price_delta)}`
                          : ''}
                        {!option.is_available ? ' (unavailable)' : ''}
                      </span>
                      <span className="flex gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setOptionDraft({
                              id: option.id,
                              group_id: option.group_id,
                              name: option.name,
                              price_delta: option.price_delta,
                              is_available: option.is_available,
                              sort_order: option.sort_order,
                              groupName: group.name,
                            })
                          }
                          className="text-xs text-coffee-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteOption(option)}
                          className="text-xs text-berry-500 hover:underline"
                        >
                          Delete
                        </button>
                      </span>
                    </li>
                  ))
                )}
              </ul>

              <Button
                size="sm"
                variant="outline"
                className="w-fit"
                onClick={() =>
                  setOptionDraft({
                    group_id: group.id,
                    name: '',
                    price_delta: 0,
                    is_available: true,
                    sort_order: group.options.length + 1,
                    groupName: group.name,
                  })
                }
              >
                Add option
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={groupDraft !== null}
        onClose={() => setGroupDraft(null)}
        title={groupDraft?.id ? 'Edit group' : 'New group'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setGroupDraft(null)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={saveGroup}>
              Save
            </Button>
          </div>
        }
      >
        {groupDraft ? (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-espresso-900">Name</span>
              <input
                value={groupDraft.name}
                onChange={(event) =>
                  setGroupDraft({ ...groupDraft, name: event.target.value })
                }
                placeholder="Milk choice"
                className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-espresso-900">Selection</span>
                <select
                  value={groupDraft.selection_type}
                  onChange={(event) =>
                    setGroupDraft({
                      ...groupDraft,
                      selection_type: event.target.value as 'single' | 'multiple',
                    })
                  }
                  className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
                >
                  <option value="single">Single choice</option>
                  <option value="multiple">Multiple</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-espresso-900">
                  Max selections
                </span>
                <input
                  type="number"
                  min={1}
                  value={groupDraft.max_select ?? 1}
                  onChange={(event) =>
                    setGroupDraft({
                      ...groupDraft,
                      max_select: Number(event.target.value),
                    })
                  }
                  className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={groupDraft.is_required}
                onChange={(event) =>
                  setGroupDraft({
                    ...groupDraft,
                    is_required: event.target.checked,
                    min_select: event.target.checked ? 1 : 0,
                  })
                }
              />
              <span className="font-medium text-espresso-900">Required</span>
            </label>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={optionDraft !== null}
        onClose={() => setOptionDraft(null)}
        title={
          optionDraft?.id
            ? `Edit option · ${optionDraft.groupName}`
            : `New option · ${optionDraft?.groupName ?? ''}`
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOptionDraft(null)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={saveOption}>
              Save
            </Button>
          </div>
        }
      >
        {optionDraft ? (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-espresso-900">Name</span>
              <input
                value={optionDraft.name}
                onChange={(event) =>
                  setOptionDraft({ ...optionDraft, name: event.target.value })
                }
                placeholder="Oat milk"
                className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-espresso-900">
                  Price delta (₹)
                </span>
                <input
                  type="number"
                  value={optionDraft.price_delta}
                  onChange={(event) =>
                    setOptionDraft({
                      ...optionDraft,
                      price_delta: Number(event.target.value),
                    })
                  }
                  className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
                />
              </label>
              <label className="flex items-center gap-2 pt-6 text-sm">
                <input
                  type="checkbox"
                  checked={optionDraft.is_available}
                  onChange={(event) =>
                    setOptionDraft({
                      ...optionDraft,
                      is_available: event.target.checked,
                    })
                  }
                />
                <span className="font-medium text-espresso-900">Available</span>
              </label>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
