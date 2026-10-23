import { afterEach, describe, expect, it } from 'vitest'
import {
  AUTH_ORIGIN,
  authCallbackUrl,
  authRedirectBase,
  magicLinkCallbackUrl,
  resolveAuthOrigin,
} from './authOrigin'

const KEYS = ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_SITE_URL'] as const

afterEach(() => {
  for (const key of KEYS) delete process.env[key]
})

describe('resolveAuthOrigin', () => {
  it('canonicalizes platform, apex, and www to the platform conversion host', () => {
    expect(AUTH_ORIGIN).toBe('https://platform.evolvedpros.com')
    expect(resolveAuthOrigin('https://platform.evolvedpros.com')).toBe(AUTH_ORIGIN)
    expect(resolveAuthOrigin('https://platform.evolvedpros.com/')).toBe(AUTH_ORIGIN)
    expect(resolveAuthOrigin('https://evolvedpros.com')).toBe(AUTH_ORIGIN)
    expect(resolveAuthOrigin('https://www.evolvedpros.com')).toBe(AUTH_ORIGIN)
    expect(resolveAuthOrigin('www.evolvedpros.com')).toBe(AUTH_ORIGIN)
  })

  it('canonicalizes other evolvedpros.com hosts, including media', () => {
    expect(resolveAuthOrigin('https://media.evolvedpros.com')).toBe(AUTH_ORIGIN)
  })

  it('keeps loopback for next dev and canonicalizes the public Railway host', () => {
    expect(resolveAuthOrigin('http://localhost:3000')).toBe('http://localhost:3000')
    expect(resolveAuthOrigin('http://127.0.0.1:3000')).toBe('http://127.0.0.1:3000')
    expect(resolveAuthOrigin('http://[::1]:3000')).toBe('http://[::1]:3000')
    expect(resolveAuthOrigin('https://web-production-db912.up.railway.app')).toBe(AUTH_ORIGIN)
  })

  it('falls back to platform for hosts that are not brand or loopback', () => {
    expect(resolveAuthOrigin('https://evil.com')).toBe(AUTH_ORIGIN)
    expect(resolveAuthOrigin('https://platform.evolvedpros.com.evil.com')).toBe(AUTH_ORIGIN)
    expect(resolveAuthOrigin('https://localhost.evil.com')).toBe(AUTH_ORIGIN)
    expect(resolveAuthOrigin('https://127.0.0.1.evil.com')).toBe(AUTH_ORIGIN)
    expect(resolveAuthOrigin('https://notevolvedpros.com')).toBe(AUTH_ORIGIN)
    expect(resolveAuthOrigin('javascript://evil.com')).toBe(AUTH_ORIGIN)
    expect(resolveAuthOrigin('https://user:pass@evil.com')).toBe(AUTH_ORIGIN)
    expect(resolveAuthOrigin('http://evil.com@localhost')).toBe('http://localhost')
  })

  it('falls back to platform when both env values are blank', () => {
    expect(resolveAuthOrigin(undefined, undefined)).toBe(AUTH_ORIGIN)
    expect(resolveAuthOrigin('  ', '')).toBe(AUTH_ORIGIN)
  })

  it('prefers APP_URL over SITE_URL, then canonicalizes', () => {
    expect(
      resolveAuthOrigin('https://platform.evolvedpros.com', 'http://localhost:3000'),
    ).toBe(AUTH_ORIGIN)
  })
})

describe('authRedirectBase', () => {
  it('does not let a forged X-Forwarded-Host choose the callback Location', () => {
    const base = authRedirectBase('evil.com', 'https', 'platform.evolvedpros.com')
    expect(base).toBe(AUTH_ORIGIN)
    expect(new URL('/home', base).href).toBe(`${AUTH_ORIGIN}/home`)
    expect(new URL('/login?error=auth_failed', base).href).toBe(
      `${AUTH_ORIGIN}/login?error=auth_failed`,
    )
  })

  it('ignores a scheme smuggled in X-Forwarded-Proto and a second forwarded host', () => {
    expect(authRedirectBase('localhost:3000', 'https://evil.com#', null)).toBe(
      'https://localhost:3000',
    )
    expect(authRedirectBase('evil.com, platform.evolvedpros.com', 'https', null)).toBe(
      AUTH_ORIGIN,
    )
    expect(authRedirectBase('platform.evolvedpros.com, evil.com', 'http, https', null)).toBe(
      AUTH_ORIGIN,
    )
  })

  it('keeps a local dev host when that is the forwarded host', () => {
    expect(authRedirectBase('localhost:3000', 'http', 'evil.com')).toBe('http://localhost:3000')
  })
})

describe('authCallbackUrl', () => {
  it('is always platform in production and never names www', () => {
    const url = authCallbackUrl('/home', AUTH_ORIGIN)
    expect(url).toBe('https://platform.evolvedpros.com/auth/callback?next=%2Fhome')
    expect(url).not.toContain('www.evolvedpros.com')
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
    expect(url).not.toContain('www.evolvedpros.com')
  })
})
