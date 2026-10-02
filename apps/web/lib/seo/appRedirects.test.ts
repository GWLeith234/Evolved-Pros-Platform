import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  PLATFORM_HOST,
  PLATFORM_ORIGIN,
  PLATFORM_PUBLIC_HELD,
  PLATFORM_TO_WWW_EXACT_PATHS,
  PLATFORM_TO_WWW_PATTERNS,
  RAILWAY_PUBLIC_HOST,
  WWW_ORIGIN,
  appRedirects,
} from './appRedirects.mjs'

type RedirectRule = {
  source: string
  destination: string
  permanent?: boolean
  statusCode?: number
  has?: Array<{ type: string; value?: string }>
}

function redirects(): RedirectRule[] {
  return appRedirects() as RedirectRule[]
}

const require = createRequire(import.meta.url)
const { getPathMatch } = require('next/dist/shared/lib/router/utils/path-match') as {
  getPathMatch: (source: string) => (pathname: string) => false | Record<string, string | string[]>
}
const { prepareDestination } = require('next/dist/shared/lib/router/utils/prepare-destination') as {
  prepareDestination: (args: {
    appendParamsToQuery: boolean
    destination: string
    params: Record<string, string | string[]>
    query: Record<string, string>
  }) => {
    parsedDestination: {
      protocol?: string
      hostname?: string
      pathname?: string
      query?: Record<string, string | string[] | undefined>
    }
  }
}
const { getRedirectStatus } = require('next/dist/lib/redirect-status') as {
  getRedirectStatus: (route: { permanent?: boolean; statusCode?: number }) => number
}

/**
 * Same match Next uses for redirects(): host `has` (port stripped, lowercased),
 * path-to-regexp via getPathMatch, prepareDestination with appendParamsToQuery
 * false, first rule wins.
 */
function locationFor(
  host: string,
  pathname: string,
  query: Record<string, string> = {},
) {
  const hostname = host.split(':', 1)[0].toLowerCase()
  for (const rule of redirects()) {
    const hostRules = (rule.has ?? []).filter((h) => h.type === 'host')
    if (hostRules.length > 0 && !hostRules.every((h) => new RegExp(`^${h.value}$`, 'i').test(hostname))) {
      continue
    }
    const params = getPathMatch(rule.source)(pathname)
    if (!params) continue
    const { parsedDestination } = prepareDestination({
      appendParamsToQuery: false,
      destination: String(rule.destination),
      params,
      query,
    })
    const protocol = parsedDestination.protocol || 'https:'
    const destHost = parsedDestination.hostname
    const path = parsedDestination.pathname || '/'
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(parsedDestination.query ?? {})) {
      if (Array.isArray(value)) value.forEach((item) => search.append(key, String(item)))
      else if (value != null) search.append(key, String(value))
    }
    const searchStr = search.toString()
    const origin = destHost ? `${protocol}//${destHost}` : ''
    return {
      source: rule.source,
      status: getRedirectStatus(rule),
      url: `${origin}${path}${searchStr ? `?${searchStr}` : ''}`,
    }
  }
  return null
}

const APPROVED_EXACT_SOURCES = [
  '/',
  '/media',
  '/podcast',
  '/about',
  '/evolved',
  '/terms',
  '/privacy',
  '/contact',
  '/sitemap.xml',
]

const APPROVED_PATTERN_SOURCES = [
  '/media/:path((?!preview$|preview/).*)',
  '/podcast/:path*',
]

/** Paths that must stay on platform and must not match any redirect rule. */
const STAY_ON_PLATFORM = [
  '/login',
  '/auth/callback',
  '/api/stripe/webhook',
  '/api/stripe/checkout',
  '/api/webhooks/mux',
  '/api/webhooks/vendasta-conversations',
  '/api/health',
  '/onboarding',
  '/home',
  '/academy',
  '/community',
  '/events',
  '/messages',
  '/settings',
  '/notifications',
  '/profile',
  '/leaderboard',
  '/admin',
  '/media/preview',
  '/media/preview/x',
  '/guest',
  '/invite',
  '/welcome',
  '/beta-paused',
  '/unsubscribe',
  '/dev-login',
  '/_next/static/chunks/main.js',
  '/robots.txt',
  '/favicon.ico',
  '/logo_horizontal_navy.png',
  '/pricing',
  '/fit',
  '/live',
]

describe('appRedirects host policy', () => {
  it('allowlists only the approved public paths from platform to www', () => {
    const wwwRules = redirects().filter(
      (rule) =>
        (rule.has ?? []).some((h) => h.type === 'host' && h.value === PLATFORM_HOST) &&
        String(rule.destination).includes('www.evolvedpros.com'),
    )
    expect(wwwRules.map((rule) => rule.source)).toEqual([
      ...APPROVED_EXACT_SOURCES,
      ...APPROVED_PATTERN_SOURCES,
    ])
    expect(PLATFORM_TO_WWW_EXACT_PATHS).toEqual(APPROVED_EXACT_SOURCES)
    expect(PLATFORM_TO_WWW_PATTERNS.map((rule) => rule.source)).toEqual(APPROVED_PATTERN_SOURCES)
    for (const rule of wwwRules) {
      expect(rule.permanent).toBe(true)
      expect(rule.has).toEqual([{ type: 'host', value: PLATFORM_HOST }])
      expect(String(rule.destination).startsWith(WWW_ORIGIN)).toBe(true)
      expect(getRedirectStatus(rule)).toBe(308)
    }
  })

  it('maps each approved public path on platform to the same www URL and keeps the query', () => {
    const cases: Array<[string, string]> = [
      ['/', '/'],
      ['/media', '/media'],
      ['/media/foundation', '/media/foundation'],
      ['/media/identity', '/media/identity'],
      ['/media/mental-toughness', '/media/mental-toughness'],
      ['/media/strategy', '/media/strategy'],
      ['/media/accountability', '/media/accountability'],
      ['/media/execution', '/media/execution'],
      ['/media/strategy/what-ai-agents-actually-automate', '/media/strategy/what-ai-agents-actually-automate'],
      ['/podcast', '/podcast'],
      ['/podcast/some-episode', '/podcast/some-episode'],
      ['/podcast/a/b', '/podcast/a/b'],
      ['/about', '/about'],
      ['/evolved', '/evolved'],
      ['/terms', '/terms'],
      ['/privacy', '/privacy'],
      ['/contact', '/contact'],
      ['/sitemap.xml', '/sitemap.xml'],
    ]
    for (const [path, expectedPath] of cases) {
      const hit = locationFor(PLATFORM_HOST, path, { utm: 'newsletter', ref: '1' })
      expect(hit, path).not.toBeNull()
      const url = new URL(hit!.url)
      expect(url.origin, path).toBe(WWW_ORIGIN)
      expect(url.pathname, path).toBe(expectedPath)
      expect(url.searchParams.get('utm'), path).toBe('newsletter')
      expect(url.searchParams.get('ref'), path).toBe('1')
      expect(hit!.status, path).toBe(308)
    }

    const bare = locationFor(PLATFORM_HOST, '/about')
    expect(bare?.url).toBe(`${WWW_ORIGIN}/about`)
    expect(new URL(bare!.url).search).toBe('')

    const withPort = locationFor(`${PLATFORM_HOST}:443`, '/contact', { utm: 'newsletter' })
    expect(new URL(withPort!.url).origin).toBe(WWW_ORIGIN)
    expect(new URL(withPort!.url).pathname).toBe('/contact')
    expect(new URL(withPort!.url).searchParams.get('utm')).toBe('newsletter')
  })

  it('sends platform /sitemap.xml to the www sitemap and leaves robots.txt alone', () => {
    const sitemap = locationFor(PLATFORM_HOST, '/sitemap.xml', { x: '1' })
    expect(sitemap?.url).toBe(`${WWW_ORIGIN}/sitemap.xml?x=1`)
    expect(sitemap?.status).toBe(308)
    expect(locationFor(PLATFORM_HOST, '/robots.txt')).toBeNull()
    expect(locationFor('www.evolvedpros.com', '/sitemap.xml')).toBeNull()
    expect(locationFor('www.evolvedpros.com', '/media')).toBeNull()
  })

  it('does not redirect stay-on-platform paths or the held sell pages', () => {
    const paths = [...STAY_ON_PLATFORM, ...PLATFORM_PUBLIC_HELD]
    for (const path of paths) {
      expect(locationFor(PLATFORM_HOST, path, { utm: 'newsletter' }), path).toBeNull()
      expect(locationFor(`${PLATFORM_HOST}:443`, path), path).toBeNull()
    }
    for (const held of PLATFORM_PUBLIC_HELD) {
      expect(PLATFORM_TO_WWW_EXACT_PATHS).not.toContain(held)
      expect(redirects().some((rule) => rule.source === held)).toBe(false)
    }
  })

  it('keeps /media/preview on platform, including nested drafts', () => {
    for (const path of ['/media/preview', '/media/preview/x', '/media/preview/x/card', '/media/PREVIEW/secret']) {
      expect(locationFor(PLATFORM_HOST, path), path).toBeNull()
    }
  })

  it('keeps /join and /signup on the same host (relative, not www)', () => {
    const join = redirects().find((r) => r.source === '/join')
    const signup = redirects().find((r) => r.source === '/signup')
    expect(join?.destination).toBe('/login?mode=signup')
    expect(signup?.destination).toBe('/login?mode=signup')
    expect(join?.destination).not.toContain('www.evolvedpros.com')
    expect(signup?.destination).not.toContain('www.evolvedpros.com')
    const joined = locationFor(PLATFORM_HOST, '/join', { ref: 'stage' })
    expect(joined?.url.startsWith('/login')).toBe(true)
    expect(joined?.url).not.toContain('www.evolvedpros.com')
    expect(joined?.url).toContain('mode=signup')
    expect(joined?.url).toContain('ref=stage')
  })

  it('sends leftover Railway page hits to platform, not www', () => {
    const railway = redirects().find((r) =>
      (r.has ?? []).some((h) => h.type === 'host' && h.value === RAILWAY_PUBLIC_HOST),
    )
    expect(railway).toBeDefined()
    expect(railway?.destination).toBe(`${PLATFORM_ORIGIN}/:path`)
    expect(String(railway?.destination)).not.toContain('www.evolvedpros.com')
    const media = locationFor(RAILWAY_PUBLIC_HOST, '/media', { utm: 'newsletter' })
    expect(media?.url.startsWith(PLATFORM_ORIGIN)).toBe(true)
    expect(media?.url).not.toContain('www.evolvedpros.com')
    expect(new URL(media!.url).pathname).toBe('/media')
    expect(new URL(media!.url).searchParams.get('utm')).toBe('newsletter')
  })

  it('keeps the next.config trailing-slash hop on the same host', () => {
    const config = readFileSync(resolve(__dirname, '../../next.config.mjs'), 'utf8')
    expect(config).toContain("destination: '/:path'")
    expect(config).not.toMatch(/www is still Bluehost/)
  })
})
