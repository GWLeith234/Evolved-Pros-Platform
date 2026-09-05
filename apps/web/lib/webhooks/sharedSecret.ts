/**
 * Timing-safe shared-secret check for inbound webhooks.
 *
 * Vendasta Business App Automation "Send a webhook" lets CoS set a static
 * header. That is a shared secret, not the archived #80 HMAC signature on
 * VENDASTA_WEBHOOK_SECRET. Do not reuse that env var here.
 */

import { timingSafeEqual } from 'node:crypto'

export const CONVERSATIONS_WEBHOOK_SECRET_ENV = 'VENDASTA_CONVERSATIONS_WEBHOOK_SECRET'
export const CONVERSATIONS_WEBHOOK_SECRET_HEADER = 'x-webhook-secret'

export type SecretCheck =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string }

/** Header first; Authorization: Bearer <secret> as a fallback some UIs prefer. */
export function readProvidedSecret(headers: Headers): string | null {
  const header = headers.get(CONVERSATIONS_WEBHOOK_SECRET_HEADER)?.trim()
  if (header) return header
  const auth = headers.get('authorization')
  if (auth && /^bearer\s+/i.test(auth)) {
    const token = auth.replace(/^bearer\s+/i, '').trim()
    return token || null
  }
  return null
}

export function verifySharedSecret(
  provided: string | null,
  expected: string | undefined,
): SecretCheck {
  const secret = expected?.trim() ?? ''
  if (!secret) {
    return { ok: false, status: 503, error: 'Webhook not configured' }
  }
  if (!provided) {
    return { ok: false, status: 401, error: 'Missing webhook secret' }
  }

  const a = Buffer.from(provided)
  const b = Buffer.from(secret)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, status: 401, error: 'Invalid webhook secret' }
  }
  return { ok: true }
}

export function authorizeConversationsWebhook(headers: Headers): SecretCheck {
  return verifySharedSecret(
    readProvidedSecret(headers),
    process.env[CONVERSATIONS_WEBHOOK_SECRET_ENV],
  )
}
