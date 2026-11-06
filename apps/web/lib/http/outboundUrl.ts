/**
 * Absolute http(s) URL safe to hand to redirect() or an <a href>.
 *
 * A published media story of type "redirect" calls redirect(source_url), and
 * the public guest-intake POST stores linkedin, headshot, avatar, and link
 * URLs. Those values are caller-controlled. javascript:, data:, a
 * protocol-relative host, a credentialed URL, and a literal private address
 * must not become a Location or an href.
 *
 * The WHATWG parser is the same one the browser uses. Control characters and
 * backslashes are refused before that parse: the parser strips TAB/LF/CR and
 * rewrites "\" to "/", which can change the host a person thought they pasted.
 */

import { publicUrlBlockReason } from './publicUrl'

export const OUTBOUND_URL_MAX = 2000

export function outboundHttpUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed || trimmed.length > OUTBOUND_URL_MAX) return null
  if (/[\u0000-\u001F\u007F\\]/.test(trimmed)) return null
  if (publicUrlBlockReason(trimmed)) return null

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (url.username || url.password || !url.hostname) return null
  return url.href
}

/**
 * Blank is null (clear the column). A present value that is not a public
 * http(s) URL is 'invalid' so the caller can 422 instead of storing it.
 */
export function storedOutboundUrl(
  value: unknown,
  max = OUTBOUND_URL_MAX,
): string | null | 'invalid' {
  if (value == null) return null
  if (typeof value !== 'string') return 'invalid'
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length > max) return 'invalid'
  return outboundHttpUrl(trimmed) ?? 'invalid'
}

/** Only a redirect story with a public http(s) source may leave the origin. */
export function storyRedirectTarget(storyType: unknown, sourceUrl: unknown): string | null {
  if (storyType !== 'redirect') return null
  return outboundHttpUrl(sourceUrl)
}
