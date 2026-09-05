/**
 * Media hub desk layout: named sections, compact latest list, popular rail.
 * Brand stays Evolved Pros. Density is the SooToday lesson, not the palette.
 */

export const MEDIA_NAVY = '#1B3C5A'
export const MEDIA_RED = '#EF0E30'
export const MEDIA_TEAL = '#68A2B9'
export const MEDIA_PAPER = '#F5F0E8'

export type DeskSectionId = 'latest' | 'strategy' | 'execution' | 'identity' | 'foundation'

export type DeskSectionDef = {
  id: DeskSectionId
  label: string
  pillar: string | null
  href: string
}

export const MEDIA_INDEX_SECTIONS: readonly DeskSectionDef[] = [
  { id: 'latest', label: 'Latest', pillar: null, href: '/media' },
  { id: 'strategy', label: 'Strategy', pillar: 'strategy', href: '/media/strategy' },
  { id: 'execution', label: 'Execution', pillar: 'execution', href: '/media/execution' },
  { id: 'identity', label: 'Identity', pillar: 'identity', href: '/media/identity' },
  { id: 'foundation', label: 'Foundation', pillar: 'foundation', href: '/media/foundation' },
]

export const MEDIA_ON_AIR: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'LIVE', href: '/live' },
  { label: 'Podcast', href: '/podcast' },
  { label: 'Events', href: '/events' },
]

export type DeskStory = {
  id: string
  pillar: string | null
  views?: number | null
  published_at?: string | null
}

export type DeskLayout<T extends DeskStory> = {
  featured: T | null
  latestList: T[]
  sections: Array<DeskSectionDef & { stories: T[] }>
}

export function splitHubDesk<T extends DeskStory>(
  stories: readonly T[],
  opts?: { latestList?: number; sectionSize?: number },
): DeskLayout<T> {
  const latestListSize = opts?.latestList ?? 6
  const sectionSize = opts?.sectionSize ?? 3
  const featured = stories[0] ?? null
  const latestList = stories.slice(1, 1 + latestListSize)

  const sections = MEDIA_INDEX_SECTIONS.filter(s => s.pillar).map(section => ({
    ...section,
    stories: stories.filter(story => story.pillar === section.pillar).slice(0, sectionSize),
  })).filter(section => section.stories.length > 0)

  return { featured, latestList, sections }
}

export function popularStories<T extends DeskStory>(stories: readonly T[], limit = 5): T[] {
  return [...stories]
    .sort((a, b) => {
      const views = (b.views ?? 0) - (a.views ?? 0)
      if (views !== 0) return views
      return Date.parse(b.published_at ?? '') - Date.parse(a.published_at ?? '')
    })
    .slice(0, limit)
}

export function moreInLabel(category: string): string {
  return `More in ${category}`
}
