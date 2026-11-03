/**
 * Outbound fetches of request input or stored URLs must not reach loopback,
 * private ranges, or cloud metadata — including via redirect.
 */
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchPublicResource } from './publicFetch'

const PUBLIC = ['8.8.8.8']

function okText(body: string, status = 200, headers?: HeadersInit): Response {
  return new Response(body, { status, headers })
}

describe('fetchPublicResource', () => {
  it('fetches a public https URL and does not follow redirects itself', async () => {
    const calls: Array<{ url: string; redirect: RequestRedirect | undefined }> = []
    const result = await fetchPublicResource('https://cdn.example/episode.mp3', {
      lookup: async () => PUBLIC,
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), redirect: init?.redirect })
        return okText('audio-bytes')
      },
    })

    expect(calls).toEqual([{ url: 'https://cdn.example/episode.mp3', redirect: 'manual' }])
    expect(result.ok).toBe(true)
    if (result.ok) expect(await result.response.text()).toBe('audio-bytes')
  })

  it('does not fetch loopback, private, metadata, or non-http targets', async () => {
    const targets = [
      'http://127.0.0.1/',
      'http://127.0.0.1:8080/latest/meta-data/',
      'http://2130706433/',
      'http://169.254.169.254/latest/meta-data/',
      'http://10.0.0.8/',
      'http://192.168.1.1/',
      'http://172.16.5.5/',
      'http://[::1]/',
      'http://[::ffff:169.254.169.254]/',
      'http://localhost/server-status',
      'http://metadata.google.internal/computeMetadata/v1/',
      'file:///etc/passwd',
    ]
    for (const target of targets) {
      let called = false
      const result = await fetchPublicResource(target, {
        lookup: async () => {
          throw new Error('lookup should not run for a literal block')
        },
        fetchImpl: async () => {
          called = true
          return okText('secret')
        },
      })
      expect(result.ok, target).toBe(false)
      expect(called, target).toBe(false)
    }
  })

  it('does not fetch a hostname that resolves to a private address', async () => {
    let called = false
    const result = await fetchPublicResource('https://rebind.example/meta', {
      lookup: async () => ['169.254.169.254'],
      fetchImpl: async () => {
        called = true
        return okText('secret')
      },
    })
    expect(result).toEqual({ ok: false, reason: 'dns' })
    expect(called).toBe(false)
  })

  it('does not follow a redirect onto a metadata or loopback host', async () => {
    const calls: string[] = []
    const result = await fetchPublicResource('https://cdn.example/start', {
      lookup: async () => PUBLIC,
      fetchImpl: async (url) => {
        calls.push(String(url))
        return okText('', 302, { location: 'http://169.254.169.254/latest/meta-data/' })
      },
    })
    expect(result.ok).toBe(false)
    expect(calls).toEqual(['https://cdn.example/start'])
  })

  it('follows a redirect to another public host', async () => {
    const calls: string[] = []
    const result = await fetchPublicResource('https://cdn.example/start', {
      lookup: async () => PUBLIC,
      fetchImpl: async (url) => {
        const href = String(url)
        calls.push(href)
        if (href.endsWith('/start')) {
          return okText('', 302, { location: 'https://audio.example/file.mp3' })
        }
        return okText('audio')
      },
    })
    expect(calls).toEqual(['https://cdn.example/start', 'https://audio.example/file.mp3'])
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.url).toBe('https://audio.example/file.mp3')
      expect(await result.response.text()).toBe('audio')
    }
  })
})

describe('untrusted URL fetch call sites', () => {
  function source(relativePath: string): string {
    return readFileSync(new URL(relativePath, import.meta.url), 'utf8')
  }

  function between(text: string, start: string, end: string): string {
    const from = text.indexOf(start)
    const to = text.indexOf(end, from + start.length)
    expect(from).toBeGreaterThanOrEqual(0)
    expect(to).toBeGreaterThan(from)
    return text.slice(from, to)
  }

  it('sends admin audio, cover photos, and stored thumbnails through the guard', () => {
    const transcribe = source('../../app/api/admin/transcribe/route.ts')
    expect(transcribe).toContain('fetchPublicResource(audioUrl')
    expect(transcribe).not.toContain('fetch(audioUrl')
    expect(transcribe).toContain('Could not reach audio URL')
    expect(transcribe).not.toContain('Could not reach audio URL:')

    const cover = between(
      source('../../app/api/admin/episodes/cover/route.tsx'),
      'async function fetchAsDataUri',
      'export async function POST',
    )
    expect(cover).toContain('fetchPublicResource(url')
    expect(cover).not.toContain('await fetch(')

    const social = between(
      source('../../app/api/social/[template]/route.tsx'),
      'async function fetchImage',
      'async function loadEpisode',
    )
    expect(social).toContain('fetchPublicResource(url')
    expect(social).not.toContain('await fetch(')

    const portrait = source('../../app/api/admin/episodes/[episodeId]/guest-portrait/route.ts')
    expect(portrait).toContain('fetchPublicResource(item.url')
    expect(portrait).not.toContain('fetch(item.url')

    const generated = source('../../app/api/admin/images/generate/route.ts')
    expect(generated).toContain('fetchPublicResource(url')
    expect(generated).not.toContain('await fetch(')
  })
})

const transcribeMock = vi.hoisted(() => vi.fn(async () => 'transcribed line'))

vi.mock('openai', () => ({
  default: class OpenAI {
    audio = { transcriptions: { create: transcribeMock } }
  },
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      update: () => ({
        eq: async () => ({ error: null }),
      }),
    }),
  }),
}))

vi.mock('@/lib/admin/helpers', () => ({
  requireAdminApi: async () => ({ userId: 'admin-1' }),
}))

vi.mock('node:dns/promises', () => ({
  lookup: async () => [{ address: '8.8.8.8', family: 4 }],
}))

import { POST as transcribePost } from '@/app/api/admin/transcribe/route'

describe('POST /api/admin/transcribe', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function post(audioUrl: string) {
    return transcribePost(new Request('http://localhost/api/admin/transcribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ episodeId: 'ep-1', audioUrl }),
    }))
  }

  it('does not request private or metadata audio URLs', async () => {
    const fetchImpl = vi.fn()
    vi.stubGlobal('fetch', fetchImpl)
    transcribeMock.mockClear()

    for (const audioUrl of [
      'http://169.254.169.254/latest/meta-data/',
      'http://127.0.0.1/secret.mp3',
      'http://localhost/audio.mp3',
      'file:///etc/passwd',
      'http://10.1.1.1/episode.mp3',
    ]) {
      const res = await post(audioUrl)
      expect(res.status, audioUrl).toBe(422)
      expect(await res.json(), audioUrl).toEqual({ error: 'audioUrl must be a public http(s) URL' })
    }

    expect(fetchImpl).not.toHaveBeenCalled()
    expect(transcribeMock).not.toHaveBeenCalled()
  })

  it('stops when a public audio URL redirects to metadata', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, {
      status: 302,
      headers: { location: 'http://169.254.169.254/latest/meta-data/iam/security-credentials/' },
    }))
    vi.stubGlobal('fetch', fetchImpl)
    transcribeMock.mockClear()

    const res = await post('https://cdn.example/episode.mp3')
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ error: 'audioUrl must be a public http(s) URL' })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(transcribeMock).not.toHaveBeenCalled()
  })

  it('downloads a public audio URL and does not echo fetch errors', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('connect ECONNREFUSED 10.0.0.5:80')
    })
    vi.stubGlobal('fetch', fetchImpl)
    const res = await post('https://cdn.example/episode.mp3')
    expect(res.status).toBe(422)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('Could not reach audio URL')
    expect(body.error).not.toContain('10.0.0.5')

    transcribeMock.mockClear()
    vi.unstubAllGlobals()
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { 'content-type': 'audio/mpeg' },
    })))
    const ok = await post('  https://cdn.example/episode.mp3  ')
    expect(ok.status).toBe(200)
    expect(await ok.json()).toMatchObject({ success: true, transcript: 'transcribed line' })
    expect(transcribeMock).toHaveBeenCalledTimes(1)
  })
})
