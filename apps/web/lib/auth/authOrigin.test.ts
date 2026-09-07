import { afterEach, describe, expect, it } from 'vitest'
import {
  AUTH_ORIGIN,
  authCallbackUrl,
  magicLinkCallbackUrl,
  resolveAuthOrigin,
} from './authOrigin'

const KEYS = ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_SITE_URL'] as const

afterEach(() => {
  for (const key of KEYS) delete process.env[key]
})

describe('resolveAuthOrigin', () => {
  it('canonicalizes platform, apex, and www to the www brand host', () => {
    expect(resolveAuthOrigin('https://platform.evolvedpros.com')).toBe(AUTH_ORIGIN)
    expect(resolveAuthOrigin('https://platform.evolvedpros.com/')).toBe(AUTH_ORIGIN)
    expect(resolveAuthOrigin('https://evolvedpros.com')).toBe(AUTH_ORIGIN)
    expect(resolveAuthOrigin('https://www.evolvedpros.com')).toBe(AUTH_ORIGIN)
    expect(resolveAuthOrigin('www.evolvedpros.com')).toBe(AUTH_ORIGIN)
  })

  it('canonicalizes other evolvedpros.com hosts, including media', () => {
    expect(resolveAuthOrigin('https://media.evolvedpros.com')).toBe(AUTH_ORIGIN)
  })

  it('keeps localhost for next dev and canonicalizes the public Railway host', () => {
    expect(resolveAuthOrigin('http://localhost:3000')).toBe('http://localhost:3000')
    expect(resolveAuthOrigin('https://web-production-db912.up.railway.app')).toBe(AUTH_ORIGIN)
  })

  it('falls back to www when both env values are blank', () => {
    expect(resolveAuthOrigin(undefined, undefined)).toBe(AUTH_ORIGIN)
    expect(resolveAuthOrigin('  ', '')).toBe(AUTH_ORIGIN)
  })

  it('prefers APP_URL over SITE_URL, then canonicalizes', () => {
    expect(
      resolveAuthOrigin('https://platform.evolvedpros.com', 'http://localhost:3000'),
    ).toBe(AUTH_ORIGIN)
  })
})

describe('authCallbackUrl', () => {
  it('is always www in production and never names platform', () => {
    const url = authCallbackUrl('/home', AUTH_ORIGIN)
    expect(url).toBe('https://www.evolvedpros.com/auth/callback?next=%2Fhome')
    expect(url).not.toContain('platform.evolvedpros.com')
  })

  it('sanitizes next the same way the callback does', () => {
    expect(authCallbackUrl('https://evil.com', AUTH_ORIGIN)).toContain('next=%2Fhome')
    expect(authCallbackUrl('/events?x=1', AUTH_ORIGIN)).toContain(
      'next=%2Fevents%3Fx%3D1',
    )
  })
})

describe('magicLinkCallbackUrl', () => {
  it('uses token_hash + type, not a PKCE verify URL', () => {
    const url = magicLinkCallbackUrl('abc.def', 'magiclink', '/home', AUTH_ORIGIN)
    const parsed = new URL(url)
    expect(parsed.origin).toBe(AUTH_ORIGIN)
    expect(parsed.pathname).toBe('/auth/callback')
    expect(parsed.searchParams.get('token_hash')).toBe('abc.def')
    expect(parsed.searchParams.get('type')).toBe('magiclink')
    expect(parsed.searchParams.get('next')).toBe('/home')
    expect(url).not.toContain('token=pkce_')
    expect(url).not.toContain('platform.evolvedpros.com')
  })
})
