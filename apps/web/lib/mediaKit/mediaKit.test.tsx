import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MediaKitPage } from '@/components/mediaKit/MediaKitPage'
import { PLATFORM_TO_WWW_EXACT_PATHS } from '@/lib/seo/appRedirects.mjs'
import { PUBLIC_SITEMAP_PATHS } from '@/lib/seo/publicRoutes'
import {
  MEDIA_KIT_BIO,
  MEDIA_KIT_BOOK_NOTE,
  MEDIA_KIT_DESCRIPTION,
  MEDIA_KIT_DOWNLOADS,
  MEDIA_KIT_H1,
  MEDIA_KIT_OG_IMAGE,
  MEDIA_KIT_OG_IMAGE_PATH,
  MEDIA_KIT_PATH,
  MEDIA_KIT_TITLE,
  mediaKitCopyStrings,
} from './copy'

const root = resolve(__dirname, '../..')
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8')
const publicFile = (href: string) => resolve(root, 'public', href.replace(/^\//, ''))

/** v2.2 Design files, byte-identical. A new kit must update these on purpose. */
const PDF_SHA256: Record<string, string> = {
  light: '8f813f4bff9988ec472347d20c2ad5e6c68293a97411b499bce38d84b8f1a1fc',
  dark: '1768e448226188e8a4a994b801abb1e0c19200953756145a762059aad7a9e4c8',
}

const BANNED = [/\u2014/, /\u2013/, /amazon/i, /pre-?order/i, /\bisbn\b/i, /contact for pricing/i]

/** Any dash: hyphen, figure, en, em, horizontal bar, minus. */
const ANY_DASH = /[-\u2010-\u2015\u2212]/

/** Every "book" in page copy must sit inside the coming-soon line. */
function bookOutsideNote(text: string): boolean {
  return /\bbooks?\b/i.test(text.split(MEDIA_KIT_BOOK_NOTE).join(''))
}

describe('media kit copy', () => {
  it('lives at /media-kit with an SEO title under 60 and a meta under 155', () => {
    expect(MEDIA_KIT_PATH).toBe('/media-kit')
    expect(MEDIA_KIT_TITLE).toBe('George Leith Media Kit | Speaker and Podcast Host')
    expect(MEDIA_KIT_TITLE.length).toBeLessThan(60)
    expect(MEDIA_KIT_DESCRIPTION.length).toBeGreaterThan(60)
    expect(MEDIA_KIT_DESCRIPTION.length).toBeLessThan(155)
  })

  it('has a third person press bio of 80 to 120 words', () => {
    const words = MEDIA_KIT_BIO.trim().split(/\s+/)
    expect(words.length).toBeGreaterThanOrEqual(80)
    expect(words.length).toBeLessThanOrEqual(120)
    expect(MEDIA_KIT_BIO.startsWith('George Leith is ')).toBe(true)
    expect(MEDIA_KIT_BIO).not.toMatch(/\b(I|I'm|my|me|we|our)\b/)
  })

  it('keeps every dash out of the title, meta description, and bio', () => {
    for (const value of [MEDIA_KIT_TITLE, MEDIA_KIT_DESCRIPTION, MEDIA_KIT_BIO]) {
      expect(value, value).not.toMatch(ANY_DASH)
    }
  })

  it('says nothing about the book beyond "New book coming soon"', () => {
    expect(MEDIA_KIT_BOOK_NOTE).toBe('New book coming soon')
    for (const value of mediaKitCopyStrings()) {
      expect(bookOutsideNote(value), value).toBe(false)
    }
  })

  it('never names the book, including the all-caps EVOLVED title', () => {
    for (const value of mediaKitCopyStrings()) {
      expect(value, value).not.toMatch(/\bEVOLVED\b/)
    }
  })

  it('has no em or en dashes, prices, or store links', () => {
    for (const value of mediaKitCopyStrings()) {
      for (const banned of BANNED) {
        expect(value, value).not.toMatch(banned)
      }
    }
  })
})

describe('media kit page', () => {
  const html = renderToStaticMarkup(<MediaKitPage />)

  it('uses the /media desk chrome and the EVOLVED·PROS red-dot wordmark', () => {
    expect(html).toContain('media-desk-root')
    expect(html).toContain('ep-media-masthead')
    expect(html).toContain('ep-global-nav')
    expect(html).toContain('data-testid="ep-wordmark"')
    expect(html).toMatch(/EVOLVED<span style="color:var\(--brand-red-hot\)">·<\/span>PROS/)
    expect(html).not.toContain('media-lockup')
    expect(html).toContain(`<h1 class="ep-media-section-title">${MEDIA_KIT_H1}</h1>`)
    expect(html.match(/<h1/g)).toHaveLength(1)
  })

  it('renders plain Light and Dark PDF download links', () => {
    expect(MEDIA_KIT_DOWNLOADS.map(d => d.id)).toEqual(['light', 'dark'])
    for (const item of MEDIA_KIT_DOWNLOADS) {
      expect(item.href).toMatch(/^\/media-kit\/evolved-pros-media-kit-(light|dark)\.pdf$/)
      expect(html).toContain(`href="${item.href}"`)
      expect(html).toContain(`download="${item.filename}"`)
    }
    expect(html).not.toMatch(/href="[^"]*\.pdf\?/)
    expect(html).not.toMatch(/href="\/api\//)
  })

  it('renders the press bio and no book copy beyond the coming-soon line', () => {
    expect(html).toContain(MEDIA_KIT_BIO)
    expect(html).toContain('data-media-kit-note')
    expect(bookOutsideNote(html)).toBe(false)
    for (const banned of BANNED) {
      expect(html).not.toMatch(banned)
    }
  })

  it('sets canonical metadata and the page-1 og:image', () => {
    const pageSrc = read('app/(public)/media-kit/page.tsx')
    expect(pageSrc).toContain('publicPageMetadata(MEDIA_KIT_PATH')
    expect(pageSrc).toContain('MEDIA_KIT_OG_IMAGE')
    expect(MEDIA_KIT_OG_IMAGE.url).toBe(`https://www.evolvedpros.com${MEDIA_KIT_OG_IMAGE_PATH}`)
    expect([MEDIA_KIT_OG_IMAGE.width, MEDIA_KIT_OG_IMAGE.height]).toEqual([1200, 630])
    const jpg = readFileSync(publicFile(MEDIA_KIT_OG_IMAGE_PATH))
    expect(jpg.subarray(0, 3).toString('hex')).toBe('ffd8ff')
  })
})

describe('media kit files', () => {
  // The two v2.2 PDFs (about 6 MB each) land in their own commit on this
  // branch. Until then this check is skipped, never relaxed: once a PDF is
  // present it must be the exact Design file.
  const present = MEDIA_KIT_DOWNLOADS.filter(item => existsSync(publicFile(item.href)))

  it.skipIf(present.length === 0)('ships both PDFs byte-identical to the v2.2 Design files', () => {
    expect(present.map(item => item.id)).toEqual(['light', 'dark'])
    for (const item of MEDIA_KIT_DOWNLOADS) {
      const file = publicFile(item.href)
      const bytes = readFileSync(file)
      expect(bytes.subarray(0, 5).toString('latin1'), item.href).toBe('%PDF-')
      expect(createHash('sha256').update(bytes).digest('hex'), item.href).toBe(PDF_SHA256[item.id])
    }
  })
})

describe('media kit route is public', () => {
  const middlewareSrc = read('middleware.ts')
  const matcherBlock = middlewareSrc.slice(middlewareSrc.indexOf('matcher: ['))
  const matchers = [...matcherBlock.matchAll(/^\s*'([^']+)',/gm)].map(m => m[1])

  function matcherRegex(source: string): RegExp {
    const body = source
      .replace(/[.]/g, '\\.')
      .replace(/\/:[A-Za-z]+\*/g, '(?:/.*)?')
      .replace(/\/:[A-Za-z]+/g, '/[^/]+')
    return new RegExp(`^${body}$`)
  }

  it('is not caught by the middleware matcher (no auth hop)', () => {
    expect(matchers.length).toBeGreaterThan(20)
    expect(matchers).toContain('/media/:path*')
    const paths = [MEDIA_KIT_PATH, ...MEDIA_KIT_DOWNLOADS.map(d => d.href), MEDIA_KIT_OG_IMAGE_PATH]
    for (const path of paths) {
      for (const source of matchers) {
        expect(matcherRegex(source).test(path), `${source} vs ${path}`).toBe(false)
      }
    }
    expect(matcherRegex('/media/:path*').test('/media/leadership')).toBe(true)
  })

  it('is in the sitemap and 308s from platform to www like /about', () => {
    expect([...PUBLIC_SITEMAP_PATHS]).toContain('/media-kit')
    expect(PLATFORM_TO_WWW_EXACT_PATHS).toContain('/media-kit')
    const sitemap = read('app/sitemap.ts')
    expect(sitemap).toMatch(/'\/media-kit':\s+'monthly'/)
    expect(sitemap).toMatch(/'\/media-kit':\s+0\.4\b/)
  })
})
