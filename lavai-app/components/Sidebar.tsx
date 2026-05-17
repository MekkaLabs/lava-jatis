'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Car,
  Calendar,
  Users,
  MessageCircle,
  Star,
  DollarSign,
  Settings,
  Zap,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',    label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/fila',         label: 'Fila ao Vivo',    icon: Car },
  { href: '/agendamentos', label: 'Agendamentos',    icon: Calendar },
  { href: '/clientes',     label: 'Clientes',        icon: Users },
  { href: '/whatsapp',     label: 'WhatsApp Bot',    icon: MessageCircle,  badge: 'PRO' },
  { href: '/fidelidade',   label: 'Fidelidade',      icon: Star,           badge: 'PRO' },
  { href: '/financeiro',   label: 'Financeiro',      icon: DollarSign },
  { href: '/configuracoes',label: 'Configurações',   icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] z-40 flex flex-col"
      style={{ background: 'rgba(8,9,15,0.95)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>

      {/* Logo */}
      <div className="p-6 pb-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
            <Zap size={16} color="#000" strokeWidth={3} />
          </div>
          <span className="font-bold text-lg tracking-tight grad-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            LAVAI
          </span>
        </Link>
      </div>

      {/* Lava-jato name */}
      <div className="mx-4 mb-4 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs text-gray-500 font-medium">Você está em</p>
        <p className="text-sm font-semibold text-white truncate mt-0.5">Lava-Jato do Marcos</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-dot inline-block"></span>
          <span className="text-xs text-green-400 font-medium">Aberto agora</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'text-cyan-400 bg-cyan-400/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={17} className={isActive ? 'text-cyan-400' : 'text-gray-500 group-hover:text-white transition-colors'} />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }}>
                  {badge}
                </span>
              )}
              {isActive && <ChevronRight size={13} className="text-cyan-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom - plan info */}
      <div className="p-4">
        <div className="rounded-xl p-3" style={{
          background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(79,142,255,0.08))',
          border: '1px solid rgba(0,212,255,0.15)',
        }}>
          <div className="flex items-center gap-2 mb-1">
            <Star size={13} className="text-cyan-400" />
            <span className="text-xs font-bold text-cyan-400">Plano Pro</span>
          </div>
          <p className="text-xs text-gray-400">Próxima cobrança: 15/jun</p>
          <p className="text-xs font-semibold text-white mt-0.5">R$249/mês</p>
        </div>
      </div>
    </aside>
  )
}
