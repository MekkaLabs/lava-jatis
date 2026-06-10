import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok } from '@/lib/api-helpers'
import { ServicoInsumoSchema } from '@/lib/validation'
import { logger } from '@/lib/logger'

// Lista os insumos (itens de estoque) consumidos por um serviço
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)
    if (!rateLimit(userId, 200, 60_000)) return error('Rate limit excedido', 429)

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('servico_insumos')
      .select('id, item_id, quantidade, item:estoque_itens(nome, unidade, qtd_atual)')
      .eq('servico_id', params.id)
      .eq('lava_jato_id', lavaJatoId)

    if (dbErr) {
      logger.error('servico_insumos.get.db', dbErr, { servico: params.id })
      return error('Erro interno', 500)
    }
    return ok({ data })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('servico_insumos.get', e)
    return error('Erro interno', 500)
  }
}

// Adiciona/atualiza um insumo do serviço (upsert por servico_id + item_id)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)
    if (!rateLimit(`${userId}:post`, 60, 60_000)) return error('Rate limit excedido', 429)

    const body = await req.json()
    const validation = ServicoInsumoSchema.create(body)
    if (!validation.valid) return error(validation.errors.join('; '), 400)

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('servico_insumos')
      .upsert(
        { lava_jato_id: lavaJatoId, servico_id: params.id, item_id: body.item_id, quantidade: Number(body.quantidade) },
        { onConflict: 'servico_id,item_id' }
      )
      .select()
      .single()

    if (dbErr) {
      logger.error('servico_insumos.post.db', dbErr, { servico: params.id })
      return error('Erro ao vincular insumo', 500)
    }
    return ok({ data }, 201)
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('servico_insumos.post', e)
    return error('Erro interno', 500)
  }
}

// Remove um insumo do serviço (item_id via query string)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)
    if (!rateLimit(`${userId}:delete`, 30, 60_000)) return error('Rate limit excedido', 429)

    const itemId = req.nextUrl.searchParams.get('item_id')
    if (!itemId) return error('item_id é obrigatório', 400)

    const supabase = createServerSupabaseClient()
    const { error: dbErr } = await supabase
      .from('servico_insumos')
      .delete()
      .eq('servico_id', params.id)
      .eq('item_id', itemId)
      .eq('lava_jato_id', lavaJatoId)

    if (dbErr) {
      logger.error('servico_insumos.delete.db', dbErr, { servico: params.id })
      return error('Erro ao remover insumo', 500)
    }
    return ok({ data: { deleted: true } })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('servico_insumos.delete', e)
    return error('Erro interno', 500)
  }
}
