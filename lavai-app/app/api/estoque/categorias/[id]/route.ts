import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok } from '@/lib/api-helpers'
import { CategoriaEstoqueSchema, sanitizeString } from '@/lib/validation'
import { logger } from '@/lib/logger'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(`${userId}:patch`, 60, 60_000)) return error('Rate limit excedido', 429)

    const body = await req.json()
    const validation = CategoriaEstoqueSchema.update(body)
    if (!validation.valid) return error(validation.errors.join('; '), 400)
    if (!('nome' in body)) return error('Nenhum campo para atualizar', 400)

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('estoque_categorias')
      .update({ nome: sanitizeString(body.nome, 100) })
      .eq('id', params.id)
      .eq('lava_jato_id', lavaJatoId)
      .select()
      .single()

    if (dbErr) {
      logger.error('estoque_categorias[id].patch.db', dbErr, { id: params.id })
      return error('Erro ao atualizar categoria', 500)
    }

    return ok({ data })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('estoque_categorias[id].patch', e)
    return error('Erro interno', 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(`${userId}:delete`, 20, 60_000)) return error('Rate limit excedido', 429)

    const supabase = createServerSupabaseClient()
    const { error: dbErr } = await supabase
      .from('estoque_categorias')
      .delete()
      .eq('id', params.id)
      .eq('lava_jato_id', lavaJatoId)

    if (dbErr) {
      logger.error('estoque_categorias[id].delete.db', dbErr, { id: params.id })
      return error('Erro ao deletar categoria', 500)
    }

    return ok({ data: { id: params.id, deleted: true } })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('estoque_categorias[id].delete', e)
    return error('Erro interno', 500)
  }
}
