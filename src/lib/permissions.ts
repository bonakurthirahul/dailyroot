import type { StaffRole } from '../types/db'

export type Capability =
  | 'view_orders'
  | 'update_orders'
  | 'manage_payments'
  | 'manage_menu'
  | 'manage_tables'
  | 'view_reports'
  | 'manage_settings'
  | 'manage_staff'

const ROLE_CAPABILITIES: Record<StaffRole, Capability[]> = {
  owner: [
    'view_orders',
    'update_orders',
    'manage_payments',
    'manage_menu',
    'manage_tables',
    'view_reports',
    'manage_settings',
    'manage_staff',
  ],
  manager: [
    'view_orders',
    'update_orders',
    'manage_payments',
    'manage_menu',
    'manage_tables',
    'view_reports',
  ],
  cashier: ['view_orders', 'update_orders', 'manage_payments', 'view_reports'],
  kitchen: ['view_orders', 'update_orders'],
}

export function can(
  role: StaffRole | null | undefined,
  capability: Capability,
): boolean {
  if (!role) return false
  return ROLE_CAPABILITIES[role].includes(capability)
}

export function capabilitiesFor(role: StaffRole): Capability[] {
  return ROLE_CAPABILITIES[role]
}
