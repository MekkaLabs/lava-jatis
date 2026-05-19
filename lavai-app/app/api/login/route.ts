import { NextRequest, NextResponse } from 'next/server'

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
  console.log('[api/login] POST recebido')

  try {
    const { url, anon, cookieName } = getEnv()
    console.log('[api/login] env OK — supabase URL:', url)

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

    console.log('[api/login] autenticando email:', email)

    // ── Chama o GoTrue diretamente ─────────────────────────────────────────
    const gotrue = `${url}/auth/v1/token?grant_type=password`
    console.log('[api/login] chamando GoTrue:', gotrue)

    const authRes = await fetch(gotrue, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anon,
        'Authorization': `Bearer ${anon}`,
      },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    })

    console.log('[api/login] GoTrue status:', authRes.status)

    let authBody: any
    try {
      authBody = await authRes.json()
    } catch {
      const text = await authRes.text().catch(() => '(sem body)')
      console.error('[api/login] GoTrue retornou não-JSON:', text)
      return NextResponse.json({ error: 'Resposta inesperada do servidor de autenticação.' }, { status: 502 })
    }

    if (!authRes.ok) {
      const raw = authBody?.error_description ?? authBody?.msg ?? authBody?.message ?? authBody?.error ?? ''
      console.warn('[api/login] GoTrue erro:', raw, '| body:', JSON.stringify(authBody))

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
    console.log('[api/login] auth OK — user:', authBody?.user?.email)

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
    console.error('[api/login] ERRO CRÍTICO:', e?.message, e?.stack)
    return NextResponse.json({ error: `Erro interno: ${e?.message ?? 'desconhecido'}` }, { status: 500 })
  }
}
