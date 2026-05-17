'use client'

import { useState } from 'react'
import { availableSlots, services } from '@/lib/mock-data'
import { CheckCircle2, Clock, Zap, MessageCircle } from 'lucide-react'

// ── Public Booking Page ──────────────────────────────────────
// This is what the CLIENT sees when they click the booking link

export default function AgendarPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [selectedService, setSelectedService] = useState<typeof services[0] | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', plate: '' })

  return (
    <div className="min-h-screen" style={{ background: '#08090f' }}>
      {/* Header */}
      <div className="sticky top-0 z-10" style={{ background: 'rgba(8,9,15,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
              <Zap size={14} color="#000" strokeWidth={3} />
            </div>
            <span className="font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>LAVAI</span>
          </div>
          <span className="text-xs text-gray-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-dot inline-block"></span>
            Lava-Jato do Marcos • Aberto agora
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step > s ? 'bg-green-400 text-black' : step === s ? 'text-black' : 'text-gray-500 bg-white/10'
              }`} style={step === s ? { background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' } : {}}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 w-12 rounded ${step > s ? 'bg-green-400' : 'bg-white/10'}`}></div>}
            </div>
          ))}
          <div className="ml-2 text-xs text-gray-500">
            {step === 1 && 'Escolha o serviço'}
            {step === 2 && 'Escolha o horário'}
            {step === 3 && 'Seus dados'}
            {step === 4 && 'Confirmado!'}
          </div>
        </div>

        {/* Step 1 — Service */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Qual serviço você precisa?
            </h1>
            <p className="text-gray-500 text-sm mb-6">Selecione o serviço desejado</p>
            <div className="space-y-2.5">
              {services.map(service => (
                <button key={service.name}
                  onClick={() => { setSelectedService(service); setStep(2) }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all ${
                    selectedService?.name === service.name
                      ? 'border-cyan-400/40 bg-cyan-400/5'
                      : 'border-white/7 hover:border-white/15 hover:bg-white/3'
                  }`}
                  style={{ border: '1px solid', borderColor: selectedService?.name === service.name ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.07)', background: selectedService?.name === service.name ? 'rgba(0,212,255,0.05)' : 'rgba(255,255,255,0.03)' }}>
                  <span className="text-2xl">{service.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{service.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Clock size={11} /> ~{service.duration} minutos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Slot */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Escolha o horário
            </h1>
            <p className="text-gray-500 text-sm mb-6">Horários disponíveis para hoje, 15 de maio</p>

            <div className="glass rounded-2xl p-4 mb-5 flex items-center gap-3">
              <span className="text-xl">{selectedService?.icon}</span>
              <div>
                <p className="font-semibold text-white text-sm">{selectedService?.name}</p>
                <p className="text-xs text-gray-500">~{selectedService?.duration} min · {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedService?.price ?? 0)}</p>
              </div>
              <button onClick={() => setStep(1)} className="ml-auto text-xs text-cyan-400 hover:text-cyan-300">Trocar</button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {availableSlots.map(slot => (
                <button key={slot.time}
                  disabled={!slot.available}
                  onClick={() => { setSelectedSlot(slot.time); setStep(3) }}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                    !slot.available
                      ? 'text-gray-600 cursor-not-allowed'
                      : selectedSlot === slot.time
                        ? 'text-black'
                        : 'text-white hover:border-cyan-400/30'
                  }`}
                  style={
                    !slot.available
                      ? { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }
                      : selectedSlot === slot.time
                        ? { background: 'linear-gradient(135deg,#00d4ff,#4f8eff)', border: 'none' }
                        : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }
                  }>
                  {slot.time}
                  {!slot.available && <span className="block text-xs font-normal mt-0.5">Ocupado</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Form */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Seus dados
            </h1>
            <p className="text-gray-500 text-sm mb-6">Para confirmar o agendamento</p>

            <div className="glass rounded-2xl p-4 mb-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{selectedService?.name}</span>
                <button onClick={() => setStep(2)} className="text-cyan-400 text-xs">Trocar</button>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-white font-semibold">Hoje às {selectedSlot}</span>
                <span className="text-green-400 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedService?.price ?? 0)}</span>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { key: 'name', label: 'Nome completo', placeholder: 'João Silva', type: 'text' },
                { key: 'phone', label: 'WhatsApp', placeholder: '(11) 99999-9999', type: 'tel' },
                { key: 'plate', label: 'Placa do veículo', placeholder: 'ABC-1234', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-cyan-400/50"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(4)}
              disabled={!form.name || !form.phone || !form.plate}
              className="w-full mt-5 py-3.5 rounded-xl text-base font-bold text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}>
              Confirmar Agendamento →
            </button>
            <p className="text-xs text-center text-gray-500 mt-3">
              Você receberá uma confirmação via WhatsApp
            </p>
          </div>
        )}

        {/* Step 4 — Success */}
        {step === 4 && (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
              style={{ background: 'rgba(0,230,118,0.15)', border: '2px solid rgba(0,230,118,0.3)' }}>
              <CheckCircle2 size={40} className="text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Agendamento confirmado!
            </h1>
            <p className="text-gray-400 mb-6">
              {form.name.split(' ')[0]}, seu agendamento está confirmado. Veja o resumo abaixo.
            </p>

            <div className="glass rounded-2xl p-5 text-left mb-5 space-y-3">
              {[
                { label: 'Serviço', value: selectedService?.name },
                { label: 'Horário', value: `Hoje às ${selectedSlot}` },
                { label: 'Duração', value: `~${selectedService?.duration} minutos` },
                { label: 'Valor', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedService?.price ?? 0) },
                { label: 'Endereço', value: 'Rua das Palmeiras, 142 — Vila Mariana, SP' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{item.label}</span>
                  <span className="text-sm font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="glass rounded-2xl p-4 flex items-center gap-3 mb-5"
              style={{ borderColor: 'rgba(37,211,102,0.2)', background: 'rgba(37,211,102,0.05)' }}>
              <MessageCircle size={20} style={{ color: '#25d366' }} />
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Confirmação via WhatsApp</p>
                <p className="text-xs text-gray-400">Enviamos os detalhes para {form.phone}</p>
              </div>
              <span className="ml-auto text-xs font-bold text-green-400">Enviado ✓</span>
            </div>

            <button
              onClick={() => { setStep(1); setSelectedService(null); setSelectedSlot(null); setForm({ name: '', phone: '', plate: '' }) }}
              className="text-sm text-gray-500 hover:text-cyan-400 transition-colors">
              Fazer outro agendamento
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
