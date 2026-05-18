'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronUp, RefreshCw, Zap } from 'lucide-react'

interface Insight {
  titulo: string
  descricao: string
  acao: string
  impacto: 'alto' | 'médio' | 'baixo'
  categoria: 'receita' | 'custo' | 'clientes' | 'operação' | 'marketing'
}

interface InsightsResponse {
  insights: Insight[]
  reportNarrative: string
  generatedAt: string
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

function SkeletonCard() {
  return (
    <div
      className="rounded-xl p-4 flex-shrink-0 w-72 md:w-auto animate-pulse"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(26,26,46,0.8)' }}
    >
      <div className="h-3 rounded w-1/3 mb-3" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="h-4 rounded w-4/5 mb-2" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="h-3 rounded w-full mb-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="h-3 rounded w-2/3 mb-4" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="h-8 rounded" style={{ background: 'rgba(0,212,255,0.06)' }} />
    </div>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  const borderColor = IMPACT_COLOR[insight.impacto] ?? '#00d4ff'
  const bg = IMPACT_BG[insight.impacto] ?? 'rgba(0,212,255,0.04)'
  const emoji = CATEGORY_EMOJI[insight.categoria] ?? '💡'

  return (
    <div
      className="rounded-xl p-4 flex-shrink-0 w-72 md:w-auto flex flex-col gap-2"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(26,26,46,0.8)',
        borderLeft: `3px solid ${borderColor}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{emoji}</span>
          <p className="font-semibold text-white text-sm leading-tight">{insight.titulo}</p>
        </div>
        <span
          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: bg, color: borderColor }}
        >
          {insight.impacto}
        </span>
      </div>

      {/* Descrição */}
      <p className="text-xs text-gray-400 leading-relaxed">{insight.descricao}</p>

      {/* Ação */}
      <div
        className="rounded-lg px-3 py-2 mt-auto"
        style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#00d4ff' }}>
          Ação
        </p>
        <p className="text-xs text-gray-300">{insight.acao}</p>
      </div>
    </div>
  )
}

export default function AIInsightPanel() {
  const [collapsed, setCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [data, setData] = useState<InsightsResponse | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [showFullReport, setShowFullReport] = useState(false)
  const [minutesAgo, setMinutesAgo] = useState(0)

  const fetchInsights = useCallback(async (showSpinner = false) => {
    if (showSpinner) setSpinning(true)
    setError(false)
    try {
      const res = await fetch('/api/ai/insights', { credentials: 'include' })
      if (!res.ok) throw new Error('fetch failed')
      const json = await res.json()
      setData(json)
      setMinutesAgo(0)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      if (showSpinner) setTimeout(() => setSpinning(false), 600)
    }
  }, [])

  useEffect(() => {
    fetchInsights()
    // Poll every 60 minutes
    const poll = setInterval(() => fetchInsights(), 60 * 60 * 1000)
    // Update "X min ago" counter every minute
    const ticker = setInterval(() => setMinutesAgo(m => m + 1), 60 * 1000)
    return () => { clearInterval(poll); clearInterval(ticker) }
  }, [fetchInsights])

  const timeLabel = minutesAgo === 0
    ? 'Agora mesmo'
    : minutesAgo === 1
    ? 'Há 1 min'
    : `Há ${minutesAgo} min`

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(26,26,46,0.8)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
        style={{ borderBottom: collapsed ? 'none' : '1px solid rgba(26,26,46,0.6)' }}
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0,212,255,0.12)' }}
          >
            <Zap size={15} style={{ color: '#00d4ff' }} />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Insights de IA</p>
            {!loading && !error && (
              <p className="text-[10px] text-gray-500">{timeLabel}</p>
            )}
          </div>
          {data && !data.hasRealAI && (
            <span
              className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}
            >
              Demo
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); fetchInsights(true) }}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            title="Atualizar insights"
          >
            <RefreshCw
              size={13}
              className={spinning ? 'animate-spin' : ''}
              style={{ color: '#00d4ff' }}
            />
          </button>
          {collapsed ? (
            <ChevronDown size={16} className="text-gray-500" />
          ) : (
            <ChevronUp size={16} className="text-gray-500" />
          )}
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="p-5 space-y-4">
          {/* Loading */}
          {loading && (
            <div className="flex gap-3 overflow-x-auto md:grid md:grid-cols-2 pb-1">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <p className="text-sm text-red-400">Não foi possível carregar insights. Tente novamente.</p>
              <button
                onClick={() => fetchInsights(true)}
                className="text-xs font-semibold ml-3"
                style={{ color: '#00d4ff' }}
              >
                Tentar
              </button>
            </div>
          )}

          {/* Insight Cards */}
          {!loading && !error && data && (
            <>
              {/* Mobile: horizontal scroll / Desktop: 2-col grid */}
              <div className="flex gap-3 overflow-x-auto md:grid md:grid-cols-2 pb-1 md:pb-0 snap-x snap-mandatory md:snap-none">
                {data.insights.map((insight, i) => (
                  <div key={i} className="snap-start">
                    <InsightCard insight={insight} />
                  </div>
                ))}
              </div>

              {/* Narrative report */}
              {data.reportNarrative && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#00d4ff' }}>
                      Relatório Narrativo
                    </p>
                    <button
                      onClick={() => setShowFullReport(r => !r)}
                      className="text-[10px] font-semibold text-gray-400 hover:text-white transition-colors"
                    >
                      {showFullReport ? 'Recolher' : 'Ver relatório completo'}
                    </button>
                  </div>
                  <div
                    className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap overflow-hidden transition-all duration-300"
                    style={{ maxHeight: showFullReport ? '1000px' : '3.6rem' }}
                  >
                    {data.reportNarrative}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
