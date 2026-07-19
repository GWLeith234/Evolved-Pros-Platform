import { describe, it, expect, beforeAll } from 'vitest'
import { mintGuestToken, verifyGuestToken } from './token'

beforeAll(() => {
  process.env.GUEST_TOKEN_SECRET = 'test-secret-for-guest-tokens'
})

describe('guest token signing', () => {
  it('mints a token that verifies', () => {
    const t = mintGuestToken()
    expect(t).toContain('.')
    expect(verifyGuestToken(t)).toBe(true)
  })

  it('rejects tampered tokens', () => {
    const t = mintGuestToken()
    const [id] = t.split('.')
    expect(verifyGuestToken(`${id}.deadbeefdeadbeefdeadbeef`)).toBe(false)
    expect(verifyGuestToken(`${id}xyz.${t.split('.')[1]}`)).toBe(false)
  })

  it('rejects garbage / empty', () => {
    expect(verifyGuestToken('')).toBe(false)
    expect(verifyGuestToken(null)).toBe(false)
    expect(verifyGuestToken('not-a-token')).toBe(false)
    expect(verifyGuestToken('a.b.c')).toBe(false)
  })

  it('mints unique tokens', () => {
    const a = mintGuestToken()
    const b = mintGuestToken()
    expect(a).not.toBe(b)
  })
})
