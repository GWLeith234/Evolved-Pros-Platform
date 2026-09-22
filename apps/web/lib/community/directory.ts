/**
 * Directory payloads (SPRINT Q1).
 *
 * THE DIRECTORY IS OPEN, THE DETAIL IS NOT. The roster is the best conversion
 * surface on the platform, so everyone signed in can browse it. The roster is
 * also an asset: a competitor who signs up free in thirty seconds must not be
 * able to read every member's company, bio, ninety-day goal and LinkedIn.
 *
 * REDACTION HAPPENS IN THE QUERY, NOT IN THE COMPONENT. The two column lists
 * below are what the route hands Supabase, so a withheld value is never
 * fetched, never serialized into the RSC payload or the JSON response, and
 * never sits in the browser waiting for someone to open devtools. Hiding a
 * field in JSX would leave it in the response body, which is not redaction.
 *
 * DEPENDENCY-FREE ON PURPOSE - imports nothing, so the column lists and the
 * shaping are unit-testable without a database.
 */

/**
 * Columns a community or VIP member may receive.
 *
 * `full_name` is NOT here. It is read server-side only to derive a first name
 * when display_name is empty, and the derived first name is what ships.
 */
export const DIRECTORY_PUBLIC_COLUMNS = [
  'id',
  'display_name',
  'full_name',
  'avatar_url',
  'role_title',
  'current_pillar',
  'location',
  'tier',
  'points',
  'created_at',
] as const

/** Everything above, plus what only The 99 may read about each other. */
export const DIRECTORY_FULL_COLUMNS = [
  ...DIRECTORY_PUBLIC_COLUMNS,
  'company',
  'bio',
  'goal_90day',
  'goal_visible',
  'linkedin_url',
  'twitter_handle',
  'website_url',
] as const

/** Comma-joined for a Supabase `.select()`. */
export function directorySelect(detail: 'public' | 'full'): string {
  const columns = detail === 'full' ? DIRECTORY_FULL_COLUMNS : DIRECTORY_PUBLIC_COLUMNS
  return columns.join(', ')
}

export interface DirectoryRow {
  id: string
  display_name?: string | null
  full_name?: string | null
  avatar_url?: string | null
  role_title?: string | null
  current_pillar?: string | null
  location?: string | null
  tier?: string | null
  points?: number | null
  created_at?: string | null
  company?: string | null
  bio?: string | null
  goal_90day?: string | null
  goal_visible?: boolean | null
  linkedin_url?: string | null
  twitter_handle?: string | null
  website_url?: string | null
}

export interface PublicDirectoryMember {
  id: string
  /** First name only. A surname is part of what The 99 pays for. */
  firstName: string
  avatarUrl: string | null
  roleTitle: string | null
  currentPillar: string | null
  location: string | null
  tier: string | null
  points: number
  created_at: string | null
}

export interface FullDirectoryMember extends PublicDirectoryMember {
  fullName: string | null
  company: string | null
  bio: string | null
  /** Null when the member has not opted in via goal_visible. */
  goal90day: string | null
  linkedinUrl: string | null
  twitterHandle: string | null
  websiteUrl: string | null
}

/**
 * The leading word of a name. Falls back to 'Member' rather than leaking an
 * email local-part or an empty chip.
 */
export function firstNameOf(
  displayName: string | null | undefined,
  fullName: string | null | undefined,
): string {
  const source = (displayName ?? '').trim() || (fullName ?? '').trim()
  if (!source) return 'Member'
  return source.split(/\s+/)[0] ?? 'Member'
}

export function toPublicMember(row: DirectoryRow): PublicDirectoryMember {
  return {
    id: row.id,
    firstName: firstNameOf(row.display_name, row.full_name),
    avatarUrl: row.avatar_url ?? null,
    roleTitle: row.role_title ?? null,
    currentPillar: row.current_pillar ?? null,
    location: row.location ?? null,
    tier: row.tier ?? null,
    points: row.points ?? 0,
    created_at: row.created_at ?? null,
  }
}

export function toFullMember(row: DirectoryRow): FullDirectoryMember {
  return {
    ...toPublicMember(row),
    fullName: row.full_name ?? null,
    company: row.company ?? null,
    bio: row.bio ?? null,
    // goal_visible is the member's own choice and outranks the viewer's tier:
    // paying $849 does not entitle you to a goal somebody chose to keep.
    goal90day: row.goal_visible ? (row.goal_90day ?? null) : null,
    linkedinUrl: row.linkedin_url ?? null,
    twitterHandle: row.twitter_handle ?? null,
    websiteUrl: row.website_url ?? null,
  }
}

export function shapeDirectory(
  rows: readonly DirectoryRow[],
  detail: 'public' | 'full',
): Array<PublicDirectoryMember | FullDirectoryMember> {
  return detail === 'full' ? rows.map(toFullMember) : rows.map(toPublicMember)
}

/** Copy for the inert Message button. One place, so it cannot drift. */
export const DIRECTORY_DM_LOCKED_COPY = 'Members of The 99 can reach each other directly.'

/**
 * Search text safe to interpolate into a PostgREST `.or()` filter.
 *
 * Commas, parentheses and wildcards are filter syntax. A community viewer
 * who can type them must not be able to reshape the query the service role
 * runs. Returns null when nothing searchable remains.
 */
export function directorySearchTerm(raw: string): string | null {
  const term = raw
    .replace(/[%_,().\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
  return term.length > 0 ? term : null
}

export interface ProfilePrivacyInput {
  display_name?: string | null
  full_name?: string | null
  bio?: string | null
  company?: string | null
  goal_90day?: string | null
  linkedin_url?: string | null
  twitter_handle?: string | null
  website_url?: string | null
  phone?: string | null
}

/**
 * Profile pages are the directory's other door. A public viewer (and a VIP,
 * who also gets the public payload) sees a first name and nothing that the
 * directory SELECT withholds. The member always sees their own row.
 */
export function shapeProfileForViewer<T extends ProfilePrivacyInput>(
  row: T,
  opts: { detail: 'public' | 'full'; isSelf: boolean },
): T {
  if (opts.isSelf || opts.detail === 'full') return row
  return {
    ...row,
    display_name: firstNameOf(row.display_name, row.full_name),
    full_name: null,
    bio: null,
    company: null,
    goal_90day: null,
    linkedin_url: null,
    twitter_handle: null,
    website_url: null,
    phone: null,
  }
}

/** "<n> of 99 seats filled". Scarcity where people are looking at the room. */
export function seatsFilledLine(taken: number, cap: number): string {
  return `${taken} of ${cap} seats filled`
}
