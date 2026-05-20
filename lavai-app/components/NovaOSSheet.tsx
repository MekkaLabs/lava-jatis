'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { DEMO_SERVICOS, IS_DEMO } from '@/lib/demo'
import { X, Check, Loader2 } from 'lucide-react'

interface Servico {
  id: string
  nome: string
  preco: number
}

interface NovaOSSheetProps {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

export default function NovaOSSheet({ open, onClose, onCreated }: NovaOSSheetProps) {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [clienteNome, setClienteNome] = useState('')
  const [placa, setPlaca] = useState('')
  const [modelo, setModelo] = useState('')
  const [servicoId, setServicoId] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [erro, setErro] = useState('')

  // Carrega serviços quando o sheet abre
  useEffect(() => {
    if (!open) return
    if (IS_DEMO) {
      setServicos(DEMO_SERVICOS as Servico[])
      return
    }
    const supabase = createClient()
    supabase
      .from('servicos')
      .select('id, nome, preco')
      .eq('ativo', true)
      .order('nome')
      .then(({ data }) => setServicos((data as Servico[]) ?? []))
  }, [open])

  // Reseta o form ao fechar
  useEffect(() => {
    if (open) return
    const t = setTimeout(() => {
      setClienteNome(''); setPlaca(''); setModelo(''); setServicoId('')
      setSaving(false); setDone(false); setErro('')
    }, 300)
    return () => clearTimeout(t)
  }, [open])

  if (!open) return null

  const canSubmit = clienteNome.trim().length >= 2 && servicoId && placa.trim().length >= 4

  async function handleSubmit() {
    if (!canSubmit || saving) return
    setSaving(true)
    setErro('')
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10)

      if (IS_DEMO) {
        await new Promise(r => setTimeout(r, 600))
      } else {
        const res = await fetch('/api/atendimentos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clienteNome: clienteNome.trim(),
            servicoId,
            placa: placa.trim().toUpperCase(),
            modelo: modelo.trim() || undefined,
          }),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j.error || 'Erro ao criar OS')
        }
      }

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([10, 40, 10])
      setDone(true)
      onCreated?.()
      setTimeout(onClose, 1100)
    } catch (e: any) {
      setErro(e.message || 'Erro ao criar OS')
      setSaving(false)
    }
  }

  const inputCls =
    'w-full px-4 py-3 rounded-xl text-white text-base outline-none transition-colors'
  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={saving ? undefined : onClose}
      />

      {/* Sheet */}
      <div
        className="sheet-up relative w-full lg:max-w-md rounded-t-3xl lg:rounded-3xl p-5 safe-bottom"
        style={{
          background: '#0f1117',
          borderTop: '1px solid rgba(0,212,255,0.15)',
          maxHeight: '88vh',
          overflowY: 'auto',
        }}
      >
        {/* Grip + close */}
        <div className="flex items-center justify-between mb-4">
          <div className="lg:hidden absolute left-1/2 -translate-x-1/2 top-2 w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <h2 className="text-lg font-bold text-white mt-2">Nova OS</h2>
          <button
            onClick={saving ? undefined : onClose}
            aria-label="Fechar"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,230,118,0.15)', border: '1px solid rgba(0,230,118,0.4)' }}
            >
              <Check size={32} color="#00e676" strokeWidth={3} />
            </div>
            <p className="text-white font-semibold">OS criada!</p>
            <p className="text-gray-500 text-sm">Adicionada à fila</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1 block">Cliente *</label>
              <input
                className={inputCls} style={inputStyle}
                placeholder="Nome do cliente"
                value={clienteNome}
                onChange={e => setClienteNome(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 font-medium mb-1 block">Placa *</label>
                <input
                  className={inputCls} style={inputStyle}
                  placeholder="ABC-1234"
                  value={placa}
                  onChange={e => setPlaca(e.target.value.toUpperCase())}
                  maxLength={10}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 font-medium mb-1 block">Modelo</label>
                <input
                  className={inputCls} style={inputStyle}
                  placeholder="Ex: Onix"
                  value={modelo}
                  onChange={e => setModelo(e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 font-medium mb-1 block">Serviço *</label>
              <select
                className={inputCls} style={inputStyle}
                value={servicoId}
                onChange={e => setServicoId(e.target.value)}
              >
                <option value="">Selecione o serviço</option>
                {servicos.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nome} — R$ {Number(s.preco).toFixed(0)}
                  </option>
                ))}
              </select>
            </div>

            {erro && <p className="text-sm text-red-400">{erro}</p>}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
              className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-opacity disabled:opacity-40 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)', color: '#000' }}
            >
              {saving ? <><Loader2 size={18} className="animate-spin" /> Criando...</> : 'Adicionar à fila'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
