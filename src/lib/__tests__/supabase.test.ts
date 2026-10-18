import { describe, expect, it } from 'vitest'
import { createSupabaseClient, supabase } from '../supabase'
import { isSupabaseConfigured } from '../env'

describe('createSupabaseClient', () => {
  it('builds a client exposing auth, from, rpc and channel', () => {
    const client = createSupabaseClient({
      url: 'https://hjgarepgjoikjlblkpxs.supabase.co',
      anonKey: 'sb_publishable_test_key',
      configured: true,
    })
    expect(typeof client.from).toBe('function')
    expect(typeof client.rpc).toBe('function')
    expect(typeof client.channel).toBe('function')
    expect(client.auth).toBeDefined()
  })
})

describe('singleton client', () => {
  it('is null when Supabase is not configured (default test env)', () => {
    expect(isSupabaseConfigured).toBe(false)
    expect(supabase).toBeNull()
  })
})
