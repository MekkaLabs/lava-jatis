'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { todayTransactions, todayExpenses, dayClosings } from '@/lib/mock-data'
import { formatCurrency } from '@/lib/utils'
import type { PaymentMethod } from '@/types'
import {
  TrendingUp, TrendingDown, DollarSign, Car, CreditCard,
  Smartphone, Banknote, Receipt, ChevronDown, ChevronUp,
  CheckCircle, AlertCircle, Download, Plus, X,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

// ── Helpers ──────────────────────────────────────────────────
const paymentLabel: Record<PaymentMethod, string> = {
  pix:            'Pix',
  cartao_credito: 'Cartão Crédito',
  cartao_debito:  'Cartão Débito',
  dinheiro:       'Dinheiro',
}

const paymentIcon: Record<PaymentMethod, React.ReactNode> = {
  pix:            <Smartphone size={13} />,
  cartao_credito: <CreditCard  size={13} />,
  cartao_debito:  <CreditCard  size={13} />,
  dinheiro:       <Banknote    size={13} />,
}

const paymentColor: Record<PaymentMethod, string> = {
  pix:            '#00d4ff',
  cartao_credito: '#a855f7',
  cartao_debito:  '#4f8eff',
  dinheiro:       '#00e676',
}

const expenseCategoryLabel: Record<string, string> = {
  produto:     'Produto',
  funcionario: 'Funcionário',
  energia:     'Energia',
  manutencao:  'Manutenção',
  outro:       'Outro',
}

const expenseCategoryColor: Record<string, string> = {
  produto:     '#fbbf24',
  funcionario: '#a855f7',
  energia:     '#f87171',
  manutencao:  '#fb923c',
  outro:       '#6b7280',
}

// ── Computed ─────────────────────────────────────────────────
const totalRevenue  = todayTransactions.reduce((s, t) => s + t.price, 0)
const totalExpenses = todayExpenses.reduce((s, e) => s + e.amount, 0)
const netProfit     = totalRevenue - totalExpenses
const avgTicket     = Math.round(totalRevenue / todayTransactions.length)
const totalDiscount = todayTransactions.reduce((s, t) => s + (t.discount || 0), 0)

const paymentBreakdown = (['pix', 'cartao_credito', 'cartao_debito', 'dinheiro'] as PaymentMethod[]).map(method => {
  const txs = todayTransactions.filter(t => t.paymentMethod === method)
  const amount = txs.reduce((s, t) => s + t.price, 0)
  return { method, count: txs.length, amount, pct: Math.round((amount / totalRevenue) * 100) }
}).filter(p => p.count > 0)

const serviceBreakdown = todayTransactions.reduce((acc, t) => {
  acc[t.service] = (acc[t.service] || 0) + t.price
  return acc
}, {} as Record<string, number>)

const serviceChartData = Object.entries(serviceBreakdown)
  .sort((a, b) => b[1] - a[1])
  .map(([name, value]) => ({ name: name.split(' ')[0], value }))

const weekChart = dayClosings.slice().reverse().map(d => ({
  day:     new Date(d.date + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short' }),
  receita: d.totalRevenue,
  lucro:   d.netProfit,
}))

// ── Page ─────────────────────────────────────────────────────
export default function FinanceiroPage() {
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showCloseModal,   setShowCloseModal]   = useState(false)
  const [closed,           setClosed]           = useState(false)
  const [expandedTx,       setExpandedTx]       = useState<string | null>(null)
  const [activeTab,        setActiveTab]        = useState<'transacoes' | 'despesas'>('transacoes')

  return (
    <div className="flex min-h-screen" style={{ background: '#08090f' }}>
      <Sidebar />

      <div className="flex-1 ml-[220px] flex flex-col min-h-screen">
        <Header title="Financeiro" subtitle="Caixa do dia — 16 de maio de 2026" />

        <main className="flex-1 p-6 space-y-6">

          {/* Status banner */}
          {closed ? (
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl"
              style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)' }}>
              <CheckCircle size={18} className="text-green-400" />
              <span className="text-green-400 font-semibold text-sm">Caixa fechado às 19:05 — Relatório gerado com sucesso</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl"
              style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)' }}>
              <AlertCircle size={18} className="text-yellow-400" />
              <span className="text-yellow-400 font-semibold text-sm">
                Caixa aberto — {todayTransactions.length} transações registradas hoje
              </span>
              <div className="ml-auto flex gap-2">
                <button onClick={() => setShowExpenseModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Plus size={12} /> Lançar Despesa
                </button>
                <button onClick={() => setShowCloseModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-black"
                  style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
                  <CheckCircle size={12} /> Fechar Caixa
                </button>
              </div>
            </div>
          )}

          {/* Metric cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Receita Bruta',  value: formatCurrency(totalRevenue),  delta: '+12.5% vs ontem', up: true,  icon: <DollarSign size={18} />, color: '#00d4ff' },
              { label: 'Despesas',       value: formatCurrency(totalExpenses), delta: '-3% vs ontem',    up: false, icon: <TrendingDown size={18} />, color: '#f87171' },
              { label: 'Lucro Líquido', value: formatCurrency(netProfit),     delta: `Margem ${Math.round((netProfit/totalRevenue)*100)}%`, up: true, icon: <TrendingUp size={18} />, color: '#00e676' },
              { label: 'Ticket Médio',  value: formatCurrency(avgTicket),     delta: `${todayTransactions.length} serviços`, up: true, icon: <Car size={18} />, color: '#a855f7' },
            ].map(card => (
              <div key={card.label} className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.label}</span>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${card.color}18`, color: card.color }}>
                    {card.icon}
                  </div>
                </div>
                <p className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {card.value}
                </p>
                <div className="flex items-center gap-1">
                  {card.up
                    ? <TrendingUp size={11} className="text-green-400" />
                    : <TrendingDown size={11} className="text-red-400" />}
                  <span className={`text-xs font-medium ${card.up ? 'text-green-400' : 'text-red-400'}`}>{card.delta}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-3 gap-6">

            {/* LEFT — Transactions & Expenses */}
            <div className="col-span-2 space-y-4">

              {/* Tab switcher */}
              <div className="flex gap-1 p-1 rounded-xl w-fit"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {(['transacoes', 'despesas'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      activeTab === tab ? 'text-black' : 'text-gray-400 hover:text-white'
                    }`}
                    style={activeTab === tab ? { background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' } : {}}>
                    {tab === 'transacoes'
                      ? `Transações (${todayTransactions.length})`
                      : `Despesas (${todayExpenses.length})`}
                  </button>
                ))}
              </div>

              {/* Transactions */}
              {activeTab === 'transacoes' && (
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="grid text-xs font-semibold text-gray-500 uppercase px-5 py-3"
                    style={{ gridTemplateColumns: '1fr 160px 100px 90px 80px' }}>
                    <span>Cliente / Serviço</span>
                    <span>Pagamento</span>
                    <span>Funcionário</span>
                    <span className="text-right">Valor</span>
                    <span className="text-right">Hora</span>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
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
                            {expandedTx === tx.id
                              ? <ChevronUp size={12} className="text-gray-500" />
                              : <ChevronDown size={12} className="text-gray-500" />}
                          </div>
                        </div>
                        {expandedTx === tx.id && (
                          <div className="px-5 pb-3 pt-2 grid grid-cols-4 gap-4 text-xs"
                            style={{ background: 'rgba(0,212,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                            {[
                              ['ID', tx.id.toUpperCase()],
                              ['Placa', tx.customerPlate],
                              ['Desconto', tx.discount ? formatCurrency(tx.discount) : '—'],
                              ['Valor final', formatCurrency(tx.price)],
                            ].map(([label, value]) => (
                              <div key={label}>
                                <p className="text-gray-500 mb-1">{label}</p>
                                <p className="text-white font-semibold">{value}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-5 py-3"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,212,255,0.04)' }}>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>{todayTransactions.length} transações</span>
                      {totalDiscount > 0 && (
                        <span>Descontos: <span className="text-yellow-400">-{formatCurrency(totalDiscount)}</span></span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 mr-2">Total do dia</span>
                      <span className="text-lg font-bold text-green-400" style={{ fontFamily: 'Space Grotesk' }}>
                        {formatCurrency(totalRevenue)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Expenses */}
              {activeTab === 'despesas' && (
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    {todayExpenses.map(exp => (
                      <div key={exp.id} className="flex items-center gap-4 px-5 py-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ background: `${expenseCategoryColor[exp.category]}18`, color: expenseCategoryColor[exp.category] }}>
                          {exp.category[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">{exp.description}</p>
                          <p className="text-xs text-gray-500">{expenseCategoryLabel[exp.category]}</p>
                        </div>
                        <p className="text-sm font-bold text-red-400">-{formatCurrency(exp.amount)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-5 py-3"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(248,113,113,0.04)' }}>
                    <span className="text-sm text-gray-500">{todayExpenses.length} lançamentos</span>
                    <div>
                      <span className="text-xs text-gray-500 mr-2">Total despesas</span>
                      <span className="text-lg font-bold text-red-400" style={{ fontFamily: 'Space Grotesk' }}>
                        -{formatCurrency(totalExpenses)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Week bar chart */}
              <div className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Receita & Lucro — Últimos 7 dias</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Comparativo diário</p>
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Download size={11} /> Exportar
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weekChart} barSize={16} barGap={4}>
                    <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} width={42} />
                    <Tooltip
                      contentStyle={{ background: '#12152a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }}
                      formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="receita" name="Receita" fill="#00d4ff" opacity={0.6} radius={[4,4,0,0]} />
                    <Bar dataKey="lucro"   name="Lucro"   fill="#00e676" opacity={0.9} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RIGHT column */}
            <div className="space-y-4">

              {/* Payment methods */}
              <div className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <h3 className="text-sm font-bold text-white mb-4">Formas de Pagamento</h3>
                <div className="space-y-3">
                  {paymentBreakdown.sort((a, b) => b.amount - a.amount).map(p => (
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
                        <div className="h-1.5 rounded-full" style={{ width: `${p.pct}%`, background: paymentColor[p.method] }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{p.count} pagamentos</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue by service */}
              <div className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <h3 className="text-sm font-bold text-white mb-4">Receita por Serviço</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={serviceChartData} layout="vertical" barSize={10}>
                    <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `R$${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} width={55} />
                    <Tooltip
                      contentStyle={{ background: '#12152a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                      formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="value" radius={[0,4,4,0]}>
                      {serviceChartData.map((_, i) => (
                        <Cell key={i} fill={['#00d4ff','#a855f7','#4f8eff','#00e676','#fbbf24'][i % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Closing history */}
              <div className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white">Últimos Fechamentos</h3>
                  <Receipt size={14} className="text-gray-500" />
                </div>
                <div className="space-y-1">
                  {dayClosings.slice(0, 5).map(d => {
                    const date = new Date(d.date + 'T12:00')
                    return (
                      <div key={d.date}
                        className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg hover:bg-white/[0.02] cursor-pointer transition-colors"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div>
                          <p className="text-xs font-semibold text-white">
                            {date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                          </p>
                          <p className="text-xs text-gray-500">{d.totalCars} carros · {d.closedAt}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-green-400">{formatCurrency(d.netProfit)}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(d.totalRevenue)} bruto</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowExpenseModal(false)}>
          <div className="rounded-2xl p-6 w-full max-w-md"
            style={{ background: '#12152a', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Lançar Despesa</h3>
              <button onClick={() => setShowExpenseModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">Descrição</label>
                <input type="text" placeholder="Ex: Shampoo automotivo 5L"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">Valor (R$)</label>
                  <input type="number" placeholder="0,00"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">Categoria</label>
                  <select className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <option value="produto">Produto</option>
                    <option value="funcionario">Funcionário</option>
                    <option value="energia">Energia</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowExpenseModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                Cancelar
              </button>
              <button onClick={() => setShowExpenseModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-black"
                style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
                Lançar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day Close Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowCloseModal(false)}>
          <div className="rounded-2xl p-6 w-full max-w-sm text-center"
            style={{ background: '#12152a', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(0,230,118,0.12)' }}>
              <CheckCircle size={26} className="text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Fechar Caixa?</h3>
            <p className="text-sm text-gray-400 mb-5">
              Dia finalizado com{' '}
              <span className="text-green-400 font-bold">{formatCurrency(totalRevenue)}</span> de receita e{' '}
              <span className="text-green-400 font-bold">{formatCurrency(netProfit)}</span> de lucro líquido.
            </p>
            <div className="rounded-xl p-4 mb-5 text-left space-y-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                ['Receita Bruta',   formatCurrency(totalRevenue),   'text-cyan-400'],
                ['Despesas',        `-${formatCurrency(totalExpenses)}`, 'text-red-400'],
                ['Lucro Líquido',  formatCurrency(netProfit),       'text-green-400'],
                ['Carros lavados', String(todayTransactions.length), 'text-white'],
              ].map(([label, value, cls]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className={`font-bold ${cls}`}>{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCloseModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-400"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                Cancelar
              </button>
              <button onClick={() => { setClosed(true); setShowCloseModal(false) }}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-black"
                style={{ background: 'linear-gradient(135deg,#00e676,#00d4ff)' }}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
