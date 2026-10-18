import { requireSupabase } from '../lib/supabase'
import { isSupabaseConfigured } from '../lib/env'
import { buildDemoMenuTree } from '../data/demo'
import { getState } from '../data/local/store'
import type {
  CafeTable,
  Category,
  MenuTreeItem,
  MenuItemModifierGroup,
  ModifierGroup,
  ModifierOption,
  Variant,
  MenuItem,
} from '../types/db'

function assembleMenuTree(input: {
  items: MenuItem[]
  variants: Variant[]
  groups: ModifierGroup[]
  options: ModifierOption[]
  itemGroups: MenuItemModifierGroup[]
}): MenuTreeItem[] {
  return input.items
    .map((item) => {
      const variants = input.variants
        .filter((variant) => variant.menu_item_id === item.id)
        .sort((a, b) => a.sort_order - b.sort_order)

      const groups = input.itemGroups
        .filter((link) => link.menu_item_id === item.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .flatMap((link) => {
          const group = input.groups.find(
            (candidate) => candidate.id === link.group_id,
          )
          if (!group) return []
          return [
            {
              ...group,
              options: input.options
                .filter((option) => option.group_id === group.id)
                .sort((a, b) => a.sort_order - b.sort_order),
            },
          ]
        })

      return { ...item, variants, modifier_groups: groups }
    })
    .sort((a, b) => a.sort_order - b.sort_order)
}

export async function fetchMenuTree(): Promise<MenuTreeItem[]> {
  if (!isSupabaseConfigured) {
    return buildDemoMenuTree()
  }

  const client = requireSupabase()
  const [items, variants, groups, options, itemGroups] = await Promise.all([
    client.from('menu_items').select('*').order('sort_order'),
    client.from('menu_item_variants').select('*').order('sort_order'),
    client.from('modifier_groups').select('*').order('sort_order'),
    client.from('modifier_options').select('*').order('sort_order'),
    client.from('menu_item_modifier_groups').select('*').order('sort_order'),
  ])

  const error =
    items.error ?? variants.error ?? groups.error ?? options.error ?? itemGroups.error
  if (error) throw new Error(error.message)

  return assembleMenuTree({
    items: (items.data ?? []) as MenuItem[],
    variants: (variants.data ?? []) as Variant[],
    groups: (groups.data ?? []) as ModifierGroup[],
    options: (options.data ?? []) as ModifierOption[],
    itemGroups: (itemGroups.data ?? []) as MenuItemModifierGroup[],
  })
}

export async function fetchCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) {
    return [...getState().categories].sort(
      (a, b) => a.sort_order - b.sort_order,
    )
  }
  const client = requireSupabase()
  const { data, error } = await client
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  if (error) throw new Error(error.message)
  return (data ?? []) as Category[]
}

export async function fetchActiveTables(): Promise<CafeTable[]> {
  if (!isSupabaseConfigured) {
    return getState().tables.filter((table) => table.is_active)
  }
  const client = requireSupabase()
  const { data, error } = await client
    .from('cafe_tables')
    .select('*')
    .eq('is_active', true)
    .order('label')
  if (error) throw new Error(error.message)
  return (data ?? []) as CafeTable[]
}

export async function resolveTableByToken(
  token: string,
): Promise<CafeTable | null> {
  const clean = token.trim()
  if (!clean) return null

  if (!isSupabaseConfigured) {
    return (
      getState().tables.find(
        (table) => table.token === clean && table.is_active,
      ) ?? null
    )
  }

  const client = requireSupabase()
  const { data, error } = await client
    .from('cafe_tables')
    .select('*')
    .eq('token', clean)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as CafeTable | null) ?? null
}
