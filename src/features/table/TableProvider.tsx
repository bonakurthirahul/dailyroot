import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { TableContext } from './context'
import { resolveTableByToken } from '../../services/menu'
import { readJson, removeKey, writeJson } from '../../lib/storage'
import { validateTrackingToken } from '../../lib/orders'
import type { CafeTable } from '../../types/db'

const TABLE_TOKEN_KEY = 'bb.table.token.v1'

export function TableProvider({ children }: { children: ReactNode }) {
  const [table, setTableState] = useState<CafeTable | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const setTable = useCallback((next: CafeTable, nextToken: string) => {
    setTableState(next)
    setToken(nextToken)
    writeJson(TABLE_TOKEN_KEY, nextToken)
  }, [])

  const clear = useCallback(() => {
    setTableState(null)
    setToken(null)
    removeKey(TABLE_TOKEN_KEY)
  }, [])

  useEffect(() => {
    let active = true
    const saved = readJson<string>(TABLE_TOKEN_KEY)
    if (!saved || !validateTrackingToken(saved)) {
      if (saved) removeKey(TABLE_TOKEN_KEY)
      return
    }
    resolveTableByToken(saved)
      .then((resolved) => {
        if (!active || !resolved) {
          if (active) removeKey(TABLE_TOKEN_KEY)
          return
        }
        setTableState(resolved)
        setToken(saved)
      })
      .catch(() => {
        if (active) removeKey(TABLE_TOKEN_KEY)
      })
    return () => {
      active = false
    }
  }, [])

  const value = useMemo(
    () => ({ table, token, setTable, clear }),
    [table, token, setTable, clear],
  )

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>
}
