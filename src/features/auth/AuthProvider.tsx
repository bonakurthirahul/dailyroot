import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './context'
import {
  getSession,
  onAuthChange,
  signIn as serviceSignIn,
  signOut as serviceSignOut,
} from '../../services/auth'
import { can as canCapability } from '../../lib/permissions'
import type { Capability } from '../../lib/permissions'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Awaited<ReturnType<typeof getSession>>>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const session = await getSession()
    setUser(session)
  }, [])

  useEffect(() => {
    let active = true
    refresh()
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    const unsubscribe = onAuthChange(() => {
      void refresh()
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [refresh])

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await serviceSignIn(email, password)
    setUser(session)
  }, [])

  const signOut = useCallback(async () => {
    await serviceSignOut()
    setUser(null)
  }, [])

  const can = useCallback(
    (capability: Capability) => canCapability(user?.role, capability),
    [user],
  )

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, can, refresh }),
    [user, loading, signIn, signOut, can, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
