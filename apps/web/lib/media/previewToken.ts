/**
 * Signed links for unpublished media previews.
 *
 * Format: <payload>.<sig>
 *   payload = base64url(JSON { k, s|w, t })
 *   sig     = base64url(HMAC-SHA256(PREVIEW_TOKEN_SECRET, payload))
 *
 * k = "story" and s = slug, or k = "week" and w = YYYY-MM-DD.
 * t is issued-at epoch ms. Links expire after 7 days.
 *
 * Verify never throws when the secret is missing: the page must 404,
 * not 500. Minting returns null so the admin API can say the secret is unset.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

export const PREVIEW_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const WEEK_RE = /^\d{4}-\d{2}-\d{2}$/

export type PreviewStoryGrant = { kind: 'story'; slug: string }
export type PreviewWeekGrant = { kind: 'week'; week: string }
export type PreviewGrant = PreviewStoryGrant | PreviewWeekGrant

export type PreviewTokenResult =
  | { ok: true; grant: PreviewGrant; issuedAt: number }
  | { ok: false; reason: 'malformed' | 'bad_signature' | 'expired' | 'unconfigured' }

type Payload = { k: 'story'; s: string; t: number } | { k: 'week'; w: string; t: number }

export function previewSecret(): string | null {
  const secret = process.env.PREVIEW_TOKEN_SECRET
  if (!secret || !secret.trim()) return null
  return secret
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64url(value: string): Buffer {
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}

function sign(payload: string, secret: string): string {
  return b64url(createHmac('sha256', secret).update(payload).digest())
}

export function isPreviewSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= 120 && SLUG_RE.test(slug)
}

export function buildPreviewToken(grant: PreviewGrant, issuedAt: number = Date.now()): string | null {
  const secret = previewSecret()
  if (!secret) return null
  if (!Number.isFinite(issuedAt)) return null

  let body: Payload
  if (grant.kind === 'story') {
    if (!isPreviewSlug(grant.slug)) return null
    body = { k: 'story', s: grant.slug, t: issuedAt }
  } else {
    if (!WEEK_RE.test(grant.week)) return null
    body = { k: 'week', w: grant.week, t: issuedAt }
  }

  const payload = b64url(Buffer.from(JSON.stringify(body), 'utf8'))
  return `${payload}.${sign(payload, secret)}`
}

export function verifyPreviewToken(
  token: string | null | undefined,
  now: number = Date.now(),
): PreviewTokenResult {
  const secret = previewSecret()
  if (!secret) return { ok: false, reason: 'unconfigured' }
  if (!token || typeof token !== 'string') return { ok: false, reason: 'malformed' }

  const dot = token.indexOf('.')
  if (dot <= 0 || dot !== token.lastIndexOf('.') || dot === token.length - 1) {
    return { ok: false, reason: 'malformed' }
  }

  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = sign(payload, secret)
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

  let parsed: Payload
  try {
    parsed = JSON.parse(fromB64url(payload).toString('utf8')) as Payload
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  if (!parsed || typeof parsed !== 'object' || typeof parsed.t !== 'number' || !Number.isFinite(parsed.t)) {
    return { ok: false, reason: 'malformed' }
  }
  if (parsed.t > now + 60_000) return { ok: false, reason: 'expired' }
  if (now - parsed.t > PREVIEW_TOKEN_TTL_MS) return { ok: false, reason: 'expired' }

  if (parsed.k === 'story' && typeof parsed.s === 'string' && isPreviewSlug(parsed.s)) {
    return { ok: true, grant: { kind: 'story', slug: parsed.s }, issuedAt: parsed.t }
  }
  if (parsed.k === 'week' && typeof parsed.w === 'string' && WEEK_RE.test(parsed.w)) {
    return { ok: true, grant: { kind: 'week', week: parsed.w }, issuedAt: parsed.t }
  }
  return { ok: false, reason: 'malformed' }
}

export type PreviewAccessInput = {
  isAdmin: boolean
  token?: string | null
  scope: 'story' | 'week'
  slug?: string | null
  week?: string | null
  now?: number
}

/** 200 when an admin session or a matching unexpired token is present. Otherwise 404. */
export function previewAccessStatus(input: PreviewAccessInput): 200 | 404 {
  if (input.scope === 'story') {
    if (!input.slug) return 404
    if (input.isAdmin) return 200
    const verified = verifyPreviewToken(input.token, input.now ?? Date.now())
    if (!verified.ok) return 404
    return verified.grant.kind === 'story' && verified.grant.slug === input.slug ? 200 : 404
  }

  if (!input.week) return 404
  if (input.isAdmin) return 200
  const verified = verifyPreviewToken(input.token, input.now ?? Date.now())
  if (!verified.ok) return 404
  return verified.grant.kind === 'week' && verified.grant.week === input.week ? 200 : 404
}

export function previewStoryPath(slug: string, token?: string | null): string {
  const path = `/media/preview/${slug}`
  if (!token) return path
  return `${path}?token=${encodeURIComponent(token)}`
}

export function previewStoryUrl(slug: string, token: string, origin?: string | null): string {
  const base = (origin ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://platform.evolvedpros.com').replace(/\/+$/, '')
  return `${base}${previewStoryPath(slug, token)}`
}
