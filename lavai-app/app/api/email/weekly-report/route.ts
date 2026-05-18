import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWeeklyReportEmail } from '@/lib/email'
import { WeeklyStats } from '@/lib/email-templates'
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns'
import { rateLimit, error, ok } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key)
}

function verifyCronSecret(req: NextRequest): boolean {
  const secret =
    req.headers.get('authorization')?.replace('Bearer ', '') ||
    req.headers.get('x-cron-secret')
  return typeof secret === 'string' && secret.length > 0 && secret === process.env.CRON_SECRET
}

async function computeWeeklyStats(
  supabase: ReturnType<typeof getServiceSupabase>,
  lavaJatoId: string,
  nomeEstabelecimento: string,
  weekStart: Date,
  weekEnd: Date,
  prevStart: Date,
  prevEnd: Date
): Promise<WeeklyStats> {
  const [currentAtend, prevAtend, novosClientes, novosClientesPrev] = await Promise.all([
    supabase.from('atendimentos')
      .select('valor_cobrado')
      .eq('lava_jato_id', lavaJatoId)
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', weekEnd.toISOString())
      .eq('status', 'concluido'),
    supabase.from('atendimentos')
      .select('valor_cobrado')
      .eq('lava_jato_id', lavaJatoId)
      .gte('created_at', prevStart.toISOString())
      .lte('created_at', prevEnd.toISOString())
      .eq('status', 'concluido'),
    supabase.from('clientes')
      .select('id')
      .eq('lava_jato_id', lavaJatoId)
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', weekEnd.toISOString()),
    supabase.from('clientes')
      .select('id')
      .eq('lava_jato_id', lavaJatoId)
      .gte('created_at', prevStart.toISOString())
      .lte('created_at', prevEnd.toISOString()),
  ])

  return {
    atendimentos: currentAtend.data?.length ?? 0,
    receitaTotal: currentAtend.data?.reduce((sum: number, a: any) => sum + (a.valor_cobrado ?? 0), 0) ?? 0,
    clientesNovos: novosClientes.data?.length ?? 0,
    atendimentosSemanaAnterior: prevAtend.data?.length ?? 0,
    receitaSemanaAnterior: prevAtend.data?.reduce((sum: number, a: any) => sum + (a.valor_cobrado ?? 0), 0) ?? 0,
    clientesNovosSemanaAnterior: novosClientesPrev.data?.length ?? 0,
    nomeEstabelecimento,
  }
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    logger.warn('weekly-report.unauthorized', {
      ip: req.headers.get('x-forwarded-for') ?? 'unknown',
    })
    return error('Não autorizado', 401)
  }

  if (!rateLimit('cron:weekly-report', 5, 60_000)) return error('Rate limit excedido', 429)

  try {
    const supabase = getServiceSupabase()

    const { data: lavaJatos, error: fetchErr } = await supabase
      .from('lava_jatos')
      .select('id, nome, nome_responsavel, user_id, plano_status')
      .in('plano_status', ['trial', 'ativo'])

    if (fetchErr || !lavaJatos) {
      logger.error('weekly-report.fetch', fetchErr)
      return error('Erro ao buscar lava-jatos', 500)
    }

    const now = new Date()
    const weekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
    const prevStart = startOfWeek(subWeeks(now, 2), { weekStartsOn: 1 })
    const prevEnd = endOfWeek(subWeeks(now, 2), { weekStartsOn: 1 })

    let sent = 0

    for (const lj of lavaJatos) {
      try {
        const { data: { user } } = await supabase.auth.admin.getUserById(lj.user_id)
        if (!user?.email) continue

        const stats = await computeWeeklyStats(supabase, lj.id, lj.nome, weekStart, weekEnd, prevStart, prevEnd)
        const nome = lj.nome_responsavel || user.email.split('@')[0]

        await sendWeeklyReportEmail(user.email, nome, stats)
        sent++
      } catch (err) {
        logger.error('weekly-report.send', err, { lavaJatoId: lj.id })
      }
    }

    logger.info('weekly-report.complete', { sent, total: lavaJatos.length })
    return ok({ sent })
  } catch (e: any) {
    logger.error('weekly-report.fatal', e)
    return error('Erro interno', 500)
  }
}
