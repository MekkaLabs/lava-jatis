import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * POST /api/login
 * Autentica via fetch direto ao GoTrue (sem depender do @supabase/ssr).
 * Seta cookies de sessão compatíveis com o middleware @supabase/ssr.
 */

function getEnv() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    throw new Error(`Supabase env vars faltando: URL=${!!url} ANON=${!!anon}`)
  }
  const ref        = url.replace('https://', '').split('.')[0]
  const cookieName = `sb-${ref}-auth-token`
  return { url, anon, ref, cookieName }
}

export async function POST(req: NextRequest) {
  try {
    const { url, anon, cookieName } = getEnv()

    let body: { email?: string; password?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido no body.' }, { status: 400 })
    }

    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha obrigatórios.' }, { status: 400 })
    }

    // ── Chama o GoTrue diretamente ─────────────────────────────────────────
    const gotrue = `${url}/auth/v1/token?grant_type=password`

    const authRes = await fetch(gotrue, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anon,
        'Authorization': `Bearer ${anon}`,
      },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    })

    let authBody: any
    try {
      authBody = await authRes.json()
    } catch {
      await authRes.text().catch(() => '(sem body)')
      logger.error('login.gotrue_non_json', new Error(`status ${authRes.status}`))
      return NextResponse.json({ error: 'Resposta inesperada do servidor de autenticação.' }, { status: 502 })
    }

    if (!authRes.ok) {
      const raw = authBody?.error_description ?? authBody?.msg ?? authBody?.message ?? authBody?.error ?? ''
      logger.warn('login.gotrue_error', { status: authRes.status, raw })

      if (
        raw.toLowerCase().includes('invalid login') ||
        raw.toLowerCase().includes('invalid_credentials') ||
        raw.toLowerCase().includes('invalid credentials') ||
        authRes.status === 400
      ) {
        return NextResponse.json({ error: 'Email ou senha incorretos.' }, { status: 401 })
      }
      if (raw.toLowerCase().includes('email not confirmed')) {
        return NextResponse.json({ error: 'Email não confirmado. Fale com o suporte.' }, { status: 401 })
      }
      return NextResponse.json({ error: raw || 'Erro ao autenticar.' }, { status: 401 })
    }

    // authBody = { access_token, refresh_token, expires_in, token_type, user, ... }
    logger.info('login.success', { userId: authBody?.user?.id })

    const response = NextResponse.json({ ok: true })
    const maxAge   = authBody.expires_in ?? 3600

    // Cookie de sessão Supabase. httpOnly impede roubo via XSS.
    // @supabase/ssr lê do cookie store server-side, não precisa de JS.
    response.cookies.set(cookieName, JSON.stringify(authBody), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge,
      path: '/',
      sameSite: 'lax',
    })

    return response

  } catch (e: any) {
    logger.error('login.fatal', e)
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}
