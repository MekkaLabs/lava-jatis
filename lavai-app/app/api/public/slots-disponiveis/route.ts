import { NextRequest } from 'next/server'
import { error, ok } from '@/lib/api-helpers'
import { createServiceSupabaseClient } from '@/lib/supabase-admin'
import { logger } from '@/lib/logger'

/**
 * GET /api/public/slots-disponiveis?lj_id=<id>&data=YYYY-MM-DD&duracao=<min>
 *
 * Retorna lista de slots de 30 em 30 min entre horário de abertura e fechamento,
 * filtrando os que conflitam com atendimentos já marcados (considerando a duração)
 * e os que já passaram (se a data for hoje).
 */
export async function GET(req: NextRequest) {
  try {
  const { searchParams } = new URL(req.url)
  const ljId    = searchParams.get('lj_id')
  const data    = searchParams.get('data')   // YYYY-MM-DD
  const duracao = parseInt(searchParams.get('duracao') ?? '30', 10) || 30

  if (!ljId) return error('lj_id é obrigatório', 400)
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return error('data inválida (use YYYY-MM-DD)', 400)

  const supabase = createServiceSupabaseClient()

  // Busca horário de funcionamento
  const { data: lj } = await supabase
    .from('lava_jatos')
    .select('horario_abertura, horario_fechamento')
    .eq('id', ljId)
    .single()

  if (!lj) return error('Lava-jato não encontrado', 404)

  const abertura   = (lj as any).horario_abertura   ?? '08:00'
  const fechamento = (lj as any).horario_fechamento ?? '18:00'

  // Parse horários (HH:MM ou HH:MM:SS)
  const [aH, aM] = abertura.split(':').map(Number)
  const [fH, fM] = fechamento.split(':').map(Number)
  const aberturaMin   = aH * 60 + aM
  const fechamentoMin = fH * 60 + fM

  // Gera todos os slots possíveis (de 30 em 30 min)
  const todosSlots: string[] = []
  for (let m = aberturaMin; m + duracao <= fechamentoMin; m += 30) {
    const h = Math.floor(m / 60)
    const mm = m % 60
    todosSlots.push(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`)
  }

  // Busca atendimentos do dia (que ocupam slots)
  const dayStart = new Date(`${data}T00:00:00`).toISOString()
  const dayEnd   = new Date(`${data}T23:59:59`).toISOString()

  const { data: ocupados } = await supabase
    .from('atendimentos')
    .select('data_hora, servico_id, servicos(duracao_minutos, duracao_min)')
    .eq('lava_jato_id', ljId)
    .gte('data_hora', dayStart)
    .lte('data_hora', dayEnd)
    .in('status', ['aguardando', 'em_andamento'])

  // Constrói lista de intervalos ocupados em minutos do dia
  const intervalos: Array<[number, number]> = []
  for (const at of ocupados ?? []) {
    const dt = new Date((at as any).data_hora)
    const startMin = dt.getHours() * 60 + dt.getMinutes()
    const dur =
      (at as any).servicos?.duracao_minutos ??
      (at as any).servicos?.duracao_min ??
      30
    intervalos.push([startMin, startMin + dur])
  }

  // Filtra slots: remove os no passado (se for hoje) e os que conflitam
  const hoje = new Date()
  const isToday =
    hoje.toISOString().split('T')[0] === data
  const agoraMin = hoje.getHours() * 60 + hoje.getMinutes() + 15 // 15 min de buffer

  const disponiveis = todosSlots.filter(slot => {
    const [h, m] = slot.split(':').map(Number)
    const slotStart = h * 60 + m
    const slotEnd   = slotStart + duracao

    if (isToday && slotStart < agoraMin) return false

    // Conflito se [slotStart, slotEnd) intersecta com qualquer intervalo
    for (const [iStart, iEnd] of intervalos) {
      if (slotStart < iEnd && slotEnd > iStart) return false
    }
    return true
  })

  return ok({
    slots: disponiveis,
    abertura,
    fechamento,
    isToday,
  })
  } catch (e) {
    logger.error('public.slots-disponiveis.error', e)
    return error('Erro ao buscar horários', 500)
  }
}
