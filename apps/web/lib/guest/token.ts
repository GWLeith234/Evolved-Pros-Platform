/**
 * Guest access-token minting + verification.
 *
 * A guest engagement is reached through /guest/[token]. The token is the bearer
 * credential (magic-link trust model, same as friend_invites) — but unlike a
 * bare UUID it is HMAC-signed so garbage/forged tokens are rejected cheaply,
 * before any DB round-trip, and can't be brute-forced into a valid shape.
 *
 * Format:  <id>.<sig>
 *   id  = base64url(18 random bytes)              → 24 unguessable chars
 *   sig = base64url(HMAC-SHA256(secret, id))[:24] → tamper-evident signature
 *
 * The full "id.sig" string is stored (unique) in guest_engagements.access_token
 * and is what appears in the URL. The DB lookup remains authoritative; the
 * signature is defense-in-depth. Secret comes from GUEST_TOKEN_SECRET, falling
 * back to SUPABASE_SERVICE_ROLE_KEY (always present server-side) so no new env
 * var is required to ship.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

function secret(): string {
  return (
    process.env.GUEST_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  )
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function sign(id: string): string {
  return b64url(createHmac('sha256', secret()).update(id).digest()).slice(0, 24)
}

/** Mint a fresh signed access token for a new guest engagement. */
export function mintGuestToken(): string {
  const id = b64url(randomBytes(18))
  return `${id}.${sign(id)}`
}

/**
 * Verify a token's signature. Returns true only for a well-formed, correctly
 * signed token. Does NOT check existence/expiry — that's the DB's job.
 */
export function verifyGuestToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [id, sig] = parts
  if (!id || !sig) return false
  const expected = sign(id)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}
