import { requireSupabase } from '../lib/supabase'
import { isSupabaseConfigured } from '../lib/env'
import {
  deleteCategory as localDeleteCategory,
  deleteMenuItem as localDeleteMenuItem,
  deleteModifierGroup as localDeleteModifierGroup,
  deleteModifierOption as localDeleteModifierOption,
  deleteStaff as localDeleteStaff,
  deleteTable as localDeleteTable,
  getState,
  listAuditLogs as localListAuditLogs,
  listModifierGroupsWithOptions as localListModifierGroups,
  regenerateTableToken as localRegenerateTableToken,
  setMenuItemAvailability as localSetAvailability,
  updateSettings as localUpdateSettings,
  upsertCategory as localUpsertCategory,
  upsertMenuItem as localUpsertMenuItem,
  upsertModifierGroup as localUpsertModifierGroup,
  upsertModifierOption as localUpsertModifierOption,
  upsertStaff as localUpsertStaff,
  upsertTable as localUpsertTable,
} from '../data/local/store'
import { DEMO_STAFF } from '../data/demo'
import type {
  AuditLog,
  CafeSetting,
  CafeTable,
  Category,
  MenuItem,
  ModifierGroup,
  ModifierOption,
  OrderWithItems,
  StaffRole,
} from '../types/db'

export interface MenuItemDraft {
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
}

export interface CategoryDraft {
  id?: string
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
}

export interface TableDraft {
  id?: string
  label: string
  seats: number
  zone: string | null
  is_active: boolean
}

export interface StaffDraft {
  id?: string
  full_name: string
  email: string
  role: StaffRole
  is_active: boolean
  pin: string
}

export interface ModifierGroupDraft {
  id?: string
  name: string
  selection_type: 'single' | 'multiple'
  is_required: boolean
  min_select: number
  max_select: number | null
  sort_order: number
}

export interface ModifierOptionDraft {
  id?: string
  group_id: string
  name: string
  price_delta: number
  is_available: boolean
  sort_order: number
}

export async function listCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) {
    return [...getState().categories].sort(
      (a, b) => a.sort_order - b.sort_order,
    )
  }
  const client = requireSupabase()
  const { data, error } = await client
    .from('categories')
    .select('*')
    .order('sort_order')
  if (error) throw new Error(error.message)
  return (data ?? []) as Category[]
}

export async function saveCategory(draft: CategoryDraft): Promise<Category> {
  if (!isSupabaseConfigured) return localUpsertCategory(draft)
  const client = requireSupabase()
  const payload = {
    name: draft.name,
    slug: draft.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: draft.description,
    sort_order: draft.sort_order,
    is_active: draft.is_active,
  }
  const query = draft.id
    ? client.from('categories').update(payload).eq('id', draft.id).select().single()
    : client.from('categories').insert(payload).select().single()
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data as Category
}

export async function removeCategory(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    localDeleteCategory(id)
    return
  }
  const client = requireSupabase()
  const { error } = await client.from('categories').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function listMenuItems(): Promise<MenuItem[]> {
  if (!isSupabaseConfigured) {
    return [...getState().menuItems].sort((a, b) => a.sort_order - b.sort_order)
  }
  const client = requireSupabase()
  const { data, error } = await client
    .from('menu_items')
    .select('*')
    .order('sort_order')
  if (error) throw new Error(error.message)
  return (data ?? []) as MenuItem[]
}

export async function saveMenuItem(draft: MenuItemDraft): Promise<MenuItem> {
  if (!isSupabaseConfigured) return localUpsertMenuItem(draft)
  const client = requireSupabase()
  const payload = {
    category_id: draft.category_id,
    name: draft.name,
    description: draft.description,
    base_price: draft.base_price,
    is_available: draft.is_available,
    is_featured: draft.is_featured,
    tags: draft.tags,
    sort_order: draft.sort_order,
  }
  const query = draft.id
    ? client.from('menu_items').update(payload).eq('id', draft.id).select().single()
    : client.from('menu_items').insert(payload).select().single()
  const { data, error } = await query
  if (error) throw new Error(error.message)
  const item = data as MenuItem

  await client.from('menu_item_variants').delete().eq('menu_item_id', item.id)
  if (draft.variants.length > 0) {
    const { error: variantError } = await client
      .from('menu_item_variants')
      .insert(
        draft.variants.map((variant, index) => ({
          menu_item_id: item.id,
          name: variant.name,
          price_delta: variant.price_delta,
          is_default: index === 0,
          sort_order: index + 1,
        })),
      )
    if (variantError) throw new Error(variantError.message)
  }

  await client
    .from('menu_item_modifier_groups')
    .delete()
    .eq('menu_item_id', item.id)
  if (draft.group_ids.length > 0) {
    const { error: groupError } = await client
      .from('menu_item_modifier_groups')
      .insert(
        draft.group_ids.map((group_id, index) => ({
          menu_item_id: item.id,
          group_id,
          sort_order: index + 1,
        })),
      )
    if (groupError) throw new Error(groupError.message)
  }

  return item
}

export async function removeMenuItem(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    localDeleteMenuItem(id)
    return
  }
  const client = requireSupabase()
  const { error } = await client.from('menu_items').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function setMenuItemAvailability(
  id: string,
  isAvailable: boolean,
): Promise<void> {
  if (!isSupabaseConfigured) {
    localSetAvailability(id, isAvailable)
    return
  }
  const client = requireSupabase()
  const { error } = await client
    .from('menu_items')
    .update({ is_available: isAvailable })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function listTables(): Promise<CafeTable[]> {
  if (!isSupabaseConfigured) {
    return [...getState().tables].sort((a, b) => a.label.localeCompare(b.label))
  }
  const client = requireSupabase()
  const { data, error } = await client
    .from('cafe_tables')
    .select('*')
    .order('label')
  if (error) throw new Error(error.message)
  return (data ?? []) as CafeTable[]
}

export async function saveTable(draft: TableDraft): Promise<CafeTable> {
  if (!isSupabaseConfigured) return localUpsertTable(draft)
  const client = requireSupabase()
  const payload = {
    label: draft.label,
    seats: draft.seats,
    zone: draft.zone,
    is_active: draft.is_active,
  }
  const query = draft.id
    ? client.from('cafe_tables').update(payload).eq('id', draft.id).select().single()
    : client.from('cafe_tables').insert(payload).select().single()
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data as CafeTable
}

export async function removeTable(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    localDeleteTable(id)
    return
  }
  const client = requireSupabase()
  const { error } = await client.from('cafe_tables').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function regenerateTableToken(id: string): Promise<CafeTable> {
  if (!isSupabaseConfigured) {
    const updated = localRegenerateTableToken(id)
    if (!updated) throw new Error('Table not found.')
    return updated
  }
  const client = requireSupabase()
  const { data, error } = await client.rpc('regenerate_table_token', {
    p_table_id: id,
  })
  if (error) throw new Error(error.message)
  return (Array.isArray(data) ? data[0] : data) as CafeTable
}

export async function listStaff() {
  if (!isSupabaseConfigured) {
    return getState().staff.map((member) => ({
      id: member.id,
      full_name: member.full_name,
      email: member.email,
      role: member.role,
      is_active: member.is_active,
    }))
  }
  const client = requireSupabase()
  const { data, error } = await client
    .from('profiles')
    .select('id, full_name, email, role, is_active')
    .order('full_name')
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: row.id as string,
    full_name: (row.full_name as string) ?? '',
    email: (row.email as string) ?? '',
    role: row.role as StaffRole,
    is_active: Boolean(row.is_active),
  }))
}

export async function saveStaff(draft: StaffDraft) {
  if (!isSupabaseConfigured) {
    const saved = localUpsertStaff(draft)
    return {
      id: saved.id,
      full_name: saved.full_name,
      email: saved.email,
      role: saved.role,
      is_active: saved.is_active,
    }
  }
  if (!draft.id) {
    throw new Error(
      'Creating login accounts requires Supabase Auth. Invite the staff member from the Supabase dashboard, then assign a role here.',
    )
  }
  const client = requireSupabase()
  const { data, error } = await client
    .from('profiles')
    .update({
      full_name: draft.full_name,
      role: draft.role,
      is_active: draft.is_active,
    })
    .eq('id', draft.id)
    .select('id, full_name, email, role, is_active')
    .single()
  if (error) throw new Error(error.message)
  return {
    id: data.id as string,
    full_name: (data.full_name as string) ?? '',
    email: (data.email as string) ?? '',
    role: data.role as StaffRole,
    is_active: Boolean(data.is_active),
  }
}

export async function removeStaff(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    localDeleteStaff(id)
    return
  }
  throw new Error(
    'Removing staff accounts requires Supabase Auth. Deactivate the profile here and remove the auth user from the Supabase dashboard.',
  )
}

export async function listModifierGroups(): Promise<
  Array<ModifierGroup & { options: ModifierOption[] }>
> {
  if (!isSupabaseConfigured) return localListModifierGroups()
  const client = requireSupabase()
  const [groups, options] = await Promise.all([
    client.from('modifier_groups').select('*').order('sort_order'),
    client.from('modifier_options').select('*').order('sort_order'),
  ])
  if (groups.error) throw new Error(groups.error.message)
  if (options.error) throw new Error(options.error.message)
  return (groups.data ?? []).map((group) => ({
    ...(group as ModifierGroup),
    options: ((options.data ?? []) as ModifierOption[]).filter(
      (option) => option.group_id === group.id,
    ),
  }))
}

export async function saveModifierGroup(
  draft: ModifierGroupDraft,
): Promise<ModifierGroup> {
  if (!isSupabaseConfigured) return localUpsertModifierGroup(draft)
  const client = requireSupabase()
  const query = draft.id
    ? client.from('modifier_groups').update(draft).eq('id', draft.id).select().single()
    : client.from('modifier_groups').insert(draft).select().single()
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data as ModifierGroup
}

export async function removeModifierGroup(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    localDeleteModifierGroup(id)
    return
  }
  const client = requireSupabase()
  const { error } = await client.from('modifier_groups').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function saveModifierOption(
  draft: ModifierOptionDraft,
): Promise<ModifierOption> {
  if (!isSupabaseConfigured) return localUpsertModifierOption(draft)
  const client = requireSupabase()
  const query = draft.id
    ? client.from('modifier_options').update(draft).eq('id', draft.id).select().single()
    : client.from('modifier_options').insert(draft).select().single()
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data as ModifierOption
}

export async function removeModifierOption(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    localDeleteModifierOption(id)
    return
  }
  const client = requireSupabase()
  const { error } = await client.from('modifier_options').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getSettings(): Promise<CafeSetting> {
  if (!isSupabaseConfigured) return getState().settings
  const client = requireSupabase()
  const { data, error } = await client
    .from('cafe_settings')
    .select('*')
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Cafe settings have not been configured yet.')
  return data as CafeSetting
}

export async function updateSettings(
  patch: Partial<CafeSetting>,
): Promise<CafeSetting> {
  if (!isSupabaseConfigured) return localUpdateSettings(patch)
  const client = requireSupabase()
  const { data, error } = await client
    .from('cafe_settings')
    .update(patch)
    .eq('id', (await getSettings()).id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as CafeSetting
}

export async function listAuditLogs(): Promise<AuditLog[]> {
  if (!isSupabaseConfigured) return localListAuditLogs()
  const client = requireSupabase()
  const { data, error } = await client
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw new Error(error.message)
  return (data ?? []) as AuditLog[]
}

export interface ReportSummary {
  orderCount: number
  grossSales: number
  paidSales: number
  pendingPayments: number
  cancelledOrders: number
  averageOrderValue: number
  topItems: Array<{ name: string; quantity: number; revenue: number }>
  byDay: Array<{ date: string; orders: number; revenue: number }>
}

export function buildReport(
  orders: OrderWithItems[],
  range?: { from?: string; to?: string },
): ReportSummary {
  const inRange = orders.filter((order) => {
    const placed = Date.parse(order.placed_at)
    if (range?.from && placed < Date.parse(range.from)) return false
    if (range?.to && placed > Date.parse(range.to) + 86_399_000) return false
    return true
  })

  const active = inRange.filter((order) => order.status !== 'cancelled')
  const grossSales = active.reduce((sum, order) => sum + order.total, 0)
  const paidSales = active
    .filter((order) => order.payment_status === 'paid')
    .reduce((sum, order) => sum + order.total, 0)
  const pendingPayments = active
    .filter((order) => order.payment_status !== 'paid')
    .reduce((sum, order) => sum + order.total, 0)

  const itemMap = new Map<string, { quantity: number; revenue: number }>()
  for (const order of active) {
    for (const item of order.items) {
      const current = itemMap.get(item.name_snapshot) ?? {
        quantity: 0,
        revenue: 0,
      }
      current.quantity += item.quantity
      current.revenue += item.line_total
      itemMap.set(item.name_snapshot, current)
    }
  }

  const dayMap = new Map<string, { orders: number; revenue: number }>()
  for (const order of active) {
    const date = order.placed_at.slice(0, 10)
    const current = dayMap.get(date) ?? { orders: 0, revenue: 0 }
    current.orders += 1
    current.revenue += order.total
    dayMap.set(date, current)
  }

  return {
    orderCount: active.length,
    grossSales: Math.round(grossSales * 100) / 100,
    paidSales: Math.round(paidSales * 100) / 100,
    pendingPayments: Math.round(pendingPayments * 100) / 100,
    cancelledOrders: inRange.length - active.length,
    averageOrderValue:
      active.length > 0 ? Math.round((grossSales / active.length) * 100) / 100 : 0,
    topItems: [...itemMap.entries()]
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8),
    byDay: [...dayMap.entries()]
      .map(([date, value]) => ({ date, ...value }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  }
}

export const DEMO_ACCOUNTS = DEMO_STAFF
