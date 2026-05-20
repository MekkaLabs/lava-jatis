import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SERVICOS_DEFAULTS } from '@/lib/constants'
import { logger } from '@/lib/logger'

// Regex helpers
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneDigits = (v: string) => v.replace(/\D/g, '')

function capitalize(str: string) {
  return str
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .trim()
}

/**
 * POST /api/cadastro
 * Cria usuário + lava_jato usando service role (bypassa RLS + confirma email automaticamente).
 * Após sucesso, o front faz signInWithPassword para estabelecer sessão.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome, email, senha, nomeLavaJato, cidade, whatsapp } = body

    // ── Validação server-side ──────────────────────────────────
    const errors: Record<string, string> = {}

    const nomeClean = (nome ?? '').trim()
    if (!nomeClean || nomeClean.split(' ').filter(Boolean).length < 2) {
      errors.nome = 'Informe nome e sobrenome.'
    }

    const emailClean = (email ?? '').trim().toLowerCase()
    if (!emailRe.test(emailClean)) {
      errors.email = 'Email inválido.'
    }

    if (!senha || senha.length < 8) {
      errors.senha = 'Senha deve ter pelo menos 8 caracteres.'
    } else if (!/[A-Z]/.test(senha)) {
      errors.senha = 'Senha deve ter pelo menos uma letra maiúscula.'
    } else if (!/[0-9]/.test(senha)) {
      errors.senha = 'Senha deve ter pelo menos um número.'
    }

    const nomeJato = (nomeLavaJato ?? '').trim()
    if (nomeJato.length < 3) {
      errors.nomeLavaJato = 'Nome do lava-jato deve ter pelo menos 3 caracteres.'
    }

    const whatsappDigits = phoneDigits(whatsapp ?? '')
    if (whatsappDigits.length > 0 && whatsappDigits.length !== 10 && whatsappDigits.length !== 11) {
      errors.whatsapp = 'WhatsApp inválido. Use (DD) 99999-9999.'
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 422 })
    }

    // ── Supabase Admin (service role) ──────────────────────────
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Criar usuário no Auth (com email já confirmado)
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: emailClean,
      password: senha,
      email_confirm: true,
      user_metadata: { nome: capitalize(nomeClean) },
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        return NextResponse.json({ errors: { email: 'Este email já está cadastrado.' } }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    // Inserir lava_jato com service role (sem precisar de sessão autenticada)
    const { data: lavaJato, error: insertError } = await admin
      .from('lava_jatos')
      .insert({
        user_id: userId,
        nome: capitalize(nomeJato),
        cidade: cidade ? capitalize(cidade.trim()) : null,
        whatsapp: whatsappDigits || null,
        plano: 'starter',
        plano_status: 'trial',
      })
      .select('id')
      .single()

    if (insertError || !lavaJato) {
      // Rollback: deletar usuário criado para não deixar órfão
      await admin.auth.admin.deleteUser(userId)
      logger.error('cadastro.insert_lava_jatos', insertError)
      return NextResponse.json({ error: 'Erro ao criar lava-jato. Tente novamente.' }, { status: 500 })
    }

    // Onboarding: insere serviços padrão (preço em centavos no constants → reais no banco)
    // Falha aqui NÃO faz rollback — usuário pode criar serviços manualmente depois.
    const servicosRows = SERVICOS_DEFAULTS.map(s => ({
      lava_jato_id: lavaJato.id,
      nome: s.nome,
      preco: s.preco / 100,
      duracao_minutos: s.duracao_min,
      ativo: true,
    }))
    const { error: servicosError } = await admin.from('servicos').insert(servicosRows)
    if (servicosError) {
      logger.warn('cadastro.servicos_defaults_failed', { error: servicosError.message })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    logger.error('cadastro.unexpected', e)
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}
