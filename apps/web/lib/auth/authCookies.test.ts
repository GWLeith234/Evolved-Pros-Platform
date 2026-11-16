import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { safeAuthNext } from './authOrigin'
import {
  STRAY_AUTH_COOKIE_DOMAIN,
  authCookieOptions,
  expireStaleAuthCookies,
  planPlatformSignInHop,
  signOutCookieHeaders,
  signOutCookiePlan,
} from './authCookies'

const REF = 'sb-abcdefghijklmnopqrst-auth-token'
const LEGACY = REF
const FRESH = `${REF}.0`
const CHUNK = `${REF}.1`
const VERIFIER = `${REF}-code-verifier`

describe('authCookieOptions', () => {
  it('sets no Domain on any host', () => {
    for (const host of [
      'www.evolvedpros.com',
      'platform.evolvedpros.com',
      'evolvedpros.com',
      'media.evolvedpros.com',
      'localhost:3000',
      '127.0.0.1:3000',
      '[::1]:3000',
      'pr-42.up.railway.app',
      'web-production-db912.up.railway.app',
      'my-app.vercel.app',
      'evil.com',
      null,
      undefined,
      '',
    ]) {
      const options = authCookieOptions(host)
      expect(options, String(host)).not.toHaveProperty('domain')
      expect(JSON.stringify(options), String(host)).not.toContain('Domain')
      expect(options.path).toBe('/')
      expect(options.sameSite).toBe('lax')
    }
  })

  it('is insecure only on loopback', () => {
    expect(authCookieOptions('localhost:3000').secure).toBe(false)
    expect(authCookieOptions('www.evolvedpros.com').secure).toBe(true)
    expect(authCookieOptions('pr-42.up.railway.app').secure).toBe(true)
  })
})

describe('dual-cookie cleanup', () => {
  it('expires the legacy host-only cookie and the stray Domain variant, and leaves the fresh cookie', () => {
    const settled = expireStaleAuthCookies({
      presentNames: [LEGACY, FRESH, 'theme'],
      freshNames: [FRESH],
    })

    expect(settled.hostOnly.map((cookie) => cookie.name)).toEqual([LEGACY])
    expect(settled.hostOnly.every((cookie) => cookie.maxAge === 0 && cookie.path === '/')).toBe(
      true,
    )
    expect(settled.hostOnly.every((cookie) => !('domain' in cookie))).toBe(true)

    expect(settled.domain.map((cookie) => cookie.name).sort()).toEqual([FRESH, LEGACY].sort())
    expect(settled.domain.every((cookie) => cookie.domain === STRAY_AUTH_COOKIE_DOMAIN)).toBe(true)
    expect(settled.domain.every((cookie) => cookie.maxAge === 0 && cookie.path === '/')).toBe(true)
    expect(settled.hostOnly.some((cookie) => cookie.name === FRESH)).toBe(false)

    const platform = planPlatformSignInHop({
      hostHeader: 'platform.evolvedpros.com',
      forwardedHost: null,
      pathname: '/auth/callback',
      search: '?token_hash=abc&type=magiclink&code=c&next=%2Fhome',
      cookieNames: [LEGACY, FRESH],
    })
    expect(platform?.status).toBe(308)
    expect(new URL(platform!.location).hostname).toBe('www.evolvedpros.com')
    expect(platform!.clear.some((cookie) => cookie.name === LEGACY)).toBe(true)
    expect(platform!.clear.some((cookie) => cookie.name === FRESH)).toBe(true)
    expect(platform!.clear.every((cookie) => !('domain' in cookie))).toBe(true)

    const again = planPlatformSignInHop({
      hostHeader: 'www.evolvedpros.com',
      forwardedHost: 'platform.evolvedpros.com',
      pathname: '/auth/callback',
      search: '?token_hash=abc&type=magiclink&code=c&next=%2Fhome',
      cookieNames: [LEGACY, FRESH],
    })
    expect(again).toBeNull()
  })
})

describe('signOutCookiePlan', () => {
  it('clears every host-only chunk and the stray Domain variant', () => {
    const plan = signOutCookiePlan([LEGACY, FRESH, CHUNK, VERIFIER])
    const hostOnly = plan.filter((cookie) => !cookie.domain)
    const domain = plan.filter((cookie) => cookie.domain)

    for (const name of [LEGACY, FRESH, CHUNK, `${REF}.2`, VERIFIER, `${VERIFIER}.0`]) {
      expect(hostOnly.map((cookie) => cookie.name), name).toContain(name)
      expect(domain.map((cookie) => cookie.name), name).toContain(name)
    }
    expect(hostOnly.every((cookie) => !('domain' in cookie) && cookie.maxAge === 0 && cookie.path === '/')).toBe(
      true,
    )
    expect(domain.every((cookie) => cookie.domain === STRAY_AUTH_COOKIE_DOMAIN && cookie.maxAge === 0)).toBe(
      true,
    )

    const headers = signOutCookieHeaders([FRESH], true)
    const hostHeader = headers.find((header) => header.startsWith(`${FRESH}=`) && !header.includes('Domain='))
    const domainHeader = headers.find((header) => header.startsWith(`${FRESH}=`) && header.includes('Domain='))
    expect(hostHeader).toContain('Path=/')
    expect(hostHeader).toContain('Max-Age=0')
    expect(hostHeader).not.toContain('Domain=')
    expect(domainHeader).toContain(`Domain=${STRAY_AUTH_COOKIE_DOMAIN}`)
    expect(domainHeader).toContain('Max-Age=0')
    expect(headers.some((header) => header.includes('Domain=.evil.com'))).toBe(false)
  })
})

describe('planPlatformSignInHop', () => {
  it('308s platform login and callback to www and keeps the query', () => {
    const search = '?token_hash=abc.def&type=magiclink&code=pkce-code&next=%2Fevents%3Fx%3D1'
    const hop = planPlatformSignInHop({
      hostHeader: 'platform.evolvedpros.com',
      forwardedHost: null,
      pathname: '/auth/callback',
      search,
      cookieNames: [LEGACY, FRESH, CHUNK],
    })
    expect(hop?.status).toBe(308)
    const url = new URL(hop!.location)
    expect(url.origin).toBe('https://www.evolvedpros.com')
    expect(url.pathname).toBe('/auth/callback')
    expect(url.searchParams.get('token_hash')).toBe('abc.def')
    expect(url.searchParams.get('type')).toBe('magiclink')
    expect(url.searchParams.get('code')).toBe('pkce-code')
    expect(url.searchParams.get('next')).toBe('/events?x=1')
    expect(hop!.clear.map((cookie) => cookie.name)).toEqual(
      expect.arrayContaining([LEGACY, FRESH, CHUNK]),
    )
    expect(hop!.clear.every((cookie) => cookie.maxAge === 0 && cookie.path === '/' && !('domain' in cookie))).toBe(
      true,
    )

    const login = planPlatformSignInHop({
      hostHeader: null,
      forwardedHost: 'platform.evolvedpros.com',
      pathname: '/login/',
      search: '?mode=signup&next=%2Fpricing',
      cookieNames: [],
    })
    expect(login?.location).toBe('https://www.evolvedpros.com/login?mode=signup&next=%2Fpricing')
  })

  it('keeps a hostile next in the query and never forwards to that host', () => {
    const hostile = [
      '?next=https%3A%2F%2Fevil.com',
      '?next=%2F%2Fevil.com&token_hash=abc&type=magiclink&code=c',
      '?next=javascript%3Aalert(1)',
      '?redirect=https%3A%2F%2Fevil.com%2Fphish',
    ]
    for (const search of hostile) {
      const hop = planPlatformSignInHop({
        hostHeader: 'platform.evolvedpros.com',
        forwardedHost: 'evil.com',
        pathname: '/login',
        search,
        cookieNames: [],
      })
      const url = new URL(hop!.location)
      expect(url.hostname, search).toBe('www.evolvedpros.com')
      expect(url.pathname, search).toBe('/login')
      expect(url.origin, search).not.toBe('https://evil.com')
      expect(hop!.location, search).not.toMatch(/^https?:\/\/evil\.com/)
      const next = url.searchParams.get('next')
      if (next) expect(safeAuthNext(next), search).toBe('/home')
    }

    expect(
      planPlatformSignInHop({
        hostHeader: 'www.evolvedpros.com',
        forwardedHost: null,
        pathname: '/login',
        search: '?next=https://evil.com',
        cookieNames: [],
      }),
    ).toBeNull()
    expect(
      planPlatformSignInHop({
        hostHeader: 'platform.evolvedpros.com.evil.com',
        forwardedHost: null,
        pathname: '/auth/callback',
        search: '?next=https://evil.com',
        cookieNames: [],
      }),
    ).toBeNull()
    expect(
      planPlatformSignInHop({
        hostHeader: 'platform.evolvedpros.com',
        forwardedHost: null,
        pathname: '/home',
        search: '?next=https://evil.com',
        cookieNames: [],
      }),
    ).toBeNull()
  })
})

describe('sign-out call sites', () => {
  const root = resolve(__dirname, '../..')
  it('TopNav and MoreDrawer clear every cookie variant', () => {
    const topnav = readFileSync(resolve(root, 'components/layout/TopNav.tsx'), 'utf8')
    const drawer = readFileSync(resolve(root, 'components/layout/MoreDrawer.tsx'), 'utf8')
    expect(topnav).toContain('signOutBrowser')
    expect(drawer).toContain('signOutBrowser')
    expect(topnav).not.toContain('supabase.auth.signOut')
    expect(drawer).not.toContain('supabase.auth.signOut')
  })
})
