'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Clock, Users, Calendar, User } from 'lucide-react'

// Bottom navigation para mobile (PWA).
// Visível apenas em <lg (mobile/tablet) e somente em rotas internas autenticadas.
// Sidebar continua sendo a navegação em desktop.

const TABS = [
  { href: '/dashboard',     label: 'Início',  icon: LayoutDashboard },
  { href: '/fila',          label: 'Fila',    icon: Clock },
  { href: '/clientes',      label: 'Clientes', icon: Users },
  { href: '/agendamentos',  label: 'Agenda',  icon: Calendar },
  { href: '/configuracoes', label: 'Perfil',  icon: User },
] as const

const INTERNAL_ROUTES = [
  '/dashboard', '/fila', '/clientes', '/agendamentos', '/financeiro',
  '/equipe', '/configuracoes', '/fidelidade', '/whatsapp', '/relatorio',
  '/insights', '/planos',
]

function isInternalRoute(pathname: string): boolean {
  return INTERNAL_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
}

export default function BottomTabs() {
  const pathname = usePathname() || ''
  if (!isInternalRoute(pathname)) return null

  return (
    <>
      {/* Spacer pra que conteúdo não fique embaixo das tabs */}
      <div className="h-16 lg:hidden" aria-hidden style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 lg:hidden"
        style={{
          background: 'rgba(8,9,15,0.94)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        aria-label="Navegação principal"
      >
        <div className="grid grid-cols-5 h-16">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform relative"
                style={{ color: active ? '#00d4ff' : 'rgba(255,255,255,0.55)' }}
                aria-current={active ? 'page' : undefined}
              >
                {active && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full"
                    style={{ background: 'linear-gradient(90deg,#00d4ff,#4f8eff)' }}
                  />
                )}
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-semibold tracking-tight">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
