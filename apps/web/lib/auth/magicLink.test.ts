import { describe, expect, it } from 'vitest'
import {
  AUTH_FAILED_LOGIN_MESSAGE,
  loginErrorFromQuery,
  validateMagicLinkRequest,
} from './magicLink'

describe('validateMagicLinkRequest', () => {
  it('normalizes email and defaults next to /home', () => {
    expect(validateMagicLinkRequest({ email: 'Dana@Northgate.Example ' })).toEqual({
      kind: 'ok',
      email: 'dana@northgate.example',
      next: '/home',
    })
  })

  it('keeps a safe next path and rejects off-origin ones', () => {
    expect(validateMagicLinkRequest({ email: 'a@b.co', next: '/events' })).toMatchObject({
      next: '/events',
    })
    expect(
      validateMagicLinkRequest({ email: 'a@b.co', next: 'https://evil.com' }),
    ).toMatchObject({ next: '/home' })
  })

  it('flags a honeypot and rejects a bad email', () => {
    expect(validateMagicLinkRequest({ email: 'a@b.co', website: 'http://spam' }).kind).toBe(
      'bot',
    )
    expect(validateMagicLinkRequest({ email: 'nope' }).kind).toBe('invalid')
  })
})

describe('loginErrorFromQuery', () => {
  it('explains auth_failed and ignores anything else', () => {
    expect(loginErrorFromQuery('auth_failed')).toBe(AUTH_FAILED_LOGIN_MESSAGE)
    expect(loginErrorFromQuery('other')).toBeNull()
    expect(loginErrorFromQuery(null)).toBeNull()
  })
})
