import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { IS_DEMO } from '@/lib/demo'
import { Car, DollarSign, Users, Clock, Star } from 'lucide-react'
import DashboardHeader from './components/DashboardHeader'
import MetricCard from './components/MetricCard'
// RevenueChart removido por solicitação (relatório ajustes MVP)
import FilaCard from './components/FilaCard'
// QuickActions removido (botão Nova OS) — usar bottom sheet do FAB nas páginas Fila/Agenda
import { formatCurrency } from '@/lib/utils'
import AIInsightPanel from './components/AIInsightPanel'

// ── Demo data (used when Supabase is not configured) ─────────────────────────
function getDemoData() {
  const receitaUltimos7Dias = [
    { date: 'Seg 12', receita: 1240 },
    { date: 'Ter 13', receita: 980 },
    { date: 'Qua 14', receita: 1560 },
    { date: 'Qui 15', receita: 2100 },
    { date: 'Sex 16', receita: 1870 },
    { date: 'Sáb 17', receita: 2640 },
    { date: 'Dom 18', receita: 890 },
  ]
  return {
    nomeLavaJato: 'Lava-Jato Demo',
    atendimentosHoje: 18,
    receitaMes: 34560,
    clientesNovos: 7,
    filaAtual: [
      { id: '1', cliente_nome: 'Carlos Silva',   servico_nome: 'Lavagem Completa', placa: 'ABC-1234', modelo: 'Onix',    status: 'em_andamento', created_at: new Date(Date.now() - 25 * 60000).toISOString() },
      { id: '2', cliente_nome: 'Ana Souza',       servico_nome: 'Polimento',        placa: 'DEF-5678', modelo: 'HB20',    status: 'aguardando',   created_at: new Date(Date.now() - 10 * 60000).toISOString() },
      { id: '3', cliente_nome: 'Roberto Nunes',   servico_nome: 'Lavagem Simples',  placa: 'GHI-9012', modelo: 'Gol',     status: 'aguardando',   created_at: new Date(Date.now() -  5 * 60000).toISOString() },
      { id: '4', cliente_nome: 'Fernanda Lima',   servico_nome: 'Higienização',     placa: 'JKL-3456', modelo: 'Corolla', status: 'aguardando',   created_at: new Date(Date.now() -  2 * 60000).toISOString() },
    ],
    topServicos: [
      { nome: 'Lavagem Completa', count: 142, receita: 8520 },
      { nome: 'Polimento',        count:  38, receita: 5700 },
      { nome: 'Lavagem Simples',  count: 210, receita: 6300 },
      { nome: 'Higienização',     count:  24, receita: 3600 },
    ],
    receitaUltimos7Dias,
    sparklineReceita: receitaUltimos7Dias.map(d => d.receita),
    nps: {
      media: 4.8,
      total: 23,
      recentes: [
        { cliente_nome: 'Carlos Silva',  nota: 5, comentario: 'Serviço impecável!', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
        { cliente_nome: 'Ana Souza',     nota: 5, comentario: 'Muito rápido e caprichado.', created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
        { cliente_nome: 'Roberto Nunes', nota: 4, comentario: null, created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
        { cliente_nome: 'Fernanda Lima', nota: 5, comentario: 'Sempre venho aqui!', created_at: new Date(Date.now() - 48 * 3600000).toISOString() },
      ],
    },
  }
}

async function getDashboardData() {
  // Demo mode: usa a MESMA detecção do middleware/login (flag), não placeholder.
  // Sem isso, com SUPABASE_URL real + cookie demo, o redirect('/login') abaixo
  // entrava em loop com o middleware (dashboard piscando).
  if (IS_DEMO) {
    return getDemoData()
  }

  const supabase = createServerSupabaseClient()
  // getUser revalida o JWT com o Auth server (vs getSession que confia no cookie)
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) redirect('/login')

  const { data: lavaJato } = await supabase
    .from('lava_jatos')
    .select('id, nome')
    .eq('user_id', user.id)
    .single()

  if (!lavaJato) return { error: 'Lava-jato não encontrado' }

  const lavaJatoId = lavaJato.id
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  const { count: atendimentosHoje } = await supabase
    .from('atendimentos')
    .select('id', { count: 'exact', head: true })
    .eq('lava_jato_id', lavaJatoId)
    .gte('created_at', `${todayStr}T00:00:00`)
    .lte('created_at', `${todayStr}T23:59:59`)

  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01T00:00:00`
  const { data: receitaRows } = await supabase
    .from('atendimentos')
    .select('preco_final')
    .eq('lava_jato_id', lavaJatoId)
    .eq('status', 'concluido')
    .gte('created_at', startOfMonth)

  const receitaMes = receitaRows?.reduce((sum: number, r: any) => sum + (r.preco_final || 0), 0) ?? 0

  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: clientesNovos } = await supabase
    .from('clientes')
    .select('id', { count: 'exact', head: true })
    .eq('lava_jato_id', lavaJatoId)
    .gte('created_at', weekAgo)

  const { data: filaAtual } = await supabase
    .from('atendimentos')
    .select('id, cliente_nome, placa, modelo, cor, status, created_at, clientes(nome), servicos(nome)')
    .eq('lava_jato_id', lavaJatoId)
    .in('status', ['aguardando', 'em_andamento'])
    .order('created_at', { ascending: true })

  const filaFormatted = (filaAtual ?? []).map((a: any) => ({
    id: a.id,
    cliente_nome: a.clientes?.nome ?? a.cliente_nome ?? 'Cliente',
    servico_nome: a.servicos?.nome,
    placa: a.placa,
    modelo: a.modelo,
    status: a.status,
    created_at: a.created_at,
  }))

  const { data: topServicosRaw } = await supabase
    .from('atendimentos')
    .select('servico_id, preco_final, servicos(nome)')
    .eq('lava_jato_id', lavaJatoId)
    .eq('status', 'concluido')

  const servicoMap: Record<string, { nome: string; count: number; receita: number }> = {}
  for (const row of topServicosRaw ?? []) {
    const id = row.servico_id
    const nome = (row as any).servicos?.nome ?? 'Serviço'
    if (!id) continue
    if (!servicoMap[id]) servicoMap[id] = { nome, count: 0, receita: 0 }
    servicoMap[id].count++
    servicoMap[id].receita += row.preco_final ?? 0
  }
  const topServicos = Object.values(servicoMap).sort((a, b) => b.count - a.count).slice(0, 5)

  const days: Array<{ date: string; _iso: string; receita: number }> = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })
    days.push({ date: label, _iso: dateStr, receita: 0 })
  }

  const { data: receitaDias } = await supabase
    .from('atendimentos')
    .select('created_at, preco_final')
    .eq('lava_jato_id', lavaJatoId)
    .eq('status', 'concluido')
    .gte('created_at', days[0]._iso + 'T00:00:00')

  for (const r of receitaDias ?? []) {
    const iso = r.created_at.slice(0, 10)
    const day = days.find(d => d._iso === iso)
    if (day) day.receita += r.preco_final ?? 0
  }

  const receitaUltimos7Dias = days.map(({ date, receita }) => ({ date, receita }))
  const sparklineReceita = receitaUltimos7Dias.map(d => d.receita)

  // NPS — últimas avaliações + média
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: npsRows } = await supabase
    .from('nps_avaliacoes')
    .select('nota, cliente_nome, comentario, created_at')
    .eq('lava_jato_id', lavaJatoId)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(10)

  const npsTotal = npsRows?.length ?? 0
  const npsMedia = npsTotal > 0
    ? Math.round((npsRows!.reduce((s: number, r: any) => s + r.nota, 0) / npsTotal) * 10) / 10
    : null
  const npsRecentes = (npsRows ?? []).slice(0, 4)

  return {
    nomeLavaJato: lavaJato.nome ?? 'Lava-Jato',
    atendimentosHoje: atendimentosHoje ?? 0,
    receitaMes,
    clientesNovos: clientesNovos ?? 0,
    filaAtual: filaFormatted,
    topServicos,
    receitaUltimos7Dias,
    sparklineReceita,
    nps: { media: npsMedia, total: npsTotal, recentes: npsRecentes },
  }
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  if ('error' in data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-400">{(data as any).error}</p>
      </div>
    )
  }

  const {
    nomeLavaJato,
    atendimentosHoje,
    receitaMes,
    clientesNovos,
    filaAtual,
    topServicos,
    receitaUltimos7Dias,
    sparklineReceita,
    nps,
  } = data

  const greeting = getGreeting()
  const subtitle = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // Capitalise first letter
  const subtitleCap = subtitle.charAt(0).toUpperCase() + subtitle.slice(1)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <DashboardHeader subtitle={subtitleCap} />

      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5">

        {/* Welcome + AI Insight row */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Welcome */}
          <div
            className="flex-1 rounded-2xl px-5 py-4 flex items-center gap-3"
            style={{
              background: 'linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(79,142,255,0.05) 100%)',
              border: '1px solid rgba(0,212,255,0.15)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: 'rgba(0,212,255,0.12)' }}
            >
              👋
            </div>
            <div>
              <p className="text-white font-semibold text-sm">
                {greeting}, <span style={{ color: '#00d4ff' }}>{nomeLavaJato}</span>!
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{subtitleCap}</p>
            </div>
          </div>

          {/* AI Insight */}
          <div
            className="flex-1 rounded-2xl px-5 py-4 flex items-start gap-3"
            style={{
              background: 'rgba(255,214,0,0.04)',
              border: '1px solid rgba(255,214,0,0.15)',
            }}
          >
            <span className="text-lg flex-shrink-0">💡</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#ffd600' }}>Insight IA</p>
              <p className="text-xs text-gray-300 leading-relaxed">
                Seu horário mais lucrativo é entre <strong className="text-white">10h–12h</strong>. Considere adicionar 1 funcionário nesse período.
              </p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            title="Atendimentos Hoje"
            value={atendimentosHoje}
            icon={<Car size={16} />}
            color="cyan"
            sparkline={[3, 5, 4, 8, 6, atendimentosHoje > 0 ? atendimentosHoje : 7, atendimentosHoje]}
            change={atendimentosHoje > 0 ? `+${atendimentosHoje} hoje` : 'Nenhum ainda'}
            tooltip="Atendimentos registrados hoje"
          />
          <MetricCard
            title="Receita do Mês"
            value={formatCurrency(receitaMes)}
            icon={<DollarSign size={16} />}
            color="green"
            sparkline={sparklineReceita}
            change={receitaMes > 0 ? '+' + formatCurrency(receitaMes) + ' acumulado' : 'Sem receita ainda'}
            tooltip="Receita acumulada no mês"
          />
          <MetricCard
            title="Clientes Novos (7 dias)"
            value={clientesNovos}
            icon={<Users size={16} />}
            color="yellow"
            sparkline={[1, 2, 1, 3, 2, clientesNovos > 0 ? clientesNovos : 2, clientesNovos]}
            change={clientesNovos > 0 ? `+${clientesNovos} esta semana` : 'Nenhum esta semana'}
            tooltip="Novos clientes cadastrados nos últimos 7 dias"
          />
          <MetricCard
            title="Na Fila Agora"
            value={filaAtual.length}
            icon={<Clock size={16} />}
            color="red"
            sparkline={[2, 4, 3, 5, 4, 3, filaAtual.length]}
            change={filaAtual.length > 0 ? `${filaAtual.length} veículo${filaAtual.length !== 1 ? 's' : ''} aguardando` : 'Fila vazia'}
            tooltip="Veículos ativos na fila agora"
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Fila — 2 cols */}
          <div className="xl:col-span-2">
            <FilaCard atendimentos={filaAtual} />
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {topServicos.length > 0 && (
              <div
                className="rounded-2xl p-5"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(26,26,46,0.8)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <h2 className="font-semibold text-white text-sm mb-4">Top Serviços</h2>
                <div className="space-y-2">
                  {topServicos.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff' }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-sm text-gray-300 truncate">{s.nome}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <span className="text-xs text-gray-500">{s.count}x</span>
                        <span className="text-xs font-semibold text-green-400">{formatCurrency(s.receita)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NPS Widget */}
        {nps.total > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* NPS Score card */}
            <div className="rounded-2xl p-5 flex flex-col items-center justify-center text-center"
              style={{ background: 'rgba(255,214,0,0.04)', border: '1px solid rgba(255,214,0,0.15)' }}>
              <div className="flex gap-0.5 mb-2">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} size={18}
                    fill={(nps.media ?? 0) >= n ? '#ffd600' : 'transparent'}
                    stroke={(nps.media ?? 0) >= n ? '#ffd600' : 'rgba(255,255,255,0.2)'}
                    strokeWidth={1.5}
                  />
                ))}
              </div>
              <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {nps.media?.toFixed(1) ?? '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Nota média (30 dias)</p>
              <p className="text-xs text-gray-400 mt-2 font-medium">{nps.total} avaliação{nps.total !== 1 ? 'ões' : ''}</p>
            </div>

            {/* Recent reviews */}
            <div className="xl:col-span-2 rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
                <Star size={14} style={{ color: '#ffd600' }} />
                Avaliações Recentes
              </h2>
              <div className="space-y-3">
                {nps.recentes.map((r: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }}>
                      {(r.cliente_nome ?? 'C').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{r.cliente_nome ?? 'Cliente'}</span>
                        <div className="flex gap-0.5 shrink-0">
                          {[1,2,3,4,5].map(n => (
                            <Star key={n} size={10}
                              fill={r.nota >= n ? '#ffd600' : 'transparent'}
                              stroke={r.nota >= n ? '#ffd600' : 'rgba(255,255,255,0.2)'}
                              strokeWidth={1.5}
                            />
                          ))}
                        </div>
                      </div>
                      {r.comentario && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{r.comentario}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-600 shrink-0">
                      {new Date(r.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Insights Panel */}
        <AIInsightPanel />
      </div>
    </div>
  )
}
