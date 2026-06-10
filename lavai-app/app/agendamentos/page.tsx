'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase'
import { IS_DEMO, DEMO_CLIENTES, DEMO_SERVICOS, DEMO_AGENDAMENTOS } from '@/lib/demo'
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

// ── Demo helpers ──────────────────────────────────────────────
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

// Mapeia uma linha de `atendimentos` (com data_hora) para o tipo Agendamento da UI
function atendimentoToAgendamento(a: any): Agendamento {
  const dt = a.data_hora ? new Date(a.data_hora) : (a.created_at ? new Date(a.created_at) : new Date())
  const statusMap: Record<string, AgendStatus> = {
    aguardando: 'pendente',
    em_andamento: 'confirmado',
    concluido: 'concluido',
    cancelado: 'cancelado',
  }
  return {
    id: a.id,
    clienteNome: a.clientes?.nome ?? a.cliente_nome ?? 'Cliente',
    servico: a.servicos?.nome ?? a.servico_nome ?? '—',
    data: dt.toISOString().slice(0, 10),
    hora: `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`,
    duracao: 60,
    funcionario: a.funcionarios?.nome ?? a.funcionario ?? '',
    status: statusMap[a.status] ?? 'pendente',
    preco: Number(a.preco_final ?? 0),
  }
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
interface ClienteOpt { id: string; nome: string; telefone?: string | null; placa?: string | null; modelo_veiculo?: string | null; cor?: string | null }
interface ServicoOpt { id: string; nome: string; preco: number }
interface FuncOpt { id: string; nome: string }

// onSaved recebe um Agendamento no modo demo (append local); no modo real é chamado sem args
// e a página refaz o fetch da semana.
interface NovoModalProps { onClose: () => void; onSaved: (a?: Agendamento) => void; weekStart: Date }

function NovoAgendamentoModal({ onClose, onSaved }: NovoModalProps) {
  const [servicos, setServicos] = useState<ServicoOpt[]>([])
  const [clientes, setClientes] = useState<ClienteOpt[]>([])
  const [funcs, setFuncs] = useState<FuncOpt[]>([])

  const [clienteQuery, setClienteQuery] = useState('')
  const [clienteSel, setClienteSel] = useState<ClienteOpt | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [servicoId, setServicoId] = useState('')
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [hora, setHora] = useState('09:00')
  const [funcionario, setFuncionario] = useState('')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  // Carrega serviços/clientes/funcionários reais (ou demo)
  useEffect(() => {
    if (IS_DEMO) {
      setServicos(DEMO_SERVICOS as ServicoOpt[])
      setClientes(DEMO_CLIENTES as ClienteOpt[])
      setFuncs(FUNCS.map((n, i) => ({ id: `f-${i}`, nome: n })))
      return
    }
    const supabase = createClient()
    Promise.all([
      supabase.from('servicos').select('id, nome, preco').eq('ativo', true).order('nome'),
      supabase.from('clientes').select('id, nome, telefone, placa, modelo_veiculo, cor').order('nome'),
      supabase.from('funcionarios').select('id, nome').order('nome'),
    ]).then(([s, c, f]) => {
      setServicos((s.data as ServicoOpt[]) ?? [])
      setClientes((c.data as ClienteOpt[]) ?? [])
      setFuncs((f.data as FuncOpt[]) ?? [])
    })
  }, [])

  const sugestoes = useMemo(() => {
    const q = clienteQuery.trim().toLowerCase()
    if (!q) return clientes.slice(0, 6)
    return clientes
      .filter(c => c.nome.toLowerCase().includes(q) || (c.telefone ?? '').toLowerCase().includes(q) || (c.placa ?? '').toLowerCase().includes(q))
      .slice(0, 6)
  }, [clienteQuery, clientes])

  function escolherCliente(c: ClienteOpt) {
    setClienteSel(c)
    setClienteQuery(c.nome)
    setShowResults(false)
  }
  function onClienteChange(v: string) {
    setClienteQuery(v)
    if (clienteSel && v !== clienteSel.nome) setClienteSel(null)
    setShowResults(true)
  }

  const nomeFinal = clienteSel?.nome ?? clienteQuery.trim()
  const canSubmit = nomeFinal.length >= 2 && !!servicoId && !!data && !!hora

  async function handleSave() {
    if (!canSubmit || saving) return
    setSaving(true); setErro('')
    const servicoSel = servicos.find(s => s.id === servicoId)
    try {
      if (IS_DEMO) {
        await new Promise(r => setTimeout(r, 400))
        onSaved({
          id: `ag-${Date.now()}`,
          clienteNome: nomeFinal,
          servico: servicoSel?.nome ?? 'Serviço',
          data, hora, duracao: 60, funcionario,
          status: 'pendente',
          preco: Number(servicoSel?.preco ?? 0),
        })
        onClose()
        return
      }
      const res = await fetch('/api/atendimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: clienteSel?.id,
          clienteNome: nomeFinal,
          servicoId,
          placa: clienteSel?.placa || undefined,
          modelo: clienteSel?.modelo_veiculo || undefined,
          cor: clienteSel?.cor || undefined,
          funcionario: funcionario || undefined,
          // datetime local (sem Z) → servidor converte pra ISO mantendo o horário de parede
          dataHora: `${data}T${hora}:00`,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Erro ao agendar')
      }
      onSaved()
      onClose()
    } catch (e: any) {
      setErro(e.message || 'Erro ao agendar')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} onClick={saving ? undefined : onClose}>
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
              <input type="text" value={clienteQuery}
                onChange={e => onClienteChange(e.target.value)}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 180)}
                placeholder="Buscar por nome, telefone ou placa..." className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            {showResults && sugestoes.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-xl overflow-hidden max-h-60 overflow-y-auto"
                style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)' }}>
                {sugestoes.map(c => (
                  <button key={c.id} type="button" onClick={() => escolherCliente(c)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${getAvatarColor(c.nome)}`}>
                      {getInitials(c.nome)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{c.nome}</p>
                      <p className="text-xs text-gray-500 truncate">{c.placa ?? '—'} {c.telefone ? `· ${c.telefone}` : ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {clienteQuery.length >= 2 && (
              <p className="text-[11px] mt-1" style={{ color: clienteSel ? '#00d4ff' : '#ffd600' }}>
                {clienteSel ? 'Cliente existente selecionado' : 'Cliente novo — agendamento registrado com este nome'}
              </p>
            )}
          </div>

          {/* Serviço */}
          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">Serviço <span className="text-red-400">*</span></label>
            <select value={servicoId} onChange={e => setServicoId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
              style={{ background: 'rgba(30,30,50,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <option value="">Selecione o serviço</option>
              {servicos.map(s => <option key={s.id} value={s.id}>{s.nome} — R$ {Number(s.preco).toFixed(0)}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">Data <span className="text-red-400">*</span></label>
              <input type="date" value={data} onChange={e => setData(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(30,30,50,0.9)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">Hora <span className="text-red-400">*</span></label>
              <select value={hora} onChange={e => setHora(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(30,30,50,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">Funcionário</label>
            <select value={funcionario} onChange={e => setFuncionario(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
              style={{ background: 'rgba(30,30,50,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <option value="">Sem funcionário definido</option>
              {funcs.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
            </select>
          </div>

          {erro && <p className="text-sm text-red-400">{erro}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}>Cancelar</button>
          <button onClick={handleSave} disabled={!canSubmit || saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
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
  const [extraAgds, setExtraAgds] = useState<Agendamento[]>([])   // só demo (append local)
  const [realAgds, setRealAgds] = useState<Agendamento[]>([])      // banco real (semana visível)
  const [loadingAgds, setLoadingAgds] = useState(!IS_DEMO)

  // Mobile: a grade semanal de 7 colunas é ilegível em 375px → default lista.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setViewMode('list')
    }
  }, [])

  const weekEndExclusive = useMemo(() => {
    const d = new Date(weekStart); d.setDate(d.getDate() + 7); return d
  }, [weekStart])

  // #53: busca atendimentos com data_hora na semana visível (banco real)
  const fetchWeek = useCallback(async () => {
    if (IS_DEMO) return
    setLoadingAgds(true)
    try {
      const from = weekStart.toISOString()
      const to = weekEndExclusive.toISOString()
      const res = await fetch(`/api/atendimentos?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setRealAgds((json.data ?? []).map(atendimentoToAgendamento))
    } catch (e) {
      console.error('Falha ao carregar agendamentos:', e)
      setRealAgds([])
    } finally {
      setLoadingAgds(false)
    }
  }, [weekStart, weekEndExclusive])

  useEffect(() => { fetchWeek() }, [fetchWeek])

  // Demo: DEMO_AGENDAMENTOS + novos locais. Real: dados do banco da semana.
  const demoAgds = useMemo(
    () => IS_DEMO ? demoToAgendamentos() : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekStart.toISOString()]
  )
  const agendamentos = IS_DEMO
    ? [...demoAgds, ...extraAgds.filter(a => {
        const d = new Date(a.data)
        return d >= weekStart && d < weekEndExclusive
      })]
    : realAgds

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
          subtitle={loadingAgds ? 'Carregando agendamentos...' : `${totalWeek} agendamentos esta semana`}
        />

        <main className="flex-1 p-4 lg:p-6 space-y-5">
          {/* Stats + Controls */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
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
              <span className="text-sm font-semibold text-white whitespace-nowrap">{weekLabel}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
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
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 lg:bottom-8 lg:right-8 z-40 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
        <Plus size={24} color="#000" strokeWidth={2.5} />
      </button>

      {showModal && (
        <NovoAgendamentoModal
          weekStart={weekStart}
          onClose={() => setShowModal(false)}
          onSaved={a => {
            if (a) setExtraAgds(prev => [...prev, a])  // demo: append local
            else fetchWeek()                           // real: refaz o fetch da semana
          }}
        />
      )}
    </div>
  )
}
