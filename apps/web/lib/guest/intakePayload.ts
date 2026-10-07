/**
 * Bounds for the public guest-intake POST bodies.
 *
 * /api/guest/submit and /api/guest/upload are unauthenticated: the signed
 * token is the credential. Scalar text fields on submit are already clipped.
 * Topics, links, and the token were not — a caller could store arbitrarily
 * long JSON strings or force HMAC over a huge token. Oversized or mistyped
 * values fail closed (null) so the route can answer 400.
 */

import { GUEST_TOKEN_MAX_LENGTH } from '@/lib/guest/token'

/** Matches the defensive cap already used by the submit route. */
export const GUEST_TOPICS_MAX = 25
/** A topic is a short phrase. The intake form never approaches this. */
export const GUEST_TOPIC_MAX = 500

export const GUEST_LINKS_MAX = 15
export const GUEST_LINK_LABEL_MAX = 120
export const GUEST_LINK_URL_MAX = 2000

export interface GuestLink {
  label: string
  url: string
}

/**
 * '' when the field is missing or not a string (the route then treats it as
 * an invalid credential). null when it is a string past the minted length —
 * that is a bad request, not a bad signature.
 */
export function parseGuestToken(value: unknown): string | null {
  if (typeof value !== 'string') return ''
  const token = value.trim()
  if (token.length > GUEST_TOKEN_MAX_LENGTH) return null
  return token
}

export function parseGuestTopics(value: unknown): string[] | null {
  if (value == null) return []
  if (!Array.isArray(value) || value.length > GUEST_TOPICS_MAX) return null
  const topics: string[] = []
  for (const item of value) {
    if (typeof item !== 'string') return null
    const topic = item.trim()
    if (!topic) continue
    if (topic.length > GUEST_TOPIC_MAX) return null
    topics.push(topic)
  }
  return topics
}

export function parseGuestLinks(value: unknown): GuestLink[] | null {
  if (value == null) return []
  if (!Array.isArray(value) || value.length > GUEST_LINKS_MAX) return null
  const links: GuestLink[] = []
  for (const item of value) {
    if (typeof item === 'string') {
      const url = item.trim()
      if (!url) continue
      if (url.length > GUEST_LINK_URL_MAX) return null
      links.push({ label: '', url })
      continue
    }
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null
    const record = item as Record<string, unknown>
    if (record.url == null || record.url === '') continue
    if (typeof record.url !== 'string') return null
    const url = record.url.trim()
    if (!url) continue
    if (url.length > GUEST_LINK_URL_MAX) return null
    let label = ''
    if (record.label != null && record.label !== '') {
      if (typeof record.label !== 'string') return null
      label = record.label.trim()
      if (label.length > GUEST_LINK_LABEL_MAX) return null
    }
    links.push({ label, url })
  }
  return links
}
