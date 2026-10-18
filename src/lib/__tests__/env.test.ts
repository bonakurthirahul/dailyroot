import { describe, expect, it } from 'vitest'
import {
  isLegacyAnonKey,
  isPublishableKey,
  isSupportedSupabaseKey,
  looksLikePlaceholder,
  normalizeBaseUrl,
  resolveSupabaseConfig,
} from '../env'

function base64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function makeJwt(payload: Record<string, unknown>): string {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64Url(JSON.stringify(payload))
  return `${header}.${body}.signature`
}

const PUBLISHABLE_KEY = 'sb_publishable_AbCdEfGhIjKlMnOpQrStUv'
const LEGACY_ANON_KEY = makeJwt({ role: 'anon' })
const LEGACY_SERVICE_KEY = makeJwt({ role: 'service_role' })

describe('resolveSupabaseConfig', () => {
  it('is unconfigured when values are missing', () => {
    expect(resolveSupabaseConfig(undefined, undefined).configured).toBe(false)
    expect(resolveSupabaseConfig('', '').configured).toBe(false)
  })

  it('detects placeholder values', () => {
    const config = resolveSupabaseConfig(
      'https://your-project.supabase.co',
      'your-anon-key',
    )
    expect(config.configured).toBe(false)
  })

  it('detects the example placeholder keys', () => {
    expect(
      resolveSupabaseConfig(
        'https://your-project-ref.supabase.co',
        'your-publishable-key',
      ).configured,
    ).toBe(false)
  })

  it('accepts a legacy anon JWT key', () => {
    const config = resolveSupabaseConfig(
      'https://abcdefgh.supabase.co',
      LEGACY_ANON_KEY,
    )
    expect(config.configured).toBe(true)
    expect(config.url).toContain('supabase.co')
  })

  it('accepts a publishable-style key', () => {
    const config = resolveSupabaseConfig(
      'https://hjgarepgjoikjlblkpxs.supabase.co',
      PUBLISHABLE_KEY,
    )
    expect(config.configured).toBe(true)
  })

  it('rejects an arbitrary non-empty string as a key', () => {
    expect(
      resolveSupabaseConfig('https://abcdefgh.supabase.co', 'not-a-real-key')
        .configured,
    ).toBe(false)
    expect(
      resolveSupabaseConfig('https://abcdefgh.supabase.co', 'aaaa-bbbb-cccc')
        .configured,
    ).toBe(false)
  })

  it('rejects a JWT that is not an anon key', () => {
    expect(
      resolveSupabaseConfig('https://abcdefgh.supabase.co', LEGACY_SERVICE_KEY)
        .configured,
    ).toBe(false)
  })

  it('requires both a URL and a key', () => {
    expect(
      resolveSupabaseConfig('https://abcdefgh.supabase.co', '').configured,
    ).toBe(false)
    expect(resolveSupabaseConfig('', PUBLISHABLE_KEY).configured).toBe(false)
  })
})

describe('key format detection', () => {
  it('recognizes publishable keys', () => {
    expect(isPublishableKey(PUBLISHABLE_KEY)).toBe(true)
    expect(isPublishableKey('sb_publishable_short')).toBe(false)
    expect(isPublishableKey(LEGACY_ANON_KEY)).toBe(false)
  })

  it('recognizes legacy anon JWT keys', () => {
    expect(isLegacyAnonKey(LEGACY_ANON_KEY)).toBe(true)
    expect(isLegacyAnonKey(LEGACY_SERVICE_KEY)).toBe(false)
    expect(isLegacyAnonKey('eyJhbGciOiJIUzI1NiJ9.only-two-parts')).toBe(false)
  })

  it('only treats known key shapes as supported', () => {
    expect(isSupportedSupabaseKey(PUBLISHABLE_KEY)).toBe(true)
    expect(isSupportedSupabaseKey(LEGACY_ANON_KEY)).toBe(true)
    expect(isSupportedSupabaseKey('')).toBe(false)
    expect(isSupportedSupabaseKey('random-string')).toBe(false)
    expect(isSupportedSupabaseKey('your-publishable-key')).toBe(false)
    expect(isSupportedSupabaseKey(LEGACY_SERVICE_KEY)).toBe(false)
  })
})

describe('looksLikePlaceholder', () => {
  it('flags marker values', () => {
    expect(looksLikePlaceholder('replace-me')).toBe(true)
    expect(looksLikePlaceholder('https://example.supabase.co')).toBe(true)
  })

  it('passes real values', () => {
    expect(looksLikePlaceholder(PUBLISHABLE_KEY)).toBe(false)
  })
})

describe('normalizeBaseUrl', () => {
  it('returns null for empty or placeholder values', () => {
    expect(normalizeBaseUrl(undefined)).toBeNull()
    expect(normalizeBaseUrl('')).toBeNull()
    expect(normalizeBaseUrl('https://your-project.example')).toBeNull()
  })

  it('strips trailing slashes', () => {
    expect(normalizeBaseUrl('https://order.example.com/')).toBe(
      'https://order.example.com',
    )
    expect(normalizeBaseUrl('https://order.example.com///')).toBe(
      'https://order.example.com',
    )
  })
})
