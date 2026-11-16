/**
 * Canonical origin for auth emails and /auth/callback redirects.
 *
 * LoginForm used to pass window.location.origin as emailRedirectTo. That
 * followed whichever host the form was on. The helper then pinned every
 * brand host to platform.evolvedpros.com. The emailed link landed there,
 * Set-Cookie was host-only, and www.evolvedpros.com never received the session.
 *
 * www.evolvedpros.com is the only sign-in host. Auth cookies are host-only.
 * A click that still arrives on platform.evolvedpros.com is a 308 to the
 * same path on www. The session is then stored only for www.
 *
 * Brand hosts and the public production Railway host canonicalize to www.
 * Loopback stays itself so `next dev` works. A configured preview origin
 * (Railway or Vercel) stays itself when it is the app URL, not when a
 * request header names it. /auth/callback must not echo X-Forwarded-Host:
 * the client can set that header, and an unlisted host is an open redirect.
 */

import { hostnameFromHostHeader, isLoopbackHost, isPreviewHost } from './authCookies'
import { safeRedirectPath } from './safeRedirect'

export const AUTH_ORIGIN = 'https://www.evolvedpros.com'

const RAILWAY_PUBLIC_HOST = 'web-production-db912.up.railway.app'

const SCHEME_PAYLOAD = /^[a-zA-Z][a-zA-Z+.-]*:/

function trimOrigin(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim().replace(/\/+$/, '')
  return trimmed ? trimmed : undefined
}

function parsedHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (url.username || url.password) return null
    return url
  } catch {
    return null
  }
}

/**
 * Origin for auth emails and the default callback base.
 *
 * Brand hosts and the public production Railway host become www.
 * Loopback and a configured preview host stay themselves. Anything else,
 * including a lookalike host, becomes www so it cannot be echoed.
 */
export function resolveAuthOrigin(
  raw: string | undefined | null = process.env.NEXT_PUBLIC_APP_URL,
  fallback: string | undefined | null = process.env.NEXT_PUBLIC_SITE_URL,
): string {
  const value = trimOrigin(raw) ?? trimOrigin(fallback)
  if (!value) return AUTH_ORIGIN
  const url = parsedHttpUrl(value)
  if (!url) return AUTH_ORIGIN
  const host = url.hostname.toLowerCase()
  if (host === RAILWAY_PUBLIC_HOST) return AUTH_ORIGIN
  if (isLoopbackHost(host) || isPreviewHost(host)) return url.origin
  return AUTH_ORIGIN
}

function firstHeaderToken(value: string | null): string | undefined {
  const token = value?.split(',')[0]?.trim()
  return token ? token : undefined
}

/**
 * Base origin for /auth/callback redirects.
 *
 * request.url on Railway is the internal address, so the public host comes
 * from forwarded headers. Only the first value of each header is used, and
 * the scheme must be http or https. Brand hosts, the production Railway
 * host, and any forged host become www. Loopback is echoed so local dev
 * stays local. A preview host is echoed only when it is the configured app
 * URL; a request header alone must not choose the Location.
 */
export function authRedirectBase(
  forwardedHost: string | null,
  forwardedProto: string | null,
  hostHeader: string | null,
  configuredAppUrl: string | undefined | null = process.env.NEXT_PUBLIC_APP_URL,
): string {
  const host =
    firstHeaderToken(forwardedHost) ||
    firstHeaderToken(hostHeader) ||
    RAILWAY_PUBLIC_HOST
  const protoToken = firstHeaderToken(forwardedProto)
  const proto = protoToken === 'http' || protoToken === 'https' ? protoToken : 'https'
  const hostname = hostnameFromHostHeader(host)
  if (hostname && isLoopbackHost(hostname)) {
    return resolveAuthOrigin(`${proto}://${host}`, null)
  }
  if (hostname && isPreviewHost(hostname) && hostname !== RAILWAY_PUBLIC_HOST) {
    const configured = resolveAuthOrigin(configuredAppUrl, null)
    try {
      if (new URL(configured).hostname.toLowerCase() === hostname) return configured
    } catch {
      // Configured value was not a URL. Fall through to www.
    }
  }
  return AUTH_ORIGIN
}

/**
 * Next path for an auth redirect. Relative paths stay. An absolute URL is
 * kept only as a path, and only when its host is evolvedpros.com or a
 * subdomain. External hosts, protocol-relative URLs, and script schemes
 * become the fallback. The result is always a same-origin path.
 */
export function safeAuthNext(raw: unknown, fallback = '/home'): string {
  if (typeof raw !== 'string') return fallback
  const value = raw.trim()
  if (!value) return fallback
  if (value.startsWith('//') || value.startsWith('\\') || value.startsWith('/\\')) return fallback
  if (SCHEME_PAYLOAD.test(value) && !/^https?:/i.test(value)) return fallback

  if (/^https?:\/\//i.test(value)) {
    const url = parsedHttpUrl(value)
    if (!url) return fallback
    const host = url.hostname.toLowerCase()
    if (host !== 'evolvedpros.com' && !host.endsWith('.evolvedpros.com')) return fallback
    return safeRedirectPath(`${url.pathname}${url.search}${url.hash}`, fallback)
  }

  return safeRedirectPath(value, fallback)
}

export function authCallbackUrl(
  next: unknown = '/home',
  origin: string = resolveAuthOrigin(),
): string {
  const path = safeAuthNext(next)
  return `${origin}/auth/callback?next=${encodeURIComponent(path)}`
}

export type MagicLinkOtpType = 'magiclink' | 'invite' | 'signup' | 'recovery' | 'email'

/**
 * Server-side login URL. Uses token_hash + verifyOtp so the click does not
 * need the PKCE verifier cookie (welcome/claim already chose this after
 * action_link fragments caused auth_failed).
 */
export function magicLinkCallbackUrl(
  tokenHash: string,
  type: MagicLinkOtpType = 'magiclink',
  next: unknown = '/home',
  origin: string = resolveAuthOrigin(),
): string {
  const params = new URLSearchParams({
    token_hash: tokenHash,
    type,
    next: safeAuthNext(next),
  })
  return `${origin}/auth/callback?${params.toString()}`
}
