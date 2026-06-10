import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok } from '@/lib/api-helpers'
import { AtendimentoSchema, sanitizeString } from '@/lib/validation'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(userId, 200, 60_000)) {
      return error('Muitas requisições. Tente novamente em breve.', 429)
    }

    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const date = searchParams.get('date')
    const from = searchParams.get('from')   // ISO — filtra por data_hora (agenda)
    const to = searchParams.get('to')       // ISO — filtra por data_hora (agenda)

    // Validate status filter against allowed values
    const allowedStatus = ['aguardando', 'em_andamento', 'concluido', 'cancelado']
    if (status && !allowedStatus.includes(status)) {
      return error('status inválido', 400)
    }

    // Validate date format
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return error('date deve estar no formato YYYY-MM-DD', 400)
    }

    // Validate ISO range (agendamentos)
    if (from && isNaN(Date.parse(from))) return error('from inválido', 400)
    if (to && isNaN(Date.parse(to))) return error('to inválido', 400)

    let query = supabase
      .from('atendimentos')
      .select(`
        id, cliente_nome, placa, modelo, cor, status, preco_final,
        observacao, data_hora, funcionario, created_at, updated_at, lava_jato_id,
        clientes(id, nome, telefone),
        servicos(id, nome, preco),
        funcionarios(id, nome)
      `)
      .eq('lava_jato_id', lavaJatoId)
      .order('created_at', { ascending: false })
      .limit(200)

    if (status) query = query.eq('status', status)
    if (date) {
      query = query
        .gte('created_at', `${date}T00:00:00`)
        .lte('created_at', `${date}T23:59:59`)
    }
    // Filtro de agenda: apenas atendimentos com data_hora dentro do intervalo
    if (from) query = query.gte('data_hora', new Date(from).toISOString())
    if (to) query = query.lte('data_hora', new Date(to).toISOString())

    const { data, error: dbErr } = await query

    if (dbErr) {
      logger.error('atendimentos.get.db', dbErr, { lavaJatoId })
      return error('Erro interno', 500)
    }

    return ok({ data })
  } catch (e: any) {
    // requireAuth throws a Response — return it directly
    if (e instanceof Response) return e
    logger.error('atendimentos.get', e)
    return error('Erro interno', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(`${userId}:post`, 30, 60_000)) {
      return error('Muitas requisições. Tente novamente em breve.', 429)
    }

    const body = await req.json()
    const validation = AtendimentoSchema.create(body)
    if (!validation.valid) {
      return error(validation.errors.join('; '), 400)
    }

    const { clienteId, clienteNome, servicoId, placa, modelo, cor, observacao, dataHora, funcionario } = body

    // data_hora é opcional (usado por agendamentos). Valida formato se enviado.
    let dataHoraIso: string | null = null
    if (dataHora) {
      const ts = Date.parse(dataHora)
      if (isNaN(ts)) return error('dataHora inválida', 400)
      dataHoraIso = new Date(ts).toISOString()
    }

    const supabase = createServerSupabaseClient()

    // Get service name + price — verify it belongs to same lava_jato
    // servico_nome e preco são NOT NULL na tabela; precisam ser resolvidos do serviço.
    let servicoNome = 'Serviço'
    let precoBase = 0
    if (servicoId) {
      const { data: servico } = await supabase
        .from('servicos')
        .select('nome, preco')
        .eq('id', servicoId)
        .eq('lava_jato_id', lavaJatoId)
        .single()
      if (!servico) return error('Serviço não encontrado', 400)
      servicoNome = servico.nome ?? 'Serviço'
      precoBase = Number(servico.preco) ?? 0
    }

    // Resolve cliente name — verify ownership
    let nomeCliente = sanitizeString(clienteNome, 200)
    if (clienteId && !nomeCliente) {
      const { data: cliente } = await supabase
        .from('clientes')
        .select('nome')
        .eq('id', clienteId)
        .eq('lava_jato_id', lavaJatoId)
        .single()
      nomeCliente = cliente?.nome ?? 'Cliente'
    }
    if (!nomeCliente) nomeCliente = 'Cliente'

    const { data, error: dbErr } = await supabase
      .from('atendimentos')
      .insert({
        lava_jato_id: lavaJatoId,        // always from session — never from body
        cliente_id: clienteId ?? null,
        cliente_nome: nomeCliente,
        servico_id: servicoId,
        servico_nome: servicoNome,       // NOT NULL na tabela
        placa: placa ? sanitizeString(placa, 10).toUpperCase() : '',  // NOT NULL na tabela
        modelo: modelo ? sanitizeString(modelo, 100) : null,
        cor: cor ? sanitizeString(cor, 50) : null,
        funcionario: funcionario ? sanitizeString(funcionario, 100) : null,
        observacao: observacao ? sanitizeString(observacao, 2000) : null,
        status: 'aguardando',
        data_hora: dataHoraIso,
        preco: precoBase,                // NOT NULL na tabela
        preco_final: precoBase,
      })
      .select()
      .single()

    if (dbErr) {
      logger.error('atendimentos.post.db', dbErr, { lavaJatoId })
      return error('Erro ao criar atendimento', 500)
    }

    logger.info('atendimentos.created', { id: data.id, lavaJatoId })
    return ok({ data }, 201)
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('atendimentos.post', e)
    return error('Erro interno', 500)
  }
}
