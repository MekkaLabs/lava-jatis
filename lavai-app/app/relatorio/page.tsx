'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  ToggleLeft,
  ToggleRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface KPIData {
  receita: number
  receitaAnterior: number
  atendimentos: number
  atendimentosAnterior: number
  ticketMedio: number
  novosClientes: number
}

interface WeekInfo {
  year: number
  week: number
  label: string        // "Semana 20 • 12/05 – 18/05"
  semanaParam: string  // "2026-20"
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function weekBounds(year: number, week: number): { start: Date; end: Date } {
  const jan4 = new Date(year, 0, 4)
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (week - 1) * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { start: monday, end: sunday }
}

function formatDateBR(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function buildWeekInfo(year: number, week: number): WeekInfo {
  const { start, end } = weekBounds(year, week)
  return {
    year,
    week,
    label: `Semana ${week} • ${formatDateBR(start)} – ${formatDateBR(end)}/${end.getFullYear()}`,
    semanaParam: `${year}-${week}`,
  }
}

function currentWeekInfo(): WeekInfo {
  const now = new Date()
  return buildWeekInfo(now.getFullYear(), getISOWeek(now))
}

function prevWeek(wi: WeekInfo): WeekInfo {
  if (wi.week <= 1) return buildWeekInfo(wi.year - 1, 52)
  return buildWeekInfo(wi.year, wi.week - 1)
}

function nextWeek(wi: WeekInfo): WeekInfo {
  if (wi.week >= 52) return buildWeekInfo(wi.year + 1, 1)
  return buildWeekInfo(wi.year, wi.week + 1)
}

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function pctChange(cur: number, prev: number): { value: string; up: boolean } {
  if (prev === 0) return { value: '+100%', up: true }
  const pct = ((cur - prev) / prev) * 100
  return { value: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, up: pct >= 0 }
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({
  label,
  value,
  previous,
  icon: Icon,
  currency = false,
  color = 'cyan',
}: {
  label: string
  value: number
  previous?: number
  icon: any
  currency?: boolean
  color?: string
}) {
  const change = previous !== undefined ? pctChange(value, previous) : null
  const colors: Record<string, string> = {
    cyan: 'border-[#00d4ff]',
    green: 'border-[#00e676]',
    purple: 'border-purple-500',
    amber: 'border-amber-400',
  }
  const iconColors: Record<string, string> = {
    cyan: 'text-[#00d4ff]',
    green: 'text-[#00e676]',
    purple: 'text-purple-400',
    amber: 'text-amber-400',
  }

  return (
    <div
      className={`bg-[#12132a] border border-[#1e2040] border-l-2 ${colors[color]} rounded-xl p-5`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        <Icon className={`w-4 h-4 ${iconColors[color]}`} />
      </div>
      <p className="text-2xl font-bold text-white">
        {currency ? formatBRL(value) : value}
      </p>
      {change && (
        <div className="flex items-center gap-1 mt-2">
          {change.up ? (
            <TrendingUp className="w-3 h-3 text-[#00e676]" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-400" />
          )}
          <span
            className={`text-xs font-semibold ${change.up ? 'text-[#00e676]' : 'text-red-400'}`}
          >
            {change.value}
          </span>
          <span className="text-xs text-gray-500">vs semana anterior</span>
        </div>
      )}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({
  message,
  type,
  onDismiss,
}: {
  message: string
  type: 'success' | 'error'
  onDismiss: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border
        ${type === 'success'
          ? 'bg-[#0a1f14] border-[#00e676] text-[#00e676]'
          : 'bg-[#1f0a0a] border-red-500 text-red-400'}`}
    >
      {type === 'success' ? (
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
      )}
      <span className="text-sm font-medium">{message}</span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RelatorioPage() {
  const [selectedWeek, setSelectedWeek] = useState<WeekInfo>(currentWeekInfo)
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [loadingKpis, setLoadingKpis] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [emailAtivo, setEmailAtivo] = useState(true)
  const [loadingToggle, setLoadingToggle] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [history, setHistory] = useState<WeekInfo[]>([])

  const showToast = (message: string, type: 'success' | 'error') =>
    setToast({ message, type })

  // Build last 4 weeks history
  useEffect(() => {
    const now = currentWeekInfo()
    const h: WeekInfo[] = []
    let w = now
    for (let i = 0; i < 4; i++) {
      h.push(w)
      w = prevWeek(w)
    }
    setHistory(h)
  }, [])

  // Fetch preview KPIs (using the same PDF endpoint but HEAD-like approach)
  // Since the PDF endpoint returns binary, we fetch a summary from dashboard API
  const fetchKpis = useCallback(async () => {
    setLoadingKpis(true)
    setKpis(null)
    try {
      const res = await fetch(
        `/api/relatorio/preview?semana=${selectedWeek.semanaParam}`
      )
      if (res.ok) {
        const json = await res.json()
        setKpis(json.kpis)
      }
    } catch {
      // silently ignore — preview is optional
    } finally {
      setLoadingKpis(false)
    }
  }, [selectedWeek.semanaParam])

  useEffect(() => {
    fetchKpis()
  }, [fetchKpis])

  // Fetch email preference
  useEffect(() => {
    fetch('/api/relatorio/config')
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.relatorio_email_ativo === 'boolean') {
          setEmailAtivo(d.relatorio_email_ativo)
        }
      })
      .catch(() => {})
  }, [])

  async function handleDownloadPdf() {
    setLoadingPdf(true)
    try {
      const res = await fetch(`/api/relatorio/pdf?semana=${selectedWeek.semanaParam}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        showToast(err.error || 'Erro ao gerar PDF', 'error')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lavai-relatorio-${selectedWeek.semanaParam}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showToast('Erro ao baixar PDF', 'error')
    } finally {
      setLoadingPdf(false)
    }
  }

  async function handleSendEmail() {
    setLoadingEmail(true)
    try {
      const res = await fetch('/api/relatorio/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semana: selectedWeek.semanaParam }),
      })
      const json = await res.json()
      if (res.ok) {
        showToast(json.message || 'Relatório enviado!', 'success')
      } else {
        showToast(json.error || 'Erro ao enviar email', 'error')
      }
    } catch {
      showToast('Erro ao enviar email', 'error')
    } finally {
      setLoadingEmail(false)
    }
  }

  async function handleToggleEmail() {
    setLoadingToggle(true)
    const novoValor = !emailAtivo
    try {
      const res = await fetch('/api/relatorio/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relatorio_email_ativo: novoValor }),
      })
      if (res.ok) {
        setEmailAtivo(novoValor)
        showToast(
          novoValor
            ? 'Relatório automático ativado'
            : 'Relatório automático desativado',
          'success'
        )
      } else {
        showToast('Erro ao atualizar preferência', 'error')
      }
    } catch {
      showToast('Erro ao atualizar preferência', 'error')
    } finally {
      setLoadingToggle(false)
    }
  }

  const currentIso = currentWeekInfo()
  const isCurrentWeek =
    selectedWeek.year === currentIso.year && selectedWeek.week === currentIso.week

  return (
    <div className="min-h-screen bg-[#08090f] text-white">
      {/* Page Header */}
      <div className="border-b border-[#1e2040] bg-[#0d0e1a]">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-white">Relatório Semanal</h1>
          <p className="text-sm text-gray-400 mt-1">
            Análise completa de desempenho do seu lava-jato
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* ── Week Selector ── */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedWeek(prevWeek(selectedWeek))}
            className="p-2 rounded-lg bg-[#12132a] border border-[#1e2040] hover:border-[#00d4ff] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>

          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4 text-[#00d4ff]" />
              <span className="font-semibold text-white">{selectedWeek.label}</span>
              {isCurrentWeek && (
                <span className="text-xs bg-[#00d4ff]/10 text-[#00d4ff] px-2 py-0.5 rounded-full border border-[#00d4ff]/20">
                  Semana atual
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setSelectedWeek(nextWeek(selectedWeek))}
            disabled={isCurrentWeek}
            className="p-2 rounded-lg bg-[#12132a] border border-[#1e2040] hover:border-[#00d4ff] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* ── KPI Preview ── */}
        {loadingKpis ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-[#12132a] border border-[#1e2040] rounded-xl p-5 h-28 animate-pulse"
              />
            ))}
          </div>
        ) : kpis ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              label="Receita Total"
              value={kpis.receita}
              previous={kpis.receitaAnterior}
              icon={DollarSign}
              currency
              color="green"
            />
            <KPICard
              label="Atendimentos"
              value={kpis.atendimentos}
              previous={kpis.atendimentosAnterior}
              icon={Activity}
              color="cyan"
            />
            <KPICard
              label="Ticket Médio"
              value={kpis.ticketMedio}
              icon={TrendingUp}
              currency
              color="purple"
            />
            <KPICard
              label="Novos Clientes"
              value={kpis.novosClientes}
              icon={Users}
              color="amber"
            />
          </div>
        ) : (
          <div className="bg-[#12132a] border border-[#1e2040] rounded-xl p-8 text-center">
            <p className="text-gray-500 text-sm">
              Nenhum dado disponível para este período.
            </p>
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleDownloadPdf}
            disabled={loadingPdf}
            className="flex-1 flex items-center justify-center gap-3 bg-[#00d4ff] text-[#08090f] font-bold py-4 px-6 rounded-xl hover:bg-[#00bce8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loadingPdf ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {loadingPdf ? 'Gerando PDF...' : 'Baixar PDF'}
          </button>

          <button
            onClick={handleSendEmail}
            disabled={loadingEmail}
            className="flex-1 flex items-center justify-center gap-3 bg-[#12132a] border border-[#1e2040] text-white font-semibold py-4 px-6 rounded-xl hover:border-[#00d4ff] hover:text-[#00d4ff] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loadingEmail ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Mail className="w-5 h-5" />
            )}
            {loadingEmail ? 'Enviando...' : 'Enviar por Email'}
          </button>
        </div>

        {/* ── Schedule Section ── */}
        <div className="bg-[#12132a] border border-[#1e2040] rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-[#00d4ff]/10 rounded-lg">
                <Clock className="w-5 h-5 text-[#00d4ff]" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Relatório Automático</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Receba o relatório toda segunda-feira às 8h no seu email
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleEmail}
              disabled={loadingToggle}
              className="flex items-center gap-2 transition-opacity disabled:opacity-50"
            >
              {loadingToggle ? (
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              ) : emailAtivo ? (
                <ToggleRight className="w-10 h-10 text-[#00e676]" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-gray-500" />
              )}
            </button>
          </div>

          <div
            className={`mt-4 text-xs px-3 py-2 rounded-lg inline-flex items-center gap-2
              ${emailAtivo
                ? 'bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/20'
                : 'bg-gray-800 text-gray-500 border border-gray-700'}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${emailAtivo ? 'bg-[#00e676]' : 'bg-gray-600'}`}
            />
            {emailAtivo ? 'Ativo — toda segunda às 8h' : 'Desativado'}
          </div>
        </div>

        {/* ── History ── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Histórico — Últimas 4 Semanas
          </h2>
          <div className="space-y-3">
            {history.map((w) => (
              <div
                key={w.semanaParam}
                className="flex items-center justify-between bg-[#12132a] border border-[#1e2040] rounded-xl px-5 py-4 hover:border-[#00d4ff]/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-white">{w.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{w.semanaParam}</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    setLoadingPdf(true)
                    try {
                      const res = await fetch(
                        `/api/relatorio/pdf?semana=${w.semanaParam}`
                      )
                      if (!res.ok) {
                        showToast('Erro ao gerar PDF', 'error')
                        return
                      }
                      const blob = await res.blob()
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `lavai-relatorio-${w.semanaParam}.pdf`
                      a.click()
                      URL.revokeObjectURL(url)
                    } catch {
                      showToast('Erro ao baixar PDF', 'error')
                    } finally {
                      setLoadingPdf(false)
                    }
                  }}
                  className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#00d4ff] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#00d4ff]/10"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar PDF
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  )
}
