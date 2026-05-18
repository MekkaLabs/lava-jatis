import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, error, ok } from '@/lib/api-helpers'

/**
 * POST /api/nps/send
 * Internal — triggered after atendimento status → concluido.
 * Sends a WhatsApp NPS message to the client via Z-API.
 * Body: { atendimentoId }
 */
export async function POST(req: NextRequest) {
  // Requires auth (called server-side with cookie forwarding)
  const { lavaJatoId, error: authError } = await requireAuth(req)
  if (authError) return authError

  try {
    const { atendimentoId } = await req.json()
    if (!atendimentoId) return error('atendimentoId é obrigatório', 400)

    const supabase = createServerSupabaseClient()

    // Fetch atendimento + cliente phone
    const { data: at } = await supabase
      .from('atendimentos')
      .select('id, cliente_nome, lava_jato_id, clientes(nome, telefone), lava_jatos(nome)')
      .eq('id', atendimentoId)
      .eq('lava_jato_id', lavaJatoId)
      .single()

    if (!at) return error('Atendimento não encontrado', 404)

    const telefone    = (at as any).clientes?.telefone ?? null
    const clienteNome = (at as any).clientes?.nome ?? at.cliente_nome ?? 'Cliente'
    const lavaJatoNome = (at as any).lava_jatos?.nome ?? 'nosso lava-jato'

    if (!telefone) return ok({ sent: false, reason: 'Sem telefone' })

    // Z-API config
    const zapiInstanceId  = process.env.ZAPI_INSTANCE_ID
    const zapiToken       = process.env.ZAPI_TOKEN
    const zapiClientToken = process.env.ZAPI_CLIENT_TOKEN

    if (!zapiInstanceId || !zapiToken) return ok({ sent: false, reason: 'Z-API não configurado' })

    const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const avaliarUrl = `${appUrl}/avaliar?at=${atendimentoId}`

    const nome = clienteNome.split(' ')[0]
    const msg  = [
      `Olá, ${nome}! 👋`,
      ``,
      `Seu veículo ficou pronto no *${lavaJatoNome}*! 🚗✨`,
      ``,
      `Que tal deixar uma avaliação rápida? Leva menos de 1 minuto e nos ajuda a melhorar cada vez mais!`,
      ``,
      `⭐ Avaliar agora: ${avaliarUrl}`,
    ].join('\n')

    const phone = telefone.replace(/\D/g, '')

    const zapiRes = await fetch(
      `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': zapiClientToken ?? '',
        },
        body: JSON.stringify({ phone, message: msg }),
      }
    )

    const result = await zapiRes.json().catch(() => ({}))
    return ok({ sent: zapiRes.ok, result })
  } catch (e: any) {
    console.error('[nps/send]', e)
    return error('Erro ao enviar NPS', 500)
  }
}
