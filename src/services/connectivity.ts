import type { SupabaseClient } from '@supabase/supabase-js'

export type BackendMode = 'demo' | 'live' | 'unavailable'

export interface BackendStatus {
  mode: BackendMode
  reachable: boolean
  schemaReady: boolean
  missing: string[]
  message: string
}

export const REQUIRED_TABLES = [
  'profiles',
  'categories',
  'menu_items',
  'menu_item_variants',
  'modifier_groups',
  'modifier_options',
  'menu_item_modifier_groups',
  'cafe_tables',
  'cafe_settings',
  'orders',
  'order_items',
  'order_item_modifiers',
  'order_status_events',
  'payments',
] as const

export const REQUIRED_FUNCTIONS = [
  'create_order',
  'get_order_by_token',
  'get_order_detail',
  'list_orders',
  'update_order_status',
  'confirm_payment',
  'regenerate_table_token',
  'resolve_table_by_token',
] as const

interface PostgrestErrorLike {
  code?: string
  message?: string
}

const SCHEMA_MISSING_CODES = new Set([
  'PGRST205',
  'PGRST202',
  '42P01',
  '42883',
  'PGRST200',
])

const NETWORK_MARKERS = [
  'failed to fetch',
  'networkerror',
  'network request failed',
  'load failed',
  'fetch failed',
  'timeout',
  'aborted',
]

export function isNetworkError(error: unknown): boolean {
  if (!error) return false
  const message = (error as PostgrestErrorLike).message ?? String(error)
  const lower = message.toLowerCase()
  return NETWORK_MARKERS.some((marker) => lower.includes(marker))
}

export function isSchemaMissingError(error: PostgrestErrorLike): boolean {
  if (error.code && SCHEMA_MISSING_CODES.has(error.code)) return true
  const message = (error.message ?? '').toLowerCase()
  return (
    message.includes('could not find the table') ||
    message.includes('could not find the function') ||
    message.includes('does not exist')
  )
}

async function checkTable(
  client: SupabaseClient,
  table: string,
): Promise<{ ok: boolean; network: boolean }> {
  try {
    const { error } = await client
      .from(table)
      .select('*', { head: true, count: 'exact' })
      .limit(1)
    if (!error) return { ok: true, network: false }
    if (isNetworkError(error)) return { ok: false, network: true }
    if (isSchemaMissingError(error)) return { ok: false, network: false }
    // Any other error (e.g. RLS/permission) still means the table exists.
    return { ok: true, network: false }
  } catch (cause) {
    return { ok: false, network: isNetworkError(cause) }
  }
}

// Argument shapes must match each function's parameter names exactly so that a
// missing function yields a schema-cache error rather than an argument error.
// All calls are read-only or raise before writing, so nothing is mutated.
const FUNCTION_SMOKE_ARGS: Record<string, Record<string, unknown>> = {
  create_order: { p_payload: { items: [] } },
  get_order_by_token: { p_token: 'SMOKE_TEST_TOKEN_00' },
  get_order_detail: {
    p_order_id: '00000000-0000-0000-0000-000000000000',
  },
  list_orders: {},
  update_order_status: {
    p_order_id: '00000000-0000-0000-0000-000000000000',
    p_status: 'pending',
  },
  confirm_payment: { p_order_id: '00000000-0000-0000-0000-000000000000' },
  regenerate_table_token: {
    p_table_id: '00000000-0000-0000-0000-000000000000',
  },
  resolve_table_by_token: { p_token: 'SMOKE_TEST_TOKEN_00' },
}

async function checkFunction(
  client: SupabaseClient,
  fn: string,
): Promise<{ ok: boolean; network: boolean }> {
  try {
    const args = FUNCTION_SMOKE_ARGS[fn] ?? {}
    const { error } = await client.rpc(fn, args)
    if (!error) return { ok: true, network: false }
    if (isNetworkError(error)) return { ok: false, network: true }
    if (isSchemaMissingError(error)) return { ok: false, network: false }
    // Permission or validation errors still prove the function exists.
    return { ok: true, network: false }
  } catch (cause) {
    return { ok: false, network: isNetworkError(cause) }
  }
}

/**
 * Verify that the configured Supabase project is reachable and that the
 * expected schema (tables + functions) is present. Never mutates data.
 */
export async function verifyBackend(
  client: SupabaseClient,
): Promise<BackendStatus> {
  const tableChecks = await Promise.all(
    REQUIRED_TABLES.map(async (table) => ({
      table,
      ...(await checkTable(client, table)),
    })),
  )

  if (tableChecks.some((result) => result.network)) {
    return {
      mode: 'unavailable',
      reachable: false,
      schemaReady: false,
      missing: [],
      message:
        'Could not reach Supabase. Check your internet connection and the project URL, then reload.',
    }
  }

  const missingTables = tableChecks
    .filter((result) => !result.ok)
    .map((result) => result.table)

  const functionChecks = await Promise.all(
    REQUIRED_FUNCTIONS.map(async (fn) => ({
      fn,
      ...(await checkFunction(client, fn)),
    })),
  )

  if (functionChecks.some((result) => result.network)) {
    return {
      mode: 'unavailable',
      reachable: false,
      schemaReady: false,
      missing: [],
      message:
        'Could not reach Supabase. Check your internet connection and the project URL, then reload.',
    }
  }

  const missingFunctions = functionChecks
    .filter((result) => !result.ok)
    .map((result) => result.fn)

  const missing = [...missingTables, ...missingFunctions]

  if (missing.length > 0) {
    return {
      mode: 'unavailable',
      reachable: true,
      schemaReady: false,
      missing,
      message:
        'Supabase is reachable but the database schema is incomplete. Apply the migrations in supabase/migrations, then reload.',
    }
  }

  return {
    mode: 'live',
    reachable: true,
    schemaReady: true,
    missing: [],
    message: 'Connected to Supabase. Menu, orders and admin data are live.',
  }
}
