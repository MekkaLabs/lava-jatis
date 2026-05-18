import { NextRequest } from 'next/server'
import { requireAuth, error, ok } from '@/lib/api-helpers'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const { lavaJatoId } = await requireAuth(req)
    const supabase = createServerSupabaseClient()

    const { searchParams } = new URL(req.url)
    const telefone = searchParams.get('telefone')

    // List conversations with last message preview
    const { data: conversas, error: dbErr } = await supabase
      .from('whatsapp_conversas')
      .select('*')
      .eq('lava_jato_id', lavaJatoId)
      .order('ultima_mensagem_at', { ascending: false })
      .limit(100)

    if (dbErr) return error('Erro ao buscar conversas', 500)

    // If a specific phone is requested, also fetch messages
    if (telefone) {
      const { data: mensagens, error: msgErr } = await supabase
        .from('whatsapp_mensagens')
        .select('*')
        .eq('lava_jato_id', lavaJatoId)
        .eq('telefone', telefone)
        .order('created_at', { ascending: true })
        .limit(200)

      if (msgErr) return error('Erro ao buscar mensagens', 500)

      return ok({ conversas, mensagens })
    }

    // Fetch last message for each conversation
    const telefones = (conversas ?? []).map((c: any) => c.telefone)
    let ultimasMensagens: any[] = []

    if (telefones.length > 0) {
      const { data: msgs } = await supabase
        .from('whatsapp_mensagens')
        .select('telefone, mensagem, direcao, created_at')
        .eq('lava_jato_id', lavaJatoId)
        .in('telefone', telefones)
        .order('created_at', { ascending: false })

      // Keep only the last message per telefone
      const seen = new Set<string>()
      ultimasMensagens = (msgs ?? []).filter((m: any) => {
        if (seen.has(m.telefone)) return false
        seen.add(m.telefone)
        return true
      })
    }

    const lastMsgMap = Object.fromEntries(
      ultimasMensagens.map((m) => [m.telefone, m])
    )

    const enriched = (conversas ?? []).map((c: any) => ({
      ...c,
      ultima_mensagem: lastMsgMap[c.telefone] ?? null,
    }))

    return ok({ conversas: enriched })
  } catch (e: any) {
    if (e instanceof Response) throw e
    return error('Erro interno', 500)
  }
}
