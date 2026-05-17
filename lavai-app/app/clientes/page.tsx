'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { customers } from '@/lib/mock-data'
import { getInitials, getAvatarColor, formatCurrency } from '@/lib/utils'
import { Star, MessageCircle, Search, ChevronRight, TrendingUp } from 'lucide-react'
import type { Customer } from '@/types'

export default function ClientesPage() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.plate.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#08090f' }}>
      <Sidebar />
      <main className="flex-1 ml-[220px] flex flex-col overflow-hidden">
        <Header
          title="Clientes"
          subtitle={`${customers.length} clientes cadastrados`}
          action={{ label: 'Novo cliente', onClick: () => {} }}
        />

        <div className="flex-1 overflow-hidden flex">
          {/* List */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Total de clientes', value: customers.length, color: 'text-white' },
                { label: 'Receita total', value: formatCurrency(customers.reduce((a, c) => a + c.totalSpent, 0)), color: 'text-green-400' },
                { label: 'Visitas totais', value: customers.reduce((a, c) => a + c.totalVisits, 0), color: 'text-cyan-400' },
              ].map(s => (
                <div key={s.label} className="glass rounded-2xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome, placa ou telefone..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-cyan-400/50"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>

            {/* Table */}
            <div className="glass rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Cliente', 'Veículo', 'Visitas', 'Total gasto', 'Pontos', 'Última visita', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((customer, index) => (
                    <tr key={customer.id}
                      className="group transition-colors hover:bg-white/3 cursor-pointer"
                      style={{ borderBottom: index < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                      onClick={() => setSelected(customer)}>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${getAvatarColor(customer.name)}`}>
                            {getInitials(customer.name)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{customer.name}</p>
                            <p className="text-xs text-gray-500">{customer.phone}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-300 font-mono">{customer.plate}</p>
                        <p className="text-xs text-gray-500">{customer.carModel} {customer.carColor}</p>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp size={13} className="text-cyan-400" />
                          <span className="text-sm font-semibold text-white">{customer.totalVisits}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-green-400">{formatCurrency(customer.totalSpent)}</span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Star size={12} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-semibold text-yellow-400">{customer.loyaltyPoints}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-400">
                          {new Date(customer.lastVisit).toLocaleDateString('pt-BR')}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <ChevronRight size={15} className="text-gray-600 group-hover:text-cyan-400 transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side panel */}
          {selected && (
            <div className="w-[320px] flex-shrink-0 p-5 overflow-y-auto" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-start justify-between mb-4">
                <h2 className="font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Perfil do Cliente</h2>
                <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
              </div>

              <div className="text-center mb-5">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-3 ${getAvatarColor(selected.name)}`}>
                  {getInitials(selected.name)}
                </div>
                <h3 className="font-bold text-white text-lg">{selected.name}</h3>
                <p className="text-gray-500 text-sm">{selected.phone}</p>
                {selected.email && <p className="text-gray-500 text-xs mt-0.5">{selected.email}</p>}
              </div>

              <div className="space-y-3">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Visitas', value: selected.totalVisits, color: 'text-cyan-400' },
                    { label: 'Total gasto', value: formatCurrency(selected.totalSpent), color: 'text-green-400' },
                    { label: 'Ticket médio', value: formatCurrency(selected.totalSpent / selected.totalVisits), color: 'text-white' },
                    { label: 'Pontos LAVAI', value: selected.loyaltyPoints, color: 'text-yellow-400' },
                  ].map(s => (
                    <div key={s.label} className="glass rounded-xl p-3 text-center">
                      <p className={`text-lg font-bold ${s.color}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{s.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Vehicle */}
                <div className="glass rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Veículo</p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🚗</span>
                    <div>
                      <p className="font-semibold text-white">{selected.carModel}</p>
                      <p className="text-xs text-gray-500">{selected.carColor} · {selected.plate}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <button className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
                  style={{ background: 'rgba(37,211,102,0.15)', color: '#25d366', border: '1px solid rgba(37,211,102,0.2)' }}>
                  <MessageCircle size={15} />
                  Enviar mensagem WhatsApp
                </button>
                <button className="w-full py-2.5 rounded-xl text-sm font-semibold text-black flex items-center justify-center gap-2 transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}>
                  Adicionar à fila agora
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
