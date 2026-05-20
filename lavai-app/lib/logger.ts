// Structured logging utility — replaces console.log in all API routes
// Mascara PII (email, telefone, CPF/CNPJ) automaticamente antes de serializar.

type LogLevel = 'info' | 'warn' | 'error'

// ─── PII masking ────────────────────────────────────────────────────────────

const EMAIL_RE = /([A-Za-z0-9._%+-])([A-Za-z0-9._%+-]*?)(@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g
const CPF_RE = /\b(\d{3})\.?\d{3}\.?\d{3}-?(\d{2})\b/g
const CNPJ_RE = /\b(\d{2})\.?\d{3}\.?\d{3}\/?\d{4}-?(\d{2})\b/g
// Telefone BR: 10-11 dígitos, opcionalmente com DDD entre parênteses e separadores
const PHONE_RE = /\b(\(?\d{2}\)?[\s-]?)?9?\d{4}[\s-]?\d{4}\b/g

function maskString(s: string): string {
  if (!s) return s
  return s
    .replace(EMAIL_RE, (_m, first, _mid, domain) => `${first}***${domain}`)
    .replace(CNPJ_RE, (_m, p1, p2) => `${p1}.***.***/****-${p2}`)
    .replace(CPF_RE, (_m, p1, p2) => `${p1}.***.***-${p2}`)
    .replace(PHONE_RE, (m) => {
      const digits = m.replace(/\D/g, '')
      if (digits.length < 10 || digits.length > 11) return m // não é telefone
      return m.slice(0, 2) + '****' + m.slice(-2)
    })
}

// Campos cujo nome indica PII — mascarados independente do formato
const SENSITIVE_KEYS = /^(senha|password|token|secret|authorization|cpf|cnpj|telefone|phone|email)$/i

function maskValue(value: any, key?: string): any {
  if (value == null) return value
  if (typeof value === 'string') {
    if (key && SENSITIVE_KEYS.test(key)) {
      // chave sensível: mostra só comprimento parcial
      return value.length <= 4 ? '***' : value.slice(0, 2) + '***' + value.slice(-2)
    }
    return maskString(value)
  }
  if (Array.isArray(value)) return value.map((v) => maskValue(v))
  if (typeof value === 'object') {
    const out: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) out[k] = maskValue(v, k)
    return out
  }
  return value
}

function log(level: LogLevel, event: string, data?: any, err?: any) {
  const entry: Record<string, any> = {
    level,
    event,
    ts: Date.now(),
    iso: new Date().toISOString(),
  }
  if (data !== undefined) entry.data = maskValue(data)
  if (err !== undefined) {
    entry.error = err instanceof Error
      ? { message: maskString(err.message), stack: err.stack }
      : maskString(String(err))
  }
  const serialized = JSON.stringify(entry)
  if (level === 'error') console.error(serialized)
  else if (level === 'warn') console.warn(serialized)
  else console.log(serialized)
}

export const logger = {
  info: (event: string, data?: any) => log('info', event, data),
  warn: (event: string, data?: any) => log('warn', event, data),
  error: (event: string, err: any, data?: any) => log('error', event, data, err),
}

// Exporta para uso pontual (ex: mascarar antes de mandar pra Sentry)
export { maskString, maskValue }
