import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_OG_IMAGE } from '@/lib/seo/canonical'
import {
  checkPublishedStoryImages,
  ogImageIsDefaultLogo,
  readOgImage,
  storyPageUrl,
  storyProofFailures,
  type ThursdayProve,
} from './mediaImageCheck'

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(resolve(here, rel), 'utf8')

const ORIGIN = 'https://platform.evolvedpros.com'
const HERO =
  'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/media-heroes/strategy/hero-16x9.png'
const LOGO = 'https://www.evolvedpros.com/logo_horizontal_navy.png'

function page(og: string): string {
  return `<html><head>
    <meta property="og:image:width" content="1200" />
    <meta content="${og}" property="og:image" />
    <meta property="og:image:alt" content="logo_horizontal_navy.png" />
  </head></html>`
}

function fetchFor(handlers: Record<string, { status: number; contentType?: string; body?: string }>): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const hit = handlers[url]
    if (!hit) return new Response('missing', { status: 599 })
    if ((init?.method ?? 'GET') === 'HEAD') {
      return new Response(null, {
        status: hit.status,
        headers: hit.contentType ? { 'content-type': hit.contentType } : undefined,
      })
    }
    return new Response(hit.body ?? '', {
      status: hit.status,
      headers: { 'content-type': 'text/html' },
    })
  }) as unknown as typeof fetch
}

describe('og:image', () => {
  it('reads the image tag and ignores width, alt, and the logo file name in other tags', () => {
    expect(readOgImage(page(HERO))).toBe(HERO)
    expect(readOgImage('<meta property="og:image" content="https://cdn.example/a.png?x=1&amp;y=2" />'))
      .toBe('https://cdn.example/a.png?x=1&y=2')
    expect(readOgImage('<meta property="og:title" content="nope" />')).toBeNull()
  })

  it('treats the default logo path and its absolute URL as the fallback', () => {
    expect(DEFAULT_OG_IMAGE).toBe('/logo_horizontal_navy.png')
    expect(ogImageIsDefaultLogo(DEFAULT_OG_IMAGE)).toBe(true)
    expect(ogImageIsDefaultLogo(LOGO)).toBe(true)
    expect(ogImageIsDefaultLogo(`https://platform.evolvedpros.com${DEFAULT_OG_IMAGE}`)).toBe(true)
    expect(ogImageIsDefaultLogo(HERO)).toBe(false)
    expect(ogImageIsDefaultLogo(null)).toBe(false)
  })
})

describe('published story image check', () => {
  it('keeps the public page on the app origin', () => {
    expect(storyPageUrl(ORIGIN, { pillar: null, slug: 'hello' }))
      .toBe(`${ORIGIN}/media/general/hello`)
    expect(storyPageUrl(ORIGIN, { pillar: 'mental-toughness', slug: 'a/b' }))
      .toBe(`${ORIGIN}/media/mental-toughness/a%2Fb`)
  })

  it('reports a missing hero and a logo og:image, and passes a loading hero', async () => {
    const goodPage = `${ORIGIN}/media/strategy/owned-hero`
    const badPage = `${ORIGIN}/media/strategy/no-art`
    const fetchImpl = fetchFor({
      [HERO]: { status: 200, contentType: 'image/png', body: page(HERO) },
      [goodPage]: { status: 200, body: page(HERO) },
      [badPage]: { status: 200, body: page(LOGO) },
    })

    const result = await checkPublishedStoryImages({
      origin: ORIGIN,
      fetchImpl,
      stories: [
        {
          slug: 'owned-hero',
          title: 'Owned',
          pillar: 'strategy',
          featured_image_url: HERO,
        },
        {
          slug: 'no-art',
          title: 'No art',
          pillar: 'strategy',
          featured_image_url: null,
        },
      ],
    })

    expect(result.checked).toBe(2)
    expect(result.ok).toBe(false)
    expect(result.failures).toEqual([
      {
        slug: 'no-art',
        title: 'No art',
        reason: 'featured image is missing',
        url: null,
      },
      {
        slug: 'no-art',
        title: 'No art',
        reason: 'og:image is the default logo',
        url: LOGO,
      },
    ])
  })

  it('fails a 200 response that is not an image', async () => {
    const image = 'https://cdn.example/page.html'
    const pageUrl = `${ORIGIN}/media/general/html-hero`
    const fetchImpl = fetchFor({
      [image]: { status: 200, contentType: 'text/html', body: page(HERO) },
      [pageUrl]: { status: 200, body: page(HERO) },
    })
    const result = await checkPublishedStoryImages({
      origin: ORIGIN,
      fetchImpl,
      stories: [{
        slug: 'html-hero',
        title: 'HTML hero',
        pillar: null,
        featured_image_url: image,
      }],
    })
    expect(result.failures.map((failure) => failure.reason)).toEqual([
      'featured image is not an image (HTTP 200)',
    ])
  })

  it('fails when the hero URL does not load or is not an image', async () => {
    const pageUrl = `${ORIGIN}/media/general/broken`
    const image = 'https://cdn.example/missing.png'
    const fetchImpl = fetchFor({
      [image]: { status: 404, contentType: 'text/plain', body: page(HERO) },
      [pageUrl]: { status: 200, body: page(HERO) },
    })
    const result = await checkPublishedStoryImages({
      origin: ORIGIN,
      fetchImpl,
      stories: [{
        slug: 'broken',
        title: 'Broken',
        pillar: null,
        featured_image_url: image,
      }],
    })
    expect(result.ok).toBe(false)
    expect(result.failures[0]).toMatchObject({
      slug: 'broken',
      reason: 'featured image does not load (HTTP 404)',
      url: image,
    })
    expect(result.failures).toHaveLength(1)
  })
})

describe('Thursday publish proof', () => {
  const spec = JSON.parse(read('../../../../docs/media-thursday-publish/PROVE.json')) as ThursdayProve

  it('requires image 200 and an og:image that is not the logo', () => {
    expect(spec.storiesMust.featuredImage).toEqual({
      method: 'HEAD',
      status: 200,
      contentTypePrefix: 'image/',
    })
    expect(spec.storiesMust.ogImage.mustNotEqual).toBe(DEFAULT_OG_IMAGE)
    expect(spec.storiesMust.excludeStoryType).toBe('redirect')
  })

  it('fails a story whose image misses or whose og:image is the logo', () => {
    expect(storyProofFailures({
      imageStatus: 200,
      imageContentType: 'image/png',
      ogImage: HERO,
    }, spec)).toEqual([])
    expect(storyProofFailures({
      imageStatus: 404,
      imageContentType: 'text/html',
      ogImage: HERO,
    }, spec)).toContain('image')
    expect(storyProofFailures({
      imageStatus: 200,
      imageContentType: 'image/png',
      ogImage: LOGO,
    }, spec)).toEqual(['og:image'])
    expect(storyProofFailures({
      imageStatus: 200,
      imageContentType: 'image/png',
      ogImage: DEFAULT_OG_IMAGE,
    }, spec)).toEqual(['og:image'])
  })
})

describe('media image check wiring', () => {
  it('HEADs before publish and maps the database check to 422', () => {
    const post = read('../../app/api/admin/media/route.ts')
    const patch = read('../../app/api/admin/media/[id]/route.ts')
    for (const route of [post, patch]) {
      expect(route).toContain('publishHeroGate')
      expect(route).toContain('mediaStoryWriteFailure')
      expect(route).toContain('status: 422')
    }
  })

  it('checks published non-redirect stories and fails the cron response', () => {
    const route = read('../../app/api/cron/media-image-check/route.ts')
    expect(route).toContain('authorizeCronBearer')
    expect(route).toContain(".eq('is_published', true)")
    expect(route).toContain(".neq('story_type', 'redirect')")
    expect(route).toContain(".lte('published_at'")
    expect(route).toContain('checkPublishedStoryImages')
    expect(route).toContain('status: result.ok ? 200 : 500')
  })

  it('leaves view-count updates off the trigger column list', () => {
    const sql = read('../../../../supabase/migrations/101_media_stories_publish_requires_hero.sql')
    expect(sql).toContain('before insert or update of is_published, featured_image_url, story_type')
    expect(sql).not.toMatch(/update of[^;\n]*\bviews\b/i)
    expect(sql).toContain("new.story_type = 'redirect'")
    expect(sql).toContain("errcode = 'check_violation'")
  })
})
