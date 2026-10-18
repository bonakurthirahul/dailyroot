import { createContext, useContext } from 'react'
import type { BackendStatus } from '../../services/connectivity'

export interface BackendContextValue {
  status: BackendStatus
  checking: boolean
  refresh: () => void
}

export const BackendContext = createContext<BackendContextValue | null>(null)

export function useBackend(): BackendContextValue {
  const value = useContext(BackendContext)
  if (!value) {
    throw new Error('useBackend must be used within a BackendProvider')
  }
  return value
}
