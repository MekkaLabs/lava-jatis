'use client'

import { Bell, Search, Plus } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function Header({ title, subtitle, action }: HeaderProps) {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <header className="h-16 flex items-center justify-between px-6"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,9,15,0.7)', backdropFilter: 'blur(20px)' }}>

      {/* Title */}
      <div>
        <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {title}
        </h1>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Live clock */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-dot"></span>
          <span className="text-xs text-gray-400 capitalize">{dateStr}</span>
          <span className="text-xs font-mono font-semibold text-cyan-400">{timeStr}</span>
        </div>

        {/* Search */}
        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Search size={16} />
        </button>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400"></span>
        </button>

        {/* Action button */}
        {action && (
          <button
            onClick={action.onClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-black transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}>
            <Plus size={15} />
            {action.label}
          </button>
        )}
      </div>
    </header>
  )
}
