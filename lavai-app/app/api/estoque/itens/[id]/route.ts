import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok, notFound } from '@/lib/api-helpers'
import { ItemEstoqueSchema, sanitizeString } from '@/lib/validation'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(userId, 200, 60_000)) return error('Rate limit excedido', 429)

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('estoque_itens')
      .select('id, nome, sku, unidade, qtd_atual, estoque_minimo, custo, ativo, categoria_id, created_at, categoria:estoque_categorias(id, nome)')
      .eq('id', params.id)
      .eq('lava_jato_id', lavaJatoId)
      .single()

    if (dbErr || !data) return notFound('Item')
    return ok({ data })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('estoque_itens[id].get', e)
    return error('Erro interno', 500)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(`${userId}:patch`, 60, 60_000)) return error('Rate limit excedido', 429)

    const body = await req.json()
    const validation = ItemEstoqueSchema.update(body)
    if (!validation.valid) return error(validation.errors.join('; '), 400)

    // qtd_atual NÃO é editável aqui — o saldo só muda via movimentações (transação atômica)
    const allowed = ['nome', 'sku', 'unidade', 'estoque_minimo', 'custo', 'ativo', 'categoria_id']
    const updates: Record<string, any> = {}
    for (const key of allowed) {
      if (!(key in body)) continue
      if (key === 'estoque_minimo' || key === 'custo') updates[key] = Number(body[key])
      else if (key === 'ativo') updates[key] = !!body[key]
      else if (key === 'categoria_id') updates[key] = body[key] || null
      else updates[key] = body[key] !== null ? sanitizeString(body[key], key === 'sku' ? 60 : 200) : null
    }

    if (Object.keys(updates).length === 0) return error('Nenhum campo para atualizar', 400)

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('estoque_itens')
      .update(updates)
      .eq('id', params.id)
      .eq('lava_jato_id', lavaJatoId)
      .select()
      .single()

    if (dbErr) {
      if (dbErr.code === '23505') return error('Já existe um item com este SKU', 409)
      logger.error('estoque_itens[id].patch.db', dbErr, { id: params.id })
      return error('Erro ao atualizar item', 500)
    }

    return ok({ data })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('estoque_itens[id].patch', e)
    return error('Erro interno', 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(`${userId}:delete`, 20, 60_000)) return error('Rate limit excedido', 429)

    const supabase = createServerSupabaseClient()
    const { error: dbErr } = await supabase
      .from('estoque_itens')
      .delete()
      .eq('id', params.id)
      .eq('lava_jato_id', lavaJatoId)

    if (dbErr) {
      logger.error('estoque_itens[id].delete.db', dbErr, { id: params.id })
      return error('Erro ao deletar item', 500)
    }

    logger.info('estoque_itens.deleted', { id: params.id, lavaJatoId })
    return ok({ data: { id: params.id, deleted: true } })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('estoque_itens[id].delete', e)
    return error('Erro interno', 500)
  }
}
