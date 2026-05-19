import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { verifyWebhook, AsaasWebhookEvent } from '@/lib/asaas'
import { sendPaymentConfirmedEmail, sendPaymentOverdueEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { createServiceSupabaseClient } from '@/lib/supabase-admin'

type PlanoStatus = 'trial' | 'ativo' | 'inadimplente' | 'cancelado'

// Sempre retorna 200 — Asaas tem retry agressivo em não-2xx,
// e queremos evitar loop infinito mesmo em falhas internas.
const OK = Response.json({ received: true }, { status: 200 })

async function updateStatusBySubscription(subscriptionId: string, status: PlanoStatus) {
  const supabase = createServiceSupabaseClient()
  const { error } = await supabase
    .from('lava_jatos')
    .update({ plano_status: status })
    .eq('asaas_subscription_id', subscriptionId)

  if (error) logger.error('webhook.db_update', error, { subscriptionId, status })
}

async function getLavaJatoOwnerBySubscription(subscriptionId: string) {
  const supabase = createServiceSupabaseClient()
  const { data: lavaJato } = await supabase
    .from('lava_jatos')
    .select('user_id, nome, plano')
    .eq('asaas_subscription_id', subscriptionId)
    .single()

  if (!lavaJato) return null

  const { data: { user } } = await supabase.auth.admin.getUserById(lavaJato.user_id)
  return user ? { ...lavaJato, email: user.email } : null
}

/**
 * Marca o evento como processado. Retorna true se foi processado pela primeira vez,
 * false se já existia (e portanto deve-se ignorar para evitar reprocessar).
 */
async function claimEvent(provider: string, eventId: string, payload: any): Promise<boolean> {
  const supabase = createServiceSupabaseClient()
  const { error } = await supabase
    .from('webhook_events')
    .insert({ provider, event_id: eventId, payload })

  if (!error) return true

  // Erro provavelmente é unique constraint = idempotência funcionando.
  // Detectamos pelo código 23505 (unique_violation) ou pelo texto "duplicate".
  const code = (error as any)?.code
  const msg = (error as any)?.message ?? ''
  if (code === '23505' || msg.toLowerCase().includes('duplicate')) {
    logger.info('webhook.duplicate_ignored', { provider, eventId })
    return false
  }

  // Outro erro — logamos mas seguimos processando (não queremos perder evento real
  // por um erro de gravação no log de idempotência).
  logger.error('webhook.claim_failed', error, { provider, eventId })
  return true
}

function deriveEventId(event: AsaasWebhookEvent, rawBody: string): string {
  // Preferimos o id explícito do Asaas. Fallback: hash do body + tipo de evento
  // (mesmo body + mesmo tipo são tratados como duplicata — comportamento desejado).
  if (event.id) return event.id
  return createHash('sha256').update(`${event.event}|${rawBody}`).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    // Verifica assinatura. Falha = não processa, mas ainda retorna 200
    // (evita Asaas em retry loop por config errada no nosso lado).
    const signature =
      req.headers.get('asaas-signature') ??
      req.headers.get('x-asaas-signature') ??
      ''

    const isValid = await verifyWebhook(rawBody, signature)
    if (!isValid) {
      logger.warn('webhook.invalid_signature', {
        ip: req.headers.get('x-forwarded-for') ?? 'unknown',
      })
      return OK
    }

    let event: AsaasWebhookEvent
    try {
      event = JSON.parse(rawBody)
    } catch {
      logger.warn('webhook.invalid_json')
      return OK
    }

    // ── Idempotência ────────────────────────────────────────────────────────
    const eventId = deriveEventId(event, rawBody)
    const firstTime = await claimEvent('asaas', eventId, event as any)
    if (!firstTime) {
      // Já processado — Asaas reenviou. Confirmamos recebimento.
      return OK
    }

    logger.info('webhook.event', { event: event.event, eventId })

    switch (event.event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED': {
        const payment = event.payment
        if (payment?.subscription) {
          await updateStatusBySubscription(payment.subscription, 'ativo')
          try {
            const owner = await getLavaJatoOwnerBySubscription(payment.subscription)
            if (owner?.email) {
              const nome = owner.nome || owner.email.split('@')[0]
              await sendPaymentConfirmedEmail(owner.email, nome, owner.plano || 'Pro', payment.value ?? 0)
            }
          } catch (emailErr) {
            logger.error('webhook.email_confirmed', emailErr, { subscription: payment.subscription })
          }
        }
        break
      }

      case 'PAYMENT_OVERDUE': {
        const payment = event.payment
        if (payment?.subscription) {
          await updateStatusBySubscription(payment.subscription, 'inadimplente')
          try {
            const owner = await getLavaJatoOwnerBySubscription(payment.subscription)
            if (owner?.email) {
              const nome = owner.nome || owner.email.split('@')[0]
              let diasAtraso = 1
              if (payment.dueDate) {
                const due = new Date(payment.dueDate)
                diasAtraso = Math.max(1, Math.floor((Date.now() - due.getTime()) / (1000 * 60 * 60 * 24)))
              }
              await sendPaymentOverdueEmail(owner.email, nome, diasAtraso)
            }
          } catch (emailErr) {
            logger.error('webhook.email_overdue', emailErr, { subscription: payment.subscription })
          }
        }
        break
      }

      case 'SUBSCRIPTION_INACTIVATED': {
        const subscription = event.subscription
        if (subscription?.id) {
          await updateStatusBySubscription(subscription.id, 'cancelado')
        }
        break
      }

      default:
        logger.info('webhook.unhandled_event', { event: event.event })
    }

    return OK
  } catch (err) {
    logger.error('webhook.fatal', err)
    // Ainda 200 — Asaas não deve fazer retry por erro nosso.
    // Erro vai pro Sentry (task #12) quando instalado.
    return OK
  }
}
