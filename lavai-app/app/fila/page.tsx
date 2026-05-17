'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Badge } from '@/components/ui/Badge'
import { getInitials, getAvatarColor, getStatusLabel, formatCurrency } from '@/lib/utils'
import { queue as initialQueue, services } from '@/lib/mock-data'
import type { QueueItem, ServiceStatus } from '@/types'
import { CheckCircle2, MessageCircle, Clock, Trash2, Plus, Zap } from 'lucide-react'

const statusVariant: Record<ServiceStatus, 'cyan' | 'yellow' | 'green' | 'red'> = {
  in_progress: 'cyan',
  waiting: 'yellow',
  done: 'green',
  cancelled: 'red',
}

export default function FilaPage() {
  const [items, setItems] = useState<QueueItem[]>(initialQueue)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<'all' | ServiceStatus>('all')

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter)

  const advance = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      if (item.status === 'waiting') return { ...item, status: 'in_progress' as ServiceStatus, startedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
      if (item.status === 'in_progress') return { ...item, status: 'done' as ServiceStatus, finishedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), notified: true }
      return item
    }))
  }

  const remove = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const counts = {
    all: items.length,
    waiting: items.filter(i => i.status === 'waiting').length,
    in_progress: items.filter(i => i.status === 'in_progress').length,
    done: items.filter(i => i.status === 'done').length,
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#08090f' }}>
      <Sidebar />
      <main className="flex-1 ml-[220px] flex flex-col overflow-hidden">
        <Header
          title="Fila ao Vivo"
          subtitle={`${counts.waiting + counts.in_progress} carros ativos agora`}
          action={{ label: 'Adicionar', onClick: () => setShowAdd(true) }}
        />

        <div className="flex-1 overflow-y-auto p-5">
          {/* Filter tabs */}
          <div className="flex gap-2 mb-5">
            {([
              { key: 'all', label: 'Todos', count: counts.all },
              { key: 'in_progress', label: 'Em andamento', count: counts.in_progress },
              { key: 'waiting', label: 'Aguardando', count: counts.waiting },
              { key: 'done', label: 'Prontos', count: counts.done },
            ] as { key: 'all' | ServiceStatus; label: string; count: number }[]).map(tab => (
              <button key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === tab.key
                    ? 'text-cyan-400 bg-cyan-400/10 border border-cyan-400/20'
                    : 'text-gray-400 hover:text-white border border-white/7 bg-white/3'
                }`}>
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-lg font-bold ${filter === tab.key ? 'bg-cyan-400/20 text-cyan-300' : 'bg-white/5 text-gray-500'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Queue table */}
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Cliente / Veículo', 'Serviço', 'Chegou', 'Tempo', 'Status', 'Valor', 'Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, index) => (
                  <tr key={item.id}
                    className="group transition-colors hover:bg-white/3"
                    style={{ borderBottom: index < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>

                    {/* Cliente */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${getAvatarColor(item.customer.name)}`}>
                          {getInitials(item.customer.name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{item.customer.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{item.customer.plate} · {item.customer.carModel} {item.customer.carColor}</p>
                        </div>
                      </div>
                    </td>

                    {/* Serviço */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-300">{item.service}</p>
                      {item.assignedTo && <p className="text-xs text-gray-500 mt-0.5">👤 {item.assignedTo}</p>}
                    </td>

                    {/* Chegou */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-mono text-gray-300">{item.arrivedAt}</p>
                      {item.startedAt && <p className="text-xs text-cyan-400 font-mono">Iniciado: {item.startedAt}</p>}
                    </td>

                    {/* Tempo estimado */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-400">
                        <Clock size={13} />
                        <span>{item.estimatedMinutes} min</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[item.status]}>
                        {getStatusLabel(item.status)}
                      </Badge>
                    </td>

                    {/* Valor */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-green-400">{formatCurrency(item.price)}</span>
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {item.status !== 'done' && item.status !== 'cancelled' && (
                          <button
                            onClick={() => advance(item.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-cyan-400 hover:bg-cyan-400/10 transition-colors"
                            title={item.status === 'waiting' ? 'Iniciar' : 'Marcar pronto'}>
                            {item.status === 'waiting' ? <Zap size={14} /> : <CheckCircle2 size={14} />}
                          </button>
                        )}
                        {item.status === 'done' && (
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-green-400 bg-green-400/10" title="WhatsApp enviado">
                            <MessageCircle size={14} />
                          </div>
                        )}
                        <button
                          onClick={() => remove(item.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                          title="Remover">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🚗</p>
                <p className="text-gray-400 font-medium">Nenhum carro na fila</p>
                <p className="text-gray-600 text-sm mt-1">Adicione um novo cliente para começar</p>
              </div>
            )}
          </div>

          {/* Revenue summary */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Receita fila atual', value: formatCurrency(items.filter(i => i.status !== 'cancelled').reduce((a, i) => a + i.price, 0)), color: 'text-green-400' },
              { label: 'Receita já realizada', value: formatCurrency(items.filter(i => i.status === 'done').reduce((a, i) => a + i.price, 0)), color: 'text-cyan-400' },
              { label: 'A receber', value: formatCurrency(items.filter(i => i.status !== 'done' && i.status !== 'cancelled').reduce((a, i) => a + i.price, 0)), color: 'text-yellow-400' },
            ].map(s => (
              <div key={s.label} className="glass rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
