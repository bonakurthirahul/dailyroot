import { useCallback, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  listTables,
  regenerateTableToken,
  removeTable,
  saveTable,
  type TableDraft,
} from '../../services/admin'
import { useToast } from '../../features/toast/context'
import { isLocalhostUrl, resolveAppBaseUrl, buildTableUrl } from '../../lib/appUrl'
import type { CafeTable } from '../../types/db'

const emptyDraft: TableDraft = {
  label: '',
  seats: 2,
  zone: null,
  is_active: true,
}

function tableUrl(token: string): string {
  return buildTableUrl(token, window.location.origin)
}

function QrPreview({ table }: { table: CafeTable }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    QRCode.toDataURL(tableUrl(table.token), {
      width: 220,
      margin: 1,
      color: { dark: '#2a1c12', light: '#ffffff' },
    })
      .then((url) => {
        if (active) setDataUrl(url)
      })
      .catch(() => {
        if (active) setDataUrl(null)
      })
    return () => {
      active = false
    }
  }, [table.token])

  if (!dataUrl) {
    return (
      <div className="flex size-28 items-center justify-center rounded-xl bg-cream-200 text-xs text-coffee-500">
        Generating…
      </div>
    )
  }

  return (
    <img
      src={dataUrl}
      alt={`QR code for ${table.label}`}
      className="size-28 rounded-xl border border-coffee-600/10 bg-white p-1"
    />
  )
}

export function TablesAdminPage() {
  const { notify } = useToast()
  const [tables, setTables] = useState<CafeTable[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<TableDraft | null>(null)
  const [busy, setBusy] = useState(false)
  const baseUrl = resolveAppBaseUrl(window.location.origin)
  const usingLocalhost = isLocalhostUrl(baseUrl)

  const load = useCallback(async () => {
    try {
      setTables(await listTables())
      setStatus('ready')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load tables')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSave() {
    if (!draft) return
    if (!draft.label.trim()) {
      notify('Table label is required', 'error')
      return
    }
    setBusy(true)
    try {
      await saveTable({ ...draft, label: draft.label.trim() })
      notify('Table saved', 'success')
      setDraft(null)
      await load()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Save failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(table: CafeTable) {
    if (!window.confirm(`Delete ${table.label}? Its QR code will stop working.`))
      return
    try {
      await removeTable(table.id)
      notify('Table deleted', 'success')
      await load()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Delete failed', 'error')
    }
  }

  async function handleRegenerate(table: CafeTable) {
    if (
      !window.confirm(
        `Regenerate the QR token for ${table.label}? The old QR will stop working.`,
      )
    )
      return
    try {
      await regenerateTableToken(table.id)
      notify('QR token regenerated', 'success')
      await load()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Failed', 'error')
    }
  }

  async function handleDownload(table: CafeTable) {
    try {
      const url = await QRCode.toDataURL(tableUrl(table.token), {
        width: 640,
        margin: 2,
        color: { dark: '#2a1c12', light: '#ffffff' },
      })
      const link = document.createElement('a')
      link.href = url
      link.download = `${table.label.replace(/\s+/g, '-').toLowerCase()}-qr.png`
      link.click()
    } catch {
      notify('Could not generate download', 'error')
    }
  }

  function handlePrint(table: CafeTable) {
    const win = window.open('', '_blank', 'width=480,height=680')
    if (!win) {
      notify('Allow pop-ups to print QR codes', 'error')
      return
    }
    QRCode.toDataURL(tableUrl(table.token), {
      width: 480,
      margin: 2,
      color: { dark: '#2a1c12', light: '#ffffff' },
    })
      .then((url) => {
        win.document.write(
          `<html><head><title>${table.label} QR</title></head><body style="font-family: Georgia, serif; text-align:center; padding:32px;">
            <h1 style="margin:0 0 4px;">Brew &amp; Bean</h1>
            <p style="color:#6f4e37;margin:0 0 20px;">${table.label}</p>
            <img src="${url}" style="width:320px;height:320px;" />
            <p style="color:#6f4e37;margin-top:20px;">Scan to order from ${table.label}</p>
          </body></html>`,
        )
        win.document.close()
        win.focus()
        win.print()
      })
      .catch(() => notify('Could not generate print view', 'error'))
  }

  async function handleCopy(table: CafeTable) {
    try {
      await navigator.clipboard.writeText(tableUrl(table.token))
      notify('Table link copied', 'success')
    } catch {
      notify('Copy failed — copy the link manually', 'error')
    }
  }

  if (status === 'loading') return <LoadingState label="Loading tables…" />
  if (status === 'error')
    return <ErrorState description={error ?? undefined} onRetry={load} />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-espresso-900">
            Tables &amp; QR codes
          </h1>
          <p className="text-sm text-coffee-700">
            Each table has a unique, unguessable ordering link.
          </p>
        </div>
        <Button onClick={() => setDraft({ ...emptyDraft })}>New table</Button>
      </div>

      {usingLocalhost ? (
        <div className="rounded-2xl border border-caramel-500/40 bg-caramel-400/15 p-3 text-sm text-espresso-800">
          <span className="font-semibold">QR codes point to {baseUrl}.</span>{' '}
          That is fine for testing on this device, but printed codes will not
          work for guests. Set <code>VITE_PUBLIC_APP_URL</code> to your public
          domain before generating production QR codes.
        </div>
      ) : (
        <div className="rounded-2xl border border-coffee-600/10 bg-cream-50/70 p-3 text-sm text-coffee-700">
          QR codes point to{' '}
          <span className="font-medium text-espresso-900">{baseUrl}</span>.
        </div>
      )}

      {tables.length === 0 ? (
        <EmptyState
          title="No tables yet"
          description="Add your first table to generate its QR code."
          action={<Button onClick={() => setDraft({ ...emptyDraft })}>New table</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => (
            <div
              key={table.id}
              className="flex flex-col gap-4 rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-4 shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <QrPreview table={table} />
                <div className="flex flex-col items-end gap-1">
                  <span className="flex items-center gap-2 font-display text-lg text-espresso-900">
                    {table.label}
                  </span>
                  <span className="text-xs text-coffee-500">
                    {table.seats} seats
                    {table.zone ? ` · ${table.zone}` : ''}
                  </span>
                  {!table.is_active ? (
                    <Badge tone="muted">Inactive</Badge>
                  ) : (
                    <Badge tone="caramel">Active</Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => handleDownload(table)}>
                  Download
                </Button>
                <Button size="sm" variant="outline" onClick={() => handlePrint(table)}>
                  Print
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleCopy(table)}>
                  Copy link
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-coffee-600/10 pt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setDraft({
                      id: table.id,
                      label: table.label,
                      seats: table.seats,
                      zone: table.zone,
                      is_active: table.is_active,
                    })
                  }
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRegenerate(table)}
                >
                  New token
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(table)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Edit table' : 'New table'}
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
              <span className="font-medium text-espresso-900">Label</span>
              <input
                value={draft.label}
                onChange={(event) =>
                  setDraft({ ...draft, label: event.target.value })
                }
                placeholder="Table 1"
                className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-espresso-900">Seats</span>
                <input
                  type="number"
                  min={1}
                  value={draft.seats}
                  onChange={(event) =>
                    setDraft({ ...draft, seats: Number(event.target.value) })
                  }
                  className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-espresso-900">Zone</span>
                <input
                  value={draft.zone ?? ''}
                  onChange={(event) =>
                    setDraft({ ...draft, zone: event.target.value || null })
                  }
                  placeholder="Terrace"
                  className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(event) =>
                  setDraft({ ...draft, is_active: event.target.checked })
                }
              />
              <span className="font-medium text-espresso-900">
                Active (QR works)
              </span>
            </label>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
