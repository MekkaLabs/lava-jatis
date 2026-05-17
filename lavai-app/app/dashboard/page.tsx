'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import MetricsRow from '@/components/dashboard/MetricsRow'
import QueuePanel from '@/components/dashboard/QueuePanel'
import RevenueChart from '@/components/dashboard/RevenueChart'
import AIInsightPanel from '@/components/dashboard/AIInsightPanel'
import { appointments } from '@/lib/mock-data'
import { formatCurrency } from '@/lib/utils'
import { Calendar, ChevronRight, MessageCircle } from 'lucide-react'

export default function DashboardPage() {
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Dashboard"
        subtitle="Sexta-feira, 15 de maio de 2026"
        action={{ label: 'Adicionar à fila', onClick: () => setShowAddModal(true) }}
      />

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Metrics */}
        <MetricsRow />

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Queue - takes 2 cols */}
          <div className="xl:col-span-2">
            <QueuePanel />
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <AIInsightPanel />

            {/* Next appointments */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-cyan-400" />
                  <h2 className="font-semibold text-white text-sm">Próximos Agendamentos</h2>
                </div>
                <button className="text-xs text-gray-500 hover:text-cyan-400 transition-colors">Ver todos</button>
              </div>

              <div className="space-y-2">
                {appointments.slice(0, 3).map(apt => (
                  <div key={apt.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-1 h-8 rounded-full bg-cyan-400/60 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{apt.customer.name}</p>
                      <p className="text-xs text-gray-500">{apt.service}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-mono text-cyan-400">
                        {new Date(apt.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-green-400 font-semibold">{formatCurrency(apt.price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-3 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                Gerenciar agenda
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <RevenueChart />

          {/* WhatsApp summary */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(37,211,102,0.15)' }}>
                <MessageCircle size={14} style={{ color: '#25d366' }} />
              </div>
              <div>
                <h2 className="font-semibold text-white text-sm">WhatsApp Bot</h2>
                <p className="text-xs text-gray-500">Hoje</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-dot"></span>
                <span className="text-xs text-green-400 font-semibold">Ativo</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Mensagens', value: '47', color: 'text-white' },
                { label: 'Agendamentos', value: '8', color: 'text-cyan-400' },
                { label: 'Notificações', value: '18', color: 'text-green-400' },
              ].map(m => (
                <div key={m.label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className={`text-xl font-bold ${m.color}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{m.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Recent messages */}
            <div className="space-y-2">
              {[
                { name: 'Bruno Lima', msg: 'Meu carro tá pronto?', time: '14:32', type: 'recv' },
                { name: 'LAVAI Bot', msg: '✅ Sim! Pode buscar, está pronto.', time: '14:32', type: 'sent' },
                { name: 'Rafael Souza', msg: 'Qual o tempo de espera?', time: '14:18', type: 'recv' },
              ].map((m, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl" style={{ background: 'rgba(37,211,102,0.04)', border: '1px solid rgba(37,211,102,0.08)' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                    style={{ background: m.type === 'recv' ? 'rgba(255,255,255,0.1)' : 'rgba(37,211,102,0.2)' }}>
                    {m.type === 'recv' ? '👤' : '🤖'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: m.type === 'sent' ? '#25d366' : '#fff' }}>{m.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{m.msg}</p>
                  </div>
                  <span className="text-xs text-gray-600 flex-shrink-0">{m.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add to queue modal (simple) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowAddModal(false)}>
          <div className="glass rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Adicionar à Fila
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Nome do cliente', placeholder: 'João Silva', type: 'text' },
                { label: 'Placa do veículo', placeholder: 'ABC-1234', type: 'text' },
                { label: 'WhatsApp', placeholder: '(11) 99999-9999', type: 'tel' },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs text-gray-400 font-medium block mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-cyan-400/50"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1">Serviço</label>
                <select className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-cyan-400/50"
                  style={{ background: '#12152a', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <option>Lavagem Simples — R$40</option>
                  <option>Lavagem Completa — R$80</option>
                  <option>Lavagem + Cera — R$110</option>
                  <option>Polimento — R$180</option>
                  <option>Higienização Interna — R$120</option>
                  <option>Cristalização — R$250</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                Cancelar
              </button>
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}>
                Adicionar ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
