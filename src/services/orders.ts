import { requireSupabase, supabase } from '../lib/supabase'
import { isSupabaseConfigured } from '../lib/env'
import {
  addOrder,
  confirmPayment as localConfirmPayment,
  findOrderById,
  findOrderByTrackingToken,
  getState,
  subscribe as subscribeLocal,
  updateOrderStatus as localUpdateOrderStatus,
} from '../data/local/store'
import { buildDemoMenuTree } from '../data/demo'
import { buildCartLine } from '../lib/pricing'
import type {
  OrderStatus,
  OrderWithItems,
  PaymentMethod,
} from '../types/db'

export interface CreateOrderItemInput {
  menu_item_id: string
  variant_id: string | null
  option_ids: string[]
  quantity: number
  notes: string | null
}

export interface CreateOrderInput {
  table_token: string | null
  customer_name: string
  customer_phone: string | null
  notes: string | null
  payment_method: PaymentMethod
  items: CreateOrderItemInput[]
}

export interface CreateOrderResult {
  reference: string
  tracking_token: string
}

export interface Actor {
  id: string | null
  name: string | null
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  if (!isSupabaseConfigured) {
    const tree = buildDemoMenuTree()
    const state = getState()
    const table = input.table_token
      ? state.tables.find((candidate) => candidate.token === input.table_token) ?? null
      : null

    const lines = input.items.map((item, index) => {
      const menuItem = tree.find((candidate) => candidate.id === item.menu_item_id)
      if (!menuItem) throw new Error('A selected item is no longer available.')
      const variant = item.variant_id
        ? menuItem.variants.find((candidate) => candidate.id === item.variant_id) ?? null
        : null
      const options = menuItem.modifier_groups.flatMap((group) =>
        group.options.filter((option) => item.option_ids.includes(option.id)),
      )
      return buildCartLine({
        menuItem,
        variant,
        selectedOptions: options,
        quantity: item.quantity,
        notes: item.notes,
        uid: `line-${index}-${item.menu_item_id}`,
      })
    })

    const order = addOrder(
      {
        table_id: table?.id ?? null,
        table_label: table?.label ?? null,
        customer_name: input.customer_name,
        customer_phone: input.customer_phone,
        notes: input.notes,
        payment_method: input.payment_method,
        lines,
      },
      { id: null, name: input.customer_name },
    )

    return { reference: order.reference, tracking_token: order.tracking_token }
  }

  const client = requireSupabase()
  const { data, error } = await client.rpc('create_order', {
    p_payload: {
      table_token: input.table_token,
      customer_name: input.customer_name,
      customer_phone: input.customer_phone,
      notes: input.notes,
      payment_method: input.payment_method,
      items: input.items,
    },
  })
  if (error) throw new Error(error.message)
  const row = Array.isArray(data) ? data[0] : data
  if (!row?.tracking_token) {
    throw new Error('Order could not be created. Please try again.')
  }
  return {
    reference: row.reference as string,
    tracking_token: row.tracking_token as string,
  }
}

export async function fetchOrderByToken(
  token: string,
): Promise<OrderWithItems | null> {
  if (!isSupabaseConfigured) {
    return findOrderByTrackingToken(token) ?? null
  }
  const client = requireSupabase()
  const { data, error } = await client.rpc('get_order_by_token', {
    p_token: token,
  })
  if (error) throw new Error(error.message)
  const row = Array.isArray(data) ? data[0] : data
  return (row as OrderWithItems | null) ?? null
}

export async function fetchOrderById(id: string): Promise<OrderWithItems | null> {
  if (!isSupabaseConfigured) {
    return findOrderById(id) ?? null
  }
  const client = requireSupabase()
  const { data, error } = await client.rpc('get_order_detail', { p_order_id: id })
  if (error) throw new Error(error.message)
  const row = Array.isArray(data) ? data[0] : data
  return (row as OrderWithItems | null) ?? null
}

export async function fetchOrders(): Promise<OrderWithItems[]> {
  if (!isSupabaseConfigured) {
    return [...getState().orders].sort(
      (a, b) => Date.parse(b.placed_at) - Date.parse(a.placed_at),
    )
  }
  const client = requireSupabase()
  const { data, error } = await client.rpc('list_orders')
  if (error) throw new Error(error.message)
  return (data ?? []) as OrderWithItems[]
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  actor: Actor,
): Promise<void> {
  if (!isSupabaseConfigured) {
    localUpdateOrderStatus(orderId, status, actor)
    return
  }
  const client = requireSupabase()
  const { error } = await client.rpc('update_order_status', {
    p_order_id: orderId,
    p_status: status,
  })
  if (error) throw new Error(error.message)
}

export async function confirmPayment(
  orderId: string,
  actor: Actor,
): Promise<void> {
  if (!isSupabaseConfigured) {
    localConfirmPayment(orderId, actor)
    return
  }
  const client = requireSupabase()
  const { error } = await client.rpc('confirm_payment', { p_order_id: orderId })
  if (error) throw new Error(error.message)
}

export function subscribeOrder(
  token: string,
  onChange: () => void,
): () => void {
  if (!isSupabaseConfigured) {
    return subscribeLocal(onChange)
  }
  const client = supabase
  if (!client) return () => {}
  const channel = client
    .channel(`order-${token}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `tracking_token=eq.${token}`,
      },
      onChange,
    )
    .subscribe()
  return () => {
    void client.removeChannel(channel)
  }
}

export function subscribeOrders(onChange: () => void): () => void {
  if (!isSupabaseConfigured) {
    return subscribeLocal(onChange)
  }
  const client = supabase
  if (!client) return () => {}
  const channel = client
    .channel('orders-admin')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      onChange,
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'order_status_events' },
      onChange,
    )
    .subscribe()
  return () => {
    void client.removeChannel(channel)
  }
}
