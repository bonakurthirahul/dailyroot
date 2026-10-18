import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CartContext } from './context'
import { computeCartTotals } from '../../lib/pricing'
import { readJson, writeJson } from '../../lib/storage'
import type { CartLine } from '../../types/db'

const CART_KEY = 'bb.cart.v1'

interface PersistedCart {
  lines: CartLine[]
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    const stored = readJson<PersistedCart>(CART_KEY)
    return Array.isArray(stored?.lines) ? stored.lines : []
  })

  useEffect(() => {
    writeJson(CART_KEY, { lines })
  }, [lines])

  const addLine = useCallback((line: CartLine) => {
    setLines((current) => {
      const existing = current.find(
        (candidate) =>
          candidate.menu_item_id === line.menu_item_id &&
          candidate.variant_id === line.variant_id &&
          JSON.stringify(candidate.modifiers) ===
            JSON.stringify(line.modifiers) &&
          (candidate.notes ?? '') === (line.notes ?? ''),
      )
      if (existing) {
        return current.map((candidate) =>
          candidate.uid === existing.uid
            ? { ...candidate, quantity: candidate.quantity + line.quantity }
            : candidate,
        )
      }
      return [...current, line]
    })
  }, [])

  const updateQuantity = useCallback((uid: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((line) => line.uid !== uid)
        : current.map((line) =>
            line.uid === uid ? { ...line, quantity } : line,
          ),
    )
  }, [])

  const setLineNotes = useCallback((uid: string, notes: string | null) => {
    setLines((current) =>
      current.map((line) => (line.uid === uid ? { ...line, notes } : line)),
    )
  }, [])

  const removeLine = useCallback((uid: string) => {
    setLines((current) => current.filter((line) => line.uid !== uid))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const totals = useMemo(() => computeCartTotals(lines), [lines])

  const value = useMemo(
    () => ({ lines, totals, addLine, updateQuantity, setLineNotes, removeLine, clear }),
    [lines, totals, addLine, updateQuantity, setLineNotes, removeLine, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
