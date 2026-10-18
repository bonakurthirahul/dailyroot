import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { RoleGate } from '../RoleGate'
import { AuthContext } from '../../features/auth/context'
import { can } from '../../lib/permissions'
import type { AuthContextValue } from '../../features/auth/context'
import type { StaffRole } from '../../types/db'

function wrap(role: StaffRole | null, children: ReactNode) {
  const value: AuthContextValue = {
    user: role
      ? { id: 'u1', full_name: 'Test', email: 't@x.com', role }
      : null,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    can: (capability) => can(role, capability),
    refresh: vi.fn(),
  }
  return render(
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>,
  )
}

describe('RoleGate', () => {
  it('renders children when the role has the capability', () => {
    wrap('owner', <RoleGate capability="manage_staff">Secret</RoleGate>)
    expect(screen.getByText('Secret')).toBeInTheDocument()
  })

  it('blocks content when the role lacks the capability', () => {
    wrap('kitchen', <RoleGate capability="manage_staff">Secret</RoleGate>)
    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
    expect(screen.getByText(/don't have access/i)).toBeInTheDocument()
  })

  it('blocks content when there is no user', () => {
    wrap(null, <RoleGate capability="view_orders">Secret</RoleGate>)
    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
  })
})
