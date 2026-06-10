import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ─── Security headers applied to every response ───────────────────────────────
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

// ─── In-memory IP rate limiter (100 req/min per IP on /api routes) ────────────
const ipRateMap = new Map<string, { count: number; resetAt: number }>()

function checkIpRateLimit(ip: string, limit = 100, windowMs = 60_000): boolean {
  const now = Date.now()
  const entry = ipRateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

// Prune stale entries every minute
let lastPrune = Date.now()
function maybePruneRateMap() {
  const now = Date.now()
  if (now - lastPrune < 60_000) return
  lastPrune = now
  for (const [k, v] of ipRateMap) {
    if (now > v.resetAt) ipRateMap.delete(k)
  }
}

// ─── Suspicious user-agent patterns ──────────────────────────────────────────
const BLOCKED_UA_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /nmap/i,
  /masscan/i,
  /zgrab/i,
  /python-requests\/[0-1]\./i, // very old python-requests versions often used in scanning
  /go-http-client\/1\.1/i,     // bare Go HTTP client — common in scanners
]

function isSuspiciousUA(ua: string | null): boolean {
  if (!ua) return false
  return BLOCKED_UA_PATTERNS.some(p => p.test(ua))
}

// ─── CSRF defense-in-depth: Origin/Referer check em requests mutantes ─────────
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
// Webhooks são server-to-server (sem Origin) — isentos por design.
const ORIGIN_EXEMPT_PREFIXES = ['/api/payments/webhook', '/api/whatsapp/webhook']

function isOriginExempt(pathname: string): boolean {
  return ORIGIN_EXEMPT_PREFIXES.some(p => pathname.startsWith(p))
}

// Retorna true se a origem da request bate com o host (ou se não há sinal de browser).
// Estratégia: se Origin presente, exige match; senão tenta Referer; sem nenhum
// (server-to-server / cron / webhook) → permite (CSRF exige um browser, que envia Origin).
function originAllowed(request: NextRequest): boolean {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!host) return true // sem host não há como comparar — não bloqueia

  const matchHost = (value: string | null): boolean | null => {
    if (!value) return null
    try { return new URL(value).host === host } catch { return false }
  }

  const byOrigin = matchHost(request.headers.get('origin'))
  if (byOrigin !== null) return byOrigin

  const byReferer = matchHost(request.headers.get('referer'))
  if (byReferer !== null) return byReferer

  return true
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  maybePruneRateMap()

  const { pathname } = request.nextUrl
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  // Block suspicious user agents
  const ua = request.headers.get('user-agent')
  if (isSuspiciousUA(ua)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // CSRF defense-in-depth: requests mutantes em /api precisam de Origin/Referer
  // do mesmo host (webhooks server-to-server são isentos).
  if (
    pathname.startsWith('/api') &&
    MUTATING_METHODS.has(request.method) &&
    !isOriginExempt(pathname) &&
    !originAllowed(request)
  ) {
    console.warn(
      JSON.stringify({
        level: 'warn',
        event: 'csrf.origin_mismatch',
        ip,
        path: pathname,
        ts: Date.now(),
      })
    )
    return new NextResponse(
      JSON.stringify({ error: 'Origin not allowed' }),
      { status: 403, headers: { 'Content-Type': 'application/json', ...SECURITY_HEADERS } }
    )
  }

  // IP rate limiting on /api routes (skip health check)
  if (pathname.startsWith('/api') && pathname !== '/api/health') {
    if (!checkIpRateLimit(ip)) {
      console.warn(
        JSON.stringify({
          level: 'warn',
          event: 'rate_limit.ip',
          ip,
          path: pathname,
          ts: Date.now(),
        })
      )
      return new NextResponse(
        JSON.stringify({ error: 'Too Many Requests' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', ...SECURITY_HEADERS },
        }
      )
    }
  }

  // ── Demo mode ─────────────────────────────────────────────────────────────
  // Em produção, só ativa com NEXT_PUBLIC_LAVAI_DEMO_ENABLED=true explícito.
  // Em dev, ativa também se Supabase não estiver configurado.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const demoFlag = (process.env.NEXT_PUBLIC_LAVAI_DEMO_ENABLED ?? '').toLowerCase() === 'true'
  const isDemoMode =
    process.env.NODE_ENV === 'production'
      ? demoFlag
      : demoFlag || !supabaseUrl || supabaseUrl.includes('seu-projeto')

  const protectedPaths = [
    '/dashboard', '/fila', '/financeiro', '/clientes', '/equipe',
    '/agendamentos', '/fidelidade', '/whatsapp', '/relatorio',
    '/insights', '/configuracoes', '/planos',
    '/admin', // super-admin: auth obrigatório (autorização por linha em super_admins é feita server-side)
  ]
  const isProtected = protectedPaths.some(p => pathname.startsWith(p))

  let response = NextResponse.next({ request: { headers: request.headers } })

  if (isDemoMode) {
    // No Supabase — allow access to dashboard with demo cookie
    const demoCookie = request.cookies.get('lavai_demo')?.value
    if (isProtected && demoCookie !== 'true') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (pathname === '/login' && demoCookie === 'true') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    Object.entries(SECURITY_HEADERS).forEach(([k, v]) => response.headers.set(k, v))
    return response
  }

  // ── API routes: skip Supabase session check ────────────────────────────────
  // API routes have their own auth via requireAuth() — middleware só protege páginas.
  if (pathname.startsWith('/api/')) {
    Object.entries(SECURITY_HEADERS).forEach(([k, v]) => response.headers.set(k, v))
    return response
  }

  // ── Supabase session refresh + auth guard (pages only) ────────────────────
  // Usa getUser() (revalida o JWT com o Auth server) em vez de getSession()
  // (que confia no cookie sem revalidar) — evita cookie forjado passar o guard.
  let user = null

  try {
    const supabase = createServerClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return request.cookies.get(name)?.value },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          set(name: string, value: string, options: any) {
            request.cookies.set(name, value)
            response = NextResponse.next({ request: { headers: request.headers } })
            response.cookies.set({ name, value, ...options })
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          remove(name: string, options: any) {
            request.cookies.set(name, '')
            response = NextResponse.next({ request: { headers: request.headers } })
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (err) {
    // Não deixar o middleware crashar — log e continua sem sessão
    console.error('[middleware] getUser error:', err)
  }

  if (isProtected && !user) {
    console.warn(
      JSON.stringify({
        level: 'warn',
        event: 'auth.redirect',
        ip,
        path: pathname,
        ts: Date.now(),
      })
    )
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && (pathname === '/login' || pathname === '/cadastro')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Apply security headers to all responses
  Object.entries(SECURITY_HEADERS).forEach(([k, v]) => response.headers.set(k, v))

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
