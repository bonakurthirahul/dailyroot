import { useCallback, useEffect, useState } from 'react'
import { fetchOrders, subscribeOrders } from '../../services/orders'
import type { OrderWithItems } from '../../types/db'

export type OrdersStatus = 'loading' | 'ready' | 'error'

export function useOrders() {
  const [status, setStatus] = useState<OrdersStatus>('loading')
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      const result = await fetchOrders()
      setOrders(result)
      setStatus('ready')
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load orders')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void reload()
    const unsubscribe = subscribeOrders(() => {
      void reload()
    })
    return () => unsubscribe()
  }, [reload])

  return { status, orders, error, reload }
}
