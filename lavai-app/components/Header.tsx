'use client'

import { useState, useEffect } from 'react'
import { Bell, Search, Plus } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  action?: {
    label: string
    onClick: () => void
  }
  unreadCount?: number
}

export default function Header({ title, subtitle, action, unreadCount = 3 }: HeaderProps) {
  const [timeStr, setTimeStr] = useState('')
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTimeStr(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
      setDateStr(now.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header
      className="flex-shrink-0 h-16 flex items-center justify-between px-4 md:px-6 gap-4"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(8,9,15,0.85)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      {/* Mobile spacer (hamburger is fixed positioned in sidebar) */}
      <div className="w-9 flex-shrink-0 lg:hidden" />

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-bold text-white truncate" style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] text-gray-500 mt-0.5 truncate capitalize">{subtitle}</p>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Live clock — desktop only */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" style={{ boxShadow: '0 0 6px #00e676', animation: 'pulse 2s infinite' }} />
          <span className="text-xs text-gray-400 capitalize">{dateStr}</span>
          <span className="text-xs font-mono font-semibold text-cyan-400">{timeStr}</span>
        </div>

        {/* Search */}
        <button
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          aria-label="Buscar"
        >
          <Search size={15} />
        </button>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          aria-label="Notificações"
        >
          <Bell size={15} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-[9px] font-bold text-black leading-none"
              style={{
                minWidth: '16px',
                height: '16px',
                padding: '0 3px',
                background: '#00d4ff',
                boxShadow: '0 0 8px rgba(0,212,255,0.6)',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* CTA button */}
        {action && (
          <button
            onClick={action.onClick}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-black transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}
          >
            <Plus size={13} />
            {action.label}
          </button>
        )}
      </div>
    </header>
  )
}
