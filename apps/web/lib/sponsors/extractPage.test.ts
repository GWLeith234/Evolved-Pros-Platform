import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { readResponseText, scrapeSponsorPage, SPONSOR_FETCH_MAX_BYTES } from './extractPage'

const PUBLIC = ['8.8.8.8']

function htmlResponse(body: string, status = 200, headers?: HeadersInit): Response {
  return new Response(body, { status, headers })
}

describe('scrapeSponsorPage', () => {
  it('returns title and description from a public page', async () => {
    const calls: string[] = []
    const meta = await scrapeSponsorPage('https://brand.example/landing', {
      lookup: async () => PUBLIC,
      fetchImpl: async (url) => {
        calls.push(String(url))
        return htmlResponse(
          '<html><head>' +
            '<title>Acme &amp; Co</title>' +
            '<meta property="og:description" content="Tools for pros">' +
            '<meta property="og:image" content="/logo.png">' +
            '<meta name="theme-color" content="#112535">' +
            '<meta property="og:site_name" content="Acme">' +
          '</head></html>',
        )
      },
    })

    expect(calls).toEqual(['https://brand.example/landing'])
    expect(meta).toEqual({
      url: 'https://brand.example/landing',
      title: 'Acme & Co',
      description: 'Tools for pros',
      image: 'https://brand.example/logo.png',
      themeColor: '#112535',
      siteName: 'Acme',
    })
  })

  it('does not fetch loopback, private, or metadata addresses', async () => {
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
      const meta = await scrapeSponsorPage(target, {
        lookup: async () => {
          throw new Error('lookup should not run for a literal block')
        },
        fetchImpl: async () => {
          called = true
          return htmlResponse('<title>secret</title>')
        },
      })
      expect(meta, target).toBeNull()
      expect(called, target).toBe(false)
    }
  })

  it('does not fetch a hostname that resolves to a private address', async () => {
    let called = false
    const meta = await scrapeSponsorPage('https://rebind.example/meta', {
      lookup: async () => ['10.0.0.5', '8.8.8.8'],
      fetchImpl: async () => {
        called = true
        return htmlResponse('<title>secret</title>')
      },
    })
    expect(meta).toBeNull()
    expect(called).toBe(false)
  })

  it('does not follow a protocol-relative redirect onto a metadata host', async () => {
    const calls: string[] = []
    const meta = await scrapeSponsorPage('https://brand.example/start', {
      lookup: async () => PUBLIC,
      fetchImpl: async (url) => {
        calls.push(String(url))
        return htmlResponse('', 302, { location: '//169.254.169.254/latest/meta-data/' })
      },
    })
    expect(meta).toBeNull()
    expect(calls).toEqual(['https://brand.example/start'])
  })

  it('does not follow a redirect onto a metadata or loopback host', async () => {
    const calls: string[] = []
    const meta = await scrapeSponsorPage('https://brand.example/start', {
      lookup: async () => PUBLIC,
      fetchImpl: async (url) => {
        calls.push(String(url))
        return htmlResponse('', 302, {
          location: 'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
        })
      },
    })
    expect(meta).toBeNull()
    expect(calls).toEqual(['https://brand.example/start'])
  })

  it('follows a same-origin redirect and still refuses a later private hop', async () => {
    const calls: string[] = []
    const meta = await scrapeSponsorPage('https://brand.example/start', {
      lookup: async () => PUBLIC,
      fetchImpl: async (url) => {
        const href = String(url)
        calls.push(href)
        if (href.endsWith('/start')) {
          return htmlResponse('', 302, { location: '/landing' })
        }
        return htmlResponse('', 302, { location: 'http://127.0.0.1/secret' })
      },
    })
    expect(meta).toBeNull()
    expect(calls).toEqual([
      'https://brand.example/start',
      'https://brand.example/landing',
    ])
  })

  it('drops an og:image that points at a private host', async () => {
    const meta = await scrapeSponsorPage('https://brand.example/', {
      lookup: async () => PUBLIC,
      fetchImpl: async () => htmlResponse(
        '<title>Acme</title><meta property="og:image" content="http://169.254.169.254/latest/meta-data/">',
      ),
    })
    expect(meta?.title).toBe('Acme')
    expect(meta?.image).toBeNull()
  })

  it('caps the body it keeps', async () => {
    const marker = 'PAST_THE_CAP'
    const body = `<title>Kept</title>${'a'.repeat(SPONSOR_FETCH_MAX_BYTES)}${marker}`
    const text = await readResponseText(htmlResponse(body), SPONSOR_FETCH_MAX_BYTES)
    expect(text.startsWith('<title>Kept</title>')).toBe(true)
    expect(text.length).toBeLessThanOrEqual(SPONSOR_FETCH_MAX_BYTES)
    expect(text).not.toContain(marker)
  })
})

describe('partner extract route', () => {
  it('delegates the fetch to scrapeSponsorPage and does not follow redirects itself', () => {
    const src = readFileSync(
      new URL('../../app/api/admin/partners/extract/route.ts', import.meta.url),
      'utf8',
    )
    expect(src).toContain('scrapeSponsorPage')
    expect(src).not.toContain('redirect:')
    expect(src).not.toContain('await fetch(')
  })
})
