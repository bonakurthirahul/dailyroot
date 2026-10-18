import { beforeEach, describe, expect, it } from 'vitest'
import { resetState } from '../../data/local/store'
import { resolveTableByToken } from '../menu'
import {
  createOrder,
  fetchOrderById,
  fetchOrderByToken,
  fetchOrders,
} from '../orders'

beforeEach(() => {
  resetState()
})

describe('resolveTableByToken', () => {
  it('returns null for an unknown token', async () => {
    expect(await resolveTableByToken('UNKNOWNTOKEN123456')).toBeNull()
  })

  it('returns null for an empty token', async () => {
    expect(await resolveTableByToken('')).toBeNull()
  })

  it('resolves a valid demo table', async () => {
    const table = await resolveTableByToken('DEMOTABLE01XXXXXXXX')
    expect(table?.label).toBe('Table 1')
  })
})

describe('createOrder price integrity', () => {
  it('recomputes totals from catalog rather than client input', async () => {
    const result = await createOrder({
      table_token: 'DEMOTABLE01XXXXXXXX',
      customer_name: 'Test Guest',
      customer_phone: null,
      notes: null,
      payment_method: 'counter',
      items: [
        {
          menu_item_id: 'item-latte',
          variant_id: null,
          option_ids: [],
          quantity: 2,
          notes: null,
        },
      ],
    })

    const order = await fetchOrderByToken(result.tracking_token)
    expect(order).not.toBeNull()
    // Latte base price is 210 in the demo catalog; client never sends a price.
    expect(order?.subtotal).toBe(420)
    expect(order?.total).toBe(420)
    expect(order?.payment_status).toBe('unpaid')
    expect(order?.status).toBe('pending')
  })

  it('marks UPI orders as pending payment', async () => {
    const result = await createOrder({
      table_token: null,
      customer_name: 'UPI Guest',
      customer_phone: null,
      notes: null,
      payment_method: 'upi',
      items: [
        {
          menu_item_id: 'item-espresso',
          variant_id: null,
          option_ids: [],
          quantity: 1,
          notes: null,
        },
      ],
    })
    const order = await fetchOrderByToken(result.tracking_token)
    expect(order?.payment_status).toBe('pending')
  })
})

describe('order privacy boundaries', () => {
  it('only returns an order for its exact tracking token', async () => {
    const created = await createOrder({
      table_token: null,
      customer_name: 'Private Guest',
      customer_phone: null,
      notes: null,
      payment_method: 'counter',
      items: [
        {
          menu_item_id: 'item-croissant',
          variant_id: null,
          option_ids: [],
          quantity: 1,
          notes: null,
        },
      ],
    })

    expect(await fetchOrderByToken(created.tracking_token)).not.toBeNull()
    expect(await fetchOrderByToken('WRONGTOKEN1234567890')).toBeNull()
  })

  it('starts with only seeded orders plus newly created ones', async () => {
    const orders = await fetchOrders()
    expect(orders.length).toBeGreaterThan(0)
    const first = orders[0]
    expect(first).toBeTruthy()
    expect(await fetchOrderById(first!.id)).not.toBeNull()
  })
})
