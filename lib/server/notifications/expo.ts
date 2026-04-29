type ExpoPushMessage = {
  to: string
  title?: string
  body?: string
  data?: Record<string, unknown>
  sound?: "default" | null
}

type ExpoPushTicket = {
  status: "ok" | "error"
  id?: string
  message?: string
  details?: Record<string, unknown>
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
const EXPO_CHUNK_SIZE = 100

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

export function isValidExpoPushToken(token: string): boolean {
  return /^ExponentPushToken\[.+\]$/.test(token) || /^ExpoPushToken\[.+\]$/.test(token)
}

export async function sendExpoPushMessages(messages: ExpoPushMessage[]): Promise<{
  sent: number
  failed: number
  tickets: ExpoPushTicket[]
}> {
  if (!messages.length) return { sent: 0, failed: 0, tickets: [] }

  const validMessages = messages.filter((m) => isValidExpoPushToken(m.to))
  if (!validMessages.length) return { sent: 0, failed: messages.length, tickets: [] }

  const batches = chunk(validMessages, EXPO_CHUNK_SIZE)
  const tickets: ExpoPushTicket[] = []

  for (const batch of batches) {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
      cache: "no-store",
    })

    if (!res.ok) {
      const text = await res.text()
      tickets.push({
        status: "error",
        message: `Expo push request failed (${res.status}): ${text.slice(0, 300)}`,
      })
      continue
    }

    const json = (await res.json()) as { data?: ExpoPushTicket[] }
    if (Array.isArray(json.data)) {
      tickets.push(...json.data)
    } else {
      tickets.push({ status: "error", message: "Expo push response missing ticket data" })
    }
  }

  const sent = tickets.filter((t) => t.status === "ok").length
  const failed = tickets.filter((t) => t.status === "error").length + (messages.length - validMessages.length)
  return { sent, failed, tickets }
}
