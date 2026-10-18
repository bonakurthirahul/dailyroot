import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchOrderByToken, subscribeOrder } from '../../services/orders'
import { validateTrackingToken } from '../../lib/orders'
import type { OrderWithItems } from '../../types/db'

export type TrackStatus = 'loading' | 'ready' | 'notfound' | 'error'

export function useTrackedOrder(token: string | undefined) {
  const [status, setStatus] = useState<TrackStatus>('loading')
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [error, setError] = useState<string | null>(null)
  const firstLoad = useRef(true)

  const load = useCallback(async () => {
    const clean = token?.trim() ?? ''
    if (!validateTrackingToken(clean)) {
      setStatus('notfound')
      return
    }
    try {
      const result = await fetchOrderByToken(clean)
      if (!result) {
        setStatus('notfound')
        return
      }
      setOrder(result)
      setStatus('ready')
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to load your order',
      )
      if (firstLoad.current) setStatus('error')
    } finally {
      firstLoad.current = false
    }
  }, [token])

  useEffect(() => {
    firstLoad.current = true
    void load()
    const clean = token?.trim() ?? ''
    if (!validateTrackingToken(clean)) return
    const unsubscribe = subscribeOrder(clean, () => {
      void load()
    })
    const interval = window.setInterval(() => {
      void load()
    }, 20_000)
    return () => {
      unsubscribe()
      window.clearInterval(interval)
    }
  }, [token, load])

  return { status, order, error, reload: load }
}
