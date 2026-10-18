import { describe, expect, it } from 'vitest'
import { can, capabilitiesFor } from '../permissions'

describe('role permissions', () => {
  it('grants owners every capability', () => {
    expect(can('owner', 'manage_staff')).toBe(true)
    expect(can('owner', 'manage_settings')).toBe(true)
    expect(can('owner', 'update_orders')).toBe(true)
  })

  it('prevents managers from managing staff and settings', () => {
    expect(can('manager', 'manage_menu')).toBe(true)
    expect(can('manager', 'manage_staff')).toBe(false)
    expect(can('manager', 'manage_settings')).toBe(false)
  })

  it('limits cashiers to order and payment workflows', () => {
    expect(can('cashier', 'manage_payments')).toBe(true)
    expect(can('cashier', 'manage_menu')).toBe(false)
    expect(can('cashier', 'manage_tables')).toBe(false)
  })

  it('limits kitchen staff to order updates only', () => {
    expect(can('kitchen', 'update_orders')).toBe(true)
    expect(can('kitchen', 'manage_payments')).toBe(false)
    expect(can('kitchen', 'manage_menu')).toBe(false)
  })

  it('denies everything without a role', () => {
    expect(can(null, 'view_orders')).toBe(false)
    expect(can(undefined, 'update_orders')).toBe(false)
  })

  it('exposes capability lists per role', () => {
    expect(capabilitiesFor('kitchen')).toEqual(['view_orders', 'update_orders'])
  })
})
