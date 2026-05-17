import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthContext {
  userId: string
  lavaJatoId: string
}

/**
 * Validates the session cookie and resolves the lava_jato_id that belongs to
 * the authenticated user. Throws a Response (to be returned directly) on any
 * failure so callers can do:
 *   const { userId, lavaJatoId } = await requireAuth(req).catch(r => { throw r })
 * or, more idiomatically with try/catch in the handler.
 */
export async function requireAuth(request: Request): Promise<AuthContext> {
  const supabase = createServerSupabaseClient()

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()

  if (authErr || !user) {
    logger.warn('auth.failed', { path: request.url })
    throw unauthorized()
  }

  const { data: lj } = await supabase
    .from('lava_jatos')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!lj) {
    logger.warn('auth.no_lava_jato', { userId: user.id })
    throw notFound('lava-jato')
  }

  return { userId: user.id, lavaJatoId: lj.id }
}

// ─── Input helpers ────────────────────────────────────────────────────────────

export function validateRequired(obj: any, fields: string[]): string | null {
  if (!obj || typeof obj !== 'object') return 'Body inválido'
  for (const f of fields) {
    if (obj[f] === undefined || obj[f] === null || obj[f] === '') {
      return `${f} é obrigatório`
    }
  }
  return null
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.length <= 254
}

export function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return digits.length === 10 || digits.length === 11
}

export function validateCPFCNPJ(doc: string): boolean {
  const digits = doc.replace(/\D/g, '')
  return digits.length === 11 || digits.length === 14
}

// ─── Response helpers ─────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

export function ok(data: any, status = 200): Response {
  return Response.json(data, { status, headers: CORS_HEADERS })
}

export function error(message: string, status = 400): Response {
  return Response.json({ error: message }, { status, headers: CORS_HEADERS })
}

export function unauthorized(): Response {
  return Response.json({ error: 'Não autorizado' }, { status: 401, headers: CORS_HEADERS })
}

export function notFound(resource: string): Response {
  return Response.json({ error: `${resource} não encontrado` }, { status: 404, headers: CORS_HEADERS })
}

// ─── Rate limiting (in-memory, per-key) ──────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

/**
 * Returns true if the request is allowed, false if rate-limited.
 * @param key      Usually userId or IP
 * @param limit    Max requests per window (default 100)
 * @param windowMs Window length in ms (default 60 000 = 1 minute)
 */
export function rateLimit(key: string, limit = 100, windowMs = 60_000): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}

// Trim map periodically to prevent unbounded growth
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of rateLimitMap) {
    if (now > v.resetAt) rateLimitMap.delete(k)
  }
}, 60_000)
