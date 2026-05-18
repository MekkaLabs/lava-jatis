import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok, notFound } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)
    if (!rateLimit(`${userId}:patch`, 60, 60_000)) return error('Rate limit excedido', 429)

    const body = await req.json()
    const allowed = ['nome', 'descricao', 'pontos_necessarios', 'tipo', 'valor_desconto', 'estoque', 'ativo']
    const updates: Record<string, any> = {}

    for (const key of allowed) {
      if (key in body) {
        if (key === 'nome') updates[key] = String(body[key]).trim().slice(0, 200)
        else if (key === 'descricao') updates[key] = body[key] ? String(body[key]).slice(0, 500) : null
        else if (key === 'pontos_necessarios' || key === 'estoque') updates[key] = body[key] !== null ? Math.round(Number(body[key])) : null
        else if (key === 'valor_desconto') updates[key] = body[key] !== null ? Number(body[key]) : null
        else updates[key] = body[key]
      }
    }

    if (Object.keys(updates).length === 0) return error('Nenhum campo para atualizar', 400)

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('recompensas')
      .update(updates)
      .eq('id', params.id)
      .eq('lava_jato_id', lavaJatoId)
      .select()
      .single()

    if (dbErr || !data) {
      logger.error('fidelidade.recompensas.patch.db', dbErr, { id: params.id })
      return notFound('Recompensa')
    }

    return ok({ data })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('fidelidade.recompensas.patch', e)
    return error('Erro interno', 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)
    if (!rateLimit(`${userId}:delete`, 20, 60_000)) return error('Rate limit excedido', 429)

    const supabase = createServerSupabaseClient()
    // Soft delete — deactivate
    const { data, error: dbErr } = await supabase
      .from('recompensas')
      .update({ ativo: false })
      .eq('id', params.id)
      .eq('lava_jato_id', lavaJatoId)
      .select()
      .single()

    if (dbErr || !data) return notFound('Recompensa')

    logger.info('fidelidade.recompensas.deactivated', { id: params.id, lavaJatoId })
    return ok({ data })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('fidelidade.recompensas.delete', e)
    return error('Erro interno', 500)
  }
}
