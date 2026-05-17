import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cancelSubscription } from '@/lib/asaas'
import { requireAuth, rateLimit, error, ok } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req)

    // Tight rate limit — cancellation
    if (!rateLimit(`${userId}:cancel`, 3, 60_000)) {
      return error('Muitas tentativas. Aguarde 1 minuto.', 429)
    }

    const body = await req.json()
    const { subscriptionId } = body

    if (!subscriptionId || typeof subscriptionId !== 'string') {
      return error('subscriptionId é obrigatório', 400)
    }

    // Verify subscription belongs to this user's lava_jato (ownership enforced)
    const supabase = createServerSupabaseClient()
    const { data: lavaJato, error: lavaJatoError } = await supabase
      .from('lava_jatos')
      .select('id, asaas_subscription_id')
      .eq('user_id', userId)                          // from session — never from body
      .eq('asaas_subscription_id', subscriptionId)
      .single()

    if (lavaJatoError || !lavaJato) {
      logger.warn('cancel.unauthorized', { userId, subscriptionId })
      return error('Assinatura não encontrada ou sem permissão', 403)
    }

    await cancelSubscription(subscriptionId)

    const { error: updateError } = await supabase
      .from('lava_jatos')
      .update({ plano_status: 'cancelado' })
      .eq('id', lavaJato.id)

    if (updateError) {
      logger.error('cancel.db_update', updateError, { lavaJatoId: lavaJato.id })
    }

    logger.info('subscription.cancelled', { userId, lavaJatoId: lavaJato.id })
    return ok({ success: true, status: 'cancelado' })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('payments.cancel', e)
    return error(e instanceof Error ? e.message : 'Erro interno', 500)
  }
}
