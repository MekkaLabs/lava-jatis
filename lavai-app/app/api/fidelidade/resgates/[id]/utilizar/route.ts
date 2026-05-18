import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok, notFound } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)
    if (!rateLimit(`${userId}:post`, 60, 60_000)) return error('Rate limit excedido', 429)

    const supabase = createServerSupabaseClient()

    // Get resgate and verify ownership
    const { data: resgate } = await supabase
      .from('resgates')
      .select('*')
      .eq('id', params.id)
      .eq('lava_jato_id', lavaJatoId)
      .single()

    if (!resgate) return notFound('Resgate')
    if (resgate.status === 'utilizado') return error('Resgate já foi utilizado', 409)
    if (resgate.status === 'cancelado') return error('Resgate foi cancelado', 409)

    const { data, error: dbErr } = await supabase
      .from('resgates')
      .update({
        status: 'utilizado',
        utilizado_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('lava_jato_id', lavaJatoId)
      .select()
      .single()

    if (dbErr) {
      logger.error('fidelidade.resgates.utilizar.db', dbErr, { id: params.id })
      return error('Erro ao marcar resgate como utilizado', 500)
    }

    logger.info('fidelidade.resgate.utilizado', { id: params.id, lavaJatoId })
    return ok({ data })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('fidelidade.resgates.utilizar', e)
    return error('Erro interno', 500)
  }
}
