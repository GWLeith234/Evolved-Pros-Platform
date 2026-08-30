import { describe, expect, it } from 'vitest'
import { LOGIN_COPY, loginCopyFor, resolveLoginMode } from './loginCopy'

describe('resolveLoginMode', () => {
  it('opts into signup only for the literal ?mode=signup', () => {
    expect(resolveLoginMode('signup')).toBe('signup')
  })

  it('defaults to signin when the param is absent or empty', () => {
    expect(resolveLoginMode(undefined)).toBe('signin')
    expect(resolveLoginMode(null)).toBe('signin')
    expect(resolveLoginMode('')).toBe('signin')
  })

  it('defaults to signin for anything that is not exactly "signup"', () => {
    for (const raw of ['Signup', 'SIGNUP', 'sign-up', 'signin', 'register', ' signup']) {
      expect(resolveLoginMode(raw)).toBe('signin')
    }
  })

  it('reads the first value when Next hands over a repeated param as string[]', () => {
    expect(resolveLoginMode(['signup'])).toBe('signup')
    expect(resolveLoginMode(['signup', 'signin'])).toBe('signup')
    expect(resolveLoginMode(['signin', 'signup'])).toBe('signin')
    expect(resolveLoginMode([])).toBe('signin')
  })
})

describe('LOGIN_COPY', () => {
  it('keeps the shipped sign-in copy byte-for-byte', () => {
    expect(LOGIN_COPY.signin).toEqual({
      heading: 'Welcome back.',
      submit: 'Sign In →',
      metaTitle: 'Sign In — Evolved Pros',
    })
  })

  it('tells a /join arrival to create an account, not to sign in', () => {
    expect(LOGIN_COPY.signup.heading).toBe('Create account')
    expect(LOGIN_COPY.signup.submit).toBe('Create account →')
  })

  it('gives each mode its own <title> so /join does not read "Sign In"', () => {
    expect(LOGIN_COPY.signup.metaTitle).not.toBe(LOGIN_COPY.signin.metaTitle)
    for (const mode of ['signin', 'signup'] as const) {
      expect(LOGIN_COPY[mode].metaTitle.endsWith(' — Evolved Pros')).toBe(true)
    }
  })
})

describe('loginCopyFor', () => {
  it('maps the raw ?mode= value straight to a copy block', () => {
    expect(loginCopyFor('signup')).toBe(LOGIN_COPY.signup)
    expect(loginCopyFor(['signup'])).toBe(LOGIN_COPY.signup)
    expect(loginCopyFor(undefined)).toBe(LOGIN_COPY.signin)
    expect(loginCopyFor('anything-else')).toBe(LOGIN_COPY.signin)
  })
})
