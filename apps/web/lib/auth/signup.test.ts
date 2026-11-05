import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  signupConfirmUrl,
  signupLinkFailureCode,
  validateSignupRequest,
} from './signup'

const here = dirname(fileURLToPath(import.meta.url))

describe('validateSignupRequest', () => {
  it('normalizes email and keeps the password', () => {
    expect(
      validateSignupRequest({ email: 'Dana@Northgate.Example ', password: 'correct-horse' }),
    ).toEqual({
      kind: 'ok',
      email: 'dana@northgate.example',
      password: 'correct-horse',
      next: '/home',
    })
  })

  it('keeps a safe next path and drops an off-origin one', () => {
    expect(
      validateSignupRequest({ email: 'a@b.co', password: 'secret1', next: '/events' }),
    ).toMatchObject({ next: '/events' })
    expect(
      validateSignupRequest({
        email: 'a@b.co',
        password: 'secret1',
        next: 'https://evil.example',
      }),
    ).toMatchObject({ next: '/home' })
  })

  it('flags a honeypot and rejects a bad email or a short password', () => {
    expect(
      validateSignupRequest({ email: 'a@b.co', password: 'secret1', website: 'spam' }).kind,
    ).toBe('bot')
    expect(validateSignupRequest({ email: 'nope', password: 'secret1' }).kind).toBe('invalid')
    expect(validateSignupRequest({ email: 'a@b.co', password: 'short' }).kind).toBe('invalid')
  })
})

describe('signupConfirmUrl', () => {
  it('is a token_hash callback, not a PKCE verify URL', () => {
    const url = new URL(signupConfirmUrl('abc.def', '/onboarding'))
    expect(url.origin).toBe('https://platform.evolvedpros.com')
    expect(url.pathname).toBe('/auth/callback')
    expect(url.searchParams.get('token_hash')).toBe('abc.def')
    expect(url.searchParams.get('type')).toBe('signup')
    expect(url.searchParams.get('next')).toBe('/onboarding')
    expect(url.href).not.toContain('/auth/v1/verify')
    expect(url.searchParams.get('code')).toBeNull()
  })
})

describe('signupLinkFailureCode', () => {
  it('maps an existing account and fails closed otherwise', () => {
    expect(signupLinkFailureCode('User already registered')).toBe('already_registered')
    expect(signupLinkFailureCode('A user with this email address has already been registered')).toBe(
      'already_registered',
    )
    expect(signupLinkFailureCode('Password should be at least 6 characters')).toBe('failed')
    expect(signupLinkFailureCode(undefined)).toBe('failed')
  })
})

describe('signup route', () => {
  const route = readFileSync(resolve(here, '../../app/api/auth/signup/route.ts'), 'utf8')

  it('mints a signup token_hash link and does not call browser signUp', () => {
    expect(route).toContain("type: 'signup'")
    expect(route).toContain('signupConfirmUrl')
    expect(route).toContain("kind: 'signup'")
    expect(route).not.toContain('.signUp(')
    expect(route).not.toContain('exchangeCodeForSession')
  })
})
