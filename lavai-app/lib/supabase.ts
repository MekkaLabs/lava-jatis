import { createClient as _createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton instance for direct use
export const supabase = _createClient(supabaseUrl, supabaseAnonKey)

// Factory for components that need a fresh client (e.g. realtime subscriptions)
export function createClient() {
  return _createClient(supabaseUrl, supabaseAnonKey)
}
