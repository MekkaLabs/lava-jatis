import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)
    if (!rateLimit(userId, 200, 60_000)) return error('Rate limit excedido', 429)

    const { searchParams } = new URL(req.url)
    const apenasAtivos = searchParams.get('ativo') !== 'false'

    const supabase = createServerSupabaseClient()
    let query = supabase
      .from('recompensas')
      .select('*')
      .eq('lava_jato_id', lavaJatoId)
      .order('pontos_necessarios', { ascending: true })

    if (apenasAtivos) query = query.eq('ativo', true)

    const { data, error: dbErr } = await query
    if (dbErr) {
      logger.error('fidelidade.recompensas.get.db', dbErr, { lavaJatoId })
      return error('Erro interno', 500)
    }

    return ok({ data: data ?? [] })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('fidelidade.recompensas.get', e)
    return error('Erro interno', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)
    if (!rateLimit(`${userId}:post`, 30, 60_000)) return error('Rate limit excedido', 429)

    const body = await req.json()
    const { nome, descricao, pontos_necessarios, tipo, valor_desconto, estoque } = body

    if (!nome || typeof nome !== 'string' || nome.trim().length === 0)
      return error('nome é obrigatório', 400)
    if (!pontos_necessarios || isNaN(Number(pontos_necessarios)) || Number(pontos_necessarios) <= 0)
      return error('pontos_necessarios deve ser um número positivo', 400)

    const tiposValidos = ['desconto', 'servico_gratis', 'brinde']
    if (tipo && !tiposValidos.includes(tipo))
      return error(`tipo deve ser um de: ${tiposValidos.join(', ')}`, 400)

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('recompensas')
      .insert({
        lava_jato_id: lavaJatoId,
        nome: nome.trim().slice(0, 200),
        descricao: descricao ? String(descricao).slice(0, 500) : null,
        pontos_necessarios: Math.round(Number(pontos_necessarios)),
        tipo: tipo ?? 'desconto',
        valor_desconto: valor_desconto ? Number(valor_desconto) : null,
        estoque: estoque ? Math.round(Number(estoque)) : null,
        ativo: true,
      })
      .select()
      .single()

    if (dbErr) {
      logger.error('fidelidade.recompensas.post.db', dbErr, { lavaJatoId })
      return error('Erro ao criar recompensa', 500)
    }

    logger.info('fidelidade.recompensas.created', { id: data.id, lavaJatoId })
    return ok({ data }, 201)
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('fidelidade.recompensas.post', e)
    return error('Erro interno', 500)
  }
}
