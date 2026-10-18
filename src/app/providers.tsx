import type { ReactNode } from 'react'
import { AuthProvider } from '../features/auth/AuthProvider'
import { BackendProvider } from '../features/backend/BackendProvider'
import { CartProvider } from '../features/cart/CartProvider'
import { TableProvider } from '../features/table/TableProvider'
import { ToastProvider } from '../features/toast/ToastProvider'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BackendProvider>
      <ToastProvider>
        <AuthProvider>
          <TableProvider>
            <CartProvider>{children}</CartProvider>
          </TableProvider>
        </AuthProvider>
      </ToastProvider>
    </BackendProvider>
  )
}
