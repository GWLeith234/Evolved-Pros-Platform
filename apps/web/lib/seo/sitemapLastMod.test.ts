import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { HOME_CONTENT_CARDS } from '@/lib/ads/rhythm'
import { HOME_MEDIA_STORY_COUNT } from '@/lib/home/conversion'
import { toMediaSitemapEntries } from '@/lib/media/sitemap'
import {
  toMediaCategoryLandingSitemapEntries,
  type MediaCategoryLandingSignals,
} from './mediaCategoryLandings'
import {
  MEDIA_PILLAR_HUB_PATHS,
  PUBLIC_SITEMAP_PATHS,
} from './publicRoutes'
import {
  COMMUNITY_LISTING_LIMIT,
  HOME_LISTED_EPISODES,
  HOME_LISTED_STORIES,
  MEDIA_HUB_EPISODE_LISTING_LIMIT,
  MEDIA_SECTION_LISTING_LIMIT,
  PODCAST_INDEX_LISTING_LIMIT,
  STATIC_SITEMAP_COPY_LAST_MODIFIED,
  hubLastModified,
  staticPageLastModified,
  toEpisodeSitemapEntries,
  toPillarHubSitemapEntries,
  toStaticSitemapEntries,
} from './sitemapEntries'
import {
  homeListingLastModified,
  mediaHubListingLastModified,
  pillarHubLastModifiedMap,
  podcastListingLastModified,
  staticSitemapLastModified,
} from './sitemapListings'

const BASE = 'https://www.evolvedpros.com'
const W3C = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/

const STORY_UPDATED = '2026-09-02T00:00:00.000Z'
const EPISODE_UPDATED = '2026-09-29T02:06:33.000Z'
const OFF_HOME_UPDATED = '2026-12-01T00:00:00.000Z'

const episodes = [
  { slug: 'newest', published_at: '2026-09-01T00:00:00.000Z', updated_at: EPISODE_UPDATED },
  { slug: 'older', published_at: '2026-08-01T00:00:00.000Z', updated_at: '2026-08-02T00:00:00.000Z' },
  { slug: 'edited-off-home', published_at: '2026-01-01T00:00:00.000Z', updated_at: OFF_HOME_UPDATED },
]

const stories = [
  {
    pillar: 'strategy',
    slug: 'close-the-gap',
    section: null,
    tags: [] as string[],
    is_published: true,
    published_at: '2026-07-01T00:00:00.000Z',
    updated_at: STORY_UPDATED,
  },
]

function signals(): MediaCategoryLandingSignals {
  return {
    stories,
    communityPostCount: 1,
    communityListedPosts: [{ updated_at: '2026-06-01T00:00:00.000Z', created_at: '2026-05-01T00:00:00.000Z' }],
    communitySourcePosts: [{ updated_at: '2026-11-01T00:00:00.000Z' }],
    publishedEventTitles: ['EVOLVED book launches October 15', 'Conquer Local Podcast launches'],
    publishedEvents: [
      { title: 'EVOLVED book launches October 15', created_at: '2026-04-01T00:00:00.000Z' },
      { title: 'Conquer Local Podcast launches', created_at: '2026-12-15T00:00:00.000Z' },
    ],
    publishedLessonCount: 1,
    academyLessons: [
      { created_at: '2026-03-01T00:00:00.000Z' },
      { created_at: '2026-03-02T00:00:00.000Z' },
    ],
    publishedCourseCount: 1,
    academyCourses: [{ created_at: '2026-02-01T00:00:00.000Z' }],
    publishedJobCount: 0,
  }
}

function entryDate(urlSuffix: string, entries: ReadonlyArray<{ url: string; lastModified?: Date }>): Date {
  const found = entries.find(entry => entry.url === `${BASE}${urlSuffix}` || (urlSuffix === '/' && entry.url === BASE))
  if (!found?.lastModified) throw new Error(`missing lastmod for ${urlSuffix}`)
  return found.lastModified
}

describe('sitemap lastmod', () => {
  const dates = staticSitemapLastModified({
    episodes,
    stories,
    fitMoves: [{ updated_at: '2026-08-01T00:00:00.000Z' }],
    pricingContent: new Date('2026-11-02T00:00:00.000Z'),
  })
  const freq = Object.fromEntries(PUBLIC_SITEMAP_PATHS.map(path => [path, 'yearly' as const])) as Record<
    (typeof PUBLIC_SITEMAP_PATHS)[number],
    'yearly'
  >
  const priority = Object.fromEntries(PUBLIC_SITEMAP_PATHS.map(path => [path, 0.4])) as Record<
    (typeof PUBLIC_SITEMAP_PATHS)[number],
    number
  >
  const pillarDates = pillarHubLastModifiedMap(stories)
  const entries = [
    ...toStaticSitemapEntries(BASE, freq, priority, dates),
    ...toPillarHubSitemapEntries(BASE, pillarDates),
    ...toEpisodeSitemapEntries(BASE, episodes),
    ...toMediaSitemapEntries(BASE, stories),
    ...toMediaCategoryLandingSitemapEntries(BASE, signals()),
  ]

  it('gives every fixture entry a W3C lastmod', () => {
    expect(entries.length).toBeGreaterThan(PUBLIC_SITEMAP_PATHS.length)
    for (const entry of entries) {
      const lastModified = entry.lastModified
      expect(lastModified, entry.url).toBeInstanceOf(Date)
      if (!lastModified) throw new Error(`missing lastmod for ${entry.url}`)
      expect(Number.isNaN(lastModified.getTime()), entry.url).toBe(false)
      expect(lastModified.toISOString(), entry.url).toMatch(W3C)
    }
    const once = JSON.stringify(entries)
    const twice = JSON.stringify([
      ...toStaticSitemapEntries(BASE, freq, priority, staticSitemapLastModified({
        episodes,
        stories,
        fitMoves: [{ updated_at: '2026-08-01T00:00:00.000Z' }],
        pricingContent: new Date('2026-11-02T00:00:00.000Z'),
      })),
      ...toPillarHubSitemapEntries(BASE, pillarHubLastModifiedMap(stories)),
      ...toEpisodeSitemapEntries(BASE, episodes),
      ...toMediaSitemapEntries(BASE, stories),
      ...toMediaCategoryLandingSitemapEntries(BASE, signals()),
    ])
    expect(once).toBe(twice)
  })

  it('sets a hub lastmod to the newest listed child, not an unlisted row', () => {
    expect(entryDate('/', entries)).toEqual(new Date(EPISODE_UPDATED))
    expect(entryDate('/podcast', entries)).toEqual(new Date(OFF_HOME_UPDATED))
    expect(entryDate('/media', entries)).toEqual(new Date(OFF_HOME_UPDATED))
    expect(entryDate('/media/strategy', entries)).toEqual(new Date(STORY_UPDATED))
    expect(entryDate('/media/evolved-architecture', entries)).toEqual(new Date(STORY_UPDATED))
    expect(entryDate('/media/community', entries)).toEqual(new Date('2026-06-01T00:00:00.000Z'))
    expect(entryDate('/media/academy', entries)).toEqual(new Date('2026-03-02T00:00:00.000Z'))
    expect(entryDate('/media/events', entries)).toEqual(new Date('2026-04-01T00:00:00.000Z'))

    expect(homeListingLastModified({ episodes, stories, fitMoves: [] })).toEqual(new Date(EPISODE_UPDATED))
    expect(homeListingLastModified({
      episodes,
      stories,
      fitMoves: [
        { updated_at: '2026-08-01T00:00:00.000Z' },
        { updated_at: '2026-12-20T00:00:00.000Z' },
      ],
    })).toEqual(new Date(EPISODE_UPDATED))
    expect(homeListingLastModified({
      episodes,
      stories,
      fitMoves: [{ updated_at: '2026-12-20T00:00:00.000Z' }],
    })).toEqual(new Date('2026-12-20T00:00:00.000Z'))
    expect(podcastListingLastModified(episodes)).toEqual(new Date(OFF_HOME_UPDATED))
    expect(mediaHubListingLastModified(stories, episodes)).toEqual(new Date(OFF_HOME_UPDATED))
  })

  it('falls back to the data source when the listed rows have no stamp', () => {
    const episodesOffTheHomeRow = [
      { slug: 'a', published_at: null, updated_at: null },
      { slug: 'b', published_at: null, updated_at: null },
      { slug: 'c', published_at: null, updated_at: '2026-05-05T00:00:00.000Z' },
    ]
    expect(homeListingLastModified({
      episodes: episodesOffTheHomeRow,
      stories: [],
      fitMoves: [],
    })).toEqual(new Date('2026-05-05T00:00:00.000Z'))

    const podcastPage = Array.from({ length: PODCAST_INDEX_LISTING_LIMIT }, () => ({
      slug: 'blank',
      published_at: null,
      updated_at: null,
    }))
    expect(podcastListingLastModified([
      ...podcastPage,
      { slug: 'older', published_at: '2026-05-05T00:00:00.000Z', updated_at: null },
    ])).toEqual(new Date('2026-05-05T00:00:00.000Z'))
  })

  it('ignores a pillar story outside the 24 the page renders', () => {
    const rows = Array.from({ length: 25 }, (_, index) => ({
      pillar: 'foundation',
      slug: `story-${index}`,
      is_published: true,
      published_at: `2026-01-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
      updated_at: index === 0 ? '2026-12-31T00:00:00.000Z' : '2026-02-01T00:00:00.000Z',
    }))
    // published_at desc puts story-24 (Jan 25) first and story-0 (Jan 1) outside the window.
    const datesByPillar = pillarHubLastModifiedMap(rows)
    expect(datesByPillar['/media/foundation']).toEqual(new Date('2026-02-01T00:00:00.000Z'))
  })

  it('uses a content record when it is newer than the copy constant, else the constant', () => {
    expect(staticPageLastModified('/pricing', new Date('2026-11-02T00:00:00.000Z')))
      .toEqual(new Date('2026-11-02T00:00:00.000Z'))
    expect(staticPageLastModified('/pricing', new Date('2020-01-01T00:00:00.000Z')).toISOString())
      .toBe(STATIC_SITEMAP_COPY_LAST_MODIFIED['/pricing'])
    expect(staticPageLastModified('/terms').toISOString()).toBe(STATIC_SITEMAP_COPY_LAST_MODIFIED['/terms'])
    expect(entryDate('/pricing', entries).toISOString()).toBe('2026-11-02T00:00:00.000Z')
    expect(entryDate('/fit', entries).toISOString()).toBe(STATIC_SITEMAP_COPY_LAST_MODIFIED['/fit'])
    expect(entryDate('/live', entries).toISOString()).toBe(STATIC_SITEMAP_COPY_LAST_MODIFIED['/live'])
    expect(entryDate('/about', entries).toISOString()).toBe(STATIC_SITEMAP_COPY_LAST_MODIFIED['/about'])
    expect(hubLastModified(undefined, STATIC_SITEMAP_COPY_LAST_MODIFIED['/']).toISOString())
      .toBe(STATIC_SITEMAP_COPY_LAST_MODIFIED['/'])
  })

  it('keeps the public URL order and does not read the clock', () => {
    expect(entries.slice(0, PUBLIC_SITEMAP_PATHS.length).map(entry => new URL(entry.url).pathname))
      .toEqual([...PUBLIC_SITEMAP_PATHS])
    expect(entries.slice(PUBLIC_SITEMAP_PATHS.length, PUBLIC_SITEMAP_PATHS.length + MEDIA_PILLAR_HUB_PATHS.length)
      .map(entry => new URL(entry.url).pathname))
      .toEqual([...MEDIA_PILLAR_HUB_PATHS])

    expect(HOME_LISTED_EPISODES).toBe(HOME_CONTENT_CARDS)
    expect(HOME_LISTED_STORIES).toBe(HOME_MEDIA_STORY_COUNT)
    expect(PODCAST_INDEX_LISTING_LIMIT).toBe(100)
    expect(MEDIA_HUB_EPISODE_LISTING_LIMIT).toBe(5)
    expect(MEDIA_SECTION_LISTING_LIMIT).toBe(24)
    expect(COMMUNITY_LISTING_LIMIT).toBe(8)

    const page = (rel: string) => readFileSync(resolve(__dirname, rel), 'utf8')
    expect(page('../../app/(public)/podcast/(index)/page.tsx')).toMatch(/\.limit\(100\)/)
    expect(page('../../app/(public)/media/(hub)/page.tsx')).toMatch(/\.limit\(5\)/)
    expect(page('../../app/(public)/media/[pillar]/page.tsx')).toMatch(/\.limit\(24\)/)
    expect(page('../../app/(public)/media/community/page.tsx')).toMatch(/\.limit\(8\)/)
    expect(page('../../app/sitemap.ts')).toContain('COMMUNITY_LISTING_LIMIT')
    expect(page('../../app/sitemap.ts')).not.toMatch(/new Date\(\s*\)/)
    expect(page('sitemapListings.ts')).not.toMatch(/new Date\(\s*\)/)
    expect(page('sitemapEntries.ts')).not.toMatch(/new Date\(\s*\)/)
  })
})
