'use client'

import { useState, useEffect, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { formatCurrency } from '@/lib/utils'
import { IS_DEMO, DEMO_ESTOQUE_ITENS, DEMO_ESTOQUE_CATEGORIAS } from '@/lib/demo'
import { isEstoqueBaixo, validarMovimentacao, UNIDADES, type Unidade, type TipoMovimentacao } from '@/lib/estoque'
import {
  Plus, Pencil, Trash2, X, Package, AlertTriangle, Boxes,
  ArrowDownCircle, ArrowUpCircle, CheckCircle, AlertCircle, Search, ChevronDown,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────
interface Categoria { id: string; nome: string }
interface Item {
  id: string
  nome: string
  sku?: string | null
  unidade: Unidade
  qtd_atual: number
  estoque_minimo: number
  custo: number
  ativo: boolean
  categoria_id?: string | null
  categoria?: { id: string; nome: string } | null
}

// ── Toast ────────────────────────────────────────────────────
function Toast({ msg, type, onDone }: { msg: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
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

const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-cyan-400/50'
const inputSt  = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' } as const
const labelCls = 'text-xs text-gray-400 font-medium block mb-1'

// ── Item Modal ───────────────────────────────────────────────
function ItemModal({ item, categorias, onClose, onSaved, isDemo }: {
  item?: Item | null; categorias: Categoria[]; onClose: () => void; onSaved: (i: Item) => void; isDemo: boolean
}) {
  const isEdit = !!item
  const [form, setForm] = useState({
    nome: item?.nome ?? '',
    sku: item?.sku ?? '',
    unidade: (item?.unidade ?? 'un') as Unidade,
    qtd_atual: item?.qtd_atual != null ? String(item.qtd_atual) : '0',
    estoque_minimo: item?.estoque_minimo != null ? String(item.estoque_minimo) : '0',
    custo: item?.custo != null ? String(item.custo) : '0',
    categoria_id: item?.categoria_id ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  async function handleSubmit() {
    if (!form.nome.trim()) { setErro('Nome é obrigatório'); return }
    if (Number(form.estoque_minimo) < 0 || Number(form.custo) < 0) { setErro('Valores não podem ser negativos'); return }
    setSaving(true); setErro('')

    const cat = categorias.find(c => c.id === form.categoria_id)
    if (isDemo) {
      await new Promise(r => setTimeout(r, 400))
      onSaved({
        id: isEdit ? item!.id : `demo-i-${Date.now()}`,
        nome: form.nome.trim(),
        sku: form.sku.trim() || null,
        unidade: form.unidade,
        qtd_atual: isEdit ? item!.qtd_atual : Number(form.qtd_atual) || 0,
        estoque_minimo: Number(form.estoque_minimo) || 0,
        custo: Number(form.custo) || 0,
        ativo: true,
        categoria_id: form.categoria_id || null,
        categoria: cat ? { id: cat.id, nome: cat.nome } : null,
      })
      onClose(); setSaving(false); return
    }
    try {
      const url = isEdit ? `/api/estoque/itens/${item!.id}` : '/api/estoque/itens'
      const method = isEdit ? 'PATCH' : 'POST'
      const body: any = {
        nome: form.nome.trim(),
        sku: form.sku.trim() || null,
        unidade: form.unidade,
        estoque_minimo: Number(form.estoque_minimo) || 0,
        custo: Number(form.custo) || 0,
        categoria_id: form.categoria_id || null,
      }
      if (!isEdit) body.qtd_atual = Number(form.qtd_atual) || 0
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro desconhecido')
      onSaved({ ...json.data, categoria: cat ? { id: cat.id, nome: cat.nome } : null })
      onClose()
    } catch (e: any) { setErro(e.message) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#0d0f1a', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">{isEdit ? 'Editar Item' : 'Novo Item'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Nome *</label>
            <input value={form.nome} onChange={set('nome')} placeholder="Shampoo automotivo 5L" className={inputCls} style={inputSt} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>SKU / Código</label>
              <input value={form.sku} onChange={set('sku')} placeholder="SHP-5L" className={inputCls} style={inputSt} />
            </div>
            <div>
              <label className={labelCls}>Unidade</label>
              <div className="relative">
                <select value={form.unidade} onChange={set('unidade')} className={inputCls + ' appearance-none pr-8'} style={{ ...inputSt, background: '#12152a' }}>
                  {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>
          <div>
            <label className={labelCls}>Categoria</label>
            <div className="relative">
              <select value={form.categoria_id} onChange={set('categoria_id')} className={inputCls + ' appearance-none pr-8'} style={{ ...inputSt, background: '#12152a' }}>
                <option value="">Sem categoria</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {!isEdit && (
              <div>
                <label className={labelCls}>Qtd inicial</label>
                <input type="number" min="0" step="0.001" value={form.qtd_atual} onChange={set('qtd_atual')} className={inputCls} style={inputSt} />
              </div>
            )}
            <div>
              <label className={labelCls}>Estoque mín.</label>
              <input type="number" min="0" step="0.001" value={form.estoque_minimo} onChange={set('estoque_minimo')} className={inputCls} style={inputSt} />
            </div>
            <div>
              <label className={labelCls}>Custo (R$)</label>
              <input type="number" min="0" step="0.01" value={form.custo} onChange={set('custo')} className={inputCls} style={inputSt} />
            </div>
          </div>
          {isEdit && <p className="text-xs text-gray-600">O saldo atual ({item!.qtd_atual} {item!.unidade}) só muda por movimentações.</p>}
        </div>
        {erro && <p className="text-red-400 text-xs mt-3">{erro}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black hover:opacity-90 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}>
            {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Movimentação Modal ───────────────────────────────────────
function MovModal({ item, onClose, onDone, isDemo }: {
  item: Item; onClose: () => void; onDone: (novoSaldo: number, msg: string) => void; isDemo: boolean
}) {
  const [tipo, setTipo] = useState<TipoMovimentacao>('entrada')
  const [quantidade, setQuantidade] = useState('')
  const [motivo, setMotivo] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit() {
    const qtd = Number(quantidade)
    const check = validarMovimentacao(item.qtd_atual, tipo, qtd)
    if (!check.valid) { setErro(check.erro === 'saldo insuficiente: a saída deixaria o saldo negativo' ? 'Saldo insuficiente para esta saída' : 'Informe uma quantidade válida (> 0)'); return }
    setSaving(true); setErro('')

    if (isDemo) {
      await new Promise(r => setTimeout(r, 400))
      onDone(check.novoSaldo, `${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada`)
      onClose(); setSaving(false); return
    }
    try {
      const res = await fetch('/api/estoque/movimentacoes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: item.id, tipo, quantidade: qtd, motivo: motivo.trim() || null, responsavel: responsavel.trim() || null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao registrar movimentação')
      onDone(check.novoSaldo, `${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada`)
      onClose()
    } catch (e: any) { setErro(e.message) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#0d0f1a', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-white">Movimentar estoque</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4">{item.nome} · saldo atual <span className="text-white font-semibold">{item.qtd_atual} {item.unidade}</span></p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button onClick={() => setTipo('entrada')} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={tipo === 'entrada' ? { background: 'rgba(0,230,118,0.15)', color: '#00e676', border: '1px solid rgba(0,230,118,0.3)' } : { background: 'rgba(255,255,255,0.04)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ArrowDownCircle size={15} /> Entrada
          </button>
          <button onClick={() => setTipo('saida')} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={tipo === 'saida' ? { background: 'rgba(255,82,82,0.15)', color: '#ff5252', border: '1px solid rgba(255,82,82,0.3)' } : { background: 'rgba(255,255,255,0.04)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ArrowUpCircle size={15} /> Saída
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Quantidade *</label>
            <input type="number" min="0" step="0.001" value={quantidade} onChange={e => setQuantidade(e.target.value)} placeholder="0" className={inputCls} style={inputSt} autoFocus />
          </div>
          <div>
            <label className={labelCls}>Motivo</label>
            <input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder={tipo === 'entrada' ? 'Compra fornecedor' : 'Consumo do dia'} className={inputCls} style={inputSt} />
          </div>
          <div>
            <label className={labelCls}>Responsável</label>
            <input value={responsavel} onChange={e => setResponsavel(e.target.value)} placeholder="Nome de quem registrou" className={inputCls} style={inputSt} />
          </div>
        </div>
        {erro && <p className="text-red-400 text-xs mt-3">{erro}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black hover:opacity-90 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}>
            {saving ? 'Registrando...' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function EstoquePage() {
  const [itens, setItens] = useState<Item[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showItemModal, setShowItemModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Item | null>(null)
  const [movTarget, setMovTarget] = useState<Item | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type })

  const load = useCallback(async () => {
    if (IS_DEMO) {
      setItens(DEMO_ESTOQUE_ITENS as any)
      setCategorias(DEMO_ESTOQUE_CATEGORIAS as any)
      setLoading(false)
      return
    }
    try {
      const [ri, rc] = await Promise.all([fetch('/api/estoque/itens'), fetch('/api/estoque/categorias')])
      const [ji, jc] = await Promise.all([ri.json(), rc.json()])
      setItens(ji.data ?? [])
      setCategorias(jc.data ?? [])
    } catch { /* silent */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSaved = (i: Item) => {
    setItens(prev => {
      const idx = prev.findIndex(x => x.id === i.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = i; return next }
      return [i, ...prev]
    })
    showToast(editTarget ? 'Item atualizado!' : 'Item adicionado!')
  }

  const handleMovDone = (novoSaldo: number, msg: string) => {
    if (movTarget) setItens(prev => prev.map(x => x.id === movTarget.id ? { ...x, qtd_atual: novoSaldo } : x))
    showToast(msg)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este item e seu histórico de movimentações?')) return
    setDeleting(id)
    if (IS_DEMO) { await new Promise(r => setTimeout(r, 300)); setItens(prev => prev.filter(i => i.id !== id)); showToast('Item removido.'); setDeleting(null); return }
    try {
      const res = await fetch(`/api/estoque/itens/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setItens(prev => prev.filter(i => i.id !== id)); showToast('Item removido.')
    } catch { showToast('Erro ao remover item.', 'error') } finally { setDeleting(null) }
  }

  const filtered = itens.filter(i =>
    i.nome.toLowerCase().includes(search.toLowerCase()) ||
    (i.sku ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const emAlerta = itens.filter(isEstoqueBaixo)
  const valorTotal = itens.reduce((s, i) => s + i.qtd_atual * (i.custo ?? 0), 0)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#08090f' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: 'var(--sidebar-width, 240px)' }}>
        <style>{`@media (max-width: 1023px) { main { margin-left: 0 !important; } }`}</style>

        <Header
          title="Estoque"
          subtitle={`${itens.length} ${itens.length === 1 ? 'item' : 'itens'} · ${emAlerta.length} em alerta`}
          action={{ label: '+ Novo Item', onClick: () => { setEditTarget(null); setShowItemModal(true) } }}
        />

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'Itens cadastrados', value: itens.length, icon: <Boxes size={16} />, color: '#00d4ff', bg: 'rgba(0,212,255,0.12)' },
              { label: 'Em alerta', value: emAlerta.length, icon: <AlertTriangle size={16} />, color: '#ff5252', bg: 'rgba(255,82,82,0.12)' },
              { label: 'Valor em estoque', value: formatCurrency(valorTotal), icon: <Package size={16} />, color: '#00e676', bg: 'rgba(0,230,118,0.12)' },
              { label: 'Categorias', value: categorias.length, icon: <Boxes size={16} />, color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5 truncate">{s.label}</p>
                  <p className="text-xl font-bold text-white truncate">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Alerta de estoque baixo */}
          {emAlerta.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,82,82,0.07)', border: '1px solid rgba(255,82,82,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-red-400" />
                <h2 className="text-sm font-bold text-red-400">Estoque baixo ({emAlerta.length})</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {emAlerta.map(i => (
                  <button key={i.id} onClick={() => setMovTarget(i)} className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors hover:opacity-80"
                    style={{ background: 'rgba(255,82,82,0.12)', color: '#ff8a8a', border: '1px solid rgba(255,82,82,0.2)' }}>
                    {i.nome}: {i.qtd_atual}/{i.estoque_minimo} {i.unidade}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar item ou SKU..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-cyan-400/50"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
          </div>

          {/* Tabela */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {loading ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Carregando estoque...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-4xl mb-3">📦</p>
                <p className="text-gray-400 font-medium">{search ? 'Nenhum item encontrado' : 'Nenhum item cadastrado'}</p>
                <p className="text-gray-600 text-sm mt-1">{search ? 'Tente outro termo.' : 'Clique em "+ Novo Item" para começar.'}</p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['Item', 'Categoria', 'Saldo', 'Mínimo', 'Custo', 'Ações'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((i, idx) => {
                      const baixo = isEstoqueBaixo(i)
                      const isDel = deleting === i.id
                      return (
                        <tr key={i.id} className="group transition-colors hover:bg-white/[0.03]" style={{ borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">{i.nome}</span>
                              {baixo && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,82,82,0.15)', color: '#ff5252' }}>BAIXO</span>}
                            </div>
                            {i.sku && <span className="text-xs text-gray-600 font-mono">{i.sku}</span>}
                          </td>
                          <td className="px-4 py-3.5"><span className="text-sm text-gray-400">{i.categoria?.nome ?? '—'}</span></td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm font-bold" style={{ color: baixo ? '#ff5252' : '#ffffff' }}>{i.qtd_atual}</span>
                            <span className="text-xs text-gray-500 ml-1">{i.unidade}</span>
                          </td>
                          <td className="px-4 py-3.5"><span className="text-sm text-gray-500">{i.estoque_minimo} {i.unidade}</span></td>
                          <td className="px-4 py-3.5"><span className="text-sm text-gray-400">{formatCurrency(i.custo ?? 0)}</span></td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setMovTarget(i)} title="Movimentar" className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: '#00e676', background: 'rgba(0,230,118,0.1)' }}><ArrowDownCircle size={14} /></button>
                              <button onClick={() => { setEditTarget(i); setShowItemModal(true) }} title="Editar" className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: '#00d4ff', background: 'rgba(0,212,255,0.1)' }}><Pencil size={14} /></button>
                              <button onClick={() => handleDelete(i.id)} disabled={isDel} title="Remover" className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-50" style={{ color: '#ff5252', background: 'rgba(255,82,82,0.1)' }}>
                                {isDel ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {showItemModal && (
        <ItemModal item={editTarget} categorias={categorias} onClose={() => { setShowItemModal(false); setEditTarget(null) }} onSaved={handleSaved} isDemo={IS_DEMO} />
      )}
      {movTarget && (
        <MovModal item={movTarget} onClose={() => setMovTarget(null)} onDone={handleMovDone} isDemo={IS_DEMO} />
      )}

      <button onClick={() => { setEditTarget(null); setShowItemModal(true) }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 z-40 xl:hidden"
        style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)', boxShadow: '0 0 30px rgba(0,212,255,0.4)' }}>
        <Plus size={22} className="text-black" />
      </button>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  )
}
