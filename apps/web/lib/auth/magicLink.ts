/**
 * Public magic-link request validation + login-error copy.
 *
 * Signup used to call supabase.auth.signInWithOtp from the browser (PKCE).
 * The email then carried a verify URL with token=pkce_…, and /auth/callback
 * needed the host-scoped verifier cookie to exchangeCodeForSession. A
 * platform→www hop, or a click in a different browser, dropped that cookie
 * and surfaced as /login?error=auth_failed.
 *
 * The send path is now POST /api/auth/magic-link (generateLink + Resend +
 * token_hash). This module is the request guard the route and tests share.
 */

import { safeRedirectPath } from './safeRedirect'

const EMAIL_MAX = 320
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const AUTH_FAILED_LOGIN_MESSAGE =
  'That login link expired or could not be completed. Request a new one.'

export const MAGIC_LINK_SEND_FAILED =
  'Could not send that login link. Try again in a moment.'

export type MagicLinkRequest =
  | { kind: 'ok'; email: string; next: string }
  | { kind: 'invalid'; error: string }
  | { kind: 'bot' }

export function validateMagicLinkRequest(body: {
  email?: unknown
  next?: unknown
  website?: unknown
}): MagicLinkRequest {
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return { kind: 'bot' }
  }
  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, EMAIL_MAX) : ''
  if (!email || !EMAIL_RE.test(email)) {
    return { kind: 'invalid', error: 'A valid email address is required.' }
  }
  return { kind: 'ok', email, next: safeRedirectPath(body.next) }
}

export function loginErrorFromQuery(error: string | null | undefined): string | null {
  return error === 'auth_failed' ? AUTH_FAILED_LOGIN_MESSAGE : null
}
