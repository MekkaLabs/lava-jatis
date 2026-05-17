'use client'

import { useState, useMemo } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { todayTransactions, todayExpenses, dayClosings } from '@/lib/mock-data'
import { formatCurrency } from '@/lib/utils'
import type { PaymentMethod } from '@/types'
import {
  TrendingUp, TrendingDown, DollarSign, Car, CreditCard, Smartphone,
  Banknote, Receipt, Download, Plus, X, ChevronDown, ChevronUp,
  CheckCircle, AlertCircle, ArrowUpRight, ArrowDownRight, FileText,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, BarChart, Bar, Cell,
} from 'recharts'

// ── Types & helpers ────────────────────────────────────────────

const paymentLabel: Record<PaymentMethod, string> = {
  pix: 'Pix', cartao_credito: 'Cartão Crédito', cartao_debito: 'Cartão Débito', dinheiro: 'Dinheiro',
}
const paymentIcon: Record<PaymentMethod, React.ReactNode> = {
  pix: <Smartphone size={13} />, cartao_credito: <CreditCard size={13} />,
  cartao_debito: <CreditCard size={13} />, dinheiro: <Banknote size={13} />,
}
const paymentColor: Record<PaymentMethod, string> = {
  pix: '#00d4ff', cartao_credito: '#a855f7', cartao_debito: '#4f8eff', dinheiro: '#00e676',
}
const expenseCategoryLabel: Record<string, string> = {
  produto: 'Produto', funcionario: 'Funcionário', energia: 'Energia', manutencao: 'Manutenção', outro: 'Outro',
}
const expenseCategoryColor: Record<string, string> = {
  produto: '#fbbf24', funcionario: '#a855f7', energia: '#f87171', manutencao: '#fb923c', outro: '#6b7280',
}

type DateRange = 'hoje' | 'semana' | 'mes' | 'mes_ant' | 'custom'

function exportCSV(data: any[], filename: string) {
  const headers = ['Data', 'Cliente', 'Serviço', 'Valor', 'Pagamento', 'Status']
  const rows = data.map(a => [a.completedAt || a.data, a.customerName || a.cliente, a.service || a.servico, a.price || a.valor, paymentLabel[(a.paymentMethod || a.pagamento) as PaymentMethod] || '', 'concluido'])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = filename; link.click()
  URL.revokeObjectURL(url)
}

// Generate 30-day chart data
function gen30Days() {
  const days = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    const receita = Math.round(800 + Math.random() * 1400)
    const despesas = Math.round(200 + Math.random() * 400)
    days.push({ label, receita, despesas, lucro: receita - despesas })
  }
  return days
}
const chartData30 = gen30Days()

// Top services mock
const topServicos = [
  { nome: 'Lavagem Completa', qtd: 42, receita: 5040, pct: 38 },
  { nome: 'Polimento', qtd: 18, receita: 4500, pct: 28 },
  { nome: 'Lavagem Simples', qtd: 55, receita: 2750, pct: 20 },
  { nome: 'Higienização Interna', qtd: 9, receita: 1620, pct: 9 },
  { nome: 'Cristalização', qtd: 3, receita: 900, pct: 5 },
]

const totalRevenue = todayTransactions.reduce((s, t) => s + t.price, 0)
const totalExpenses = todayExpenses.reduce((s, e) => s + e.amount, 0)
const netProfit = totalRevenue - totalExpenses
const avgTicket = Math.round(totalRevenue / (todayTransactions.length || 1))

const paymentBreakdown = (['pix', 'cartao_credito', 'cartao_debito', 'dinheiro'] as PaymentMethod[]).map(method => {
  const txs = todayTransactions.filter(t => t.paymentMethod === method)
  const amount = txs.reduce((s, t) => s + t.price, 0)
  return { method, count: txs.length, amount, pct: Math.round((amount / (totalRevenue || 1)) * 100) }
}).filter(p => p.count > 0).sort((a, b) => b.amount - a.amount)

// ── Nova Despesa Modal ────────────────────────────────────────
interface NovaDespesaModalProps { onClose: () => void }
function NovaDespesaModal({ onClose }: NovaDespesaModalProps) {
  const [form, setForm] = useState({ descricao: '', valor: '', categoria: 'produto', data: new Date().toISOString().slice(0, 10) })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.descricao || !form.valor) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-md"
        style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.12)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Nova Despesa</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"><X size={16} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">Descrição *</label>
            <input type="text" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              placeholder="Ex: Shampoo automotivo 5L"
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">Valor (R$) *</label>
              <input type="number" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                placeholder="0,00" className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">Categoria</label>
              <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(30,30,50,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <option value="produto">Produto</option>
                <option value="funcionario">Funcionário</option>
                <option value="energia">Energia</option>
                <option value="manutencao">Manutenção</option>
                <option value="marketing">Marketing</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">Data</label>
            <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
              style={{ background: 'rgba(30,30,50,0.9)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
            {saving ? 'Lançando...' : 'Lançar Despesa'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Custom Tooltip ────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl p-3 text-xs" style={{ background: '#12152a', border: '1px solid rgba(255,255,255,0.1)' }}>
      <p className="text-gray-400 mb-2 font-semibold">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-gray-300">{p.name}:</span>
          <span className="font-bold text-white">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function FinanceiroPage() {
  const [dateRange, setDateRange] = useState<DateRange>('mes')
  const [showDespesaModal, setShowDespesaModal] = useState(false)
  const [expandedTx, setExpandedTx] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'atendimentos' | 'despesas'>('atendimentos')

  const dateRanges: { key: DateRange; label: string }[] = [
    { key: 'hoje', label: 'Hoje' },
    { key: 'semana', label: 'Esta semana' },
    { key: 'mes', label: 'Este mês' },
    { key: 'mes_ant', label: 'Mês anterior' },
    { key: 'custom', label: 'Personalizado' },
  ]

  const kpiCards = [
    {
      label: 'Receita Total', value: formatCurrency(totalRevenue), delta: '+12.5% vs período ant.',
      up: true, icon: <DollarSign size={18} />, color: '#00d4ff',
    },
    {
      label: 'Despesas', value: formatCurrency(totalExpenses), delta: '-3% vs período ant.',
      up: false, icon: <TrendingDown size={18} />, color: '#f87171',
    },
    {
      label: 'Lucro Líquido', value: formatCurrency(netProfit), delta: `Margem ${Math.round((netProfit / (totalRevenue || 1)) * 100)}%`,
      up: true, icon: <TrendingUp size={18} />, color: '#00e676',
    },
    {
      label: 'Ticket Médio', value: formatCurrency(avgTicket), delta: `${todayTransactions.length} atendimentos`,
      up: true, icon: <Car size={18} />, color: '#a855f7',
    },
  ]

  return (
    <div className="flex min-h-screen" style={{ background: '#08090f' }}>
      <Sidebar />
      <div className="flex-1 ml-[220px] flex flex-col min-h-screen">
        <Header title="Financeiro" subtitle="Análise financeira do seu lava-jato" />

        <main className="flex-1 p-6 space-y-6">

          {/* Date Range + Export */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {dateRanges.map(({ key, label }) => (
                <button key={key} onClick={() => setDateRange(key)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${dateRange === key ? 'text-black' : 'text-gray-400 hover:text-white'}`}
                  style={dateRange === key ? { background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' } : {}}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={() => exportCSV(todayTransactions, `financeiro-${new Date().toISOString().slice(0, 10)}.csv`)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Download size={13} /> Exportar CSV
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            {kpiCards.map(card => (
              <div key={card.label} className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.label}</span>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${card.color}18`, color: card.color }}>{card.icon}</div>
                </div>
                <p className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{card.value}</p>
                <div className="flex items-center gap-1">
                  {card.up
                    ? <ArrowUpRight size={12} className="text-green-400" />
                    : <ArrowDownRight size={12} className="text-red-400" />}
                  <span className={`text-xs font-medium ${card.up ? 'text-green-400' : 'text-red-400'}`}>{card.delta}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Chart */}
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Receita × Despesas × Lucro — Últimos 30 dias</h3>
                <p className="text-xs text-gray-500 mt-0.5">Visão financeira diária</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData30} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e676" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}
                  interval={4} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} width={42} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af', paddingTop: 8 }} />
                <Area type="monotone" dataKey="receita" name="Receita" stroke="#00d4ff" strokeWidth={2} fill="url(#colorReceita)" />
                <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#f87171" strokeWidth={1.5} fill="url(#colorDespesas)" />
                <Area type="monotone" dataKey="lucro" name="Lucro" stroke="#00e676" strokeWidth={2} fill="url(#colorLucro)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Middle grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Top Serviços */}
            <div className="col-span-2 rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="text-sm font-bold text-white">Top Serviços</h3>
                <span className="text-xs text-gray-500">Este mês</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['Serviço', 'Atendimentos', 'Receita', '% Total'].map(h => (
                      <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topServicos.map((s, i) => (
                    <tr key={s.nome} style={{ borderBottom: i < topServicos.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                            style={{ background: `${['#00d4ff','#a855f7','#4f8eff','#00e676','#fbbf24'][i]}18`, color: ['#00d4ff','#a855f7','#4f8eff','#00e676','#fbbf24'][i] }}>
                            {i + 1}
                          </div>
                          <span className="text-sm text-white font-medium">{s.nome}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3"><span className="text-sm text-gray-300">{s.qtd}×</span></td>
                      <td className="px-5 py-3"><span className="text-sm font-semibold text-green-400">{formatCurrency(s.receita)}</span></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${s.pct}%`, background: ['#00d4ff','#a855f7','#4f8eff','#00e676','#fbbf24'][i] }} />
                          </div>
                          <span className="text-xs text-gray-400 w-8 text-right">{s.pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Formas de pagamento */}
            <div className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 className="text-sm font-bold text-white mb-4">Formas de Pagamento</h3>
              <div className="space-y-4">
                {paymentBreakdown.map(p => (
                  <div key={p.method}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2" style={{ color: paymentColor[p.method] }}>
                        {paymentIcon[p.method]}
                        <span className="text-sm font-medium">{paymentLabel[p.method]}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-white">{formatCurrency(p.amount)}</span>
                        <span className="text-xs text-gray-500 ml-1">{p.pct}%</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${p.pct}%`, background: paymentColor[p.method] }} />
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{p.count} pagamentos</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom: Atendimentos list + Despesas */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {(['atendimentos', 'despesas'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === tab ? 'text-black' : 'text-gray-400 hover:text-white'}`}
                    style={activeTab === tab ? { background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' } : {}}>
                    {tab === 'atendimentos' ? `Atendimentos (${todayTransactions.length})` : `Despesas (${todayExpenses.length})`}
                  </button>
                ))}
              </div>
              {activeTab === 'despesas' && (
                <button onClick={() => setShowDespesaModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-black"
                  style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
                  <Plus size={12} /> Nova Despesa
                </button>
              )}
            </div>

            {activeTab === 'atendimentos' && (
              <>
                <div className="grid text-xs font-semibold text-gray-500 uppercase px-5 py-3"
                  style={{ gridTemplateColumns: '1fr 160px 100px 90px 80px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span>Cliente / Serviço</span><span>Pagamento</span><span>Funcionário</span>
                  <span className="text-right">Valor</span><span className="text-right">Hora</span>
                </div>
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  {todayTransactions.map(tx => (
                    <div key={tx.id}>
                      <div className="grid items-center px-5 py-3.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                        style={{ gridTemplateColumns: '1fr 160px 100px 90px 80px' }}
                        onClick={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}>
                        <div>
                          <p className="text-sm font-semibold text-white">{tx.customerName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{tx.customerPlate} · {tx.service}</p>
                        </div>
                        <div className="flex items-center gap-1.5" style={{ color: paymentColor[tx.paymentMethod] }}>
                          {paymentIcon[tx.paymentMethod]}
                          <span className="text-xs font-medium">{paymentLabel[tx.paymentMethod]}</span>
                        </div>
                        <span className="text-sm text-gray-400">{tx.employee}</span>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-400">{formatCurrency(tx.price)}</p>
                          {tx.discount && <p className="text-xs text-gray-500">-{formatCurrency(tx.discount)}</p>}
                        </div>
                        <div className="text-right flex items-center justify-end gap-1.5">
                          <span className="text-sm text-gray-400">{tx.completedAt}</span>
                          {expandedTx === tx.id ? <ChevronUp size={12} className="text-gray-500" /> : <ChevronDown size={12} className="text-gray-500" />}
                        </div>
                      </div>
                      {expandedTx === tx.id && (
                        <div className="px-5 pb-3 pt-2 grid grid-cols-4 gap-4 text-xs"
                          style={{ background: 'rgba(0,212,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                          {[['ID', tx.id.toUpperCase()], ['Placa', tx.customerPlate], ['Desconto', tx.discount ? formatCurrency(tx.discount) : '—'], ['Valor final', formatCurrency(tx.price)]].map(([label, value]) => (
                            <div key={label}><p className="text-gray-500 mb-1">{label}</p><p className="text-white font-semibold">{value}</p></div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-5 py-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,212,255,0.02)' }}>
                  <span className="text-sm text-gray-500">{todayTransactions.length} atendimentos</span>
                  <div><span className="text-xs text-gray-500 mr-2">Total</span>
                    <span className="text-lg font-bold text-green-400" style={{ fontFamily: 'Space Grotesk' }}>{formatCurrency(totalRevenue)}</span>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'despesas' && (
              <>
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  {todayExpenses.length === 0 ? (
                    <div className="py-12 text-center">
                      <FileText size={28} className="mx-auto mb-3 text-gray-600" />
                      <p className="text-sm text-gray-500">Nenhuma despesa lançada</p>
                    </div>
                  ) : todayExpenses.map(exp => (
                    <div key={exp.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: `${expenseCategoryColor[exp.category] || '#6b7280'}18`, color: expenseCategoryColor[exp.category] || '#6b7280' }}>
                        {exp.category[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{exp.description}</p>
                        <p className="text-xs text-gray-500">{expenseCategoryLabel[exp.category] || exp.category}</p>
                      </div>
                      <p className="text-sm font-bold text-red-400">-{formatCurrency(exp.amount)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-5 py-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(248,113,113,0.03)' }}>
                  <span className="text-sm text-gray-500">{todayExpenses.length} lançamentos</span>
                  <div><span className="text-xs text-gray-500 mr-2">Total despesas</span>
                    <span className="text-lg font-bold text-red-400" style={{ fontFamily: 'Space Grotesk' }}>-{formatCurrency(totalExpenses)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

        </main>
      </div>

      {showDespesaModal && <NovaDespesaModal onClose={() => setShowDespesaModal(false)} />}
    </div>
  )
}
