'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import NovaOSSheet from '@/components/NovaOSSheet'

// FAB (Floating Action Button) — atalho de 1 toque pra "Nova OS".
// Abre um bottom sheet direto (sem trocar de página) = sensação de app nativo.
// Posicionado acima das BottomTabs para não conflitar com home indicator iOS.

const FAB_ROUTES = ['/dashboard', '/fila', '/clientes', '/agendamentos']

export default function FAB() {
  const pathname = usePathname() || ''
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const show = FAB_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  if (!show) return null

  function handleClick() {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10)
    } catch {/* vibration API opcional */}
    setOpen(true)
  }

  // Após criar a OS: se já estiver na fila, refresca pra mostrar a nova OS.
  function handleCreated() {
    if (pathname.startsWith('/fila')) router.refresh()
  }

  return (
    <>
      <button
        onClick={handleClick}
        aria-label="Nova OS"
        className="fixed right-4 z-30 w-14 h-14 rounded-full flex items-center justify-center lg:hidden active:scale-90 transition-transform"
        style={{
          background: 'linear-gradient(135deg, #00d4ff, #4f8eff)',
          bottom: 'calc(4.5rem + env(safe-area-inset-bottom))',
          boxShadow:
            '0 10px 30px rgba(0,212,255,0.35), 0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
        }}
      >
        <Plus size={26} color="#000" strokeWidth={3} />
      </button>

      <NovaOSSheet open={open} onClose={() => setOpen(false)} onCreated={handleCreated} />
    </>
  )
}
