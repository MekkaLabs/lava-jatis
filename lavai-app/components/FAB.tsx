'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

// FAB (Floating Action Button) — atalho de 1 toque pra "Nova OS".
// Posicionado acima das BottomTabs para não conflitar com home indicator iOS.
// Aparece apenas nas páginas onde criar OS faz sentido.

const FAB_ROUTES = ['/dashboard', '/fila', '/clientes', '/agendamentos']

export default function FAB() {
  const pathname = usePathname() || ''
  const router = useRouter()

  const show = FAB_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  if (!show) return null

  // Navega pra /fila — a página da fila já tem ação de "Nova OS".
  // Quando o usuário toca, faz vibração leve se o navegador suportar.
  function handleClick() {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10)
      }
    } catch {/* ignora — vibration API opcional */}
    router.push('/fila?nova=1')
  }

  return (
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
  )
}
