/**
 * Supabase browser client
 * Usa createBrowserClient do @supabase/ssr para armazenar sessão em COOKIES
 * (não localStorage), compatível com o middleware que lê cookies server-side.
 */
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton para uso direto nos componentes
export const supabase = createBrowserClient(supabaseUrl, supabaseAnon)

// Factory para quem precisar de instância fresca (ex: Realtime)
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnon)
}
