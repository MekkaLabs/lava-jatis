'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, XCircle } from 'lucide-react'
import { DEMO_CREDENTIALS } from '@/lib/demo'

const DEMO_LOGIN    = DEMO_CREDENTIALS.login
const DEMO_PASSWORD = DEMO_CREDENTIALS.password

const baseInput =
  'w-full rounded-xl px-4 py-3 text-white text-sm outline-none transition bg-[#101122] border border-[#2a2b3d] focus:border-[#00d4ff] placeholder:text-gray-600'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const flag = (process.env.NEXT_PUBLIC_LAVAI_DEMO_ENABLED ?? '').toLowerCase() === 'true'
    // Em produção, só ativa demo com flag explícita
    const demoActive =
      process.env.NODE_ENV === 'production'
        ? flag
        : flag || !url || url.includes('seu-projeto')
    setIsDemoMode(demoActive)
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

    // ── Supabase mode — via API route server-side ─────────────
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Erro ao entrar. Tente novamente.')
        setLoading(false)
        return
      }

      // Sessão setada via cookie pelo servidor — redireciona
      router.push('/dashboard')
      router.refresh()
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        setError('Tempo esgotado. Verifique sua conexão e tente novamente.')
      } else {
        setError(`Erro de conexão: ${e?.message ?? 'desconhecido'}`)
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#08090f' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight" style={{ color: '#00d4ff' }}>LAVAI</h1>
          <p className="text-gray-400 mt-1 text-sm">Gerencie seu lava-jato com inteligência</p>
        </div>

        {/* Demo banner */}
        {isDemoMode && (
          <div className="mb-4 rounded-xl px-4 py-3 text-sm text-center"
            style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)', color: '#00d4ff' }}>
            🎮 <strong>Modo Demo</strong> — use <code>admin</code> / <code>Am0cmph3@</code>
          </div>
        )}

        {/* Card */}
        <div className="rounded-2xl border p-8 space-y-5" style={{ backgroundColor: '#0d0e1a', borderColor: '#1a1b2e' }}>
          <h2 className="text-white text-xl font-semibold">Entrar na sua conta</h2>

          <form onSubmit={handleLogin} className="space-y-4" noValidate>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                {isDemoMode ? 'Login' : 'Email'}
              </label>
              <input
                className={baseInput}
                type={isDemoMode ? 'text' : 'email'}
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null) }}
                placeholder={isDemoMode ? 'admin' : 'seu@email.com'}
                autoComplete="email"
                inputMode={isDemoMode ? undefined : 'email'}
              />
            </div>

            {/* Senha */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Senha</label>
                {!isDemoMode && (
                  <Link href="/recuperar-senha" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                    Esqueci a senha
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  className={baseInput}
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null) }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-2"
                style={{ backgroundColor: '#1f0a0a', color: '#ff6b6b', border: '1px solid #3d1010' }}>
                <XCircle size={15} className="mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3.5 font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#00d4ff', color: '#08090f' }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Entrando...</>
                : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Não tem uma conta?{' '}
          <Link href="/cadastro" style={{ color: '#00d4ff' }} className="font-medium hover:opacity-80 transition-opacity">
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  )
}
