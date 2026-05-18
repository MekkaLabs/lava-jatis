import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { error, ok, rateLimit } from '@/lib/api-helpers'

/**
 * POST /api/public/agendamentos
 * Public — creates a booking from the public booking page (no auth required).
 * Body: { lavaJatoId, servicoId, dataHora, clienteNome, telefone, placa?, modeloVeiculo? }
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!rateLimit(`agenda-pub:${ip}`, 5, 60_000)) return error('Muitas tentativas', 429)

  try {
    const body = await req.json()
    const { lavaJatoId, servicoId, dataHora, clienteNome, telefone, placa, modeloVeiculo } = body

    if (!lavaJatoId)   return error('lavaJatoId é obrigatório', 400)
    if (!servicoId)    return error('servicoId é obrigatório', 400)
    if (!dataHora)     return error('dataHora é obrigatório', 400)
    if (!clienteNome)  return error('clienteNome é obrigatório', 400)
    if (!telefone)     return error('telefone é obrigatório', 400)

    const supabase = createServerSupabaseClient()

    // Validate lava-jato exists
    const { data: lj } = await supabase
      .from('lava_jatos')
      .select('id')
      .eq('id', lavaJatoId)
      .single()
    if (!lj) return error('Lava-jato não encontrado', 404)

    // Validate service belongs to lava-jato
    const { data: svc } = await supabase
      .from('servicos')
      .select('id, nome, preco')
      .eq('id', servicoId)
      .eq('lava_jato_id', lavaJatoId)
      .eq('ativo', true)
      .single()
    if (!svc) return error('Serviço não encontrado', 404)

    // Find or create cliente by phone
    let clienteId: string | null = null
    const { data: existingCliente } = await supabase
      .from('clientes')
      .select('id')
      .eq('lava_jato_id', lavaJatoId)
      .eq('telefone', telefone)
      .maybeSingle()

    if (existingCliente) {
      clienteId = existingCliente.id
    } else {
      const { data: newCliente } = await supabase
        .from('clientes')
        .insert({
          lava_jato_id: lavaJatoId,
          nome:         clienteNome,
          telefone,
        })
        .select('id')
        .single()
      clienteId = newCliente?.id ?? null
    }

    // Create atendimento (booking)
    const { data: at, error: atErr } = await supabase
      .from('atendimentos')
      .insert({
        lava_jato_id:   lavaJatoId,
        cliente_id:     clienteId,
        cliente_nome:   clienteNome,
        servico_nome:   svc.nome,
        servico_id:     servicoId,
        data_hora:      dataHora,
        placa:          (placa ?? '').trim().toUpperCase() || 'SEM-PLACA',
        modelo_veiculo: (modeloVeiculo ?? '').trim() || null,
        status:         'aguardando',
        // Support both old (preco) and new (preco_final/valor_cobrado) column names
        preco:          svc.preco,
        preco_final:    svc.preco,
        valor_cobrado:  svc.preco,
      })
      .select('id')
      .single()

    if (atErr || !at) {
      console.error('[public/agendamentos]', atErr)
      return error('Erro ao criar agendamento', 500)
    }

    return ok({ atendimentoId: at.id, servicoNome: svc.nome })
  } catch (e: any) {
    console.error('[public/agendamentos]', e)
    return error('Erro ao processar agendamento', 500)
  }
}
