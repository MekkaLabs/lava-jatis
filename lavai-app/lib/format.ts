// ============================================================
// LAVAI — Brazilian formatting utilities
// ============================================================

// ── Currency ─────────────────────────────────────────────────

export const formatBRL = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

// Alias kept for backwards-compat (fila/page.tsx uses formatCurrency)
export const formatCurrency = formatBRL

// ── Date / Time ───────────────────────────────────────────────

/**
 * Format a date string or Date object.
 * - 'short'    → '17/05/2026'
 * - 'long'     → 'sábado, 17 de maio de 2026'
 * - 'relative' → 'agora', 'há 5 minutos', 'ontem', 'há 3 dias'
 */
export const formatDate = (
  date: string | Date,
  style: 'short' | 'long' | 'relative' = 'short'
): string => {
  const d = typeof date === 'string' ? new Date(date) : date

  if (style === 'short') {
    return d.toLocaleDateString('pt-BR')
  }

  if (style === 'long') {
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // relative
  return getTimeAgo(d)
}

/**
 * Returns a human-readable relative time string in pt-BR.
 * 'agora', 'há 5 minutos', 'há 2 horas', 'ontem', 'há 3 dias'
 */
export const getTimeAgo = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = Date.now() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'agora'
  if (diffMin < 60) return `há ${diffMin} minuto${diffMin !== 1 ? 's' : ''}`
  if (diffHr < 24) return `há ${diffHr} hora${diffHr !== 1 ? 's' : ''}`
  if (diffDay === 1) return 'ontem'
  if (diffDay < 30) return `há ${diffDay} dias`
  const diffMonth = Math.floor(diffDay / 30)
  if (diffMonth < 12) return `há ${diffMonth} ${diffMonth === 1 ? 'mês' : 'meses'}`
  const diffYear = Math.floor(diffMonth / 12)
  return `há ${diffYear} ano${diffYear !== 1 ? 's' : ''}`
}

// ── Phone ─────────────────────────────────────────────────────

/**
 * Formats a Brazilian phone number.
 * Input: '11987654321' or '+5511987654321'
 * Output: '(11) 98765-4321'
 */
export const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '').replace(/^55/, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return phone
}

// ── Vehicle plate ─────────────────────────────────────────────

/**
 * Formats a Brazilian vehicle plate.
 * Old format: 'ABC1234' → 'ABC-1234'
 * Mercosul:   'ABC1D23' → 'ABC1D23' (returned as-is, already standard)
 */
export const formatPlaca = (placa: string): string => {
  const clean = placa.replace(/[^A-Z0-9]/gi, '').toUpperCase()
  if (/^[A-Z]{3}\d{4}$/.test(clean)) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`
  }
  return clean
}

// ── CPF / CNPJ ───────────────────────────────────────────────

/** '00000000000' → '000.000.000-00' */
export const formatCPF = (cpf: string): string => {
  const d = cpf.replace(/\D/g, '').slice(0, 11).padStart(11, '0')
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** '00000000000000' → '00.000.000/0000-00' */
export const formatCNPJ = (cnpj: string): string => {
  const d = cnpj.replace(/\D/g, '').slice(0, 14).padStart(14, '0')
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

// ── Greeting ─────────────────────────────────────────────────

/**
 * Returns a time-appropriate greeting in pt-BR.
 * 'Bom dia' (5–11h) | 'Boa tarde' (12–17h) | 'Boa noite' (18–4h)
 */
export const getGreeting = (): string => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Bom dia'
  if (hour >= 12 && hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

// ── Numbers ───────────────────────────────────────────────────

/** Compact number: 1500 → '1,5k', 1200000 → '1,2M' */
export const formatCompact = (value: number): string =>
  new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)

/** Percentage: 0.1234 → '12,3%' */
export const formatPercent = (value: number, decimals = 1): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
