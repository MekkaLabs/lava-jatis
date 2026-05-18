import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { error, ok } from '@/lib/api-helpers'

/**
 * GET /api/public/avaliar-info?at=<atendimento_id>
 * Returns minimal info for the NPS rating page (public).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const atId = searchParams.get('at')
  if (!atId) return error('at é obrigatório', 400)

  const supabase = createServerSupabaseClient()

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
}
