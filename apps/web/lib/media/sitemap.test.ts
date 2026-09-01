import { describe, expect, it } from 'vitest'
import {
  isListedPublicMediaStory,
  listPublicMediaStories,
  mediaArticlePath,
  toMediaSitemapEntries,
} from './sitemap'

const BASE = 'https://platform.evolvedpros.com'

describe('mediaArticlePath', () => {
  it('uses the pillar column as the live /media/{pillar}/{slug} segment', () => {
    expect(mediaArticlePath('mental-toughness', 'stay-in-the-fight')).toBe(
      '/media/mental-toughness/stay-in-the-fight',
    )
  })

  it('skips rows missing pillar or slug', () => {
    expect(mediaArticlePath(null, 'some-slug')).toBeNull()
    expect(mediaArticlePath('strategy', null)).toBeNull()
    expect(mediaArticlePath('', 'some-slug')).toBeNull()
    expect(mediaArticlePath('  ', 'some-slug')).toBeNull()
    expect(mediaArticlePath('strategy', '  ')).toBeNull()
  })
})

describe('toMediaSitemapEntries', () => {
  it('emits published articles with episode-matching lastmod / changefreq / priority', () => {
    const publishedAt = '2026-08-01T12:00:00.000Z'
    const [entry] = toMediaSitemapEntries(BASE, [
      {
        pillar: 'strategy',
        slug: 'close-the-gap',
        published_at: publishedAt,
        is_published: true,
      },
    ])
    expect(entry).toEqual({
      url: `${BASE}/media/strategy/close-the-gap`,
      lastModified: new Date(publishedAt),
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  })

  it('excludes unpublished stories and incomplete rows', () => {
    const entries = toMediaSitemapEntries(BASE, [
      { pillar: 'identity', slug: 'draft-story', published_at: null, is_published: false },
      { pillar: null, slug: 'no-pillar', published_at: null, is_published: true },
      { pillar: 'foundation', slug: null, published_at: null, is_published: true },
      { pillar: 'execution', slug: 'ship-it', published_at: null, is_published: true },
    ])
    expect(entries.map(e => e.url)).toEqual([`${BASE}/media/execution/ship-it`])
  })

  it('does not add /login', () => {
    const entries = toMediaSitemapEntries(BASE, [
      { pillar: 'foundation', slug: 'first-principles', published_at: null, is_published: true },
    ])
    expect(entries.some(e => e.url.includes('/login'))).toBe(false)
  })

  it('skips the two known unpublished slugs even if is_published is wrongly true', () => {
    const entries = toMediaSitemapEntries(BASE, [
      {
        pillar: 'execution',
        slug: 'why-elite-sales-teams-swear-by-ritual-not-motivation',
        published_at: null,
        is_published: true,
      },
      {
        pillar: 'strategy',
        slug: 'build-repeatable-sales-strategy-framework',
        published_at: null,
        is_published: true,
      },
      { pillar: 'identity', slug: 'real-article', published_at: null, is_published: true },
    ])
    expect(entries.map(e => e.url)).toEqual([`${BASE}/media/identity/real-article`])
  })
})

describe('listPublicMediaStories', () => {
  it('keeps every published story so the /media hub is not capped at 30', () => {
    const rows = Array.from({ length: 36 }, (_, i) => ({
      pillar: 'foundation',
      slug: `story-${i + 1}`,
      is_published: true as const,
    }))
    expect(listPublicMediaStories(rows)).toHaveLength(36)
  })

  it('excludes unpublished rows and the two known unpublished slugs', () => {
    const listed = listPublicMediaStories([
      { pillar: 'identity', slug: 'real-article', is_published: true },
      { pillar: 'execution', slug: 'draft', is_published: false },
      {
        pillar: 'execution',
        slug: 'why-elite-sales-teams-swear-by-ritual-not-motivation',
        is_published: true,
      },
      {
        pillar: 'strategy',
        slug: 'build-repeatable-sales-strategy-framework',
        is_published: true,
      },
    ])
    expect(listed.map(s => s.slug)).toEqual(['real-article'])
  })

  it('drops rows missing pillar or slug', () => {
    expect(
      isListedPublicMediaStory({ pillar: null, slug: 'no-pillar', is_published: true }),
    ).toBe(false)
    expect(
      isListedPublicMediaStory({ pillar: 'strategy', slug: null, is_published: true }),
    ).toBe(false)
  })
})
