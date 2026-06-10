import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok, notFound } from '@/lib/api-helpers'
import { ServicoSchema, sanitizeString } from '@/lib/validation'
import { logger } from '@/lib/logger'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(`${userId}:patch`, 60, 60_000)) return error('Rate limit excedido', 429)

    const body = await req.json()
    const validation = ServicoSchema.update(body)
    if (!validation.valid) return error(validation.errors.join('; '), 400)

    const allowed = ['nome', 'descricao', 'categoria', 'preco', 'duracao_minutos', 'ativo']
    const updates: Record<string, any> = {}
    for (const key of allowed) {
      if (!(key in body)) continue
      if (key === 'preco' || key === 'duracao_minutos') updates[key] = Number(body[key])
      else if (key === 'ativo') updates[key] = !!body[key]
      else updates[key] = body[key] !== null ? sanitizeString(body[key], key === 'descricao' ? 1000 : 200) : null
    }

    if (Object.keys(updates).length === 0) return error('Nenhum campo para atualizar', 400)

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('servicos')
      .update(updates)
      .eq('id', params.id)
      .eq('lava_jato_id', lavaJatoId)
      .select()
      .single()

    if (dbErr) {
      logger.error('servicos[id].patch.db', dbErr, { id: params.id })
      return error('Erro ao atualizar serviço', 500)
    }

    return ok({ data })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('servicos[id].patch', e)
    return error('Erro interno', 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(`${userId}:delete`, 20, 60_000)) return error('Rate limit excedido', 429)

    const supabase = createServerSupabaseClient()
    const { error: dbErr } = await supabase
      .from('servicos')
      .delete()
      .eq('id', params.id)
      .eq('lava_jato_id', lavaJatoId)

    if (dbErr) {
      logger.error('servicos[id].delete.db', dbErr, { id: params.id })
      return error('Erro ao deletar serviço', 500)
    }

    logger.info('servicos.deleted', { id: params.id, lavaJatoId })
    return ok({ data: { id: params.id, deleted: true } })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('servicos[id].delete', e)
    return error('Erro interno', 500)
  }
}
