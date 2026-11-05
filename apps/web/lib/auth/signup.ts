/**
 * Password signup confirmation (incognito / second-browser).
 *
 * LoginForm used to call supabase.auth.signUp() in the browser. @supabase/ssr
 * uses PKCE, so the confirmation email is a verify URL whose code can be
 * exchanged only in the browser that stored the code-verifier cookie.
 * Opening that link in a fresh window (no session) makes GoTrue redirect to
 * /auth/callback?error=access_denied, and the account is never confirmed.
 *
 * POST /api/auth/signup uses admin.generateLink (no email of its own) and
 * Resend sends a token_hash URL. /auth/callback verifyOtp's that hash with
 * no verifier cookie, same as /api/auth/magic-link.
 */

import { magicLinkCallbackUrl } from './authOrigin'
import { isExistingAccountSignUpError } from './passwordAuth'
import { safeRedirectPath } from './safeRedirect'

const EMAIL_MAX = 320
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
/** Supabase Auth's default minimum and the GoTrue password column limit. */
const PASSWORD_MIN = 6
const PASSWORD_MAX = 72

export const SIGNUP_SEND_FAILED =
  'Could not create that account. Try again or use a magic link.'

export const SIGNUP_ALREADY_REGISTERED = 'already_registered'

export type SignupRequest =
  | { kind: 'ok'; email: string; password: string; next: string }
  | { kind: 'invalid'; error: string }
  | { kind: 'bot' }

export function validateSignupRequest(body: {
  email?: unknown
  password?: unknown
  next?: unknown
  website?: unknown
}): SignupRequest {
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return { kind: 'bot' }
  }
  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, EMAIL_MAX) : ''
  if (!email || !EMAIL_RE.test(email)) {
    return { kind: 'invalid', error: 'A valid email address is required.' }
  }
  const password = typeof body.password === 'string' ? body.password : ''
  if (password.length < PASSWORD_MIN) {
    return { kind: 'invalid', error: 'Password must be at least 6 characters.' }
  }
  if (password.length > PASSWORD_MAX) {
    return { kind: 'invalid', error: 'Password must be at most 72 characters.' }
  }
  return { kind: 'ok', email, password, next: safeRedirectPath(body.next) }
}

/**
 * Confirmation URL for a generateLink hashed_token. Not a Supabase
 * /auth/v1/verify link and not a PKCE ?code= exchange.
 */
export function signupConfirmUrl(tokenHash: string, next: unknown): string {
  return magicLinkCallbackUrl(tokenHash, 'signup', next)
}

export function signupLinkFailureCode(
  message: string | undefined,
): 'already_registered' | 'failed' {
  if (message && isExistingAccountSignUpError(message)) return 'already_registered'
  return 'failed'
}
