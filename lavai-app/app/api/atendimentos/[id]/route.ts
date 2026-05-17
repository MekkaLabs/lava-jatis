import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok, notFound } from '@/lib/api-helpers'
import { AtendimentoSchema, sanitizeString } from '@/lib/validation'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(userId, 200, 60_000)) return error('Rate limit excedido', 429)

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('atendimentos')
      .select(`
        id, cliente_nome, placa, modelo, cor, status, preco_final,
        observacao, created_at, updated_at,
        clientes(id, nome, telefone, email),
        servicos(id, nome, preco),
        funcionarios(id, nome)
      `)
      .eq('id', params.id)
      .eq('lava_jato_id', lavaJatoId)   // RLS: ownership enforced
      .single()

    if (dbErr || !data) return notFound('Atendimento')
    return ok({ data })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('atendimentos[id].get', e)
    return error('Erro interno', 500)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(`${userId}:patch`, 60, 60_000)) return error('Rate limit excedido', 429)

    const body = await req.json()
    const validation = AtendimentoSchema.update(body)
    if (!validation.valid) return error(validation.errors.join('; '), 400)

    const allowed = ['status', 'preco_final', 'observacao', 'funcionario_id']
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    for (const key of allowed) {
      if (key in body) {
        if (key === 'observacao') updates[key] = sanitizeString(body[key], 2000)
        else if (key === 'preco_final') updates[key] = Number(body[key])
        else updates[key] = body[key]
      }
    }

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('atendimentos')
      .update(updates)
      .eq('id', params.id)
      .eq('lava_jato_id', lavaJatoId)   // ownership enforced
      .select()
      .single()

    if (dbErr) {
      logger.error('atendimentos[id].patch.db', dbErr, { id: params.id })
      return error('Erro ao atualizar atendimento', 500)
    }

    logger.info('atendimentos.updated', { id: params.id, lavaJatoId })
    return ok({ data })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('atendimentos[id].patch', e)
    return error('Erro interno', 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(`${userId}:delete`, 20, 60_000)) return error('Rate limit excedido', 429)

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('atendimentos')
      .update({ status: 'cancelado', updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('lava_jato_id', lavaJatoId)   // ownership enforced — soft delete
      .select()
      .single()

    if (dbErr) {
      logger.error('atendimentos[id].delete.db', dbErr, { id: params.id })
      return error('Erro ao cancelar atendimento', 500)
    }

    logger.info('atendimentos.cancelled', { id: params.id, lavaJatoId })
    return ok({ data })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('atendimentos[id].delete', e)
    return error('Erro interno', 500)
  }
}
