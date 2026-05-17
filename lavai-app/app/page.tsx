import Link from 'next/link'
import { Zap, ArrowRight } from 'lucide-react'

// Redirect to dashboard for now — landing is the static HTML
// In production, this would be the full Next.js landing page
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#08090f' }}>
      <div className="text-center px-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
            <Zap size={22} color="#000" strokeWidth={3} />
          </div>
          <span className="text-4xl font-bold grad-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            LAVAI
          </span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          O sistema operacional do lava-jato moderno
        </h1>
        <p className="text-gray-500 mb-10 max-w-sm mx-auto">
          Agendamento com IA, fila em tempo real e WhatsApp bot para lava-jatos brasileiros.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard"
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-black transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}>
            Abrir Dashboard
            <ArrowRight size={16} />
          </Link>
          <Link href="/agendar"
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Ver página de agendamento
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 max-w-sm mx-auto">
          {[
            { href: '/fila',      icon: '🚗', label: 'Fila ao Vivo' },
            { href: '/clientes',  icon: '👥', label: 'Clientes' },
            { href: '/agendar',   icon: '📅', label: 'Agendar' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="glass rounded-xl p-3 text-center hover-lift hover:border-white/20 transition-all">
              <div className="text-xl mb-1">{item.icon}</div>
              <p className="text-xs text-gray-400 font-medium">{item.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
