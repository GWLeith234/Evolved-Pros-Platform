import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { outboundHttpUrl, storyRedirectTarget } from './outboundUrl'

const here = dirname(fileURLToPath(import.meta.url))

describe('outboundHttpUrl', () => {
  it('keeps a public http(s) article URL and normalizes it', () => {
    expect(outboundHttpUrl('https://forbes.com/story')).toBe('https://forbes.com/story')
    expect(outboundHttpUrl('  HTTPS://Forbes.com/A  ')).toBe('https://forbes.com/A')
    expect(outboundHttpUrl('http://cdn.example/headshot.jpg')).toBe('http://cdn.example/headshot.jpg')
  })

  it('refuses schemes, protocol-relative hosts, credentials, and private targets', () => {
    const rejected = [
      'javascript:alert(1)',
      'javascript://evil.com/%0aalert(1)',
      'data:text/html,hi',
      '//evil.com',
      '/\\evil.com',
      'https://user:pass@forbes.com/a',
      'http://127.0.0.1/',
      'http://169.254.169.254/latest/meta-data',
      'https://2130706433/',
      'http://0x7f000001/',
      'https://evil.com\n.good.com',
      'https://evil.com\\@good.com',
      'https://example.com\\evil',
      '',
      '   ',
    ]
    for (const raw of rejected) {
      expect(outboundHttpUrl(raw), raw).toBeNull()
    }
    expect(outboundHttpUrl(null)).toBeNull()
    expect(outboundHttpUrl(1)).toBeNull()
    expect(outboundHttpUrl(['https://forbes.com'])).toBeNull()
  })
})

describe('storyRedirectTarget', () => {
  it('redirects a redirect story only when the source is a public http(s) URL', () => {
    expect(storyRedirectTarget('redirect', 'https://forbes.com/story')).toBe('https://forbes.com/story')
    expect(storyRedirectTarget('redirect', 'javascript:alert(1)')).toBeNull()
    expect(storyRedirectTarget('redirect', '//evil.com')).toBeNull()
    expect(storyRedirectTarget('redirect', 'https://user:pass@forbes.com/a')).toBeNull()
    expect(storyRedirectTarget('original', 'https://forbes.com/story')).toBeNull()
    expect(storyRedirectTarget('redirect', null)).toBeNull()
  })
})

describe('redirect and guest URL sinks', () => {
  it('does not pass a raw story source_url to redirect() or an href', () => {
    const page = readFileSync(
      resolve(here, '../../app/(public)/media/[pillar]/[slug]/page.tsx'),
      'utf8',
    )
    const document = readFileSync(
      resolve(here, '../../components/media/MediaStoryDocument.tsx'),
      'utf8',
    )
    expect(page).toContain('storyRedirectTarget')
    expect(page).not.toContain('redirect(story.source_url)')
    expect(document).toContain('outboundHttpUrl')
    expect(document).not.toContain('href={story.source_url}')
  })

  it('rejects an unsafe source_url before a media story is stored', () => {
    const post = readFileSync(resolve(here, '../../app/api/admin/media/route.ts'), 'utf8')
    const patch = readFileSync(resolve(here, '../../lib/media/storyPatch.ts'), 'utf8')
    expect(post).toContain('storedOutboundUrl')
    expect(patch).toContain('storedOutboundUrl')
  })

  it('checks guest intake URLs before they are written', () => {
    const route = readFileSync(resolve(here, '../../app/api/guest/submit/route.ts'), 'utf8')
    const payload = readFileSync(resolve(here, '../guest/intakePayload.ts'), 'utf8')
    expect(route).toContain('storedOutboundUrl')
    expect(payload).toContain('outboundHttpUrl')
  })
})
