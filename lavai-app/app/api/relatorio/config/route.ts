// LAVAI — Relatório Email Config API
// GET  /api/relatorio/config  → returns { relatorio_email_ativo, relatorio_email_dia, relatorio_email_hora }
// PATCH /api/relatorio/config → update email schedule preferences

import { NextRequest } from 'next/server'
import { requireAuth, error, ok } from '@/lib/api-helpers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const { lavaJatoId } = await requireAuth(req)
    const supabase = createServerSupabaseClient()

    const { data, error: dbErr } = await supabase
      .from('lava_jatos')
      .select('relatorio_email_ativo, relatorio_email_dia, relatorio_email_hora')
      .eq('id', lavaJatoId)
      .single()

    if (dbErr || !data) return error('Configuração não encontrada', 404)

    return ok({
      relatorio_email_ativo: data.relatorio_email_ativo ?? true,
      relatorio_email_dia:   data.relatorio_email_dia   ?? 1,
      relatorio_email_hora:  data.relatorio_email_hora  ?? 8,
    })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('relatorio.config.get', e)
    return error('Erro interno', 500)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { lavaJatoId } = await requireAuth(req)
    const body = await req.json().catch(() => ({}))

    const allowed: Record<string, (v: any) => boolean> = {
      relatorio_email_ativo: (v) => typeof v === 'boolean',
      relatorio_email_dia:   (v) => Number.isInteger(v) && v >= 0 && v <= 6,
      relatorio_email_hora:  (v) => Number.isInteger(v) && v >= 0 && v <= 23,
    }

    const updates: Record<string, any> = {}
    for (const [key, validate] of Object.entries(allowed)) {
      if (body[key] !== undefined) {
        if (!validate(body[key])) return error(`Valor inválido para ${key}`, 400)
        updates[key] = body[key]
      }
    }

    if (Object.keys(updates).length === 0) return error('Nenhum campo válido para atualizar', 400)

    const supabase = createServerSupabaseClient()
    const { error: dbErr } = await supabase
      .from('lava_jatos')
      .update(updates)
      .eq('id', lavaJatoId)

    if (dbErr) {
      logger.error('relatorio.config.patch_db', dbErr)
      return error('Erro ao salvar configuração', 500)
    }

    return ok({ success: true, updated: updates })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('relatorio.config.patch', e)
    return error('Erro interno', 500)
  }
}
