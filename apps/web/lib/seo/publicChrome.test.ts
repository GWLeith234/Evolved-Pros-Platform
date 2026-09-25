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
    expect(read('../../app/(public)/podcast/(index)/page.tsx')).toMatch(/\$\{SERIES_NAME\} \| Evolved Pros/)
    expect(read('../../app/(public)/podcast/[slug]/page.tsx')).toMatch(
      /\$\{ep\.title\} \| \$\{SERIES_NAME\}/,
    )
  })

  it('wires /media document + twitter titles to MEDIA_HUB_TITLE', () => {
    const src = read('../../app/(public)/media/(hub)/page.tsx')
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

  it('ships a denser Media desk: dual hero, Featured 2-up, Latest rail, Podcast', () => {
    const src = read('../../app/(public)/media/MediaPortalClient.tsx')
    expect(src).toMatch(/data-media-module="dual-hero"/)
    expect(src).toMatch(/data-media-module="featured-grid"/)
    expect(src).toMatch(/data-media-module="latest-list"/)
    expect(src).toMatch(/data-media-module="podcast"/)
    expect(src).toMatch(/data-media-section/)
    expect(src).toMatch(/On Air/)
    expect(src).toMatch(/Most Read/)
    expect(src).toMatch(/moreInLabel/)
    expect(src).toMatch(/WebkitLineClamp: 2|WebkitLineClamp: lines/)
    expect(src).not.toMatch(/Education/)
    expect(src).not.toMatch(/googletag|doubleclick|gpt\.js|DFP/)
  })

  it('emits home WebSite JSON-LD', () => {
    const src = read('../../app/(public)/(home)/page.tsx')
    expect(src).toMatch(/homeJsonLd/)
    expect(src).toMatch(/application\/ld\+json/)
  })

  it('emits pricing Product/Offer JSON-LD', () => {
    const src = read('../../app/(public)/pricing/page.tsx')
    expect(src).toMatch(/pricingJsonLd/)
    expect(src).toMatch(/application\/ld\+json/)
  })

  it('emits one live WebPage JSON-LD script and no keynote price', () => {
    const src = read('../../app/live/page.tsx')
    expect(src).toMatch(/liveJsonLd/)
    expect(src).toMatch(/LIVE_PAGE_DESCRIPTION/)
    expect(src).toMatch(/title: 'LIVE \| Evolved Pros'/)
    expect(src.match(/application\/ld\+json/g)).toHaveLength(1)
    expect(src).not.toMatch(/priceCurrency/)
    expect(src).not.toMatch(/["']price["']\s*:/)
    expect(src).not.toMatch(/\/keynotes/)
  })
})
