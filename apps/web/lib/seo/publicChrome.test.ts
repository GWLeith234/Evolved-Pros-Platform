import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const EM_DASH = '\u2014'

function read(rel: string): string {
  return readFileSync(resolve(here, rel), 'utf8')
}

describe('public chrome copy', () => {
  it('404 eyebrow uses a period, not an em dash', () => {
    const src = read('../../app/not-found.tsx')
    expect(src).toMatch(/404\. Page Not Found/)
    expect(src).not.toMatch(/404\s+\u2014/)
    expect(src).not.toMatch(/>\s*404 —/)
  })

  it('LIVE and podcast document titles use a pipe, not an em dash', () => {
    expect(read('../../app/live/page.tsx')).toMatch(/title: 'LIVE \| Evolved Pros'/)
    expect(read('../../app/live/page.tsx')).not.toMatch(/LIVE — Evolved Pros/)
    expect(read('../../app/(public)/podcast/page.tsx')).toMatch(/\$\{SERIES_NAME\} \| Evolved Pros/)
    expect(read('../../app/(public)/podcast/[slug]/page.tsx')).toMatch(
      /\$\{ep\.title\} \| \$\{SERIES_NAME\}/,
    )
  })

  it('wires /media document + twitter titles to MEDIA_HUB_TITLE', () => {
    const src = read('../../app/(public)/media/page.tsx')
    expect(src).toMatch(/title: MEDIA_HUB_TITLE/)
    expect(src).toMatch(/twitter:[\s\S]*title: MEDIA_HUB_TITLE/)
    expect(src).not.toMatch(/Evolved Media — Sales/)
    expect(src).not.toMatch(/Evolved Media/)
  })

  it('keeps /media hub chrome as Evolved Pros Media', () => {
    const src = read('../../app/(public)/media/MediaPortalClient.tsx')
    expect(src).toMatch(/More from Evolved Pros Media/)
    expect(src).not.toMatch(/More from Evolved Media/)
    expect(src).not.toMatch(/Evolved Media/)
  })

  it('ships a denser Media desk: named sections, list module, useful rail, title clamp', () => {
    const src = read('../../app/(public)/media/MediaPortalClient.tsx')
    expect(src).toMatch(/data-media-module="latest-list"/)
    expect(src).toMatch(/data-media-section/)
    expect(src).toMatch(/On Air/)
    expect(src).toMatch(/Popular/)
    expect(src).toMatch(/moreInLabel/)
    expect(src).toMatch(/WebkitLineClamp: 2|WebkitLineClamp: lines/)
  })

  it('emits home WebSite JSON-LD', () => {
    const src = read('../../app/(public)/page.tsx')
    expect(src).toMatch(/homeJsonLd/)
    expect(src).toMatch(/application\/ld\+json/)
  })
})
