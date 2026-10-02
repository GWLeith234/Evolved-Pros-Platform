import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PILLARS } from '@/lib/pillars'
import {
  MEDIA_PILLAR_HUB_SITEMAP_PRIORITY,
  toEpisodeSitemapEntries,
  toPillarHubSitemapEntries,
  toStaticSitemapEntries,
} from './sitemapEntries'
import {
  LOGIN_DOCUMENT_ROBOTS,
  MEDIA_PILLAR_HUB_PATHS,
  PUBLIC_SITEMAP_PATHS,
  ROBOTS_DISALLOW,
  robotsSitemapUrl,
} from './publicRoutes'

/**
 * GATE-1. This file imports the module under test plus node:fs to read
 * sitemap.ts. Pulling in lib/podcast/public.ts (or anything reaching
 * @/lib/supabase/admin) would construct a Supabase client at module scope
 * and throw "supabaseUrl is required" before a single spec ran.
 */

/** Every route that bounces an anonymous request — Googlebot included. */
const GATED_PATHS = ['/community', '/events', '/academy', '/leaderboard']

describe('PUBLIC_SITEMAP_PATHS', () => {
  it('is exactly the anon-reachable paths', () => {
    expect([...PUBLIC_SITEMAP_PATHS]).toEqual([
      '/',
      '/podcast',
      '/live',
      '/media',
      '/fit',
      '/pricing',
      '/terms',
      '/privacy',
      '/contact',
      '/about',
      '/evolved',
    ])
  })

  it('lists /about at contact-class frequency and priority', () => {
    const sitemap = readFileSync(resolve(__dirname, '../../app/sitemap.ts'), 'utf8')
    expect(sitemap).toMatch(/'\/about':\s+'yearly'/)
    expect(sitemap).toMatch(/'\/about':\s+0\.4\b/)
  })

  it('advertises the EVOLVED book preorder dest the house IAB ads click to', () => {
    expect([...PUBLIC_SITEMAP_PATHS]).toContain('/evolved')
    expect([...PUBLIC_SITEMAP_PATHS]).not.toContain('/book')
  })

  // FOOTER-1: the global footer is the only in-page door to these three, and
  // all three 404'd before this sprint. If one is dropped from the sitemap it
  // is almost certainly because the page was dropped too.
  it('advertises the public legal pages the footer links to', () => {
    for (const legal of ['/terms', '/privacy', '/contact']) {
      expect([...PUBLIC_SITEMAP_PATHS]).toContain(legal)
    }
  })

  it('advertises no route that requires auth', () => {
    for (const gated of GATED_PATHS) {
      expect([...PUBLIC_SITEMAP_PATHS]).not.toContain(gated)
    }
  })
})

describe('pillar hub sitemap entries', () => {
  const base = 'https://www.evolvedpros.com'

  it('emits all six hubs and not /media/preview or /login', () => {
    expect([...MEDIA_PILLAR_HUB_PATHS]).toEqual(PILLARS.map((pillar) => `/media/${pillar.slug}`))
    const hubs = toPillarHubSitemapEntries(base)
    expect(hubs.map((entry) => new URL(entry.url).pathname)).toEqual([...MEDIA_PILLAR_HUB_PATHS])
    expect(hubs.some((entry) => entry.url.includes('/media/preview'))).toBe(false)
    expect(hubs.some((entry) => entry.url.includes('/login'))).toBe(false)
    expect(hubs.every((entry) => !('lastModified' in entry))).toBe(true)
    expect(hubs.every((entry) => entry.priority === MEDIA_PILLAR_HUB_SITEMAP_PRIORITY)).toBe(true)
    expect(MEDIA_PILLAR_HUB_SITEMAP_PRIORITY).toBeLessThan(0.7)

    const sitemap = readFileSync(resolve(__dirname, '../../app/sitemap.ts'), 'utf8')
    expect(sitemap).toMatch(/'\/media':\s+0\.7\b/)
    expect(sitemap).toContain('toPillarHubSitemapEntries')
    expect(sitemap).not.toContain('/media/careers')
    expect(sitemap).not.toContain('/media/academy')
    expect(sitemap).not.toContain("'/media/preview'")
    expect(sitemap).not.toContain("'/login'")
  })
})

describe('sitemap dates and refresh', () => {
  const base = 'https://www.evolvedpros.com'

  it('omits lastModified on static entries and is byte-identical across calls', () => {
    const freq = Object.fromEntries(
      PUBLIC_SITEMAP_PATHS.map((path) => [path, 'yearly']),
    ) as Record<(typeof PUBLIC_SITEMAP_PATHS)[number], 'yearly'>
    const priority = Object.fromEntries(
      PUBLIC_SITEMAP_PATHS.map((path) => [path, 0.4]),
    ) as Record<(typeof PUBLIC_SITEMAP_PATHS)[number], number>
    const first = toStaticSitemapEntries(base, freq, priority)
    const second = toStaticSitemapEntries(base, freq, priority)
    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
    expect(JSON.stringify(first)).not.toContain('lastModified')
    expect(first.map((entry) => new URL(entry.url).pathname)).toEqual([...PUBLIC_SITEMAP_PATHS])
    expect(first.some((entry) => entry.url.includes('/login'))).toBe(false)
    expect(first.some((entry) => entry.url.includes('/media/preview'))).toBe(false)
  })

  it('uses updated_at for episode lastModified and falls back to published_at', () => {
    const updatedAt = '2026-09-29T15:04:00.000Z'
    const publishedAt = '2026-01-01T00:00:00.000Z'
    const [withUpdate] = toEpisodeSitemapEntries(base, [
      { slug: 'an-episode', updated_at: updatedAt, published_at: publishedAt },
    ])
    expect(withUpdate.lastModified).toEqual(new Date(updatedAt))

    const [fallback] = toEpisodeSitemapEntries(base, [
      { slug: 'an-episode', updated_at: null, published_at: publishedAt },
    ])
    expect(fallback.lastModified).toEqual(new Date(publishedAt))

    const [neither] = toEpisodeSitemapEntries(base, [
      { slug: 'an-episode', updated_at: null, published_at: null },
    ])
    expect(neither).not.toHaveProperty('lastModified')

    const once = JSON.stringify(withUpdate)
    const twice = JSON.stringify(toEpisodeSitemapEntries(base, [
      { slug: 'an-episode', updated_at: updatedAt, published_at: publishedAt },
    ])[0])
    expect(once).toBe(twice)
  })

  it('has no request-time new Date() in static, article, or episode sitemap sources', () => {
    const files = [
      resolve(__dirname, '../../app/sitemap.ts'),
      resolve(__dirname, '../media/sitemap.ts'),
      resolve(__dirname, 'sitemapEntries.ts'),
    ]
    for (const file of files) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/new Date\(\s*\)/)
    }
    const episodes = readFileSync(resolve(__dirname, '../podcast/public.ts'), 'utf8')
    expect(episodes).toMatch(/published_at, updated_at/)
    const sitemap = readFileSync(resolve(__dirname, '../../app/sitemap.ts'), 'utf8')
    expect(sitemap).toMatch(/updated_at/)
    expect(sitemap).toMatch(/export const revalidate = 60\b/)
    expect(sitemap).not.toMatch(/export const fetchCache/)
  })
})

describe('robotsSitemapUrl', () => {
  it('appends /sitemap.xml to the canonical site URL', () => {
    expect(robotsSitemapUrl('https://evolvedpros.com')).toBe('https://evolvedpros.com/sitemap.xml')
  })

  it('strips a trailing slash rather than emitting //sitemap.xml', () => {
    expect(robotsSitemapUrl('https://evolvedpros.com/')).toBe('https://evolvedpros.com/sitemap.xml')
    expect(robotsSitemapUrl('https://evolvedpros.com///')).toBe('https://evolvedpros.com/sitemap.xml')
    expect(robotsSitemapUrl('https://evolvedpros.com')).not.toContain('//sitemap.xml')
  })

  it('never emits the platform host — the sitemap follows SITE_URL, not a hardcode', () => {
    const inputs = [
      'https://evolvedpros.com',
      'https://evolvedpros.com/',
      'https://www.evolvedpros.com',
      'http://localhost:3000',
    ]
    for (const input of inputs) {
      expect(robotsSitemapUrl(input)).not.toContain('platform.evolvedpros.com')
    }
  })
})

describe('ROBOTS_DISALLOW', () => {
  it('disallows the thin auth document', () => {
    expect([...ROBOTS_DISALLOW]).toContain('/login')
  })

  it('does not hide the public sell page', () => {
    expect([...ROBOTS_DISALLOW]).not.toContain('/pricing')
  })
})

describe('LOGIN_DOCUMENT_ROBOTS', () => {
  it('noindexes /login and /login?mode=signup (same document)', () => {
    expect(LOGIN_DOCUMENT_ROBOTS).toEqual({ index: false, follow: false })
  })
})
