import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabaseConfig, type SupabaseConfig } from './env'

export function createSupabaseClient(config: SupabaseConfig): SupabaseClient {
  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

export const supabase: SupabaseClient | null = supabaseConfig.configured
  ? createSupabaseClient(supabaseConfig)
  : null

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and a publishable key in your .env.local file.',
    )
  }
  return supabase
}
