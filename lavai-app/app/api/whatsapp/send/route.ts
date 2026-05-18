import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, error, ok } from '@/lib/api-helpers'
import { sendMessage } from '@/lib/zapi'
import { createClient } from '@supabase/supabase-js'

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

    // Send via Z-API
    await sendMessage(phone, message)

    // Log to DB (service role to bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await supabase.from('whatsapp_mensagens').insert({
      lava_jato_id: targetLavaJatoId,
      telefone: phone,
      mensagem: message,
      direcao: 'saida',
    })

    return ok({ sent: true })
  } catch (e: any) {
    if (e instanceof Response) throw e
    console.error('[whatsapp/send]', e)
    return error('Erro ao enviar mensagem: ' + (e.message ?? 'desconhecido'), 500)
  }
}
