import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  createAsaasCustomer,
  findAsaasCustomerByEmail,
  createSubscription,
  PLAN_VALUES,
  PLAN_DESCRIPTIONS,
} from '@/lib/asaas'
import { requireAuth, rateLimit, error, ok, validateCPFCNPJ } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

const ALLOWED_BILLING = ['CREDIT_CARD', 'PIX', 'BOLETO']

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req)

    // Strict rate limit — payment creation
    if (!rateLimit(`${userId}:subscription`, 5, 60_000)) {
      return error('Muitas tentativas. Aguarde 1 minuto.', 429)
    }

    const body = await req.json()
    const { plano, billingType = 'PIX', cpfCnpj } = body

    if (!plano || !PLAN_VALUES[plano]) {
      return error('Plano inválido. Use: basico, profissional ou enterprise', 400)
    }

    if (!ALLOWED_BILLING.includes(billingType)) {
      return error('billingType inválido', 400)
    }

    if (!cpfCnpj) return error('CPF/CNPJ obrigatório', 400)
    if (!validateCPFCNPJ(String(cpfCnpj))) return error('CPF/CNPJ inválido', 400)

    const supabase = createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get lava_jato by user_id (not owner_id from body — always from session)
    const { data: lavaJato, error: lavaJatoError } = await supabase
      .from('lava_jatos')
      .select('id, nome, asaas_customer_id, asaas_subscription_id, plano_status')
      .eq('user_id', userId)
      .single()

    if (lavaJatoError || !lavaJato) {
      return error('Lava-jato não encontrado para este usuário', 404)
    }

    // Create or reuse Asaas customer
    let asaasCustomerId: string = lavaJato.asaas_customer_id ?? ''

    if (!asaasCustomerId) {
      const existingCustomer = await findAsaasCustomerByEmail(user!.email!)
      if (existingCustomer) {
        asaasCustomerId = existingCustomer.id
      } else {
        const newCustomer = await createAsaasCustomer({
          name: lavaJato.nome ?? user!.email!,
          email: user!.email!,
          cpfCnpj: String(cpfCnpj).replace(/\D/g, ''),
          phone: body.phone ? String(body.phone).replace(/\D/g, '') : undefined,
        })
        asaasCustomerId = newCustomer.id
      }

      await supabase
        .from('lava_jatos')
        .update({ asaas_customer_id: asaasCustomerId })
        .eq('id', lavaJato.id)
    }

    // Create subscription
    const nextDueDate = new Date()
    nextDueDate.setDate(nextDueDate.getDate() + 1)
    const dueDateStr = nextDueDate.toISOString().split('T')[0]

    const subscription = await createSubscription({
      customer: asaasCustomerId,
      billingType: billingType as 'CREDIT_CARD' | 'PIX' | 'BOLETO',
      value: PLAN_VALUES[plano],
      nextDueDate: dueDateStr,
      cycle: 'MONTHLY',
      description: PLAN_DESCRIPTIONS[plano],
      externalReference: lavaJato.id,
    })

    await supabase
      .from('lava_jatos')
      .update({
        asaas_subscription_id: subscription.id,
        plano: plano as 'basico' | 'profissional' | 'enterprise',
        plano_status: 'trial',
      })
      .eq('id', lavaJato.id)

    logger.info('subscription.created', { userId, lavaJatoId: lavaJato.id, plano })

    return ok({
      subscriptionId: subscription.id,
      status: subscription.status,
      nextDueDate: subscription.nextDueDate,
      value: subscription.value,
      billingType: subscription.billingType,
    })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('create-subscription', e)
    return error(e instanceof Error ? e.message : 'Erro interno', 500)
  }
}
