import { PILLAR_CONFIG, PILLARS } from '@/lib/pillars'

export type MediaFilterCategory = {
  label: string
  slug: string
  color: string
}

/**
 * Pillar filters only when they would actually change the story list.
 * Revenue / AI / Leadership / other editorial hashes are not filters.
 */
export function mediaFilterCategories(
  stories: ReadonlyArray<{ pillar: string | null | undefined }>,
): MediaFilterCategory[] {
  const have = new Set(
    stories
      .map(s => s.pillar)
      .filter((p): p is string => Boolean(p) && Boolean(PILLAR_CONFIG[p ?? ''])),
  )
  return PILLARS.filter(p => have.has(p.slug)).map(p => ({
    label: p.name,
    slug: p.slug,
    color: PILLAR_CONFIG[p.slug]?.color ?? '#112535',
  }))
}
