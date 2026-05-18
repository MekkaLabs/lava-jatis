import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok } from '@/lib/api-helpers'
import { calcularNivel, DEFAULT_CONFIG } from '@/lib/fidelidade'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)
    if (!rateLimit(userId, 200, 60_000)) return error('Rate limit excedido', 429)

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const allowedStatus = ['pendente', 'utilizado', 'cancelado']
    if (status && !allowedStatus.includes(status)) return error('status inválido', 400)

    const supabase = createServerSupabaseClient()
    let query = supabase
      .from('resgates')
      .select(`
        id, pontos_usados, status, codigo_resgate, created_at, utilizado_at,
        clientes(id, nome, telefone),
        recompensas(id, nome, tipo, pontos_necessarios)
      `)
      .eq('lava_jato_id', lavaJatoId)
      .order('created_at', { ascending: false })
      .limit(200)

    if (status) query = query.eq('status', status)

    const { data, error: dbErr } = await query
    if (dbErr) {
      logger.error('fidelidade.resgates.get.db', dbErr, { lavaJatoId })
      return error('Erro interno', 500)
    }

    return ok({ data: data ?? [] })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('fidelidade.resgates.get', e)
    return error('Erro interno', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)
    if (!rateLimit(`${userId}:post`, 30, 60_000)) return error('Rate limit excedido', 429)

    const body = await req.json()
    const { clienteId, recompensaId } = body

    if (!clienteId) return error('clienteId é obrigatório', 400)
    if (!recompensaId) return error('recompensaId é obrigatório', 400)

    const supabase = createServerSupabaseClient()

    // Verify cliente belongs to this lava_jato
    const { data: cliente } = await supabase
      .from('clientes')
      .select('id, nome')
      .eq('id', clienteId)
      .eq('lava_jato_id', lavaJatoId)
      .single()
    if (!cliente) return error('Cliente não encontrado', 404)

    // Get recompensa
    const { data: recompensa } = await supabase
      .from('recompensas')
      .select('*')
      .eq('id', recompensaId)
      .eq('lava_jato_id', lavaJatoId)
      .eq('ativo', true)
      .single()
    if (!recompensa) return error('Recompensa não encontrada ou inativa', 404)

    // Check stock
    if (recompensa.estoque !== null && recompensa.estoque <= 0)
      return error('Recompensa sem estoque disponível', 409)

    // Get pontos_clientes
    const { data: pontosCliente } = await supabase
      .from('pontos_clientes')
      .select('*')
      .eq('lava_jato_id', lavaJatoId)
      .eq('cliente_id', clienteId)
      .single()

    const pontosDisp = pontosCliente?.pontos_disponiveis ?? 0
    if (pontosDisp < recompensa.pontos_necessarios)
      return error(`Pontos insuficientes. Necessário: ${recompensa.pontos_necessarios}, disponível: ${pontosDisp}`, 409)

    // Get config for nivel recalculation
    const { data: configRow } = await supabase
      .from('fidelidade_config')
      .select('*')
      .eq('lava_jato_id', lavaJatoId)
      .single()
    const config = configRow ?? DEFAULT_CONFIG

    const newDisp = pontosDisp - recompensa.pontos_necessarios
    const pontosTotal = pontosCliente?.pontos_total ?? 0
    const novoNivel = calcularNivel(pontosTotal, config)

    // Update pontos
    if (pontosCliente) {
      await supabase
        .from('pontos_clientes')
        .update({
          pontos_disponiveis: newDisp,
          nivel: novoNivel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pontosCliente.id)
    }

    // Reduce stock if limited
    if (recompensa.estoque !== null) {
      await supabase
        .from('recompensas')
        .update({ estoque: recompensa.estoque - 1 })
        .eq('id', recompensaId)
    }

    // Record transacao
    await supabase.from('pontos_transacoes').insert({
      lava_jato_id: lavaJatoId,
      cliente_id: clienteId,
      tipo: 'resgate',
      pontos: -recompensa.pontos_necessarios,
      descricao: `Resgate: ${recompensa.nome}`,
    })

    // Create resgate
    const { data: resgate, error: resgateErr } = await supabase
      .from('resgates')
      .insert({
        lava_jato_id: lavaJatoId,
        cliente_id: clienteId,
        recompensa_id: recompensaId,
        pontos_usados: recompensa.pontos_necessarios,
        status: 'pendente',
      })
      .select()
      .single()

    if (resgateErr) {
      logger.error('fidelidade.resgates.post.db', resgateErr, { lavaJatoId })
      return error('Erro ao criar resgate', 500)
    }

    logger.info('fidelidade.resgate.created', { resgateId: resgate.id, clienteId, lavaJatoId })
    return ok({ data: { resgate, codigoResgate: resgate.codigo_resgate, pontosRestantes: newDisp } }, 201)
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('fidelidade.resgates.post', e)
    return error('Erro interno', 500)
  }
}
