import { useEffect, useState } from 'react'
import { getSettings } from '../../services/admin'
import type { CafeSetting } from '../../types/db'

export function useSettings() {
  const [settings, setSettings] = useState<CafeSetting | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getSettings()
      .then((value) => {
        if (active) setSettings(value)
      })
      .catch(() => {
        if (active) setSettings(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { settings, loading }
}
