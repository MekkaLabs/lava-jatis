import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

// GET /api/funcionarios/relatorio?from=ISO&to=ISO
// Produtividade por funcionário: nº de OS concluídas, faturamento gerado e ticket médio
// no período. Agrega atendimentos (status=concluido) pelo campo `funcionario` (texto).
// OS sem funcionário caem no bucket "Não atribuído".
export async function GET(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(userId, 200, 60_000)) return error('Rate limit excedido', 429)

    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    if (from && isNaN(Date.parse(from))) return error('from inválido', 400)
    if (to && isNaN(Date.parse(to))) return error('to inválido', 400)

    const supabase = createServerSupabaseClient()
    let query = supabase
      .from('atendimentos')
      .select('funcionario, preco_final, concluido_at, created_at')
      .eq('lava_jato_id', lavaJatoId)
      .eq('status', 'concluido')
      .limit(5000)

    if (from) query = query.gte('created_at', new Date(from).toISOString())
    if (to) query = query.lte('created_at', new Date(to).toISOString())

    const { data, error: dbErr } = await query
    if (dbErr) {
      logger.error('funcionarios.relatorio.db', dbErr, { lavaJatoId })
      return error('Erro interno', 500)
    }

    // Agrega por funcionário (texto). Null/vazio → "Não atribuído".
    const buckets = new Map<string, { nome: string; totalOS: number; faturamento: number }>()
    for (const row of data ?? []) {
      const nome = (row.funcionario ?? '').trim() || 'Não atribuído'
      const valor = Number(row.preco_final ?? 0)
      const b = buckets.get(nome) ?? { nome, totalOS: 0, faturamento: 0 }
      b.totalOS += 1
      b.faturamento += valor
      buckets.set(nome, b)
    }

    const relatorio = Array.from(buckets.values())
      .map(b => ({
        nome: b.nome,
        totalOS: b.totalOS,
        faturamento: Math.round(b.faturamento * 100) / 100,
        ticketMedio: b.totalOS ? Math.round((b.faturamento / b.totalOS) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.faturamento - a.faturamento)

    const totalOS = relatorio.reduce((s, r) => s + r.totalOS, 0)
    const totalFaturamento = Math.round(relatorio.reduce((s, r) => s + r.faturamento, 0) * 100) / 100

    return ok({ data: relatorio, totals: { totalOS, totalFaturamento } })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('funcionarios.relatorio', e)
    return error('Erro interno', 500)
  }
}
