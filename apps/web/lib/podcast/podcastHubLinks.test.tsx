import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { PodcastCoverCard } from '@/components/podcast/PodcastCoverCard'
import { PodcastPageShell } from '@/components/podcast/PodcastPageShell'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import type { PodcastEpisode } from '@/lib/podcast/transforms'

function episode(slug: string, episodeNumber: number, youtubeUrl: string): PodcastEpisode {
  return {
    id: slug,
    slug,
    episode: episodeNumber,
    title: `Conversation ${episodeNumber}`,
    blurb: '',
    pillar: 'foundation',
    guest: { name: `Guest ${episodeNumber}`, role: 'Operator', photo: null },
    cover: null,
    duration: 40,
    releasedAt: `2026-01-${String(episodeNumber).padStart(2, '0')}T00:00:00.000Z`,
    isNew: false,
    watched: 0,
    pinned: false,
    youtubeUrl,
  }
}

const PUBLISHED = [
  episode('evolved-pros-podcast-ep-010-juan-fernandez', 10, 'https://www.youtube.com/watch?v=juan'),
  episode('evolved-pros-podcast-ep-009-sample-guest', 9, 'https://www.youtube.com/watch?v=sample'),
  episode('evolved-pros-podcast-pilot', 0, 'https://www.youtube.com/watch?v=pilot'),
]

describe('podcast hub crawlable episode links', () => {
  it('wraps an interactive cover card in a first-party episode anchor', () => {
    const html = renderToStaticMarkup(<PodcastCoverCard episode={PUBLISHED[0]} />)
    expect(html).toMatch(
      /^<a [^>]*href="\/podcast\/evolved-pros-podcast-ep-010-juan-fernandez"/,
    )
    expect(html).toContain('Guest 10')
    expect(html).toContain('Conversation 10')
    expect(html).not.toContain('youtube.com')
    expect(html).not.toContain('role="button"')
  })

  it('keeps the admin preview card inert', () => {
    const html = renderToStaticMarkup(
      <PodcastCoverCard episode={PUBLISHED[0]} interactive={false} />,
    )
    expect(html.startsWith('<article')).toBe(true)
    expect(html).not.toContain('href=')
  })

  it('emits one /podcast/{slug} href per published episode in the hub SSR markup', () => {
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <PodcastPageShell episodes={PUBLISHED} />
      </ThemeProvider>,
    )
    const hrefs = [...html.matchAll(/href="(\/podcast\/[a-z0-9-]+)"/g)].map(match => match[1])
    expect([...new Set(hrefs)].sort()).toEqual(
      PUBLISHED.map(ep => `/podcast/${ep.slug}`).sort(),
    )
    // Featured YouTube CTA stays outbound. Archive cards add first-party URLs.
    expect(html).toContain('href="https://www.youtube.com/watch?v=juan"')
    expect(html).toContain('Watch on YouTube')
  })
})
