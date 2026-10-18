import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { isSupabaseConfigured } from '../../lib/env'
import { supabase } from '../../lib/supabase'
import { verifyBackend, type BackendStatus } from '../../services/connectivity'
import { BackendContext, type BackendContextValue } from './context'

const DEMO_STATUS: BackendStatus = {
  mode: 'demo',
  reachable: false,
  schemaReady: false,
  missing: [],
  message: 'Local demo mode. Configure Supabase to store data live.',
}

const CACHE_KEY = 'bb.backend.status.v1'
const CACHE_TTL_MS = 5 * 60 * 1000

interface CachedStatus {
  status: BackendStatus
  at: number
}

function readCache(): BackendStatus | null {
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedStatus
    if (!parsed?.status || typeof parsed.at !== 'number') return null
    if (Date.now() - parsed.at > CACHE_TTL_MS) return null
    return parsed.status
  } catch {
    return null
  }
}

function writeCache(status: BackendStatus) {
  try {
    window.sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ status, at: Date.now() } satisfies CachedStatus),
    )
  } catch {
    // sessionStorage may be unavailable; caching is best-effort only.
  }
}

export function BackendProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured
  const [status, setStatus] = useState<BackendStatus>(
    configured ? (readCache() ?? DEMO_STATUS) : DEMO_STATUS,
  )
  const [checking, setChecking] = useState(configured)
  const mounted = useRef(true)

  const runCheck = useCallback(async () => {
    if (!configured || !supabase) {
      setStatus(DEMO_STATUS)
      setChecking(false)
      return
    }
    setChecking(true)
    try {
      const result = await verifyBackend(supabase)
      if (!mounted.current) return
      setStatus(result)
      writeCache(result)
    } catch (cause) {
      if (!mounted.current) return
      setStatus({
        mode: 'unavailable',
        reachable: false,
        schemaReady: false,
        missing: [],
        message:
          cause instanceof Error
            ? cause.message
            : 'Could not verify the Supabase connection.',
      })
    } finally {
      if (mounted.current) setChecking(false)
    }
  }, [configured])

  useEffect(() => {
    mounted.current = true
    if (configured && !readCache()) {
      void runCheck()
    } else {
      setChecking(false)
    }
    return () => {
      mounted.current = false
    }
  }, [configured, runCheck])

  const value = useMemo<BackendContextValue>(
    () => ({ status, checking, refresh: () => void runCheck() }),
    [status, checking, runCheck],
  )

  return (
    <BackendContext.Provider value={value}>{children}</BackendContext.Provider>
  )
}
