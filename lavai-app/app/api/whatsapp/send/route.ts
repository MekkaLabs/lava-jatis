import { NextRequest } from 'next/server'
import { requireAuth, error, ok } from '@/lib/api-helpers'
import { sendMessage } from '@/lib/zapi'
import { createServiceSupabaseClient } from '@/lib/supabase-admin'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    const body = await req.json()
    const { phone, message, lavaJatoId: bodyLavaJatoId } = body

    if (!phone || !message) {
      return error('phone e message são obrigatórios', 400)
    }

    if (message.length > 4096) {
      return error('Mensagem muito longa (máximo 4096 caracteres)', 400)
    }

    const targetLavaJatoId = bodyLavaJatoId ?? lavaJatoId

    const supabase = createServiceSupabaseClient()
    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('zapi_instance_id, zapi_token, zapi_client_token')
      .eq('lava_jato_id', targetLavaJatoId)
      .maybeSingle()

    await sendMessage(phone, message, {
      instanceId: config?.zapi_instance_id ?? process.env.ZAPI_INSTANCE_ID ?? '',
      token: config?.zapi_token ?? process.env.ZAPI_TOKEN ?? '',
      clientToken: config?.zapi_client_token ?? process.env.ZAPI_CLIENT_TOKEN ?? '',
    })

    await supabase.from('whatsapp_mensagens').insert({
      lava_jato_id: targetLavaJatoId,
      telefone: phone,
      mensagem: message,
      direcao: 'saida',
    })

    return ok({ sent: true })
  } catch (e: any) {
    if (e instanceof Response) throw e
    logger.error('whatsapp.send.error', e)
    return error('Erro ao enviar mensagem. Tente novamente.', 500)
  }
}
