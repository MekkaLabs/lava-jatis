import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok } from '@/lib/api-helpers'
import { ClienteSchema, sanitizeString } from '@/lib/validation'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(userId, 200, 60_000)) return error('Rate limit excedido', 429)

    const { searchParams } = new URL(req.url)
    const q = sanitizeString(searchParams.get('q') ?? '', 100)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
    const offset = (page - 1) * limit

    const supabase = createServerSupabaseClient()
    let query = supabase
      .from('clientes')
      .select('id, nome, telefone, email, cpf, created_at', { count: 'exact' })
      .eq('lava_jato_id', lavaJatoId)
      .order('nome', { ascending: true })
      .range(offset, offset + limit - 1)

    if (q) {
      // q is already sanitized; Supabase uses parameterized queries internally
      query = query.or(`nome.ilike.%${q}%,telefone.ilike.%${q}%,email.ilike.%${q}%`)
    }

    const { data, error: dbErr, count } = await query

    if (dbErr) {
      logger.error('clientes.get.db', dbErr, { lavaJatoId })
      return error('Erro interno', 500)
    }

    return ok({ data, total: count, page, limit })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('clientes.get', e)
    return error('Erro interno', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(`${userId}:post`, 30, 60_000)) return error('Rate limit excedido', 429)

    const body = await req.json()
    const validation = ClienteSchema.create(body)
    if (!validation.valid) return error(validation.errors.join('; '), 400)

    const { nome, telefone, email, cpf } = body

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('clientes')
      .insert({
        lava_jato_id: lavaJatoId,        // always from session
        nome: sanitizeString(nome, 200),
        telefone: sanitizeString(telefone, 20),
        email: email ? sanitizeString(email, 254) : null,
        cpf: cpf ? sanitizeString(cpf, 18) : null,
      })
      .select()
      .single()

    if (dbErr) {
      logger.error('clientes.post.db', dbErr, { lavaJatoId })
      return error('Erro ao criar cliente', 500)
    }

    logger.info('clientes.created', { id: data.id, lavaJatoId })
    return ok({ data }, 201)
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('clientes.post', e)
    return error('Erro interno', 500)
  }
}
