// LAVAI — NPS link signature (HMAC-SHA256)
//
// Links públicos para avaliação (/avaliar?at=ID&sig=HMAC) são assinados.
// O endpoint público só aceita atendimentos com assinatura válida —
// impede sabotagem de NPS de concorrente por força bruta de UUIDs.

import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Devolve o secret a usar. Em produção EXIGIMOS NPS_HMAC_SECRET setado.
 * Em dev, se ausente, usa fallback determinístico (NÃO seguro, mas
 * permite teste local sem env). O console avisa.
 */
function getSecret(): string {
  const s = process.env.NPS_HMAC_SECRET
  if (s && s.length >= 16) return s
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NPS_HMAC_SECRET ausente em produção')
  }
  // dev fallback (não é seguro, é só pra desenvolvimento local funcionar)
  console.warn('[nps-signature] NPS_HMAC_SECRET ausente — usando fallback DEV apenas')
  return 'dev-only-nps-fallback-secret-do-not-use-in-prod'
}

export function signNps(atendimentoId: string): string {
  return createHmac('sha256', getSecret()).update(atendimentoId).digest('hex')
}

export function verifyNps(atendimentoId: string, sig: string | null | undefined): boolean {
  if (!sig) return false
  let expected: string
  try { expected = signNps(atendimentoId) } catch { return false }
  if (sig.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}
