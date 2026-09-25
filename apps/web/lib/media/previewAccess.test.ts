import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ROBOTS_DISALLOW } from '@/lib/seo/publicRoutes'
import {
  PREVIEW_CACHE_CONTROL,
  PREVIEW_ROBOTS_TAG,
  applyPreviewResponseHeaders,
  isMediaPreviewPath,
} from './previewHeaders'
import {
  PREVIEW_TOKEN_TTL_MS,
  buildPreviewToken,
  previewAccessStatus,
  previewStoryUrl,
  verifyPreviewToken,
} from './previewToken'
import {
  currentUtcWeekStart,
  parseWeekStart,
  storyFallsInWeek,
  unpublishedStories,
} from './previewWeek'
import { mediaStoryHead } from './storyMeta'

const here = dirname(fileURLToPath(import.meta.url))
const NOW = Date.UTC(2026, 8, 18, 12, 0, 0)
const SLUG = 'desk-notes-for-the-week'

let savedSecret: string | undefined
let savedAppUrl: string | undefined

beforeEach(() => {
  savedSecret = process.env.PREVIEW_TOKEN_SECRET
  savedAppUrl = process.env.NEXT_PUBLIC_APP_URL
  process.env.PREVIEW_TOKEN_SECRET = 'preview-test-secret'
  process.env.NEXT_PUBLIC_APP_URL = 'https://platform.evolvedpros.com'
})

afterEach(() => {
  if (savedSecret === undefined) delete process.env.PREVIEW_TOKEN_SECRET
  else process.env.PREVIEW_TOKEN_SECRET = savedSecret
  if (savedAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL
  else process.env.NEXT_PUBLIC_APP_URL = savedAppUrl
})

function storyToken(slug = SLUG, issuedAt = NOW) {
  const token = buildPreviewToken({ kind: 'story', slug }, issuedAt)
  if (!token) throw new Error('expected a token')
  return token
}

describe('preview access', () => {
  it('returns 404 for an anonymous request with no token', () => {
    expect(previewAccessStatus({
      isAdmin: false,
      token: null,
      scope: 'story',
      slug: SLUG,
      now: NOW,
    })).toBe(404)
  })

  it('returns 404 for a bad token', () => {
    const token = storyToken()
    const broken = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`
    expect(previewAccessStatus({
      isAdmin: false,
      token: broken,
      scope: 'story',
      slug: SLUG,
      now: NOW,
    })).toBe(404)
    expect(verifyPreviewToken(broken, NOW).ok).toBe(false)
  })

  it('returns 404 for an expired token and 200 on the 7 day boundary', () => {
    const token = storyToken()
    expect(previewAccessStatus({
      isAdmin: false,
      token,
      scope: 'story',
      slug: SLUG,
      now: NOW + PREVIEW_TOKEN_TTL_MS,
    })).toBe(200)
    expect(previewAccessStatus({
      isAdmin: false,
      token,
      scope: 'story',
      slug: SLUG,
      now: NOW + PREVIEW_TOKEN_TTL_MS + 1,
    })).toBe(404)
  })

  it('returns 200 for an admin without a token', () => {
    expect(previewAccessStatus({
      isAdmin: true,
      token: null,
      scope: 'story',
      slug: SLUG,
      now: NOW,
    })).toBe(200)
    expect(previewAccessStatus({
      isAdmin: true,
      token: 'not-a-token',
      scope: 'week',
      week: '2026-09-21',
      now: NOW,
    })).toBe(200)
  })

  it('returns 200 for a valid story token and 404 when the slug does not match', () => {
    const token = storyToken()
    expect(previewAccessStatus({
      isAdmin: false,
      token,
      scope: 'story',
      slug: SLUG,
      now: NOW + 1000,
    })).toBe(200)
    expect(previewAccessStatus({
      isAdmin: false,
      token,
      scope: 'story',
      slug: 'another-story',
      now: NOW + 1000,
    })).toBe(404)
    expect(previewAccessStatus({
      isAdmin: false,
      token,
      scope: 'week',
      week: '2026-09-21',
      now: NOW,
    })).toBe(404)
  })

  it('returns 200 for a matching week token only', () => {
    const token = buildPreviewToken({ kind: 'week', week: '2026-09-21' }, NOW)
    expect(previewAccessStatus({
      isAdmin: false,
      token,
      scope: 'week',
      week: '2026-09-21',
      now: NOW,
    })).toBe(200)
    expect(previewAccessStatus({
      isAdmin: false,
      token,
      scope: 'week',
      week: '2026-09-28',
      now: NOW,
    })).toBe(404)
  })

  it('mints a platform URL and refuses to mint without a secret', () => {
    const token = storyToken()
    expect(previewStoryUrl(SLUG, token)).toBe(
      `https://platform.evolvedpros.com/media/preview/${SLUG}?token=${token}`,
    )
    expect(token).not.toMatch(/[+/=]/)
    delete process.env.PREVIEW_TOKEN_SECRET
    expect(buildPreviewToken({ kind: 'story', slug: SLUG }, NOW)).toBeNull()
    expect(verifyPreviewToken(token, NOW)).toEqual({ ok: false, reason: 'unconfigured' })
    expect(previewAccessStatus({
      isAdmin: false,
      token,
      scope: 'story',
      slug: SLUG,
      now: NOW,
    })).toBe(404)
  })
})

describe('preview noindex headers', () => {
  it('sets X-Robots-Tag and private no-store', () => {
    const headers = new Headers()
    applyPreviewResponseHeaders(headers)
    expect(headers.get('X-Robots-Tag')).toBe(PREVIEW_ROBOTS_TAG)
    expect(headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    expect(headers.get('Cache-Control')).toBe(PREVIEW_CACHE_CONTROL)
    expect(headers.get('Cache-Control')).toBe('private, no-store')
  })

  it('wires those headers on the preview route and keeps it out of the sitemap', () => {
    const webRoot = resolve(here, '../..')
    const middleware = readFileSync(resolve(webRoot, 'middleware.ts'), 'utf8')
    const nextConfig = readFileSync(resolve(webRoot, 'next.config.mjs'), 'utf8')
    const previewPage = readFileSync(
      resolve(webRoot, 'app/(public)/media/preview/[slug]/page.tsx'),
      'utf8',
    )
    const publicPage = readFileSync(
      resolve(webRoot, 'app/(public)/media/[pillar]/[slug]/page.tsx'),
      'utf8',
    )
    expect(isMediaPreviewPath('/media/preview')).toBe(true)
    expect(isMediaPreviewPath('/media/preview/desk-notes/card')).toBe(true)
    expect(isMediaPreviewPath('/media/foundation/desk-notes')).toBe(false)
    expect(middleware).toContain('applyPreviewResponseHeaders')
    expect(middleware).toContain("'/media/preview'")
    expect(middleware).toContain("'/media/preview/:path*'")
    expect(nextConfig).toContain("source: '/media/preview'")
    expect(nextConfig).toContain("value: 'noindex, nofollow'")
    expect(nextConfig).toContain("value: 'private, no-store'")
    expect(previewPage).toContain('PREVIEW_ROBOTS')
    expect(previewPage).toContain('notFound()')
    expect(previewPage).toContain('MediaStoryDocument')
    expect(publicPage).toContain(".eq('is_published', true)")
    expect(publicPage).not.toContain('draftMode')
    expect([...ROBOTS_DISALLOW]).toContain('/media/preview')
    expect([...ROBOTS_DISALLOW]).not.toContain('/media')
  })
})

describe('preview week index', () => {
  it('treats the week query as a 7 day UTC window and drops published rows', () => {
    expect(parseWeekStart('2026-09-21')).toBe('2026-09-21')
    expect(parseWeekStart('2026-02-31')).toBeNull()
    expect(currentUtcWeekStart(new Date(Date.UTC(2026, 8, 25, 18)))).toBe('2026-09-21')
    expect(storyFallsInWeek({ updated_at: '2026-09-21T00:00:00.000Z' }, '2026-09-21')).toBe(true)
    expect(storyFallsInWeek({ updated_at: '2026-09-28T00:00:00.000Z' }, '2026-09-21')).toBe(false)
    expect(unpublishedStories([
      { slug: 'live', is_published: true },
      { slug: 'draft', is_published: false },
      { slug: 'unset', is_published: null },
    ]).map(row => row.slug)).toEqual(['draft', 'unset'])
  })
})

describe('mediaStoryHead', () => {
  it('strips em dashes from the social title and description', () => {
    const head = mediaStoryHead({
      title: 'Desk notes',
      slug: SLUG,
      excerpt: 'A short line',
      seo_title: 'Desk notes \u2014 the draft',
      seo_description: 'Read this \u2014 then decide',
      featured_image_url: '/brand/architecture-still-dark.svg',
      author: 'George Leith',
    })
    expect(head.title).not.toContain('\u2014')
    expect(head.description).not.toContain('\u2014')
    expect(head.byline).toBe('George Leith')
  })
})
