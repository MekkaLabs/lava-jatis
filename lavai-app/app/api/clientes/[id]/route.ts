import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok, notFound } from '@/lib/api-helpers'
import { ClienteSchema, sanitizeString } from '@/lib/validation'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(userId, 200, 60_000)) return error('Rate limit excedido', 429)

    const supabase = createServerSupabaseClient()
    const { data: cliente, error: dbErr } = await supabase
      .from('clientes')
      .select('id, nome, telefone, email, cpf, created_at')
      .eq('id', params.id)
      .eq('lava_jato_id', lavaJatoId)
      .single()

    if (dbErr || !cliente) return notFound('Cliente')

    const { data: historico } = await supabase
      .from('atendimentos')
      .select(`id, status, preco_final, placa, modelo, created_at, servicos(nome)`)
      .eq('cliente_id', params.id)
      .eq('lava_jato_id', lavaJatoId)
      .order('created_at', { ascending: false })
      .limit(20)

    return ok({ data: { ...cliente, historico: historico ?? [] } })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('clientes[id].get', e)
    return error('Erro interno', 500)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(`${userId}:patch`, 60, 60_000)) return error('Rate limit excedido', 429)

    const body = await req.json()
    const validation = ClienteSchema.update(body)
    if (!validation.valid) return error(validation.errors.join('; '), 400)

    // Campos editáveis. Mapeia 'modelo' do form pra coluna 'modelo_veiculo' do banco.
    const allowed = ['nome', 'telefone', 'email', 'cpf', 'placa', 'modelo_veiculo', 'cor'] as const
    const limits: Record<string, number> = {
      nome: 200, telefone: 30, email: 254, cpf: 30,
      placa: 10, modelo_veiculo: 100, cor: 30,
    }
    const updates: Record<string, any> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = sanitizeString(body[key] ?? '', limits[key] ?? 100)
    }
    if (typeof body.modelo === 'string' && !('modelo_veiculo' in body)) {
      updates.modelo_veiculo = sanitizeString(body.modelo, 100)
    }
    if ('placa' in updates && updates.placa) updates.placa = String(updates.placa).toUpperCase()

    if (Object.keys(updates).length === 0) return error('Nenhum campo para atualizar', 400)

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('clientes')
      .update(updates)
      .eq('id', params.id)
      .eq('lava_jato_id', lavaJatoId)
      .select()
      .single()

    if (dbErr) {
      logger.error('clientes[id].patch.db', dbErr, { id: params.id })
      return error('Erro ao atualizar cliente', 500)
    }

    return ok({ data })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('clientes[id].patch', e)
    return error('Erro interno', 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(`${userId}:delete`, 20, 60_000)) return error('Rate limit excedido', 429)

    const supabase = createServerSupabaseClient()
    const { error: dbErr } = await supabase
      .from('clientes')
      .delete()
      .eq('id', params.id)
      .eq('lava_jato_id', lavaJatoId)

    if (dbErr) {
      logger.error('clientes[id].delete.db', dbErr, { id: params.id })
      return error('Erro ao deletar cliente', 500)
    }

    logger.info('clientes.deleted', { id: params.id, lavaJatoId })
    return ok({ data: { id: params.id, deleted: true } })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('clientes[id].delete', e)
    return error('Erro interno', 500)
  }
}
