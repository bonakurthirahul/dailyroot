import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  listStaff,
  removeStaff,
  saveStaff,
  type StaffDraft,
} from '../../services/admin'
import { isSupabaseConfigured } from '../../lib/env'
import { useToast } from '../../features/toast/context'
import { ROLE_LABELS, STAFF_ROLES, type StaffRole } from '../../types/db'

interface StaffRow {
  id: string
  full_name: string
  email: string
  role: StaffRole
  is_active: boolean
}

const emptyDraft: StaffDraft = {
  full_name: '',
  email: '',
  role: 'cashier',
  is_active: true,
  pin: '0000',
}

export function StaffAdminPage() {
  const { notify } = useToast()
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<StaffDraft | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setStaff(await listStaff())
      setStatus('ready')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load staff')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSave() {
    if (!draft) return
    if (!draft.full_name.trim() || !draft.email.trim()) {
      notify('Name and email are required', 'error')
      return
    }
    setBusy(true)
    try {
      await saveStaff({
        ...draft,
        full_name: draft.full_name.trim(),
        email: draft.email.trim(),
      })
      notify('Staff member saved', 'success')
      setDraft(null)
      await load()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Save failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(row: StaffRow) {
    if (!window.confirm(`Remove ${row.full_name}?`)) return
    try {
      await removeStaff(row.id)
      notify('Staff member removed', 'success')
      await load()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Delete failed', 'error')
    }
  }

  if (status === 'loading') return <LoadingState label="Loading staff…" />
  if (status === 'error')
    return <ErrorState description={error ?? undefined} onRetry={load} />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-espresso-900">Staff</h1>
          <p className="text-sm text-coffee-700">
            {isSupabaseConfigured
              ? 'Invite logins from the Supabase dashboard, then assign roles here.'
              : 'Demo mode — create and manage sample staff accounts.'}
          </p>
        </div>
        <Button onClick={() => setDraft({ ...emptyDraft })}>Add staff</Button>
      </div>

      {staff.length === 0 ? (
        <EmptyState
          title="No staff yet"
          description="Add your first staff member."
          action={<Button onClick={() => setDraft({ ...emptyDraft })}>Add staff</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {staff.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-4 shadow-card"
            >
              <div className="flex flex-col">
                <span className="font-semibold text-espresso-900">
                  {row.full_name}
                </span>
                <span className="text-xs text-coffee-600">{row.email}</span>
                <span className="mt-1 flex gap-2">
                  <Badge tone="cream">{ROLE_LABELS[row.role]}</Badge>
                  {!row.is_active ? <Badge tone="muted">Inactive</Badge> : null}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDraft({
                      id: row.id,
                      full_name: row.full_name,
                      email: row.email,
                      role: row.role,
                      is_active: row.is_active,
                      pin: '',
                    })
                  }
                >
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(row)}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Edit staff' : 'Add staff'}
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
              <span className="font-medium text-espresso-900">Full name</span>
              <input
                value={draft.full_name}
                onChange={(event) =>
                  setDraft({ ...draft, full_name: event.target.value })
                }
                className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-espresso-900">Email</span>
              <input
                type="email"
                value={draft.email}
                disabled={Boolean(draft.id)}
                onChange={(event) =>
                  setDraft({ ...draft, email: event.target.value })
                }
                className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600 disabled:opacity-60"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-espresso-900">Role</span>
                <select
                  value={draft.role}
                  onChange={(event) =>
                    setDraft({ ...draft, role: event.target.value as StaffRole })
                  }
                  className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
                >
                  {STAFF_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </label>
              {!isSupabaseConfigured ? (
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-espresso-900">
                    Demo PIN
                  </span>
                  <input
                    value={draft.pin}
                    onChange={(event) =>
                      setDraft({ ...draft, pin: event.target.value })
                    }
                    className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
                  />
                </label>
              ) : null}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(event) =>
                  setDraft({ ...draft, is_active: event.target.checked })
                }
              />
              <span className="font-medium text-espresso-900">Active</span>
            </label>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
