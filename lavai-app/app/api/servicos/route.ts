import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok } from '@/lib/api-helpers'
import { ServicoSchema, sanitizeString } from '@/lib/validation'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(userId, 200, 60_000)) return error('Rate limit excedido', 429)

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('servicos')
      .select('id, nome, descricao, categoria, preco, duracao_minutos, ativo, created_at')
      .eq('lava_jato_id', lavaJatoId)
      .order('nome', { ascending: true })

    if (dbErr) {
      logger.error('servicos.get.db', dbErr, { lavaJatoId })
      return error('Erro interno', 500)
    }

    return ok({ data })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('servicos.get', e)
    return error('Erro interno', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(`${userId}:post`, 30, 60_000)) return error('Rate limit excedido', 429)

    const body = await req.json()
    const validation = ServicoSchema.create(body)
    if (!validation.valid) return error(validation.errors.join('; '), 400)

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('servicos')
      .insert({
        lava_jato_id: lavaJatoId,
        nome: sanitizeString(body.nome, 200),
        descricao: body.descricao ? sanitizeString(body.descricao, 1000) : null,
        categoria: body.categoria ? sanitizeString(body.categoria, 100) : null,
        preco: Number(body.preco),
        duracao_minutos: body.duracao_minutos !== undefined && body.duracao_minutos !== null ? Number(body.duracao_minutos) : 30,
        ativo: body.ativo !== undefined ? !!body.ativo : true,
      })
      .select()
      .single()

    if (dbErr) {
      logger.error('servicos.post.db', dbErr, { lavaJatoId })
      return error('Erro ao criar serviço', 500)
    }

    logger.info('servicos.created', { id: data.id, lavaJatoId })
    return ok({ data }, 201)
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('servicos.post', e)
    return error('Erro interno', 500)
  }
}
