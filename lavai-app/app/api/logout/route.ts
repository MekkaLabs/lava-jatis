import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(_req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    await supabase.auth.signOut()
  } catch {
    // Best effort; cookies are cleared below either way.
  }

  const response = NextResponse.json({ ok: true })
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const ref = supabaseUrl ? supabaseUrl.replace('https://', '').split('.')[0] : ''

  const cookieNames = [
    'lavai_demo',
    'lavai_access_token',
    ref ? `sb-${ref}-auth-token` : '',
    ref ? `sb-${ref}-auth-token.0` : '',
    ref ? `sb-${ref}-auth-token.1` : '',
  ].filter(Boolean)

  for (const name of cookieNames) {
    response.cookies.set({
      name,
      value: '',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    })
  }

  return response
}
