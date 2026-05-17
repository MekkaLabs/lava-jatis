import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWelcomeEmail } from '@/lib/email'
import { rateLimit, error, ok } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

function verifyCronSecret(req: NextRequest): boolean {
  const secret =
    req.headers.get('authorization')?.replace('Bearer ', '') ||
    req.headers.get('x-cron-secret')
  return typeof secret === 'string' && secret.length > 0 && secret === process.env.CRON_SECRET
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  // This endpoint is called internally (by Supabase auth hook / onboarding flow)
  // Protect it with CRON_SECRET to prevent arbitrary userId enumeration
  if (!verifyCronSecret(req)) {
    logger.warn('email.welcome.unauthorized', {
      ip: req.headers.get('x-forwarded-for') ?? 'unknown',
    })
    return error('Não autorizado', 401)
  }

  if (!rateLimit('cron:email-welcome', 120, 60_000)) return error('Rate limit excedido', 429)

  try {
    const body = await req.json()
    const { userId } = body

    if (!userId || typeof userId !== 'string') {
      return error('userId obrigatório', 400)
    }

    // Basic UUID format check to prevent probing
    if (!/^[0-9a-f-]{36}$/i.test(userId)) {
      return error('userId inválido', 400)
    }

    const supabase = getServiceSupabase()

    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)

    if (userError || !user || !user.email) {
      logger.warn('email.welcome.user_not_found', { userId })
      return error('Usuário não encontrado', 404)
    }

    const { data: lavaJato, error: lavaJatoError } = await supabase
      .from('lava_jatos')
      .select('nome, nome_responsavel')
      .eq('user_id', userId)
      .single()

    if (lavaJatoError || !lavaJato) {
      logger.warn('email.welcome.lava_jato_not_found', { userId })
      return error('Lava-jato não encontrado', 404)
    }

    const nome = lavaJato.nome_responsavel || user.email.split('@')[0]
    const nomeEstabelecimento = lavaJato.nome || 'Seu lava-jato'

    await sendWelcomeEmail(user.email, nome, nomeEstabelecimento)
    logger.info('email.welcome.sent', { userId })

    return ok({ success: true })
  } catch (e: any) {
    logger.error('email.welcome', e)
    return error('Erro ao enviar email', 500)
  }
}
