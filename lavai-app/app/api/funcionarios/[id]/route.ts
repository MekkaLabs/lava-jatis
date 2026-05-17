import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok, notFound } from '@/lib/api-helpers'
import { FuncionarioSchema, sanitizeString } from '@/lib/validation'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(userId, 200, 60_000)) return error('Rate limit excedido', 429)

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('funcionarios')
      .select('id, nome, cargo, telefone, salario, created_at')
      .eq('id', params.id)
      .eq('lava_jato_id', lavaJatoId)
      .single()

    if (dbErr || !data) return notFound('Funcionário')
    return ok({ data })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('funcionarios[id].get', e)
    return error('Erro interno', 500)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(`${userId}:patch`, 60, 60_000)) return error('Rate limit excedido', 429)

    const body = await req.json()
    const validation = FuncionarioSchema.update(body)
    if (!validation.valid) return error(validation.errors.join('; '), 400)

    const allowed = ['nome', 'cargo', 'telefone', 'salario']
    const updates: Record<string, any> = {}
    for (const key of allowed) {
      if (key in body) {
        if (key === 'salario') updates[key] = body[key] !== null ? Number(body[key]) : null
        else updates[key] = sanitizeString(body[key] ?? '', 200)
      }
    }

    if (Object.keys(updates).length === 0) return error('Nenhum campo para atualizar', 400)

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('funcionarios')
      .update(updates)
      .eq('id', params.id)
      .eq('lava_jato_id', lavaJatoId)
      .select()
      .single()

    if (dbErr) {
      logger.error('funcionarios[id].patch.db', dbErr, { id: params.id })
      return error('Erro ao atualizar funcionário', 500)
    }

    return ok({ data })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('funcionarios[id].patch', e)
    return error('Erro interno', 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(`${userId}:delete`, 20, 60_000)) return error('Rate limit excedido', 429)

    const supabase = createServerSupabaseClient()
    const { error: dbErr } = await supabase
      .from('funcionarios')
      .delete()
      .eq('id', params.id)
      .eq('lava_jato_id', lavaJatoId)

    if (dbErr) {
      logger.error('funcionarios[id].delete.db', dbErr, { id: params.id })
      return error('Erro ao deletar funcionário', 500)
    }

    logger.info('funcionarios.deleted', { id: params.id, lavaJatoId })
    return ok({ data: { id: params.id, deleted: true } })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('funcionarios[id].delete', e)
    return error('Erro interno', 500)
  }
}
