'use client'

import { useState, useEffect, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { formatCurrency } from '@/lib/utils'
import {
  Plus, Pencil, Trash2, X, User, Phone, Briefcase,
  DollarSign, Users, TrendingUp, CheckCircle, AlertCircle,
  Search, ChevronDown,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────

interface Funcionario {
  id: string
  nome: string
  cargo: string
  telefone?: string
  salario?: number
  created_at: string
}

// ── Helpers ──────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const AVATAR_COLORS = [
  { bg: 'rgba(0,212,255,0.15)',   text: '#00d4ff' },
  { bg: 'rgba(0,230,118,0.15)',   text: '#00e676' },
  { bg: 'rgba(255,214,0,0.15)',   text: '#ffd600' },
  { bg: 'rgba(168,85,247,0.15)',  text: '#a855f7' },
  { bg: 'rgba(249,115,22,0.15)',  text: '#f97316' },
  { bg: 'rgba(236,72,153,0.15)',  text: '#ec4899' },
]

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

// ── Toast ────────────────────────────────────────────────────

function Toast({ msg, type, onDone }: { msg: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])
  const color = type === 'success' ? '#00e676' : '#ff5252'
  const bg    = type === 'success' ? 'rgba(0,230,118,0.12)' : 'rgba(255,82,82,0.12)'
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
      style={{ background: bg, border: `1px solid ${color}33`, backdropFilter: 'blur(12px)' }}>
      {type === 'success' ? <CheckCircle size={16} style={{ color }} /> : <AlertCircle size={16} style={{ color }} />}
      <span className="text-sm font-semibold" style={{ color }}>{msg}</span>
    </div>
  )
}

// ── Modal ────────────────────────────────────────────────────

interface ModalProps {
  funcionario?: Funcionario | null
  onClose: () => void
  onSaved: (f: Funcionario) => void
}

function FuncionarioModal({ funcionario, onClose, onSaved }: ModalProps) {
  const isEdit = !!funcionario
  const [form, setForm] = useState({
    nome:     funcionario?.nome     ?? '',
    cargo:    funcionario?.cargo    ?? '',
    telefone: funcionario?.telefone ?? '',
    salario:  funcionario?.salario  != null ? String(funcionario.salario) : '',
  })
  const [saving, setSaving] = useState(false)
  const [erro, setErro]     = useState('')

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  async function handleSubmit() {
    if (!form.nome.trim())  { setErro('Nome é obrigatório'); return }
    if (!form.cargo.trim()) { setErro('Cargo é obrigatório'); return }
    setSaving(true)
    setErro('')
    try {
      const url    = isEdit ? `/api/funcionarios/${funcionario!.id}` : '/api/funcionarios'
      const method = isEdit ? 'PATCH' : 'POST'
      const body   = {
        nome:     form.nome.trim(),
        cargo:    form.cargo.trim(),
        telefone: form.telefone.trim() || null,
        salario:  form.salario ? parseFloat(form.salario) : null,
      }
      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro desconhecido')
      onSaved(json.data)
      onClose()
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-cyan-400/50'
  const inputSt  = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }
  const label    = 'text-xs text-gray-400 font-medium block mb-1'

  const CARGOS = ['Lavador', 'Polidor', 'Higienizador', 'Caixa', 'Gerente', 'Atendente', 'Supervisor', 'Outro']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-6"
        style={{ background: '#0d0f1a', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {isEdit ? 'Editar Funcionário' : 'Novo Funcionário'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className={label}>Nome completo *</label>
            <input type="text" value={form.nome} onChange={set('nome')} placeholder="João da Silva"
              className={inputCls} style={inputSt} />
          </div>
          <div>
            <label className={label}>Cargo *</label>
            <div className="relative">
              <select value={form.cargo} onChange={set('cargo')} className={inputCls + ' appearance-none pr-8'}
                style={{ ...inputSt, background: '#12152a' }}>
                <option value="">Selecionar cargo...</option>
                {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Telefone</label>
              <input type="tel" value={form.telefone} onChange={set('telefone')} placeholder="(11) 99999-0000"
                className={inputCls} style={inputSt} />
            </div>
            <div>
              <label className={label}>Salário (R$)</label>
              <input type="number" value={form.salario} onChange={set('salario')} placeholder="1800.00"
                min="0" step="0.01" className={inputCls} style={inputSt} />
            </div>
          </div>
        </div>

        {erro && <p className="text-red-400 text-xs mt-3">{erro}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}>
            {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────

export default function EquipePage() {
  const [funcionarios, setFuncionarios]   = useState<Funcionario[]>([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [showModal, setShowModal]         = useState(false)
  const [editTarget, setEditTarget]       = useState<Funcionario | null>(null)
  const [deleting, setDeleting]           = useState<string | null>(null)
  const [toast, setToast]                 = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') =>
    setToast({ msg, type })

  const load = useCallback(async () => {
    try {
      const res  = await fetch('/api/funcionarios')
      const json = await res.json()
      setFuncionarios(json.data ?? [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSaved = (f: Funcionario) => {
    setFuncionarios(prev => {
      const idx = prev.findIndex(x => x.id === f.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = f; return next }
      return [f, ...prev]
    })
    showToast(editTarget ? 'Funcionário atualizado!' : 'Funcionário adicionado!')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este funcionário?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/funcionarios/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao deletar')
      setFuncionarios(prev => prev.filter(f => f.id !== id))
      showToast('Funcionário removido.')
    } catch {
      showToast('Erro ao remover funcionário.', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = funcionarios.filter(f =>
    f.nome.toLowerCase().includes(search.toLowerCase()) ||
    f.cargo.toLowerCase().includes(search.toLowerCase())
  )

  const totalFolha = funcionarios.reduce((s, f) => s + (f.salario ?? 0), 0)
  const cargoCounts: Record<string, number> = {}
  funcionarios.forEach(f => { cargoCounts[f.cargo] = (cargoCounts[f.cargo] ?? 0) + 1 })
  const topCargo = Object.entries(cargoCounts).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#08090f' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: 'var(--sidebar-width, 240px)' }}>
        <style>{`@media (max-width: 1023px) { main { margin-left: 0 !important; } }`}</style>

        <Header
          title="Equipe"
          subtitle={`${funcionarios.length} funcionário${funcionarios.length !== 1 ? 's' : ''} cadastrado${funcionarios.length !== 1 ? 's' : ''}`}
          action={{ label: '+ Novo Funcionário', onClick: () => { setEditTarget(null); setShowModal(true) } }}
        />

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'Total de Funcionários', value: funcionarios.length, icon: <Users size={16} />, color: '#00d4ff', bg: 'rgba(0,212,255,0.12)' },
              { label: 'Folha de Pagamento', value: formatCurrency(totalFolha), icon: <DollarSign size={16} />, color: '#00e676', bg: 'rgba(0,230,118,0.12)' },
              { label: 'Cargo Mais Comum', value: topCargo?.[0] ?? '—', icon: <Briefcase size={16} />, color: '#ffd600', bg: 'rgba(255,214,0,0.12)' },
              { label: 'Média Salarial', value: funcionarios.length ? formatCurrency(totalFolha / funcionarios.length) : '—', icon: <TrendingUp size={16} />, color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-5 flex items-center gap-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: s.bg, color: s.color }}>
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5 truncate">{s.label}</p>
                  <p className="text-xl font-bold text-white truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {s.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar funcionário ou cargo..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-cyan-400/50"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Table */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {loading ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Carregando equipe...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-4xl mb-3">👥</p>
                <p className="text-gray-400 font-medium">
                  {search ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário cadastrado'}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  {search ? 'Tente outro termo de busca.' : 'Clique em "+ Novo Funcionário" para começar.'}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Funcionário', 'Cargo', 'Telefone', 'Salário', 'Desde', 'Ações'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f, i) => {
                    const av = avatarColor(f.nome)
                    const isDel = deleting === f.id
                    return (
                      <tr key={f.id}
                        className="group transition-colors hover:bg-white/[0.03]"
                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>

                        {/* Nome */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                              style={{ background: av.bg, color: av.text }}>
                              {getInitials(f.nome)}
                            </div>
                            <span className="text-sm font-semibold text-white">{f.nome}</span>
                          </div>
                        </td>

                        {/* Cargo */}
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: av.bg, color: av.text }}>
                            {f.cargo}
                          </span>
                        </td>

                        {/* Telefone */}
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-400 font-mono">
                            {f.telefone ?? '—'}
                          </span>
                        </td>

                        {/* Salário */}
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-semibold text-green-400">
                            {f.salario != null ? formatCurrency(f.salario) : '—'}
                          </span>
                        </td>

                        {/* Desde */}
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-500">
                            {new Date(f.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditTarget(f); setShowModal(true) }}
                              title="Editar"
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                              style={{ color: '#00d4ff', background: 'rgba(0,212,255,0.1)' }}>
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDelete(f.id)} disabled={isDel}
                              title="Remover"
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                              style={{ color: '#ff5252', background: 'rgba(255,82,82,0.1)' }}>
                              {isDel
                                ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                : <Trash2 size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Cargo breakdown */}
          {!loading && funcionarios.length > 0 && (
            <div className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="text-sm font-bold text-white mb-4">Distribuição por Cargo</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(cargoCounts).sort((a, b) => b[1] - a[1]).map(([cargo, count]) => {
                  const pct = Math.round((count / funcionarios.length) * 100)
                  return (
                    <div key={cargo} className="rounded-xl p-3"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-xs text-gray-500 mb-1">{cargo}</p>
                      <p className="text-lg font-bold text-white">{count}</p>
                      <div className="mt-2 h-1 rounded-full bg-white/10">
                        <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #00d4ff, #4f8eff)' }} />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{pct}% da equipe</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <FuncionarioModal
          funcionario={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null) }}
          onSaved={handleSaved}
        />
      )}

      {/* FAB mobile */}
      <button onClick={() => { setEditTarget(null); setShowModal(true) }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 z-40 xl:hidden"
        style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)', boxShadow: '0 0 30px rgba(0,212,255,0.4)' }}>
        <Plus size={22} className="text-black" />
      </button>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  )
}
