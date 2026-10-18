import type { ReactElement, ReactNode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CartProvider } from '../features/cart/CartProvider'
import { ToastProvider } from '../features/toast/ToastProvider'

function Providers({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <ToastProvider>
        <CartProvider>{children}</CartProvider>
      </ToastProvider>
    </MemoryRouter>
  )
}

export function renderWithProviders(ui: ReactElement) {
  return render(ui, { wrapper: Providers })
}
