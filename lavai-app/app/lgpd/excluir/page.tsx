'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Zap, Shield, CheckCircle2, Loader2 } from 'lucide-react'

function formatPhoneBR(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export default function LGPDExcluirPage() {
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [motivo, setMotivo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!telefone && !email) {
      setError('Informe telefone OU email pra te identificarmos.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/public/lgpd/excluir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone, email, motivo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao enviar')
      setDone(true)
    } catch (err: any) {
      setError(err.message ?? 'Erro inesperado. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <main className="min-h-screen text-white flex items-center justify-center px-5" style={{ background: '#08090f' }}>
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'linear-gradient(135deg,#00e676,#00d4ff)' }}>
            <CheckCircle2 size={32} color="#000" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold mb-3">Solicitação recebida</h1>
          <p className="text-gray-400 mb-6">
            Vamos analisar seu pedido e responder em até <strong className="text-white">15 dias úteis</strong> pelo canal informado.
          </p>
          <Link href="/" className="inline-block px-5 py-3 rounded-xl font-semibold text-black"
            style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
            Voltar ao início
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen text-white" style={{ background: '#08090f' }}>
      <nav className="sticky top-0 z-30"
        style={{ background: 'rgba(8,9,15,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
              <Zap size={15} color="#000" strokeWidth={3} />
            </div>
            <span className="font-bold text-lg"
              style={{ background: 'linear-gradient(90deg,#00d4ff,#4f8eff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              LAVAI
            </span>
          </Link>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-5 py-12">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Shield size={14} /> LGPD
        </div>
        <h1 className="text-3xl font-bold mb-2"
          style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
          Excluir meus dados
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          Direito assegurado pela LGPD (Art. 18). Vamos analisar sua solicitação e responder em até 15 dias úteis.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1.5">
              Telefone (WhatsApp) que aparece no nosso sistema
            </label>
            <input
              type="tel"
              inputMode="tel"
              placeholder="(11) 99999-9999"
              value={telefone}
              onChange={e => setTelefone(formatPhoneBR(e.target.value))}
              maxLength={16}
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <div className="relative">
            <div className="text-center text-xs text-gray-600 my-2">OU</div>
          </div>

          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1.5">
              Email cadastrado
            </label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1.5">
              Motivo da solicitação (opcional)
            </label>
            <textarea
              placeholder="Conte por que quer excluir..."
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all resize-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl text-sm text-red-400"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || (!telefone && !email)}
            className="w-full py-3.5 rounded-xl font-bold text-black transition-all disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Enviando...
              </>
            ) : (
              'Enviar solicitação'
            )}
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-6">
          Veja também a <Link href="/privacidade" className="text-cyan-400 hover:underline">Política de Privacidade</Link>{' '}
          e os <Link href="/termos" className="text-cyan-400 hover:underline">Termos de Uso</Link>.
        </p>
      </div>
    </main>
  )
}
