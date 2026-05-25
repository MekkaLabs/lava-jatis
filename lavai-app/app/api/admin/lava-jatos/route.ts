// GET /api/admin/lava-jatos
// Lista todos os lava-jatos (super-admin apenas).
// Usa RPC admin_list_lava_jatos() que valida super_admins server-side.

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { error, ok } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return error('Não autenticado', 401)

    const { data, error: rpcErr } = await supabase.rpc('admin_list_lava_jatos')

    if (rpcErr) {
      // se a função levantou "forbidden", retorna 403
      if (String(rpcErr.message ?? '').toLowerCase().includes('forbidden')) {
        return error('Acesso restrito a super-admins', 403)
      }
      logger.error('admin.lava_jatos.rpc', rpcErr)
      return error('Erro ao listar lava-jatos', 500)
    }

    return ok({ lavaJatos: data ?? [] })
  } catch (e) {
    logger.error('admin.lava_jatos.fatal', e)
    return error('Erro interno', 500)
  }
}
