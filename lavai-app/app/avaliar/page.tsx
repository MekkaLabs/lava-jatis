'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Star, CheckCircle2, Zap, MessageCircle } from 'lucide-react'

// ── NPS Rating Page ─────────────────────────────────────────────────────────
// Public page — client rates the service after receiving WhatsApp link.
// URL: /avaliar?at=<atendimento_id>

function NPSContent() {
  const params = useSearchParams()
  const atId   = params.get('at')
  const sig    = params.get('sig')

  const [nota, setNota]       = useState<number | null>(null)
  const [hover, setHover]     = useState<number | null>(null)
  const [comentario, setComentario] = useState('')
  const [step, setStep]       = useState<'rating' | 'comment' | 'done' | 'error'>('rating')
  const [saving, setSaving]   = useState(false)
  const [lavaJatoNome, setLavaJatoNome] = useState('Lava-Jato')
  const [linkValid, setLinkValid] = useState<boolean | null>(null)

  // Load atendimento info (valida HMAC server-side)
  useEffect(() => {
    if (!atId || !sig) { setLinkValid(false); return }
    fetch(`/api/public/avaliar-info?at=${atId}&sig=${sig}`)
      .then(async r => {
        if (!r.ok) { setLinkValid(false); return null }
        return r.json()
      })
      .then(d => {
        if (d && d.lavaJatoNome) {
          setLavaJatoNome(d.lavaJatoNome)
          setLinkValid(true)
        }
      })
      .catch(() => setLinkValid(false))
  }, [atId, sig])

  const labels: Record<number, string> = {
    1: 'Péssimo 😞',
    2: 'Ruim 😕',
    3: 'Regular 😐',
    4: 'Bom 😊',
    5: 'Excelente! 🤩',
  }

  const selectNota = (n: number) => {
    setNota(n)
    setTimeout(() => setStep('comment'), 200)
  }

  const submit = async () => {
    if (!nota) return
    setSaving(true)
    try {
      const res = await fetch('/api/public/nps-avaliar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ atendimentoId: atId, sig, nota, comentario }),
      })
      if (!res.ok) throw new Error('Erro')
      setStep('done')
    } catch {
      setStep('error')
    } finally {
      setSaving(false)
    }
  }

  if (!atId || !sig || linkValid === false) {
    return (
      <div className="text-center py-16 px-4">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-white font-semibold text-lg mb-2">Link inválido</p>
        <p className="text-gray-500 text-sm">Este link de avaliação não é válido ou já expirou.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.06) 0%, transparent 60%)' }}>

      {/* Header */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
          <Zap size={16} color="#000" strokeWidth={3} />
        </div>
        <span className="font-bold text-white text-lg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          LAVAI
        </span>
      </div>

      <div className="w-full max-w-sm">

        {/* Rating step */}
        {step === 'rating' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-3xl"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
              ✅
            </div>
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Seu carro está pronto!
            </h1>
            <p className="text-gray-400 text-sm mb-8">
              Como foi sua experiência no <strong className="text-white">{lavaJatoNome}</strong>?
            </p>

            <div className="flex justify-center gap-3 mb-4">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => selectNota(n)}
                  onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(null)}
                  className="transition-all duration-150"
                  style={{ transform: (hover ?? nota ?? 0) >= n ? 'scale(1.25)' : 'scale(1)' }}>
                  <Star
                    size={36}
                    fill={(hover ?? nota ?? 0) >= n ? '#ffd600' : 'transparent'}
                    stroke={(hover ?? nota ?? 0) >= n ? '#ffd600' : 'rgba(255,255,255,0.2)'}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>

            {(hover ?? nota) && (
              <p className="text-sm font-semibold transition-all" style={{ color: '#ffd600', minHeight: '1.25rem' }}>
                {labels[hover ?? nota ?? 0]}
              </p>
            )}
          </div>
        )}

        {/* Comment step */}
        {step === 'comment' && (
          <div>
            <div className="text-center mb-6">
              <div className="flex justify-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} size={24}
                    fill={n <= (nota ?? 0) ? '#ffd600' : 'transparent'}
                    stroke={n <= (nota ?? 0) ? '#ffd600' : 'rgba(255,255,255,0.2)'}
                    strokeWidth={1.5}
                  />
                ))}
              </div>
              <p className="text-white font-semibold text-lg">{labels[nota ?? 0]}</p>
              <p className="text-gray-500 text-sm mt-1">Quer deixar um comentário?</p>
            </div>

            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              placeholder="O que achou do serviço? (opcional)"
              rows={4}
              maxLength={500}
              className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-cyan-400/50 resize-none mb-4"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />

            <button onClick={submit} disabled={saving}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-black transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}>
              {saving ? 'Enviando...' : 'Enviar avaliação'}
            </button>

            <button onClick={() => setStep('done')}
              className="w-full mt-3 py-2.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Pular
            </button>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
              style={{ background: 'rgba(0,230,118,0.12)', border: '2px solid rgba(0,230,118,0.3)' }}>
              <CheckCircle2 size={36} style={{ color: '#00e676' }} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Obrigado! 🙏
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Sua avaliação foi registrada. Ela nos ajuda a melhorar cada vez mais!
            </p>
            <div className="p-4 rounded-2xl flex items-center gap-3"
              style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}>
              <MessageCircle size={18} style={{ color: '#00d4ff', flexShrink: 0 }} />
              <p className="text-xs text-gray-400 text-left">
                Compartilhe com amigos que também precisam de um lava-jato de qualidade!
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="text-center">
            <p className="text-4xl mb-3">😕</p>
            <p className="text-white font-semibold mb-2">Algo deu errado</p>
            <p className="text-gray-500 text-sm mb-4">Não conseguimos registrar sua avaliação.</p>
            <button onClick={() => setStep('comment')}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors hover:bg-white/10"
              style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
              Tentar novamente
            </button>
          </div>
        )}

      </div>

      <p className="mt-12 text-xs text-gray-600">
        Powered by <span style={{ color: '#00d4ff' }}>LAVAI</span>
      </p>
    </div>
  )
}

export default function AvaliarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08090f' }}>
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <NPSContent />
    </Suspense>
  )
}
