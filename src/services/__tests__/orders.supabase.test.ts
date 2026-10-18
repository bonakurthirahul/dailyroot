import { beforeEach, describe, expect, it, vi } from 'vitest'

const { rpc, mockClient } = vi.hoisted(() => {
  const rpc = vi.fn()
  return { rpc, mockClient: { rpc } }
})

vi.mock('../../lib/supabase', () => ({
  requireSupabase: () => mockClient,
  supabase: mockClient,
}))

vi.mock('../../lib/env', () => ({
  isSupabaseConfigured: true,
}))

import {
  createOrder,
  fetchOrderByToken,
  updateOrderStatus,
  type CreateOrderInput,
} from '../orders'

const baseInput: CreateOrderInput = {
  table_token: 'ABCDEF0123456789ABCDEF',
  customer_name: 'Ananya',
  customer_phone: null,
  notes: null,
  payment_method: 'counter',
  items: [
    {
      menu_item_id: 'item-1',
      variant_id: null,
      option_ids: [],
      quantity: 2,
      notes: null,
    },
  ],
}

beforeEach(() => {
  rpc.mockReset()
})

describe('createOrder (Supabase path)', () => {
  it('calls the create_order RPC with the p_payload argument', async () => {
    rpc.mockResolvedValue({
      data: { reference: 'BB-ABC12', tracking_token: 'TOKEN1234567890AB' },
      error: null,
    })

    const result = await createOrder(baseInput)

    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith(
      'create_order',
      expect.objectContaining({
        p_payload: expect.objectContaining({
          table_token: 'ABCDEF0123456789ABCDEF',
          payment_method: 'counter',
          items: baseInput.items,
        }),
      }),
    )
    expect(result).toEqual({
      reference: 'BB-ABC12',
      tracking_token: 'TOKEN1234567890AB',
    })
  })

  it('surfaces the raw database error instead of reporting success', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'new row violates row-level security policy' },
    })

    await expect(createOrder(baseInput)).rejects.toThrow(
      'new row violates row-level security policy',
    )
  })

  it('rejects when the RPC returns no tracking token', async () => {
    rpc.mockResolvedValue({ data: { reference: 'BB-ABC12' }, error: null })
    await expect(createOrder(baseInput)).rejects.toThrow(/could not be created/i)
  })
})

describe('fetchOrderByToken (Supabase path)', () => {
  it('returns the order row from get_order_by_token', async () => {
    const row = { id: 'order-1', reference: 'BB-1' }
    rpc.mockResolvedValue({ data: row, error: null })

    const result = await fetchOrderByToken('TOKEN1234567890AB')

    expect(rpc).toHaveBeenCalledWith('get_order_by_token', {
      p_token: 'TOKEN1234567890AB',
    })
    expect(result).toBe(row)
  })

  it('returns null when the token is unknown', async () => {
    rpc.mockResolvedValue({ data: null, error: null })
    expect(await fetchOrderByToken('UNKNOWNTOKEN1234')).toBeNull()
  })

  it('propagates database errors', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } })
    await expect(fetchOrderByToken('TOKEN1234567890AB')).rejects.toThrow('boom')
  })
})

describe('updateOrderStatus (Supabase path)', () => {
  it('calls update_order_status with the order id and status', async () => {
    rpc.mockResolvedValue({ data: null, error: null })
    await updateOrderStatus('order-1', 'accepted', { id: 'u1', name: 'Sam' })
    expect(rpc).toHaveBeenCalledWith('update_order_status', {
      p_order_id: 'order-1',
      p_status: 'accepted',
    })
  })

  it('propagates an invalid-transition error', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'Cannot move an order from served to preparing.' },
    })
    await expect(
      updateOrderStatus('order-1', 'preparing', { id: 'u1', name: 'Sam' }),
    ).rejects.toThrow(/cannot move an order/i)
  })
})
