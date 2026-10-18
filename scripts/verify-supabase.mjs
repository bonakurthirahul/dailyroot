#!/usr/bin/env node
// Real Supabase connectivity + schema verifier.
//
// Reads credentials from .env.local / .env (VITE_SUPABASE_URL plus either
// VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY), then performs
// harmless read-only checks. The key is NEVER printed — only a redacted
// fingerprint (prefix + length).
//
// Usage:  node scripts/verify-supabase.mjs

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()

const REQUIRED_TABLES = [
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
]

// Argument shapes must match each function's parameter names exactly.
const REQUIRED_FUNCTIONS = {
  create_order: { p_payload: { items: [] } },
  get_order_by_token: { p_token: 'SMOKE_TEST_TOKEN_00' },
  get_order_detail: { p_order_id: '00000000-0000-0000-0000-000000000000' },
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

const PLACEHOLDER_MARKERS = [
  'your-project',
  'your-supabase',
  'your-anon',
  'your-publishable',
  'example.supabase.co',
  'replace-me',
  'replace_me',
  'changeme',
  'placeholder',
]

function parseEnvFile(path) {
  const out = {}
  if (!existsSync(path)) return out
  const text = readFileSync(path, 'utf8')
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

function loadEnv() {
  return {
    ...parseEnvFile(resolve(ROOT, '.env')),
    ...parseEnvFile(resolve(ROOT, '.env.local')),
  }
}

function looksLikePlaceholder(value) {
  const v = (value ?? '').trim().toLowerCase()
  if (!v) return true
  return PLACEHOLDER_MARKERS.some((marker) => v.includes(marker))
}

const PUBLISHABLE_PREFIX = 'sb_publishable_'
const PUBLISHABLE_BODY_PATTERN = /^[A-Za-z0-9_-]+$/
const MIN_PUBLISHABLE_BODY_LENGTH = 10

function decodeJwtPayload(token) {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const encoded = parts[1]
  if (!encoded) return null
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  try {
    const parsed = JSON.parse(atob(padded))
    return parsed !== null && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function isPublishableKey(value) {
  const trimmed = (value ?? '').trim()
  if (!trimmed.startsWith(PUBLISHABLE_PREFIX)) return false
  const body = trimmed.slice(PUBLISHABLE_PREFIX.length)
  return (
    body.length >= MIN_PUBLISHABLE_BODY_LENGTH &&
    PUBLISHABLE_BODY_PATTERN.test(body)
  )
}

function isLegacyAnonKey(value) {
  const trimmed = (value ?? '').trim()
  if (!trimmed.startsWith('eyJ')) return false
  const payload = decodeJwtPayload(trimmed)
  return payload !== null && payload.role === 'anon'
}

function isSupportedSupabaseKey(value) {
  const trimmed = (value ?? '').trim()
  if (trimmed.length === 0 || looksLikePlaceholder(trimmed)) return false
  return isPublishableKey(trimmed) || isLegacyAnonKey(trimmed)
}

function describeKeyFormat(key) {
  if (!key) return 'none'
  if (key.startsWith('sb_secret_')) return 'secret (rejected)'
  if (key.startsWith(PUBLISHABLE_PREFIX)) return 'publishable'
  if (key.startsWith('eyJ')) return 'legacy anon JWT'
  return 'unrecognized'
}

function redactKey(key) {
  if (!key) return '<none>'
  const safePrefix = key.startsWith('sb_publishable_')
    ? 'sb_publishable_'
    : key.startsWith('sb_secret_')
      ? 'sb_secret_(!!)'
      : key.startsWith('eyJ')
        ? 'eyJ…(legacy)'
        : '(redacted)'
  return `${safePrefix} (length=${key.length})`
}

async function request(url, { key, accept, method = 'GET', body } = {}) {
  const headers = {}
  if (key) {
    headers.apikey = key
    headers.Authorization = `Bearer ${key}`
  }
  if (accept) headers.Accept = accept
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  let parsed = null
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = text
  }
  return { status: response.status, body: parsed, text }
}

function classifyFunctionResult(result) {
  const body = result.body
  const code =
    body && typeof body === 'object' && 'code' in body ? String(body.code) : ''
  const message =
    body && typeof body === 'object' && 'message' in body
      ? String(body.message)
      : ''
  if (
    result.status === 404 ||
    code === 'PGRST202' ||
    /could not find the function/i.test(message)
  ) {
    return 'missing'
  }
  // 401/403/42501 or a raised validation/business error all prove it exists.
  return 'present'
}

function classifyTableResult(result) {
  if (result.status === 200) return 'present'
  const body = result.body
  const code =
    body && typeof body === 'object' && 'code' in body ? String(body.code) : ''
  const message =
    body && typeof body === 'object' && 'message' in body
      ? String(body.message)
      : ''
  if (
    result.status === 404 ||
    code === 'PGRST205' ||
    code === '42P01' ||
    /could not find the table/i.test(message)
  ) {
    return 'missing'
  }
  // Any other real HTTP answer (401/403 permission, 400 validation) proves the
  // object exists behind RLS/grants.
  if (result.status >= 200 && result.status < 500) return 'present'
  return 'unknown'
}

async function main() {
  const env = loadEnv()
  const url = (
    env.VITE_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  ).trim()
  const key = (
    env.VITE_SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).trim()

  console.log('Brew & Bean — Supabase connection check')
  console.log('---------------------------------------')
  console.log(`URL:  ${url || '<none>'}`)
  console.log(`Key:  ${redactKey(key)}`)

  if (key.toLowerCase().startsWith('sb_secret_')) {
    console.log('\nFAIL: that is a SECRET key. Use the publishable key only.')
    process.exit(2)
  }
  if (!url || looksLikePlaceholder(url)) {
    console.log('\nFAIL: missing or placeholder VITE_SUPABASE_URL.')
    process.exit(2)
  }
  if (!key || !isSupportedSupabaseKey(key)) {
    console.log(
      `\nFAIL: no valid Supabase key found (format: ${describeKeyFormat(key)}).`,
    )
    console.log('A key must be one of:')
    console.log('  - new publishable key:  VITE_SUPABASE_ANON_KEY=sb_publishable_...')
    console.log(
      '  - legacy anon JWT key:  VITE_SUPABASE_ANON_KEY=eyJ...  (payload role "anon")',
    )
    console.log('Enter it locally without echoing it, then re-run this verifier.')
    process.exit(2)
  }

  // 1) Auth health ----------------------------------------------------------
  let health
  try {
    health = await request(`${url}/auth/v1/health`, { key })
  } catch (error) {
    console.log(`\nFAIL: network error reaching ${url} — ${error.message}`)
    process.exit(1)
  }
  if (health.status === 401) {
    console.log(
      '\nFAIL: 401 Unauthorized — the publishable key is not valid for this project.',
    )
    process.exit(1)
  }
  console.log(
    `\n[1/3] Auth health: HTTP ${health.status}${
      health.status === 200 ? ' — project reachable' : ''
    }`,
  )

  // 2) Tables via direct read-only probes ----------------------------------
  // The PostgREST root OpenAPI spec is secret-key-only on newer projects, so
  // probe each table with `?select=*&limit=0` (no rows read, RLS respected).
  const presentTables = []
  const missingTables = []
  const unknownTables = []
  for (const table of REQUIRED_TABLES) {
    let result
    try {
      result = await request(`${url}/rest/v1/${table}?select=*&limit=0`, {
        key,
      })
    } catch {
      result = { status: 0, body: null, text: '' }
    }
    const verdict = classifyTableResult(result)
    if (verdict === 'present') presentTables.push(table)
    else if (verdict === 'missing') missingTables.push(table)
    else unknownTables.push(table)
  }
  console.log(
    `[2/3] Tables:    ${presentTables.length}/${REQUIRED_TABLES.length} present`,
  )
  if (missingTables.length) {
    console.log(`      missing:  ${missingTables.join(', ')}`)
  }
  if (unknownTables.length) {
    console.log(`      unknown:  ${unknownTables.join(', ')}`)
  }

  // 3) Functions via direct probes -----------------------------------------
  const presentFunctions = []
  const missingFunctions = []
  for (const [fn, args] of Object.entries(REQUIRED_FUNCTIONS)) {
    let result
    try {
      result = await request(`${url}/rest/v1/rpc/${fn}`, {
        key,
        method: 'POST',
        body: args,
      })
    } catch {
      result = { status: 0, body: null, text: '' }
    }
    if (classifyFunctionResult(result) === 'present') {
      presentFunctions.push(fn)
    } else {
      missingFunctions.push(fn)
    }
  }
  const fnTotal = Object.keys(REQUIRED_FUNCTIONS).length
  console.log(
    `[3/3] Functions: ${presentFunctions.length}/${fnTotal} present`,
  )
  if (missingFunctions.length) {
    console.log(`      missing:  ${missingFunctions.join(', ')}`)
  }

  console.log('\n---------------------------------------')
  const schemaComplete =
    missingTables.length === 0 &&
    missingFunctions.length === 0 &&
    unknownTables.length === 0
  if (schemaComplete) {
    console.log(
      'RESULT: CONNECTED — project reachable and schema complete. Live mode is safe.',
    )
  } else {
    if (missingTables.length || missingFunctions.length) {
      console.log(
        'RESULT: CONNECTED but SCHEMA INCOMPLETE — apply supabase/migrations, then re-run.',
      )
    } else {
      console.log(
        'RESULT: CONNECTED but schema state UNKNOWN — some probes failed (see "unknown" above).',
      )
    }
  }
}

main().catch((error) => {
  console.error(`\nUnexpected error: ${error?.message ?? error}`)
  process.exit(1)
})
