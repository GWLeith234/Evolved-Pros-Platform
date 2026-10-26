/**
 * Email brief capture model (SPRINT M).
 *
 * Validation and copy live here, away from the route and the component, so the
 * rules are unit-testable - vitest only collects lib/**.
 *
 * DEPENDENCY-FREE ON PURPOSE - imports nothing.
 */

/** Longest address we accept. RFC 5321 caps a path at 254 octets. */
export const BRIEF_EMAIL_MAX = 254

/**
 * JSON body cap for POST /api/media/brief. A real signup is an email, a
 * source, a same-origin path, and an empty honeypot, well under a kilobyte.
 * 4KB leaves headroom for that shape and rejects a multi-megabyte post before
 * it is parsed or written.
 */
export const BRIEF_BODY_MAX = 4096

/**
 * True when the declared Content-Length or the buffered body is past the cap.
 * Pass `raw` as '' to check the header before reading. A missing or
 * non-numeric header does not count as oversized; the buffered length still does.
 */
export function briefPayloadTooLarge(contentLength: string | null, raw: string): boolean {
  if (contentLength !== null && contentLength.trim() !== '') {
    const declared = Number(contentLength)
    if (Number.isFinite(declared) && declared > BRIEF_BODY_MAX) return true
  }
  return raw.length > BRIEF_BODY_MAX
}

/** Object JSON only. Arrays, scalars, and broken JSON are rejected. */
export function parseBriefJson(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * Deliberately loose: one @, something either side, a dot in the domain, no
 * whitespace. Tighter regexes reject real addresses (plus-tags, new TLDs,
 * unicode locals) and the only thing that actually proves an address works is
 * sending to it. Bounce handling is the real filter, not this.
 */
const SHAPE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

/**
 * Trim, lowercase, and accept or reject. Returns null for anything we will not
 * store, so a caller can treat null as "422" without re-deriving why.
 */
export function normalizeBriefEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const email = raw.trim().toLowerCase()
  if (!email || email.length > BRIEF_EMAIL_MAX) return null
  if (!SHAPE.test(email)) return null
  return email
}

/** Capture surfaces. An unknown source is stored as plain 'media'. */
export const BRIEF_SOURCES = ['media-rail', 'media-article', 'media'] as const
export type BriefSource = (typeof BRIEF_SOURCES)[number]

export function normalizeBriefSource(raw: unknown): BriefSource {
  return typeof raw === 'string' && (BRIEF_SOURCES as readonly string[]).includes(raw)
    ? (raw as BriefSource)
    : 'media'
}

/**
 * Only same-origin paths are stored. A full URL from a hostile client would
 * otherwise land in the table and get rendered somewhere later.
 */
export function normalizeBriefPath(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const path = raw.trim()
  if (!path.startsWith('/') || path.startsWith('//')) return null
  return path.slice(0, 512)
}

/** Fixed copy. One place, so the rail and the article foot cannot drift. */
export const BRIEF_COPY = {
  kicker: 'The Brief',
  pitch: 'One read every weekday from Evolved Pros Media.',
  label: 'Email address',
  placeholder: 'you@company.com',
  submit: 'Get the brief',
  pending: 'Signing up…',
  success: "You're on the list. Watch for the next brief.",
  invalid: 'That address does not look right. Try again?',
  failure: 'Something went wrong on our end. Try again in a moment.',
  fineprint: 'No spam. Unsubscribe in one click.',
} as const
