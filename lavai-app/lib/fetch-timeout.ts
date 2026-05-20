// fetchWithTimeout — aborta requisições externas que travam, evitando que um
// provedor lento (Asaas, Z-API, Resend, Anthropic) segure o lambda Vercel.
// Mitigação M2 do security audit.

const DEFAULT_TIMEOUT_MS = 15_000

export class FetchTimeoutError extends Error {
  constructor(url: string, timeoutMs: number) {
    super(`Request to ${url} timed out after ${timeoutMs}ms`)
    this.name = 'FetchTimeoutError'
  }
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new FetchTimeoutError(url, timeoutMs)
    throw err
  } finally {
    clearTimeout(timer)
  }
}
