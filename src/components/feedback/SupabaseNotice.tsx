import { useState } from 'react'
import { isSupabaseConfigured } from '../../lib/env'
import { useBackend } from '../../features/backend/context'
import { Container } from '../ui/Container'

export function SupabaseNotice() {
  const [dismissed, setDismissed] = useState(false)
  const { status, checking, refresh } = useBackend()

  if (!isSupabaseConfigured) {
    if (dismissed) return null
    return (
      <div className="border-b border-caramel-500/30 bg-caramel-400/15">
        <Container className="flex items-center justify-between gap-3 py-2.5">
          <p className="text-xs leading-relaxed text-espresso-800 sm:text-sm">
            <span className="font-semibold">Local demo mode.</span> Supabase is
            not configured, so menu, orders and admin data are stored in this
            browser only and are not live.
          </p>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-espresso-800 hover:bg-caramel-400/30"
          >
            Dismiss
          </button>
        </Container>
      </div>
    )
  }

  if (status.mode === 'live') return null

  if (checking) {
    return (
      <div className="border-b border-coffee-600/20 bg-cream-200/60">
        <Container className="py-2.5">
          <p className="text-xs text-espresso-800 sm:text-sm">
            Connecting to Supabase and verifying the database schema…
          </p>
        </Container>
      </div>
    )
  }

  return (
    <div className="border-b border-red-500/40 bg-red-500/10">
      <Container className="flex items-center justify-between gap-3 py-2.5">
        <p className="text-xs leading-relaxed text-red-900 sm:text-sm">
          <span className="font-semibold">Supabase is not ready.</span>{' '}
          {status.message}
          {status.missing.length > 0 ? (
            <>
              {' '}
              Missing: <span className="font-medium">{status.missing.join(', ')}</span>.
            </>
          ) : null}{' '}
          Until this is resolved the app will not present live data.
        </p>
        <button
          type="button"
          onClick={refresh}
          className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-red-900 hover:bg-red-500/20"
        >
          Retry
        </button>
      </Container>
    </div>
  )
}
