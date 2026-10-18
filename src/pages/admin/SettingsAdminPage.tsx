import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/LoadingState'
import { ErrorState } from '../../components/ui/ErrorState'
import { getSettings, updateSettings } from '../../services/admin'
import { useToast } from '../../features/toast/context'
import type { CafeSetting } from '../../types/db'

export function SettingsAdminPage() {
  const { notify } = useToast()
  const [settings, setSettings] = useState<CafeSetting | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    getSettings()
      .then((value) => {
        if (!active) return
        setSettings(value)
        setStatus('ready')
      })
      .catch((cause: unknown) => {
        if (!active) return
        setError(cause instanceof Error ? cause.message : 'Unable to load')
        setStatus('error')
      })
    return () => {
      active = false
    }
  }, [])

  async function handleSave() {
    if (!settings) return
    if (settings.tax_enabled && settings.tax_rate <= 0) {
      notify('Enter a tax rate or disable tax', 'error')
      return
    }
    setBusy(true)
    try {
      const saved = await updateSettings(settings)
      setSettings(saved)
      notify('Settings saved', 'success')
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Save failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (status === 'loading') return <LoadingState label="Loading settings…" />
  if (status === 'error' || !settings)
    return (
      <ErrorState
        description={error ?? undefined}
        onRetry={() => window.location.reload()}
      />
    )

  function update(patch: Partial<CafeSetting>) {
    setSettings((current) => (current ? { ...current, ...patch } : current))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-espresso-900">Cafe settings</h1>
        <Button loading={busy} onClick={handleSave}>
          Save changes
        </Button>
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-5 shadow-card">
        <h2 className="font-display text-xl text-espresso-900">Identity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-espresso-900">Cafe name</span>
            <input
              value={settings.cafe_name}
              onChange={(event) => update({ cafe_name: event.target.value })}
              className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-espresso-900">Tagline</span>
            <input
              value={settings.tagline ?? ''}
              onChange={(event) => update({ tagline: event.target.value })}
              className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-espresso-900">Phone</span>
            <input
              value={settings.phone ?? ''}
              onChange={(event) => update({ phone: event.target.value })}
              className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-espresso-900">UPI ID</span>
            <input
              value={settings.upi_id ?? ''}
              onChange={(event) => update({ upi_id: event.target.value })}
              placeholder="cafe@upi"
              className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-espresso-900">Address</span>
          <textarea
            value={settings.address ?? ''}
            onChange={(event) => update({ address: event.target.value })}
            rows={2}
            className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
          />
        </label>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-5 shadow-card">
        <div>
          <h2 className="font-display text-xl text-espresso-900">
            Tax &amp; charges
          </h2>
          <p className="text-xs text-coffee-600">
            Tax is disabled until you confirm your applicable registration and
            rates. Do not enable without verifying your GST obligations.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.tax_enabled}
            onChange={(event) => update({ tax_enabled: event.target.checked })}
          />
          <span className="font-medium text-espresso-900">Enable tax</span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-espresso-900">Tax label</span>
            <input
              value={settings.tax_label}
              onChange={(event) => update({ tax_label: event.target.value })}
              disabled={!settings.tax_enabled}
              className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600 disabled:opacity-50"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-espresso-900">Tax rate (%)</span>
            <input
              type="number"
              min={0}
              value={settings.tax_rate}
              onChange={(event) =>
                update({ tax_rate: Number(event.target.value) })
              }
              disabled={!settings.tax_enabled}
              className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600 disabled:opacity-50"
            />
          </label>
        </div>
      </section>
    </div>
  )
}
