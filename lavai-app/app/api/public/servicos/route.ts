import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { error, ok } from '@/lib/api-helpers'

/**
 * GET /api/public/servicos?lj_id=<lava_jato_id>
 * Public — returns available services + lava-jato name (no auth required).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ljId = searchParams.get('lj_id')
  if (!ljId) return error('lj_id é obrigatório', 400)

  const supabase = createServerSupabaseClient()

  const [ljRes, svcRes] = await Promise.all([
    supabase
      .from('lava_jatos')
      .select('nome, cidade, estado')
      .eq('id', ljId)
      .single(),
    supabase
      .from('servicos')
      // Select both column names for compatibility (schema may have duracao_min or duracao_minutos)
      .select('id, nome, preco, duracao_min, duracao_minutos, ativo')
      .eq('lava_jato_id', ljId)
      .eq('ativo', true)
      .order('preco', { ascending: true }),
  ])

  if (!ljRes.data) return error('Lava-jato não encontrado', 404)

  // Normalise column name: prefer duracao_minutos, fall back to duracao_min
  const servicos = (svcRes.data ?? []).map((s: any) => ({
    ...s,
    duracao_minutos: s.duracao_minutos ?? s.duracao_min ?? 30,
  }))

  return ok({
    lavaJatoNome: ljRes.data.nome,
    cidade:       ljRes.data.cidade ?? null,
    estado:       (ljRes.data as any).estado ?? null,
    servicos,
  })
}
