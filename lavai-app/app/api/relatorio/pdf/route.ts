// LAVAI — PDF Report Generation API
// GET /api/relatorio/pdf?semana=YYYY-WW

import { NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { requireAuth, error } from '@/lib/api-helpers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { RelatorioPDF, RelatorioData } from '@/lib/pdf/RelatorioPDF'

// ─── Week helpers ─────────────────────────────────────────────────────────────

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/** Parse "YYYY-WW" or return current week */
function parseWeekParam(param: string | null): { year: number; week: number } {
  if (param && /^\d{4}-\d{1,2}$/.test(param)) {
    const [y, w] = param.split('-').map(Number)
    if (w >= 1 && w <= 53) return { year: y, week: w }
  }
  const now = new Date()
  return { year: now.getFullYear(), week: getISOWeek(now) }
}

/** Return Monday and Sunday of a given ISO week */
function weekBounds(year: number, week: number): { start: Date; end: Date } {
  // Jan 4 is always in week 1
  const jan4 = new Date(year, 0, 4)
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (week - 1) * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { start: monday, end: sunday }
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatDateBR(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const DIAS: Record<string, string> = {
  '0': 'Dom', '1': 'Seg', '2': 'Ter',
  '3': 'Qua', '4': 'Qui', '5': 'Sex', '6': 'Sáb',
}

// ─── Data fetching ────────────────────────────────────────────────────────────

export async function buildRelatorioData(
  lavaJatoId: string,
  year: number,
  week: number
): Promise<RelatorioData> {
  const supabase = createServerSupabaseClient()

  const { start, end } = weekBounds(year, week)
  const startStr = toDateStr(start) + 'T00:00:00'
  const endStr = toDateStr(end) + 'T23:59:59'

  // Previous week
  const { start: prevStart, end: prevEnd } = weekBounds(
    year,
    week > 1 ? week - 1 : 52
  )
  const prevStartStr = toDateStr(prevStart) + 'T00:00:00'
  const prevEndStr = toDateStr(prevEnd) + 'T23:59:59'

  // Fetch lava-jato name
  const { data: lj } = await supabase
    .from('lava_jatos')
    .select('nome')
    .eq('id', lavaJatoId)
    .single()

  // Current week atendimentos (concluídos)
  const { data: atendimentos } = await supabase
    .from('atendimentos')
    .select('id, preco_final, servico_nome, funcionario, forma_pagamento, created_at, cliente_id, status, clientes(id, created_at)')
    .eq('lava_jato_id', lavaJatoId)
    .eq('status', 'concluido')
    .gte('created_at', startStr)
    .lte('created_at', endStr)

  const items = atendimentos || []

  // Previous week atendimentos
  const { data: prevItems } = await supabase
    .from('atendimentos')
    .select('id, preco_final')
    .eq('lava_jato_id', lavaJatoId)
    .eq('status', 'concluido')
    .gte('created_at', prevStartStr)
    .lte('created_at', prevEndStr)

  const prevList = prevItems || []

  // Despesas current week
  const { data: despesasData } = await supabase
    .from('despesas')
    .select('valor')
    .eq('lava_jato_id', lavaJatoId)
    .gte('data', toDateStr(start))
    .lte('data', toDateStr(end))

  const despesas = (despesasData || []).reduce((s: number, d: any) => s + Number(d.valor), 0)

  // Funcionários
  const { data: funcs } = await supabase
    .from('funcionarios')
    .select('id, nome')
    .eq('lava_jato_id', lavaJatoId)
    .eq('ativo', true)

  // ─── Compute KPIs ─────────────────────────────────────────────────────────

  const receita = items.reduce((s: number, a: any) => s + Number(a.preco_final || 0), 0)
  const receitaAnterior = prevList.reduce((s: number, a: any) => s + Number(a.preco_final || 0), 0)
  const atendimentosCount = items.length
  const atendimentosAnterior = prevList.length
  const ticketMedio = atendimentosCount > 0 ? receita / atendimentosCount : 0

  // New clients this week = clients whose first atendimento is this week
  const novosClientes = items.filter((a: any) => {
    if (!a.clientes) return false
    const clientCreated = new Date(a.clientes.created_at)
    return clientCreated >= start && clientCreated <= end
  }).length

  // ─── Top serviços ──────────────────────────────────────────────────────────

  const servicoMap: Record<string, { count: number; receita: number }> = {}
  for (const a of items as any[]) {
    const nome = a.servico_nome || 'Sem serviço'
    if (!servicoMap[nome]) servicoMap[nome] = { count: 0, receita: 0 }
    servicoMap[nome].count++
    servicoMap[nome].receita += Number(a.preco_final || 0)
  }
  const topServicos = Object.entries(servicoMap)
    .map(([nome, v]) => ({ nome, ...v }))
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 5)

  // ─── Atendimentos por dia ──────────────────────────────────────────────────

  const diaMap: Record<string, { count: number; receita: number }> = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const key = toDateStr(d)
    diaMap[key] = { count: 0, receita: 0 }
  }
  for (const a of items as any[]) {
    const key = (a.created_at as string).slice(0, 10)
    if (diaMap[key]) {
      diaMap[key].count++
      diaMap[key].receita += Number(a.preco_final || 0)
    }
  }
  const atendimentosPorDia = Object.entries(diaMap).map(([dateStr, v]) => {
    const dayOfWeek = String(new Date(dateStr + 'T12:00:00').getDay())
    return { dia: DIAS[dayOfWeek] || dayOfWeek, ...v }
  })

  // ─── Formas de pagamento ───────────────────────────────────────────────────

  const payMap: Record<string, { count: number; valor: number }> = {}
  for (const a of items as any[]) {
    const forma = a.forma_pagamento || 'outros'
    if (!payMap[forma]) payMap[forma] = { count: 0, valor: 0 }
    payMap[forma].count++
    payMap[forma].valor += Number(a.preco_final || 0)
  }
  const formasPagamento = Object.entries(payMap)
    .map(([forma, v]) => ({ forma, ...v }))
    .sort((a, b) => b.valor - a.valor)

  // ─── Funcionários ──────────────────────────────────────────────────────────

  const funcMap: Record<string, { osCount: number; receita: number }> = {}
  for (const f of funcs || []) {
    funcMap[(f as any).nome] = { osCount: 0, receita: 0 }
  }
  for (const a of items as any[]) {
    const nome = a.funcionario || 'Sem atribuição'
    if (!funcMap[nome]) funcMap[nome] = { osCount: 0, receita: 0 }
    funcMap[nome].osCount++
    funcMap[nome].receita += Number(a.preco_final || 0)
  }
  const funcionariosResult = Object.entries(funcMap)
    .map(([nome, v]) => ({ nome, ...v }))
    .sort((a, b) => b.receita - a.receita)

  return {
    lavaJatoNome: lj?.nome || 'Lava-Jato',
    periodo: {
      inicio: formatDateBR(start),
      fim: formatDateBR(end),
    },
    kpis: {
      receita,
      receitaAnterior,
      atendimentos: atendimentosCount,
      atendimentosAnterior,
      ticketMedio,
      novosClientes,
    },
    topServicos,
    atendimentosPorDia,
    formasPagamento,
    funcionarios: funcionariosResult,
    despesas,
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { lavaJatoId } = await requireAuth(req)

    const { searchParams } = new URL(req.url)
    const semanaParam = searchParams.get('semana')
    const { year, week } = parseWeekParam(semanaParam)

    const data = await buildRelatorioData(lavaJatoId, year, week)

    const buffer = await renderToBuffer(
      createElement(RelatorioPDF, { data })
    )

    const weekLabel = `${year}-W${String(week).padStart(2, '0')}`

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="lavai-relatorio-${weekLabel}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error('[relatorio/pdf]', e)
    return error('Erro ao gerar PDF', 500)
  }
}
