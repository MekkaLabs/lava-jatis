'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { DEMO_ATENDIMENTOS, DEMO_SERVICOS } from '@/lib/demo'

const IS_DEMO = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').includes('seu-projeto')
import {
  CheckCircle2, Zap, Trash2, Plus, Search, X, ChevronDown, Clock,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────
type AtendStatus = 'aguardando' | 'em_andamento' | 'concluido' | 'cancelado'

interface Atendimento {
  id: string
  cliente_nome: string
  servico_nome?: string
  servico_id?: string
  placa?: string
  modelo?: string
  cor?: string
  status: AtendStatus
  preco_final?: number
  observacao?: string
  created_at: string
}

interface Servico {
  id: string
  nome: string
  preco: number
}

interface ClienteSuggestion {
  id: string
  nome: string
  telefone: string
}

// ── Status config ────────────────────────────────────────────
const statusConfig: Record<AtendStatus, { label: string; color: string; bg: string }> = {
  aguardando:   { label: 'Aguardando',   color: '#ffd600', bg: 'rgba(255,214,0,0.12)' },
  em_andamento: { label: 'Em andamento', color: '#00d4ff', bg: 'rgba(0,212,255,0.12)' },
  concluido:    { label: 'Concluído',    color: '#00e676', bg: 'rgba(0,230,118,0.12)' },
  cancelado:    { label: 'Cancelado',    color: '#ff5252', bg: 'rgba(255,82,82,0.12)' },
}

function getWaitTime(createdAt: string) {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
  if (diff < 1) return 'agora'
  if (diff < 60) return `${diff} min`
  return `${Math.floor(diff / 60)}h${diff % 60 > 0 ? ` ${diff % 60}min` : ''}`
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

// ── Nova OS Modal ────────────────────────────────────────────
function NovaOSModal({
  onClose,
  onSave,
  servicos,
}: {
  onClose: () => void
  onSave: (payload: any) => Promise<void>
  servicos: Servico[]
}) {
  const [clienteQuery, setClienteQuery] = useState('')
  const [clienteSuggestions, setClienteSuggestions] = useState<ClienteSuggestion[]>([])
  const [selectedCliente, setSelectedCliente] = useState<ClienteSuggestion | null>(null)
  const [servicoId, setServicoId] = useState('')
  const [placa, setPlaca] = useState('')
  const [modelo, setModelo] = useState('')
  const [cor, setCor] = useState('')
  const [observacao, setObservacao] = useState('')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const searchClientes = useCallback(async (q: string) => {
    if (q.length < 2) { setClienteSuggestions([]); return }
    try {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}&limit=5`)
      const json = await res.json()
      setClienteSuggestions(json.data ?? [])
    } catch { setClienteSuggestions([]) }
  }, [])

  const handleClienteChange = (v: string) => {
    setClienteQuery(v)
    setSelectedCliente(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchClientes(v), 300)
  }

  const handleSubmit = async () => {
    if (!servicoId) { setErro('Selecione um serviço'); return }
    if (!clienteQuery && !selectedCliente) { setErro('Informe o nome do cliente'); return }
    setSaving(true)
    setErro('')
    try {
      await onSave({
        clienteId: selectedCliente?.id,
        clienteNome: selectedCliente?.nome ?? clienteQuery,
        servicoId,
        placa,
        modelo,
        cor,
        observacao,
      })
      onClose()
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: '#0d0f1a', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Nova Ordem de Serviço
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Cliente autocomplete */}
          <div className="relative">
            <label className="text-xs text-gray-400 font-medium block mb-1">Cliente</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={selectedCliente ? selectedCliente.nome : clienteQuery}
                onChange={e => handleClienteChange(e.target.value)}
                placeholder="Buscar ou digitar nome..."
                className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-cyan-400/50"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            {clienteSuggestions.length > 0 && !selectedCliente && (
              <div
                className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden"
                style={{ background: '#12152a', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {clienteSuggestions.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCliente(c); setClienteQuery(c.nome); setClienteSuggestions([]) }}
                    className="w-full px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
                  >
                    <p className="text-sm text-white font-medium">{c.nome}</p>
                    <p className="text-xs text-gray-500">{c.telefone}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Serviço */}
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1">Serviço</label>
            <div className="relative">
              <select
                value={servicoId}
                onChange={e => setServicoId(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-cyan-400/50 appearance-none"
                style={{ background: '#12152a', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <option value="">Selecionar serviço...</option>
                {servicos.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nome} — {formatCurrency(s.preco)}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Placa + Modelo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1">Placa</label>
              <input
                type="text"
                value={placa}
                onChange={e => setPlaca(e.target.value.toUpperCase())}
                placeholder="ABC-1234"
                maxLength={8}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-cyan-400/50 font-mono"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1">Modelo</label>
              <input
                type="text"
                value={modelo}
                onChange={e => setModelo(e.target.value)}
                placeholder="Honda Civic"
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-cyan-400/50"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>

          {/* Cor + Observacao */}
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1">Cor</label>
            <input
              type="text"
              value={cor}
              onChange={e => setCor(e.target.value)}
              placeholder="Prata, Preto, Branco..."
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-cyan-400/50"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1">Observação</label>
            <textarea
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Alguma observação..."
              rows={2}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-cyan-400/50 resize-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
        </div>

        {erro && <p className="text-red-400 text-xs mt-3">{erro}</p>}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}
          >
            {saving ? 'Salvando...' : 'Adicionar à Fila ✓'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function FilaPage() {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | AtendStatus>('all')
  const [showModal, setShowModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const supabase = createClient()

  const loadAtendimentos = useCallback(async () => {
    if (IS_DEMO) {
      setAtendimentos(DEMO_ATENDIMENTOS)
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/atendimentos')
      const json = await res.json()
      const raw = (json.data ?? []) as any[]
      setAtendimentos(raw.map(a => ({
        id: a.id,
        cliente_nome: a.clientes?.nome ?? a.cliente_nome ?? 'Cliente',
        servico_nome: a.servicos?.nome,
        servico_id: a.servico_id,
        placa: a.placa,
        modelo: a.modelo,
        cor: a.cor,
        status: a.status,
        preco_final: a.preco_final,
        observacao: a.observacao,
        created_at: a.created_at,
      })))
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  const loadServicos = useCallback(async () => {
    if (IS_DEMO) { setServicos(DEMO_SERVICOS); return }
    try {
      const supabaseClient = createClient()
      const { data } = await supabaseClient.from('servicos').select('id, nome, preco').order('nome')
      setServicos(data ?? [])
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    loadAtendimentos()
    loadServicos()

    if (IS_DEMO) return // no realtime in demo mode

    // Real-time subscription via Supabase channel
    const channel = supabase
      .channel('atendimentos-fila')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'atendimentos' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as any
            setAtendimentos(prev => {
              if (prev.find(a => a.id === newRow.id)) return prev
              return [{
                id: newRow.id,
                cliente_nome: newRow.cliente_nome ?? 'Cliente',
                placa: newRow.placa,
                modelo: newRow.modelo,
                cor: newRow.cor,
                status: newRow.status,
                preco_final: newRow.preco_final,
                created_at: newRow.created_at,
              }, ...prev]
            })
          } else if (payload.eventType === 'UPDATE') {
            const upd = payload.new as any
            setAtendimentos(prev =>
              prev.map(a => a.id === upd.id ? { ...a, status: upd.status, preco_final: upd.preco_final } : a)
            )
          } else if (payload.eventType === 'DELETE') {
            setAtendimentos(prev => prev.filter(a => a.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, loadAtendimentos, loadServicos])

  const advance = async (id: string, currentStatus: AtendStatus) => {
    if (actionLoading) return
    const nextStatus = currentStatus === 'aguardando' ? 'em_andamento' : 'concluido'
    setActionLoading(id)
    // Demo: update state only
    if (IS_DEMO) {
      await new Promise(r => setTimeout(r, 400))
      setAtendimentos(prev => prev.map(a => a.id === id ? { ...a, status: nextStatus as AtendStatus } : a))
      setActionLoading(null)
      return
    }
    try {
      const res = await fetch(`/api/atendimentos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (res.ok) {
        setAtendimentos(prev =>
          prev.map(a => a.id === id ? { ...a, status: nextStatus as AtendStatus } : a)
        )
      }
    } finally {
      setActionLoading(null)
    }
  }

  const cancel = async (id: string) => {
    if (actionLoading) return
    setActionLoading(id)
    if (IS_DEMO) {
      await new Promise(r => setTimeout(r, 300))
      setAtendimentos(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelado' as AtendStatus } : a))
      setActionLoading(null)
      return
    }
    try {
      const res = await fetch(`/api/atendimentos/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setAtendimentos(prev =>
          prev.map(a => a.id === id ? { ...a, status: 'cancelado' as AtendStatus } : a)
        )
      }
    } finally {
      setActionLoading(null)
    }
  }

  const createAtendimento = async (payload: any) => {
    if (IS_DEMO) {
      const newAt = {
        id: `demo-${Date.now()}`,
        cliente_nome: payload.clienteNome ?? 'Novo Cliente',
        servico_nome: DEMO_SERVICOS.find(s => s.id === payload.servicoId)?.nome ?? 'Serviço',
        servico_id: payload.servicoId,
        placa: payload.placa ?? '',
        modelo: payload.modelo ?? '',
        status: 'aguardando' as AtendStatus,
        preco_final: DEMO_SERVICOS.find(s => s.id === payload.servicoId)?.preco ?? 0,
        created_at: new Date().toISOString(),
      }
      setAtendimentos(prev => [newAt, ...prev])
      return newAt
    }
    const res = await fetch('/api/atendimentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const json = await res.json()
      throw new Error(json.error ?? 'Erro ao criar atendimento')
    }
    const json = await res.json()
    // Find servico name
    const servicoNome = servicos.find(s => s.id === payload.servicoId)?.nome
    setAtendimentos(prev => [{
      ...json.data,
      cliente_nome: payload.clienteNome ?? json.data.cliente_nome,
      servico_nome: servicoNome,
    }, ...prev])
  }

  const activeFilter = (s: AtendStatus | 'all') => {
    if (s === 'all') return atendimentos
    return atendimentos.filter(a => a.status === s)
  }

  const filtered = activeFilter(filter)
  const counts = {
    all: atendimentos.length,
    aguardando: atendimentos.filter(a => a.status === 'aguardando').length,
    em_andamento: atendimentos.filter(a => a.status === 'em_andamento').length,
    concluido: atendimentos.filter(a => a.status === 'concluido').length,
    cancelado: atendimentos.filter(a => a.status === 'cancelado').length,
  }

  const tabs: Array<{ key: 'all' | AtendStatus; label: string }> = [
    { key: 'all', label: 'Todos' },
    { key: 'em_andamento', label: 'Em andamento' },
    { key: 'aguardando', label: 'Aguardando' },
    { key: 'concluido', label: 'Concluídos' },
    { key: 'cancelado', label: 'Cancelados' },
  ]

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#08090f' }}>
      <Sidebar />
      <main className="flex-1 ml-[220px] flex flex-col overflow-hidden">
        <Header
          title="Fila ao Vivo"
          subtitle={`${counts.aguardando + counts.em_andamento} veículo${(counts.aguardando + counts.em_andamento) !== 1 ? 's' : ''} ativo${(counts.aguardando + counts.em_andamento) !== 1 ? 's' : ''}`}
          action={{ label: 'Nova OS', onClick: () => setShowModal(true) }}
        />

        <div className="flex-1 overflow-y-auto p-5">
          {/* Filter tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === tab.key
                    ? 'text-cyan-400 bg-cyan-400/10 border border-cyan-400/20'
                    : 'text-gray-400 hover:text-white border border-white/7 bg-white/3'
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-lg font-bold ${filter === tab.key ? 'bg-cyan-400/20 text-cyan-300' : 'bg-white/5 text-gray-500'}`}>
                  {counts[tab.key]}
                </span>
              </button>
            ))}

            {/* Live indicator */}
            <div className="ml-auto flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-green-400"
              style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.15)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Tempo real
            </div>
          </div>

          {/* Queue table */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {loading ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Carregando fila...</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Cliente / Veículo', 'Serviço', 'Chegou', 'Espera', 'Status', 'Valor', 'Ações'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, index) => {
                    const sc = statusConfig[item.status]
                    const isLoading = actionLoading === item.id
                    return (
                      <tr
                        key={item.id}
                        className="group transition-colors hover:bg-white/3"
                        style={{ borderBottom: index < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                      >
                        {/* Cliente */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
                              style={{ background: 'rgba(0,212,255,0.15)' }}
                            >
                              {getInitials(item.cliente_nome)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{item.cliente_nome}</p>
                              <p className="text-xs text-gray-500 font-mono">
                                {[item.placa, item.modelo, item.cor].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Serviço */}
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-300">{item.servico_nome ?? '—'}</p>
                        </td>

                        {/* Chegou */}
                        <td className="px-4 py-3">
                          <p className="text-sm font-mono text-gray-300">
                            {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>

                        {/* Espera */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-sm text-gray-400">
                            <Clock size={13} />
                            <span>{getWaitTime(item.created_at)}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ color: sc.color, background: sc.bg }}
                          >
                            {sc.label}
                          </span>
                        </td>

                        {/* Valor */}
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-green-400">
                            {item.preco_final ? formatCurrency(item.preco_final) : '—'}
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {(item.status === 'aguardando' || item.status === 'em_andamento') && (
                              <button
                                onClick={() => advance(item.id, item.status)}
                                disabled={isLoading}
                                title={item.status === 'aguardando' ? 'Iniciar' : 'Concluir'}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                                style={{ color: '#00d4ff', background: 'rgba(0,212,255,0.1)' }}
                              >
                                {isLoading ? (
                                  <div className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                ) : item.status === 'aguardando' ? (
                                  <Zap size={14} />
                                ) : (
                                  <CheckCircle2 size={14} />
                                )}
                              </button>
                            )}

                            {item.status !== 'cancelado' && item.status !== 'concluido' && (
                              <button
                                onClick={() => cancel(item.id)}
                                disabled={isLoading}
                                title="Cancelar"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                style={{ background: 'rgba(255,82,82,0.08)' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {!loading && filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">🚗</p>
                <p className="text-gray-400 font-medium">Nenhum atendimento encontrado</p>
                <p className="text-gray-600 text-sm mt-1">
                  {filter === 'all' ? 'Clique em "Nova OS" para adicionar' : `Sem itens com status "${statusConfig[filter as AtendStatus]?.label ?? filter}"`}
                </p>
              </div>
            )}
          </div>

          {/* Revenue summary */}
          {!loading && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Receita na Fila',
                  value: formatCurrency(atendimentos.filter(a => a.status !== 'cancelado').reduce((s, a) => s + (a.preco_final ?? 0), 0)),
                  color: 'text-green-400',
                },
                {
                  label: 'Já Realizada',
                  value: formatCurrency(atendimentos.filter(a => a.status === 'concluido').reduce((s, a) => s + (a.preco_final ?? 0), 0)),
                  color: 'text-cyan-400',
                },
                {
                  label: 'A Receber',
                  value: formatCurrency(atendimentos.filter(a => a.status === 'aguardando' || a.status === 'em_andamento').reduce((s, a) => s + (a.preco_final ?? 0), 0)),
                  color: 'text-yellow-400',
                },
              ].map(s => (
                <div
                  key={s.label}
                  className="rounded-xl p-4 text-center"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                  <p className={`text-xl font-bold ${s.color}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Nova OS Modal */}
      {showModal && (
        <NovaOSModal
          onClose={() => setShowModal(false)}
          onSave={createAtendimento}
          servicos={servicos}
        />
      )}

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 z-40"
        style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)', boxShadow: '0 0 30px rgba(0,212,255,0.4)' }}
        title="Nova OS"
      >
        <Plus size={22} className="text-black" />
      </button>
    </div>
  )
}
