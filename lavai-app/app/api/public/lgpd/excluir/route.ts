import { NextRequest } from 'next/server'
import { error, ok, rateLimit } from '@/lib/api-helpers'
import { createServiceSupabaseClient } from '@/lib/supabase-admin'
import { logger } from '@/lib/logger'

// LGPD Art. 18 — direito de exclusão (eliminação).
// Endpoint público que registra solicitação de exclusão de dados.
// O processamento real é manual (revisão humana) — V1 simples e seguro.

const MAX_MOTIVO_LEN = 500

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!rateLimit(`lgpd-excl-ip:${ip}`, 3, 60 * 60_000)) {
    return error('Muitas solicitações. Tente em 1 hora.', 429)
  }

  try {
    const body = await req.json()
    const telefoneRaw = String(body.telefone ?? '').replace(/\D/g, '')
    const email = String(body.email ?? '').trim().toLowerCase()
    const motivo = String(body.motivo ?? '').trim().slice(0, MAX_MOTIVO_LEN)

    if (!telefoneRaw && !email) {
      return error('Informe telefone ou email pra te identificarmos', 400)
    }
    if (telefoneRaw && telefoneRaw.length !== 10 && telefoneRaw.length !== 11) {
      return error('Telefone inválido (use 10 ou 11 dígitos)', 400)
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return error('Email inválido', 400)
    }

    const supabase = createServiceSupabaseClient()

    // Insere solicitação. Se a tabela ainda não existe, log no servidor
    // (revisão manual via Supabase Dashboard).
    const { error: insertErr } = await supabase
      .from('solicitacoes_lgpd')
      .insert({
        tipo: 'exclusao',
        telefone: telefoneRaw || null,
        email: email || null,
        motivo: motivo || null,
        ip,
        user_agent: req.headers.get('user-agent') ?? null,
        status: 'pendente',
      })

    if (insertErr) {
      // Fallback: log estruturado pra ainda registrar mesmo se tabela faltar.
      // logger mascara telefone/email automaticamente (PII redaction).
      logger.warn('lgpd.excluir.insert_fallback', {
        tipo: 'exclusao',
        telefone: telefoneRaw,
        email,
        motivo,
        ip,
        error: insertErr.message,
      })
    }

    return ok({
      received: true,
      message:
        'Recebemos sua solicitação. Vamos analisar e responder em até 15 dias úteis no canal informado.',
    })
  } catch (e: any) {
    logger.error('lgpd.excluir.error', e)
    return error('Erro ao registrar solicitação. Tente novamente.', 500)
  }
}
