import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import { browser } from '$app/environment'

if (!PUBLIC_SUPABASE_URL) throw new Error('Missing PUBLIC_SUPABASE_URL')
if (!PUBLIC_SUPABASE_ANON_KEY) throw new Error('Missing PUBLIC_SUPABASE_ANON_KEY')

// Create a single instance
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (browser && !supabaseInstance) {
    supabaseInstance = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'supabase.auth.token'
      }
    });
  }
  return supabaseInstance;
}

// Export the singleton instance
export const supabase = getSupabase();

export interface User {
  id: string
  email: string
  wallet_address?: string
}

export async function signInWithEmail(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { error }
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email!,
    wallet_address: profile?.wallet_address
  }
} 