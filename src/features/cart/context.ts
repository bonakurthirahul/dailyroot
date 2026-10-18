import { createContext, useContext } from 'react'
import type { CartLine, CartTotals } from '../../types/db'

export interface CartContextValue {
  lines: CartLine[]
  totals: CartTotals
  addLine: (line: CartLine) => void
  updateQuantity: (uid: string, quantity: number) => void
  setLineNotes: (uid: string, notes: string | null) => void
  removeLine: (uid: string) => void
  clear: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)

export function useCart(): CartContextValue {
  const value = useContext(CartContext)
  if (!value) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return value
}
