/**
 * Password Create Account vs Sign In (QA-FUNNEL-1).
 *
 * LoginForm's heading/button already switch on ?mode=signup (loginCopy.ts),
 * but handlePassword always called signInWithPassword. A brand-new email
 * therefore got Supabase's "Invalid login credentials", humanized to
 * "That email and password don't match" — a sign-in error on a sign-up form.
 *
 * This module is the one branch: which auth method to call, how to read a
 * signUp result so an existing email cannot silently take over, and which
 * error copy to show. LoginForm stays a client shell — vitest only collects
 * lib/** (see vitest.config.ts).
 *
 * Do NOT fall through from a failed/ambiguous signUp to signInWithPassword.
 * That is how an existing member's password on this form would sign them in
 * (or, with a guessed password, look like the old "don't match" bug).
 */

import type { LoginMode } from './loginCopy'

export type PasswordAuthMethod = 'signUp' | 'signInWithPassword'

/** Existing-user on the Create Account form. Never a silent sign-in. */
export const EMAIL_ALREADY_REGISTERED =
  'An account with that email already exists. Sign in or use a magic link.'

export const SIGNUP_CONFIRM_EMAIL =
  'Confirm your email to finish creating your account — check your inbox.'

export function passwordAuthMethodFor(mode: LoginMode): PasswordAuthMethod {
  return mode === 'signup' ? 'signUp' : 'signInWithPassword'
}

export type SignUpOutcome = 'signedIn' | 'confirmEmail' | 'emailTaken' | 'failed'

/** The fields of a supabase.auth.signUp() payload this branch actually reads. */
export interface SignUpResultShape {
  user: { identities?: unknown[] | null } | null
  session: { access_token?: string } | null
}

/**
 * Read a successful (error-null) supabase.auth.signUp() payload.
 *
 * Supabase's anti-enumeration path returns a user with empty identities and
 * no session when the email is already registered. Treat that as emailTaken.
 * A real new user with email confirmation on has identities and no session.
 * A real new user with confirmation off has a session.
 */
export function interpretSignUpResult(data: SignUpResultShape): SignUpOutcome {
  if (data.session) return 'signedIn'
  const identities = data.user?.identities
  if (data.user && Array.isArray(identities) && identities.length === 0) {
    return 'emailTaken'
  }
  if (data.user) return 'confirmEmail'
  return 'failed'
}

export function isExistingAccountSignUpError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    (m.includes('already') && m.includes('register')) ||
    m.includes('user already exists') ||
    m.includes('email already')
  )
}

/** Map raw Supabase auth errors into copy that doesn't sound like a stack trace. */
export function humanizeAuthError(message: string, mode: LoginMode = 'signin'): string {
  if (mode === 'signup' && isExistingAccountSignUpError(message)) {
    return EMAIL_ALREADY_REGISTERED
  }
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials') || m.includes('invalid email or password')) {
    return "That email and password don't match. Try again or use a magic link."
  }
  if (m.includes('email not confirmed')) {
    return 'Confirm your email first — check your inbox for the verification link.'
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Too many attempts. Wait a minute and try again.'
  }
  return message
}
