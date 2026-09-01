import { describe, expect, it } from 'vitest'
import {
  EMAIL_ALREADY_REGISTERED,
  humanizeAuthError,
  interpretSignUpResult,
  isExistingAccountSignUpError,
  passwordAuthMethodFor,
} from './passwordAuth'
import { resolveLoginMode } from './loginCopy'

describe('passwordAuthMethodFor', () => {
  it('calls signUp only in signup mode — never signInWithPassword', () => {
    expect(passwordAuthMethodFor('signup')).toBe('signUp')
    expect(passwordAuthMethodFor('signin')).toBe('signInWithPassword')
  })

  it('ties the method to the same ?mode= resolver the form and <title> use', () => {
    expect(passwordAuthMethodFor(resolveLoginMode('signup'))).toBe('signUp')
    expect(passwordAuthMethodFor(resolveLoginMode(undefined))).toBe('signInWithPassword')
    expect(passwordAuthMethodFor(resolveLoginMode('Signup'))).toBe('signInWithPassword')
    expect(passwordAuthMethodFor(resolveLoginMode(['signup']))).toBe('signUp')
  })
})

describe('interpretSignUpResult', () => {
  it('treats a session as a new user who is already signed in', () => {
    expect(
      interpretSignUpResult({
        user: { identities: [{ id: 'new' }] },
        session: { access_token: 'tok' },
      }),
    ).toBe('signedIn')
  })

  it('treats empty identities as an existing email — no silent takeover', () => {
    expect(
      interpretSignUpResult({
        user: { identities: [] },
        session: null,
      }),
    ).toBe('emailTaken')
  })

  it('does not treat a session + empty identities as emailTaken', () => {
    // If a session is present the user is signed in. Identity arrays are
    // irrelevant; falling through to emailTaken would bounce a successful
    // signup into an error.
    expect(
      interpretSignUpResult({
        user: { identities: [] },
        session: { access_token: 'tok' },
      }),
    ).toBe('signedIn')
  })

  it('asks a new user with identities and no session to confirm email', () => {
    expect(
      interpretSignUpResult({
        user: { identities: [{ provider: 'email' }] },
        session: null,
      }),
    ).toBe('confirmEmail')
  })

  it('fails closed when signUp returns neither user nor session', () => {
    expect(interpretSignUpResult({ user: null, session: null })).toBe('failed')
  })
})

describe('existing-account errors stay a signup error, not a login miss', () => {
  it('recognises the Supabase "already registered" family', () => {
    expect(isExistingAccountSignUpError('User already registered')).toBe(true)
    expect(isExistingAccountSignUpError('A user with this email address has already been registered')).toBe(true)
    expect(isExistingAccountSignUpError('User already exists')).toBe(true)
    expect(isExistingAccountSignUpError('Invalid login credentials')).toBe(false)
  })

  it('humanizes signup duplicates to the email-taken copy', () => {
    expect(humanizeAuthError('User already registered', 'signup')).toBe(EMAIL_ALREADY_REGISTERED)
    expect(humanizeAuthError('User already registered', 'signin')).toBe('User already registered')
  })

  it('keeps the shipped sign-in miss copy on the sign-in path only', () => {
    expect(humanizeAuthError('Invalid login credentials', 'signin')).toBe(
      "That email and password don't match. Try again or use a magic link.",
    )
    expect(humanizeAuthError('Invalid login credentials', 'signup')).toBe(
      "That email and password don't match. Try again or use a magic link.",
    )
  })
})
