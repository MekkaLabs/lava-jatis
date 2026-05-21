'use client'

import { useState, useEffect, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import FidelidadeBadge from '@/components/FidelidadeBadge'
import {
  Star, Users, Gift, Settings2, Plus, Search, Download, Edit2,
  Trash2, ChevronDown, ChevronUp, Award, TrendingUp, Zap,
  CheckCircle, XCircle, Clock, ToggleLeft, ToggleRight, Save,
  RefreshCw, Medal, Coins, ShoppingBag,
} from 'lucide-react'
import { NIVEL_COLORS, NIVEL_LABELS, NIVEL_EMOJIS, TIPO_LABELS, DEFAULT_CONFIG } from '@/lib/fidelidade'
import type { FidelidadeConfig } from '@/lib/fidelidade'
import { IS_DEMO, DEMO_CLIENTES } from '@/lib/demo'

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_PONTOS_CLIENTES = DEMO_CLIENTES.map(c => ({
  id: `pc-${c.id}`,
  pontos_total: c.pontos + Math.floor(c.pontos * 0.2),
  pontos_disponiveis: c.pontos,
  nivel: c.nivel,
  total_gasto: c.total_gasto,
  total_atendimentos: c.total_atendimentos,
  ultima_visita: c.ultima_visita,
  clientes: { id: c.id, nome: c.nome, telefone: c.telefone, email: c.email },
}))

const DEMO_RECOMPENSAS = [
  { id: 'r1', nome: 'Lavagem Grátis', descricao: 'Uma lavagem simples gratuita', pontos_necessarios: 100, tipo: 'servico_gratis', valor_desconto: null, ativo: true, estoque: null },
  { id: 'r2', nome: 'Desconto 20%', descricao: 'Desconto de 20% em qualquer serviço', pontos_necessarios: 150, tipo: 'desconto', valor_desconto: 20, ativo: true, estoque: null },
  { id: 'r3', nome: 'Polimento Grátis', descricao: 'Polimento completo gratuito', pontos_necessarios: 400, tipo: 'servico_gratis', valor_desconto: null, ativo: true, estoque: 5 },
  { id: 'r4', nome: 'Kit Limpeza', descricao: 'Kit de produtos de limpeza automotiva', pontos_necessarios: 200, tipo: 'brinde', valor_desconto: null, ativo: false, estoque: 10 },
]

const DEMO_RESGATES = [
  { id: 'rg1', pontos_usados: 100, status: 'resgatado', codigo_resgate: 'LVA-X291', created_at: new Date(Date.now() - 2 * 86400000).toISOString(), clientes: { nome: 'Carlos Silva' }, recompensas: { nome: 'Lavagem Grátis', tipo: 'servico_gratis' } },
  { id: 'rg2', pontos_usados: 150, status: 'pendente', codigo_resgate: 'LVA-K847', created_at: new Date(Date.now() - 5 * 86400000).toISOString(), clientes: { nome: 'Fernanda Lima' }, recompensas: { nome: 'Desconto 20%', tipo: 'desconto' } },
  { id: 'rg3', pontos_usados: 400, status: 'resgatado', codigo_resgate: 'LVA-M103', created_at: new Date(Date.now() - 10 * 86400000).toISOString(), clientes: { nome: 'Ana Souza' }, recompensas: { nome: 'Polimento Grátis', tipo: 'servico_gratis' } },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface PontosCliente {
  id: string
  pontos_total: number
  pontos_disponiveis: number
  nivel: string
  total_gasto: number
  total_atendimentos: number
  ultima_visita: string | null
  clientes: { id: string; nome: string; telefone: string | null; email: string | null }
}

interface Recompensa {
  id: string
  nome: string
  descricao: string | null
  pontos_necessarios: number
  tipo: string
  valor_desconto: number | null
  ativo: boolean
  estoque: number | null
}

interface Resgate {
  id: string
  pontos_usados: number
  status: string
  codigo_resgate: string
  created_at: string
  clientes: { nome: string }
  recompensas: { nome: string; tipo: string }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getInitials(nome: string) {
  return nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
}

const AVATAR_COLORS = ['#00d4ff', '#00e676', '#ffd700', '#ff6b6b', '#a78bfa', '#fb923c']
function getAvatarColor(nome: string) {
  let h = 0
  for (let i = 0; i < nome.length; i++) h = (h + nome.charCodeAt(i)) % AVATAR_COLORS.length
  return AVATAR_COLORS[h]
}

const TIPO_ICONS: Record<string, string> = {
  desconto: '💸',
  servico_gratis: '✨',
  brinde: '🎁',
}

// ─── Stats row ────────────────────────────────────────────────────────────────

function StatsRow({ data, resgates }: { data: PontosCliente[]; resgates: Resgate[] }) {
  const totalMembros = data.length
  const now = new Date()
  const mesPassado = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const resgatesMes = resgates.filter(r => r.created_at >= mesPassado && r.status !== 'cancelado').length
  const pontosCirculacao = data.reduce((s, c) => s + c.pontos_disponiveis, 0)
  const diamantes = data.filter(c => c.nivel === 'diamante').length

  const stats = [
    { label: 'Membros no programa', value: totalMembros, icon: <Users size={16} />, color: '#00d4ff' },
    { label: 'Resgates este mês', value: resgatesMes, icon: <Gift size={16} />, color: '#00e676' },
    { label: 'Pontos em circulação', value: pontosCirculacao.toLocaleString('pt-BR'), icon: <Coins size={16} />, color: '#ffd700' },
    { label: 'Clientes Diamante', value: diamantes, icon: <Award size={16} />, color: '#00d4ff' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map(s => (
        <div key={s.label} className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">{s.label}</p>
            <p className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Add Points Modal ─────────────────────────────────────────────────────────

function AddPontosModal({ clientes, onClose, onSuccess }: {
  clientes: PontosCliente[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [clienteId, setClienteId] = useState('')
  const [pontos, setPontos] = useState('')
  const [tipo, setTipo] = useState('bonus')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clienteId || !pontos) { setErr('Preencha cliente e pontos'); return }
    setLoading(true)
    setErr('')
    try {
      const r = await fetch('/api/fidelidade/pontos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId, pontos: Number(pontos), tipo, descricao }),
      })
      const json = await r.json()
      if (!r.ok) { setErr(json.error ?? 'Erro'); setLoading(false); return }
      onSuccess()
      onClose()
    } catch {
      setErr('Erro de rede')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 className="text-lg font-bold text-white mb-5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Adicionar / Ajustar Pontos</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Cliente</label>
            <select value={clienteId} onChange={e => setClienteId(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <option value="">Selecione um cliente</option>
              {clientes.map(c => (
                <option key={c.id} value={c.clientes.id}>
                  {c.clientes.nome} — {c.pontos_disponiveis} pts
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Pontos (use negativo para deduzir)</label>
              <input type="number" value={pontos} onChange={e => setPontos(e.target.value)}
                placeholder="ex: 100 ou -50"
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <option value="bonus">Bônus</option>
                <option value="ajuste">Ajuste</option>
                <option value="ganho">Ganho</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Motivo (opcional)</label>
            <input value={descricao} onChange={e => setDescricao(e.target.value)}
              placeholder="ex: Bônus de aniversário"
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
          {err && <p className="text-red-400 text-xs">{err}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-black transition-opacity disabled:opacity-50"
              style={{ background: '#00d4ff' }}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Recompensa Modal ─────────────────────────────────────────────────────────

function RecompensaModal({ recompensa, onClose, onSuccess }: {
  recompensa?: Recompensa
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState({
    nome: recompensa?.nome ?? '',
    descricao: recompensa?.descricao ?? '',
    pontos_necessarios: recompensa?.pontos_necessarios ?? 500,
    tipo: recompensa?.tipo ?? 'desconto',
    valor_desconto: recompensa?.valor_desconto ?? '',
    estoque: recompensa?.estoque ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const isEdit = !!recompensa

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setErr('Nome é obrigatório'); return }
    setLoading(true)
    setErr('')
    const payload = {
      ...form,
      pontos_necessarios: Number(form.pontos_necessarios),
      valor_desconto: form.valor_desconto !== '' ? Number(form.valor_desconto) : null,
      estoque: form.estoque !== '' ? Number(form.estoque) : null,
    }
    try {
      const url = isEdit ? `/api/fidelidade/recompensas/${recompensa!.id}` : '/api/fidelidade/recompensas'
      const method = isEdit ? 'PATCH' : 'POST'
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await r.json()
      if (!r.ok) { setErr(json.error ?? 'Erro'); setLoading(false); return }
      onSuccess()
      onClose()
    } catch {
      setErr('Erro de rede')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 className="text-lg font-bold text-white mb-5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {isEdit ? 'Editar Recompensa' : 'Nova Recompensa'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Nome da recompensa</label>
            <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="ex: Lavagem grátis"
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Descrição (opcional)</label>
            <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              rows={2} placeholder="Detalhes da recompensa..."
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white resize-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">
              Pontos necessários: <span className="text-white font-bold">{form.pontos_necessarios}</span>
            </label>
            <input type="range" min={50} max={10000} step={50}
              value={form.pontos_necessarios}
              onChange={e => setForm(f => ({ ...f, pontos_necessarios: Number(e.target.value) }))}
              className="w-full accent-cyan-400" />
            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
              <span>50</span><span>2.500</span><span>5.000</span><span>10.000</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <option value="desconto">💸 Desconto</option>
                <option value="servico_gratis">✨ Serviço Grátis</option>
                <option value="brinde">🎁 Brinde</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Estoque (vazio = ilimitado)</label>
              <input type="number" value={form.estoque} onChange={e => setForm(f => ({ ...f, estoque: e.target.value }))}
                placeholder="ilimitado" min={0}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
          </div>
          {form.tipo === 'desconto' && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Valor do desconto (R$)</label>
              <input type="number" value={form.valor_desconto} onChange={e => setForm(f => ({ ...f, valor_desconto: e.target.value }))}
                placeholder="ex: 15.00" step={0.01} min={0}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
          )}
          {err && <p className="text-red-400 text-xs">{err}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-black transition-opacity disabled:opacity-50"
              style={{ background: '#00d4ff' }}>
              {loading ? 'Salvando...' : isEdit ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Clientes Tab ─────────────────────────────────────────────────────────────

function ClientesTab({ data, resgates, onRefresh }: { data: PontosCliente[]; resgates: Resgate[]; onRefresh: () => void }) {
  const [q, setQ] = useState('')
  const [nivelFilter, setNivelFilter] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [transacoes, setTransacoes] = useState<Record<string, any[]>>({})

  const filtered = data.filter(c => {
    const matchQ = !q || c.clientes.nome.toLowerCase().includes(q.toLowerCase()) || c.clientes.telefone?.includes(q)
    const matchN = !nivelFilter || c.nivel === nivelFilter
    return matchQ && matchN
  })

  async function loadTransacoes(clienteId: string) {
    if (transacoes[clienteId]) return
    const r = await fetch(`/api/fidelidade/pontos?clienteId=${clienteId}`)
    // We'll just show the already-loaded data for now; a dedicated endpoint can be added
    // For simplicity, show empty placeholder with message
    setTransacoes(t => ({ ...t, [clienteId]: [] }))
  }

  function exportCSV() {
    const rows = [
      ['Pos', 'Nome', 'Telefone', 'Nível', 'Pontos Disponíveis', 'Pontos Total', 'Total Gasto', 'Atendimentos', 'Última Visita'],
      ...filtered.map((c, i) => [
        i + 1,
        c.clientes.nome,
        c.clientes.telefone ?? '',
        NIVEL_LABELS[c.nivel] ?? c.nivel,
        c.pontos_disponiveis,
        c.pontos_total,
        c.total_gasto.toFixed(2),
        c.total_atendimentos,
        formatDate(c.ultima_visita),
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'ranking-fidelidade.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const medals: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' }

  return (
    <div>
      <StatsRow data={data} resgates={resgates} />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <select value={nivelFilter} onChange={e => setNivelFilter(e.target.value)}
          className="rounded-xl px-3 py-2.5 text-sm text-white"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="">Todos os níveis</option>
          {['bronze', 'prata', 'ouro', 'diamante'].map(n => (
            <option key={n} value={n}>{NIVEL_EMOJIS[n]} {NIVEL_LABELS[n]}</option>
          ))}
        </select>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-black"
          style={{ background: '#00d4ff' }}>
          <Plus size={14} /> Adicionar Pontos
        </button>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          <Download size={14} /> CSV
        </button>
      </div>

      {/* Ranking Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Star size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum cliente no programa de fidelidade ainda.</p>
            <p className="text-xs mt-1">Pontos são concedidos automaticamente ao concluir atendimentos.</p>
          </div>
        ) : (
          <div className="table-scroll">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['#', 'Cliente', 'Nível', 'Pts Disponíveis', 'Total Gasto', 'Última visita', ''].map(h => (
                  <th key={h} className="text-left text-[11px] text-gray-500 font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const color = getAvatarColor(c.clientes.nome)
                const isExp = expanded === c.id
                return (
                  <>
                    <tr key={c.id}
                      className="cursor-pointer transition-colors hover:bg-white/[0.02]"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onClick={() => {
                        setExpanded(isExp ? null : c.id)
                        if (!isExp) loadTransacoes(c.clientes.id)
                      }}>
                      <td className="px-4 py-3.5 text-sm font-bold text-gray-500 w-10">
                        {medals[i] ?? <span className="text-xs">{i + 1}</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: `${color}22`, color }}>
                            {getInitials(c.clientes.nome)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{c.clientes.nome}</p>
                            {c.clientes.telefone && <p className="text-xs text-gray-500">{c.clientes.telefone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <FidelidadeBadge nivel={c.nivel} size="sm" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Coins size={13} className="text-yellow-400" />
                          <span className="text-sm font-bold text-white">{c.pontos_disponiveis.toLocaleString('pt-BR')}</span>
                          <span className="text-xs text-gray-600">/ {c.pontos_total.toLocaleString('pt-BR')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-300">{formatCurrency(c.total_gasto)}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-400">{formatDate(c.ultima_visita)}</td>
                      <td className="px-4 py-3.5 text-gray-500">
                        {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </td>
                    </tr>
                    {isExp && (
                      <tr key={`${c.id}-exp`} style={{ background: 'rgba(0,212,255,0.02)' }}>
                        <td colSpan={7} className="px-6 py-4">
                          <div className="flex gap-6 text-sm">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Atendimentos</p>
                              <p className="font-bold text-white">{c.total_atendimentos}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Pontos resgatados</p>
                              <p className="font-bold text-white">{(c.pontos_total - c.pontos_disponiveis).toLocaleString('pt-BR')}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Email</p>
                              <p className="font-bold text-white">{c.clientes.email ?? '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Membro desde</p>
                              <p className="font-bold text-white">{formatDate(c.ultima_visita)}</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-3">
                            Para ver o histórico completo de transações, acesse o perfil do cliente.
                          </p>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showModal && (
        <AddPontosModal clientes={data} onClose={() => setShowModal(false)} onSuccess={onRefresh} />
      )}
    </div>
  )
}

// ─── Recompensas Tab ──────────────────────────────────────────────────────────

function RecompensasTab({ data, onRefresh }: { data: Recompensa[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Recompensa | undefined>()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleDeactivate(id: string) {
    setLoading(id)
    await fetch(`/api/fidelidade/recompensas/${id}`, { method: 'DELETE' })
    onRefresh()
    setLoading(null)
  }

  const nivelAtividade = (r: Recompensa) => {
    if (!r.ativo) return { label: 'Inativa', color: '#6b7280' }
    if (r.estoque === null) return { label: 'Ativa', color: '#00e676' }
    if (r.estoque === 0) return { label: 'Sem estoque', color: '#f87171' }
    return { label: `${r.estoque} em estoque`, color: '#ffd700' }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-400">{data.length} recompensa{data.length !== 1 ? 's' : ''} cadastrada{data.length !== 1 ? 's' : ''}</p>
        <button onClick={() => { setEditing(undefined); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-black"
          style={{ background: '#00d4ff' }}>
          <Plus size={14} /> Nova Recompensa
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-20 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Gift size={36} className="mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 font-medium">Nenhuma recompensa cadastrada</p>
          <p className="text-gray-600 text-sm mt-1">Crie recompensas para seus clientes resgatarem com pontos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map(r => {
            const status = nivelAtividade(r)
            return (
              <div key={r.id} className="rounded-2xl p-5 flex flex-col gap-3"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${r.ativo ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
                  opacity: r.ativo ? 1 : 0.6,
                }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{TIPO_ICONS[r.tipo] ?? '🎁'}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{r.nome}</p>
                      {r.descricao && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.descricao}</p>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,215,0,0.12)', color: '#ffd700' }}>
                    <Coins size={11} /> {r.pontos_necessarios.toLocaleString('pt-BR')} pts
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }}>
                    {TIPO_LABELS[r.tipo] ?? r.tipo}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `${status.color}18`, color: status.color }}>
                    {status.label}
                  </span>
                </div>
                {r.tipo === 'desconto' && r.valor_desconto && (
                  <p className="text-xs text-gray-400">Desconto: {formatCurrency(r.valor_desconto)}</p>
                )}
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => { setEditing(r); setShowModal(true) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-300 hover:text-white transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Edit2 size={11} /> Editar
                  </button>
                  {r.ativo && (
                    <button onClick={() => handleDeactivate(r.id)} disabled={loading === r.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                      style={{ border: '1px solid rgba(248,113,113,0.2)' }}>
                      <Trash2 size={11} /> {loading === r.id ? '...' : 'Desativar'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <RecompensaModal
          recompensa={editing}
          onClose={() => { setShowModal(false); setEditing(undefined) }}
          onSuccess={onRefresh}
        />
      )}
    </div>
  )
}

// ─── Config Tab ───────────────────────────────────────────────────────────────

function ConfigTab({ config: initialConfig, onRefresh }: { config: FidelidadeConfig; onRefresh: () => void }) {
  const [form, setForm] = useState<FidelidadeConfig>(initialConfig)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => { setForm(initialConfig) }, [initialConfig])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr(''); setSaved(false)
    try {
      const r = await fetch('/api/fidelidade/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await r.json()
      if (!r.ok) { setErr(json.error ?? 'Erro'); setLoading(false); return }
      setSaved(true)
      onRefresh()
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setErr('Erro de rede')
    }
    setLoading(false)
  }

  const exampleValor = 80
  const examplePontos = Math.floor(exampleValor * form.pontos_por_real)

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
  }

  return (
    <form onSubmit={handleSave}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main config */}
        <div className="lg:col-span-2 space-y-5">
          {/* Toggle */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Programa de fidelidade</p>
                <p className="text-xs text-gray-500 mt-0.5">Ativar ou pausar o programa para todos os clientes</p>
              </div>
              <button type="button" onClick={() => setForm(f => ({ ...f, ativo: !f.ativo }))}
                className="transition-colors">
                {form.ativo
                  ? <ToggleRight size={36} style={{ color: '#00d4ff' }} />
                  : <ToggleLeft size={36} className="text-gray-600" />}
              </button>
            </div>
          </div>

          {/* Points per R$ */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-white">Pontos por R$1 gasto</p>
              <span className="text-lg font-bold" style={{ color: '#ffd700' }}>{form.pontos_por_real.toFixed(1)} pts</span>
            </div>
            <input type="range" min={0.5} max={5} step={0.5}
              value={form.pontos_por_real}
              onChange={e => setForm(f => ({ ...f, pontos_por_real: Number(e.target.value) }))}
              className="w-full accent-yellow-400" />
            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
              <span>0.5</span><span>1.0</span><span>2.0</span><span>3.0</span><span>4.0</span><span>5.0</span>
            </div>
          </div>

          {/* Level thresholds */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-sm font-semibold text-white mb-4">Limites de nível (pontos acumulados)</p>
            <div className="space-y-3">
              {([
                { key: 'nivel_prata_pontos', label: 'Prata', color: '#C0C0C0', emoji: '🥈' },
                { key: 'nivel_ouro_pontos', label: 'Ouro', color: '#FFD700', emoji: '⭐' },
                { key: 'nivel_diamante_pontos', label: 'Diamante', color: '#00d4ff', emoji: '💎' },
              ] as const).map(({ key, label, color, emoji }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">{emoji}</span>
                  <span className="text-sm w-16 font-medium" style={{ color }}>{label}</span>
                  <input
                    type="number" min={1} max={99999}
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                    className="flex-1 rounded-xl px-3 py-2 text-sm text-white text-right"
                    style={inputStyle}
                  />
                  <span className="text-xs text-gray-500 w-8">pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bonus points */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-sm font-semibold text-white mb-4">Pontos bônus</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Aniversário</label>
                <input type="number" min={0} value={form.bonus_aniversario}
                  onChange={e => setForm(f => ({ ...f, bonus_aniversario: Number(e.target.value) }))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white"
                  style={inputStyle} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Indicação</label>
                <input type="number" min={0} value={form.bonus_indicacao}
                  onChange={e => setForm(f => ({ ...f, bonus_indicacao: Number(e.target.value) }))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white"
                  style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Welcome message */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <label className="text-sm font-semibold text-white mb-3 block">Mensagem de boas-vindas</label>
            <textarea value={form.mensagem_boas_vindas}
              onChange={e => setForm(f => ({ ...f, mensagem_boas_vindas: e.target.value }))}
              rows={3} maxLength={500}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white resize-none"
              style={inputStyle} />
            <p className="text-[10px] text-gray-600 mt-1 text-right">{form.mensagem_boas_vindas.length}/500</p>
          </div>

          {err && <p className="text-red-400 text-sm">{err}</p>}

          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-black transition-opacity disabled:opacity-50"
            style={{ background: saved ? '#00e676' : '#00d4ff' }}>
            {saved ? <><CheckCircle size={15} /> Configurações salvas!</> : loading ? <><RefreshCw size={15} className="animate-spin" /> Salvando...</> : <><Save size={15} /> Salvar configurações</>}
          </button>
        </div>

        {/* Preview panel */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5 sticky top-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Zap size={14} style={{ color: '#00d4ff' }} /> Prévia para o cliente
            </p>
            <div className="space-y-3 text-sm">
              <div className="rounded-xl p-3" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}>
                <p className="text-xs text-gray-400 mb-1">Lavagem de R$ {exampleValor} gera:</p>
                <p className="text-xl font-bold" style={{ color: '#ffd700' }}>{examplePontos} pontos</p>
              </div>
              <div className="space-y-2">
                {[
                  { nivel: 'prata', pts: form.nivel_prata_pontos },
                  { nivel: 'ouro', pts: form.nivel_ouro_pontos },
                  { nivel: 'diamante', pts: form.nivel_diamante_pontos },
                ].map(({ nivel, pts }) => {
                  const lave = Math.ceil(pts / examplePontos)
                  return (
                    <div key={nivel} className="flex items-center justify-between">
                      <FidelidadeBadge nivel={nivel} size="sm" />
                      <span className="text-xs text-gray-500">~{lave} visitas de R${exampleValor}</span>
                    </div>
                  )
                })}
              </div>
              <div className="rounded-xl p-3 mt-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-xs text-gray-400 italic">"{form.mensagem_boas_vindas}"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'clientes' | 'recompensas' | 'configurar'

export default function FidelidadePage() {
  const [tab, setTab] = useState<Tab>('clientes')
  const [clientes, setClientes] = useState<PontosCliente[]>([])
  const [recompensas, setRecompensas] = useState<Recompensa[]>([])
  const [resgates, setResgates] = useState<Resgate[]>([])
  const [config, setConfig] = useState<FidelidadeConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    // ── Demo mode ──────────────────────────────────────────────
    if (IS_DEMO) {
      await new Promise(r => setTimeout(r, 500))
      setClientes(DEMO_PONTOS_CLIENTES as any)
      setRecompensas(DEMO_RECOMPENSAS as any)
      setResgates(DEMO_RESGATES as any)
      setConfig(DEFAULT_CONFIG)
      setLoading(false)
      return
    }
    // ── Real API ───────────────────────────────────────────────
    try {
      const [rClientes, rRecompensas, rResgates, rConfig] = await Promise.all([
        fetch('/api/fidelidade/pontos').then(r => r.json()),
        fetch('/api/fidelidade/recompensas?ativo=false').then(r => r.json()),
        fetch('/api/fidelidade/resgates').then(r => r.json()),
        fetch('/api/fidelidade/config').then(r => r.json()),
      ])
      setClientes(rClientes.data ?? [])
      setRecompensas(rRecompensas.data ?? [])
      setResgates(rResgates.data ?? [])
      setConfig(rConfig.data ?? DEFAULT_CONFIG)
    } catch (e) {
      console.error('fidelidade load error', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'clientes', label: 'Clientes', icon: <Users size={14} /> },
    { id: 'recompensas', label: 'Recompensas', icon: <Gift size={14} /> },
    { id: 'configurar', label: 'Configurar', icon: <Settings2 size={14} /> },
  ]

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#08090f' }}>
      <Sidebar />
      <main className="flex-1 lg:ml-[240px] flex flex-col overflow-hidden">
        <Header title="Fidelidade" subtitle="Programa de pontos e recompensas" />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-6">
            {/* Tabs */}
            <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={tab === t.id
                    ? { background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }
                    : { color: '#6b7280' }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              </div>
            ) : (
              <>
                {tab === 'clientes' && <ClientesTab data={clientes} resgates={resgates} onRefresh={load} />}
                {tab === 'recompensas' && <RecompensasTab data={recompensas} onRefresh={load} />}
                {tab === 'configurar' && <ConfigTab config={config} onRefresh={load} />}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
