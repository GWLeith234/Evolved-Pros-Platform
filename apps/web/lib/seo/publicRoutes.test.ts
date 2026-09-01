import { describe, expect, it } from 'vitest'
import { PUBLIC_SITEMAP_PATHS, robotsSitemapUrl } from './publicRoutes'

/**
 * GATE-1. This file imports NOTHING but the module under test — deliberately.
 * Pulling in lib/podcast/public.ts (or anything reaching @/lib/supabase/admin)
 * would construct a Supabase client at module scope and throw
 * "supabaseUrl is required" before a single spec ran.
 */

/** Every route that bounces an anonymous request — Googlebot included. */
const GATED_PATHS = ['/community', '/events', '/academy', '/leaderboard']

describe('PUBLIC_SITEMAP_PATHS', () => {
  it('is exactly the nine anon-reachable paths', () => {
    expect([...PUBLIC_SITEMAP_PATHS]).toEqual([
      '/',
      '/podcast',
      '/live',
      '/media',
      '/pricing',
      '/terms',
      '/privacy',
      '/contact',
      '/evolved',
    ])
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
