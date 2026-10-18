import { createContext, useContext } from 'react'
import type { Capability } from '../../lib/permissions'
import type { SessionUser } from '../../services/auth'

export interface AuthContextValue {
  user: SessionUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  can: (capability: Capability) => boolean
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return value
}
