// LAVAI — Current user + lava_jato info
// GET /api/me  (autenticado via cookie Supabase, ou retorna dados demo)

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { IS_DEMO } from '@/lib/demo'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const PLAN_LABELS: Record<string, string> = {
  starter:    'Plano Starter',
  pro:        'Plano Pro',
  enterprise: 'Plano Enterprise',
}

export async function GET() {
  // Demo mode — devolve fallback sem tocar no Supabase (fonte única: lib/demo)
  if (IS_DEMO) {
    return NextResponse.json({
      user: { id: 'demo', email: 'demo@lavai.com.br', nome: 'Modo Demo' },
      lavaJato: {
        id: 'demo',
        nome: 'Seu Lava-Jato (Demo)',
        plano: 'pro',
        planoLabel: 'Plano Pro (Demo)',
        planoStatus: 'trial',
      },
    })
  }

  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: lj } = await supabase
      .from('lava_jatos')
      .select('id, nome, plano, plano_status')
      .eq('user_id', user.id)
      .single()

    const fallbackNome =
      (user.user_metadata as any)?.nome ||
      user.email?.split('@')[0] ||
      'Você'

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email ?? '',
        nome: fallbackNome,
      },
      lavaJato: lj
        ? {
            id: lj.id,
            nome: lj.nome,
            plano: lj.plano,
            planoLabel: PLAN_LABELS[lj.plano] ?? 'Plano Starter',
            planoStatus: lj.plano_status ?? 'trial',
          }
        : null,
    })
  } catch (e: any) {
    logger.error('me.error', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
