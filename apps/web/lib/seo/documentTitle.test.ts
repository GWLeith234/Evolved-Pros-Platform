import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'
import { describe, expect, it } from 'vitest'
import { HOME_TITLE } from '@/lib/home/conversion'
import {
  MEDIA_HUB_DOCUMENT_TITLE,
  mediaStoryTitle,
} from '@/lib/media/brand'
import {
  DOCUMENT_TITLE_LIMIT,
  DOCUMENT_TITLE_SUFFIX,
  acceptedShortTitle,
  fitDocumentTitle,
  resolveDocumentTitle,
  truncateDocumentTitle,
} from './documentTitle'
import { SHORT_DOCUMENT_TITLES } from './shortDocumentTitles'

const PODCAST_SUFFIX = ' | The Evolved Pros Podcast'
const MEDIA_SUFFIX = ' | Evolved Pros Media'

type CrawlRow = {
  url: string
  title: string
  title_len: string
  h1_first: string
}

function loadCrawl(): CrawlRow[] {
  const here = dirname(fileURLToPath(import.meta.url))
  const csv = readFileSync(
    resolve(here, './fixtures/sitemap-crawl-2026-10-13.csv'),
    'utf8',
  )
  const parsed = Papa.parse<CrawlRow>(csv, { header: true, skipEmptyLines: true })
  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors.map(error => error.message).join('; '))
  }
  return parsed.data
}

function pathname(url: string): string {
  const path = new URL(url).pathname.replace(/\/$/, '')
  return path === '' ? '/' : path
}

function isMediaStory(path: string): boolean {
  const parts = path.split('/').filter(Boolean)
  return parts[0] === 'media' && parts.length === 3
}

/**
 * Inputs the live pages pass into the title helper, recovered from the
 * 2026-10-13 crawl. Episode and article H1s are the stored headlines.
 * A crawled title that is exactly headline + the old suffix is the legacy
 * template (seo_title or the previous formatter). A crawled title that
 * differs from the H1 is the stored seo_title.
 */
function contentSlug(path: string): string | null {
  if (path.startsWith('/podcast/')) return path.slice('/podcast/'.length)
  if (!isMediaStory(path)) return null
  return path.split('/').filter(Boolean)[2] ?? null
}

/** Headline and seo_title the live page passes in, plus the content slug. */
function storyInput(row: CrawlRow): { headline: string; seoTitle?: string; slug: string } | null {
  const path = pathname(row.url)
  const slug = contentSlug(path)
  if (!slug) return null
  if (path.startsWith('/podcast/')) {
    const headline = row.title.endsWith(PODCAST_SUFFIX)
      ? row.title.slice(0, -PODCAST_SUFFIX.length)
      : row.h1_first
    return { headline, slug }
  }
  if (row.title.endsWith(MEDIA_SUFFIX)) {
    return { headline: row.title.slice(0, -MEDIA_SUFFIX.length), seoTitle: row.title, slug }
  }
  if (row.h1_first && row.h1_first !== row.title) {
    return { headline: row.h1_first, seoTitle: row.title, slug }
  }
  return { headline: row.h1_first || row.title, seoTitle: row.title, slug }
}

function computedTitle(row: CrawlRow): string {
  const path = pathname(row.url)
  if (path === '/') return HOME_TITLE
  if (path === '/media') return MEDIA_HUB_DOCUMENT_TITLE
  const input = storyInput(row)
  if (input) return fitDocumentTitle(input.headline, input.seoTitle, input.slug)
  return row.title
}

describe('fitDocumentTitle', () => {
  it('keeps a short brand suffix when the headline fits', () => {
    expect(fitDocumentTitle('Leading a Digital Evolution at Salem Media')).toBe(
      `Leading a Digital Evolution at Salem Media${DOCUMENT_TITLE_SUFFIX}`,
    )
    expect(mediaStoryTitle('Close the Gap')).toBe(`Close the Gap${DOCUMENT_TITLE_SUFFIX}`)
  })

  it('drops the suffix when the headline alone already fills the limit', () => {
    const headline = 'CTV for Multilocation Brands: Measure Lift Before You Scale'
    expect(headline.length).toBeLessThanOrEqual(DOCUMENT_TITLE_LIMIT)
    expect(fitDocumentTitle(headline)).toBe(headline)
    expect(`${headline}${DOCUMENT_TITLE_SUFFIX}`.length).toBeGreaterThan(DOCUMENT_TITLE_LIMIT)
  })

  it('uses a distinct seo title only when the headline itself exceeds 60', () => {
    const headline = 'A'.repeat(70)
    expect(fitDocumentTitle(headline, 'Desk note on the quota')).toBe('Desk note on the quota')
  })

  it('ignores a legacy suffixed seo title and a mid-word chop of the headline', () => {
    const headline = 'Put AI Tokens on the Materials Line Before You Rewrite the MSA'
    const chop = 'Put AI Tokens on the Materials Line Before You Rewrite the M'
    expect(chop.length).toBe(DOCUMENT_TITLE_LIMIT)
    expect(headline.startsWith(chop)).toBe(true)
    const cut = resolveDocumentTitle(headline, `${headline}${MEDIA_SUFFIX}`)
    expect(cut.truncated).toBe(true)
    expect(cut.title).toBe('Put AI Tokens on the Materials Line Before You Rewrite')
    expect(fitDocumentTitle(headline, chop)).toBe(cut.title)
  })

  it('uses a hand-written short title instead of cutting a known slug', () => {
    const headline = 'Put AI Tokens on the Materials Line Before You Rewrite the MSA'
    const resolved = resolveDocumentTitle(headline, headline.slice(0, 60), 'ai-tokens-materials-line')
    expect(resolved.truncated).toBe(false)
    expect(resolved.title).toBe('Put AI Tokens on the Materials Line Before the MSA')
    expect(resolved.title.endsWith('.')).toBe(false)
  })

  it('adds the brand suffix to a short title only when the pair fits', () => {
    expect(fitDocumentTitle(
      'From Managed to Modern: Evolving the MSP Channel with Juan Fernandez',
      null,
      'evolved-pros-podcast-ep-010-juan-fernandez',
    )).toBe(`Evolving the MSP Channel with Juan Fernandez${DOCUMENT_TITLE_SUFFIX}`)
    expect(fitDocumentTitle(
      'Seeing Around Corners: Product Vision and Where the World Goes Next with Gib Olander',
      null,
      'seeing-around-corners-gib-olander',
    )).toBe('Seeing Around Corners: Product Vision with Gib Olander')
  })

  it('ignores a hand-written title that is over 60 characters', () => {
    expect(acceptedShortTitle('A'.repeat(DOCUMENT_TITLE_LIMIT + 1))).toBeNull()
    expect(acceptedShortTitle('A'.repeat(DOCUMENT_TITLE_LIMIT))).toBe('A'.repeat(DOCUMENT_TITLE_LIMIT))
  })

  it('cuts on a word boundary and drops a dangling tail word', () => {
    expect(truncateDocumentTitle(
      'Betting on Yourself: Resilience and Reinvention with Heather Monahan',
    )).toBe('Betting on Yourself: Resilience and Reinvention')
    expect(truncateDocumentTitle(
      'The 72-Hour Water Fast: Five Benefits Worth Understanding (and the Fine Print)',
    )).toBe('The 72-Hour Water Fast: Five Benefits Worth Understanding')
  })
})

describe('sitemap document titles', () => {
  const rows = loadCrawl()

  it('parses the 82 crawled titles at the recorded lengths', () => {
    expect(rows).toHaveLength(82)
    for (const row of rows) {
      expect(row.title.length, row.url).toBe(Number(row.title_len))
    }
  })

  it('fits every sitemap document title in 60 characters', () => {
    const computed = rows.map(row => {
      const title = computedTitle(row)
      return {
        url: row.url,
        before: row.title,
        beforeLen: row.title.length,
        after: title,
        afterLen: title.length,
      }
    })
    const overBefore = computed.filter(row => row.beforeLen > DOCUMENT_TITLE_LIMIT)
    const overAfter = computed.filter(row => row.afterLen > DOCUMENT_TITLE_LIMIT)
    expect(overBefore).toHaveLength(39)
    expect(overAfter).toEqual([])

    for (const row of computed) {
      expect(row.afterLen, row.url).toBeLessThanOrEqual(DOCUMENT_TITLE_LIMIT)
      expect(row.after.length, row.url).toBeGreaterThan(0)
    }
  })

  it('fails when a sitemap title would need a word-boundary cut', () => {
    const cuts = rows.flatMap(row => {
      const input = storyInput(row)
      if (!input) return []
      const resolved = resolveDocumentTitle(input.headline, input.seoTitle, input.slug)
      if (!resolved.truncated) return []
      return [`${pathname(row.url)} needs a SHORT_DOCUMENT_TITLES entry for ${input.slug}`]
    })
    expect(
      cuts,
      'Add a complete short title of 60 characters or less. Word-boundary cuts fail CI.',
    ).toEqual([])
  })

  it('keeps every hand-written short title complete and within 60 characters', () => {
    const danglingTail = /\b(a|an|the|and|or|but|for|with|of|to|into|on|in)$/i
    for (const [slug, title] of Object.entries(SHORT_DOCUMENT_TITLES)) {
      expect(title.length, slug).toBeGreaterThan(0)
      expect(title.length, slug).toBeLessThanOrEqual(DOCUMENT_TITLE_LIMIT)
      expect(title, slug).toBe(title.replace(/\s+/g, ' ').trim())
      expect(title.endsWith('.'), slug).toBe(false)
      expect(title, slug).not.toMatch(danglingTail)
      expect(acceptedShortTitle(title), slug).toBe(title)
    }
  })

  it('keeps the guest name in every hand-written podcast title', () => {
    for (const row of rows) {
      const path = pathname(row.url)
      if (!path.startsWith('/podcast/')) continue
      const input = storyInput(row)
      if (!input) continue
      const manual = SHORT_DOCUMENT_TITLES[input.slug]
      if (!manual) continue
      const marker = ' with '
      const at = input.headline.lastIndexOf(marker)
      expect(at, input.slug).toBeGreaterThan(-1)
      const guest = input.headline.slice(at + marker.length).replace(/\.+$/u, '')
      expect(manual, input.slug).toContain(guest)
    }
  })
})
