import type {
  AuditLog,
  CafeSetting,
  CafeTable,
  Category,
  MenuItem,
  MenuItemModifierGroup,
  ModifierGroup,
  ModifierOption,
  Order,
  OrderItem,
  OrderItemModifier,
  OrderStatus,
  OrderStatusEvent,
  OrderWithItems,
  Payment,
  StaffRole,
  Variant,
} from '../../types/db'
import {
  DEMO_CATEGORIES,
  DEMO_ITEM_GROUPS,
  DEMO_MENU_ITEMS,
  DEMO_MODIFIER_GROUPS,
  DEMO_MODIFIER_OPTIONS,
  DEMO_TABLES,
  DEMO_VARIANTS,
  DEMO_SETTINGS,
  DEMO_STAFF,
  type DemoStaff,
} from '../demo'
import { generateReference, generateToken } from '../../lib/orders'
import { buildCartLine, computeCartTotals } from '../../lib/pricing'
import { buildDemoMenuTree } from '../demo'
import { readJson, writeJson } from '../../lib/storage'

const STORAGE_KEY = 'bb.demo.state.v2'

export interface LocalState {
  categories: Category[]
  menuItems: MenuItem[]
  variants: Variant[]
  groups: ModifierGroup[]
  options: ModifierOption[]
  itemGroups: MenuItemModifierGroup[]
  tables: CafeTable[]
  orders: OrderWithItems[]
  staff: DemoStaff[]
  settings: CafeSetting
  audit: AuditLog[]
}

function uid(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  return `${prefix}-${random}`
}

function nowIso(): string {
  return new Date().toISOString()
}

function seedOrders(): OrderWithItems[] {
  const tree = buildDemoMenuTree()
  const first = tree.find((item) => item.id === 'item-latte')
  const second = tree.find((item) => item.id === 'item-croissant')
  const third = tree.find((item) => item.id === 'item-cold-brew')
  if (!first || !second || !third) return []

  const makeOrder = (
    index: number,
    status: OrderStatus,
    table: CafeTable,
    items: Array<{ itemId: string; quantity: number }>,
    minutesAgo: number,
  ): OrderWithItems => {
    const orderId = uid('order')
    const lines = items.flatMap(({ itemId, quantity }) => {
      const menuItem = tree.find((candidate) => candidate.id === itemId)
      if (!menuItem) return []
      const variant =
        menuItem.variants.find((candidate) => candidate.is_default) ?? null
      const option = menuItem.modifier_groups[0]?.options[0]
      const line = buildCartLine({
        menuItem,
        variant,
        selectedOptions: option ? [option] : [],
        quantity,
        uid: uid('line'),
      })
      return [line]
    })

    const totals = computeCartTotals(lines)
    const order: Order = {
      id: orderId,
      reference: `BB-SEED${index}`,
      tracking_token: generateToken(28),
      table_id: table.id,
      table_label: table.label,
      customer_name: ['Ananya', 'Rohan', 'Ishita'][index % 3] ?? 'Guest',
      customer_phone: null,
      notes: null,
      status,
      payment_status: index % 2 === 0 ? 'paid' : 'unpaid',
      payment_method: index % 2 === 0 ? 'upi' : 'counter',
      subtotal: totals.subtotal,
      tax_total: totals.tax_total,
      discount_total: 0,
      total: totals.total,
      placed_at: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
      updated_at: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    }

    const orderItems: Array<OrderItem & { modifiers: OrderItemModifier[] }> =
      lines.map((line) => {
        const id = uid('oi')
        return {
          id,
          order_id: orderId,
          menu_item_id: line.menu_item_id,
          name_snapshot: line.name,
          variant_name: line.variant_name,
          unit_price: line.unit_price,
          quantity: line.quantity,
          line_total: line.unit_price * line.quantity,
          notes: line.notes,
          modifiers: line.modifiers.map((modifier) => ({
            id: uid('oim'),
            order_item_id: id,
            group_name: modifier.group_name,
            option_name: modifier.option_name,
            price_delta: modifier.price_delta,
          })),
        }
      })

    const events: OrderStatusEvent[] = [
      {
        id: uid('evt'),
        order_id: orderId,
        status: 'pending',
        note: 'Order placed',
        created_by: null,
        created_at: order.placed_at,
      },
    ]

    return { ...order, items: orderItems, events, payments: [] }
  }

  return [
    makeOrder(1, 'pending', DEMO_TABLES[0]!, [{ itemId: 'item-latte', quantity: 2 }], 4),
    makeOrder(2, 'preparing', DEMO_TABLES[2]!, [
      { itemId: 'item-cold-brew', quantity: 1 },
      { itemId: 'item-croissant', quantity: 2 },
    ], 12),
    makeOrder(3, 'ready', DEMO_TABLES[4]!, [{ itemId: 'item-cappuccino', quantity: 1 }], 20),
  ]
}

function createInitialState(): LocalState {
  const orders = seedOrders()
  return {
    categories: DEMO_CATEGORIES.map((category) => ({ ...category })),
    menuItems: DEMO_MENU_ITEMS.map((item) => ({ ...item })),
    variants: DEMO_VARIANTS.map((variant) => ({ ...variant })),
    groups: DEMO_MODIFIER_GROUPS.map((group) => ({ ...group })),
    options: DEMO_MODIFIER_OPTIONS.map((option) => ({ ...option })),
    itemGroups: DEMO_ITEM_GROUPS.map((link) => ({ ...link })),
    tables: DEMO_TABLES.map((table) => ({ ...table })),
    orders,
    staff: DEMO_STAFF.map((member) => ({ ...member })),
    settings: { ...DEMO_SETTINGS },
    audit: [],
  }
}

function loadState(): LocalState {
  const stored = readJson<LocalState>(STORAGE_KEY)
  if (stored && Array.isArray(stored.orders) && stored.settings) {
    return stored
  }
  const initial = createInitialState()
  writeJson(STORAGE_KEY, initial)
  return initial
}

let state: LocalState = loadState()
const listeners = new Set<() => void>()

function commit(next: LocalState): void {
  state = next
  writeJson(STORAGE_KEY, state)
  listeners.forEach((listener) => listener())
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getState(): LocalState {
  return state
}

export function resetState(): void {
  commit(createInitialState())
}

function withAudit(
  next: LocalState,
  entry: Omit<AuditLog, 'id' | 'created_at'>,
): LocalState {
  const record: AuditLog = {
    ...entry,
    id: uid('audit'),
    created_at: nowIso(),
  }
  return { ...next, audit: [record, ...next.audit].slice(0, 200) }
}

export function addOrder(
  draft: {
    table_id: string | null
    table_label: string | null
    customer_name: string
    customer_phone: string | null
    notes: string | null
    payment_method: 'upi' | 'counter'
    lines: ReturnType<typeof buildCartLine>[]
  },
  actor: { id: string | null; name: string | null },
): OrderWithItems {
  const totals = computeCartTotals(draft.lines, {
    taxEnabled: state.settings.tax_enabled,
    taxRate: state.settings.tax_rate,
  })
  const orderId = uid('order')
  const placed_at = nowIso()

  const order: Order = {
    id: orderId,
    reference: generateReference(),
    tracking_token: generateToken(28),
    table_id: draft.table_id,
    table_label: draft.table_label,
    customer_name: draft.customer_name,
    customer_phone: draft.customer_phone,
    notes: draft.notes,
    status: 'pending',
    payment_status: draft.payment_method === 'upi' ? 'pending' : 'unpaid',
    payment_method: draft.payment_method,
    subtotal: totals.subtotal,
    tax_total: totals.tax_total,
    discount_total: 0,
    total: totals.total,
    placed_at,
    updated_at: placed_at,
  }

  const items = draft.lines.map((line) => {
    const id = uid('oi')
    return {
      id,
      order_id: orderId,
      menu_item_id: line.menu_item_id,
      name_snapshot: line.name,
      variant_name: line.variant_name,
      unit_price: line.unit_price,
      quantity: line.quantity,
      line_total: line.unit_price * line.quantity,
      notes: line.notes,
      modifiers: line.modifiers.map((modifier) => ({
        id: uid('oim'),
        order_item_id: id,
        group_name: modifier.group_name,
        option_name: modifier.option_name,
        price_delta: modifier.price_delta,
      })),
    }
  })

  const payments: Payment[] = [
    {
      id: uid('pay'),
      order_id: orderId,
      method: draft.payment_method,
      status: draft.payment_method === 'upi' ? 'pending' : 'unpaid',
      amount: totals.total,
      reference: draft.payment_method === 'upi' ? null : null,
      confirmed_by: null,
      confirmed_at: null,
      created_at: placed_at,
    },
  ]

  const events: OrderStatusEvent[] = [
    {
      id: uid('evt'),
      order_id: orderId,
      status: 'pending',
      note: 'Order placed',
      created_by: actor.id,
      created_at: placed_at,
    },
  ]

  const created: OrderWithItems = { ...order, items, events, payments }

  commit(
    withAudit(
      { ...state, orders: [created, ...state.orders] },
      {
        actor_id: actor.id,
        actor_name: actor.name,
        action: 'order.created',
        entity: 'orders',
        entity_id: orderId,
        meta: { reference: order.reference },
      },
    ),
  )

  return created
}

export function findOrderByTrackingToken(
  token: string,
): OrderWithItems | undefined {
  return state.orders.find((order) => order.tracking_token === token)
}

export function findOrderById(id: string): OrderWithItems | undefined {
  return state.orders.find((order) => order.id === id)
}

export function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  actor: { id: string | null; name: string | null },
): void {
  const target = state.orders.find((order) => order.id === orderId)
  if (!target) return
  const event: OrderStatusEvent = {
    id: uid('evt'),
    order_id: orderId,
    status,
    note: null,
    created_by: actor.id,
    created_at: nowIso(),
  }
  const updated: OrderWithItems = {
    ...target,
    status,
    updated_at: nowIso(),
    events: [...target.events, event],
  }
  commit(
    withAudit(
      {
        ...state,
        orders: state.orders.map((order) =>
          order.id === orderId ? updated : order,
        ),
      },
      {
        actor_id: actor.id,
        actor_name: actor.name,
        action: `order.status.${status}`,
        entity: 'orders',
        entity_id: orderId,
        meta: null,
      },
    ),
  )
}

export function confirmPayment(
  orderId: string,
  actor: { id: string | null; name: string | null },
): void {
  const target = state.orders.find((order) => order.id === orderId)
  if (!target) return
  const updated: OrderWithItems = {
    ...target,
    payment_status: 'paid',
    updated_at: nowIso(),
    payments: target.payments.map((payment) => ({
      ...payment,
      status: 'paid',
      confirmed_by: actor.id,
      confirmed_at: nowIso(),
    })),
  }
  commit(
    withAudit(
      {
        ...state,
        orders: state.orders.map((order) =>
          order.id === orderId ? updated : order,
        ),
      },
      {
        actor_id: actor.id,
        actor_name: actor.name,
        action: 'payment.confirmed',
        entity: 'payments',
        entity_id: orderId,
        meta: { amount: updated.total },
      },
    ),
  )
}

export function upsertCategory(input: {
  id?: string
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
}): Category {
  if (input.id) {
    const existing = state.categories.find(
      (category) => category.id === input.id,
    )
    if (existing) {
      const updated: Category = {
        ...existing,
        name: input.name,
        description: input.description,
        sort_order: input.sort_order,
        is_active: input.is_active,
      }
      commit({
        ...state,
        categories: state.categories.map((category) =>
          category.id === input.id ? updated : category,
        ),
      })
      return updated
    }
  }
  const created: Category = {
    id: uid('cat'),
    name: input.name,
    slug: input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: input.description,
    sort_order: input.sort_order,
    is_active: input.is_active,
    created_at: nowIso(),
  }
  commit({ ...state, categories: [...state.categories, created] })
  return created
}

export function deleteCategory(id: string): void {
  const hasItems = state.menuItems.some((item) => item.category_id === id)
  if (hasItems) {
    throw new Error('Cannot delete a category that still has menu items.')
  }
  commit({
    ...state,
    categories: state.categories.filter((category) => category.id !== id),
  })
}

export function upsertMenuItem(input: {
  id?: string
  category_id: string
  name: string
  description: string | null
  base_price: number
  is_available: boolean
  is_featured: boolean
  tags: string[]
  sort_order: number
  variants: Array<{ id?: string; name: string; price_delta: number }>
  group_ids: string[]
}): MenuItem {
  const base: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'> = {
    category_id: input.category_id,
    name: input.name,
    description: input.description,
    image_url: null,
    base_price: input.base_price,
    is_available: input.is_available,
    is_featured: input.is_featured,
    tags: input.tags,
    sort_order: input.sort_order,
  }

  if (input.id) {
    const existing = state.menuItems.find((item) => item.id === input.id)
    if (existing) {
      const updated: MenuItem = {
        ...existing,
        ...base,
        updated_at: nowIso(),
      }
      const variants: Variant[] = input.variants.map((variant, index) => ({
        id: variant.id ?? uid('var'),
        menu_item_id: existing.id,
        name: variant.name,
        price_delta: variant.price_delta,
        is_default: index === 0,
        sort_order: index + 1,
      }))
      const itemGroups: MenuItemModifierGroup[] = input.group_ids.map(
        (group_id, index) => ({
          menu_item_id: existing.id,
          group_id,
          sort_order: index + 1,
        }),
      )
      commit({
        ...state,
        menuItems: state.menuItems.map((item) =>
          item.id === existing.id ? updated : item,
        ),
        variants: [
          ...state.variants.filter((v) => v.menu_item_id !== existing.id),
          ...variants,
        ],
        itemGroups: [
          ...state.itemGroups.filter((g) => g.menu_item_id !== existing.id),
          ...itemGroups,
        ],
      })
      return updated
    }
  }

  const id = uid('item')
  const created: MenuItem = {
    ...base,
    id,
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  const variants: Variant[] = input.variants.map((variant, index) => ({
    id: uid('var'),
    menu_item_id: id,
    name: variant.name,
    price_delta: variant.price_delta,
    is_default: index === 0,
    sort_order: index + 1,
  }))
  const itemGroups: MenuItemModifierGroup[] = input.group_ids.map(
    (group_id, index) => ({
      menu_item_id: id,
      group_id,
      sort_order: index + 1,
    }),
  )
  commit({
    ...state,
    menuItems: [...state.menuItems, created],
    variants: [...state.variants, ...variants],
    itemGroups: [...state.itemGroups, ...itemGroups],
  })
  return created
}

export function setMenuItemAvailability(id: string, isAvailable: boolean): void {
  commit({
    ...state,
    menuItems: state.menuItems.map((item) =>
      item.id === id
        ? { ...item, is_available: isAvailable, updated_at: nowIso() }
        : item,
    ),
  })
}

export function deleteMenuItem(id: string): void {
  commit({
    ...state,
    menuItems: state.menuItems.filter((item) => item.id !== id),
    variants: state.variants.filter((variant) => variant.menu_item_id !== id),
    itemGroups: state.itemGroups.filter((link) => link.menu_item_id !== id),
  })
}

export function upsertTable(input: {
  id?: string
  label: string
  seats: number
  zone: string | null
  is_active: boolean
}): CafeTable {
  if (input.id) {
    const existing = state.tables.find((table) => table.id === input.id)
    if (existing) {
      const updated: CafeTable = { ...existing, ...input }
      commit({
        ...state,
        tables: state.tables.map((table) =>
          table.id === input.id ? updated : table,
        ),
      })
      return updated
    }
  }
  const created: CafeTable = {
    id: uid('table'),
    label: input.label,
    token: generateToken(28),
    seats: input.seats,
    zone: input.zone,
    is_active: input.is_active,
    created_at: nowIso(),
  }
  commit({ ...state, tables: [...state.tables, created] })
  return created
}

export function regenerateTableToken(id: string): CafeTable | undefined {
  const existing = state.tables.find((table) => table.id === id)
  if (!existing) return undefined
  const updated: CafeTable = { ...existing, token: generateToken(28) }
  commit({
    ...state,
    tables: state.tables.map((table) => (table.id === id ? updated : table)),
  })
  return updated
}

export function deleteTable(id: string): void {
  commit({ ...state, tables: state.tables.filter((table) => table.id !== id) })
}

export function upsertStaff(input: {
  id?: string
  full_name: string
  email: string
  role: StaffRole
  is_active: boolean
  pin: string
}): DemoStaff {
  if (input.id) {
    const existing = state.staff.find((member) => member.id === input.id)
    if (existing) {
      const updated: DemoStaff = { ...existing, ...input }
      commit({
        ...state,
        staff: state.staff.map((member) =>
          member.id === input.id ? updated : member,
        ),
      })
      return updated
    }
  }
  const created: DemoStaff = { ...input, id: uid('staff') }
  commit({ ...state, staff: [...state.staff, created] })
  return created
}

export function deleteStaff(id: string): void {
  const owners = state.staff.filter(
    (member) => member.role === 'owner' && member.id !== id,
  )
  const target = state.staff.find((member) => member.id === id)
  if (target?.role === 'owner' && owners.length === 0) {
    throw new Error('At least one owner account is required.')
  }
  commit({ ...state, staff: state.staff.filter((member) => member.id !== id) })
}

export function updateSettings(patch: Partial<CafeSetting>): CafeSetting {
  const updated: CafeSetting = {
    ...state.settings,
    ...patch,
    updated_at: nowIso(),
  }
  commit({ ...state, settings: updated })
  return updated
}

export function upsertModifierGroup(input: {
  id?: string
  name: string
  selection_type: 'single' | 'multiple'
  is_required: boolean
  min_select: number
  max_select: number | null
  sort_order: number
}): ModifierGroup {
  if (input.id) {
    const existing = state.groups.find((group) => group.id === input.id)
    if (existing) {
      const updated: ModifierGroup = { ...existing, ...input }
      commit({
        ...state,
        groups: state.groups.map((group) =>
          group.id === input.id ? updated : group,
        ),
      })
      return updated
    }
  }
  const created: ModifierGroup = { ...input, id: uid('mg') }
  commit({ ...state, groups: [...state.groups, created] })
  return created
}

export function deleteModifierGroup(id: string): void {
  commit({
    ...state,
    groups: state.groups.filter((group) => group.id !== id),
    options: state.options.filter((option) => option.group_id !== id),
    itemGroups: state.itemGroups.filter((link) => link.group_id !== id),
  })
}

export function upsertModifierOption(input: {
  id?: string
  group_id: string
  name: string
  price_delta: number
  is_available: boolean
  sort_order: number
}): ModifierOption {
  if (input.id) {
    const existing = state.options.find((option) => option.id === input.id)
    if (existing) {
      const updated: ModifierOption = { ...existing, ...input }
      commit({
        ...state,
        options: state.options.map((option) =>
          option.id === input.id ? updated : option,
        ),
      })
      return updated
    }
  }
  const created: ModifierOption = { ...input, id: uid('mo') }
  commit({ ...state, options: [...state.options, created] })
  return created
}

export function deleteModifierOption(id: string): void {
  commit({
    ...state,
    options: state.options.filter((option) => option.id !== id),
  })
}

export function listModifierGroupsWithOptions(): Array<
  ModifierGroup & { options: ModifierOption[] }
> {
  return [...state.groups]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((group) => ({
      ...group,
      options: state.options
        .filter((option) => option.group_id === group.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
}

export function listAuditLogs(): AuditLog[] {
  return state.audit
}
