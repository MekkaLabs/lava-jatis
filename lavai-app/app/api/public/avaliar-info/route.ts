import { NextRequest } from 'next/server'
import { error, ok } from '@/lib/api-helpers'
import { createServiceSupabaseClient } from '@/lib/supabase-admin'
import { verifyNps } from '@/lib/nps-signature'
import { logger } from '@/lib/logger'

/**
 * GET /api/public/avaliar-info?at=<atendimento_id>&sig=<hmac>
 * Returns minimal info for the NPS rating page (public, HMAC-signed).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const atId = searchParams.get('at')
    const sig  = searchParams.get('sig')
    if (!atId) return error('at é obrigatório', 400)
    if (!verifyNps(atId, sig)) return error('Link inválido ou expirado', 403)

    const supabase = createServiceSupabaseClient()

    const { data } = await supabase
      .from('atendimentos')
      .select('lava_jato_id, cliente_nome, servicos(nome), lava_jatos(nome)')
      .eq('id', atId)
      .single()

    if (!data) return error('Atendimento não encontrado', 404)

    return ok({
      lavaJatoNome: (data as any).lava_jatos?.nome ?? 'Lava-Jato',
      clienteNome:  (data as any).cliente_nome ?? 'Cliente',
      servicoNome:  (data as any).servicos?.nome ?? 'Serviço',
    })
  } catch (e) {
    logger.error('public.avaliar-info.error', e)
    return error('Erro ao carregar avaliação', 500)
  }
}
