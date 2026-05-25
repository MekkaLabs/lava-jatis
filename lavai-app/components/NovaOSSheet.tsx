'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { DEMO_SERVICOS, DEMO_CLIENTES, IS_DEMO } from '@/lib/demo'
import { X, Check, Loader2, User, Search } from 'lucide-react'

interface Servico { id: string; nome: string; preco: number }
interface Cliente {
  id: string
  nome: string
  telefone?: string | null
  placa?: string | null
  modelo_veiculo?: string | null
  cor?: string | null
}

interface NovaOSSheetProps {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

export default function NovaOSSheet({ open, onClose, onCreated }: NovaOSSheetProps) {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])

  // Cliente: autocomplete
  const [clienteQuery, setClienteQuery] = useState('')
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Carro (preenchido auto se cliente selecionado; editável se cliente novo)
  const [placa, setPlaca] = useState('')
  const [modelo, setModelo] = useState('')
  const [cor, setCor] = useState('')

  const [servicoId, setServicoId] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [erro, setErro] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Carrega serviços e clientes quando o sheet abre ──────────────────────
  useEffect(() => {
    if (!open) return
    if (IS_DEMO) {
      setServicos(DEMO_SERVICOS as Servico[])
      setClientes(DEMO_CLIENTES as Cliente[])
      return
    }
    const supabase = createClient()
    Promise.all([
      supabase.from('servicos').select('id, nome, preco').eq('ativo', true).order('nome'),
      supabase.from('clientes').select('id, nome, telefone, placa, modelo_veiculo, cor').order('nome'),
    ]).then(([sRes, cRes]) => {
      setServicos((sRes.data as Servico[]) ?? [])
      setClientes((cRes.data as Cliente[]) ?? [])
    })
  }, [open])

  // ── Reseta o form ao fechar ──────────────────────────────────────────────
  useEffect(() => {
    if (open) return
    const t = setTimeout(() => {
      setClienteQuery(''); setClienteSelecionado(null); setShowSuggestions(false)
      setPlaca(''); setModelo(''); setCor(''); setServicoId('')
      setSaving(false); setDone(false); setErro('')
    }, 300)
    return () => clearTimeout(t)
  }, [open])

  // ── Filtro do autocomplete de clientes ───────────────────────────────────
  const sugestoes = useMemo(() => {
    const q = clienteQuery.trim().toLowerCase()
    if (!q) return clientes.slice(0, 8) // top 8 quando vazio
    return clientes
      .filter(c =>
        c.nome.toLowerCase().includes(q) ||
        (c.telefone ?? '').toLowerCase().includes(q) ||
        (c.placa ?? '').toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [clienteQuery, clientes])

  // Quando o usuário escolhe cliente do dropdown
  function escolherCliente(c: Cliente) {
    setClienteSelecionado(c)
    setClienteQuery(c.nome)
    setPlaca(c.placa ?? '')
    setModelo(c.modelo_veiculo ?? '')
    setCor(c.cor ?? '')
    setShowSuggestions(false)
  }

  // Quando usuário muda o nome: se já tinha cliente selecionado, limpa
  function onClienteChange(v: string) {
    setClienteQuery(v)
    if (clienteSelecionado && v !== clienteSelecionado.nome) {
      setClienteSelecionado(null)
      // mantém o que ele já preencheu nos campos de carro
    }
    setShowSuggestions(true)
  }

  function trocarCliente() {
    setClienteSelecionado(null)
    setClienteQuery('')
    setPlaca(''); setModelo(''); setCor('')
    setShowSuggestions(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  if (!open) return null

  const isNovoCliente = !clienteSelecionado
  const nomeFinal = clienteSelecionado?.nome ?? clienteQuery.trim()
  const canSubmit = nomeFinal.length >= 2 && servicoId && placa.trim().length >= 4

  async function handleSubmit() {
    if (!canSubmit || saving) return
    setSaving(true); setErro('')
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10)

      if (IS_DEMO) {
        await new Promise(r => setTimeout(r, 600))
      } else {
        const res = await fetch('/api/atendimentos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clienteId: clienteSelecionado?.id,
            clienteNome: nomeFinal,
            servicoId,
            placa: placa.trim().toUpperCase(),
            modelo: modelo.trim() || undefined,
            cor: cor.trim() || undefined,
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

  const inputCls = 'w-full px-4 py-3 rounded-xl text-white text-base outline-none transition-colors'
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' } as const
  const readonlyStyle = { background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.15)', color: 'rgba(255,255,255,0.7)' } as const

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={saving ? undefined : onClose}
      />

      <div
        className="sheet-up relative w-full lg:max-w-md rounded-t-3xl lg:rounded-3xl p-5 safe-bottom"
        style={{ background: '#0f1117', borderTop: '1px solid rgba(0,212,255,0.15)', maxHeight: '88vh', overflowY: 'auto' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="lg:hidden absolute left-1/2 -translate-x-1/2 top-2 w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <h2 className="text-lg font-bold text-white mt-2">Nova OS</h2>
          <button onClick={saving ? undefined : onClose} aria-label="Fechar"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,230,118,0.15)', border: '1px solid rgba(0,230,118,0.4)' }}>
              <Check size={32} color="#00e676" strokeWidth={3} />
            </div>
            <p className="text-white font-semibold">OS criada!</p>
            <p className="text-gray-500 text-sm">Adicionada à fila</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* ── Cliente: autocomplete ────────────────────────────────── */}
            <div className="relative">
              <label className="text-xs text-gray-400 font-medium mb-1 block">Cliente *</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  ref={inputRef}
                  className={inputCls + ' pl-10'}
                  style={inputStyle}
                  placeholder="Buscar por nome, telefone ou placa…"
                  value={clienteQuery}
                  onChange={e => onClienteChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 180)} /* delay pra dar tempo do click */
                  autoFocus
                />
              </div>

              {showSuggestions && sugestoes.length > 0 && (
                <div
                  className="absolute z-10 left-0 right-0 mt-1 rounded-xl overflow-hidden max-h-64 overflow-y-auto"
                  style={{ background: '#12152a', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {sugestoes.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => escolherCliente(c)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 active:bg-white/10 text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff' }}>
                        {c.nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{c.nome}</p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {c.placa ?? '—'} {c.modelo_veiculo ? `· ${c.modelo_veiculo}` : ''} {c.telefone ? `· ${c.telefone}` : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Badge cliente novo vs existente */}
              {clienteQuery.length >= 2 && (
                <p className="text-[11px] mt-1 flex items-center gap-1.5"
                  style={{ color: clienteSelecionado ? '#00d4ff' : '#ffd600' }}>
                  <User size={12} />
                  {clienteSelecionado
                    ? <>Cliente <strong>existente</strong> selecionado · <button type="button" className="underline" onClick={trocarCliente}>trocar</button></>
                    : 'Cliente novo — será cadastrado'}
                </p>
              )}
            </div>

            {/* ── Dados do veículo (readonly se cliente existente) ─────── */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 font-medium mb-1 block">Placa *</label>
                <input
                  className={inputCls} style={isNovoCliente ? inputStyle : readonlyStyle}
                  placeholder="ABC-1234"
                  value={placa}
                  readOnly={!isNovoCliente}
                  onChange={e => setPlaca(e.target.value.toUpperCase())}
                  maxLength={10}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 font-medium mb-1 block">Modelo</label>
                <input
                  className={inputCls} style={isNovoCliente ? inputStyle : readonlyStyle}
                  placeholder="Ex: Onix"
                  value={modelo}
                  readOnly={!isNovoCliente}
                  onChange={e => setModelo(e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 font-medium mb-1 block">Cor</label>
              <input
                className={inputCls} style={isNovoCliente ? inputStyle : readonlyStyle}
                placeholder="Ex: Prata"
                value={cor}
                readOnly={!isNovoCliente}
                onChange={e => setCor(e.target.value)}
                maxLength={30}
              />
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
