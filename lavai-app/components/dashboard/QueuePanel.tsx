'use client'

import { useState } from 'react'
import { MessageCircle, CheckCircle2, MoreHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { getInitials, getAvatarColor, getStatusColor, getStatusLabel, formatCurrency } from '@/lib/utils'
import { queue as initialQueue } from '@/lib/mock-data'
import type { QueueItem, ServiceStatus } from '@/types'

export default function QueuePanel() {
  const [items, setItems] = useState<QueueItem[]>(initialQueue)

  const markDone = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, status: 'done' as ServiceStatus, finishedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), notified: true } : item
    ))
  }

  const statusVariant: Record<ServiceStatus, 'cyan' | 'yellow' | 'green' | 'red'> = {
    in_progress: 'cyan',
    waiting: 'yellow',
    done: 'green',
    cancelled: 'red',
  }

  return (
    <div className="glass rounded-2xl p-5 flex flex-col" style={{ minHeight: 400 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-white text-sm">Fila ao Vivo</h2>
          <p className="text-xs text-gray-500 mt-0.5">{items.filter(i => i.status !== 'done').length} carros na fila</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 live-dot"></span>
          <span className="text-xs text-green-400 font-semibold">Ao vivo</span>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2 flex-1 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id}
            className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>

            {/* Avatar */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${getAvatarColor(item.customer.name)}`}>
              {getInitials(item.customer.name)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white truncate">{item.customer.name}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500 font-mono">{item.customer.plate}</span>
                <span className="text-gray-600">·</span>
                <span className="text-xs text-gray-400">{item.service}</span>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={statusVariant[item.status]}>
                {getStatusLabel(item.status)}
              </Badge>
              <span className="text-xs font-semibold text-gray-300">{formatCurrency(item.price)}</span>

              {item.status !== 'done' && item.status !== 'cancelled' && (
                <button
                  onClick={() => markDone(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg flex items-center justify-center text-green-400 hover:bg-green-400/10"
                  title="Marcar como pronto">
                  <CheckCircle2 size={15} />
                </button>
              )}

              {item.status === 'done' && item.notified && (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-green-400 bg-green-400/10" title="WhatsApp enviado">
                  <MessageCircle size={14} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Receita da fila atual</span>
          <span className="font-semibold text-green-400">
            {formatCurrency(items.filter(i => i.status !== 'cancelled').reduce((acc, i) => acc + i.price, 0))}
          </span>
        </div>
      </div>
    </div>
  )
}
