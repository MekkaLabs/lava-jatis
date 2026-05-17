'use client'

import { useState, useRef, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { lavaJato } from '@/lib/mock-data'
import {
  User, CreditCard, Bell, Plug, AlertTriangle, Check, X, Copy, Upload,
  ExternalLink, ChevronRight, Download, Trash2, ToggleLeft, ToggleRight,
  CheckCircle, Clock, ZapOff, Zap,
} from 'lucide-react'

type Tab = 'perfil' | 'plano' | 'notificacoes' | 'integracoes' | 'avancado'

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
      style={{ background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.3)', backdropFilter: 'blur(12px)' }}>
      <CheckCircle size={16} className="text-green-400" />
      <span className="text-sm font-semibold text-green-400">{msg}</span>
    </div>
  )
}

// ── Perfil Tab ────────────────────────────────────────────────
const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

function PerfilTab({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({
    nome: lavaJato.name, whatsapp: lavaJato.phone, cidade: 'São Paulo', estado: 'SP',
    endereco: lavaJato.address, cnpj: '12.345.678/0001-90',
  })
  const [saving, setSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [horarios, setHorarios] = useState(DIAS.map((d, i) => ({
    dia: d, ativo: i < 6, abertura: '07:00', fechamento: '19:00',
  })))

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    onSave()
  }

  return (
    <div className="space-y-6">
      {/* Logo upload */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h3 className="text-sm font-bold text-white mb-4">Logo do Lava-Jato</h3>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{ background: logoPreview ? 'transparent' : 'rgba(0,212,255,0.08)', border: '2px dashed rgba(0,212,255,0.25)' }}>
            {logoPreview
              ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              : <Upload size={22} className="text-cyan-400/50" />}
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-300 hover:text-white transition-colors mb-1"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Upload size={14} /> Escolher imagem
            </button>
            <p className="text-xs text-gray-500">PNG, JPG ou SVG. Máximo 2MB.</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h3 className="text-sm font-bold text-white mb-5">Dados do Estabelecimento</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'nome', label: 'Nome do Lava-Jato', placeholder: 'Lava-Jato do Marcos', full: true },
            { key: 'whatsapp', label: 'Telefone / WhatsApp', placeholder: '(11) 99999-8888' },
            { key: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0001-00' },
            { key: 'cidade', label: 'Cidade', placeholder: 'São Paulo' },
            { key: 'estado', label: 'Estado', placeholder: 'SP' },
            { key: 'endereco', label: 'Endereço completo', placeholder: 'Rua, número, bairro', full: true },
          ].map(({ key, label, placeholder, full }) => (
            <div key={key} className={full ? 'col-span-2' : ''}>
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">{label}</label>
              <input type="text" value={form[key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-cyan-400/30 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Horários */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h3 className="text-sm font-bold text-white mb-5">Horário de Funcionamento</h3>
        <div className="space-y-3">
          {horarios.map((h, i) => (
            <div key={h.dia} className="flex items-center gap-4">
              <button onClick={() => setHorarios(hs => hs.map((x, j) => j === i ? { ...x, ativo: !x.ativo } : x))}
                className="flex items-center gap-2 w-28 flex-shrink-0">
                {h.ativo
                  ? <ToggleRight size={20} className="text-cyan-400" />
                  : <ToggleLeft size={20} className="text-gray-600" />}
                <span className={`text-sm font-medium ${h.ativo ? 'text-white' : 'text-gray-500'}`}>{h.dia}</span>
              </button>
              {h.ativo ? (
                <div className="flex items-center gap-2">
                  <input type="time" value={h.abertura}
                    onChange={e => setHorarios(hs => hs.map((x, j) => j === i ? { ...x, abertura: e.target.value } : x))}
                    className="px-3 py-1.5 rounded-lg text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <span className="text-gray-500 text-sm">às</span>
                  <input type="time" value={h.fechamento}
                    onChange={e => setHorarios(hs => hs.map((x, j) => j === i ? { ...x, fechamento: e.target.value } : x))}
                    className="px-3 py-1.5 rounded-lg text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              ) : (
                <span className="text-xs text-gray-600 italic">Fechado</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
          {saving ? <><Clock size={14} /> Salvando...</> : <><Check size={14} /> Salvar Alterações</>}
        </button>
      </div>
    </div>
  )
}

// ── Plano Tab ─────────────────────────────────────────────────
function PlanoTab() {
  const [showCancelModal, setShowCancelModal] = useState(false)
  const invoices = [
    { data: '2026-05-01', valor: 'R$ 97,00', status: 'pago', id: 'inv-001' },
    { data: '2026-04-01', valor: 'R$ 97,00', status: 'pago', id: 'inv-002' },
    { data: '2026-03-01', valor: 'R$ 97,00', status: 'pago', id: 'inv-003' },
    { data: '2026-02-01', valor: 'R$ 97,00', status: 'pago', id: 'inv-004' },
  ]

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Plano Pro</h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(0,230,118,0.12)', color: '#00e676', border: '1px solid rgba(0,230,118,0.2)' }}>
                Ativo
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Próxima cobrança em <span className="text-white font-semibold">01/06/2026</span></p>
            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>R$ 97<span className="text-sm text-gray-400 font-normal">/mês</span></p>
          </div>
          <a href="/planos"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black"
            style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
            <Zap size={14} /> Fazer Upgrade
          </a>
        </div>

        {/* Usage bars */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          {[
            { label: 'Funcionários', used: 3, total: 3, color: '#f87171' },
            { label: 'Unidades', used: 1, total: 1, color: '#fbbf24' },
          ].map(u => (
            <div key={u.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-400">{u.label}</span>
                <span className="text-xs font-semibold" style={{ color: u.color }}>{u.used}/{u.total}</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-2 rounded-full" style={{ width: `${(u.used / u.total) * 100}%`, background: u.color }} />
              </div>
              {u.used >= u.total && <p className="text-xs mt-1" style={{ color: u.color }}>Limite atingido — faça upgrade</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Invoice history */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-sm font-bold text-white">Histórico de Faturas</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {['Data', 'Valor', 'Status', 'Fatura'].map(h => (
                <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, i) => (
              <tr key={inv.id} style={{ borderBottom: i < invoices.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <td className="px-5 py-3"><span className="text-sm text-gray-300">{new Date(inv.data).toLocaleDateString('pt-BR')}</span></td>
                <td className="px-5 py-3"><span className="text-sm font-semibold text-white">{inv.valor}</span></td>
                <td className="px-5 py-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(0,230,118,0.12)', color: '#00e676' }}>pago</span>
                </td>
                <td className="px-5 py-3">
                  <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-cyan-400 transition-colors">
                    <Download size={12} /> PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cancel plan */}
      <div className="rounded-2xl p-5 flex items-center justify-between"
        style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.15)' }}>
        <div>
          <p className="text-sm font-semibold text-red-400 mb-0.5">Cancelar Plano</p>
          <p className="text-xs text-gray-500">O acesso será mantido até o fim do período pago</p>
        </div>
        <button onClick={() => setShowCancelModal(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-red-400 hover:text-white transition-colors"
          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
          Cancelar plano
        </button>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} onClick={() => setShowCancelModal(false)}>
          <div className="rounded-2xl p-6 w-full max-w-sm text-center"
            style={{ background: '#0f1117', border: '1px solid rgba(248,113,113,0.3)' }} onClick={e => e.stopPropagation()}>
            <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Cancelar plano?</h3>
            <p className="text-sm text-gray-400 mb-5">Você perderá acesso a todas as funcionalidades Pro no fim do período atual.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-400"
                style={{ background: 'rgba(255,255,255,0.05)' }}>Voltar</button>
              <button onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: 'rgba(248,113,113,0.8)' }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Notificações Tab ──────────────────────────────────────────
const NOTIF_SECTIONS = [
  {
    key: 'email', label: 'E-mail', icon: '📧',
    items: ['Nova OS', 'Pagamento confirmado', 'Inadimplência', 'Relatório semanal'],
  },
  {
    key: 'push', label: 'Push', icon: '🔔',
    items: ['Novo cliente na fila', 'OS concluída', 'Funcionário atrasado'],
  },
  {
    key: 'whatsapp', label: 'WhatsApp', icon: '💬',
    items: ['Confirmação de agendamento', 'Lembrete de serviço'],
  },
]

function NotificacoesTab({ onSave }: { onSave: () => void }) {
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      return JSON.parse(localStorage.getItem('lavai_notif_toggles') || '{}')
    } catch { return {} }
  })

  function toggle(key: string) {
    setToggles(t => ({ ...t, [key]: !t[key] }))
  }

  function handleSave() {
    if (typeof window !== 'undefined') localStorage.setItem('lavai_notif_toggles', JSON.stringify(toggles))
    onSave()
  }

  return (
    <div className="space-y-4">
      {NOTIF_SECTIONS.map(section => (
        <div key={section.key} className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-lg">{section.icon}</span>
            <span className="text-sm font-bold text-white">{section.label}</span>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {section.items.map(item => {
              const key = `${section.key}_${item}`
              const isOn = toggles[key] !== false // default on
              return (
                <div key={item} className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-sm text-gray-300">{item}</span>
                  <button onClick={() => toggle(key)}
                    className="flex items-center transition-all">
                    {isOn
                      ? <ToggleRight size={26} className="text-cyan-400" />
                      : <ToggleLeft size={26} className="text-gray-600" />}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <button onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-black"
          style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
          <Check size={14} /> Salvar Preferências
        </button>
      </div>
    </div>
  )
}

// ── Integrações Tab ───────────────────────────────────────────
const INTEGRACOES = [
  {
    key: 'whatsapp', emoji: '💬', name: 'WhatsApp Business', desc: 'Conecte seu número e automatize mensagens com clientes',
    connected: true, detail: '+55 11 99999-8888',
  },
  {
    key: 'ga', emoji: '📊', name: 'Google Analytics', desc: 'Acompanhe o tráfego e engajamento do seu app',
    connected: false, detail: null,
  },
  {
    key: 'asaas', emoji: '💳', name: 'Asaas Pagamentos', desc: 'Gateway de pagamento e cobranças recorrentes',
    connected: true, detail: 'Conta: lava-jato-marcos',
  },
  {
    key: 'zapier', emoji: '⚡', name: 'Zapier', desc: 'Automatize tarefas conectando com mais de 5000 apps',
    connected: false, detail: null, webhookUrl: 'https://hooks.zapier.com/hooks/catch/12345/abcdef/',
  },
]

function IntegracoesTab() {
  const [integrations, setIntegrations] = useState(INTEGRACOES)
  const [gaId, setGaId] = useState('')
  const [copied, setCopied] = useState(false)

  function toggleConnect(key: string) {
    setIntegrations(is => is.map(i => i.key === key ? { ...i, connected: !i.connected } : i))
  }

  function copyWebhook(url: string) {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div className="space-y-4">
      {integrations.map(integ => (
        <div key={integ.key} className="rounded-2xl p-5 flex items-start gap-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-3xl flex-shrink-0 mt-0.5">{integ.emoji}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-sm font-bold text-white">{integ.name}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={integ.connected
                  ? { background: 'rgba(0,230,118,0.12)', color: '#00e676', border: '1px solid rgba(0,230,118,0.2)' }
                  : { background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }}>
                {integ.connected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-2">{integ.desc}</p>
            {integ.connected && integ.detail && (
              <p className="text-xs text-cyan-400 mb-2">{integ.detail}</p>
            )}
            {integ.key === 'ga' && !integ.connected && (
              <div className="flex items-center gap-2 mt-2">
                <input type="text" value={gaId} onChange={e => setGaId(e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  className="px-3 py-1.5 rounded-lg text-xs text-white outline-none flex-1"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
            )}
            {integ.key === 'zapier' && integ.connected && integ.webhookUrl && (
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-lg flex-1 truncate">{integ.webhookUrl}</code>
                <button onClick={() => copyWebhook(integ.webhookUrl!)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex-shrink-0">
                  {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                </button>
              </div>
            )}
            {integ.key === 'whatsapp' && integ.connected && (
              <div className="mt-2 p-3 rounded-xl text-center"
                style={{ background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.15)' }}>
                <p className="text-xs text-gray-400 mb-1">QR Code para reconexão</p>
                <div className="w-20 h-20 mx-auto rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-2xl">📱</span>
                </div>
              </div>
            )}
          </div>
          <button onClick={() => toggleConnect(integ.key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all flex-shrink-0"
            style={integ.connected
              ? { background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }
              : { background: 'linear-gradient(135deg,#00d4ff,#4f8eff)', color: '#000' }}>
            {integ.connected ? <><ZapOff size={12} /> Desconectar</> : <><Zap size={12} /> Conectar</>}
          </button>
        </div>
      ))}
    </div>
  )
}

// ── Avançado Tab ──────────────────────────────────────────────
function AvancadoTab() {
  const [excluirModal, setExcluirModal] = useState(false)
  const [excluirInput, setExcluirInput] = useState('')
  const [limpando, setLimpando] = useState(false)

  function handleExportJSON() {
    const data = { exportedAt: new Date().toISOString(), lavaJato, clientes: [], atendimentos: [], despesas: [] }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'lavai-export.json'; a.click()
    URL.revokeObjectURL(url)
  }

  async function handleLimpar() {
    setLimpando(true)
    await new Promise(r => setTimeout(r, 1200))
    setLimpando(false)
  }

  const dangerCards = [
    {
      title: 'Exportar todos os dados',
      desc: 'Baixe um arquivo JSON com todos os seus dados: clientes, atendimentos e configurações.',
      icon: <Download size={18} />, color: '#00d4ff',
      action: 'Exportar JSON',
      onClick: handleExportJSON,
      danger: false,
    },
    {
      title: 'Limpar dados de teste',
      desc: 'Remove todos os registros de exemplo criados durante onboarding. Esta ação não pode ser desfeita.',
      icon: <Trash2 size={18} />, color: '#fbbf24',
      action: limpando ? 'Limpando...' : 'Limpar dados',
      onClick: handleLimpar,
      danger: false,
    },
    {
      title: 'Excluir conta',
      desc: 'Exclui permanentemente sua conta e todos os dados associados. Não há volta.',
      icon: <AlertTriangle size={18} />, color: '#f87171',
      action: 'Excluir conta',
      onClick: () => setExcluirModal(true),
      danger: true,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 flex items-start gap-3 mb-2"
        style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)' }}>
        <AlertTriangle size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-yellow-400/80">Esta seção contém ações irreversíveis. Proceda com cautela.</p>
      </div>

      {dangerCards.map(card => (
        <div key={card.title} className="rounded-2xl p-5 flex items-start gap-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${card.danger ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${card.color}18`, color: card.color }}>{card.icon}</div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white mb-1">{card.title}</p>
            <p className="text-xs text-gray-500">{card.desc}</p>
          </div>
          <button onClick={card.onClick}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all flex-shrink-0"
            style={card.danger
              ? { background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }
              : { background: 'rgba(255,255,255,0.06)', color: card.color, border: '1px solid rgba(255,255,255,0.1)' }}>
            {card.action}
          </button>
        </div>
      ))}

      {excluirModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} onClick={() => setExcluirModal(false)}>
          <div className="rounded-2xl p-6 w-full max-w-sm"
            style={{ background: '#0f1117', border: '1px solid rgba(248,113,113,0.3)' }} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(248,113,113,0.12)' }}>
              <AlertTriangle size={22} className="text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-2">Excluir conta permanentemente?</h3>
            <p className="text-xs text-gray-400 text-center mb-5">Esta ação é irreversível. Digite <span className="text-red-400 font-bold">EXCLUIR</span> para confirmar.</p>
            <input type="text" value={excluirInput} onChange={e => setExcluirInput(e.target.value)}
              placeholder="Digite EXCLUIR" className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none mb-4 text-center"
              style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.25)' }} />
            <div className="flex gap-3">
              <button onClick={() => { setExcluirModal(false); setExcluirInput('') }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-400"
                style={{ background: 'rgba(255,255,255,0.05)' }}>Cancelar</button>
              <button disabled={excluirInput !== 'EXCLUIR'}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-30"
                style={{ background: excluirInput === 'EXCLUIR' ? 'rgba(248,113,113,0.8)' : 'rgba(248,113,113,0.2)' }}>
                Excluir conta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'perfil', label: 'Perfil', icon: <User size={15} /> },
  { key: 'plano', label: 'Plano', icon: <CreditCard size={15} /> },
  { key: 'notificacoes', label: 'Notificações', icon: <Bell size={15} /> },
  { key: 'integracoes', label: 'Integrações', icon: <Plug size={15} /> },
  { key: 'avancado', label: 'Avançado', icon: <AlertTriangle size={15} /> },
]

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('perfil')
  const [toast, setToast] = useState('')

  function showToast(msg: string) { setToast(msg) }

  return (
    <div className="flex min-h-screen" style={{ background: '#08090f' }}>
      <Sidebar />
      <div className="flex-1 ml-[220px] flex flex-col min-h-screen">
        <Header title="Configurações" subtitle="Gerencie as configurações do seu lava-jato" />

        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            {/* Tab bar */}
            <div className="flex gap-1 p-1 rounded-2xl mb-6"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 flex-1 justify-center py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.key ? 'text-black' : 'text-gray-400 hover:text-white'}`}
                  style={activeTab === tab.key ? { background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' } : {}}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'perfil' && <PerfilTab onSave={() => showToast('Configurações salvas com sucesso!')} />}
            {activeTab === 'plano' && <PlanoTab />}
            {activeTab === 'notificacoes' && <NotificacoesTab onSave={() => showToast('Preferências de notificação salvas!')} />}
            {activeTab === 'integracoes' && <IntegracoesTab />}
            {activeTab === 'avancado' && <AvancadoTab />}
          </div>
        </main>
      </div>

      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
    </div>
  )
}
