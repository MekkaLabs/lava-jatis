import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { endpoint } = await req.json()

    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint obrigatório' }, { status: 400 })
    }

    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Delete by matching endpoint inside the JSONB subscription column
    const { error } = await service
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('subscription->>endpoint', endpoint)

    if (error) {
      console.error('[push/unsubscribe] delete error:', error)
      return NextResponse.json({ error: 'Erro ao remover inscrição' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[push/unsubscribe] erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
