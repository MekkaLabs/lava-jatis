import crypto from 'crypto'
import { fetchWithTimeout } from '@/lib/fetch-timeout'

const ASAAS_BASE =
  process.env.ASAAS_ENV === 'production'
    ? 'https://api.asaas.com/v3'
    : 'https://sandbox.asaas.com/api/v3'

function getHeaders(): HeadersInit {
  const apiKey = process.env.ASAAS_API_KEY
  if (!apiKey) throw new Error('ASAAS_API_KEY não configurada')
  return {
    'Content-Type': 'application/json',
    access_token: apiKey,
  }
}

async function asaasFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetchWithTimeout(`${ASAAS_BASE}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers ?? {}),
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Asaas API error ${response.status}: ${errorBody}`)
  }

  return response.json() as Promise<T>
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AsaasCustomer {
  id: string
  name: string
  email: string
  cpfCnpj: string
  phone: string | null
  dateCreated: string
  object: 'customer'
}

export interface CreateAsaasCustomerData {
  name: string
  email: string
  cpfCnpj: string
  phone?: string
}

export interface AsaasSubscription {
  id: string
  customer: string
  billingType: 'CREDIT_CARD' | 'PIX' | 'BOLETO'
  value: number
  nextDueDate: string
  cycle: 'MONTHLY'
  description: string
  externalReference: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
  dateCreated: string
  object: 'subscription'
}

export interface CreateSubscriptionData {
  customer: string
  billingType: 'CREDIT_CARD' | 'PIX' | 'BOLETO'
  value: number
  nextDueDate: string
  cycle: 'MONTHLY'
  description: string
  externalReference?: string
}

export interface AsaasListResponse<T> {
  object: 'list'
  hasMore: boolean
  totalCount: number
  limit: number
  offset: number
  data: T[]
}

export interface AsaasPayment {
  id: string
  subscription: string | null
  customer: string
  status: string
  value: number
  netValue: number
  billingType: string
  dueDate: string
  paymentDate: string | null
  invoiceUrl: string | null
  bankSlipUrl: string | null
  object: 'payment'
}

export interface AsaasWebhookEvent {
  id?: string  // Asaas envia ID único por evento — usado para idempotência
  event:
    | 'PAYMENT_CONFIRMED'
    | 'PAYMENT_RECEIVED'
    | 'PAYMENT_OVERDUE'
    | 'PAYMENT_DELETED'
    | 'PAYMENT_REFUNDED'
    | 'SUBSCRIPTION_INACTIVATED'
    | string
  payment?: AsaasPayment
  subscription?: AsaasSubscription
}

// ─── Customer functions ────────────────────────────────────────────────────────

export async function createAsaasCustomer(
  data: CreateAsaasCustomerData
): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getAsaasCustomer(
  customerId: string
): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>(`/customers/${customerId}`)
}

export async function findAsaasCustomerByEmail(
  email: string
): Promise<AsaasCustomer | null> {
  const result = await asaasFetch<AsaasListResponse<AsaasCustomer>>(
    `/customers?email=${encodeURIComponent(email)}`
  )
  return result.data[0] ?? null
}

// ─── Subscription functions ────────────────────────────────────────────────────

export async function createSubscription(
  data: CreateSubscriptionData
): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getSubscription(
  subscriptionId: string
): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>(`/subscriptions/${subscriptionId}`)
}

export async function cancelSubscription(
  subscriptionId: string
): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>(`/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
  })
}

// ─── Webhook verification ─────────────────────────────────────────────────────

export async function verifyWebhook(
  payload: string,
  signature: string
): Promise<boolean> {
  const token = process.env.ASAAS_WEBHOOK_TOKEN
  if (!token) {
    console.warn('ASAAS_WEBHOOK_TOKEN não configurado')
    return false
  }
  const expected = crypto
    .createHmac('sha256', token)
    .update(payload)
    .digest('hex')
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature.replace(/^sha256=/, ''), 'hex')
    )
  } catch {
    return false
  }
}

// ─── Plan helpers ─────────────────────────────────────────────────────────────

export const PLAN_VALUES: Record<string, number> = {
  basico: 97,
  profissional: 197,
  enterprise: 599,
}

export const PLAN_DESCRIPTIONS: Record<string, string> = {
  basico: 'LAVAI Básico — 1 unidade, até 3 funcionários',
  profissional: 'LAVAI Profissional — até 3 unidades, funcionários ilimitados',
  enterprise: 'LAVAI Enterprise — unidades ilimitadas, API, suporte dedicado',
}
