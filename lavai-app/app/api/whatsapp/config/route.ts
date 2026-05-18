import { NextRequest } from 'next/server'
import { requireAuth, error, ok } from '@/lib/api-helpers'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const { lavaJatoId } = await requireAuth(req)
    const supabase = createServerSupabaseClient()

    const { data, error: dbErr } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('lava_jato_id', lavaJatoId)
      .single()

    if (dbErr && dbErr.code !== 'PGRST116') {
      return error('Erro ao buscar configuração', 500)
    }

    return ok({ data: data ?? null })
  } catch (e: any) {
    if (e instanceof Response) throw e
    return error('Erro interno', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { lavaJatoId } = await requireAuth(req)
    const supabase = createServerSupabaseClient()

    const body = await req.json()

    const {
      zapi_instance_id,
      zapi_token,
      zapi_client_token,
      numero_whatsapp,
      ativo,
      horario_inicio,
      horario_fim,
      mensagem_fora_horario,
    } = body

    // Basic validation
    if (horario_inicio && !/^\d{2}:\d{2}$/.test(horario_inicio)) {
      return error('horario_inicio inválido (use HH:MM)', 400)
    }
    if (horario_fim && !/^\d{2}:\d{2}$/.test(horario_fim)) {
      return error('horario_fim inválido (use HH:MM)', 400)
    }

    const upsertData: Record<string, any> = {
      lava_jato_id: lavaJatoId,
    }

    if (zapi_instance_id !== undefined) upsertData.zapi_instance_id = zapi_instance_id
    if (zapi_token !== undefined) upsertData.zapi_token = zapi_token
    if (zapi_client_token !== undefined) upsertData.zapi_client_token = zapi_client_token
    if (numero_whatsapp !== undefined) upsertData.numero_whatsapp = numero_whatsapp
    if (ativo !== undefined) upsertData.ativo = Boolean(ativo)
    if (horario_inicio !== undefined) upsertData.horario_inicio = horario_inicio
    if (horario_fim !== undefined) upsertData.horario_fim = horario_fim
    if (mensagem_fora_horario !== undefined) upsertData.mensagem_fora_horario = mensagem_fora_horario

    const { data, error: dbErr } = await supabase
      .from('whatsapp_config')
      .upsert(upsertData, { onConflict: 'lava_jato_id' })
      .select('*')
      .single()

    if (dbErr) {
      console.error('[whatsapp/config POST]', dbErr)
      return error('Erro ao salvar configuração', 500)
    }

    return ok({ data })
  } catch (e: any) {
    if (e instanceof Response) throw e
    return error('Erro interno', 500)
  }
}
