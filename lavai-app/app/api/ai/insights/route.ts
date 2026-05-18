import { NextRequest } from 'next/server'
import { requireAuth, rateLimit, error } from '@/lib/api-helpers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { generateInsights, generateWeeklyReport, InsightData } from '@/lib/ai'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(userId, 10, 60_000)) return error('Rate limit excedido', 429)

    const supabase = createServerSupabaseClient()
    const now = new Date()

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    const thirtyStr = thirtyDaysAgo.toISOString()
    const sixtyStr = sixtyDaysAgo.toISOString()

    const [
      atendimentosRes,
      receitaAtualRes,
      receitaAnteriorRes,
      clientesAtivosRes,
      clientesNovosRes,
      despesasRes,
      topServicosRes,
      atendHorariosRes,
    ] = await Promise.all([
      supabase
        .from('atendimentos')
        .select('id', { count: 'exact', head: true })
        .eq('lava_jato_id', lavaJatoId)
        .eq('status', 'concluido')
        .gte('created_at', thirtyStr),

      supabase
        .from('atendimentos')
        .select('preco_final')
        .eq('lava_jato_id', lavaJatoId)
        .eq('status', 'concluido')
        .gte('created_at', thirtyStr),

      supabase
        .from('atendimentos')
        .select('preco_final')
        .eq('lava_jato_id', lavaJatoId)
        .eq('status', 'concluido')
        .gte('created_at', sixtyStr)
        .lt('created_at', thirtyStr),

      supabase
        .from('atendimentos')
        .select('cliente_id', { count: 'exact', head: true })
        .eq('lava_jato_id', lavaJatoId)
        .eq('status', 'concluido')
        .gte('created_at', thirtyStr)
        .not('cliente_id', 'is', null),

      supabase
        .from('clientes')
        .select('id', { count: 'exact', head: true })
        .eq('lava_jato_id', lavaJatoId)
        .gte('created_at', thirtyStr),

      supabase
        .from('despesas')
        .select('valor')
        .eq('lava_jato_id', lavaJatoId)
        .gte('data', thirtyDaysAgo.toISOString().slice(0, 10)),

      supabase
        .from('atendimentos')
        .select('servico_id, preco_final, servicos(nome)')
        .eq('lava_jato_id', lavaJatoId)
        .eq('status', 'concluido')
        .gte('created_at', thirtyStr),

      supabase
        .from('atendimentos')
        .select('created_at')
        .eq('lava_jato_id', lavaJatoId)
        .eq('status', 'concluido')
        .gte('created_at', thirtyStr),
    ])

    const receitaUltimos30Dias = (receitaAtualRes.data ?? []).reduce(
      (sum: number, r: any) => sum + (r.preco_final || 0), 0,
    )
    const receitaMesAnterior = (receitaAnteriorRes.data ?? []).reduce(
      (sum: number, r: any) => sum + (r.preco_final || 0), 0,
    )
    const atendimentosCount = atendimentosRes.count ?? 0
    const ticketMedio = atendimentosCount > 0 ? receitaUltimos30Dias / atendimentosCount : 0
    const despesasTotal = (despesasRes.data ?? []).reduce(
      (sum: number, d: any) => sum + (d.valor || 0), 0,
    )

    const servicoMap: Record<string, { nome: string; count: number; receita: number }> = {}
    for (const row of topServicosRes.data ?? []) {
      const id = row.servico_id ?? 'sem_servico'
      const nome = (row as any).servicos?.nome ?? 'Serviço'
      if (!servicoMap[id]) servicoMap[id] = { nome, count: 0, receita: 0 }
      servicoMap[id].count++
      servicoMap[id].receita += row.preco_final ?? 0
    }
    const topServicos = Object.values(servicoMap).sort((a, b) => b.count - a.count).slice(0, 5)

    const horaMap: Record<string, number> = {}
    for (const r of atendHorariosRes.data ?? []) {
      const hora = new Date(r.created_at).getHours()
      const key = `${hora}h`
      horaMap[key] = (horaMap[key] ?? 0) + 1
    }
    const horariosPico = Object.entries(horaMap)
      .map(([hora, count]) => ({ hora, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const diaMap: Record<string, number> = {}
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    for (const r of atendHorariosRes.data ?? []) {
      const dia = diasSemana[new Date(r.created_at).getDay()]
      diaMap[dia] = (diaMap[dia] ?? 0) + 1
    }
    const diasMaisMovimentados = Object.entries(diaMap)
      .map(([dia, count]) => ({ dia, count }))
      .sort((a, b) => b.count - a.count)

    const insightData: InsightData = {
      atendimentosUltimos30Dias: atendimentosCount,
      receitaUltimos30Dias,
      receitaMesAnterior,
      ticketMedio,
      topServicos,
      clientesAtivos: clientesAtivosRes.count ?? 0,
      clientesNovos: clientesNovosRes.count ?? 0,
      despesasTotal,
      horariosPico,
      diasMaisMovimentados,
    }

    const [insights, reportNarrative] = await Promise.all([
      generateInsights(insightData),
      generateWeeklyReport(insightData),
    ])

    return Response.json(
      {
        insights,
        reportNarrative,
        generatedAt: new Date().toISOString(),
        metrics: {
          atendimentosUltimos30Dias: insightData.atendimentosUltimos30Dias,
          receitaUltimos30Dias: insightData.receitaUltimos30Dias,
          receitaMesAnterior: insightData.receitaMesAnterior,
          ticketMedio: insightData.ticketMedio,
          clientesAtivos: insightData.clientesAtivos,
          clientesNovos: insightData.clientesNovos,
          despesasTotal: insightData.despesasTotal,
        },
        hasRealAI: !!process.env.ANTHROPIC_API_KEY,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'private, max-age=3600, stale-while-revalidate=300' },
      },
    )
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('ai.insights.get', e)
    return error('Erro interno ao gerar insights', 500)
  }
}
