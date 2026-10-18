import { describe, expect, it } from 'vitest'
import {
  availableTransitions,
  canTransition,
  generateReference,
  isPaymentSettled,
  resolveInitialPaymentStatus,
  validateTrackingToken,
} from '../orders'

describe('canTransition', () => {
  it('allows valid forward transitions', () => {
    expect(canTransition('pending', 'accepted')).toBe(true)
    expect(canTransition('accepted', 'preparing')).toBe(true)
    expect(canTransition('preparing', 'ready')).toBe(true)
    expect(canTransition('ready', 'served')).toBe(true)
  })

  it('allows cancellation from active states only', () => {
    expect(canTransition('pending', 'cancelled')).toBe(true)
    expect(canTransition('served', 'cancelled')).toBe(false)
    expect(canTransition('cancelled', 'pending')).toBe(false)
  })

  it('rejects skipping stages and no-op transitions', () => {
    expect(canTransition('pending', 'preparing')).toBe(false)
    expect(canTransition('pending', 'pending')).toBe(false)
    expect(canTransition('served', 'preparing')).toBe(false)
  })

  it('reports terminal states as empty', () => {
    expect(availableTransitions('served')).toEqual([])
    expect(availableTransitions('cancelled')).toEqual([])
  })
})

describe('generateReference', () => {
  it('produces a BB- prefixed reference', () => {
    const reference = generateReference(() => 0)
    expect(reference.startsWith('BB-')).toBe(true)
    expect(reference).toHaveLength(8)
  })
})

describe('validateTrackingToken', () => {
  it('rejects empty and short tokens', () => {
    expect(validateTrackingToken(undefined)).toBe(false)
    expect(validateTrackingToken('short')).toBe(false)
    expect(validateTrackingToken('lowercase-token-1234')).toBe(false)
  })

  it('accepts uppercase alphanumeric tokens of sufficient length', () => {
    expect(validateTrackingToken('DEMOTABLE01XXXXXXXX')).toBe(true)
    expect(validateTrackingToken('A'.repeat(64))).toBe(true)
    expect(validateTrackingToken('A'.repeat(65))).toBe(false)
  })
})

describe('payment status helpers', () => {
  it('keeps UPI payments pending and counter payments unpaid', () => {
    expect(resolveInitialPaymentStatus('upi')).toBe('pending')
    expect(resolveInitialPaymentStatus('counter')).toBe('unpaid')
  })

  it('treats only paid as settled', () => {
    expect(isPaymentSettled('paid')).toBe(true)
    expect(isPaymentSettled('pending')).toBe(false)
    expect(isPaymentSettled('unpaid')).toBe(false)
  })
})
