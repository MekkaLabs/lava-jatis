'use client'

import { Clock, Car } from 'lucide-react'

type AtendStatus = 'aguardando' | 'em_andamento' | 'concluido' | 'cancelado'

interface Atendimento {
  id: string
  cliente_nome: string
  servico_nome?: string
  placa?: string
  modelo?: string
  status: AtendStatus
  created_at: string
}

interface FilaCardProps {
  atendimentos: Atendimento[]
}

const statusConfig: Record<AtendStatus, { label: string; color: string; bg: string }> = {
  aguardando:   { label: 'Aguardando',   color: '#ffd600', bg: 'rgba(255,214,0,0.12)' },
  em_andamento: { label: 'Em andamento', color: '#00d4ff', bg: 'rgba(0,212,255,0.12)' },
  concluido:    { label: 'Concluído',    color: '#00e676', bg: 'rgba(0,230,118,0.12)' },
  cancelado:    { label: 'Cancelado',    color: '#ff5252', bg: 'rgba(255,82,82,0.12)' },
}

function getWaitTime(createdAt: string) {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
  if (diff < 60) return `${diff} min`
  return `${Math.floor(diff / 60)}h${diff % 60 > 0 ? ` ${diff % 60}min` : ''}`
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default function FilaCard({ atendimentos }: FilaCardProps) {
  const ativos = atendimentos.filter(a => a.status === 'aguardando' || a.status === 'em_andamento')

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0,212,255,0.15)' }}
          >
            <Car size={14} style={{ color: '#00d4ff' }} />
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">Fila Atual</h2>
            <p className="text-xs text-gray-500">{ativos.length} veículo{ativos.length !== 1 ? 's' : ''} ativo{ativos.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <a href="/fila" className="text-xs text-cyan-400 hover:underline">Ver tudo →</a>
      </div>

      {ativos.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-3xl mb-2">🚗</p>
          <p className="text-gray-500 text-sm">Fila vazia no momento</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ativos.map(a => {
            const s = statusConfig[a.status]
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
                  style={{ background: 'rgba(0,212,255,0.15)' }}
                >
                  {getInitials(a.cliente_nome)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{a.cliente_nome}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {a.servico_nome || 'Serviço'}{a.placa ? ` · ${a.placa}` : ''}{a.modelo ? ` · ${a.modelo}` : ''}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: s.color, background: s.bg }}
                  >
                    {s.label}
                  </span>
                  <span className="text-xs text-gray-600 flex items-center gap-1">
                    <Clock size={10} />
                    {getWaitTime(a.created_at)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
