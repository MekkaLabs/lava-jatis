import { NextRequest } from 'next/server'
import { sendPushToUser, sendPushToLavaJato } from '@/lib/push'
import { rateLimit, error, ok } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

function verifyCronSecret(req: NextRequest): boolean {
  const secret =
    req.headers.get('authorization')?.replace('Bearer ', '') ||
    req.headers.get('x-cron-secret')
  return typeof secret === 'string' && secret.length > 0 && secret === process.env.CRON_SECRET
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    logger.warn('push.send.unauthorized', {
      ip: req.headers.get('x-forwarded-for') ?? 'unknown',
      path: req.url,
    })
    return error('Não autorizado', 401)
  }

  // Rate limit on the cron key itself
  if (!rateLimit('cron:push-send', 60, 60_000)) return error('Rate limit excedido', 429)

  try {
    const body = await req.json()
    const { userId, lavaJatoId, payload } = body

    if (!payload || typeof payload !== 'object') return error('payload inválido', 400)
    if (!payload.title || typeof payload.title !== 'string') {
      return error('payload.title é obrigatório', 400)
    }
    if (!payload.body || typeof payload.body !== 'string') {
      return error('payload.body é obrigatório', 400)
    }

    // Sanitize payload lengths
    if (payload.title.length > 200) return error('payload.title muito longo', 400)
    if (payload.body.length > 500) return error('payload.body muito longo', 400)

    if (!userId && !lavaJatoId) {
      return error('userId ou lavaJatoId é obrigatório', 400)
    }

    let result: { sent: number; errors: number }

    if (userId) {
      result = await sendPushToUser(String(userId), payload)
    } else {
      result = await sendPushToLavaJato(String(lavaJatoId), payload)
    }

    logger.info('push.sent', { userId, lavaJatoId, ...result })
    return ok(result)
  } catch (e: any) {
    logger.error('push.send', e)
    return error('Erro interno', 500)
  }
}
