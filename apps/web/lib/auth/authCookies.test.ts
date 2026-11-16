import { describe, expect, it } from 'vitest'
import { AUTH_COOKIE_DOMAIN, authCookieDomain, authCookieOptions } from './authCookies'

describe('authCookieOptions', () => {
  it('sets the parent domain on production brand hosts', () => {
    for (const host of [
      'www.evolvedpros.com',
      'platform.evolvedpros.com',
      'evolvedpros.com',
      'media.evolvedpros.com',
      'WWW.EVOLVEDPROS.COM',
      'www.evolvedpros.com:443',
    ]) {
      const options = authCookieOptions(host)
      expect(options.domain, host).toBe(AUTH_COOKIE_DOMAIN)
      expect(options.path).toBe('/')
      expect(options.sameSite).toBe('lax')
      expect(options.secure, host).toBe(true)
      expect(authCookieDomain(host)).toBe(AUTH_COOKIE_DOMAIN)
    }
  })

  it('omits Domain on localhost', () => {
    for (const host of ['localhost', 'localhost:3000', '127.0.0.1:3000', '[::1]:3000']) {
      const options = authCookieOptions(host)
      expect(options, host).not.toHaveProperty('domain')
      expect(authCookieDomain(host)).toBeUndefined()
      expect(options.secure, host).toBe(false)
      expect(options.path).toBe('/')
    }
  })

  it('omits Domain on preview hosts', () => {
    for (const host of [
      'pr-42.up.railway.app',
      'web-production-db912.up.railway.app',
      'evolved-pros-git-preview.vercel.app',
      'my-app.vercel.app',
    ]) {
      const options = authCookieOptions(host)
      expect(options, host).not.toHaveProperty('domain')
      expect(authCookieDomain(host)).toBeUndefined()
      expect(options.secure, host).toBe(true)
    }
  })

  it('omits Domain when the host is missing or not ours', () => {
    for (const host of [
      null,
      undefined,
      '',
      'evil.com',
      'platform.evolvedpros.com.evil.com',
      'notevolvedpros.com',
      'localhost.evil.com',
    ]) {
      const options = authCookieOptions(host)
      expect(options).not.toHaveProperty('domain')
      expect(options.domain).toBeUndefined()
    }
  })

  it('uses the first forwarded host and ignores a second one', () => {
    expect(authCookieOptions('www.evolvedpros.com, evil.com').domain).toBe(AUTH_COOKIE_DOMAIN)
    expect(authCookieOptions('evil.com, www.evolvedpros.com')).not.toHaveProperty('domain')
  })
})
