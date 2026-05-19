'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Download, TrendingUp, TrendingDown, Zap } from 'lucide-react'
import { IS_DEMO } from '@/lib/demo'
import Sidebar from '@/components/Sidebar'

const DEMO_INSIGHTS_DATA = {
  hasRealAI: false,
  generatedAt: new Date().toISOString(),
  metrics: {
    atendimentosUltimos30Dias: 87,
    receitaUltimos30Dias: 11280,
    receitaMesAnterior: 9640,
    ticketMedio: 130,
    clientesAtivos: 42,
    clientesNovos: 11,
    despesasTotal: 2850,
  },
  reportNarrative: 'O lava-jato apresentou crescimento de 17% na receita em relação ao mês anterior, impulsionado pelo aumento de 23% no ticket médio. A retenção de clientes está saudável com 42 clientes ativos, e os serviços premium como polimento e higienização representam 65% da receita total. Há oportunidade de crescimento via programa de indicações e agendamento online.',
  insights: [
    { titulo: 'Receita em alta: crescimento de 17% no mês', descricao: 'A receita aumentou de R$9.640 para R$11.280 este mês. O principal driver foi o aumento de serviços premium (polimento e higienização), que têm ticket médio 3x maior que a lavagem simples.', acao: 'Ofereça combo "Lavagem + Polimento" com 10% de desconto para aumentar a adoção de serviços premium.', impacto: 'alto' as const, categoria: 'receita' as const },
    { titulo: 'Sábado é o dia mais lucrativo — aproveite melhor', descricao: 'Sábados geram em média 2.6x mais receita que dias de semana. A fila fica cheia após 10h, mas há capacidade ociosa das 8h às 9h30.', acao: 'Crie um agendamento preferencial "Madrugador" às 8h com 5% de desconto para distribuir melhor a demanda.', impacto: 'médio' as const, categoria: 'operação' as const },
    { titulo: '11 novos clientes — taxa de retorno abaixo do ideal', descricao: 'Você captou 11 novos clientes este mês, mas apenas 3 retornaram para uma segunda visita. A taxa de retenção de 27% pode ser melhorada com ações simples de relacionamento.', acao: 'Envie mensagem de WhatsApp para clientes que não retornam há mais de 15 dias com cupom de desconto de R$10.', impacto: 'alto' as const, categoria: 'clientes' as const },
    { titulo: 'Despesas controladas: margem de 74,7%', descricao: 'As despesas de R$2.850 representam apenas 25,3% da receita, o que é excelente para o setor. O maior custo é folha de pagamento (63% das despesas), seguido por produtos de limpeza (18%).', acao: 'Compre produtos de limpeza em maior volume para negociar desconto de 15-20% com fornecedores.', impacto: 'baixo' as const, categoria: 'custo' as const },
    { titulo: 'Programa de fidelidade com baixo engajamento', descricao: 'Apenas 8 clientes usaram o programa de pontos este mês. A maioria desconhece as recompensas disponíveis ou não sabe quantos pontos tem acumulados.', acao: 'Informe o saldo de pontos de cada cliente via WhatsApp ao final do atendimento para aumentar o engajamento em 40%.', impacto: 'médio' as const, categoria: 'marketing' as const },
    { titulo: 'Horário morto: 13h–14h30 tem 70% de capacidade ociosa', descricao: 'O horário de almoço tem o menor volume de atendimentos da semana. Funcionários estão disponíveis mas o movimento é baixo. Pequenos ajustes podem aumentar o faturamento mensal em R$800+.', acao: 'Lance uma promoção "Almoço Relâmpago" das 13h às 14h30 com 15% de desconto para atrair clientes nesse horário.', impacto: 'médio' as const, categoria: 'receita' as const },
    { titulo: 'Avaliações NPS positivas: oportunidade de marketing', descricao: 'Clientes com nota 5 estrelas (68% dos avaliados) raramente indicam o serviço proativamente. Transformar promotores em advogados da marca pode dobrar o crescimento orgânico.', acao: 'Peça aos clientes com 5 estrelas para deixar uma avaliação no Google Meu Negócio. Ofereça 20 pontos de bônus como incentivo.', impacto: 'alto' as const, categoria: 'marketing' as const },
    { titulo: 'Serviço menos lucrativo: Lavagem Simples', descricao: 'A Lavagem Simples representa 35% dos atendimentos, mas apenas 12% da receita. O custo por atendimento (água, produto, tempo) é praticamente igual ao do serviço premium.', acao: 'Eleve o preço da Lavagem Simples em R$5 e crie um pacote "3 lavagens por R$X" para aumentar frequência e receita.', impacto: 'médio' as const, categoria: 'receita' as const },
  ],
}

interface Insight {
  titulo: string
  descricao: string
  acao: string
  impacto: 'alto' | 'médio' | 'baixo'
  categoria: 'receita' | 'custo' | 'clientes' | 'operação' | 'marketing'
}

interface Metrics {
  atendimentosUltimos30Dias: number
  receitaUltimos30Dias: number
  receitaMesAnterior: number
  ticketMedio: number
  clientesAtivos: number
  clientesNovos: number
  despesasTotal: number
}

interface InsightsResponse {
  insights: Insight[]
  reportNarrative: string
  generatedAt: string
  metrics: Metrics
  hasRealAI: boolean
}

const CATEGORY_EMOJI: Record<string, string> = {
  receita: '💰',
  custo: '✂️',
  clientes: '👥',
  operação: '⚙️',
  marketing: '📢',
}

const IMPACT_COLOR: Record<string, string> = {
  alto: '#ef4444',
  médio: '#f59e0b',
  baixo: '#00e676',
}

const IMPACT_BG: Record<string, string> = {
  alto: 'rgba(239,68,68,0.08)',
  médio: 'rgba(245,158,11,0.08)',
  baixo: 'rgba(0,230,118,0.08)',
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function TrendBadge({ current, previous, label }: { current: number; previous: number; label: string }) {
  const diff = previous > 0 ? ((current - previous) / previous) * 100 : 0
  const positive = diff >= 0
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(26,26,46,0.8)' }}
    >
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-white">{formatCurrency(current)}</p>
      <div className="flex items-center gap-1">
        {positive ? (
          <TrendingUp size={12} style={{ color: '#00e676' }} />
        ) : (
          <TrendingDown size={12} style={{ color: '#ef4444' }} />
        )}
        <span
          className="text-xs font-semibold"
          style={{ color: positive ? '#00e676' : '#ef4444' }}
        >
          {positive ? '+' : ''}{diff.toFixed(1)}% vs mês anterior
        </span>
      </div>
      <p className="text-[10px] text-gray-600">Mês anterior: {formatCurrency(previous)}</p>
    </div>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  const borderColor = IMPACT_COLOR[insight.impacto] ?? '#00d4ff'
  const bg = IMPACT_BG[insight.impacto] ?? 'rgba(0,212,255,0.04)'
  const emoji = CATEGORY_EMOJI[insight.categoria] ?? '💡'

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(26,26,46,0.8)',
        borderLeft: `3px solid ${borderColor}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <p className="font-semibold text-white text-sm leading-tight">{insight.titulo}</p>
        </div>
        <span
          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: bg, color: borderColor }}
        >
          {insight.impacto}
        </span>
      </div>

      <p className="text-sm text-gray-400 leading-relaxed">{insight.descricao}</p>

      <div
        className="rounded-lg px-3 py-2.5 mt-auto"
        style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#00d4ff' }}>
          Ação Recomendada
        </p>
        <p className="text-sm text-gray-300">{insight.acao}</p>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div
      className="rounded-xl p-5 animate-pulse"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(26,26,46,0.8)' }}
    >
      <div className="h-3 rounded w-1/4 mb-3" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="h-5 rounded w-3/4 mb-3" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="h-3 rounded w-full mb-1.5" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="h-3 rounded w-5/6 mb-5" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="h-12 rounded" style={{ background: 'rgba(0,212,255,0.06)' }} />
    </div>
  )
}

export default function InsightsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [data, setData] = useState<InsightsResponse | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  const fetchInsights = useCallback(async (showSpinner = false) => {
    if (showSpinner) setSpinning(true)
    setError(false)
    // ── Demo mode ──────────────────────────────────────────────
    if (IS_DEMO) {
      await new Promise(r => setTimeout(r, 800))
      setData({ ...DEMO_INSIGHTS_DATA, generatedAt: new Date().toISOString() })
      setLoading(false)
      if (showSpinner) setTimeout(() => setSpinning(false), 600)
      return
    }
    // ── Real API ───────────────────────────────────────────────
    try {
      const res = await fetch('/api/ai/insights', { credentials: 'include' })
      if (!res.ok) throw new Error('fetch failed')
      const json = await res.json()
      setData(json)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      if (showSpinner) setTimeout(() => setSpinning(false), 600)
    }
  }, [])

  useEffect(() => { fetchInsights() }, [fetchInsights])

  const downloadReport = () => {
    if (!data) return
    const content = [
      'RELATÓRIO DE INSIGHTS — LAVAI',
      `Gerado em: ${new Date(data.generatedAt).toLocaleString('pt-BR')}`,
      '',
      '═══════════════════════════════════════',
      'RELATÓRIO NARRATIVO',
      '═══════════════════════════════════════',
      data.reportNarrative,
      '',
      '═══════════════════════════════════════',
      'INSIGHTS DETALHADOS',
      '═══════════════════════════════════════',
      ...data.insights.map((ins, i) =>
        `\n[${i + 1}] ${ins.titulo} (${ins.impacto.toUpperCase()} — ${ins.categoria})\n${ins.descricao}\n→ Ação: ${ins.acao}`
      ),
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lavai-insights-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Revenue prediction: simple linear projection based on trend
  const prediction = (() => {
    if (!data?.metrics) return null
    const { receitaUltimos30Dias, receitaMesAnterior } = data.metrics
    if (receitaMesAnterior === 0) return receitaUltimos30Dias / 4
    const trend = receitaUltimos30Dias / receitaMesAnterior
    return (receitaUltimos30Dias / 4) * trend
  })()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#08090f' }}>
      <Sidebar />
      <main className="flex-1 ml-[240px] flex flex-col overflow-auto" style={{ color: 'white' }}>
      <style>{`@media (max-width: 1023px) { main { margin-left: 0 !important; } }`}</style>
    <div
      className="p-4 md:p-6 space-y-6"
      style={{ color: 'white' }}
    >
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(0,212,255,0.12)' }}
          >
            <Zap size={18} style={{ color: '#00d4ff' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Insights de IA</h1>
            <p className="text-xs text-gray-500">
              {data
                ? `Atualizado em ${new Date(data.generatedAt).toLocaleString('pt-BR')}`
                : 'Carregando análise…'}
            </p>
          </div>
          {data && !data.hasRealAI && (
            <span
              className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}
            >
              Demo — configure ANTHROPIC_API_KEY
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchInsights(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)' }}
          >
            <RefreshCw size={14} className={spinning ? 'animate-spin' : ''} />
            <span className="hidden md:inline">Gerar Novo</span>
          </button>
          <button
            onClick={downloadReport}
            disabled={!data}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
            style={{ background: 'rgba(0,230,118,0.1)', color: '#00e676', border: '1px solid rgba(0,230,118,0.2)' }}
          >
            <Download size={14} />
            <span className="hidden md:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {(['7d', '30d', '90d'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={
              period === p
                ? { background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }
                : { background: 'rgba(255,255,255,0.04)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.06)' }
            }
          >
            {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
          </button>
        ))}
      </div>

      {/* Trend comparisons */}
      {data?.metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TrendBadge
            current={data.metrics.receitaUltimos30Dias}
            previous={data.metrics.receitaMesAnterior}
            label="Receita (30 dias)"
          />
          <div
            className="rounded-xl p-4 flex flex-col gap-1"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(26,26,46,0.8)' }}
          >
            <p className="text-xs text-gray-500">Ticket Médio</p>
            <p className="text-lg font-bold text-white">{formatCurrency(data.metrics.ticketMedio)}</p>
            <p className="text-xs text-gray-500">{data.metrics.atendimentosUltimos30Dias} atendimentos</p>
          </div>
          <div
            className="rounded-xl p-4 flex flex-col gap-1"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(26,26,46,0.8)' }}
          >
            <p className="text-xs text-gray-500">Clientes Ativos</p>
            <p className="text-lg font-bold text-white">{data.metrics.clientesAtivos}</p>
            <p className="text-xs" style={{ color: '#00e676' }}>+{data.metrics.clientesNovos} novos no período</p>
          </div>
        </div>
      )}

      {/* Revenue prediction */}
      {prediction !== null && (
        <div
          className="rounded-xl px-5 py-4 flex items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(79,142,255,0.04) 100%)',
            border: '1px solid rgba(0,212,255,0.15)',
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(0,212,255,0.1)' }}>
            <TrendingUp size={18} style={{ color: '#00d4ff' }} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#00d4ff' }}>
              Previsão IA — Próxima Semana
            </p>
            <p className="text-white font-semibold">
              Receita estimada: <span style={{ color: '#00d4ff' }}>{formatCurrency(prediction)}</span>
            </p>
            <p className="text-xs text-gray-500">Baseado na tendência dos últimos 30 dias</p>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div
          className="rounded-xl px-5 py-4 flex items-center justify-between"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <p className="text-sm text-red-400">Não foi possível carregar insights. Tente novamente.</p>
          <button
            onClick={() => fetchInsights(true)}
            className="text-sm font-semibold ml-4"
            style={{ color: '#00d4ff' }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Insight Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : !error && data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} />
          ))}
        </div>
      ) : null}

      {/* Weekly Report */}
      {data?.reportNarrative && (
        <div
          className="rounded-2xl p-6"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(26,26,46,0.8)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(0,212,255,0.12)' }}
            >
              <span className="text-sm">📋</span>
            </div>
            <h2 className="font-semibold text-white">Relatório Executivo</h2>
          </div>
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {data.reportNarrative}
          </div>
        </div>
      )}
    </div>
    </main>
    </div>
  )
}
