import { afterEach, describe, expect, it, vi } from 'vitest'

const HERO = 'https://cdn.example/hero.png'
const INTERNAL_REQUEST = 'https://0.0.0.0:8080/api/cron/media-image-check'

const state = vi.hoisted(() => ({
  rows: [
    {
      id: 'story-1',
      slug: 'owned-hero',
      pillar: 'strategy',
      title: 'Owned',
      featured_image_url: 'https://cdn.example/hero.png',
    },
  ] as Array<{
    id: string
    slug: string
    pillar: string | null
    title: string
    featured_image_url: string | null
  }>,
}))

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: (table: string) => {
      if (table !== 'media_stories') throw new Error(`unexpected table ${table}`)
      return {
        select: () => ({
          eq: () => ({
            neq: () => ({
              lte: async () => ({ data: state.rows, error: null }),
            }),
          }),
        }),
      }
    },
  },
}))

import { GET } from '@/app/api/cron/media-image-check/route'
import { getAppUrl } from '@/lib/urls'

const ENV_KEYS = ['CRON_SECRET', 'NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_SITE_URL'] as const

describe('media image check cron origin', () => {
  const previous = new Map<string, string | undefined>()

  afterEach(() => {
    vi.unstubAllGlobals()
    for (const key of ENV_KEYS) {
      const value = previous.get(key)
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    previous.clear()
  })

  it('checks story pages on getAppUrl, not the inbound request origin', async () => {
    for (const key of ENV_KEYS) previous.set(key, process.env[key])
    process.env.CRON_SECRET = 'cron-secret'
    process.env.NEXT_PUBLIC_APP_URL = 'https://platform.evolvedpros.com'
    delete process.env.NEXT_PUBLIC_SITE_URL

    const fetched: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      fetched.push(url)
      if ((init?.method ?? 'GET') === 'HEAD') {
        return new Response(null, {
          status: 200,
          headers: { 'content-type': 'image/png' },
        })
      }
      return new Response(
        `<html><head><meta property="og:image" content="${HERO}" /></head></html>`,
        { status: 200, headers: { 'content-type': 'text/html' } },
      )
    }))

    const response = await GET(new Request(INTERNAL_REQUEST, {
      headers: { authorization: 'Bearer cron-secret' },
    }))

    expect(response.status).toBe(200)
    const body = await response.json() as { ok: boolean; checked: number }
    expect(body).toMatchObject({ ok: true, checked: 1 })

    const appOrigin = new URL(getAppUrl()).origin
    const pageUrls = fetched.filter((url) => url.includes('/media/'))
    expect(pageUrls).toEqual([`${getAppUrl()}/media/strategy/owned-hero`])
    for (const url of pageUrls) {
      expect(new URL(url).host).toBe(new URL(appOrigin).host)
      expect(new URL(url).origin).toBe(appOrigin)
    }
    expect(fetched.some((url) => url.includes('0.0.0.0'))).toBe(false)
    expect(new URL(INTERNAL_REQUEST).origin).not.toBe(appOrigin)
  })
})
