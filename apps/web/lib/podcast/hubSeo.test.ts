import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { publicPageMetadata } from '@/lib/seo/canonical'
import {
  PODCAST_HUB_DESCRIPTION,
  PODCAST_HUB_H1,
  PODCAST_HUB_TITLE,
} from './hubSeo'

const SUPPLIED_DESCRIPTION =
  'Weekly long-form interviews with George Leith and operators on AI, sales leadership and go-to-market. Full transcripts, chapters and highlights for every episode.'

describe('podcast hub search snippet', () => {
  it('keeps the document title within 60 characters and does not add a brand suffix', () => {
    expect(PODCAST_HUB_TITLE).toBe('Evolved Pros Podcast: AI, Sales & GTM with George Leith')
    expect(PODCAST_HUB_TITLE.length).toBe(55)
    expect(PODCAST_HUB_TITLE.length).toBeLessThanOrEqual(60)
    expect(`${PODCAST_HUB_TITLE} | Evolved Pros`.length).toBeGreaterThan(60)
  })

  it('trims the supplied description into 140–158 characters and copies it to og and twitter', () => {
    expect(SUPPLIED_DESCRIPTION.length).toBeGreaterThan(158)
    expect(PODCAST_HUB_DESCRIPTION.length).toBe(157)
    expect(PODCAST_HUB_DESCRIPTION.length).toBeGreaterThanOrEqual(140)
    expect(PODCAST_HUB_DESCRIPTION.length).toBeLessThanOrEqual(158)
    expect(PODCAST_HUB_DESCRIPTION.endsWith('.')).toBe(true)
    expect(PODCAST_HUB_H1).toBe('The Evolved Pros Podcast')

    const meta = publicPageMetadata('/podcast', {
      title: PODCAST_HUB_TITLE,
      description: PODCAST_HUB_DESCRIPTION,
      openGraph: {
        type: 'website',
        title: PODCAST_HUB_TITLE,
        description: PODCAST_HUB_DESCRIPTION,
        siteName: 'The Evolved Pros Podcast',
      },
      twitter: {
        title: PODCAST_HUB_TITLE,
        description: PODCAST_HUB_DESCRIPTION,
      },
    })

    expect(meta.title).toBe(PODCAST_HUB_TITLE)
    expect(meta.description).toBe(PODCAST_HUB_DESCRIPTION)
    expect(meta.alternates?.canonical).toBe('https://www.evolvedpros.com/podcast')
    expect(meta.openGraph).toMatchObject({
      title: PODCAST_HUB_TITLE,
      description: PODCAST_HUB_DESCRIPTION,
      url: 'https://www.evolvedpros.com/podcast',
      siteName: 'The Evolved Pros Podcast',
    })
    expect(meta.twitter).toMatchObject({
      title: PODCAST_HUB_TITLE,
      description: PODCAST_HUB_DESCRIPTION,
    })
  })

  it('leaves the PodcastSeries JSON-LD name and description unchanged', () => {
    const src = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), 'episodeJsonLd.ts'),
      'utf8',
    )
    expect(src).toContain('name: SERIES_NAME')
    expect(src).toContain(
      'Long-form conversations on AI, go-to-market, and the evolution of work with George Leith and guests.',
    )
    expect(src).not.toContain(PODCAST_HUB_DESCRIPTION)
    expect(src).not.toContain(PODCAST_HUB_TITLE)
  })
})
