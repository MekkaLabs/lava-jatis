'use client'

import Link from 'next/link'
import { Zap, ArrowLeft, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#08090f' }}
    >
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}
          >
            <Zap size={18} color="#000" strokeWidth={3} />
          </div>
          <span
            className="text-2xl font-bold tracking-tight"
            style={{
              background: 'linear-gradient(90deg,#00d4ff,#4f8eff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            LAVAI
          </span>
        </div>

        {/* 404 */}
        <p
          className="text-8xl font-black mb-4 leading-none"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.3), rgba(79,142,255,0.15))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'Space Grotesk, sans-serif',
          }}
        >
          404
        </p>

        <h1 className="text-xl font-bold text-white mb-2">Página não encontrada</h1>
        <p className="text-gray-500 text-sm mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}
          >
            <Home size={15} />
            Ir para Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <ArrowLeft size={15} />
            Voltar
          </button>
        </div>
      </div>
    </div>
  )
}
