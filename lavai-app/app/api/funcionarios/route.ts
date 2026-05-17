import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok } from '@/lib/api-helpers'
import { FuncionarioSchema, sanitizeString } from '@/lib/validation'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(userId, 200, 60_000)) return error('Rate limit excedido', 429)

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('funcionarios')
      .select('id, nome, cargo, telefone, salario, created_at')
      .eq('lava_jato_id', lavaJatoId)
      .order('nome', { ascending: true })

    if (dbErr) {
      logger.error('funcionarios.get.db', dbErr, { lavaJatoId })
      return error('Erro interno', 500)
    }

    return ok({ data })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('funcionarios.get', e)
    return error('Erro interno', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(`${userId}:post`, 20, 60_000)) return error('Rate limit excedido', 429)

    const body = await req.json()
    const validation = FuncionarioSchema.create(body)
    if (!validation.valid) return error(validation.errors.join('; '), 400)

    const { nome, cargo, telefone, salario } = body

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('funcionarios')
      .insert({
        lava_jato_id: lavaJatoId,
        nome: sanitizeString(nome, 200),
        cargo: sanitizeString(cargo, 100),
        telefone: telefone ? sanitizeString(telefone, 20) : null,
        salario: salario !== undefined && salario !== null ? Number(salario) : null,
      })
      .select()
      .single()

    if (dbErr) {
      logger.error('funcionarios.post.db', dbErr, { lavaJatoId })
      return error('Erro ao criar funcionário', 500)
    }

    logger.info('funcionarios.created', { id: data.id, lavaJatoId })
    return ok({ data }, 201)
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('funcionarios.post', e)
    return error('Erro interno', 500)
  }
}
