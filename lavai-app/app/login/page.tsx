'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Demo credentials (only used when Supabase is not configured)
const DEMO_LOGIN    = 'admin'
const DEMO_PASSWORD = 'Am0cmph3@'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    setIsDemoMode(!url || url.includes('seu-projeto'))
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // ── Demo mode ────────────────────────────────────────────
    if (isDemoMode) {
      if (email === DEMO_LOGIN && password === DEMO_PASSWORD) {
        document.cookie = 'lavai_demo=true; path=/; max-age=86400'
        router.push('/dashboard')
      } else {
        setError('Login ou senha incorretos.')
        setLoading(false)
      }
      return
    }

    // ── Supabase mode ─────────────────────────────────────────
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
      if (authErr) {
        setError(authErr.message === 'Invalid login credentials'
          ? 'Email ou senha incorretos.'
          : authErr.message)
        setLoading(false)
        return
      }
      router.push('/dashboard')
    } catch {
      setError('Erro ao conectar. Verifique sua conexão.')
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#08090f' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1
            className="text-4xl font-black tracking-tight"
            style={{ color: '#00d4ff' }}
          >
            LAVAI
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Gerencie seu lava-jato com inteligencia</p>
        </div>

        {/* Demo mode banner */}
        {isDemoMode && (
          <div className="mb-4 rounded-xl px-4 py-3 text-sm text-center"
            style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)', color: '#00d4ff' }}>
            🎮 <strong>Modo Demo</strong> — sem banco de dados
          </div>
        )}

        {/* Card */}
        <div
          className="rounded-2xl border p-8"
          style={{ backgroundColor: '#0d0e1a', borderColor: '#1a1b2e' }}
        >
          <h2 className="text-white text-xl font-semibold mb-6">Entrar na sua conta</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                {isDemoMode ? 'Login' : 'Email'}
              </label>
              <input
                type={isDemoMode ? 'text' : 'email'}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder={isDemoMode ? 'admin' : 'seu@email.com'}
                className="w-full rounded-lg px-4 py-3 text-white text-sm outline-none transition"
                style={{ backgroundColor: '#161728', border: '1px solid #2a2b3d' }}
                onFocus={e => (e.target.style.borderColor = '#00d4ff')}
                onBlur={e => (e.target.style.borderColor = '#2a2b3d')}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-lg px-4 py-3 text-white text-sm outline-none transition"
                style={{ backgroundColor: '#161728', border: '1px solid #2a2b3d' }}
                onFocus={e => (e.target.style.borderColor = '#00d4ff')}
                onBlur={e => (e.target.style.borderColor = '#2a2b3d')}
              />
            </div>

            {error && (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{ backgroundColor: '#1f0a0a', color: '#ff6b6b', border: '1px solid #3d1010' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-3 font-semibold text-sm transition-opacity disabled:opacity-60"
              style={{ backgroundColor: '#00d4ff', color: '#08090f' }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link
              href="/recuperar-senha"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Esqueci minha senha
            </Link>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Nao tem uma conta?{' '}
          <Link href="/cadastro" style={{ color: '#00d4ff' }} className="font-medium hover:opacity-80 transition-opacity">
            Criar conta gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
