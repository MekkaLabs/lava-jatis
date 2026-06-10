import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth, rateLimit, error, ok } from '@/lib/api-helpers'
import { CategoriaEstoqueSchema, sanitizeString } from '@/lib/validation'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(userId, 200, 60_000)) return error('Rate limit excedido', 429)

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('estoque_categorias')
      .select('id, nome, created_at')
      .eq('lava_jato_id', lavaJatoId)
      .order('nome', { ascending: true })

    if (dbErr) {
      logger.error('estoque_categorias.get.db', dbErr, { lavaJatoId })
      return error('Erro interno', 500)
    }

    return ok({ data })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('estoque_categorias.get', e)
    return error('Erro interno', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    if (!rateLimit(`${userId}:post`, 30, 60_000)) return error('Rate limit excedido', 429)

    const body = await req.json()
    const validation = CategoriaEstoqueSchema.create(body)
    if (!validation.valid) return error(validation.errors.join('; '), 400)

    const supabase = createServerSupabaseClient()
    const { data, error: dbErr } = await supabase
      .from('estoque_categorias')
      .insert({ lava_jato_id: lavaJatoId, nome: sanitizeString(body.nome, 100) })
      .select()
      .single()

    if (dbErr) {
      logger.error('estoque_categorias.post.db', dbErr, { lavaJatoId })
      return error('Erro ao criar categoria', 500)
    }

    return ok({ data }, 201)
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('estoque_categorias.post', e)
    return error('Erro interno', 500)
  }
}
