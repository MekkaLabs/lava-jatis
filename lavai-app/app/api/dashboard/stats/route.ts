import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(userId, 120, 60_000)) return error('Rate limit excedido', 429)

    const supabase = createServerSupabaseClient()
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)

    // Atendimentos hoje
    const { count: atendimentosHoje } = await supabase
      .from('atendimentos')
      .select('id', { count: 'exact', head: true })
      .eq('lava_jato_id', lavaJatoId)
      .gte('created_at', `${todayStr}T00:00:00`)
      .lte('created_at', `${todayStr}T23:59:59`)

    // Receita do mês
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01T00:00:00`
    const { data: receitaRows } = await supabase
      .from('atendimentos')
      .select('preco_final')
      .eq('lava_jato_id', lavaJatoId)
      .eq('status', 'concluido')
      .gte('created_at', startOfMonth)

    const receitaMes = receitaRows?.reduce((sum: number, r: any) => sum + (r.preco_final || 0), 0) ?? 0

    // Clientes novos na semana
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count: clientesNovos } = await supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true })
      .eq('lava_jato_id', lavaJatoId)
      .gte('created_at', weekAgo)

    // Fila atual — only active statuses
    const { data: filaAtual } = await supabase
      .from('atendimentos')
      .select(`id, cliente_nome, placa, modelo, cor, status, preco_final, created_at,
        clientes(nome), servicos(nome, preco)`)
      .eq('lava_jato_id', lavaJatoId)
      .in('status', ['aguardando', 'em_andamento'])
      .order('created_at', { ascending: true })
      .limit(50)

    const filaFormatted = (filaAtual ?? []).map((a: any) => ({
      id: a.id,
      cliente_nome: a.clientes?.nome ?? a.cliente_nome ?? 'Cliente',
      servico_nome: a.servicos?.nome,
      placa: a.placa,
      modelo: a.modelo,
      status: a.status,
      preco_final: a.preco_final,
      created_at: a.created_at,
    }))

    // Top serviços (last 90 days to keep query fast)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const { data: topServicosRaw } = await supabase
      .from('atendimentos')
      .select('servico_id, preco_final, servicos(nome)')
      .eq('lava_jato_id', lavaJatoId)
      .eq('status', 'concluido')
      .gte('created_at', ninetyDaysAgo)

    const servicoMap: Record<string, { nome: string; count: number; receita: number }> = {}
    for (const row of topServicosRaw ?? []) {
      const id = row.servico_id
      const nome = (row as any).servicos?.nome ?? 'Serviço'
      if (!servicoMap[id]) servicoMap[id] = { nome, count: 0, receita: 0 }
      servicoMap[id].count++
      servicoMap[id].receita += row.preco_final ?? 0
    }
    const topServicos = Object.values(servicoMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Receita últimos 7 dias
    const days: Array<{ date: string; _iso: string; receita: number }> = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })
      days.push({ date: label, _iso: dateStr, receita: 0 })
    }

    const { data: receitaDias } = await supabase
      .from('atendimentos')
      .select('created_at, preco_final')
      .eq('lava_jato_id', lavaJatoId)
      .eq('status', 'concluido')
      .gte('created_at', weekAgo)

    for (const r of receitaDias ?? []) {
      const iso = r.created_at.slice(0, 10)
      const day = days.find(d => d._iso === iso)
      if (day) day.receita += r.preco_final ?? 0
    }

    const receitaUltimos7Dias = days.map(({ date, receita }) => ({ date, receita }))

    // NPS médio (últimos 30 dias)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: npsRows } = await supabase
      .from('nps_avaliacoes')
      .select('nota, cliente_nome, comentario, created_at')
      .eq('lava_jato_id', lavaJatoId)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(50)

    const npsTotal  = npsRows?.length ?? 0
    const npsMedia  = npsTotal > 0
      ? Math.round((npsRows!.reduce((s, r) => s + r.nota, 0) / npsTotal) * 10) / 10
      : null
    const npsRecentes = (npsRows ?? []).slice(0, 5)

    return ok({
      data: {
        atendimentosHoje: atendimentosHoje ?? 0,
        receitaMes,
        clientesNovos: clientesNovos ?? 0,
        filaAtual: filaFormatted,
        topServicos,
        receitaUltimos7Dias,
        nps: { media: npsMedia, total: npsTotal, recentes: npsRecentes },
      },
    })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('dashboard.stats.get', e)
    return error('Erro interno', 500)
  }
}
