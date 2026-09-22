import { PILLARS } from '@/lib/pillars'
import { mediaFilterCategories } from '@/lib/media/filters'

/**
 * Media hub desk layout: newspaper module grammar, Evolved Pros brand.
 * Density is the SooToday / Toronto Today lesson, not the palette.
 */

export const MEDIA_NAVY = '#1B3C5A'
export const MEDIA_RED = '#EF0E30'
export const MEDIA_TEAL = '#68A2B9'
export const MEDIA_PAPER = '#F5F0E8'

/** A pillar slug. Not a closed union - the pillar list is the source of truth. */
export type DeskSectionId = string

export type DeskSectionDef = {
  id: DeskSectionId
  label: string
  pillar: string
  href: string
}

/**
 * SPRINT M - section chips are DERIVED, never hardcoded.
 *
 * The old constant pinned the rail to Strategy / Execution / Identity /
 * Foundation, which stranded every published story under /media/accountability
 * and /media/mental-toughness: 11 articles with no door in the nav and no
 * section block on the hub. Deriving from the stories we were handed means a
 * pillar appears the moment it has a published story and disappears when it
 * does not, with no constant to keep in sync.
 */
export function mediaIndexSections(
  stories: ReadonlyArray<{ pillar: string | null | undefined }>,
): DeskSectionDef[] {
  return mediaFilterCategories(stories).map(category => ({
    id: category.slug,
    label: category.label,
    pillar: category.slug,
    href: `/media/${category.slug}`,
  }))
}

/**
 * Every pillar, in canonical program order. Degraded-mode fallback for chrome
 * that renders before (or without) a story list - never the primary source.
 */
export const ALL_MEDIA_SECTIONS: readonly DeskSectionDef[] = PILLARS.map(pillar => ({
  id: pillar.slug,
  label: pillar.name,
  pillar: pillar.slug,
  href: `/media/${pillar.slug}`,
}))

export const MEDIA_ON_AIR: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'LIVE', href: '/live' },
  { label: 'Podcast', href: '/podcast' },
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

  const sections = mediaIndexSections(stories).map(section => ({
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
