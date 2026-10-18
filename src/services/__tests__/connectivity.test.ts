import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isNetworkError, isSchemaMissingError, verifyBackend } from '../connectivity'

interface ErrorLike {
  code?: string
  message?: string
}

function makeClient(options: {
  tableError?: (table: string) => ErrorLike | null
  fnError?: (fn: string) => ErrorLike | null
  throwOn?: 'table' | 'function'
}): SupabaseClient {
  return {
    from: (table: string) => ({
      select: () => ({
        limit: async () => {
          if (options.throwOn === 'table') throw new Error('Failed to fetch')
          return { error: options.tableError?.(table) ?? null }
        },
      }),
    }),
    rpc: async (fn: string) => {
      if (options.throwOn === 'function') throw new Error('Failed to fetch')
      return { error: options.fnError?.(fn) ?? null }
    },
  } as unknown as SupabaseClient
}

describe('error classification', () => {
  it('detects network errors by message', () => {
    expect(isNetworkError({ message: 'Failed to fetch' })).toBe(true)
    expect(isNetworkError({ message: 'NetworkError when attempting' })).toBe(true)
    expect(isNetworkError({ message: 'permission denied' })).toBe(false)
    expect(isNetworkError(null)).toBe(false)
  })

  it('detects schema-missing errors by code or message', () => {
    expect(isSchemaMissingError({ code: 'PGRST205' })).toBe(true)
    expect(isSchemaMissingError({ code: 'PGRST202' })).toBe(true)
    expect(isSchemaMissingError({ code: '42P01' })).toBe(true)
    expect(
      isSchemaMissingError({ message: 'Could not find the function public.x' }),
    ).toBe(true)
    expect(isSchemaMissingError({ code: '42501' })).toBe(false)
  })
})

describe('verifyBackend', () => {
  it('reports live when every table and function is present', async () => {
    const status = await verifyBackend(makeClient({}))
    expect(status.mode).toBe('live')
    expect(status.reachable).toBe(true)
    expect(status.schemaReady).toBe(true)
    expect(status.missing).toEqual([])
  })

  it('reports an incomplete schema with the missing table named', async () => {
    const status = await verifyBackend(
      makeClient({
        tableError: (table) =>
          table === 'orders'
            ? { code: 'PGRST205', message: 'Could not find the table' }
            : null,
      }),
    )
    expect(status.mode).toBe('unavailable')
    expect(status.reachable).toBe(true)
    expect(status.schemaReady).toBe(false)
    expect(status.missing).toContain('orders')
  })

  it('reports an incomplete schema with a missing function named', async () => {
    const status = await verifyBackend(
      makeClient({
        fnError: (fn) =>
          fn === 'create_order' ? { code: 'PGRST202' } : null,
      }),
    )
    expect(status.mode).toBe('unavailable')
    expect(status.schemaReady).toBe(false)
    expect(status.missing).toContain('create_order')
  })

  it('treats permission errors as proof the object exists', async () => {
    const status = await verifyBackend(
      makeClient({
        tableError: () => ({ code: '42501', message: 'permission denied' }),
        fnError: () => ({ code: '42501', message: 'permission denied' }),
      }),
    )
    expect(status.mode).toBe('live')
    expect(status.schemaReady).toBe(true)
  })

  it('reports unreachable when the network fails on tables', async () => {
    const status = await verifyBackend(makeClient({ throwOn: 'table' }))
    expect(status.mode).toBe('unavailable')
    expect(status.reachable).toBe(false)
    expect(status.message).toMatch(/could not reach/i)
  })

  it('reports unreachable when the network fails on functions', async () => {
    const status = await verifyBackend(makeClient({ throwOn: 'function' }))
    expect(status.mode).toBe('unavailable')
    expect(status.reachable).toBe(false)
  })
})
