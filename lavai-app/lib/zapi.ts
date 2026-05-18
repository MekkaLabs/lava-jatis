// Z-API WhatsApp Client
// Docs: https://developer.z-api.io/

const ZAPI_BASE = () =>
  `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}`

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ZAPIResponse {
  zaapId?: string
  messageId?: string
  id?: string
  error?: string
}

export interface ZAPIStatusResponse {
  connected: boolean
  smartphoneConnected?: boolean
  session?: string
  phone?: {
    phone: string
    display_name: string
    photo: string
  }
  battery?: number
}

export interface ZAPIWebhookPayload {
  phone: string
  body: string
  type: string
  messageId: string
  fromMe: boolean
  momment: number
  status: string
  chatName: string
  senderPhoto?: string
  senderName?: string
  participantPhone?: string | null
  photo?: string
  broadcast: boolean
  isGroup: boolean
  instanceId: string
  referenceId?: string
  origin?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format phone: strip non-digits, add Brazil country code (55) if needed.
 */
export function formatPhone(phone: string): string {
  let digits = phone.replace(/\D/g, '')
  // Remove leading zeros
  digits = digits.replace(/^0+/, '')
  // Add country code if missing (must be 10 or 11 digits without code)
  if (digits.length === 10 || digits.length === 11) {
    digits = '55' + digits
  }
  return digits
}

/**
 * Verify Z-API webhook using the client-token header.
 */
export function verifyZAPIWebhook(clientToken: string, expectedToken: string): boolean {
  if (!expectedToken) return true // no token configured = skip verification
  return clientToken === expectedToken
}

// ─── Send helpers ──────────────────────────────────────────────────────────────

async function zapiPost(path: string, body: unknown): Promise<ZAPIResponse> {
  const url = `${ZAPI_BASE()}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Client-Token': process.env.ZAPI_CLIENT_TOKEN || '',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Z-API error ${res.status}: ${text}`)
  }

  return res.json()
}

/**
 * Send a plain text message.
 */
export async function sendMessage(phone: string, message: string): Promise<void> {
  const formatted = formatPhone(phone)
  await zapiPost('/send-text', {
    phone: formatted,
    message,
  })
}

/**
 * Send a message with up to 3 reply buttons.
 */
export async function sendButtonMessage(
  phone: string,
  message: string,
  buttons: Array<{ id: string; label: string }>
): Promise<void> {
  const formatted = formatPhone(phone)
  await zapiPost('/send-button-list', {
    phone: formatted,
    message,
    buttonList: {
      buttons: buttons.map((b) => ({
        id: b.id,
        label: b.label,
      })),
    },
  })
}

/**
 * Send a list message (menu with sections).
 */
export async function sendListMessage(
  phone: string,
  title: string,
  items: Array<{ id: string; title: string; description: string }>
): Promise<void> {
  const formatted = formatPhone(phone)
  await zapiPost('/send-option-list', {
    phone: formatted,
    message: title,
    optionList: {
      title: 'Escolha uma opção',
      buttonLabel: 'Ver opções',
      sections: [
        {
          title: title,
          rows: items.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
          })),
        },
      ],
    },
  })
}

/**
 * Send a formatted text message (supports WhatsApp markdown: *bold*, _italic_, ~strike~).
 * Joins lines with \n.
 */
export async function sendFormattedMessage(phone: string, lines: string[]): Promise<void> {
  const message = lines.join('\n')
  await sendMessage(phone, message)
}

/**
 * Check if the Z-API instance is connected.
 */
export async function getInstanceStatus(): Promise<{
  connected: boolean
  phone: string
  battery: number
}> {
  try {
    const url = `${ZAPI_BASE()}/status`
    const res = await fetch(url, {
      headers: {
        'Client-Token': process.env.ZAPI_CLIENT_TOKEN || '',
      },
    })

    if (!res.ok) {
      return { connected: false, phone: '', battery: 0 }
    }

    const data: ZAPIStatusResponse = await res.json()
    return {
      connected: data.connected ?? false,
      phone: data.phone?.phone ?? '',
      battery: data.battery ?? 0,
    }
  } catch {
    return { connected: false, phone: '', battery: 0 }
  }
}
