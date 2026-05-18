import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok, notFound } from '@/lib/api-helpers'
import { calcularNivel, calcularPontosGanhos, DEFAULT_CONFIG } from '@/lib/fidelidade'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)
    if (!rateLimit(`${userId}:post`, 60, 60_000)) return error('Rate limit excedido', 429)

    const supabase = createServerSupabaseClient()

    // Get atendimento — verify ownership and status
    const { data: atendimento } = await supabase
      .from('atendimentos')
      .select('id, cliente_id, preco_final, status, cliente_nome')
      .eq('id', params.id)
      .eq('lava_jato_id', lavaJatoId)
      .single()

    if (!atendimento) return notFound('Atendimento')
    if (!atendimento.cliente_id) return error('Atendimento não possui cliente vinculado', 400)
    if (atendimento.status !== 'concluido') return error('Atendimento precisa estar concluído para pontuar', 400)

    // Check if already pointed (avoid duplicate)
    const { data: jaTransacionado } = await supabase
      .from('pontos_transacoes')
      .select('id')
      .eq('atendimento_id', params.id)
      .eq('tipo', 'ganho')
      .maybeSingle()

    if (jaTransacionado) return error('Pontos já foram concedidos para este atendimento', 409)

    // Get config
    const { data: configRow } = await supabase
      .from('fidelidade_config')
      .select('*')
      .eq('lava_jato_id', lavaJatoId)
      .single()

    const config = configRow ?? DEFAULT_CONFIG
    if (!config.ativo) return error('Programa de fidelidade inativo', 409)

    const valorFinal = Number(atendimento.preco_final ?? 0)
    const pontosGanhos = calcularPontosGanhos(valorFinal, config)

    if (pontosGanhos <= 0) return error('Valor do atendimento insuficiente para gerar pontos', 400)

    // Get or create pontos_clientes
    const { data: existing } = await supabase
      .from('pontos_clientes')
      .select('*')
      .eq('lava_jato_id', lavaJatoId)
      .eq('cliente_id', atendimento.cliente_id)
      .single()

    const currentTotal = existing?.pontos_total ?? 0
    const currentDisp = existing?.pontos_disponiveis ?? 0
    const currentGasto = existing?.total_gasto ?? 0
    const currentAtend = existing?.total_atendimentos ?? 0

    const newTotal = currentTotal + pontosGanhos
    const newDisp = currentDisp + pontosGanhos
    const novoNivel = calcularNivel(newTotal, config)

    if (existing) {
      await supabase
        .from('pontos_clientes')
        .update({
          pontos_total: newTotal,
          pontos_disponiveis: newDisp,
          nivel: novoNivel,
          total_gasto: Number((currentGasto + valorFinal).toFixed(2)),
          total_atendimentos: currentAtend + 1,
          ultima_visita: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('pontos_clientes')
        .insert({
          lava_jato_id: lavaJatoId,
          cliente_id: atendimento.cliente_id,
          pontos_total: pontosGanhos,
          pontos_disponiveis: pontosGanhos,
          nivel: novoNivel,
          total_gasto: valorFinal,
          total_atendimentos: 1,
          ultima_visita: new Date().toISOString(),
        })
    }

    // Record transaction
    await supabase.from('pontos_transacoes').insert({
      lava_jato_id: lavaJatoId,
      cliente_id: atendimento.cliente_id,
      atendimento_id: params.id,
      tipo: 'ganho',
      pontos: pontosGanhos,
      descricao: `Atendimento #${params.id.slice(0, 8).toUpperCase()} — R$ ${valorFinal.toFixed(2)}`,
    })

    logger.info('fidelidade.pontuar.success', { atendimentoId: params.id, pontosGanhos, novoNivel, lavaJatoId })
    return ok({
      data: {
        pontosGanhos,
        nivelAtual: novoNivel,
        pontosTotal: newTotal,
        pontosDisponiveis: newDisp,
        nivelAnterior: existing?.nivel ?? 'bronze',
        subioDeNivel: novoNivel !== (existing?.nivel ?? 'bronze'),
      }
    })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('fidelidade.pontuar', e)
    return error('Erro interno', 500)
  }
}
