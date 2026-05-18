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
    const nivel = searchParams.get('nivel')
    const q = searchParams.get('q')

    const supabase = createServerSupabaseClient()
    let query = supabase
      .from('pontos_clientes')
      .select(`
        id, pontos_total, pontos_disponiveis, nivel, total_gasto,
        total_atendimentos, ultima_visita, updated_at,
        clientes(id, nome, telefone, email)
      `)
      .eq('lava_jato_id', lavaJatoId)
      .order('pontos_total', { ascending: false })
      .limit(200)

    if (nivel) query = query.eq('nivel', nivel)

    const { data, error: dbErr } = await query
    if (dbErr) {
      logger.error('fidelidade.pontos.get.db', dbErr, { lavaJatoId })
      return error('Erro interno', 500)
    }

    let result = data ?? []
    if (q) {
      const qLower = q.toLowerCase()
      result = result.filter((r: any) =>
        r.clientes?.nome?.toLowerCase().includes(qLower) ||
        r.clientes?.telefone?.includes(q)
      )
    }

    return ok({ data: result })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('fidelidade.pontos.get', e)
    return error('Erro interno', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)
    if (!rateLimit(`${userId}:post`, 60, 60_000)) return error('Rate limit excedido', 429)

    const body = await req.json()
    const { clienteId, pontos, tipo, descricao } = body

    if (!clienteId) return error('clienteId é obrigatório', 400)
    if (!pontos || isNaN(Number(pontos))) return error('pontos é obrigatório e deve ser número', 400)
    const tiposValidos = ['ganho', 'resgate', 'expiracao', 'bonus', 'ajuste']
    if (!tipo || !tiposValidos.includes(tipo)) return error(`tipo deve ser um de: ${tiposValidos.join(', ')}`, 400)

    const pontosNum = Math.round(Number(pontos))
    const supabase = createServerSupabaseClient()

    // Verify cliente belongs to this lava_jato
    const { data: cliente } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', clienteId)
      .eq('lava_jato_id', lavaJatoId)
      .single()

    if (!cliente) return error('Cliente não encontrado', 404)

    // Get or create pontos_clientes record
    const { data: existing } = await supabase
      .from('pontos_clientes')
      .select('*')
      .eq('lava_jato_id', lavaJatoId)
      .eq('cliente_id', clienteId)
      .single()

    const currentTotal = existing?.pontos_total ?? 0
    const currentDisp = existing?.pontos_disponiveis ?? 0
    const newTotal = currentTotal + pontosNum
    const newDisp = Math.max(0, currentDisp + pontosNum)

    // Get config to compute nivel
    const { data: configRow } = await supabase
      .from('fidelidade_config')
      .select('*')
      .eq('lava_jato_id', lavaJatoId)
      .single()

    const config = configRow ?? DEFAULT_CONFIG
    const novoNivel = calcularNivel(newTotal, config)

    if (existing) {
      await supabase
        .from('pontos_clientes')
        .update({
          pontos_total: newTotal,
          pontos_disponiveis: newDisp,
          nivel: novoNivel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('pontos_clientes')
        .insert({
          lava_jato_id: lavaJatoId,
          cliente_id: clienteId,
          pontos_total: Math.max(0, pontosNum),
          pontos_disponiveis: Math.max(0, pontosNum),
          nivel: novoNivel,
        })
    }

    // Record transaction
    const { data: transacao } = await supabase
      .from('pontos_transacoes')
      .insert({
        lava_jato_id: lavaJatoId,
        cliente_id: clienteId,
        tipo,
        pontos: pontosNum,
        descricao: descricao ?? null,
      })
      .select()
      .single()

    logger.info('fidelidade.pontos.ajuste', { clienteId, pontos: pontosNum, tipo, lavaJatoId })
    return ok({ data: { transacao, novoNivel, pontosTotal: newTotal, pontosDisponiveis: newDisp } }, 201)
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('fidelidade.pontos.post', e)
    return error('Erro interno', 500)
  }
}
