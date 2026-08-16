/**
 * Unsubscribe token minting + verification (SPRINT EM-1).
 *
 * A campaign email carries a one-click unsubscribe link. That link is reached
 * by someone with no session, from their mail client, so the token IS the
 * credential. It is therefore signed rather than guessable, and self-describing
 * rather than stored — no DB round-trip is needed to reject a forged link.
 *
 * Format:  <payload>.<sig>
 *   payload = base64url("<prospectId>:<issuedAtMs>")
 *   sig     = base64url(HMAC-SHA256(secret, payload))
 *
 * Unlike lib/guest/token.ts, this one does NOT fall back to the service-role
 * key: an unsubscribe link is printed into email that lives forever in
 * inboxes and archives, so its signing key must be rotatable independently of
 * database credentials. UNSUBSCRIBE_SECRET is required, and its absence throws
 * at call time (not import time) so a misconfigured env fails the send rather
 * than the whole server boot.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

/** Links stay valid for six months — long enough for an archived email. */
export const UNSUBSCRIBE_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000

function secret(): string {
  const s = process.env.UNSUBSCRIBE_SECRET
  if (!s) {
    throw new Error('UNSUBSCRIBE_SECRET is not set — refusing to mint or verify unsubscribe tokens.')
  }
  return s
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}

function sign(payload: string): string {
  return b64url(createHmac('sha256', secret()).update(payload).digest())
}

/**
 * Mint an unsubscribe token for a prospect. `issuedAt` is injectable so tests
 * can produce an aged token without waiting six months.
 */
export function buildUnsubscribeToken(prospectId: string, issuedAt: number = Date.now()): string {
  if (!prospectId) throw new Error('prospectId is required')
  const payload = b64url(Buffer.from(`${prospectId}:${issuedAt}`, 'utf8'))
  return `${payload}.${sign(payload)}`
}

export type VerifyResult =
  | { ok: true; prospectId: string; issuedAt: number }
  | { ok: false; reason: 'malformed' | 'bad_signature' | 'expired' }

/**
 * Verify a token and return the prospect id it carries.
 *
 * Callers must NOT surface `reason` to the visitor — an unsubscribe page that
 * distinguishes "expired" from "forged" leaks whether a given id was ever real.
 * The reason exists for tests and code-only logging.
 */
export function verifyUnsubscribeToken(
  token: string | null | undefined,
  now: number = Date.now(),
): VerifyResult {
  if (!token || typeof token !== 'string') return { ok: false, reason: 'malformed' }

  const dot = token.indexOf('.')
  if (dot <= 0 || dot === token.length - 1) return { ok: false, reason: 'malformed' }

  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)

  // Compare signatures before parsing the payload, so an attacker cannot use
  // parse behaviour as an oracle on unsigned input.
  const expected = sign(payload)
  const a = Buffer.from(sig, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  if (a.length !== b.length) return { ok: false, reason: 'bad_signature' }
  let equal = false
  try {
    equal = timingSafeEqual(a, b)
  } catch {
    return { ok: false, reason: 'bad_signature' }
  }
  if (!equal) return { ok: false, reason: 'bad_signature' }

  let decoded: string
  try {
    decoded = fromB64url(payload).toString('utf8')
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  // Split on the LAST colon: a UUID has none, but this survives an id format
  // change that introduces one.
  const sep = decoded.lastIndexOf(':')
  if (sep <= 0) return { ok: false, reason: 'malformed' }
  const prospectId = decoded.slice(0, sep)
  const issuedAt = Number(decoded.slice(sep + 1))
  if (!prospectId || !Number.isFinite(issuedAt)) return { ok: false, reason: 'malformed' }

  // A token dated in the future is a clock problem or a forgery attempt with a
  // leaked key; either way it is not something to honour.
  if (issuedAt > now + 60_000) return { ok: false, reason: 'expired' }
  if (now - issuedAt > UNSUBSCRIBE_MAX_AGE_MS) return { ok: false, reason: 'expired' }

  return { ok: true, prospectId, issuedAt }
}

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? 'https://platform.evolvedpros.com'

/** The visible unsubscribe link printed in a campaign footer. */
export function unsubscribeUrl(prospectId: string, issuedAt?: number): string {
  const token = buildUnsubscribeToken(prospectId, issuedAt)
  return `${APP_URL()}/unsubscribe?token=${encodeURIComponent(token)}`
}

/** RFC 8058 One-Click target — the POST endpoint, not the human-facing page. */
export function oneClickUnsubscribeUrl(prospectId: string, issuedAt?: number): string {
  const token = buildUnsubscribeToken(prospectId, issuedAt)
  return `${APP_URL()}/api/email/unsubscribe?token=${encodeURIComponent(token)}`
}
