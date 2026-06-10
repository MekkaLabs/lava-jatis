import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok, notFound } from '@/lib/api-helpers'
import { MovimentacaoSchema, sanitizeString } from '@/lib/validation'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(userId, 200, 60_000)) return error('Rate limit excedido', 429)

    const itemId = req.nextUrl.searchParams.get('item_id')
    const supabase = createServerSupabaseClient()
    let query = supabase
      .from('estoque_movimentacoes')
      .select('id, item_id, tipo, quantidade, motivo, responsavel, created_at, item:estoque_itens(nome, unidade)')
      .eq('lava_jato_id', lavaJatoId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (itemId) query = query.eq('item_id', itemId)

    const { data, error: dbErr } = await query

    if (dbErr) {
      logger.error('estoque_mov.get.db', dbErr, { lavaJatoId })
      return error('Erro interno', 500)
    }

    return ok({ data })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('estoque_mov.get', e)
    return error('Erro interno', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(`${userId}:post`, 60, 60_000)) return error('Rate limit excedido', 429)

    const body = await req.json()
    const validation = MovimentacaoSchema.create(body)
    if (!validation.valid) return error(validation.errors.join('; '), 400)

    const supabase = createServerSupabaseClient()
    // Movimentação atômica no banco: atualiza o saldo e registra o histórico
    // numa única transação, garantindo que o saldo nunca fique negativo.
    const { data, error: dbErr } = await supabase.rpc('registrar_movimentacao_estoque', {
      p_lava_jato_id: lavaJatoId,
      p_item_id: body.item_id,
      p_tipo: body.tipo,
      p_quantidade: Number(body.quantidade),
      p_motivo: body.motivo ? sanitizeString(body.motivo, 200) : null,
      p_responsavel: body.responsavel ? sanitizeString(body.responsavel, 200) : null,
    })

    if (dbErr) {
      const msg = (dbErr.message || '').toLowerCase()
      if (msg.includes('saldo insuficiente')) return error('Saldo insuficiente: a saída deixaria o estoque negativo', 409)
      if (msg.includes('não encontrado') || dbErr.code === 'P0002') return notFound('Item de estoque')
      logger.error('estoque_mov.post.db', dbErr, { lavaJatoId, item: body.item_id })
      return error('Erro ao registrar movimentação', 500)
    }

    logger.info('estoque_mov.created', { item: body.item_id, tipo: body.tipo, lavaJatoId })
    return ok({ data }, 201)
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('estoque_mov.post', e)
    return error('Erro interno', 500)
  }
}
