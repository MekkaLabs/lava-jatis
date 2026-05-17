import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(`${userId}:push-sub`, 10, 60_000)) return error('Rate limit excedido', 429)

    const body = await req.json()
    const { subscription } = body

    if (!subscription || typeof subscription !== 'object' || !subscription.endpoint) {
      return error('subscription inválida', 400)
    }

    // Validate endpoint is a proper URL
    try {
      new URL(subscription.endpoint)
    } catch {
      return error('subscription.endpoint inválido', 400)
    }

    // Limit endpoint length to prevent oversized payloads
    if (String(subscription.endpoint).length > 2048) {
      return error('subscription.endpoint muito longo', 400)
    }

    const service = getServiceSupabase()
    const { error: dbErr } = await service.from('push_subscriptions').upsert(
      {
        user_id: userId,
        lava_jato_id: lavaJatoId,
        subscription,
      },
      { onConflict: 'user_id,subscription', ignoreDuplicates: false }
    )

    if (dbErr) {
      logger.error('push.subscribe.db', dbErr, { userId })
      return error('Erro ao salvar inscrição', 500)
    }

    return ok({ success: true })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('push.subscribe', e)
    return error('Erro interno', 500)
  }
}
