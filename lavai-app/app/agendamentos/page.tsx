'use client'

import { useState, useMemo } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { IS_DEMO, DEMO_CLIENTES, DEMO_AGENDAMENTOS } from '@/lib/demo'
import { getInitials, getAvatarColor, formatCurrency } from '@/lib/utils'
import {
  ChevronLeft, ChevronRight, Plus, X, Clock, User, Car, Check,
  Calendar, LayoutGrid, List, Search,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────
type AgendStatus = 'confirmado' | 'pendente' | 'cancelado' | 'concluido'

interface Agendamento {
  id: string
  clienteNome: string
  servico: string
  data: string // YYYY-MM-DD
  hora: string // HH:MM
  duracao: number // minutes
  funcionario: string
  status: AgendStatus
  preco: number
}

// ── Mock agendamentos ─────────────────────────────────────────
const SERVICES = ['Lavagem Simples', 'Lavagem Completa', 'Polimento', 'Higienização Interna', 'Lavagem + Cera', 'Cristalização']
const FUNCS = ['Carlos', 'Pedro', 'Ana', 'Marcos']

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Converte DEMO_AGENDAMENTOS (de lib/demo.ts) para o tipo local Agendamento
function demoToAgendamentos(): Agendamento[] {
  return DEMO_AGENDAMENTOS.map(a => {
    const dt = new Date(a.data_hora)
    return {
      id: a.id,
      clienteNome: a.cliente_nome,
      servico: a.servico_nome,
      data: dt.toISOString().slice(0, 10),
      hora: `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`,
      duracao: 60,
      funcionario: FUNCS[DEMO_CLIENTES.findIndex(c => c.nome === a.cliente_nome) % FUNCS.length] ?? FUNCS[0],
      status: 'confirmado' as AgendStatus,
      preco: a.preco_final,
    }
  })
}

// Para modo com banco real: gera agendamentos aleatórios com dados locais (placeholder até integração real)
function genMockAgendamentos(weekStart: Date): Agendamento[] {
  const agds: Agendamento[] = []
  const hours = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00']
  const statuses: AgendStatus[] = ['confirmado', 'confirmado', 'confirmado', 'pendente', 'concluido']
  // Usar DEMO_CLIENTES como base de nomes (seed determinística por nome)
  const clienteNames = DEMO_CLIENTES.map(c => c.nome)

  for (let day = 0; day < 7; day++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + day)
    const dateStr = d.toISOString().slice(0, 10)
    // Seed determinística baseada no dia para evitar valores aleatórios a cada render
    const seed = d.getDate() + d.getMonth() * 31
    const slotCount = day < 5 ? (seed % 3) + 3 : (seed % 2) + 1
    const usedHourIdxs = new Set<number>()

    for (let s = 0; s < slotCount; s++) {
      const hourIdx = (seed * (s + 1)) % hours.length
      if (usedHourIdxs.has(hourIdx)) continue
      usedHourIdxs.add(hourIdx)
      const hora = hours[hourIdx]
      const clienteIdx = (seed + s) % clienteNames.length
      agds.push({
        id: `ag-${dateStr}-${hora}`,
        clienteNome: clienteNames[clienteIdx],
        servico: SERVICES[(seed + s) % SERVICES.length],
        data: dateStr,
        hora,
        duracao: [30, 60, 90, 120][(seed + s) % 4],
        funcionario: FUNCS[(seed + s) % FUNCS.length],
        status: statuses[(seed + s) % statuses.length],
        preco: [60, 90, 120, 180, 250, 350][(seed + s) % 6],
      })
    }
  }
  return agds
}

// ── Status config ──────────────────────────────────────────────
const statusConfig: Record<AgendStatus, { label: string; color: string; bg: string; border: string }> = {
  confirmado: { label: 'Confirmado', color: '#00d4ff', bg: 'rgba(0,212,255,0.12)', border: 'rgba(0,212,255,0.25)' },
  pendente:   { label: 'Pendente',   color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)' },
  cancelado:  { label: 'Cancelado',  color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)' },
  concluido:  { label: 'Concluído',  color: '#00e676', bg: 'rgba(0,230,118,0.12)', border: 'rgba(0,230,118,0.25)' },
}

const HOURS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30',
               '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30']
const WEEK_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

// ── Novo Agendamento Modal ─────────────────────────────────────
interface NovoModalProps { onClose: () => void; onSave: (a: Agendamento) => void; weekStart: Date }

function NovoAgendamentoModal({ onClose, onSave, weekStart }: NovoModalProps) {
  const [form, setForm] = useState({
    clienteSearch: '', clienteNome: '', servico: SERVICES[0],
    data: new Date().toISOString().slice(0, 10),
    hora: '09:00', funcionario: FUNCS[0],
  })
  const [saving, setSaving] = useState(false)
  const [clientResults, setClientResults] = useState<typeof DEMO_CLIENTES>([])
  const [showResults, setShowResults] = useState(false)

  function searchClientes(q: string) {
    setForm(f => ({ ...f, clienteSearch: q, clienteNome: q }))
    if (q.length > 1) {
      setClientResults(DEMO_CLIENTES.filter(c => c.nome.toLowerCase().includes(q.toLowerCase())).slice(0, 5))
      setShowResults(true)
    } else {
      setShowResults(false)
    }
  }

  async function handleSave() {
    if (!form.clienteNome || !form.data || !form.hora) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    onSave({
      id: `ag-${Date.now()}`,
      clienteNome: form.clienteNome,
      servico: form.servico,
      data: form.data,
      hora: form.hora,
      duracao: 60,
      funcionario: form.funcionario,
      status: 'pendente',
      preco: 90,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-md"
        style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.12)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Novo Agendamento</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"><X size={16} /></button>
        </div>

        <div className="space-y-4">
          {/* Cliente search */}
          <div className="relative">
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">
              Cliente <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" value={form.clienteSearch} onChange={e => searchClientes(e.target.value)}
                placeholder="Buscar cliente..." className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            {showResults && clientResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-xl overflow-hidden"
                style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)' }}>
                {clientResults.map(c => (
                  <button key={c.id} onClick={() => { setForm(f => ({ ...f, clienteSearch: c.nome, clienteNome: c.nome })); setShowResults(false) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${getAvatarColor(c.nome)}`}>
                      {getInitials(c.nome)}
                    </div>
                    <div>
                      <p className="text-sm text-white">{c.nome}</p>
                      <p className="text-xs text-gray-500">{c.telefone ?? ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Serviço */}
          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">Serviço</label>
            <select value={form.servico} onChange={e => setForm(f => ({ ...f, servico: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
              style={{ background: 'rgba(30,30,50,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">Data</label>
              <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(30,30,50,0.9)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">Hora</label>
              <select value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(30,30,50,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">Funcionário</label>
            <select value={form.funcionario} onChange={e => setForm(f => ({ ...f, funcionario: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
              style={{ background: 'rgba(30,30,50,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {FUNCS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
            {saving ? 'Salvando...' : 'Agendar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Agendamento Card ──────────────────────────────────────────
function AgCard({ ag }: { ag: Agendamento }) {
  const cfg = statusConfig[ag.status]
  return (
    <div className="absolute left-0.5 right-0.5 rounded-lg px-2 py-1 overflow-hidden text-xs group"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, minHeight: '44px' }}>
      <p className="font-semibold leading-tight truncate" style={{ color: cfg.color }}>{ag.clienteNome}</p>
      <p className="text-gray-400 truncate leading-tight">{ag.servico}</p>
    </div>
  )
}

// ── Week Calendar ─────────────────────────────────────────────
function WeekCalendar({ weekStart, agendamentos, today }: { weekStart: Date; agendamentos: Agendamento[]; today: Date }) {
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
  const todayStr = today.toISOString().slice(0, 10)

  const SLOT_H = 52 // px per 30min slot

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Header row */}
      <div className="grid" style={{ gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-2 py-3" />
        {weekDays.map((d, i) => {
          const ds = d.toISOString().slice(0, 10)
          const isToday = ds === todayStr
          return (
            <div key={i} className="px-2 py-3 text-center">
              <p className="text-xs text-gray-500 mb-1">{WEEK_DAYS[i]}</p>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-sm font-bold transition-all ${isToday ? 'text-black' : 'text-white'}`}
                style={isToday ? { background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' } : {}}>
                {d.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1" style={{ maxHeight: '520px' }}>
        <div className="grid" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
          {/* Time labels */}
          <div>
            {HOURS.map(h => (
              <div key={h} className="flex items-start justify-end pr-2 text-right"
                style={{ height: SLOT_H, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <span className="text-xs text-gray-600 mt-1">{h}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((d, di) => {
            const ds = d.toISOString().slice(0, 10)
            const dayAgs = agendamentos.filter(a => a.data === ds)
            const isToday = ds === todayStr

            return (
              <div key={di} className="relative"
                style={{ borderLeft: '1px solid rgba(255,255,255,0.04)', background: isToday ? 'rgba(0,212,255,0.02)' : 'transparent' }}>
                {HOURS.map(h => (
                  <div key={h} style={{ height: SLOT_H, borderBottom: '1px solid rgba(255,255,255,0.03)' }} />
                ))}
                {/* Agendamento cards */}
                {dayAgs.map(ag => {
                  const slotIdx = HOURS.indexOf(ag.hora)
                  if (slotIdx === -1) return null
                  const slots = Math.max(1, Math.ceil(ag.duracao / 30))
                  return (
                    <div key={ag.id}
                      style={{ position: 'absolute', top: slotIdx * SLOT_H + 2, left: 2, right: 2, height: slots * SLOT_H - 4 }}>
                      <AgCard ag={ag} />
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── List View ──────────────────────────────────────────────────
function ListView({ agendamentos, weekStart }: { agendamentos: Agendamento[]; weekStart: Date }) {
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  return (
    <div className="space-y-4">
      {weekDays.map((d, di) => {
        const ds = d.toISOString().slice(0, 10)
        const dayAgs = agendamentos.filter(a => a.data === ds).sort((a, b) => a.hora.localeCompare(b.hora))
        if (!dayAgs.length) return null

        return (
          <div key={di} className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="px-5 py-3 flex items-center gap-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-sm font-bold text-white">{d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
              <span className="text-xs text-gray-500">{dayAgs.length} agendamento{dayAgs.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {dayAgs.map(ag => {
                const cfg = statusConfig[ag.status]
                return (
                  <div key={ag.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex items-center gap-2 w-16 flex-shrink-0">
                      <Clock size={13} className="text-gray-500" />
                      <span className="text-sm font-semibold text-white">{ag.hora}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${getAvatarColor(ag.clienteNome)}`}>
                        {getInitials(ag.clienteNome)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{ag.clienteNome}</p>
                        <p className="text-xs text-gray-500">{ag.servico} · {ag.funcionario}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-green-400">{formatCurrency(ag.preco)}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {cfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function AgendamentosPage() {
  const today = new Date()
  const [weekStart, setWeekStart] = useState<Date>(getWeekStart(today))
  const [viewMode, setViewMode] = useState<'week' | 'list'>('week')
  const [showModal, setShowModal] = useState(false)
  const [extraAgds, setExtraAgds] = useState<Agendamento[]>([])

  // Em demo mode usa DEMO_AGENDAMENTOS centralizados; fora do demo usa gerador com seed determinística
  const baseAgds = useMemo(
    () => IS_DEMO ? demoToAgendamentos() : genMockAgendamentos(weekStart),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekStart.toISOString()]
  )
  const agendamentos = [...baseAgds, ...extraAgds.filter(a => {
    const d = new Date(a.data)
    return d >= weekStart && d < new Date(weekStart.getTime() + 7 * 86400000)
  })]

  function prevWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
  }
  function nextWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
  }
  function goToday() { setWeekStart(getWeekStart(today)) }

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekLabel = `${weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`

  const totalWeek = agendamentos.length
  const confirmados = agendamentos.filter(a => a.status === 'confirmado').length
  const pendentes = agendamentos.filter(a => a.status === 'pendente').length

  return (
    <div className="flex min-h-screen" style={{ background: '#08090f' }}>
      <Sidebar />
      <div className="flex-1 lg:ml-[240px] flex flex-col min-h-screen">
        <Header
          title="Agendamentos"
          subtitle={`${totalWeek} agendamentos esta semana`}
        />

        <main className="flex-1 p-6 space-y-5">
          {/* Stats + Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Week nav */}
              <div className="flex items-center gap-2 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <ChevronLeft size={15} />
                </button>
                <button onClick={goToday} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white transition-colors">
                  Hoje
                </button>
                <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <ChevronRight size={15} />
                </button>
              </div>
              <span className="text-sm font-semibold text-white">{weekLabel}</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Stats badges */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)' }}>
                  <Check size={11} className="text-cyan-400" />
                  <span className="text-cyan-400 font-semibold">{confirmados} confirmados</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
                  <Clock size={11} className="text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">{pendentes} pendentes</span>
                </div>
              </div>

              {/* View toggle */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={() => setViewMode('week')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'week' ? 'text-black' : 'text-gray-400 hover:text-white'}`}
                  style={viewMode === 'week' ? { background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' } : {}}>
                  <LayoutGrid size={14} />
                </button>
                <button onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'text-black' : 'text-gray-400 hover:text-white'}`}
                  style={viewMode === 'list' ? { background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' } : {}}>
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar / List */}
          {viewMode === 'week'
            ? <WeekCalendar weekStart={weekStart} agendamentos={agendamentos} today={today} />
            : <ListView agendamentos={agendamentos} weekStart={weekStart} />}
        </main>
      </div>

      {/* FAB */}
      <button onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-8 z-40 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
        <Plus size={24} color="#000" strokeWidth={2.5} />
      </button>

      {showModal && (
        <NovoAgendamentoModal
          weekStart={weekStart}
          onClose={() => setShowModal(false)}
          onSave={a => { setExtraAgds(prev => [...prev, a]); setShowModal(false) }}
        />
      )}
    </div>
  )
}
