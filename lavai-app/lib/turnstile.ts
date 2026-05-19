// LAVAI — Cloudflare Turnstile verification
//
// Se TURNSTILE_SECRET_KEY estiver presente, valida o token vindo do client.
// Se ausente, retorna `true` (no-op) — permite rodar dev sem Cloudflare.
// Em produção, recomenda-se SEMPRE setar o secret.

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export async function verifyTurnstile(token: string | null | undefined, remoteIp?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    // Sem env var = Turnstile desabilitado. Permite (no-op).
    return true
  }

  if (!token) return false

  try {
    const params = new URLSearchParams({ secret, response: token })
    if (remoteIp) params.set('remoteip', remoteIp)

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    if (!res.ok) return false
    const data = await res.json()
    return Boolean(data?.success)
  } catch {
    return false
  }
}

/** True se Turnstile está habilitado (secret configurado). */
export function isTurnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY)
}
