import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok } from '@/lib/api-helpers'
import { DEFAULT_CONFIG } from '@/lib/fidelidade'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)
    if (!rateLimit(userId, 200, 60_000)) return error('Rate limit excedido', 429)

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('fidelidade_config')
      .select('*')
      .eq('lava_jato_id', lavaJatoId)
      .single()

    if (dbErr && dbErr.code !== 'PGRST116') {
      logger.error('fidelidade.config.get.db', dbErr, { lavaJatoId })
      return error('Erro interno', 500)
    }

    // Return config or defaults if not configured yet
    return ok({ data: data ?? { ...DEFAULT_CONFIG, lava_jato_id: lavaJatoId } })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('fidelidade.config.get', e)
    return error('Erro interno', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)
    if (!rateLimit(`${userId}:post`, 30, 60_000)) return error('Rate limit excedido', 429)

    const body = await req.json()
    const allowed = [
      'ativo', 'pontos_por_real', 'bonus_aniversario', 'bonus_indicacao',
      'nivel_prata_pontos', 'nivel_ouro_pontos', 'nivel_diamante_pontos', 'mensagem_boas_vindas',
    ]

    const updates: Record<string, any> = { lava_jato_id: lavaJatoId }
    for (const key of allowed) {
      if (key in body) {
        if (key === 'mensagem_boas_vindas') updates[key] = String(body[key]).slice(0, 500)
        else if (key === 'ativo') updates[key] = Boolean(body[key])
        else updates[key] = Number(body[key])
      }
    }

    // Validate level thresholds make sense
    const prata = updates.nivel_prata_pontos ?? 500
    const ouro = updates.nivel_ouro_pontos ?? 1500
    const diamante = updates.nivel_diamante_pontos ?? 5000
    if (prata >= ouro || ouro >= diamante)
      return error('Limites de nível devem ser crescentes: Prata < Ouro < Diamante', 400)

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('fidelidade_config')
      .upsert(updates, { onConflict: 'lava_jato_id' })
      .select()
      .single()

    if (dbErr) {
      logger.error('fidelidade.config.post.db', dbErr, { lavaJatoId })
      return error('Erro ao salvar configuração', 500)
    }

    logger.info('fidelidade.config.saved', { lavaJatoId })
    return ok({ data })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('fidelidade.config.post', e)
    return error('Erro interno', 500)
  }
}
