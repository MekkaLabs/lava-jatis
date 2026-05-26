'use client'

import { useEffect, useState } from 'react'
import { Shield, Loader2, Building2, Users, ClipboardList, Calendar } from 'lucide-react'

interface LavaJato {
  id: string
  nome: string
  cidade: string | null
  estado: string | null
  plano: 'starter' | 'pro' | 'enterprise' | string
  plano_status: 'trial' | 'ativo' | 'inadimplente' | 'cancelado' | string
  ativo: boolean
  created_at: string
  total_atendimentos: number
  total_clientes: number
}

const PLANO_LABEL: Record<string, string> = {
  starter: 'Básico (R$97)',
  pro: 'Profissional (R$197)',
  enterprise: 'Enterprise (R$599)',
}

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  ativo:         { bg: 'rgba(0,230,118,0.12)',  color: '#00e676' },
  trial:         { bg: 'rgba(0,212,255,0.12)',  color: '#00d4ff' },
  inadimplente:  { bg: 'rgba(255,214,0,0.15)',  color: '#ffd600' },
  cancelado:     { bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
}

export default function AdminPage() {
  const [lavaJatos, setLavaJatos] = useState<LavaJato[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/lava-jatos')
      .then(async r => {
        const j = await r.json().catch(() => ({}))
        if (!r.ok) {
          if (r.status === 403) setErro('Você não tem permissão de super-admin. Adicione seu user_id na tabela super_admins.')
          else if (r.status === 401) setErro('Faça login primeiro.')
          else setErro(j.error || 'Erro ao carregar lava-jatos')
          return
        }
        setLavaJatos(j.lavaJatos ?? [])
      })
      .catch(e => setErro(String(e?.message ?? e)))
      .finally(() => setLoading(false))
  }, [])

  // Stats agregadas
  const total = lavaJatos.length
  const ativos = lavaJatos.filter(l => l.plano_status === 'ativo').length
  const trial = lavaJatos.filter(l => l.plano_status === 'trial').length
  const inadimplentes = lavaJatos.filter(l => l.plano_status === 'inadimplente').length
  const mrr = lavaJatos
    .filter(l => l.plano_status === 'ativo')
    .reduce((sum, l) => sum + (l.plano === 'pro' ? 197 : l.plano === 'enterprise' ? 599 : 97), 0)

  return (
    <div className="min-h-screen" style={{ background: '#08090f' }}>
      <header className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#ffd600,#ff9800)' }}>
          <Shield size={20} color="#000" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">LAVAI · Super-Admin</h1>
          <p className="text-xs text-gray-400">Visão geral de todos os lava-jatos cadastrados</p>
        </div>
      </header>

      <main className="p-5 max-w-6xl mx-auto space-y-5">
        {loading && (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 size={20} className="animate-spin mr-2" /> Carregando...
          </div>
        )}

        {erro && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)' }}>
            <p className="text-sm text-red-300">{erro}</p>
            <p className="text-xs text-gray-400 mt-2">
              Pra se promover: rode no Supabase SQL Editor —{' '}
              <code className="text-yellow-300">{`INSERT INTO super_admins (user_id, email) SELECT id, email FROM auth.users WHERE email = 'seu-email@exemplo.com';`}</code>
            </p>
          </div>
        )}

        {!loading && !erro && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat icon={Building2} label="Total"        value={total}        color="#00d4ff" />
              <Stat icon={Users}     label="Ativos"       value={ativos}       color="#00e676" />
              <Stat icon={Calendar}  label="Em trial"     value={trial}        color="#4f8eff" />
              <Stat icon={ClipboardList} label="MRR"      value={`R$ ${mrr.toLocaleString('pt-BR')}`} color="#ffd600" subtitle={`${inadimplentes} inadimplente(s)`} />
            </div>

            {/* Lista */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 className="text-sm font-bold text-white">Lava-jatos cadastrados ({total})</h2>
              </div>
              {lavaJatos.length === 0 ? (
                <div className="p-10 text-center text-gray-400 text-sm">Nenhum lava-jato cadastrado ainda.</div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  {lavaJatos.map(lj => {
                    const s = STATUS_COLOR[lj.plano_status] ?? STATUS_COLOR.trial
                    return (
                      <div key={lj.id} className="px-5 py-4 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{lj.nome}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {lj.cidade ? `${lj.cidade}${lj.estado ? '/' + lj.estado : ''} · ` : ''}
                            {lj.total_clientes} clientes · {lj.total_atendimentos} OS · desde {new Date(lj.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-xs font-semibold text-gray-300">{PLANO_LABEL[lj.plano] ?? lj.plano}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                            style={{ background: s.bg, color: s.color }}>
                            {lj.plano_status}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function Stat({ icon: Icon, label, value, color, subtitle }:
  { icon: any; label: string; value: string | number; color: string; subtitle?: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}22` }}>
          <Icon size={14} color={color} strokeWidth={2.5} />
        </div>
        <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}
