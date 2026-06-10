'use client'

import { useState, useRef, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import WipBanner from '@/components/ui/WipBanner'
import { IS_DEMO, DEMO_SERVICOS_FULL } from '@/lib/demo'
import { createClient } from '@/lib/supabase'
import { lavaJato } from '@/lib/mock-data'
import { formatCurrency } from '@/lib/utils'
import {
  User, CreditCard, Bell, Plug, AlertTriangle, Check, X, Copy, Upload,
  ExternalLink, ChevronRight, Download, Trash2, ToggleLeft, ToggleRight,
  CheckCircle, Clock, ZapOff, Zap, ShieldCheck, KeyRound, Loader2,
  Wrench, Plus, Pencil,
} from 'lucide-react'

type Tab = 'perfil' | 'plano' | 'notificacoes' | 'integracoes' | 'servicos' | 'seguranca' | 'avancado'

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
        <div className="table-scroll">
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

// ── Segurança Tab (2FA / TOTP) ────────────────────────────────
type MfaStatus = 'loading' | 'none' | 'enrolling' | 'active'

function SegurancaTab({ onToast }: { onToast: (msg: string) => void }) {
  const [status, setStatus] = useState<MfaStatus>(IS_DEMO ? 'none' : 'loading')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState('')

  // Carrega fatores existentes
  useEffect(() => {
    if (IS_DEMO) return
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.mfa.listFactors()
        if (error) throw error
        const verified = data?.totp?.find(f => f.status === 'verified')
        if (cancelled) return
        if (verified) { setFactorId(verified.id); setStatus('active') }
        else setStatus('none')
      } catch {
        if (!cancelled) setStatus('none')
      }
    })()
    return () => { cancelled = true }
  }, [])

  async function iniciarEnroll() {
    setErro(''); setBusy(true)
    try {
      const supabase = createClient()
      // Remove fatores TOTP não-verificados pendentes (evita conflito de nome)
      const { data: list } = await supabase.auth.mfa.listFactors()
      for (const f of list?.totp ?? []) {
        if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id })
      }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'LAVAI 2FA' })
      if (error) throw error
      setFactorId(data.id)
      setQrCode(data.totp.qr_code)
      setSecret(data.totp.secret)
      setStatus('enrolling')
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao iniciar 2FA')
    } finally {
      setBusy(false)
    }
  }

  async function verificarCodigo() {
    if (!factorId || code.replace(/\D/g, '').length !== 6) { setErro('Digite o código de 6 dígitos.'); return }
    setErro(''); setBusy(true)
    try {
      const supabase = createClient()
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId })
      if (chErr) throw chErr
      const { error: vErr } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code: code.replace(/\D/g, '') })
      if (vErr) throw vErr
      setStatus('active'); setCode(''); setQrCode(''); setSecret('')
      onToast('Autenticação em duas etapas ativada!')
    } catch (e: any) {
      setErro(e?.message ?? 'Código inválido. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  async function cancelarEnroll() {
    setBusy(true)
    try {
      const supabase = createClient()
      if (factorId) await supabase.auth.mfa.unenroll({ factorId })
    } catch { /* noop */ }
    finally {
      setFactorId(null); setQrCode(''); setSecret(''); setCode(''); setErro(''); setStatus('none'); setBusy(false)
    }
  }

  async function desativar() {
    if (!factorId) return
    if (!confirm('Desativar a autenticação em duas etapas?')) return
    setBusy(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.mfa.unenroll({ factorId })
      if (error) throw error
      setFactorId(null); setStatus('none')
      onToast('2FA desativada.')
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao desativar 2FA')
    } finally {
      setBusy(false)
    }
  }

  const card = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' } as const

  if (IS_DEMO) {
    return (
      <div className="rounded-2xl p-6" style={card}>
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck size={18} className="text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Autenticação em duas etapas (2FA)</h3>
        </div>
        <p className="text-sm text-gray-500">Disponível com conta real. No modo demo a 2FA fica desabilitada.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-6 space-y-5" style={card}>
      <div className="flex items-center gap-3">
        <ShieldCheck size={18} className={status === 'active' ? 'text-green-400' : 'text-cyan-400'} />
        <div>
          <h3 className="text-sm font-bold text-white">Autenticação em duas etapas (2FA)</h3>
          <p className="text-xs text-gray-500">Protege sua conta exigindo um código do app autenticador no login.</p>
        </div>
      </div>

      {status === 'loading' && (
        <p className="text-sm text-gray-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Carregando...</p>
      )}

      {status === 'active' && (
        <div className="flex items-center justify-between rounded-xl p-4" style={{ background: 'rgba(0,230,118,0.07)', border: '1px solid rgba(0,230,118,0.2)' }}>
          <span className="flex items-center gap-2 text-sm font-semibold text-green-400"><CheckCircle size={15} /> 2FA está ativa</span>
          <button onClick={desativar} disabled={busy}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }}>
            Desativar
          </button>
        </div>
      )}

      {status === 'none' && (
        <button onClick={iniciarEnroll} disabled={busy}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />} Ativar 2FA
        </button>
      )}

      {status === 'enrolling' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-300">1. Escaneie o QR code com seu app autenticador (Google Authenticator, Authy, 1Password):</p>
          {qrCode && (
            // qr_code do Supabase é um data-URI SVG — seguro renderizar direto
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrCode} alt="QR code 2FA" className="w-44 h-44 rounded-xl bg-white p-2" />
          )}
          {secret && (
            <p className="text-xs text-gray-500">
              Ou insira manualmente: <code className="text-cyan-400 break-all">{secret}</code>
            </p>
          )}
          <p className="text-sm text-gray-300">2. Digite o código de 6 dígitos gerado:</p>
          <input
            value={code}
            onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setErro('') }}
            inputMode="numeric" placeholder="000000" maxLength={6}
            className="w-40 px-4 py-3 rounded-xl text-white text-lg tracking-[0.4em] text-center outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
          />
          <div className="flex gap-3">
            <button onClick={cancelarEnroll} disabled={busy}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.05)' }}>Cancelar</button>
            <button onClick={verificarCodigo} disabled={busy || code.length !== 6}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Verificar e ativar
            </button>
          </div>
        </div>
      )}

      {erro && <p className="text-sm text-red-400">{erro}</p>}
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

// ── Serviços e valores Tab ────────────────────────────────────
interface Servico {
  id: string
  nome: string
  descricao?: string | null
  categoria?: string | null
  preco: number
  duracao_minutos?: number | null
  ativo: boolean
}

function ServicoModal({ servico, onClose, onSaved, isDemo }: {
  servico?: Servico | null; onClose: () => void; onSaved: (s: Servico) => void; isDemo: boolean
}) {
  const isEdit = !!servico
  const [form, setForm] = useState({
    nome: servico?.nome ?? '',
    descricao: servico?.descricao ?? '',
    categoria: servico?.categoria ?? '',
    preco: servico?.preco != null ? String(servico.preco) : '',
    duracao_minutos: servico?.duracao_minutos != null ? String(servico.duracao_minutos) : '30',
    ativo: servico?.ativo ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSubmit() {
    if (!form.nome.trim()) { setErro('Nome é obrigatório'); return }
    const preco = Number(form.preco)
    if (form.preco === '' || isNaN(preco) || preco < 0) { setErro('Preço deve ser maior ou igual a zero'); return }
    setSaving(true); setErro('')
    if (isDemo) {
      await new Promise(r => setTimeout(r, 400))
      onSaved({
        id: isEdit ? servico!.id : `demo-s-${Date.now()}`,
        nome: form.nome.trim(), descricao: form.descricao.trim() || null, categoria: form.categoria.trim() || null,
        preco, duracao_minutos: Number(form.duracao_minutos) || 0, ativo: form.ativo,
      })
      onClose(); setSaving(false); return
    }
    try {
      const url = isEdit ? `/api/servicos/${servico!.id}` : '/api/servicos'
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: form.nome.trim(), descricao: form.descricao.trim() || null, categoria: form.categoria.trim() || null, preco, duracao_minutos: Number(form.duracao_minutos) || 0, ativo: form.ativo }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro desconhecido')
      onSaved(json.data); onClose()
    } catch (e: any) { setErro(e.message) } finally { setSaving(false) }
  }

  const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-cyan-400/50'
  const inputSt = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' } as const
  const lbl = 'text-xs text-gray-400 font-medium block mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#0d0f1a', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">{isEdit ? 'Editar Serviço' : 'Novo Serviço'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div><label className={lbl}>Nome *</label><input value={form.nome} onChange={set('nome')} placeholder="Lavagem Completa" className={inputCls} style={inputSt} /></div>
          <div><label className={lbl}>Descrição</label><input value={form.descricao} onChange={set('descricao')} placeholder="Externa + interna + aspiração" className={inputCls} style={inputSt} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Preço (R$) *</label><input type="number" min="0" step="0.01" value={form.preco} onChange={set('preco')} placeholder="60.00" className={inputCls} style={inputSt} /></div>
            <div><label className={lbl}>Duração (min)</label><input type="number" min="0" step="1" value={form.duracao_minutos} onChange={set('duracao_minutos')} placeholder="40" className={inputCls} style={inputSt} /></div>
          </div>
          <div><label className={lbl}>Categoria</label><input value={form.categoria} onChange={set('categoria')} placeholder="Lavagem, Estética..." className={inputCls} style={inputSt} /></div>
          <button onClick={() => setForm(p => ({ ...p, ativo: !p.ativo }))} className="flex items-center gap-2 text-sm font-semibold" style={{ color: form.ativo ? '#00e676' : '#9ca3af' }}>
            {form.ativo ? <ToggleRight size={20} /> : <ToggleLeft size={20} />} {form.ativo ? 'Ativo' : 'Inativo'}
          </button>
        </div>
        {erro && <p className="text-red-400 text-xs mt-3">{erro}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black hover:opacity-90 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}>
            {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ServicosTab({ onToast }: { onToast: (msg: string) => void }) {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Servico | null>(null)

  useEffect(() => {
    (async () => {
      if (IS_DEMO) { setServicos(DEMO_SERVICOS_FULL as any); setLoading(false); return }
      try { const res = await fetch('/api/servicos'); const json = await res.json(); setServicos(json.data ?? []) }
      catch { /* silent */ } finally { setLoading(false) }
    })()
  }, [])

  const handleSaved = (s: Servico) => {
    setServicos(prev => { const i = prev.findIndex(x => x.id === s.id); if (i >= 0) { const n = [...prev]; n[i] = s; return n } return [s, ...prev] })
    onToast(editTarget ? 'Serviço atualizado!' : 'Serviço adicionado!')
  }

  const toggleAtivo = async (s: Servico) => {
    const novo = !s.ativo
    setServicos(prev => prev.map(x => x.id === s.id ? { ...x, ativo: novo } : x))
    if (IS_DEMO) { onToast(novo ? 'Serviço ativado.' : 'Serviço desativado.'); return }
    try {
      const res = await fetch(`/api/servicos/${s.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ativo: novo }) })
      if (!res.ok) throw new Error()
      onToast(novo ? 'Serviço ativado.' : 'Serviço desativado.')
    } catch { setServicos(prev => prev.map(x => x.id === s.id ? { ...x, ativo: s.ativo } : x)); onToast('Erro ao atualizar serviço.') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este serviço?')) return
    if (IS_DEMO) { setServicos(prev => prev.filter(s => s.id !== id)); onToast('Serviço removido.'); return }
    try { const res = await fetch(`/api/servicos/${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error(); setServicos(prev => prev.filter(s => s.id !== id)); onToast('Serviço removido.') }
    catch { onToast('Erro ao remover serviço.') }
  }

  const card = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' } as const

  return (
    <div className="rounded-2xl p-6" style={card}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2"><Wrench size={16} className="text-cyan-400" /><h3 className="text-sm font-bold text-white">Serviços e valores</h3></div>
        <button onClick={() => { setEditTarget(null); setShowModal(true) }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-black hover:opacity-90" style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}>
          <Plus size={14} /> Novo serviço
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 py-8 text-center flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Carregando serviços...</p>
      ) : servicos.length === 0 ? (
        <div className="py-12 text-center"><p className="text-3xl mb-2">🧼</p><p className="text-gray-400 text-sm">Nenhum serviço cadastrado.</p><p className="text-gray-600 text-xs mt-1">Clique em "Novo serviço" para começar.</p></div>
      ) : (
        <div className="space-y-2">
          {servicos.map(s => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white truncate">{s.nome}</span>
                  {!s.ativo && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(156,163,175,0.15)', color: '#9ca3af' }}>INATIVO</span>}
                  {s.categoria && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }}>{s.categoria}</span>}
                </div>
                {s.descricao && <p className="text-xs text-gray-500 truncate mt-0.5">{s.descricao}</p>}
              </div>
              <span className="text-sm font-bold text-green-400 flex-shrink-0">{formatCurrency(s.preco)}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleAtivo(s)} title={s.ativo ? 'Desativar' : 'Ativar'} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: s.ativo ? '#00e676' : '#9ca3af' }}>
                  {s.ativo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>
                <button onClick={() => { setEditTarget(s); setShowModal(true) }} title="Editar" className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: '#00d4ff', background: 'rgba(0,212,255,0.1)' }}><Pencil size={14} /></button>
                <button onClick={() => handleDelete(s.id)} title="Remover" className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: '#ff5252', background: 'rgba(255,82,82,0.1)' }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <ServicoModal servico={editTarget} onClose={() => { setShowModal(false); setEditTarget(null) }} onSaved={handleSaved} isDemo={IS_DEMO} />}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'perfil', label: 'Perfil', icon: <User size={15} /> },
  { key: 'plano', label: 'Plano', icon: <CreditCard size={15} /> },
  { key: 'notificacoes', label: 'Notificações', icon: <Bell size={15} /> },
  { key: 'integracoes', label: 'Integrações', icon: <Plug size={15} /> },
  { key: 'servicos', label: 'Serviços e valores', icon: <Wrench size={15} /> },
  { key: 'seguranca', label: 'Segurança', icon: <ShieldCheck size={15} /> },
  { key: 'avancado', label: 'Avançado', icon: <AlertTriangle size={15} /> },
]

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('perfil')
  const [toast, setToast] = useState('')

  function showToast(msg: string) { setToast(msg) }

  return (
    <div className="flex min-h-screen" style={{ background: '#08090f' }}>
      <Sidebar />
      <div className="flex-1 lg:ml-[240px] flex flex-col min-h-screen">
        <Header title="Configurações" subtitle="Gerencie as configurações do seu lava-jato" />

        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            {!IS_DEMO && (
              <div className="mb-5">
                <WipBanner taskRef="UX-CRIT">
                  Configurações ainda não persistem no banco. Alterações somem ao recarregar.
                  Estamos integrando com <code>/api/me</code> + endpoints de update.
                </WipBanner>
              </div>
            )}
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
            {activeTab === 'servicos' && <ServicosTab onToast={showToast} />}
            {activeTab === 'seguranca' && <SegurancaTab onToast={showToast} />}
            {activeTab === 'avancado' && <AvancadoTab />}
          </div>
        </main>
      </div>

      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
    </div>
  )
}
