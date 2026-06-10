import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok } from '@/lib/api-helpers'
import { ItemEstoqueSchema, sanitizeString } from '@/lib/validation'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(userId, 200, 60_000)) return error('Rate limit excedido', 429)

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('estoque_itens')
      .select('id, nome, sku, unidade, qtd_atual, estoque_minimo, custo, ativo, categoria_id, created_at, categoria:estoque_categorias(id, nome)')
      .eq('lava_jato_id', lavaJatoId)
      .order('nome', { ascending: true })

    if (dbErr) {
      logger.error('estoque_itens.get.db', dbErr, { lavaJatoId })
      return error('Erro interno', 500)
    }

    return ok({ data })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('estoque_itens.get', e)
    return error('Erro interno', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(`${userId}:post`, 30, 60_000)) return error('Rate limit excedido', 429)

    const body = await req.json()
    const validation = ItemEstoqueSchema.create(body)
    if (!validation.valid) return error(validation.errors.join('; '), 400)

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('estoque_itens')
      .insert({
        lava_jato_id: lavaJatoId,
        categoria_id: body.categoria_id || null,
        nome: sanitizeString(body.nome, 200),
        sku: body.sku ? sanitizeString(body.sku, 60) : null,
        unidade: body.unidade || 'un',
        qtd_atual: body.qtd_atual !== undefined && body.qtd_atual !== null ? Number(body.qtd_atual) : 0,
        estoque_minimo: body.estoque_minimo !== undefined && body.estoque_minimo !== null ? Number(body.estoque_minimo) : 0,
        custo: body.custo !== undefined && body.custo !== null ? Number(body.custo) : 0,
        ativo: body.ativo !== undefined ? !!body.ativo : true,
      })
      .select()
      .single()

    if (dbErr) {
      if (dbErr.code === '23505') return error('Já existe um item com este SKU', 409)
      logger.error('estoque_itens.post.db', dbErr, { lavaJatoId })
      return error('Erro ao criar item', 500)
    }

    logger.info('estoque_itens.created', { id: data.id, lavaJatoId })
    return ok({ data }, 201)
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('estoque_itens.post', e)
    return error('Erro interno', 500)
  }
}
