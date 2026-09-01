/**
 * Resolve a media-story byline (plain string, not an FK) to a public.users
 * row so the article can show that member's avatar.
 *
 * media_stories.author is a free-text byline ("George Leith"). Matching is
 * case-insensitive on full_name, display_name, and first+last. No hardcoded
 * user ids — if the name does not resolve, the photo is optional and the
 * caller should render initials.
 */

export interface AuthorProfileRow {
  full_name: string | null
  display_name: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  role: string | null
  current_pillar: string | null
}

export function normalizePersonName(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

export function composedName(
  first: string | null | undefined,
  last: string | null | undefined,
): string {
  return [first, last].filter(Boolean).join(' ').trim()
}

/** Names on a user row that may match a byline. */
export function profileNameKeys(row: AuthorProfileRow): string[] {
  return [
    normalizePersonName(row.full_name),
    normalizePersonName(row.display_name),
    normalizePersonName(composedName(row.first_name, row.last_name)),
  ].filter(Boolean)
}

/**
 * Pick the best matching profile for a byline. Prefers a row that has an
 * avatar when several names collide.
 */
export function pickAuthorProfile(
  author: string | null | undefined,
  rows: AuthorProfileRow[],
): AuthorProfileRow | null {
  const needle = normalizePersonName(author)
  if (!needle || rows.length === 0) return null

  const matches = rows.filter(row => profileNameKeys(row).includes(needle))
  if (matches.length === 0) return null
  return matches.find(row => row.avatar_url) ?? matches[0]
}
