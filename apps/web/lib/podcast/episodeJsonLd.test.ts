import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ adminClient: {} }))

import { episodeJsonLd, episodeJsonLdScript, podcastSeriesJsonLd } from './episodeJsonLd'
import type { PublicEpisode } from './public'
import { canonicalUrl } from '@/lib/seo/canonical'

const BREAKOUT = '</script><img src=x onerror=alert(1)>'

function ep(over: Partial<PublicEpisode> = {}): PublicEpisode {
  return {
    id: 'id-1',
    slug: 'an-episode',
    episode_number: 1,
    title: 'An Episode',
    guest_name: 'Dennis Yu',
    guest_bio: 'Bio text.',
    guest_title: 'CEO',
    guest_company: 'BlitzMetrics',
    guest_image_url: null,
    thumbnail_url: null,
    published_at: '2026-01-01T00:00:00.000Z',
    updated_at: null,
    youtube_id: 'OWpbcxVKoGg',
    spotify_url: null,
    apple_url: null,
    duration_seconds: 3296,
    location: 'NAB Show, Las Vegas',
    summary: 'A clean summary.',
    tags: [],
    pillar: 'identity',
    pillars: [],
    chapters: [],
    pull_quotes: [],
    transcript_text: 'Clean transcript paragraph.',
    transcript_segments: [],
    ...over,
  }
}

describe('episodeJsonLdScript', () => {
  it('matches JSON.stringify when the episode text has no raw <', () => {
    const episode = ep()
    expect(episodeJsonLdScript(episode)).toBe(JSON.stringify(episodeJsonLd(episode)))
  })

  it('escapes </script> in RSS/CMS title, summary, and transcript', () => {
    const html = episodeJsonLdScript(ep({
      title: BREAKOUT,
      summary: `<p>show notes</p>${BREAKOUT}`,
      transcript_text: `Guest: ${BREAKOUT}`,
    }))

    expect(html).not.toContain('<')
    expect(html).toContain('\\u003c/script>')
    expect(html).not.toContain('</script>')

    const parsed = JSON.parse(html) as Array<Record<string, unknown>>
    expect(parsed.map(node => node['@type'])).toEqual([
      'PodcastEpisode',
      'VideoObject',
      'BreadcrumbList',
    ])
    expect(parsed[0].name).toBe(BREAKOUT)
    expect(parsed[0].description).toBe(`<p>show notes</p>${BREAKOUT}`)
    expect(parsed[1].transcript).toBe(`Guest: ${BREAKOUT}`)
    const crumbs = parsed[2].itemListElement as Array<{ name: string }>
    expect(crumbs[2].name).toBe(BREAKOUT)
  })

  it('is what the public episode page inlines into the JSON-LD script', () => {
    const page = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), '../../app/(public)/podcast/[slug]/page.tsx'),
      'utf8',
    )
    expect(page).toContain('episodeJsonLdScript(ep)')
    expect(page).not.toContain('JSON.stringify(jsonLd')
  })
})

function platformHits(value: string): number {
  return value.match(/platform\.evolvedpros\.com/g)?.length ?? 0
}

describe('podcast JSON-LD host', () => {
  it('renders /podcast and one episode with zero platform.evolvedpros.com URLs', async () => {
    const prevSite = process.env.NEXT_PUBLIC_SITE_URL
    const prevApp = process.env.NEXT_PUBLIC_APP_URL
    process.env.NEXT_PUBLIC_SITE_URL = 'https://platform.evolvedpros.com'
    process.env.NEXT_PUBLIC_APP_URL = 'https://platform.evolvedpros.com'
    vi.resetModules()
    try {
      const { podcastSeriesJsonLd: seriesLd, episodeJsonLdScript: episodeScript } = await import('./episodeJsonLd')
      const series = JSON.stringify(seriesLd())
      const episode = episodeScript(ep({
        slug: 'evolved-pros-pilot-episode',
        title: 'Evolved Pros Pilot Episode',
      }))

      expect(platformHits(series)).toBe(0)
      expect(platformHits(episode)).toBe(0)
      expect(series).toContain(`"url":"${canonicalUrl('/podcast')}"`)
      expect(series).toContain(`"webFeed":"${canonicalUrl('/podcast/rss.xml')}"`)
      expect(episode).toContain(canonicalUrl('/podcast/evolved-pros-pilot-episode'))
      expect(episode).toContain(`"item":"${canonicalUrl('/')}"`)
      expect(episode).toContain(`"item":"${canonicalUrl('/podcast')}"`)

      const index = readFileSync(
        resolve(dirname(fileURLToPath(import.meta.url)), '../../app/(public)/podcast/(index)/page.tsx'),
        'utf8',
      )
      expect(index).toContain('podcastSeriesJsonLd()')
      expect(index).toContain('JSON.stringify(jsonLd)')
      expect(index).not.toContain('platform.evolvedpros.com')
      expect(index).not.toContain('NEXT_PUBLIC_SITE_URL')

      const rss = readFileSync(
        resolve(dirname(fileURLToPath(import.meta.url)), '../../app/(public)/podcast/rss.xml/route.ts'),
        'utf8',
      )
      expect(rss).toContain("canonicalUrl('/podcast/rss.xml')")
      expect(rss).toContain("canonicalUrl('/podcast')")
      expect(rss).toContain('episodeUrl(ep.slug)')
      expect(rss).not.toContain('platform.evolvedpros.com')
      expect(rss).not.toContain('resolveCanonicalOrigin')
      expect(rss).not.toContain('NEXT_PUBLIC_SITE_URL')

      const helpers = readFileSync(
        resolve(dirname(fileURLToPath(import.meta.url)), './public.ts'),
        'utf8',
      )
      expect(helpers).not.toContain('resolveCanonicalOrigin')
      expect(helpers).not.toContain('NEXT_PUBLIC_SITE_URL')
      expect(helpers).toContain('return canonicalUrl(`/podcast/${slug}`)')
    } finally {
      if (prevSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL
      else process.env.NEXT_PUBLIC_SITE_URL = prevSite
      if (prevApp === undefined) delete process.env.NEXT_PUBLIC_APP_URL
      else process.env.NEXT_PUBLIC_APP_URL = prevApp
    }
  })

  it('static builders match the www canonical host', () => {
    const series = JSON.stringify(podcastSeriesJsonLd())
    const episode = episodeJsonLdScript(ep({ slug: 'evolved-pros-pilot-episode' }))
    expect(platformHits(series)).toBe(0)
    expect(platformHits(episode)).toBe(0)
    expect(series).toContain('https://www.evolvedpros.com/podcast')
    expect(episode).toContain('https://www.evolvedpros.com/podcast/evolved-pros-pilot-episode')
  })
})
