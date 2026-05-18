import { NextRequest } from 'next/server'
import { requireAuth, error, ok } from '@/lib/api-helpers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getInstanceStatus } from '@/lib/zapi'

export async function GET(req: NextRequest) {
  try {
    const { lavaJatoId } = await requireAuth(req)
    const supabase = createServerSupabaseClient()

    // Load per-lava-jato Z-API config
    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('zapi_instance_id, zapi_token, zapi_client_token, ativo, numero_whatsapp')
      .eq('lava_jato_id', lavaJatoId)
      .single()

    if (!config?.zapi_instance_id || !config?.zapi_token) {
      return ok({
        connected: false,
        phone: '',
        battery: 0,
        configured: false,
      })
    }

    // Temporarily override env vars is not possible in runtime,
    // so we call Z-API directly with the stored credentials
    const baseUrl = `https://api.z-api.io/instances/${config.zapi_instance_id}/token/${config.zapi_token}/status`

    let connected = false
    let phone = config.numero_whatsapp ?? ''
    let battery = 0

    try {
      const res = await fetch(baseUrl, {
        headers: {
          'Client-Token': config.zapi_client_token ?? '',
        },
        signal: AbortSignal.timeout(5000),
      })

      if (res.ok) {
        const data = await res.json()
        connected = data.connected ?? false
        phone = data.phone?.phone ?? phone
        battery = data.battery ?? 0
      }
    } catch {
      // Network error — treat as disconnected
    }

    return ok({ connected, phone, battery, configured: true })
  } catch (e: any) {
    if (e instanceof Response) throw e
    return error('Erro interno', 500)
  }
}
