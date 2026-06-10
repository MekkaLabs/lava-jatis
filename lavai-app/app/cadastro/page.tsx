'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import TurnstileWidget from '@/components/TurnstileWidget'

// Anti-bot: só ativa o widget se a site key pública estiver configurada.
// Sem key → undefined → fluxo segue como hoje (backend em modo no-op).
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

// ── Helpers ──────────────────────────────────────────────────────────────────

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) {
    return d
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return d
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

function capitalize(str: string) {
  return str
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ── Sub-components (FORA do componente pai — evita remount por keystroke) ────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">{children}</label>
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="flex items-center gap-1 text-xs mt-1.5" style={{ color: '#ff6b6b' }}>
      <XCircle size={12} /> {msg}
    </p>
  )
}

function PasswordStrength({ senha }: { senha: string }) {
  if (!senha) return null
  const rules = [
    { label: 'Mínimo 8 caracteres', ok: senha.length >= 8 },
    { label: 'Uma letra maiúscula', ok: /[A-Z]/.test(senha) },
    { label: 'Um número', ok: /[0-9]/.test(senha) },
  ]
  return (
    <div className="mt-2 space-y-1">
      {rules.map(r => (
        <p key={r.label} className="flex items-center gap-1.5 text-xs" style={{ color: r.ok ? '#00e676' : '#6b7280' }}>
          <CheckCircle2 size={11} style={{ opacity: r.ok ? 1 : 0.4 }} />
          {r.label}
        </p>
      ))}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest pt-2 pb-1" style={{ color: '#00d4ff' }}>
      {children}
    </p>
  )
}

// ── Input base styles ─────────────────────────────────────────────────────────

const baseInput =
  'w-full rounded-xl px-4 py-3 text-white text-sm outline-none transition bg-[#101122] border border-[#2a2b3d] focus:border-[#00d4ff] placeholder:text-gray-600'

// ── Página principal ──────────────────────────────────────────────────────────

export default function CadastroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showSenha, setShowSenha] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)

  // Campos
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [nomeLavaJato, setNomeLavaJato] = useState('')
  const [cidade, setCidade] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')

  function clearFieldError(field: string) {
    setFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next })
  }

  // Validação client-side antes de enviar
  function validate(): boolean {
    const errs: Record<string, string> = {}

    if (nome.trim().split(' ').filter(Boolean).length < 2) errs.nome = 'Informe nome e sobrenome.'
    if (!emailRe.test(email.trim())) errs.email = 'Email inválido.'
    if (senha.length < 8) errs.senha = 'Mínimo 8 caracteres.'
    else if (!/[A-Z]/.test(senha)) errs.senha = 'Inclua pelo menos uma maiúscula.'
    else if (!/[0-9]/.test(senha)) errs.senha = 'Inclua pelo menos um número.'
    if (senha !== confirmarSenha) errs.confirmarSenha = 'Senhas não conferem.'
    if (nomeLavaJato.trim().length < 3) errs.nomeLavaJato = 'Mínimo 3 caracteres.'
    const wd = whatsapp.replace(/\D/g, '')
    if (wd.length > 0 && wd.length !== 10 && wd.length !== 11) errs.whatsapp = 'Número incompleto. Use (DD) 99999-9999.'

    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setGlobalError(null)
    if (!validate()) return
    // Anti-bot: se o Turnstile está ativo, exige o token antes de enviar.
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setGlobalError('Confirme que você não é um robô para continuar.')
      return
    }
    setLoading(true)

    try {
      const res = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email: email.trim().toLowerCase(), senha, nomeLavaJato, cidade, whatsapp, turnstileToken }),
      })

      const json = await res.json()

      if (!res.ok) {
        if (json.errors) {
          setFieldErrors(json.errors)
        } else {
          setGlobalError(json.error ?? 'Erro ao criar conta. Tente novamente.')
        }
        // Token Turnstile é single-use — limpa pra forçar nova verificação.
        if (TURNSTILE_SITE_KEY) setTurnstileToken('')
        setLoading(false)
        return
      }

      // Conta criada — agora faz login automático
      const { supabase } = await import('@/lib/supabase')
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: senha,
      })

      if (signInErr) {
        // Conta criada mas login falhou — manda para login
        router.push('/login?cadastro=ok')
        return
      }

      router.push('/dashboard')
    } catch {
      setGlobalError('Erro de conexão. Verifique sua internet e tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#08090f' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tight" style={{ color: '#00d4ff' }}>LAVAI</h1>
          <p className="text-gray-500 mt-1 text-sm">Comece gratuitamente — sem cartão de crédito</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-8 space-y-5" style={{ backgroundColor: '#0d0e1a', borderColor: '#1a1b2e' }}>
          <h2 className="text-white text-xl font-semibold">Criar conta</h2>

          <form onSubmit={handleCadastro} className="space-y-4" noValidate>

            {/* ── Dados pessoais ── */}
            <SectionTitle>Dados pessoais</SectionTitle>

            {/* Nome */}
            <div>
              <Label>Nome completo *</Label>
              <input
                className={baseInput}
                type="text"
                value={nome}
                onChange={e => { setNome(e.target.value); clearFieldError('nome') }}
                onBlur={e => setNome(capitalize(e.target.value))}
                placeholder="João Silva"
                autoComplete="name"
              />
              <FieldError msg={fieldErrors.nome} />
            </div>

            {/* Email */}
            <div>
              <Label>Email *</Label>
              <input
                className={baseInput}
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); clearFieldError('email') }}
                placeholder="seu@email.com"
                autoComplete="email"
                inputMode="email"
              />
              <FieldError msg={fieldErrors.email} />
            </div>

            {/* Senha */}
            <div>
              <Label>Senha *</Label>
              <div className="relative">
                <input
                  className={baseInput}
                  type={showSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => { setSenha(e.target.value); clearFieldError('senha') }}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength senha={senha} />
              <FieldError msg={fieldErrors.senha} />
            </div>

            {/* Confirmar senha */}
            <div>
              <Label>Confirmar senha *</Label>
              <div className="relative">
                <input
                  className={baseInput}
                  type={showConfirmar ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={e => { setConfirmarSenha(e.target.value); clearFieldError('confirmarSenha') }}
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmar(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmar ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmarSenha && senha === confirmarSenha && (
                <p className="flex items-center gap-1 text-xs mt-1.5" style={{ color: '#00e676' }}>
                  <CheckCircle2 size={12} /> Senhas conferem
                </p>
              )}
              <FieldError msg={fieldErrors.confirmarSenha} />
            </div>

            {/* ── Dados do lava-jato ── */}
            <SectionTitle>Dados do lava-jato</SectionTitle>

            {/* Nome do lava-jato */}
            <div>
              <Label>Nome do lava-jato *</Label>
              <input
                className={baseInput}
                type="text"
                value={nomeLavaJato}
                onChange={e => { setNomeLavaJato(e.target.value); clearFieldError('nomeLavaJato') }}
                onBlur={e => setNomeLavaJato(capitalize(e.target.value))}
                placeholder="Lava-Jato do João"
                autoComplete="organization"
              />
              <FieldError msg={fieldErrors.nomeLavaJato} />
            </div>

            {/* Cidade */}
            <div>
              <Label>Cidade</Label>
              <input
                className={baseInput}
                type="text"
                value={cidade}
                onChange={e => setCidade(e.target.value)}
                onBlur={e => setCidade(capitalize(e.target.value))}
                placeholder="São Paulo, SP"
                autoComplete="address-level2"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <Label>WhatsApp do lava-jato</Label>
              <input
                className={baseInput}
                type="tel"
                value={whatsapp}
                onChange={e => { setWhatsapp(maskPhone(e.target.value)); clearFieldError('whatsapp') }}
                placeholder="(11) 99999-9999"
                autoComplete="tel"
                inputMode="tel"
                maxLength={15}
              />
              <FieldError msg={fieldErrors.whatsapp} />
            </div>

            {/* Anti-bot (Turnstile) — só aparece se a site key estiver configurada */}
            {TURNSTILE_SITE_KEY && (
              <div className="pt-1">
                <TurnstileWidget
                  siteKey={TURNSTILE_SITE_KEY}
                  onVerify={setTurnstileToken}
                  onExpire={() => setTurnstileToken('')}
                />
              </div>
            )}

            {/* Erro global */}
            {globalError && (
              <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-2"
                style={{ backgroundColor: '#1f0a0a', color: '#ff6b6b', border: '1px solid #3d1010' }}>
                <XCircle size={15} className="mt-0.5 flex-shrink-0" />
                {globalError}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3.5 font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              style={{ backgroundColor: '#00e676', color: '#08090f' }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Criando conta...</>
              ) : (
                'Criar conta grátis'
              )}
            </button>

            <p className="text-xs text-gray-600 text-center">
              Ao criar uma conta você concorda com nossos termos de uso.
            </p>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Já tem uma conta?{' '}
          <Link href="/login" style={{ color: '#00d4ff' }} className="font-medium hover:opacity-80 transition-opacity">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
