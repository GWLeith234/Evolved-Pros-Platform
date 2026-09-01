/**
 * Public media article URL. `media_stories.pillar` is NULL for ORIGINAL /
 * uncategorised stories, which the App Router serves as `/media/general/[slug]`.
 * Never interpolate a raw DB pillar — a null becomes the string "null".
 */
export function mediaStoryHref(
  pillar: string | null | undefined,
  slug: string,
): string {
  const segment = pillar && pillar !== 'null' ? pillar : 'general'
  return `/media/${segment}/${slug}`
}
