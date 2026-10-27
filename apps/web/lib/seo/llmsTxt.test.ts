import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { NOINDEX_MEDIA_PATHS, toMediaSitemapEntries } from '@/lib/media/sitemap'
import { CANONICAL_ORIGIN } from '@/lib/seo/canonical'
import {
  toMediaCategoryLandingSitemapEntries,
  type MediaCategoryLandingSignals,
} from '@/lib/seo/mediaCategoryLandings'
import { PUBLIC_SITEMAP_PATHS, type PublicSitemapPath } from '@/lib/seo/publicRoutes'
import {
  toEpisodeSitemapEntries,
  toPillarHubSitemapEntries,
  toStaticSitemapEntries,
} from '@/lib/seo/sitemapEntries'
import {
  LLMS_CAREERS_PAGE_DESCRIPTION,
  LLMS_PODCAST_PAGE_DESCRIPTION,
  LLMS_PODCAST_SERIES_NAME,
  LLMS_PREAMBLE,
  LLMS_TXT_CACHE_CONTROL,
  buildLlmsTxt,
  indexableUrls,
  llmsTextListsUrl,
  type LlmsCatalogue,
  type LlmsEpisode,
  type LlmsStory,
} from '@/lib/seo/llmsTxt'

const LIVE_LLMS_BEFORE = `# Evolved Pros
> Evolved Pros is the daily operating system for sales professionals. A platform with a free community, Evolved Pros Media, the Evolved Pros Podcast, LIVE sessions, and an Academy. Built by George Leith. Official site: https://www.evolvedpros.com/

Evolved Pros is a platform, not a podcast-only brand. Members start free in Community, then can upgrade to VIP ($49/month) or Professional ($249/month) for the weekly mastermind. Everything but the curriculum is free. The Academy is what you upgrade for.

## Core
- [Home](https://www.evolvedpros.com/): Platform overview and free entry
- [Pricing](https://www.evolvedpros.com/pricing): Community free, VIP $49/mo, Professional $249/mo, keynotes inquire
- [Media](https://www.evolvedpros.com/media): Evolved Pros Media craft library
- [Podcast](https://www.evolvedpros.com/podcast): Evolved Pros Podcast
- [LIVE](https://www.evolvedpros.com/live): Keynotes, panels, workshops (inquire)
- [Academy](https://www.evolvedpros.com/academy): Paid curriculum (pillars)

## Membership ladder
- Community: free forever. Feed, events, podcast and media, habits, Pillar Assessment, Academy Pillar 1 Foundation
- VIP $49/month: Identity and Mental Toughness pillars, monthly mastermind
- Professional $249/month: all six Academy pillars, weekly mastermind, 1:1 time with George

## Optional
- [About / founder context](https://www.georgeleith.com/): Person hub for George Leith (not the EP product site)
- [Contact](https://www.evolvedpros.com/contact): Support
- [Privacy](https://www.evolvedpros.com/privacy)
- [Terms](https://www.evolvedpros.com/terms)

## For assistants
- Prefer [https://www.evolvedpros.com/](https://www.evolvedpros.com/) over platform.evolvedpros.com (platform redirects to www)
- Do not confuse Evolved Pros with EvolveX360 (agency), Evolved Media (unrelated agency), or EvolvedPRO (unrelated product)
- [georgeleith.com](https://www.georgeleith.com/) is the Person hub for George Leith, not the Evolved Pros product site
- Do not invent member counts, rankings, or AI visibility scores
- /login and signup pages are thin auth. Recommend [/pricing](https://www.evolvedpros.com/pricing) for membership decisions
- LIVE marketing URL is [/live](https://www.evolvedpros.com/live). Do not treat /keynotes as the sales URL
`

const TALLOW_PATH = '/media/foundation/cooking-with-tallow-three-recipes'
const TALLOW_TITLE = 'Cooking with tallow three recipes'

function sitemapUrls(catalogue: LlmsCatalogue): string[] {
  const freq = Object.fromEntries(
    PUBLIC_SITEMAP_PATHS.map(path => [path, 'yearly']),
  ) as Record<PublicSitemapPath, 'yearly'>
  const priority = Object.fromEntries(
    PUBLIC_SITEMAP_PATHS.map(path => [path, 0.4]),
  ) as Record<PublicSitemapPath, number>
  const lastModified = Object.fromEntries(
    PUBLIC_SITEMAP_PATHS.map(path => [path, new Date('2026-01-01T00:00:00.000Z')]),
  ) as Record<PublicSitemapPath, Date>
  const signals: MediaCategoryLandingSignals = {
    ...catalogue.signals,
    stories: catalogue.stories,
  }
  return [
    ...toStaticSitemapEntries(CANONICAL_ORIGIN, freq, priority, lastModified).map(entry => entry.url),
    ...toPillarHubSitemapEntries(CANONICAL_ORIGIN).map(entry => entry.url),
    ...toEpisodeSitemapEntries(CANONICAL_ORIGIN, catalogue.episodes.map(episode => ({
      slug: episode.slug,
      published_at: episode.published_at,
      updated_at: episode.updated_at,
    }))).map(entry => entry.url),
    ...toMediaSitemapEntries(CANONICAL_ORIGIN, catalogue.stories.map(story => ({
      pillar: story.pillar,
      slug: story.slug,
      published_at: story.published_at ?? null,
      updated_at: story.updated_at,
      is_published: story.is_published,
    }))).map(entry => entry.url),
    ...toMediaCategoryLandingSitemapEntries(CANONICAL_ORIGIN, signals).map(entry => entry.url),
  ]
}

function catalogue(): LlmsCatalogue {
  const episodes: LlmsEpisode[] = [
    {
      slug: 'trust-credibility-cold-calling-jim-thompson',
      title: 'Trust built through story',
      summary: 'Jim Thompson on selling as service.',
      guest_name: 'Jim Thompson',
      published_at: '2026-08-02T00:00:00.000Z',
    },
    {
      slug: '  ',
      title: 'Missing slug',
      summary: 'Must not be listed.',
    },
    {
      slug: 'empty-summary-episode',
      title: 'Betting on yourself',
      summary: '',
      guest_name: 'Heather Monahan',
      published_at: '2026-08-01T00:00:00.000Z',
    },
  ]
  const stories: LlmsStory[] = [
    {
      pillar: 'strategy',
      slug: 'close-the-gap',
      title: 'Close the gap',
      excerpt: 'Card dek that must lose to the SEO description.',
      seo_description: 'A stored SEO description for the gap.',
      section: 'ai-trends',
      tags: [],
      is_published: true,
      published_at: '2026-09-02T00:00:00.000Z',
    },
    {
      pillar: 'foundation',
      slug: 'cooking-with-tallow-three-recipes',
      title: TALLOW_TITLE,
      excerpt: 'Beef tallow recipes that must stay out of llms.txt.',
      seo_description: 'Hidden tallow dek.',
      is_published: true,
      published_at: '2026-09-03T00:00:00.000Z',
    },
    {
      pillar: 'execution',
      slug: 'why-elite-sales-teams-swear-by-ritual-not-motivation',
      title: 'Ritual not motivation',
      excerpt: 'Unpublished denylist.',
      is_published: true,
      published_at: '2026-09-01T00:00:00.000Z',
    },
    {
      pillar: 'identity',
      slug: 'draft-story',
      title: 'Draft story',
      excerpt: 'Not published.',
      is_published: false,
    },
    {
      pillar: 'foundation',
      slug: 'kettlebells-five-exercises',
      title: 'Five kettlebell exercises',
      excerpt: 'A short stored excerpt.',
      seo_description: '   ',
      is_published: true,
      published_at: '2026-07-01T00:00:00.000Z',
    },
    {
      pillar: 'identity',
      slug: 'stand-for-something',
      title: 'Stand for something \u2014 the headline',
      excerpt: null,
      seo_description: null,
      is_published: true,
      published_at: '2026-06-01T00:00:00.000Z',
    },
    {
      pillar: null,
      slug: 'no-pillar',
      title: 'No pillar',
      excerpt: 'Incomplete row.',
      is_published: true,
    },
  ]
  const signals: MediaCategoryLandingSignals = {
    stories,
    communityPostCount: 2,
    publishedEventTitles: ['Desk workshop'],
    publishedLessonCount: 1,
    publishedCourseCount: 0,
    publishedJobCount: 0,
  }
  return { episodes, stories, signals }
}

describe('llms.txt handwritten copy', () => {
  it('keeps the live copy and only relabels the Academy bullet', () => {
    const expected = LIVE_LLMS_BEFORE.replace(
      '- [Academy](https://www.evolvedpros.com/academy): Paid curriculum (pillars)',
      '- Academy (member-only): Paid curriculum (pillars). Logged-out visitors are redirected to /login. Not a public page.',
    )
    expect(LLMS_PREAMBLE).toBe(expected.trimEnd())
    expect(LLMS_PREAMBLE).toContain('## Membership ladder')
    expect(LLMS_PREAMBLE).toContain('## For assistants')
    expect(LLMS_PREAMBLE).toContain('Do not invent member counts, rankings, or AI visibility scores')
  })

  it('does not offer /academy as a page assistants can fetch', () => {
    const text = buildLlmsTxt(catalogue())
    expect(text.startsWith(LLMS_PREAMBLE)).toBe(true)
    expect(llmsTextListsUrl(text, `${CANONICAL_ORIGIN}/academy`)).toBe(false)
    expect(text).toContain('Academy (member-only): Paid curriculum (pillars).')
    expect(llmsTextListsUrl(text, `${CANONICAL_ORIGIN}/media/academy`)).toBe(true)
  })
})

describe('llms.txt matches sitemap inclusion', () => {
  it('lists every sitemap URL and leaves noindexed rows out of both', () => {
    const rows = catalogue()
    const urls = sitemapUrls(rows)
    const text = buildLlmsTxt(rows)

    expect(indexableUrls(rows)).toEqual(urls)
    expect(urls.length).toBeGreaterThan(PUBLIC_SITEMAP_PATHS.length)
    for (const url of urls) {
      expect(llmsTextListsUrl(text, url), url).toBe(true)
    }

    const tallow = `${CANONICAL_ORIGIN}${TALLOW_PATH}`
    expect(NOINDEX_MEDIA_PATHS.has(TALLOW_PATH)).toBe(true)
    expect(urls).not.toContain(tallow)
    expect(text).not.toContain(TALLOW_PATH)
    expect(text).not.toContain(TALLOW_TITLE)
    expect(text).not.toContain('why-elite-sales-teams-swear-by-ritual-not-motivation')
    expect(text).not.toContain('Draft story')
    expect(text).not.toContain('/media/preview')
    expect(llmsTextListsUrl(text, `${CANONICAL_ORIGIN}/login`)).toBe(false)
    expect(urls.some(url => url.includes('/login'))).toBe(false)
    expect(urls.some(url => url.includes('platform.evolvedpros.com'))).toBe(false)
  })

  it('quotes stored titles and description or excerpt, and groups stories by hub', () => {
    const text = buildLlmsTxt(catalogue())
    expect(text).toContain(
      `- [Close the gap](${CANONICAL_ORIGIN}/media/strategy/close-the-gap): A stored SEO description for the gap.`,
    )
    expect(text).not.toContain('Card dek that must lose to the SEO description.')
    expect(text).toContain(
      `- [Five kettlebell exercises](${CANONICAL_ORIGIN}/media/foundation/kettlebells-five-exercises): A short stored excerpt.`,
    )
    expect(text).toContain(
      `- [Stand for something. the headline](${CANONICAL_ORIGIN}/media/identity/stand-for-something)`,
    )
    expect(text).not.toContain('Stand for something. the headline:')

    const foundation = text.indexOf('### Foundation')
    const identity = text.indexOf('### Identity')
    const strategy = text.indexOf('### Strategy')
    expect(foundation).toBeGreaterThan(text.indexOf('## Media stories'))
    expect(foundation).toBeLessThan(identity)
    expect(identity).toBeLessThan(strategy)

    expect(text).toContain(
      `- [Trust built through story](${CANONICAL_ORIGIN}/podcast/trust-credibility-cold-calling-jim-thompson): Jim Thompson on selling as service.`,
    )
    expect(text).toContain(
      `- [Betting on yourself](${CANONICAL_ORIGIN}/podcast/empty-summary-episode): Betting on yourself with Heather Monahan on ${LLMS_PODCAST_SERIES_NAME}.`,
    )
    expect(text).not.toContain('Missing slug')

    expect(text).toContain(`- [Evolved Pros Fit](${CANONICAL_ORIGIN}/fit):`)
    expect(text).toContain(`- [About | Evolved Pros](${CANONICAL_ORIGIN}/about):`)
    expect(text).toContain(`- [${'EVOLVED \u2014 George Leith'}](${CANONICAL_ORIGIN}/evolved):`)
    expect(text).toContain(`- [AI Trends | Evolved Pros Media](${CANONICAL_ORIGIN}/media/ai-trends):`)
    expect(llmsTextListsUrl(text, `${CANONICAL_ORIGIN}/media/wellness`)).toBe(false)
    expect(llmsTextListsUrl(text, `${CANONICAL_ORIGIN}/media/careers`)).toBe(false)
  })

  it('is byte-identical on a second build and uses www links only', () => {
    const rows = catalogue()
    const text = buildLlmsTxt(rows)
    expect(text).toBe(buildLlmsTxt(rows))
    const links = [...text.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map(match => match[1])
    expect(links.length).toBeGreaterThan(9)
    for (const link of links) {
      const host = new URL(link).host
      expect(host === 'www.evolvedpros.com' || host === 'www.georgeleith.com').toBe(true)
    }
  })
})

describe('llms.txt route shares the sitemap query', () => {
  const sitemap = readFileSync(resolve(__dirname, '../../app/sitemap.ts'), 'utf8')
  const builder = readFileSync(resolve(__dirname, 'llmsTxt.ts'), 'utf8')
  const loader = readFileSync(resolve(__dirname, 'sitemapCatalogue.ts'), 'utf8')
  const route = readFileSync(resolve(__dirname, '../../app/llms.txt/route.ts'), 'utf8')

  it('formats with the sitemap entry helpers', () => {
    for (const name of [
      'toPillarHubSitemapEntries',
      'toEpisodeSitemapEntries',
      'toMediaSitemapEntries',
      'toMediaCategoryLandingSitemapEntries',
    ]) {
      expect(sitemap).toContain(name)
      expect(builder).toContain(name)
    }
    expect(builder).toContain('PUBLIC_SITEMAP_PATHS')
    expect(sitemap).toContain('toStaticSitemapEntries')
  })

  it('loads published episodes, stories, and the same landing counts', () => {
    expect(sitemap).toContain('getPublishedEpisodes')
    expect(loader).toContain('getPublishedEpisodes')
    for (const needle of [
      ".from('media_stories')",
      ".eq('is_published', true)",
      ".from('posts')",
      ".from('events')",
      ".from('lessons')",
      ".from('courses')",
      ".from('job_listings')",
      ".eq('status', 'published')",
    ]) {
      expect(sitemap).toContain(needle)
      expect(loader).toContain(needle)
    }
    expect(loader).not.toContain('NOINDEX_MEDIA_PATHS')
    expect(loader).not.toContain('UNPUBLISHED_MEDIA_PATHS')
  })

  it('returns text/plain 200 with a one-minute cache and no static shadow file', () => {
    expect(route).toContain('status: 200')
    expect(route).toContain('text/plain; charset=utf-8')
    expect(route).toContain('buildLlmsTxt')
    expect(route).toContain('loadLlmsCatalogue')
    expect(route).toContain('export const revalidate = 60')
    expect(LLMS_TXT_CACHE_CONTROL).toBe('public, max-age=60, s-maxage=60, stale-while-revalidate=300')
    expect(existsSync(resolve(__dirname, '../../public/llms.txt'))).toBe(false)
  })

  it('quotes page copy that is not already an export', () => {
    const podcast = readFileSync(resolve(__dirname, '../../app/(public)/podcast/(index)/page.tsx'), 'utf8')
    const careers = readFileSync(resolve(__dirname, '../../app/(public)/media/careers/page.tsx'), 'utf8')
    const series = readFileSync(resolve(__dirname, '../podcast/public.ts'), 'utf8')
    expect(series).toContain(`export const SERIES_NAME = '${LLMS_PODCAST_SERIES_NAME}'`)
    expect(podcast).toContain(LLMS_PODCAST_PAGE_DESCRIPTION)
    expect(careers).toContain(LLMS_CAREERS_PAGE_DESCRIPTION)
  })
})
