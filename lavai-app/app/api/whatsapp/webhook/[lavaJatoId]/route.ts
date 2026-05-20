import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-admin'
import { sendMessage } from '@/lib/zapi'
import { processMessage } from '@/lib/bot/conversation'
import { ZAPIWebhookPayload } from '@/lib/zapi'
import { logger } from '@/lib/logger'

function isWithinOperatingHours(inicio: string, fim: string): boolean {
  const now = new Date()
  const [hStart, mStart] = inicio.split(':').map(Number)
  const [hEnd, mEnd] = fim.split(':').map(Number)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const startMinutes = hStart * 60 + mStart
  const endMinutes = hEnd * 60 + mEnd
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes
}

async function logMensagem(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  lavaJatoId: string,
  telefone: string,
  mensagem: string,
  direcao: 'entrada' | 'saida',
  estado?: string
) {
  await supabase.from('whatsapp_mensagens').insert({
    lava_jato_id: lavaJatoId,
    telefone,
    mensagem,
    direcao,
    estado_conversa: estado ?? null,
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { lavaJatoId: string } }
) {
  const { lavaJatoId } = params

  if (!lavaJatoId) {
    return NextResponse.json({ error: 'lavaJatoId required' }, { status: 400 })
  }

  try {
    const supabase = createServiceSupabaseClient()

    // ── Load WhatsApp config for this lava-jato ──────────────────────────────
    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('lava_jato_id', lavaJatoId)
      .single()

    // ── Verify client token (fail-closed) ─────────────────────────────────────
    // Sem config ou sem token configurado = rejeita. Caso contrário, qualquer um
    // poderia POSTar mensagens falsas e criar atendimentos pelo bot.
    if (!config || !config.zapi_client_token) {
      return NextResponse.json({ error: 'Webhook não configurado' }, { status: 401 })
    }

    const incomingToken =
      req.headers.get('client-token') ??
      req.headers.get('Client-Token') ??
      req.nextUrl.searchParams.get('clientToken') ??
      ''

    if (incomingToken !== config.zapi_client_token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Parse payload ────────────────────────────────────────────────────────
    const body: ZAPIWebhookPayload = await req.json()

    // Ignore messages sent by the bot itself
    if (body.fromMe) {
      return NextResponse.json({ ok: true })
    }

    // Only handle ReceivedCallback events
    if (body.type !== 'ReceivedCallback') {
      return NextResponse.json({ ok: true })
    }

    // Ignore group messages
    if (body.isGroup) {
      return NextResponse.json({ ok: true })
    }

    const phone = body.phone
    const messageText = (body.body ?? '').trim()

    if (!phone || !messageText) {
      return NextResponse.json({ ok: true })
    }

    // Use per-lava-jato Z-API credentials if available, otherwise use global env
    const instanceId = config?.zapi_instance_id ?? process.env.ZAPI_INSTANCE_ID
    const token = config?.zapi_token ?? process.env.ZAPI_TOKEN
    const clientToken = config?.zapi_client_token ?? process.env.ZAPI_CLIENT_TOKEN

    if (!instanceId || !token) {
      return NextResponse.json({ error: 'Z-API not configured' }, { status: 503 })
    }

    // ── Check if bot is active ───────────────────────────────────────────────
    if (config && !config.ativo) {
      return NextResponse.json({ ok: true })
    }

    // ── Check message type ───────────────────────────────────────────────────
    // Z-API sends audio as type=ReceivedCallback but body will be empty or a URL
    // We check if body looks like a media URL
    const isMediaMessage =
      messageText.startsWith('https://') &&
      (messageText.includes('audio') ||
        messageText.includes('image') ||
        messageText.includes('video') ||
        messageText.includes('document'))

    if (isMediaMessage) {
      const reply = 'Desculpe, só consigo processar mensagens de texto por enquanto 😊'
      await sendMessage(phone, reply, { instanceId, token, clientToken })
      await logMensagem(supabase, lavaJatoId, phone, reply, 'saida')
      return NextResponse.json({ ok: true })
    }

    // ── Log incoming message ─────────────────────────────────────────────────
    await logMensagem(supabase, lavaJatoId, phone, messageText, 'entrada')

    // ── Operating hours check ────────────────────────────────────────────────
    const horarioInicio = config?.horario_inicio ?? '08:00'
    const horarioFim = config?.horario_fim ?? '18:00'
    const withinHours = isWithinOperatingHours(horarioInicio, horarioFim)

    if (!withinHours && config) {
      const offMsg =
        config.mensagem_fora_horario ??
        `Olá! Estamos fora do horário de atendimento. Funcionamos das ${horarioInicio} às ${horarioFim}.`
      await sendMessage(phone, offMsg, { instanceId, token, clientToken })
      await logMensagem(supabase, lavaJatoId, phone, offMsg, 'saida')
      return NextResponse.json({ ok: true })
    }

    // ── Process message through state machine ────────────────────────────────
    const responses = await processMessage(lavaJatoId, phone, messageText)

    // ── Send each response ───────────────────────────────────────────────────
    for (const response of responses) {
      await sendMessage(phone, response, { instanceId, token, clientToken })
      await logMensagem(supabase, lavaJatoId, phone, response, 'saida')

      // Small delay between messages to feel more natural
      if (responses.length > 1) {
        await new Promise((r) => setTimeout(r, 600))
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    logger.error('whatsapp.webhook.error', err)
    // Always return 200 to Z-API to avoid retries on our logic errors
    return NextResponse.json({ ok: true })
  }
}

// Z-API sometimes sends GET to verify the webhook URL
export async function GET() {
  return NextResponse.json({ status: 'webhook active' })
}
