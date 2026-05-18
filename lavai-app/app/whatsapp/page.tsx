'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import {
  MessageCircle,
  Settings,
  HelpCircle,
  Send,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  QrCode,
  Zap,
  BookOpen,
  Bot,
  User,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Conversa {
  id: string
  telefone: string
  estado: string
  ultima_mensagem_at: string
  ultima_mensagem?: {
    mensagem: string
    direcao: 'entrada' | 'saida'
    created_at: string
  } | null
}

interface Mensagem {
  id: string
  telefone: string
  mensagem: string
  direcao: 'entrada' | 'saida'
  estado_conversa?: string
  created_at: string
}

interface WhatsAppConfig {
  id?: string
  lava_jato_id?: string
  zapi_instance_id?: string
  zapi_token?: string
  zapi_client_token?: string
  numero_whatsapp?: string
  ativo?: boolean
  horario_inicio?: string
  horario_fim?: string
  mensagem_fora_horario?: string
}

interface StatusData {
  connected: boolean
  phone: string
  battery: number
  configured: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const estadoBadge: Record<string, { label: string; color: string }> = {
  inicio: { label: 'Menu', color: '#6b7280' },
  aguardando_nome: { label: 'Agendando', color: '#f59e0b' },
  aguardando_data: { label: 'Agendando', color: '#f59e0b' },
  aguardando_horario: { label: 'Agendando', color: '#f59e0b' },
  confirmando_agendamento: { label: 'Confirmando', color: '#8b5cf6' },
  aguardando_placa: { label: 'Placa', color: '#3b82f6' },
  aguardando_cpf: { label: 'Fidelidade', color: '#00e676' },
  finalizado: { label: 'Finalizado', color: '#00d4ff' },
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffH = (now.getTime() - d.getTime()) / 3600000
  if (diffH < 24) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diffH < 48) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function getInitials(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.slice(-2)
}

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.startsWith('55') && d.length >= 12) {
    const local = d.slice(2)
    if (local.length === 11) {
      return `+55 (${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
    }
    return `+55 (${local.slice(0, 2)}) ${local.slice(2)}`
  }
  return phone
}

// ─── ConversaRow ──────────────────────────────────────────────────────────────

function ConversaRow({
  conversa,
  active,
  onClick,
}: {
  conversa: Conversa
  active: boolean
  onClick: () => void
}) {
  const badge = estadoBadge[conversa.estado] ?? estadoBadge.inicio
  const lastMsg = conversa.ultima_mensagem
  const preview = lastMsg
    ? (lastMsg.direcao === 'saida' ? '↗ ' : '') +
      lastMsg.mensagem.slice(0, 55) +
      (lastMsg.mensagem.length > 55 ? '…' : '')
    : 'Sem mensagens'

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 flex items-center gap-3 transition-all"
      style={{
        background: active ? 'rgba(0,212,255,0.08)' : 'transparent',
        borderLeft: active ? '2px solid #00d4ff' : '2px solid transparent',
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
        style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff' }}
      >
        {getInitials(conversa.telefone)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-white text-sm font-medium truncate">
            {formatPhone(conversa.telefone)}
          </span>
          <span className="text-gray-500 text-xs flex-shrink-0">
            {formatTime(conversa.ultima_mensagem_at)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-gray-500 text-xs truncate">{preview}</span>
          <span
            className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ background: badge.color + '22', color: badge.color, fontSize: '10px' }}
          >
            {badge.label}
          </span>
        </div>
      </div>
    </button>
  )
}

// ─── MensagemBubble ───────────────────────────────────────────────────────────

function MensagemBubble({ msg }: { msg: Mensagem }) {
  const isOut = msg.direcao === 'saida'
  return (
    <div className={`flex ${isOut ? 'justify-end' : 'justify-start'} mb-2`}>
      {!isOut && (
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-auto"
          style={{ background: 'rgba(0,212,255,0.2)' }}
        >
          <User size={12} color="#00d4ff" />
        </div>
      )}
      <div
        className="max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed"
        style={{
          background: isOut ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.07)',
          border: isOut
            ? '1px solid rgba(0,230,118,0.18)'
            : '1px solid rgba(255,255,255,0.08)',
          color: isOut ? '#e8fff1' : '#e5e7eb',
          borderBottomRightRadius: isOut ? 4 : undefined,
          borderBottomLeftRadius: !isOut ? 4 : undefined,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {msg.mensagem}
        <div
          className="text-right mt-1"
          style={{
            fontSize: '10px',
            color: isOut ? 'rgba(0,230,118,0.5)' : 'rgba(255,255,255,0.25)',
          }}
        >
          {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
      {isOut && (
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center ml-2 flex-shrink-0 mt-auto"
          style={{ background: 'rgba(0,230,118,0.2)' }}
        >
          <Bot size={12} color="#00e676" />
        </div>
      )}
    </div>
  )
}

// ─── Tab: Conversas ───────────────────────────────────────────────────────────

function ConversasTab() {
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchConversas = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/conversas')
      if (res.ok) {
        const { conversas: data } = await res.json()
        setConversas(data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMensagens = useCallback(async (phone: string) => {
    const res = await fetch(`/api/whatsapp/conversas?telefone=${encodeURIComponent(phone)}`)
    if (res.ok) {
      const { mensagens: data } = await res.json()
      setMensagens(data ?? [])
    }
  }, [])

  useEffect(() => {
    fetchConversas()
    const t = setInterval(fetchConversas, 10000)
    return () => clearInterval(t)
  }, [fetchConversas])

  useEffect(() => {
    if (!selectedPhone) return
    fetchMensagens(selectedPhone)
    const t = setInterval(() => fetchMensagens(selectedPhone), 5000)
    return () => clearInterval(t)
  }, [selectedPhone, fetchMensagens])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  async function handleSend() {
    if (!replyText.trim() || !selectedPhone || sending) return
    setSending(true)
    try {
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: selectedPhone, message: replyText.trim() }),
      })
      setReplyText('')
      await fetchMensagens(selectedPhone)
      await fetchConversas()
    } finally {
      setSending(false)
    }
  }

  const selectedConversa = conversas.find((c) => c.telefone === selectedPhone)

  return (
    <div className="flex h-full" style={{ minHeight: 0 }}>
      {/* Left: list */}
      <div
        className="flex-shrink-0 overflow-y-auto"
        style={{ width: 300, borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-white text-sm font-semibold">
            Conversas{' '}
            {conversas.length > 0 && (
              <span className="text-gray-500 font-normal">({conversas.length})</span>
            )}
          </span>
          <button
            onClick={fetchConversas}
            className="text-gray-500 hover:text-cyan-400 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={16} className="text-gray-600 animate-spin" />
          </div>
        ) : conversas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageCircle size={32} className="text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">Nenhuma conversa ainda</p>
            <p className="text-gray-600 text-xs mt-1">
              As conversas aparecerão aqui quando clientes enviarem mensagens.
            </p>
          </div>
        ) : (
          conversas.map((c) => (
            <ConversaRow
              key={c.id}
              conversa={c}
              active={c.telefone === selectedPhone}
              onClick={() => setSelectedPhone(c.telefone)}
            />
          ))
        )}
      </div>

      {/* Right: chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedPhone ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(0,212,255,0.08)',
                border: '1px solid rgba(0,212,255,0.15)',
              }}
            >
              <MessageCircle size={28} color="#00d4ff" />
            </div>
            <p className="text-gray-500 text-sm">
              Selecione uma conversa para ver as mensagens
            </p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div
              className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff' }}
              >
                {getInitials(selectedPhone)}
              </div>
              <div>
                <div className="text-white text-sm font-medium">
                  {formatPhone(selectedPhone)}
                </div>
                {selectedConversa && (
                  <div className="text-gray-500 text-xs">
                    Estado:{' '}
                    <span
                      style={{
                        color:
                          estadoBadge[selectedConversa.estado]?.color ?? '#6b7280',
                      }}
                    >
                      {estadoBadge[selectedConversa.estado]?.label ??
                        selectedConversa.estado}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-4 py-4"
              style={{ minHeight: 0 }}
            >
              {mensagens.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-600 text-sm">Sem mensagens ainda</p>
                </div>
              ) : (
                mensagens.map((m) => <MensagemBubble key={m.id} msg={m} />)
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply */}
            <div
              className="flex-shrink-0 p-3 flex gap-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Responder manualmente..."
                className="flex-1 outline-none text-white text-sm"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  padding: '8px 12px',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!replyText.trim() || sending}
                className="flex items-center justify-center w-9 h-9 rounded-xl transition-all flex-shrink-0"
                style={{
                  background: replyText.trim()
                    ? '#00d4ff'
                    : 'rgba(255,255,255,0.05)',
                  color: replyText.trim() ? '#000' : '#555',
                }}
              >
                {sending ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Configurar ──────────────────────────────────────────────────────────

function ConfigurarTab({ lavaJatoId }: { lavaJatoId: string }) {
  const [config, setConfig] = useState<WhatsAppConfig>({
    ativo: false,
    horario_inicio: '08:00',
    horario_fim: '18:00',
    mensagem_fora_horario:
      'Olá! Estamos fora do horário de atendimento. Funcionamos das 8h às 18h.',
  })
  const [status, setStatus] = useState<StatusData | null>(null)
  const [saving, setSaving] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [showClientToken, setShowClientToken] = useState(false)
  const [appUrl, setAppUrl] = useState('')

  useEffect(() => {
    setAppUrl(window.location.origin)
    loadConfig()
  }, [])

  async function loadConfig() {
    const res = await fetch('/api/whatsapp/config')
    if (res.ok) {
      const { data } = await res.json()
      if (data) setConfig((prev) => ({ ...prev, ...data }))
    }
  }

  async function checkStatus() {
    setCheckingStatus(true)
    try {
      const res = await fetch('/api/whatsapp/status')
      if (res.ok) setStatus(await res.json())
    } finally {
      setCheckingStatus(false)
    }
  }

  async function saveConfig() {
    setSaving(true)
    try {
      const res = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
        await checkStatus()
      }
    } finally {
      setSaving(false)
    }
  }

  function copyWebhook() {
    navigator.clipboard.writeText(`${appUrl}/api/whatsapp/webhook/${lavaJatoId}`)
    setCopiedWebhook(true)
    setTimeout(() => setCopiedWebhook(false), 2000)
  }

  return (
    <div
      className="p-6 max-w-2xl space-y-5 overflow-y-auto h-full"
      style={{ minHeight: 0 }}
    >
      {/* Connection card */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Conexão Z-API</h3>
          <div className="flex items-center gap-2">
            {status !== null && (
              <div className="flex items-center gap-1.5">
                {status.connected ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 text-xs">Conectado</span>
                    {status.phone && (
                      <span className="text-gray-500 text-xs">· {status.phone}</span>
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-red-400 text-xs">Desconectado</span>
                  </>
                )}
              </div>
            )}
            <button
              onClick={checkStatus}
              disabled={checkingStatus}
              className="text-gray-500 hover:text-cyan-400 transition-colors"
            >
              <RefreshCw size={13} className={checkingStatus ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-gray-400 text-xs mb-1.5">Instance ID</label>
            <input
              value={config.zapi_instance_id ?? ''}
              onChange={(e) =>
                setConfig((c) => ({ ...c, zapi_instance_id: e.target.value }))
              }
              placeholder="Ex: 3ABC123DEF..."
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs mb-1.5">Token Z-API</label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={config.zapi_token ?? ''}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, zapi_token: e.target.value }))
                }
                placeholder="Token de autenticação"
                className="w-full rounded-xl px-3 py-2.5 pr-10 text-sm text-white outline-none"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              />
              <button
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-xs mb-1.5">
              Client Token{' '}
              <span className="text-gray-600">(verificação do webhook)</span>
            </label>
            <div className="relative">
              <input
                type={showClientToken ? 'text' : 'password'}
                value={config.zapi_client_token ?? ''}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, zapi_client_token: e.target.value }))
                }
                placeholder="Client token do painel Z-API"
                className="w-full rounded-xl px-3 py-2.5 pr-10 text-sm text-white outline-none"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              />
              <button
                onClick={() => setShowClientToken((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showClientToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* QR placeholder */}
          {status !== null && !status.connected && (
            <div
              className="flex flex-col items-center justify-center gap-2 py-5 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed rgba(255,255,255,0.08)',
              }}
            >
              <QrCode size={28} className="text-gray-600" />
              <p className="text-gray-600 text-xs text-center">
                Salve as credenciais e escaneie o QR Code no painel Z-API.
              </p>
              <a
                href="https://app.z-api.io"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-cyan-400 text-xs hover:underline"
              >
                Abrir painel Z-API <ExternalLink size={10} />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Webhook URL */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <h3 className="text-white font-semibold mb-2">URL do Webhook</h3>
        <p className="text-gray-500 text-xs mb-3">
          Configure no painel Z-API em{' '}
          <strong className="text-gray-400">
            Instância → Webhooks → Ao receber mensagem
          </strong>
          :
        </p>
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <code className="flex-1 text-cyan-400 text-xs break-all font-mono">
            {appUrl}/api/whatsapp/webhook/{lavaJatoId || '[lavaJatoId]'}
          </code>
          <button
            onClick={copyWebhook}
            className="flex-shrink-0 text-gray-500 hover:text-cyan-400 transition-colors"
          >
            {copiedWebhook ? (
              <Check size={14} className="text-green-400" />
            ) : (
              <Copy size={14} />
            )}
          </button>
        </div>
      </div>

      {/* Hours */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Horário de Atendimento</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-gray-400 text-xs">Bot ativo</span>
            <div
              className="relative w-10 h-5 rounded-full transition-colors"
              style={{
                background: config.ativo ? '#00d4ff' : 'rgba(255,255,255,0.1)',
              }}
              onClick={() => setConfig((c) => ({ ...c, ativo: !c.ativo }))}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: config.ativo ? '22px' : '2px' }}
              />
            </div>
          </label>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-gray-400 text-xs mb-1.5">Início</label>
            <input
              type="time"
              value={config.horario_inicio ?? '08:00'}
              onChange={(e) =>
                setConfig((c) => ({ ...c, horario_inicio: e.target.value }))
              }
              className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-gray-400 text-xs mb-1.5">Fim</label>
            <input
              type="time"
              value={config.horario_fim ?? '18:00'}
              onChange={(e) =>
                setConfig((c) => ({ ...c, horario_fim: e.target.value }))
              }
              className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-400 text-xs mb-1.5">
            Mensagem fora do horário
          </label>
          <textarea
            value={config.mensagem_fora_horario ?? ''}
            onChange={(e) =>
              setConfig((c) => ({ ...c, mensagem_fora_horario: e.target.value }))
            }
            rows={3}
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none resize-none"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            placeholder="Olá! Estamos fora do horário de atendimento..."
          />
        </div>
      </div>

      {/* Save */}
      <button
        onClick={saveConfig}
        disabled={saving}
        className="w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
        style={{
          background: saved
            ? 'rgba(0,230,118,0.15)'
            : 'linear-gradient(135deg,#00d4ff,#4f8eff)',
          color: saved ? '#00e676' : '#000',
          border: saved ? '1px solid rgba(0,230,118,0.3)' : 'none',
        }}
      >
        {saving ? (
          <>
            <RefreshCw size={14} className="animate-spin" /> Salvando...
          </>
        ) : saved ? (
          <>
            <Check size={14} /> Salvo com sucesso!
          </>
        ) : (
          'Salvar e Conectar'
        )}
      </button>
    </div>
  )
}

// ─── Tab: Ajuda ───────────────────────────────────────────────────────────────

function AjudaTab() {
  const [testPhone, setTestPhone] = useState('')
  const [sending, setSending] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  const steps = [
    {
      n: 1,
      title: 'Crie uma conta no Z-API',
      desc: 'Acesse app.z-api.io e crie sua conta gratuita (plano free disponível).',
      link: 'https://app.z-api.io',
    },
    {
      n: 2,
      title: 'Crie uma instância',
      desc: 'No painel Z-API, clique em "Criar instância" e escolha um nome.',
    },
    {
      n: 3,
      title: 'Conecte seu WhatsApp via QR Code',
      desc: 'Abra o WhatsApp → Aparelhos conectados → Conectar aparelho → escaneie o QR.',
    },
    {
      n: 4,
      title: 'Copie suas credenciais',
      desc: 'Na instância, copie o Instance ID, o Token e o Client Token.',
    },
    {
      n: 5,
      title: 'Cole na aba Configurar',
      desc: 'Volte à aba "Configurar", cole as credenciais e clique em "Salvar e Conectar".',
    },
    {
      n: 6,
      title: 'Configure o webhook no Z-API',
      desc: 'Na instância → Webhooks → "Ao receber mensagem", cole a URL exibida na aba Configurar.',
    },
    {
      n: 7,
      title: 'Teste o bot!',
      desc: 'Envie "oi" para o número conectado e veja a resposta automática do bot.',
    },
  ]

  async function sendTestMessage() {
    if (!testPhone.trim()) return
    setSending(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone,
          message:
            '👋 Olá! Esta é uma mensagem de teste do bot LAVAI. Se você está recebendo isso, a integração Z-API está funcionando! 🎉',
        }),
      })
      setTestResult(res.ok ? 'success' : 'error')
    } catch {
      setTestResult('error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl space-y-5 overflow-y-auto h-full" style={{ minHeight: 0 }}>
      {/* Guide */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={15} color="#00d4ff" />
          <h3 className="text-white font-semibold">Guia de Configuração</h3>
        </div>
        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.n} className="flex gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff' }}
              >
                {step.n}
              </div>
              <div>
                <div className="text-white text-sm font-medium mb-0.5">{step.title}</div>
                <div className="text-gray-500 text-xs">{step.desc}</div>
                {step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-400 text-xs mt-1 hover:underline"
                  >
                    {step.link} <ExternalLink size={9} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap size={15} color="#00d4ff" />
          <h3 className="text-white font-semibold">Enviar Mensagem de Teste</h3>
        </div>
        <p className="text-gray-500 text-xs mb-3">
          Envia uma mensagem de teste para verificar se a integração está funcionando.
        </p>
        <div className="flex gap-2">
          <input
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="Ex: 5511999999999"
            className="flex-1 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
          <button
            onClick={sendTestMessage}
            disabled={!testPhone.trim() || sending}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
            style={{
              background: testPhone.trim()
                ? 'rgba(0,212,255,0.12)'
                : 'rgba(255,255,255,0.04)',
              color: testPhone.trim() ? '#00d4ff' : '#555',
              border: `1px solid ${testPhone.trim() ? 'rgba(0,212,255,0.25)' : 'transparent'}`,
            }}
          >
            {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
            Testar
          </button>
        </div>
        {testResult === 'success' && (
          <div className="flex items-center gap-2 mt-3 text-green-400 text-xs">
            <CheckCircle2 size={13} /> Mensagem enviada com sucesso!
          </div>
        )}
        {testResult === 'error' && (
          <div className="flex items-center gap-2 mt-3 text-red-400 text-xs">
            <AlertCircle size={13} /> Erro ao enviar. Verifique as credenciais Z-API.
          </div>
        )}
      </div>

      {/* Links */}
      <div className="flex gap-3">
        <a
          href="https://developer.z-api.io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-all"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#9ca3af',
          }}
        >
          <ExternalLink size={14} /> Documentação Z-API
        </a>
        <a
          href="https://app.z-api.io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-all"
          style={{
            background: 'rgba(0,212,255,0.06)',
            border: '1px solid rgba(0,212,255,0.15)',
            color: '#00d4ff',
          }}
        >
          <ExternalLink size={14} /> Painel Z-API
        </a>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'conversas', label: 'Conversas', icon: MessageCircle },
  { id: 'configurar', label: 'Configurar', icon: Settings },
  { id: 'ajuda', label: 'Ajuda', icon: HelpCircle },
] as const

type Tab = (typeof TABS)[number]['id']

export default function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState<Tab>('conversas')
  const [lavaJatoId, setLavaJatoId] = useState<string>('')

  useEffect(() => {
    fetch('/api/whatsapp/config')
      .then((r) => r.json())
      .then((d) => {
        if (d?.data?.lava_jato_id) setLavaJatoId(d.data.lava_jato_id)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#08090f' }}>
      <Sidebar />
      <main className="flex-1 ml-[220px] flex flex-col overflow-hidden">
        <Header
          title="WhatsApp Bot"
          subtitle="Atendimento automático via Z-API"
        />

        {/* Tab bar */}
        <div
          className="flex-shrink-0 flex items-center gap-1 px-4 pt-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all"
              style={{
                color: activeTab === id ? '#00d4ff' : '#6b7280',
                background: activeTab === id ? 'rgba(0,212,255,0.08)' : 'transparent',
                borderBottom: activeTab === id ? '2px solid #00d4ff' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'conversas' && <ConversasTab />}
          {activeTab === 'configurar' && <ConfigurarTab lavaJatoId={lavaJatoId} />}
          {activeTab === 'ajuda' && <AjudaTab />}
        </div>
      </main>
    </div>
  )
}
