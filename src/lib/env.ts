export interface SupabaseConfig {
  url: string
  anonKey: string
  configured: boolean
}

const PLACEHOLDER_MARKERS = [
  'your-project',
  'your-supabase',
  'your-project-ref',
  'your-anon',
  'your-publishable',
  'example.supabase.co',
  'replace-me',
  'replace_me',
  'changeme',
  'placeholder',
]

export function looksLikePlaceholder(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return PLACEHOLDER_MARKERS.some((marker) => normalized.includes(marker))
}

const PUBLISHABLE_PREFIX = 'sb_publishable_'
const PUBLISHABLE_BODY_PATTERN = /^[A-Za-z0-9_-]+$/
const MIN_PUBLISHABLE_BODY_LENGTH = 10

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const encoded = parts[1]
  if (!encoded) return null
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  try {
    const parsed: unknown = JSON.parse(atob(padded))
    return parsed !== null && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

/** New-style key: `sb_publishable_` followed by a long opaque token. */
export function isPublishableKey(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed.startsWith(PUBLISHABLE_PREFIX)) return false
  const body = trimmed.slice(PUBLISHABLE_PREFIX.length)
  return (
    body.length >= MIN_PUBLISHABLE_BODY_LENGTH &&
    PUBLISHABLE_BODY_PATTERN.test(body)
  )
}

/** Legacy anon key: a JWT whose payload declares `"role":"anon"`. */
export function isLegacyAnonKey(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed.startsWith('eyJ')) return false
  const payload = decodeJwtPayload(trimmed)
  return payload !== null && payload.role === 'anon'
}

/**
 * A key is only accepted when it matches a known Supabase key shape (new
 * publishable key or legacy anonymous JWT). An arbitrary non-empty string is
 * never treated as valid.
 */
export function isSupportedSupabaseKey(value: string): boolean {
  const trimmed = (value ?? '').trim()
  if (trimmed.length === 0 || looksLikePlaceholder(trimmed)) return false
  return isPublishableKey(trimmed) || isLegacyAnonKey(trimmed)
}

export function resolveSupabaseConfig(
  rawUrl?: string,
  rawKey?: string,
): SupabaseConfig {
  const url = (rawUrl ?? '').trim()
  const anonKey = (rawKey ?? '').trim()
  const hasValues = url.length > 0 && anonKey.length > 0
  const isReal =
    hasValues && !looksLikePlaceholder(url) && isSupportedSupabaseKey(anonKey)

  return { url, anonKey, configured: isReal }
}

export function normalizeBaseUrl(value?: string): string | null {
  const trimmed = (value ?? '').trim()
  if (trimmed.length === 0 || looksLikePlaceholder(trimmed)) return null
  return trimmed.replace(/\/+$/, '')
}

const runtimeEnv = import.meta.env

export const supabaseConfig: SupabaseConfig = resolveSupabaseConfig(
  runtimeEnv.VITE_SUPABASE_URL,
  runtimeEnv.VITE_SUPABASE_ANON_KEY ??
    runtimeEnv.VITE_SUPABASE_PUBLISHABLE_KEY,
)

export const isSupabaseConfigured = supabaseConfig.configured

/**
 * Optional public base URL for QR codes. When unset the app falls back to the
 * current origin, which is correct for local development.
 */
export const publicAppUrl = normalizeBaseUrl(runtimeEnv.VITE_PUBLIC_APP_URL)
