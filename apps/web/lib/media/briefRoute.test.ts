import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BRIEF_BODY_MAX } from './brief'

const upserts = vi.hoisted(() => [] as Array<Record<string, unknown>>)
const writeError = vi.hoisted(() => ({
  current: null as { code: string; message: string } | null,
}))

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: () => ({
      upsert: (values: Record<string, unknown>) => {
        upserts.push(values)
        return Promise.resolve({ error: writeError.current })
      },
    }),
  },
}))

import { POST } from '@/app/api/media/brief/route'

function post(body: string, ip: string, extraHeaders?: Record<string, string>) {
  return new Request('http://localhost/api/media/brief', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
      ...extraHeaders,
    },
    body,
  })
}

const VALID = JSON.stringify({
  email: '  George@EvolvedPros.COM ',
  source: 'media-rail',
  path: '/media/accountability/some-story',
  website: '',
  role: 'admin',
})

describe('POST /api/media/brief', () => {
  beforeEach(() => {
    upserts.length = 0
    writeError.current = null
  })

  it('rejects an oversized body with 413 and does not write', async () => {
    const res = await POST(post('x'.repeat(BRIEF_BODY_MAX + 1), '203.0.113.1'))
    expect(res.status).toBe(413)
    expect(await res.json()).toEqual({ error: 'payload_too_large' })
    expect(upserts).toEqual([])
  })

  it('rejects a declared Content-Length past the cap before trusting the body', async () => {
    const res = await POST(
      post(VALID, '203.0.113.2', { 'content-length': String(BRIEF_BODY_MAX + 50) }),
    )
    expect(res.status).toBe(413)
    expect(upserts).toEqual([])
  })

  it('rejects invalid JSON and a non-object body with 400', async () => {
    for (const [body, ip] of [
      ['{', '203.0.113.10'],
      ['null', '203.0.113.11'],
      ['[]', '203.0.113.12'],
      ['"george@evolvedpros.com"', '203.0.113.13'],
    ] as const) {
      const res = await POST(post(body, ip))
      expect(res.status, body).toBe(400)
      expect(await res.json()).toEqual({ error: 'invalid_request' })
    }
    expect(upserts).toEqual([])
  })

  it('rejects an invalid email with 422', async () => {
    const res = await POST(post(JSON.stringify({ email: 'george' }), '203.0.113.3'))
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ error: 'invalid_email' })
    expect(upserts).toEqual([])
  })

  it('accepts a normal signup and stores only the brief columns', async () => {
    const res = await POST(post(VALID, '203.0.113.4'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(upserts).toHaveLength(1)
    expect(upserts[0]).toMatchObject({
      email: 'george@evolvedpros.com',
      source: 'media-rail',
      source_path: '/media/accountability/some-story',
      status: 'subscribed',
      unsubscribed_at: null,
    })
    expect(upserts[0]).not.toHaveProperty('role')
  })

  it('answers 200 for a honeypot and does not let it consume the rate limit', async () => {
    const bot = JSON.stringify({ email: 'bot@example.com', website: 'https://spam.example' })
    for (let i = 0; i < 6; i++) {
      const res = await POST(post(bot, '203.0.113.5'))
      expect(res.status).toBe(200)
    }
    expect(upserts).toEqual([])

    const res = await POST(post(VALID, '203.0.113.5'))
    expect(res.status).toBe(200)
    expect(upserts).toHaveLength(1)
  })

  it('does not burn the rate limit on invalid emails', async () => {
    for (let i = 0; i < 6; i++) {
      const res = await POST(post(JSON.stringify({ email: 'not-an-email' }), '203.0.113.6'))
      expect(res.status).toBe(422)
    }
    const res = await POST(post(VALID, '203.0.113.6'))
    expect(res.status).toBe(200)
    expect(upserts).toHaveLength(1)
  })

  it('returns 429 after five well-formed signups from the same IP', async () => {
    for (let i = 0; i < 5; i++) {
      const body = JSON.stringify({ email: `reader${i}@evolvedpros.com`, website: '' })
      const res = await POST(post(body, '203.0.113.7'))
      expect(res.status).toBe(200)
    }
    const blocked = await POST(
      post(JSON.stringify({ email: 'reader6@evolvedpros.com', website: '' }), '203.0.113.7'),
    )
    expect(blocked.status).toBe(429)
    expect(await blocked.json()).toEqual({ error: 'rate_limited' })
    expect(upserts).toHaveLength(5)

    const otherIp = await POST(
      post(JSON.stringify({ email: 'reader7@evolvedpros.com', website: '' }), '203.0.113.8'),
    )
    expect(otherIp.status).toBe(200)
    expect(upserts).toHaveLength(6)
  })
})
