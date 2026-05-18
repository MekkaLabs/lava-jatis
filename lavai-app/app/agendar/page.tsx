'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Clock, Zap, MessageCircle, ChevronLeft, Loader2 } from 'lucide-react'

// ── Public Booking Page ──────────────────────────────────────────────────────
// URL: /agendar?lj=<lava_jato_id>
// Client picks a service → date → time slot → fills form → confirms booking

interface Servico {
  id: string
  nome: string
  preco: number
  duracao_minutos: number
}

function gerarSlots(): string[] {
  const slots: string[] = []
  for (let h = 8; h <= 17; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 17) slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
}

function gerarDias(): { label: string; value: string }[] {
  const dias = []
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const label = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : `${weekdays[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`
    const value = d.toISOString().split('T')[0]
    dias.push({ label, value })
  }
  return dias
}

const SLOTS = gerarSlots()
const DIAS  = gerarDias()

function AgendarContent() {
  const params  = useSearchParams()
  const ljId    = params.get('lj')

  const [step, setStep]           = useState<1 | 2 | 3 | 4>(1)
  const [servicos, setServicos]   = useState<Servico[]>([])
  const [loading, setLoading]     = useState(true)
  const [lavaJatoNome, setLavaJatoNome] = useState('Lava-Jato')

  const [selectedServico, setSelectedServico] = useState<Servico | null>(null)
  const [selectedDia, setSelectedDia]         = useState<string>(DIAS[0].value)
  const [selectedSlot, setSelectedSlot]       = useState<string | null>(null)
  const [form, setForm]     = useState({ nome: '', telefone: '', placa: '', modelo: '' })
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!ljId) { setLoading(false); return }
    fetch(`/api/public/servicos?lj_id=${ljId}`)
      .then(r => r.json())
      .then(d => {
        if (d.servicos) setServicos(d.servicos)
        if (d.lavaJatoNome) setLavaJatoNome(d.lavaJatoNome)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [ljId])

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const diaLabel = (val: string) =>
    DIAS.find(d => d.value === val)?.label ?? val

  const handleConfirm = async () => {
    if (!selectedServico || !selectedSlot || !form.nome || !form.telefone) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/public/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lavaJatoId:  ljId,
          servicoId:   selectedServico.id,
          dataHora:    `${selectedDia}T${selectedSlot}:00`,
          clienteNome: form.nome,
          telefone:    form.telefone.replace(/\D/g, ''),
          placa:       form.placa,
          modeloVeiculo: form.modelo,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao agendar')
      setSavedId(data.atendimentoId ?? null)
      setStep(4)
    } catch (e: any) {
      setError(e.message ?? 'Erro ao agendar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setSelectedServico(null)
    setSelectedSlot(null)
    setSelectedDia(DIAS[0].value)
    setForm({ nome: '', telefone: '', placa: '', modelo: '' })
    setSavedId(null)
    setError(null)
  }

  if (!ljId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08090f' }}>
        <div className="text-center px-4">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-white font-semibold text-lg mb-2">Link inválido</p>
          <p className="text-gray-500 text-sm">Este link de agendamento não é válido.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#08090f' }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-10"
        style={{ background: 'rgba(8,9,15,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
              <Zap size={14} color="#000" strokeWidth={3} />
            </div>
            <span className="font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>LAVAI</span>
          </div>
          <span className="text-xs text-gray-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-dot inline-block" />
            {lavaJatoNome}
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Step indicator (steps 1–3) */}
        {step < 4 && (
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > s ? 'bg-green-400 text-black' : step === s ? 'text-black' : 'text-gray-500 bg-white/10'
                }`} style={step === s ? { background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' } : {}}>
                  {step > s ? '✓' : s}
                </div>
                {s < 3 && (
                  <div className={`h-0.5 w-10 rounded ${step > s ? 'bg-green-400' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
            <span className="ml-2 text-xs text-gray-500">
              {step === 1 && 'Escolha o serviço'}
              {step === 2 && 'Escolha o horário'}
              {step === 3 && 'Seus dados'}
            </span>
          </div>
        )}

        {/* ── STEP 1 — Service selection ── */}
        {step === 1 && (
          <div className="page-in">
            <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Qual serviço você precisa?
            </h1>
            <p className="text-gray-500 text-sm mb-6">Selecione o serviço desejado</p>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 size={28} className="animate-spin text-cyan-400" />
              </div>
            ) : servicos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Nenhum serviço disponível no momento.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {servicos.map(s => (
                  <button key={s.id}
                    onClick={() => { setSelectedServico(s); setStep(2) }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover-lift"
                    style={{
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.03)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,212,255,0.3)'
                      ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.05)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)'
                      ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)'
                    }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: 'rgba(0,212,255,0.08)' }}>
                      🚗
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{s.nome}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock size={10} /> ~{s.duracao_minutos ?? 30} min
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-green-400">{formatBRL(s.preco)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2 — Date + Time ── */}
        {step === 2 && (
          <div className="page-in">
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-4 transition-colors">
              <ChevronLeft size={16} /> Voltar
            </button>
            <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Escolha o horário
            </h1>
            <p className="text-gray-500 text-sm mb-5">Selecione data e horário disponíveis</p>

            {/* Selected service summary */}
            <div className="glass rounded-2xl p-4 mb-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: 'rgba(0,212,255,0.08)' }}>🚗</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{selectedServico?.nome}</p>
                <p className="text-xs text-gray-500">~{selectedServico?.duracao_minutos ?? 30} min · {formatBRL(selectedServico?.preco ?? 0)}</p>
              </div>
              <button onClick={() => setStep(1)} className="text-xs text-cyan-400 hover:text-cyan-300 shrink-0">Trocar</button>
            </div>

            {/* Day picker */}
            <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">Data</p>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
              {DIAS.map(d => (
                <button key={d.value}
                  onClick={() => setSelectedDia(d.value)}
                  className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={
                    selectedDia === d.value
                      ? { background: 'linear-gradient(135deg,#00d4ff,#4f8eff)', color: '#000' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }
                  }>
                  {d.label}
                </button>
              ))}
            </div>

            {/* Time slots */}
            <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">Horário</p>
            <div className="grid grid-cols-4 gap-2">
              {SLOTS.map(slot => (
                <button key={slot}
                  onClick={() => { setSelectedSlot(slot); setStep(3) }}
                  className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={
                    selectedSlot === slot
                      ? { background: 'linear-gradient(135deg,#00d4ff,#4f8eff)', color: '#000' }
                      : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }
                  }
                  onMouseEnter={e => {
                    if (selectedSlot !== slot) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,212,255,0.35)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (selectedSlot !== slot) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'
                    }
                  }}>
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3 — Customer form ── */}
        {step === 3 && (
          <div className="page-in">
            <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-4 transition-colors">
              <ChevronLeft size={16} /> Voltar
            </button>
            <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Seus dados
            </h1>
            <p className="text-gray-500 text-sm mb-5">Para confirmar o agendamento</p>

            {/* Booking summary */}
            <div className="glass rounded-2xl p-4 mb-5 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Serviço</span>
                <span className="text-sm font-semibold text-white">{selectedServico?.nome}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Data & Hora</span>
                <span className="text-sm font-semibold text-white">{diaLabel(selectedDia)} às {selectedSlot}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Valor</span>
                <span className="text-sm font-bold text-green-400">{formatBRL(selectedServico?.preco ?? 0)}</span>
              </div>
              <button onClick={() => setStep(2)} className="text-xs text-cyan-400 hover:text-cyan-300 pt-1">Alterar horário</button>
            </div>

            <div className="space-y-3">
              {[
                { key: 'nome',     label: 'Nome completo *',   placeholder: 'João Silva',         type: 'text' },
                { key: 'telefone', label: 'WhatsApp *',         placeholder: '(11) 99999-9999',    type: 'tel'  },
                { key: 'placa',    label: 'Placa do veículo',   placeholder: 'ABC-1234',           type: 'text' },
                { key: 'modelo',   label: 'Modelo do veículo',  placeholder: 'Chevrolet Onix',     type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(0,212,255,0.5)' }}
                    onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
                  />
                </div>
              ))}
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl text-sm text-red-400"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={saving || !form.nome || !form.telefone}
              className="w-full mt-5 py-3.5 rounded-xl text-base font-bold text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}>
              {saving ? (
                <><Loader2 size={16} className="animate-spin" /> Confirmando...</>
              ) : (
                'Confirmar Agendamento →'
              )}
            </button>
            <p className="text-xs text-center text-gray-500 mt-3">
              Você receberá uma confirmação via WhatsApp
            </p>
          </div>
        )}

        {/* ── STEP 4 — Success ── */}
        {step === 4 && (
          <div className="text-center py-8 page-in">
            <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
              style={{ background: 'rgba(0,230,118,0.12)', border: '2px solid rgba(0,230,118,0.3)' }}>
              <CheckCircle2 size={40} style={{ color: '#00e676' }} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Agendado! 🎉
            </h1>
            <p className="text-gray-400 text-sm mb-6">
              {form.nome.split(' ')[0]}, seu agendamento está confirmado.
            </p>

            <div className="glass rounded-2xl p-5 text-left mb-4 space-y-3">
              {[
                { label: 'Serviço',   value: selectedServico?.nome },
                { label: 'Data',      value: diaLabel(selectedDia) },
                { label: 'Horário',   value: selectedSlot },
                { label: 'Duração',   value: `~${selectedServico?.duracao_minutos ?? 30} min` },
                { label: 'Valor',     value: formatBRL(selectedServico?.preco ?? 0) },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className="text-sm font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-4 flex items-center gap-3 mb-6"
              style={{ background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.2)' }}>
              <MessageCircle size={18} style={{ color: '#25d366', flexShrink: 0 }} />
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Confirmação via WhatsApp</p>
                <p className="text-xs text-gray-400 mt-0.5">Os detalhes foram enviados para {form.telefone}</p>
              </div>
            </div>

            <button onClick={resetForm}
              className="text-sm text-gray-500 hover:text-cyan-400 transition-colors">
              Fazer outro agendamento
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-600 pb-8">
        Powered by <span style={{ color: '#00d4ff' }}>LAVAI</span>
      </p>
    </div>
  )
}

export default function AgendarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08090f' }}>
        <Loader2 size={28} className="animate-spin text-cyan-400" />
      </div>
    }>
      <AgendarContent />
    </Suspense>
  )
}
