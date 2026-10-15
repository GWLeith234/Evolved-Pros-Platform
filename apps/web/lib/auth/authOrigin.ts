/**
 * Canonical origin for auth emails and /auth/callback redirects.
 *
 * LoginForm used to pass window.location.origin as emailRedirectTo. That is
 * host-scoped: a PKCE verifier cookie set on www is invisible on platform
 * (and the reverse).
 *
 * LIVE host split (2026-09-29, George YES via CoS, sitemap hygiene sprint):
 * www and platform both serve this Railway app. Auth still stays on
 * platform.evolvedpros.com because Supabase cookies are host-scoped there.
 * A magic link whose redirect_to names www would set the session on www,
 * where member routes are not the auth host.
 *
 * Brand hosts and the public Railway host canonicalize to platform.
 * Loopback (localhost, 127.0.0.1, ::1) is returned as its own origin so
 * local `next dev` still works. Every other host falls back to platform.
 * /auth/callback builds Location from X-Forwarded-Host, which the client
 * can set; echoing an unlisted host is an open redirect.
 */

import { safeRedirectPath } from './safeRedirect'

export const AUTH_ORIGIN = 'https://platform.evolvedpros.com'

const CANONICALIZE_HOSTS = new Set([
  'www.evolvedpros.com',
  'evolvedpros.com',
  'platform.evolvedpros.com',
])

/** Origins safe to echo. Anything else must not become a redirect base. */
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

const RAILWAY_PUBLIC_HOST = 'web-production-db912.up.railway.app'

function trimOrigin(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim().replace(/\/+$/, '')
  return trimmed ? trimmed : undefined
}

export function resolveAuthOrigin(
  raw: string | undefined | null = process.env.NEXT_PUBLIC_APP_URL,
  fallback: string | undefined | null = process.env.NEXT_PUBLIC_SITE_URL,
): string {
  const value = trimOrigin(raw) ?? trimOrigin(fallback)
  if (!value) return AUTH_ORIGIN
  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return AUTH_ORIGIN
    const host = url.hostname.toLowerCase()
    if (
      CANONICALIZE_HOSTS.has(host) ||
      host.endsWith('.evolvedpros.com') ||
      host.endsWith('.up.railway.app')
    ) {
      return AUTH_ORIGIN
    }
    if (LOOPBACK_HOSTS.has(host)) return url.origin
    return AUTH_ORIGIN
  } catch {
    return AUTH_ORIGIN
  }
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
 * the scheme must be http or https. resolveAuthOrigin then refuses any host
 * that is not a brand host or loopback.
 */
export function authRedirectBase(
  forwardedHost: string | null,
  forwardedProto: string | null,
  hostHeader: string | null,
): string {
  const host =
    firstHeaderToken(forwardedHost) ||
    firstHeaderToken(hostHeader) ||
    RAILWAY_PUBLIC_HOST
  const protoToken = firstHeaderToken(forwardedProto)
  const proto = protoToken === 'http' || protoToken === 'https' ? protoToken : 'https'
  return resolveAuthOrigin(`${proto}://${host}`)
}

export function authCallbackUrl(
  next: unknown = '/home',
  origin: string = resolveAuthOrigin(),
): string {
  const path = safeRedirectPath(next)
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
    next: safeRedirectPath(next),
  })
  return `${origin}/auth/callback?${params.toString()}`
}
