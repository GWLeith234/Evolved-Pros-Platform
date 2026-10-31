import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PILLAR_SLUGS } from '@/lib/pillars'
import {
  locationForPublishedStory,
  MEDIA_SLUG_FALLBACK_CACHE,
  MEDIA_STATIC_SECTIONS,
  mediaSlugCandidate,
} from './slugRedirect'

const db = vi.hoisted(() => ({
  calls: 0,
  publishedFilter: undefined as unknown,
  row: null as null | { pillar: string | null; slug: string },
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table !== 'media_stories') throw new Error(`unexpected table ${table}`)
      const builder = {
        select: () => builder,
        eq: (column: string, value: unknown) => {
          if (column === 'is_published') db.publishedFilter = value
          return builder
        },
        limit: () => builder,
        maybeSingle: async () => {
          db.calls += 1
          if (db.publishedFilter !== true) return { data: null, error: { message: 'missing published filter' } }
          return { data: db.row, error: null }
        },
      }
      return builder
    },
  }),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}))

import { middleware } from '../../middleware'

const here = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(here, '../..')
const WWW = 'https://www.evolvedpros.com'

function call(path: string, init?: { rsc?: boolean }) {
  const headers = new Headers()
  if (init?.rsc) headers.set('RSC', '1')
  return middleware(new NextRequest(new URL(path, WWW), { headers }))
}

beforeEach(() => {
  db.calls = 0
  db.publishedFilter = undefined
  db.row = null
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://placeholder.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-test-key')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('mediaSlugCandidate', () => {
  it('ignores the hub, nested articles, pillars, and static sections', () => {
    expect(mediaSlugCandidate('/media')).toBeNull()
    expect(mediaSlugCandidate('/media/')).toBeNull()
    expect(mediaSlugCandidate('/media/strategy/geo-chatgpt-blind')).toBeNull()
    expect(mediaSlugCandidate('/podcast')).toBeNull()
    for (const pillar of [...PILLAR_SLUGS, 'general']) {
      expect(mediaSlugCandidate(`/media/${pillar}`), pillar).toBeNull()
      expect(mediaSlugCandidate(`/media/${pillar}/`), pillar).toBeNull()
    }
    for (const section of MEDIA_STATIC_SECTIONS) {
      expect(mediaSlugCandidate(`/media/${section}`), section).toBeNull()
    }
  })

  it('keeps every static media folder reserved', () => {
    const folders = readdirSync(resolve(webRoot, 'app/(public)/media'), { withFileTypes: true })
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('(') && !entry.name.startsWith('['))
      .map(entry => entry.name)
    expect(folders.length).toBeGreaterThan(0)
    for (const folder of folders) {
      expect(MEDIA_STATIC_SECTIONS, folder).toContain(folder)
      expect(mediaSlugCandidate(`/media/${folder}`)).toBeNull()
    }
  })

  it('treats a bare slug, with or without a trailing slash, as a candidate', () => {
    expect(mediaSlugCandidate('/media/geo-chatgpt-blind')).toBe('geo-chatgpt-blind')
    expect(mediaSlugCandidate('/media/geo-chatgpt-blind/')).toBe('geo-chatgpt-blind')
  })
})

describe('locationForPublishedStory', () => {
  it('uses the pillar, and general when the pillar is null', () => {
    expect(locationForPublishedStory({ pillar: 'strategy', slug: 'geo-chatgpt-blind' }))
      .toBe('/media/strategy/geo-chatgpt-blind')
    expect(locationForPublishedStory({ pillar: null, slug: 'desk-notes' }))
      .toBe('/media/general/desk-notes')
    expect(locationForPublishedStory({ pillar: 'null', slug: 'desk-notes' }))
      .toBe('/media/general/desk-notes')
  })

  it('rejects segments that are not a single path piece', () => {
    expect(locationForPublishedStory({ pillar: 'strategy', slug: '../admin' })).toBeNull()
    expect(locationForPublishedStory({ pillar: 'https://evil.example', slug: 'ok' })).toBeNull()
    expect(locationForPublishedStory({ pillar: 'strategy', slug: 'a/b' })).toBeNull()
  })
})

describe('middleware /media/<slug> fallback', () => {
  it('301s a published slug with Location and does not cache the response', async () => {
    db.row = { pillar: 'strategy', slug: 'geo-chatgpt-blind' }
    const res = await call('/media/geo-chatgpt-blind?utm=newsletter')
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe(
      'https://www.evolvedpros.com/media/strategy/geo-chatgpt-blind?utm=newsletter',
    )
    expect(res.headers.get('cache-control')).toBe(MEDIA_SLUG_FALLBACK_CACHE)
    expect(db.calls).toBe(1)
    expect(db.publishedFilter).toBe(true)
  })

  it('301s the same way when the client asks for an RSC payload', async () => {
    db.row = { pillar: null, slug: 'desk-notes' }
    const res = await call('/media/desk-notes/', { rsc: true })
    expect(res.status).toBe(301)
    expect(new URL(res.headers.get('location')!).pathname).toBe('/media/general/desk-notes')
    expect(res.headers.get('cache-control')).toBe(MEDIA_SLUG_FALLBACK_CACHE)
  })

  it('404s a missing slug without a Location header and does not cache it', async () => {
    const res = await call('/media/not-a-story')
    expect(res.status).toBe(404)
    expect(res.headers.get('location')).toBeNull()
    expect(res.headers.get('cache-control')).toBe(MEDIA_SLUG_FALLBACK_CACHE)
    expect(db.calls).toBe(1)
  })

  it('404s when the stored slug is not a safe path segment', async () => {
    db.row = { pillar: 'strategy', slug: 'https://evil.example' }
    const res = await call('/media/bad-slug')
    expect(res.status).toBe(404)
    expect(res.headers.get('location')).toBeNull()
  })

  it('leaves known pillars, static sections, the hub, and article URLs at 200', async () => {
    const paths = [
      '/media',
      '/media/strategy',
      '/media/general',
      '/media/podcast',
      '/media/academy',
      '/media/preview',
      '/media/strategy/geo-chatgpt-blind',
    ]
    for (const path of paths) {
      db.calls = 0
      const res = await call(path)
      expect(res.status, path).toBe(200)
      expect(res.headers.get('location'), path).toBeNull()
      expect(db.calls, path).toBe(0)
    }
  })

  it('does not redirect from the cached pillar page', () => {
    const page = readFileSync(resolve(webRoot, 'app/(public)/media/[pillar]/page.tsx'), 'utf8')
    const middlewareSrc = readFileSync(resolve(webRoot, 'middleware.ts'), 'utf8')
    expect(page).not.toContain('permanentRedirect')
    expect(page).toContain('notFound()')
    expect(middlewareSrc).toContain('NextResponse.redirect(destination, 301)')
    expect(middlewareSrc).toContain("'/media/:path*'")
    const fallback = middlewareSrc.indexOf('await mediaSlugFallback(request)')
    const publicPassthrough = middlewareSrc.indexOf('PUBLIC_ROUTES.some')
    expect(fallback).toBeGreaterThan(-1)
    expect(fallback).toBeLessThan(publicPassthrough)
  })
})
