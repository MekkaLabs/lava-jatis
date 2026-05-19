'use client'

import { useState, useEffect, useRef } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { IS_DEMO, DEMO_CLIENTES } from '@/lib/demo'
import { getInitials, getAvatarColor, formatCurrency } from '@/lib/utils'
import {
  Search, Plus, Eye, Pencil, MessageCircle, ChevronLeft, ChevronRight,
  X, Users, TrendingUp, Star, AlertCircle, SortAsc, SortDesc,
  Phone, Mail, Car, Calendar, Wallet, Award,
} from 'lucide-react'
import type { Customer } from '@/types'

// Adapta DEMO_CLIENTES (demo.ts) para o tipo Customer usado nesta página
const demoCustomers: Customer[] = DEMO_CLIENTES.map(c => ({
  id: c.id,
  name: c.nome,
  phone: c.telefone ?? '',
  email: c.email ?? undefined,
  plate: c.placa,
  carModel: '',
  carColor: '',
  totalVisits: c.total_atendimentos,
  totalSpent: c.total_gasto,
  lastVisit: c.ultima_visita.slice(0, 10),
  loyaltyPoints: c.pontos,
  createdAt: c.created_at.slice(0, 10),
}))

const PAGE_SIZE = 20
type SortField = 'nome' | 'cadastro' | 'atendimentos'
type SortDir = 'asc' | 'desc'

function StatsRow({ data }: { data: Customer[] }) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const total = data.length
  const ativos = data.filter(c => c.lastVisit >= monthStart).length
  const vips = data.filter(c => c.totalVisits > 10).length
  const inadimplentes = data.filter(c => {
    const diffDays = Math.floor((now.getTime() - new Date(c.lastVisit).getTime()) / 86400000)
    return diffDays > 60
  }).length
  const stats = [
    { label: 'Total de Clientes', value: total, color: 'text-white', bg: '#00d4ff', icon: <Users size={16} /> },
    { label: 'Ativos este Mês', value: ativos, color: 'text-cyan-400', bg: '#00d4ff', icon: <TrendingUp size={16} /> },
    { label: 'Clientes VIP', value: vips, color: 'text-yellow-400', bg: '#fbbf24', icon: <Star size={16} /> },
    { label: 'Inadimplentes', value: inadimplentes, color: 'text-red-400', bg: '#f87171', icon: <AlertCircle size={16} /> },
  ]
  return (
    <div className="grid grid-cols-4 gap-4 mb-5">
      {stats.map(s => (
        <div key={s.label} className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${s.bg}18`, color: s.bg }}>{s.icon}</div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 6 }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div className="h-4 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.06)', width: j === 0 ? '80%' : '60%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

interface NovoClienteModalProps { onClose: () => void; onSave: (c: Partial<Customer & { nome: string; telefone: string; obs: string; cpf: string }>) => void }

function NovoClienteModal({ onClose, onSave }: NovoClienteModalProps) {
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', cpf: '', obs: '' })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function applyPhoneMask(raw: string) {
    const d = raw.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
  }

  async function handleSave() {
    const errs: Record<string, string> = {}
    if (!form.nome.trim()) errs.nome = 'Nome obrigatório'
    if (!form.telefone.trim()) errs.telefone = 'Telefone obrigatório'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-md"
        style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.12)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Novo Cliente</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"><X size={16} /></button>
        </div>
        <div className="space-y-4">
          {[
            { key: 'nome', label: 'Nome completo', required: true, placeholder: 'João Carlos Silva', type: 'text' },
            { key: 'telefone', label: 'Telefone / WhatsApp', required: true, placeholder: '(11) 99999-8888', type: 'tel' },
            { key: 'email', label: 'E-mail', required: false, placeholder: 'joao@email.com', type: 'email' },
            { key: 'cpf', label: 'CPF / CNPJ', required: false, placeholder: '000.000.000-00', type: 'text' },
          ].map(({ key, label, required, placeholder, type }) => (
            <div key={key}>
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">
                {label}{required && <span className="text-red-400 ml-1">*</span>}
              </label>
              <input type={type} value={form[key as keyof typeof form]} placeholder={placeholder}
                onChange={e => {
                  const val = key === 'telefone' ? applyPhoneMask(e.target.value) : e.target.value
                  setForm(f => ({ ...f, [key]: val }))
                  if (errors[key]) setErrors(er => ({ ...er, [key]: '' }))
                }}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${errors[key] ? '#f87171' : 'rgba(255,255,255,0.1)'}` }} />
              {errors[key] && <p className="text-xs text-red-400 mt-1">{errors[key]}</p>}
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">Observação</label>
            <textarea rows={2} value={form.obs} onChange={e => setForm(f => ({ ...f, obs: e.target.value }))}
              placeholder="Informações adicionais..." className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
            {saving ? 'Salvando...' : 'Salvar Cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ClienteDetail({ cliente, onClose }: { cliente: Customer; onClose: () => void }) {
  const mockHistory = [
    { id: 'os-1', data: '2026-05-14', servico: 'Lavagem Completa', valor: 120, status: 'concluido' },
    { id: 'os-2', data: '2026-04-28', servico: 'Polimento', valor: 250, status: 'concluido' },
    { id: 'os-3', data: '2026-04-10', servico: 'Lavagem Simples', valor: 60, status: 'concluido' },
    { id: 'os-4', data: '2026-03-22', servico: 'Higienização Interna', valor: 180, status: 'concluido' },
    { id: 'os-5', data: '2026-03-05', servico: 'Lavagem + Cera', valor: 150, status: 'cancelado' },
  ]
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    concluido: { label: 'Concluído', color: '#00e676', bg: 'rgba(0,230,118,0.12)' },
    cancelado: { label: 'Cancelado', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
    em_andamento: { label: 'Em andamento', color: '#00d4ff', bg: 'rgba(0,212,255,0.12)' },
  }
  const nivel = cliente.totalVisits >= 20 ? 'Ouro' : cliente.totalVisits >= 10 ? 'Prata' : 'Bronze'
  const nivelColor = nivel === 'Ouro' ? '#fbbf24' : nivel === 'Prata' ? '#9ca3af' : '#cd7f32'
  const totalHistorico = mockHistory.filter(o => o.status === 'concluido').reduce((s, o) => s + o.valor, 0)

  return (
    <div className="w-[400px] flex-shrink-0 flex flex-col overflow-hidden"
      style={{ borderLeft: '1px solid rgba(255,255,255,0.07)', background: '#0f1117' }}>
      <div className="flex items-center justify-between p-5 pb-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Perfil do Cliente</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-3 ${getAvatarColor(cliente.name)}`}>
            {getInitials(cliente.name)}
          </div>
          <h3 className="font-bold text-white text-lg">{cliente.name}</h3>
          <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1"
            style={{ background: `${nivelColor}18`, color: nivelColor, border: `1px solid ${nivelColor}30` }}>
            {nivel}
          </span>
        </div>

        <div className="rounded-xl p-4 space-y-2.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {cliente.phone && <div className="flex items-center gap-3"><Phone size={14} className="text-gray-500 flex-shrink-0" /><span className="text-sm text-gray-300">{cliente.phone}</span></div>}
          {cliente.email && <div className="flex items-center gap-3"><Mail size={14} className="text-gray-500 flex-shrink-0" /><span className="text-sm text-gray-300">{cliente.email}</span></div>}
          <div className="flex items-center gap-3"><Car size={14} className="text-gray-500 flex-shrink-0" /><span className="text-sm text-gray-300">{cliente.carModel} {cliente.carColor} · <span className="font-mono text-cyan-400">{cliente.plate}</span></span></div>
          <div className="flex items-center gap-3"><Calendar size={14} className="text-gray-500 flex-shrink-0" /><span className="text-sm text-gray-400">Cliente desde {new Date(cliente.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span></div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Total de OS', value: cliente.totalVisits, color: 'text-cyan-400' },
            { label: 'Total Gasto', value: formatCurrency(cliente.totalSpent), color: 'text-green-400' },
            { label: 'Ticket Médio', value: formatCurrency(cliente.totalVisits ? cliente.totalSpent / cliente.totalVisits : 0), color: 'text-white' },
            { label: 'Pontos Fidelidade', value: cliente.loyaltyPoints, color: 'text-yellow-400' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className={`text-lg font-bold ${s.color}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Histórico de Atendimentos</p>
          <div className="space-y-2">
            {mockHistory.map(os => {
              const cfg = statusConfig[os.status] || statusConfig.concluido
              return (
                <div key={os.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{os.servico}</p>
                    <p className="text-xs text-gray-500">{new Date(os.data).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  <span className="text-sm font-bold text-green-400 flex-shrink-0">{formatCurrency(os.valor)}</span>
                </div>
              )
            })}
          </div>
        </div>

        <a href={`https://wa.me/55${cliente.phone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
          className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{ background: 'rgba(37,211,102,0.15)', color: '#25d366', border: '1px solid rgba(37,211,102,0.2)' }}>
          <MessageCircle size={15} /> Enviar WhatsApp
        </a>
      </div>
    </div>
  )
}

export default function ClientesPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('cadastro')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Customer | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<Customer[]>(IS_DEMO ? demoCustomers : [])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setLoading(true)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
      setLoading(false)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  const filtered = clientes.filter(c => {
    const q = debouncedSearch.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || (c.phone || '').includes(q) || (c.plate || '').toLowerCase().includes(q)
  })

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0
    if (sortField === 'nome') cmp = a.name.localeCompare(b.name)
    else if (sortField === 'cadastro') cmp = a.createdAt.localeCompare(b.createdAt)
    else if (sortField === 'atendimentos') cmp = a.totalVisits - b.totalVisits
    return sortDir === 'asc' ? cmp : -cmp
  })

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  function handleSaveCliente(data: Record<string, string>) {
    const novo: Customer = {
      id: `c-${Date.now()}`,
      name: data.nome || '',
      phone: data.telefone || '',
      email: data.email || undefined,
      plate: 'N/A',
      carModel: 'N/A',
      carColor: 'N/A',
      totalVisits: 0,
      totalSpent: 0,
      lastVisit: new Date().toISOString().slice(0, 10),
      loyaltyPoints: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setClientes(cs => [novo, ...cs])
  }

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field
      ? (sortDir === 'asc' ? <SortAsc size={11} className="text-cyan-400" /> : <SortDesc size={11} className="text-cyan-400" />)
      : <SortAsc size={11} className="text-gray-600" />

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#08090f' }}>
      <Sidebar />
      <main className="flex-1 ml-[240px] flex flex-col overflow-hidden">
        <Header
          title="Clientes"
          subtitle={`${clientes.length} clientes cadastrados`}
          action={{ label: 'Novo Cliente', onClick: () => setShowModal(true) }}
        />
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-y-auto p-6">
            <StatsRow data={clientes} />

            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nome, telefone ou placa..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {([['nome', 'Nome'], ['cadastro', 'Cadastro'], ['atendimentos', 'OS']] as [SortField, string][]).map(([f, label]) => (
                  <button key={f} onClick={() => toggleSort(f)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${sortField === f ? 'text-black' : 'text-gray-400 hover:text-white'}`}
                    style={sortField === f ? { background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' } : {}}>
                    {label} <SortIcon field={f} />
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Cliente', 'Telefone', 'Total de OS', 'Valor Total Gasto', 'Última Visita', 'Ações'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? <SkeletonRows /> : paged.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                            style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)' }}>
                            <Users size={22} className="text-cyan-400/60" />
                          </div>
                          <p className="text-gray-500 text-sm">Nenhum cliente encontrado</p>
                          {debouncedSearch && (
                            <button onClick={() => setSearch('')} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                              Limpar busca
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : paged.map((c, i) => (
                    <tr key={c.id} className="group transition-colors hover:bg-white/[0.025] cursor-pointer"
                      style={{ borderBottom: i < paged.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                      onClick={() => setSelected(c)}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${getAvatarColor(c.name)}`}>
                            {getInitials(c.name)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{c.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{c.plate}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><span className="text-sm text-gray-300">{c.phone}</span></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp size={12} className="text-cyan-400" />
                          <span className="text-sm font-semibold text-white">{c.totalVisits}</span>
                          {c.totalVisits > 10 && <Star size={11} className="text-yellow-400 fill-yellow-400" />}
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><span className="text-sm font-semibold text-green-400">{formatCurrency(c.totalSpent)}</span></td>
                      <td className="px-4 py-3.5"><span className="text-sm text-gray-400">{new Date(c.lastVisit).toLocaleDateString('pt-BR')}</span></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e => { e.stopPropagation(); setSelected(c) }}
                            className="p-1.5 rounded-lg hover:bg-cyan-400/10 text-gray-500 hover:text-cyan-400 transition-colors" title="Ver detalhes">
                            <Eye size={14} />
                          </button>
                          <button onClick={e => e.stopPropagation()}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors" title="Editar">
                            <Pencil size={14} />
                          </button>
                          <a href={`https://wa.me/55${(c.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="p-1.5 rounded-lg hover:bg-green-400/10 text-gray-500 hover:text-green-400 transition-colors" title="WhatsApp">
                            <MessageCircle size={14} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
                  <span className="text-xs text-gray-500">
                    Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} de {sorted.length} clientes
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="p-1.5 rounded-lg transition-colors disabled:opacity-30 hover:bg-white/10 text-gray-400">
                      <ChevronLeft size={15} />
                    </button>
                    <span className="text-xs text-gray-400 px-2">{page} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="p-1.5 rounded-lg transition-colors disabled:opacity-30 hover:bg-white/10 text-gray-400">
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {selected && <ClienteDetail cliente={selected} onClose={() => setSelected(null)} />}
        </div>
      </main>

      {showModal && <NovoClienteModal onClose={() => setShowModal(false)} onSave={handleSaveCliente as any} />}
    </div>
  )
}
