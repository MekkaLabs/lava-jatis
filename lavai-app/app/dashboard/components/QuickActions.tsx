'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus, Users, Clock, DollarSign, BarChart2, MessageCircle } from 'lucide-react'
import Modal from '@/components/ui/Modal'

const shortcuts = [
  {
    label: 'Nova OS',
    icon: Plus,
    href: '/fila',
    key: 'N',
    color: '#00d4ff',
    bg: 'rgba(0,212,255,0.1)',
    border: 'rgba(0,212,255,0.2)',
    modal: true,
    modalTitle: 'Nova Ordem de Serviço',
  },
  {
    label: 'Novo Cliente',
    icon: Users,
    href: '/clientes',
    key: 'C',
    color: '#00e676',
    bg: 'rgba(0,230,118,0.1)',
    border: 'rgba(0,230,118,0.2)',
    modal: false,
  },
  {
    label: 'Ver Fila',
    icon: Clock,
    href: '/fila',
    key: 'F',
    color: '#ffd600',
    bg: 'rgba(255,214,0,0.1)',
    border: 'rgba(255,214,0,0.2)',
    modal: false,
  },
  {
    label: 'Financeiro',
    icon: DollarSign,
    href: '/financeiro',
    key: '$',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.1)',
    border: 'rgba(168,85,247,0.2)',
    modal: false,
  },
  {
    label: 'Relatório',
    icon: BarChart2,
    href: '/financeiro',
    key: 'R',
    color: '#4f8eff',
    bg: 'rgba(79,142,255,0.1)',
    border: 'rgba(79,142,255,0.2)',
    modal: false,
  },
  {
    label: 'WhatsApp',
    icon: MessageCircle,
    href: '/whatsapp',
    key: 'W',
    color: '#25d366',
    bg: 'rgba(37,211,102,0.1)',
    border: 'rgba(37,211,102,0.2)',
    modal: false,
  },
]

export default function QuickActions() {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)

  const handleClick = (s: typeof shortcuts[number]) => {
    if (s.modal) {
      setActiveModal(s.modalTitle ?? s.label)
      setModalOpen(true)
    } else {
      router.push(s.href)
    }
  }

  return (
    <>
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(26,26,46,0.8)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <h2 className="font-semibold text-white text-sm mb-3">Atalhos Rápidos</h2>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{"div::-webkit-scrollbar{display:none}"}</style>
          {shortcuts.map((s) => {
            const Icon = s.icon
            return (
              <button
                key={s.label}
                onClick={() => handleClick(s)}
                title={s.label + ' (' + s.key + ')'}
                className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 flex-shrink-0 group"
                style={{
                  background: s.bg,
                  border: '1px solid ' + s.border,
                  minWidth: '72px',
                }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLButtonElement).style.transform = ''
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow = ''
                }}
              >
                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  <Icon size={17} style={{ color: s.color }} />
                </div>

                {/* Label */}
                <span className="text-[10px] font-semibold text-white text-center leading-tight whitespace-nowrap">
                  {s.label}
                </span>

                {/* Keyboard shortcut badge */}
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-none"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace' }}
                >
                  {s.key}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Modal for Nova OS */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={activeModal ?? 'Nova OS'}
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Cancelar
            </button>
            <button
              onClick={() => { setModalOpen(false); router.push('/fila') }}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-black transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}
            >
              Ir para Fila
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Para criar uma nova Ordem de Serviço, acesse a página de Fila onde você pode registrar o cliente, veículo e serviço.
          </p>
          <div
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}
          >
            <Clock size={16} style={{ color: '#00d4ff' }} />
            <p className="text-sm text-cyan-400 font-medium">Fila ao vivo com atualização em tempo real</p>
          </div>
        </div>
      </Modal>
    </>
  )
}
