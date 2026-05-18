'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Clock,
  Users,
  DollarSign,
  Star,
  MessageCircle,
  BarChart2,
  Settings,
  Zap,
  LogOut,
  X,
  Menu,
  ChevronRight,
  UserCheck,
  Calendar,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/fila',         label: 'Fila ao Vivo', icon: Clock },
  { href: '/clientes',     label: 'Clientes',     icon: Users },
  { href: '/agendamentos', label: 'Agendamentos', icon: Calendar },
  { href: '/financeiro',   label: 'Financeiro',   icon: DollarSign },
  { href: '/equipe',       label: 'Equipe',       icon: UserCheck },
  { href: '/fidelidade',   label: 'Fidelidade',   icon: Star,           badge: 'PRO' },
  { href: '/whatsapp',     label: 'WhatsApp',     icon: MessageCircle,  badge: 'PRO' },
  { href: '/relatorio',    label: 'Relatório',    icon: BarChart2 },
  { href: '/configuracoes',label: 'Configurações',icon: Settings },
]

interface SidebarProps {
  onMobileOpen?: (open: boolean) => void
}

export default function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Expose toggle via custom event so Header hamburger can trigger it
  useEffect(() => {
    const handler = () => setMobileOpen(v => !v)
    window.addEventListener('sidebar:toggle', handler)
    return () => window.removeEventListener('sidebar:toggle', handler)
  }, [])

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}
          >
            <Zap size={15} color="#000" strokeWidth={3} />
          </div>
          <span
            className="font-bold text-lg tracking-tight"
            style={{
              background: 'linear-gradient(90deg,#00d4ff,#4f8eff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            LAVAI
          </span>
        </Link>

        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Lava-jato card */}
      <div className="mx-3 mb-4 px-3 py-2.5 rounded-xl flex-shrink-0" style={{
        background: 'rgba(0,212,255,0.06)',
        border: '1px solid rgba(0,212,255,0.12)',
      }}>
        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">Você está em</p>
        <p className="text-sm font-semibold text-white truncate">Lava-Jato do Marcos</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" style={{ boxShadow: '0 0 6px #00e676' }} />
          <span className="text-xs text-green-400 font-medium">Aberto agora</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active = isActive(href)
          return (
            <Link
              key={`${href}-${label}`}
              href={href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group overflow-hidden',
                active
                  ? 'text-cyan-400'
                  : 'text-gray-400 hover:text-white'
              )}
              style={active ? { background: 'rgba(0,212,255,0.08)' } : undefined}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = '' }}
            >
              {/* Active left border */}
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{ background: '#00d4ff', boxShadow: '0 0 8px #00d4ff' }}
                />
              )}

              <Icon
                size={17}
                className={cn(
                  'flex-shrink-0 transition-colors',
                  active ? 'text-cyan-400' : 'text-gray-500 group-hover:text-white'
                )}
              />
              <span className="flex-1 truncate">{label}</span>

              {badge && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
                  style={{ background: 'rgba(0,212,255,0.12)', color: '#00d4ff' }}
                >
                  {badge}
                </span>
              )}

              {active && <ChevronRight size={12} className="flex-shrink-0 text-cyan-400 opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom user section */}
      <div className="p-3 flex-shrink-0 space-y-2">
        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)', color: '#000' }}
          >
            LJ
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">Marcos Silva</p>
            <p className="text-[10px] text-gray-500 truncate">Plano Pro</p>
          </div>
        </div>

        {/* Logout */}
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-400 transition-all duration-200 group"
          style={{ border: '1px solid transparent' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,23,68,0.06)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,23,68,0.15)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = ''
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'
          }}
          onClick={() => {
            // logout logic handled by auth provider
            window.location.href = '/login'
          }}
        >
          <LogOut size={15} className="flex-shrink-0 transition-colors" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger button — rendered outside sidebar so it's always visible */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="fixed top-4 left-4 z-50 w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors lg:hidden"
          style={{ background: 'rgba(15,17,23,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}
          aria-label="Abrir menu"
        >
          <Menu size={18} />
        </button>
      )}

      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 transition-opacity duration-300"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out"
        style={{
          width: isMobile ? '260px' : '240px',
          transform: isMobile && !mobileOpen ? 'translateX(-100%)' : 'translateX(0)',
          background: 'rgba(8,9,15,0.97)',
          borderRight: '1px solid rgba(26,26,46,0.8)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
