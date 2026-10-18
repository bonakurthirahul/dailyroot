import {
  ORDER_STATUS_FLOW,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from '../types/db'

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false
  return ORDER_STATUS_FLOW[from].includes(to)
}

export function availableTransitions(status: OrderStatus): OrderStatus[] {
  return ORDER_STATUS_FLOW[status]
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return status === 'served' || status === 'cancelled'
}

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateReference(random: () => number = Math.random): string {
  let suffix = ''
  for (let index = 0; index < 5; index += 1) {
    suffix += REFERENCE_ALPHABET.charAt(
      Math.floor(random() * REFERENCE_ALPHABET.length),
    )
  }
  return `BB-${suffix}`
}

export function generateToken(
  length = 24,
  random: () => number = Math.random,
): string {
  let token = ''
  for (let index = 0; index < length; index += 1) {
    token += REFERENCE_ALPHABET.charAt(
      Math.floor(random() * REFERENCE_ALPHABET.length),
    )
  }
  return token
}

export function validateTrackingToken(token: string | undefined): boolean {
  if (!token) return false
  return /^[A-Z0-9]{12,64}$/.test(token)
}

export function resolveInitialPaymentStatus(
  method: PaymentMethod,
): PaymentStatus {
  return method === 'upi' ? 'pending' : 'unpaid'
}

export function isPaymentSettled(status: PaymentStatus): boolean {
  return status === 'paid'
}
