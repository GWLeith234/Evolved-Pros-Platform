import { afterEach, describe, expect, it } from 'vitest'
import {
  AUTH_ORIGIN,
  authCallbackUrl,
  authRedirectBase,
  magicLinkCallbackUrl,
  resolveAuthOrigin,
  safeAuthNext,
} from './authOrigin'

const KEYS = ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_SITE_URL'] as const

afterEach(() => {
  for (const key of KEYS) delete process.env[key]
})

describe('resolveAuthOrigin', () => {
  it('canonicalizes platform, apex, and www to www', () => {
    expect(AUTH_ORIGIN).toBe('https://www.evolvedpros.com')
    expect(resolveAuthOrigin('https://platform.evolvedpros.com')).toBe(AUTH_ORIGIN)
    expect(resolveAuthOrigin('https://platform.evolvedpros.com/')).toBe(AUTH_ORIGIN)
    expect(resolveAuthOrigin('https://evolvedpros.com')).toBe(AUTH_ORIGIN)
    expect(resolveAuthOrigin('https://www.evolvedpros.com')).toBe(AUTH_ORIGIN)
    expect(resolveAuthOrigin('www.evolvedpros.com')).toBe(AUTH_ORIGIN)
  })

  it('canonicalizes other evolvedpros.com hosts, including media', () => {
    expect(resolveAuthOrigin('https://media.evolvedpros.com')).toBe(AUTH_ORIGIN)
  })

  it('keeps loopback and configured preview hosts, and canonicalizes the public Railway host', () => {
    expect(resolveAuthOrigin('http://localhost:3000')).toBe('http://localhost:3000')
    expect(resolveAuthOrigin('http://127.0.0.1:3000')).toBe('http://127.0.0.1:3000')
    expect(resolveAuthOrigin('http://[::1]:3000')).toBe('http://[::1]:3000')
    expect(resolveAuthOrigin('https://pr-42.up.railway.app')).toBe('https://pr-42.up.railway.app')
    expect(resolveAuthOrigin('https://evolved-pros-git-preview.vercel.app')).toBe(
      'https://evolved-pros-git-preview.vercel.app',
    )
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
    expect(resolveAuthOrigin('http://evil.com@localhost')).toBe(AUTH_ORIGIN)
    expect(resolveAuthOrigin('https://user:pass@www.evolvedpros.com')).toBe(AUTH_ORIGIN)
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

  it('sends a platform request to www instead of echoing the request host', () => {
    expect(authRedirectBase('platform.evolvedpros.com', 'https', 'platform.evolvedpros.com')).toBe(
      AUTH_ORIGIN,
    )
    expect(authRedirectBase('www.evolvedpros.com', 'https', null)).toBe(AUTH_ORIGIN)
    expect(authRedirectBase('web-production-db912.up.railway.app', 'https', null)).toBe(
      AUTH_ORIGIN,
    )
  })

  it('keeps a preview host only when it is the configured app URL', () => {
    expect(
      authRedirectBase('pr-42.up.railway.app', 'https', null, 'https://pr-42.up.railway.app'),
    ).toBe('https://pr-42.up.railway.app')
    expect(
      authRedirectBase('evil.up.railway.app', 'https', null, 'https://pr-42.up.railway.app'),
    ).toBe(AUTH_ORIGIN)
    expect(authRedirectBase('pr-42.up.railway.app', 'https', null, 'https://www.evolvedpros.com')).toBe(
      AUTH_ORIGIN,
    )
  })
})

describe('authCallbackUrl', () => {
  it('is always www in production, including when APP_URL is platform', () => {
    const url = authCallbackUrl('/home', AUTH_ORIGIN)
    expect(url).toBe('https://www.evolvedpros.com/auth/callback?next=%2Fhome')
    expect(url).not.toContain('platform.evolvedpros.com')
    process.env.NEXT_PUBLIC_APP_URL = 'https://platform.evolvedpros.com'
    expect(authCallbackUrl('/home')).toBe(
      'https://www.evolvedpros.com/auth/callback?next=%2Fhome',
    )
  })

  it('keeps a relative next path', () => {
    expect(authCallbackUrl('/events?x=1', AUTH_ORIGIN)).toContain(
      'next=%2Fevents%3Fx%3D1',
    )
    expect(safeAuthNext('/events?x=1')).toBe('/events?x=1')
  })

  it('allows an evolvedpros.com absolute next only as a path on www', () => {
    const fromPlatform = new URL(
      authCallbackUrl('https://platform.evolvedpros.com/events?x=1', AUTH_ORIGIN),
    )
    expect(fromPlatform.origin).toBe(AUTH_ORIGIN)
    expect(fromPlatform.searchParams.get('next')).toBe('/events?x=1')

    const fromWww = new URL(
      authCallbackUrl('https://www.evolvedpros.com/academy/foundation#start', AUTH_ORIGIN),
    )
    expect(fromWww.origin).toBe(AUTH_ORIGIN)
    expect(fromWww.searchParams.get('next')).toBe('/academy/foundation#start')
    expect(safeAuthNext('https://evolvedpros.com/home')).toBe('/home')
  })

  it('rejects external hosts, protocol-relative URLs, and script schemes', () => {
    const rejected = [
      'https://evil.com',
      'https://evil.com/home',
      'http://evil.com',
      '//evil.com',
      '///evil.com',
      '//www.evolvedpros.com/home',
      'javascript:alert(1)',
      'javascript://evil.com/%0aalert(1)',
      'data:text/html,hi',
      'vbscript:msgbox(1)',
      '/\\evil.com',
      '/\t/evil.com',
      '/\r//evil.com',
      'https://platform.evolvedpros.com.evil.com/home',
      'https://notevolvedpros.com/home',
      'https://user:pass@www.evolvedpros.com/home',
      'https://www.evolvedpros.com@evil.com/home',
      'http://localhost:3000/admin',
      'https://pr-42.up.railway.app/home',
      '/foo/..//evil.com',
      '/foo/%2e%2e//evil.com',
    ]
    for (const next of rejected) {
      const parsed = new URL(authCallbackUrl(next, AUTH_ORIGIN))
      expect(parsed.origin, next).toBe(AUTH_ORIGIN)
      expect(parsed.searchParams.get('next'), next).toBe('/home')
      expect(parsed.href, next).not.toContain('evil.com')
      expect(safeAuthNext(next), next).toBe('/home')
    }
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
    expect(parsed.origin).toBe('https://www.evolvedpros.com')
    expect(url).not.toContain('platform.evolvedpros.com')
  })

  it('does not put an external next on the emailed link', () => {
    const url = magicLinkCallbackUrl('abc.def', 'magiclink', 'javascript:alert(1)', AUTH_ORIGIN)
    const parsed = new URL(url)
    expect(parsed.origin).toBe(AUTH_ORIGIN)
    expect(parsed.searchParams.get('next')).toBe('/home')
    expect(url).not.toContain('javascript')
  })
})
