import { requireSupabase, supabase } from '../lib/supabase'
import { isSupabaseConfigured } from '../lib/env'
import { DEMO_STAFF } from '../data/demo'
import { readJson, removeKey, writeJson } from '../lib/storage'
import type { StaffRole } from '../types/db'

export interface SessionUser {
  id: string
  full_name: string
  email: string
  role: StaffRole
}

const DEMO_SESSION_KEY = 'bb.demo.session.v1'

async function loadSupabaseProfile(userId: string): Promise<SessionUser | null> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('profiles')
    .select('id, full_name, email, role, is_active')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data || data.is_active === false) return null
  return {
    id: data.id as string,
    full_name: (data.full_name as string) ?? 'Staff',
    email: (data.email as string) ?? '',
    role: data.role as StaffRole,
  }
}

export async function getSession(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured) {
    return readJson<SessionUser>(DEMO_SESSION_KEY)
  }
  const client = requireSupabase()
  const { data, error } = await client.auth.getSession()
  if (error) throw new Error(error.message)
  const user = data.session?.user
  if (!user) return null
  return loadSupabaseProfile(user.id)
}

export async function signIn(
  email: string,
  password: string,
): Promise<SessionUser> {
  const cleanEmail = email.trim().toLowerCase()

  if (!isSupabaseConfigured) {
    const match = DEMO_STAFF.find(
      (member) => member.email.toLowerCase() === cleanEmail,
    )
    if (!match || match.pin !== password) {
      throw new Error('Invalid email or PIN. Use a demo account listed below.')
    }
    if (!match.is_active) {
      throw new Error('This account has been deactivated.')
    }
    const session: SessionUser = {
      id: match.id,
      full_name: match.full_name,
      email: match.email,
      role: match.role,
    }
    writeJson(DEMO_SESSION_KEY, session)
    return session
  }

  const client = requireSupabase()
  const { data, error } = await client.auth.signInWithPassword({
    email: cleanEmail,
    password,
  })
  if (error) throw new Error(error.message)
  const profile = data.user ? await loadSupabaseProfile(data.user.id) : null
  if (!profile) {
    await client.auth.signOut()
    throw new Error('Your staff account is inactive or missing a role.')
  }
  return profile
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured) {
    removeKey(DEMO_SESSION_KEY)
    return
  }
  const client = requireSupabase()
  const { error } = await client.auth.signOut()
  if (error) throw new Error(error.message)
}

export function onAuthChange(callback: () => void): () => void {
  if (!isSupabaseConfigured || !supabase) {
    return () => {}
  }
  const { data } = supabase.auth.onAuthStateChange(() => {
    callback()
  })
  return () => data.subscription.unsubscribe()
}

export const DEMO_ACCOUNTS = DEMO_STAFF.map((member) => ({
  email: member.email,
  role: member.role,
  full_name: member.full_name,
  pin: member.pin,
}))
