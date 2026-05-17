'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nova-senha`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
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
          <p className="text-gray-400 mt-1 text-sm">Recuperar acesso a sua conta</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8"
          style={{ backgroundColor: '#0d0e1a', borderColor: '#1a1b2e' }}
        >
          {sent ? (
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#0a1f12' }}
              >
                <svg
                  className="w-7 h-7"
                  style={{ color: '#00e676' }}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-white text-lg font-semibold mb-2">Email enviado!</h2>
              <p className="text-gray-400 text-sm mb-6">
                Verifique sua caixa de entrada em{' '}
                <span className="text-white font-medium">{email}</span>
                {' '}e clique no link para redefinir sua senha.
              </p>
              <Link
                href="/login"
                className="text-sm font-medium transition-opacity hover:opacity-80"
                style={{ color: '#00d4ff' }}
              >
                Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-white text-xl font-semibold mb-2">Recuperar senha</h2>
              <p className="text-gray-400 text-sm mb-6">
                Digite seu email e enviaremos um link para redefinir sua senha.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
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
                  {loading ? 'Enviando...' : 'Enviar link de recuperacao'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          <Link href="/login" style={{ color: '#00d4ff' }} className="font-medium hover:opacity-80 transition-opacity">
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  )
}
