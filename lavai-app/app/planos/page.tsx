'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { IS_DEMO } from '@/lib/demo'
import {
  ArrowLeft,
  Check,
  Zap,
  Building2,
  Rocket,
  X,
  Loader2,
  ExternalLink,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type BillingType = 'PIX' | 'CREDIT_CARD' | 'BOLETO'
type PlanoKey = 'basico' | 'profissional' | 'enterprise'

interface Plan {
  key: PlanoKey
  nome: string
  preco: number
  periodo: string
  descricao: string
  icon: React.ReactNode
  cor: string
  destaque: boolean
  recursos: string[]
}

// ─── Plan data ────────────────────────────────────────────────────────────────

const PLANS: Plan[] = [
  {
    key: 'basico',
    nome: 'Básico',
    preco: 97,
    periodo: '/mês',
    descricao: 'Ideal para lava-jatos pequenos',
    icon: <Zap size={22} />,
    cor: '#00d4ff',
    destaque: false,
    recursos: [
      '1 unidade',
      'Até 3 funcionários',
      'Fila de atendimento digital',
      'Relatórios básicos',
      'Suporte via chat',
    ],
  },
  {
    key: 'profissional',
    nome: 'Profissional',
    preco: 197,
    periodo: '/mês',
    descricao: 'Para quem quer crescer mais rápido',
    icon: <Rocket size={22} />,
    cor: '#00e676',
    destaque: true,
    recursos: [
      'Até 3 unidades',
      'Funcionários ilimitados',
      'Fila de atendimento digital',
      'Bot WhatsApp integrado',
      'Relatórios avançados',
      'Programa de fidelidade',
      'Suporte prioritário',
    ],
  },
  {
    key: 'enterprise',
    nome: 'Enterprise',
    preco: 599,
    periodo: '/mês',
    descricao: 'Para redes e franquias',
    icon: <Building2 size={22} />,
    cor: '#a78bfa',
    destaque: false,
    recursos: [
      'Unidades ilimitadas',
      'Funcionários ilimitados',
      'Tudo do Profissional',
      'Acesso à API',
      'Suporte dedicado 24/7',
      'Treinamento da equipe',
      'Relatórios personalizados',
    ],
  },
]

const BILLING_OPTIONS: { value: BillingType; label: string; desc: string }[] = [
  { value: 'PIX', label: 'PIX', desc: 'Aprovação imediata' },
  { value: 'CREDIT_CARD', label: 'Cartão de Crédito', desc: 'Em até 12x' },
  { value: 'BOLETO', label: 'Boleto', desc: 'Vence em 3 dias' },
]

// ─── Success Modal ────────────────────────────────────────────────────────────

function SuccessModal({
  subscriptionId,
  billingType,
  nextDueDate,
  value,
  onClose,
}: {
  subscriptionId: string
  billingType: BillingType
  nextDueDate: string
  value: number
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md rounded-3xl p-8 text-center"
        style={{ background: '#0f1117', border: '1px solid #00e67630' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: '#00e67620', border: '2px solid #00e676' }}
        >
          <Check size={30} style={{ color: '#00e676' }} />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Assinatura criada!</h2>
        <p className="text-gray-400 mb-6">
          Sua assinatura foi registrada com sucesso. Complete o pagamento para ativar seu plano.
        </p>

        <div
          className="rounded-2xl p-4 mb-6 text-left space-y-2"
          style={{ background: '#ffffff08' }}
        >
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Valor</span>
            <span className="text-white font-semibold">
              R${value.toFixed(2).replace('.', ',')}/mês
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Forma de pagamento</span>
            <span className="text-white">
              {billingType === 'CREDIT_CARD'
                ? 'Cartão de Crédito'
                : billingType === 'PIX'
                ? 'PIX'
                : 'Boleto'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Primeiro vencimento</span>
            <span className="text-white">
              {new Date(nextDueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">ID da assinatura</span>
            <span className="text-white font-mono text-xs">{subscriptionId.slice(0, 20)}…</span>
          </div>
        </div>

        {billingType === 'PIX' && (
          <div
            className="rounded-2xl p-5 mb-6 flex flex-col items-center gap-3"
            style={{ background: '#00d4ff10', border: '1px solid #00d4ff30' }}
          >
            <p className="text-sm text-gray-300">QR Code PIX</p>
            {/* Placeholder — em produção, usar pixQrCodeUrl retornado pela Asaas */}
            <div
              className="w-36 h-36 rounded-xl flex items-center justify-center"
              style={{ background: '#ffffff10' }}
            >
              <span className="text-gray-500 text-xs text-center px-2">
                QR Code disponível no painel Asaas
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Acesse seu e-mail para o link de pagamento
            </p>
          </div>
        )}

        {billingType !== 'PIX' && (
          <div className="flex items-center gap-2 justify-center mb-6">
            <ExternalLink size={15} style={{ color: '#00d4ff' }} />
            <p className="text-sm" style={{ color: '#00d4ff' }}>
              Link de pagamento enviado para seu e-mail
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #00e676, #00b894)' }}
        >
          Ir para o Dashboard
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlanosPage() {
  const router = useRouter()
  const [selectedPlano, setSelectedPlano] = useState<PlanoKey>('profissional')
  const [billingType, setBillingType] = useState<BillingType>('PIX')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{
    subscriptionId: string
    billingType: BillingType
    nextDueDate: string
    value: number
  } | null>(null)

  async function handleSubscribe() {
    if (!cpfCnpj.trim()) {
      setError('Informe seu CPF ou CNPJ para continuar.')
      return
    }

    setLoading(true)
    setError(null)

    if (IS_DEMO) {
      await new Promise(r => setTimeout(r, 800))
      setSuccess({
        subscriptionId: 'DEMO-SUB-' + Date.now(),
        billingType,
        nextDueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        value: selectedPlano === 'basico' ? 97 : selectedPlano === 'profissional' ? 197 : 599,
      })
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano: selectedPlano, billingType, cpfCnpj }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erro ao criar assinatura. Tente novamente.')
        return
      }

      setSuccess({
        subscriptionId: data.subscriptionId,
        billingType,
        nextDueDate: data.nextDueDate,
        value: data.value,
      })
    } catch {
      setError('Falha na conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function handleSuccessClose() {
    setSuccess(null)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen" style={{ background: '#08090f' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-5 py-4 flex items-center gap-4 border-b"
        style={{ background: '#08090fcc', backdropFilter: 'blur(12px)', borderColor: '#ffffff10' }}
      >
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Voltar ao Dashboard
        </button>
        <div className="flex-1" />
        <span
          className="text-xs font-bold tracking-widest px-3 py-1 rounded-full"
          style={{ background: '#00d4ff20', color: '#00d4ff' }}
        >
          LAVAI
        </span>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">
            Escolha seu plano
          </h1>
          <p className="text-gray-400 text-lg">
            Comece pequeno, cresça sem limites. Cancele a qualquer momento.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {PLANS.map((plan) => {
            const isSelected = selectedPlano === plan.key
            return (
              <button
                key={plan.key}
                onClick={() => setSelectedPlano(plan.key)}
                className="relative text-left rounded-3xl p-6 transition-all duration-200 w-full"
                style={{
                  background: isSelected ? `${plan.cor}15` : '#0f1117',
                  border: `2px solid ${isSelected ? plan.cor : '#ffffff12'}`,
                  transform: plan.destaque && !isSelected ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                {plan.destaque && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full"
                    style={{ background: plan.cor, color: '#08090f' }}
                  >
                    Mais popular
                  </span>
                )}

                {/* Icon + name */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${plan.cor}20`, color: plan.cor }}
                  >
                    {plan.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{plan.nome}</p>
                    <p className="text-xs text-gray-500">{plan.descricao}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-5">
                  <span className="text-4xl font-bold text-white">
                    R${plan.preco}
                  </span>
                  <span className="text-gray-500 text-sm">{plan.periodo}</span>
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {plan.recursos.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check
                        size={15}
                        className="mt-0.5 shrink-0"
                        style={{ color: plan.cor }}
                      />
                      {r}
                    </li>
                  ))}
                </ul>

                {/* Selected indicator */}
                {isSelected && (
                  <div
                    className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: plan.cor }}
                  >
                    <Check size={13} color="#08090f" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Billing section */}
        <div
          className="rounded-3xl p-6 mb-6"
          style={{ background: '#0f1117', border: '1px solid #ffffff12' }}
        >
          <h2 className="text-white font-semibold mb-4">Forma de pagamento</h2>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {BILLING_OPTIONS.map((opt) => {
              const isActive = billingType === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setBillingType(opt.value)}
                  className="rounded-2xl p-4 text-left transition-all"
                  style={{
                    background: isActive ? '#00d4ff15' : '#ffffff06',
                    border: `1.5px solid ${isActive ? '#00d4ff' : '#ffffff12'}`,
                  }}
                >
                  <p className="font-semibold text-white text-sm">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              )
            })}
          </div>

          {/* CPF/CNPJ */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              CPF ou CNPJ <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(e.target.value.replace(/\D/g, ''))}
              placeholder="Somente números"
              maxLength={14}
              className="w-full rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none transition-all"
              style={{
                background: '#ffffff08',
                border: '1px solid #ffffff15',
              }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="rounded-2xl px-5 py-4 mb-5 flex items-start gap-3"
            style={{ background: '#ff4d4f18', border: '1px solid #ff4d4f40' }}
          >
            <X size={16} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all disabled:opacity-60 flex items-center justify-center gap-3"
          style={{
            background: loading
              ? '#00d4ff50'
              : 'linear-gradient(135deg, #00d4ff, #0099bb)',
          }}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Processando…
            </>
          ) : (
            <>
              Assinar agora — R$
              {PLANS.find((p) => p.key === selectedPlano)?.preco}/mês
            </>
          )}
        </button>

        <p className="text-center text-gray-600 text-xs mt-4">
          Pagamento seguro via Asaas. Cancele a qualquer momento, sem multa.
        </p>
      </main>

      {/* Success modal */}
      {success && (
        <SuccessModal
          subscriptionId={success.subscriptionId}
          billingType={success.billingType}
          nextDueDate={success.nextDueDate}
          value={success.value}
          onClose={handleSuccessClose}
        />
      )}
    </div>
  )
}
