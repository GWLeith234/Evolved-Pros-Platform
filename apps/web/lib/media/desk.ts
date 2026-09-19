/**
 * Media hub desk layout: newspaper module grammar, Evolved Pros brand.
 * Density is the SooToday / Toronto Today lesson, not the palette.
 */

export const MEDIA_NAVY = '#1B3C5A'
export const MEDIA_RED = '#EF0E30'
export const MEDIA_TEAL = '#68A2B9'
export const MEDIA_PAPER = '#F5F0E8'

export type DeskSectionId = 'strategy' | 'execution' | 'identity' | 'foundation'

export type DeskSectionDef = {
  id: DeskSectionId
  label: string
  pillar: string
  href: string
}

/** Section chips on Media chrome. Strategy / Execution / Identity / Foundation only. */
export const MEDIA_INDEX_SECTIONS: readonly DeskSectionDef[] = [
  { id: 'strategy', label: 'Strategy', pillar: 'strategy', href: '/media/strategy' },
  { id: 'execution', label: 'Execution', pillar: 'execution', href: '/media/execution' },
  { id: 'identity', label: 'Identity', pillar: 'identity', href: '/media/identity' },
  { id: 'foundation', label: 'Foundation', pillar: 'foundation', href: '/media/foundation' },
]

export const MEDIA_ON_AIR: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'LIVE', href: '/live' },
  { label: 'Podcast', href: '/podcast' },
  { label: 'Email brief', href: '/podcast' },
]

export type DeskStory = {
  id: string
  pillar: string | null
  views?: number | null
  published_at?: string | null
}

export type DeskLayout<T extends DeskStory> = {
  featured: T | null
  secondary: T | null
  featuredGrid: T[]
  latestList: T[]
  sections: Array<DeskSectionDef & { stories: T[] }>
}

/**
 * Newspaper home split: lede, half-column secondary, Featured 2-up, Latest rail.
 * Stories are not reused across those modules.
 */
export function splitHubDesk<T extends DeskStory>(
  stories: readonly T[],
  opts?: { latestList?: number; featuredGrid?: number; sectionSize?: number },
): DeskLayout<T> {
  const featuredGridSize = opts?.featuredGrid ?? 2
  const latestListSize = opts?.latestList ?? 8
  const sectionSize = opts?.sectionSize ?? 3
  const featured = stories[0] ?? null
  const secondary = stories[1] ?? null
  const featuredGrid = stories.slice(2, 2 + featuredGridSize)
  const latestStart = 2 + featuredGrid.length
  const latestList = stories.slice(latestStart, latestStart + latestListSize)
  const used = new Set(
    [featured, secondary, ...featuredGrid, ...latestList]
      .filter((s): s is T => Boolean(s))
      .map(s => s.id),
  )

  const sections = MEDIA_INDEX_SECTIONS.map(section => ({
    ...section,
    stories: stories.filter(story => story.pillar === section.pillar && !used.has(story.id)).slice(0, sectionSize),
  })).filter(section => section.stories.length > 0)

  return { featured, secondary, featuredGrid, latestList, sections }
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

/**
 * Section landing split: mini-hero (lede + optional half-column), Featured
 * 2-up, then a bordered Latest rail. All stories are already scoped to one
 * section by the caller. Same module grammar as the hub, no category bands.
 */
export function splitSectionDesk<T extends DeskStory>(
  stories: readonly T[],
  opts?: { featuredGrid?: number; latestList?: number },
): Pick<DeskLayout<T>, 'featured' | 'secondary' | 'featuredGrid' | 'latestList'> {
  const desk = splitHubDesk(stories, {
    featuredGrid: opts?.featuredGrid ?? 2,
    latestList: opts?.latestList ?? 8,
    sectionSize: 0,
  })
  return {
    featured: desk.featured,
    secondary: desk.secondary,
    featuredGrid: desk.featuredGrid,
    latestList: desk.latestList,
  }
}
