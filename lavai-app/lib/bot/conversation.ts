// WhatsApp Bot — Conversation State Machine
// Stores state in Supabase `whatsapp_conversas` table

import { createClient } from '@supabase/supabase-js'

// Use service role for webhook (no user session)
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConversationState =
  | 'inicio'
  | 'aguardando_nome'
  | 'aguardando_data'
  | 'aguardando_horario'
  | 'confirmando_agendamento'
  | 'aguardando_placa'
  | 'aguardando_cpf'
  | 'finalizado'

export interface ConversaWhatsApp {
  id: string
  lava_jato_id: string
  telefone: string
  estado: ConversationState
  contexto: Record<string, any>
  ultima_mensagem_at: string
  created_at: string
}

// ─── DB Helpers ───────────────────────────────────────────────────────────────

export async function getOrCreateConversa(
  lavaJatoId: string,
  telefone: string
): Promise<ConversaWhatsApp> {
  const supabase = getSupabase()

  // Try to get existing conversation
  const { data: existing } = await supabase
    .from('whatsapp_conversas')
    .select('*')
    .eq('lava_jato_id', lavaJatoId)
    .eq('telefone', telefone)
    .single()

  if (existing) {
    // Reset to inicio if last message was > 30 minutes ago (session timeout)
    const lastMsg = new Date(existing.ultima_mensagem_at).getTime()
    const isStale = Date.now() - lastMsg > 30 * 60 * 1000
    if (isStale && existing.estado !== 'inicio') {
      await updateConversa(existing.id, 'inicio', {})
      return { ...existing, estado: 'inicio', contexto: {} }
    }
    return existing
  }

  // Create new conversation
  const { data: created, error } = await supabase
    .from('whatsapp_conversas')
    .insert({
      lava_jato_id: lavaJatoId,
      telefone,
      estado: 'inicio',
      contexto: {},
    })
    .select('*')
    .single()

  if (error || !created) {
    throw new Error(`Failed to create conversa: ${error?.message}`)
  }

  return created
}

export async function updateConversa(
  id: string,
  estado: ConversationState,
  contexto?: Record<string, any>
): Promise<void> {
  const supabase = getSupabase()

  const update: any = {
    estado,
    ultima_mensagem_at: new Date().toISOString(),
  }

  if (contexto !== undefined) {
    update.contexto = contexto
  }

  await supabase.from('whatsapp_conversas').update(update).eq('id', id)
}

// ─── Business logic helpers ───────────────────────────────────────────────────

function getLavaJatoInfo(lavaJatoId: string) {
  // In production this would query lava_jatos table
  // Used for personalizing messages
  return { nome: 'Lava-Jato' }
}

async function buscarStatusAtendimento(
  lavaJatoId: string,
  placa: string
): Promise<string> {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('atendimentos')
    .select('status, servico_nome, cliente_nome, created_at')
    .eq('lava_jato_id', lavaJatoId)
    .ilike('placa', placa.trim())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) {
    return `Nenhum atendimento encontrado para a placa *${placa.toUpperCase()}*.`
  }

  const statusMap: Record<string, string> = {
    aguardando: '⏳ Aguardando na fila',
    em_andamento: '🚿 Em andamento',
    concluido: '✅ Concluído',
    cancelado: '❌ Cancelado',
  }

  const statusLabel = statusMap[data.status] ?? data.status
  const hora = new Date(data.created_at).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    `*Status da placa ${placa.toUpperCase()}*\n\n` +
    `Serviço: ${data.servico_nome}\n` +
    `Status: ${statusLabel}\n` +
    `Registrado às: ${hora}`
  )
}

async function buscarPontosFidelidade(
  lavaJatoId: string,
  cpfOrPhone: string
): Promise<string> {
  const supabase = getSupabase()
  const digits = cpfOrPhone.replace(/\D/g, '')

  let query = supabase
    .from('clientes')
    .select('nome, pontos, nivel, telefone')
    .eq('lava_jato_id', lavaJatoId)

  // Try CPF (11 digits) or phone
  if (digits.length === 11 && !digits.startsWith('55')) {
    // Might be CPF — search by phone as fallback
    query = query.or(`telefone.ilike.%${digits}%`)
  } else {
    query = query.or(`telefone.ilike.%${digits}%`)
  }

  const { data } = await query.limit(1).single()

  if (!data) {
    return `Não encontrei um cadastro com esse número. Fale com a equipe para se cadastrar no programa de fidelidade! 😊`
  }

  const nivelEmoji: Record<string, string> = {
    bronze: '🥉',
    prata: '🥈',
    ouro: '🥇',
    diamante: '💎',
  }

  const emoji = nivelEmoji[data.nivel] ?? '⭐'
  const proximo = data.nivel === 'bronze'
    ? 'Acumule 200 pts para chegar ao Prata!'
    : data.nivel === 'prata'
    ? 'Acumule 500 pts para chegar ao Ouro!'
    : data.nivel === 'ouro'
    ? 'Acumule 1000 pts para chegar ao Diamante!'
    : 'Você está no nível máximo! 🎉'

  return (
    `${emoji} *Programa de Fidelidade*\n\n` +
    `Olá, *${data.nome}*!\n` +
    `Pontos acumulados: *${data.pontos} pts*\n` +
    `Nível atual: *${data.nivel.charAt(0).toUpperCase() + data.nivel.slice(1)}* ${emoji}\n\n` +
    proximo
  )
}

// ─── Menu text ────────────────────────────────────────────────────────────────

const MENU = `Olá! 👋 Bem-vindo ao nosso atendimento pelo WhatsApp.

Como posso te ajudar?

1️⃣ Ver meu carro
2️⃣ Agendar lavagem
3️⃣ Status da OS (placa)
4️⃣ Pontos de fidelidade
5️⃣ Falar com atendente

_Responda com o número da opção desejada._`

// ─── State Machine ────────────────────────────────────────────────────────────

export async function processMessage(
  lavaJatoId: string,
  telefone: string,
  message: string
): Promise<string[]> {
  const conversa = await getOrCreateConversa(lavaJatoId, telefone)
  const text = message.trim()
  const lower = text.toLowerCase()

  // Global commands that work in any state
  if (['menu', 'inicio', 'comecar', 'começar', '0', 'voltar'].includes(lower)) {
    await updateConversa(conversa.id, 'inicio', {})
    return [MENU]
  }

  switch (conversa.estado) {
    // ── INICIO ────────────────────────────────────────────────────────────────
    case 'inicio': {
      const option = text.replace(/[^1-5]/g, '')

      if (option === '1') {
        await updateConversa(conversa.id, 'aguardando_placa', { flow: 'ver_carro' })
        return [
          '🔍 *Ver meu carro*\n\nQual é a placa do veículo?\n\n_Ex: ABC1D23 ou ABC-1234_',
        ]
      }

      if (option === '2') {
        await updateConversa(conversa.id, 'aguardando_nome', { flow: 'agendamento' })
        return [
          '📅 *Agendar lavagem*\n\nVamos começar! Qual é o seu nome completo?',
        ]
      }

      if (option === '3') {
        await updateConversa(conversa.id, 'aguardando_placa', { flow: 'status_os' })
        return [
          '🔎 *Status da OS*\n\nQual é a placa do veículo?\n\n_Ex: ABC1D23 ou ABC-1234_',
        ]
      }

      if (option === '4') {
        await updateConversa(conversa.id, 'aguardando_cpf', { flow: 'fidelidade' })
        return [
          '⭐ *Pontos de Fidelidade*\n\nInforme seu CPF ou número de telefone cadastrado:',
        ]
      }

      if (option === '5') {
        await updateConversa(conversa.id, 'finalizado', {})
        return [
          '👤 Transferindo para um atendente humano...\n\nAguarde um momento, nossa equipe irá te atender em breve! 😊',
        ]
      }

      // Unknown input — show menu
      return [MENU]
    }

    // ── AGUARDANDO NOME (agendamento) ─────────────────────────────────────────
    case 'aguardando_nome': {
      if (text.length < 2) {
        return ['Por favor, informe seu nome completo.']
      }
      const ctx = { ...conversa.contexto, nome: text }
      await updateConversa(conversa.id, 'aguardando_data', ctx)
      return [
        `Obrigado, *${text}*! 😊\n\nQual data você prefere para a lavagem?\n\n_Ex: 20/05 ou 20/05/2025_`,
      ]
    }

    // ── AGUARDANDO DATA (agendamento) ─────────────────────────────────────────
    case 'aguardando_data': {
      // Basic date validation
      if (!/\d{1,2}[\/\-]\d{1,2}/.test(text)) {
        return ['Por favor, informe uma data válida.\n\n_Ex: 20/05 ou 20/05/2025_']
      }
      const ctx = { ...conversa.contexto, data: text }
      await updateConversa(conversa.id, 'aguardando_horario', ctx)
      return [
        `📅 Data: *${text}*\n\nQual horário você prefere?\n\n_Nosso horário de atendimento é das 8h às 18h._`,
      ]
    }

    // ── AGUARDANDO HORÁRIO (agendamento) ──────────────────────────────────────
    case 'aguardando_horario': {
      if (!/\d{1,2}[h:]\d{0,2}|\d{1,2}h/i.test(text)) {
        return ['Por favor, informe um horário válido.\n\n_Ex: 9h, 14:30, 10h30_']
      }
      const ctx: Record<string, any> = { ...conversa.contexto, horario: text }
      await updateConversa(conversa.id, 'confirmando_agendamento', ctx)

      return [
        `✅ *Confirmar agendamento?*\n\n` +
          `Nome: *${ctx['nome'] ?? ''}*\n` +
          `Data: *${ctx['data'] ?? ''}*\n` +
          `Horário: *${text}*\n\n` +
          `Responda *SIM* para confirmar ou *NÃO* para cancelar.`,
      ]
    }

    // ── CONFIRMANDO AGENDAMENTO ───────────────────────────────────────────────
    case 'confirmando_agendamento': {
      if (['sim', 's', 'yes', '1', 'confirmar', 'confirmo'].includes(lower)) {
        const ctx = conversa.contexto
        // Here you would create an agendamento record in DB
        await updateConversa(conversa.id, 'finalizado', {})
        return [
          `🎉 *Agendamento confirmado!*\n\n` +
            `Nome: *${ctx.nome}*\n` +
            `Data: *${ctx.data}*\n` +
            `Horário: *${ctx.horario}*\n\n` +
            `Te esperamos! Qualquer dúvida, é só chamar aqui. 😊\n\n` +
            `_Digite *menu* para voltar ao início._`,
        ]
      }

      if (['nao', 'não', 'n', 'no', 'cancelar'].includes(lower)) {
        await updateConversa(conversa.id, 'inicio', {})
        return [
          'Agendamento cancelado. 👍\n\n' + MENU,
        ]
      }

      return ['Por favor, responda *SIM* para confirmar ou *NÃO* para cancelar.']
    }

    // ── AGUARDANDO PLACA ──────────────────────────────────────────────────────
    case 'aguardando_placa': {
      const placa = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
      if (placa.length < 6 || placa.length > 8) {
        return ['Por favor, informe uma placa válida.\n\n_Ex: ABC1D23 ou ABC-1234_']
      }

      const flow = conversa.contexto?.flow

      if (flow === 'ver_carro' || flow === 'status_os') {
        const statusMsg = await buscarStatusAtendimento(lavaJatoId, placa)
        await updateConversa(conversa.id, 'finalizado', {})
        return [
          statusMsg,
          '_Digite *menu* para voltar ao início._',
        ]
      }

      // Fallback
      await updateConversa(conversa.id, 'finalizado', {})
      return [
        `Placa *${placa}* registrada. Nossa equipe irá verificar! 😊\n\n_Digite *menu* para voltar ao início._`,
      ]
    }

    // ── AGUARDANDO CPF (fidelidade) ───────────────────────────────────────────
    case 'aguardando_cpf': {
      const digits = text.replace(/\D/g, '')
      if (digits.length < 8) {
        return ['Por favor, informe um CPF ou telefone válido.']
      }

      const pontosMsg = await buscarPontosFidelidade(lavaJatoId, digits)
      await updateConversa(conversa.id, 'finalizado', {})
      return [
        pontosMsg,
        '_Digite *menu* para voltar ao início._',
      ]
    }

    // ── FINALIZADO ────────────────────────────────────────────────────────────
    case 'finalizado': {
      await updateConversa(conversa.id, 'inicio', {})
      return [MENU]
    }

    default:
      await updateConversa(conversa.id, 'inicio', {})
      return [MENU]
  }
}
