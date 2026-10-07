import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, it, expect, beforeAll } from 'vitest'
import { GUEST_TOKEN_MAX_LENGTH, mintGuestToken, verifyGuestToken } from './token'

beforeAll(() => {
  process.env.GUEST_TOKEN_SECRET = 'test-secret-for-guest-tokens'
})

/** The credential an empty HMAC key used to accept. */
function emptyKeyForgery(): string {
  const id = 'aaaaaaaaaaaaaaaaaaaaaaaa'
  const sig = createHmac('sha256', '')
    .update(id)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
    .slice(0, 24)
  return `${id}.${sig}`
}

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

  it('rejects oversized tokens before hashing them', () => {
    const token = mintGuestToken()
    expect(token.length).toBe(GUEST_TOKEN_MAX_LENGTH)
    expect(verifyGuestToken(token)).toBe(true)
    expect(verifyGuestToken(`${token}x`)).toBe(false)
    expect(verifyGuestToken('a'.repeat(10_000))).toBe(false)
  })

  it('mints unique tokens', () => {
    const a = mintGuestToken()
    const b = mintGuestToken()
    expect(a).not.toBe(b)
  })
})

describe('guest token secret fail-closed', () => {
  let savedGuest: string | undefined
  let savedService: string | undefined

  beforeEach(() => {
    savedGuest = process.env.GUEST_TOKEN_SECRET
    savedService = process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  afterEach(() => {
    if (savedGuest === undefined) delete process.env.GUEST_TOKEN_SECRET
    else process.env.GUEST_TOKEN_SECRET = savedGuest
    if (savedService === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
    else process.env.SUPABASE_SERVICE_ROLE_KEY = savedService
  })

  it('rejects an empty-key forgery when both secrets are blank', () => {
    delete process.env.GUEST_TOKEN_SECRET
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    expect(verifyGuestToken(emptyKeyForgery())).toBe(false)
    expect(() => mintGuestToken()).toThrow(/Refusing to mint guest tokens/)
  })

  it('treats whitespace-only secrets as unset', () => {
    process.env.GUEST_TOKEN_SECRET = '   '
    process.env.SUPABASE_SERVICE_ROLE_KEY = '\n'
    expect(verifyGuestToken(emptyKeyForgery())).toBe(false)
    expect(() => mintGuestToken()).toThrow(/Refusing to mint guest tokens/)
  })

  it('keeps the service-role fallback when the guest secret is unset', () => {
    delete process.env.GUEST_TOKEN_SECRET
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key'
    const token = mintGuestToken()
    expect(verifyGuestToken(token)).toBe(true)
    expect(verifyGuestToken(emptyKeyForgery())).toBe(false)
  })

  it('does not verify a guest-secret token against the service-role fallback', () => {
    process.env.GUEST_TOKEN_SECRET = 'guest-secret'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key'
    const token = mintGuestToken()
    delete process.env.GUEST_TOKEN_SECRET
    expect(verifyGuestToken(token)).toBe(false)
  })

  it('mints the invite token before any guest write and returns 500 when unset', () => {
    const route = readFileSync(
      resolve(__dirname, '../../app/api/admin/guests/route.ts'),
      'utf8',
    )
    const mintAt = route.indexOf('mintGuestToken()')
    const insertAt = route.indexOf('.insert(')
    expect(mintAt).toBeGreaterThan(-1)
    expect(insertAt).toBeGreaterThan(mintAt)
    expect(route).toContain('Guest invite tokens are not configured.')

    const lib = readFileSync(resolve(__dirname, 'token.ts'), 'utf8')
    expect(lib).toContain('SUPABASE_SERVICE_ROLE_KEY')
    expect(lib).not.toContain("|| ''")
    expect(lib).toContain('if (!expected) return false')
  })
})
