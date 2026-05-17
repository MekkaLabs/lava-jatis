import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  'mailto:' + (process.env.FROM_EMAIL || 'no-reply@lavai.com.br'),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
}

export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: PushPayload
) {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icon-192.png',
        url: payload.url || '/dashboard',
      })
    )
  } catch (err: any) {
    // 410 Gone = subscription expired/invalid
    if (err.statusCode === 410) {
      console.warn('[push] Subscription expired:', subscription.endpoint)
      // Caller should handle cleanup
    } else {
      console.error('[push] sendPushNotification error:', err)
    }
    throw err
  }
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const supabase = getServiceSupabase()

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, subscription')
    .eq('user_id', userId)

  if (error) {
    console.error('[push] fetchSubscriptions error:', error)
    return { sent: 0, errors: 1 }
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, errors: 0 }
  }

  const results = await Promise.allSettled(
    subscriptions.map(async (row: { id: string; subscription: webpush.PushSubscription }) => {
      try {
        await sendPushNotification(row.subscription, payload)
        return { id: row.id, success: true }
      } catch (err: any) {
        // Remove expired subscriptions automatically
        if (err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', row.id)
        }
        throw err
      }
    })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const errors = results.filter((r) => r.status === 'rejected').length

  return { sent, errors }
}

export async function sendPushToLavaJato(lavaJatoId: string, payload: PushPayload) {
  const supabase = getServiceSupabase()

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, subscription')
    .eq('lava_jato_id', lavaJatoId)

  if (error) {
    console.error('[push] fetchSubscriptions for lava_jato error:', error)
    return { sent: 0, errors: 1 }
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, errors: 0 }
  }

  const results = await Promise.allSettled(
    subscriptions.map(async (row: { id: string; subscription: webpush.PushSubscription }) => {
      try {
        await sendPushNotification(row.subscription, payload)
        return { id: row.id, success: true }
      } catch (err: any) {
        if (err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', row.id)
        }
        throw err
      }
    })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const errors = results.filter((r) => r.status === 'rejected').length

  return { sent, errors }
}
