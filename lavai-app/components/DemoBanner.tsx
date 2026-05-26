'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Info, X } from 'lucide-react'
import { IS_DEMO } from '@/lib/demo'

// Aparece só em modo demo + nas rotas internas (não na landing/login/cadastro)
// + persiste dismissal por sessão (não fica enchendo o saco)
const INTERNAL_ROUTES = [
  '/dashboard', '/fila', '/clientes', '/agendamentos', '/financeiro',
  '/equipe', '/configuracoes', '/fidelidade', '/whatsapp', '/relatorio',
  '/insights', '/planos', '/admin',
]

export default function DemoBanner() {
  const pathname = usePathname() || ''
  const [dismissed, setDismissed] = useState(false)

  // Lê dismiss do sessionStorage (não persiste entre sessões)
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('demo_banner_dismissed') === '1') {
      setDismissed(true)
    }
  }, [])

  const isInternal = INTERNAL_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  if (!IS_DEMO || !isInternal || dismissed) return null

  function dismiss() {
    setDismissed(true)
    try { sessionStorage.setItem('demo_banner_dismissed', '1') } catch {/* no-op */}
  }

  return (
    <div
      role="status"
      className="sticky top-0 z-30 px-4 py-2 flex items-center gap-2 text-xs font-medium"
      style={{
        background: 'linear-gradient(90deg, rgba(255,214,0,0.16), rgba(255,152,0,0.16))',
        borderBottom: '1px solid rgba(255,214,0,0.3)',
        color: '#fbbf24',
      }}
    >
      <Info size={14} className="flex-shrink-0" />
      <span className="flex-1 truncate">
        <strong className="hidden sm:inline">Modo demo:</strong>{' '}
        dados não persistem ao recarregar. Conecte o Supabase pra salvar de verdade.
      </span>
      <button
        onClick={dismiss}
        aria-label="Fechar aviso"
        className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
      >
        <X size={13} />
      </button>
    </div>
  )
}
