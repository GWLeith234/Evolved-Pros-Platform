/**
 * Canonical origin for auth emails and /auth/callback redirects.
 *
 * LoginForm used to pass window.location.origin as emailRedirectTo. That is
 * host-scoped: a PKCE verifier cookie set on www is invisible on platform
 * (and the reverse).
 *
 * LIVE host split: www / apex stay on Bluehost WordPress until George YES
 * on DNS. Auth must stay on platform.evolvedpros.com — a magic link whose
 * redirect_to names www lands on WordPress, not this app.
 *
 * Brand hosts AND the public Railway host canonicalize to platform.
 * localhost is left alone so local `next dev` still works.
 */

import { safeRedirectPath } from './safeRedirect'

export const AUTH_ORIGIN = 'https://platform.evolvedpros.com'

const CANONICALIZE_HOSTS = new Set([
  'www.evolvedpros.com',
  'evolvedpros.com',
  'platform.evolvedpros.com',
])

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
    const host = url.hostname.toLowerCase()
    if (
      CANONICALIZE_HOSTS.has(host) ||
      host.endsWith('.evolvedpros.com') ||
      host.endsWith('.up.railway.app')
    ) {
      return AUTH_ORIGIN
    }
    return `${url.protocol}//${url.host}`
  } catch {
    return AUTH_ORIGIN
  }
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
