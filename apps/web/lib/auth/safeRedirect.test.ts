import { describe, expect, it } from 'vitest'
import { loginReturnPath } from './gatedIntent'
import { safeRedirectPath } from './safeRedirect'

const APP = 'https://platform.evolvedpros.com'

/** Same resolution /auth/callback uses after the sanitizer returns. */
function callbackLocation(next: string, base = APP): URL {
  return new URL(next, base)
}

describe('safeRedirectPath', () => {
  it('keeps same-origin relative paths, including query, hash, and dot segments', () => {
    expect(safeRedirectPath('/home')).toBe('/home')
    expect(safeRedirectPath('/events')).toBe('/events')
    expect(safeRedirectPath('/events?x=1')).toBe('/events?x=1')
    expect(safeRedirectPath('/events?x=1#section')).toBe('/events?x=1#section')
    expect(safeRedirectPath('/academy/foundation')).toBe('/academy/foundation')
    expect(safeRedirectPath('/foo/../events?x=1#h')).toBe('/events?x=1#h')
    expect(safeRedirectPath('/profile/me')).toBe('/profile/me')
    expect(safeRedirectPath('/@me')).toBe('/@me')
    expect(safeRedirectPath('/events?q=a\\b')).toBe('/events?q=a\\b')
  })

  it('resolves every accepted path on the platform origin', () => {
    for (const raw of ['/home', '/events?x=1#section', '/foo/../academy', '/events?q=a\\b']) {
      const next = safeRedirectPath(raw)
      expect(callbackLocation(next).origin).toBe(APP)
    }
  })

  it('falls back for absolute, protocol-relative, scheme, and backslash payloads', () => {
    const rejected = [
      'https://evil.com',
      'http://evil.com',
      '//evil.com',
      '/\\evil.com',
      '/\\/evil.com',
      '/\t/evil.com',
      '/\r//evil.com',
      '/\n//evil.com',
      'javascript:alert(1)',
      'data:text/html,hi',
      '',
    ]
    for (const raw of rejected) {
      expect(safeRedirectPath(raw), raw).toBe('/home')
    }
  })

  it('rejects dot-segment paths whose pathname is a protocol-relative host', () => {
    const rejected = [
      '/foo/..//evil.com',
      '/..//evil.com',
      '/foo/%2e%2e//evil.com',
      '/foo/..//evil.com/phish',
      '/foo/..//evil.com?x=1',
      '/foo/..//@evil.com',
      '/foo/..\\\\@evil.com',
      'https://safe-redirect.invalid//evil.com',
      'https://safe-redirect.invalid/\\@evil.com',
    ]
    for (const raw of rejected) {
      const next = safeRedirectPath(raw)
      expect(next, raw).toBe('/home')
      expect(callbackLocation(next).href).toBe(`${APP}/home`)
    }
  })

  it('uses the caller fallback and refuses non-strings', () => {
    expect(safeRedirectPath('https://evil.com', '/pricing')).toBe('/pricing')
    expect(safeRedirectPath(undefined)).toBe('/home')
    expect(safeRedirectPath(null)).toBe('/home')
    expect(safeRedirectPath(['/events', 'https://evil.com'])).toBe('/home')
    expect(safeRedirectPath(1)).toBe('/home')
  })

  it('is the guard the signed-in login redirect uses', () => {
    expect(loginReturnPath('/foo/..//evil.com')).toBe('/home')
    expect(loginReturnPath(undefined, '/foo/%2e%2e//evil.com/phish')).toBe('/home')
    expect(loginReturnPath('/events?x=1')).toBe('/events?x=1')
  })
})
