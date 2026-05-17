import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyWebhook, AsaasWebhookEvent } from '@/lib/asaas'
import { sendPaymentConfirmedEmail, sendPaymentOverdueEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

// Service-role client — no user session available on webhooks
function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key)
}

type PlanoStatus = 'trial' | 'ativo' | 'inadimplente' | 'cancelado'

async function updateStatusBySubscription(subscriptionId: string, status: PlanoStatus) {
  const supabase = getServiceSupabase()
  const { error } = await supabase
    .from('lava_jatos')
    .update({ plano_status: status })
    .eq('asaas_subscription_id', subscriptionId)

  if (error) logger.error('webhook.db_update', error, { subscriptionId, status })
}

async function getLavaJatoOwnerBySubscription(subscriptionId: string) {
  const supabase = getServiceSupabase()
  const { data: lavaJato } = await supabase
    .from('lava_jatos')
    .select('user_id, nome, nome_responsavel, plano, valor_plano')
    .eq('asaas_subscription_id', subscriptionId)
    .single()

  if (!lavaJato) return null

  const { data: { user } } = await supabase.auth.admin.getUserById(lavaJato.user_id)
  return user ? { ...lavaJato, email: user.email } : null
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    // Always verify webhook signature — reject invalid ones
    const signature =
      req.headers.get('asaas-signature') ??
      req.headers.get('x-asaas-signature') ??
      ''

    const isValid = await verifyWebhook(rawBody, signature)
    if (!isValid) {
      logger.warn('webhook.invalid_signature', {
        ip: req.headers.get('x-forwarded-for') ?? 'unknown',
      })
      // Return 200 to prevent Asaas infinite retries, but do NOT process
      return Response.json({ received: false, reason: 'invalid_signature' }, { status: 200 })
    }

    let event: AsaasWebhookEvent
    try {
      event = JSON.parse(rawBody)
    } catch {
      logger.warn('webhook.invalid_json')
      return Response.json({ received: false }, { status: 200 })
    }

    logger.info('webhook.event', { event: event.event })

    switch (event.event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED': {
        const payment = event.payment
        if (payment?.subscription) {
          await updateStatusBySubscription(payment.subscription, 'ativo')
          try {
            const owner = await getLavaJatoOwnerBySubscription(payment.subscription)
            if (owner?.email) {
              const nome = owner.nome_responsavel || owner.email.split('@')[0]
              await sendPaymentConfirmedEmail(owner.email, nome, owner.plano || 'Pro', payment.value ?? owner.valor_plano ?? 0)
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
              const nome = owner.nome_responsavel || owner.email.split('@')[0]
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

    return Response.json({ received: true }, { status: 200 })
  } catch (err) {
    logger.error('webhook.fatal', err)
    // Always 200 to prevent Asaas retries
    return Response.json({ received: true }, { status: 200 })
  }
}
