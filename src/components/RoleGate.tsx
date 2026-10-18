import type { ReactNode } from 'react'
import { EmptyState } from './ui/EmptyState'
import { useAuth } from '../features/auth/context'
import type { Capability } from '../lib/permissions'

interface RoleGateProps {
  capability: Capability
  children: ReactNode
}

export function RoleGate({ capability, children }: RoleGateProps) {
  const { can, user } = useAuth()

  if (!can(capability)) {
    return (
      <EmptyState
        title="You don't have access to this area"
        description={`Your role (${user?.role ?? 'guest'}) doesn't include the "${capability.replace(
          /_/g,
          ' ',
        )}" permission. Ask an owner or manager if you need access.`}
      />
    )
  }

  return <>{children}</>
}
