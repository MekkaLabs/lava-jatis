import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { error, ok, rateLimit } from '@/lib/api-helpers'

/**
 * POST /api/public/nps-avaliar
 * Public — saves a NPS rating from client (no auth required).
 * Body: { atendimentoId, nota (1-5), comentario? }
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!rateLimit(`nps-pub:${ip}`, 10, 60_000)) return error('Muitas tentativas', 429)

  try {
    const body = await req.json()
    const { atendimentoId, nota, comentario } = body

    if (!atendimentoId) return error('atendimentoId é obrigatório', 400)
    if (!nota || nota < 1 || nota > 5) return error('nota deve ser entre 1 e 5', 400)

    const supabase = createServerSupabaseClient()

    // Fetch atendimento to get lava_jato_id + client info
    const { data: at } = await supabase
      .from('atendimentos')
      .select('lava_jato_id, cliente_nome, clientes(nome, telefone)')
      .eq('id', atendimentoId)
      .single()

    if (!at) return error('Atendimento não encontrado', 404)

    const clienteNome     = (at as any).clientes?.nome ?? at.cliente_nome ?? null
    const clienteTelefone = (at as any).clientes?.telefone ?? null

    // Check if already rated (avoid duplicates)
    const { data: existing } = await supabase
      .from('nps_avaliacoes')
      .select('id')
      .eq('atendimento_id', atendimentoId)
      .maybeSingle()

    if (existing) {
      // Update existing rating
      await supabase
        .from('nps_avaliacoes')
        .update({ nota: Number(nota), comentario: comentario?.trim() || null })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('nps_avaliacoes')
        .insert({
          lava_jato_id:   at.lava_jato_id,
          atendimento_id: atendimentoId,
          cliente_nome:   clienteNome,
          telefone:       clienteTelefone,
          nota:           Number(nota),
          comentario:     comentario?.trim() || null,
        })
    }

    return ok({ saved: true })
  } catch (e: any) {
    console.error('[nps-avaliar]', e)
    return error('Erro ao salvar avaliação', 500)
  }
}
