import { createContext, useContext } from 'react'
import type { CafeTable } from '../../types/db'

export interface TableContextValue {
  table: CafeTable | null
  token: string | null
  setTable: (table: CafeTable, token: string) => void
  clear: () => void
}

export const TableContext = createContext<TableContextValue | null>(null)

export function useTableContext(): TableContextValue {
  const value = useContext(TableContext)
  if (!value) {
    throw new Error('useTableContext must be used within a TableProvider')
  }
  return value
}
