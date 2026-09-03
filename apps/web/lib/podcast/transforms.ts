export type PodcastPillar =
  | 'foundation'
  | 'identity'
  | 'mental-toughness'
  | 'strategy'
  | 'accountability'
  | 'execution'

export interface PodcastEpisode {
  id: string
  slug: string
  episode: number
  title: string
  blurb: string
  pillar: PodcastPillar
  guest: {
    name: string
    role: string
    photo: string | null
  }
  cover: string | null
  duration: number
  /** ISO 8601 string. Date instances don't survive the server→client
   *  component boundary cleanly (they're JSON-stringified) so we keep
   *  this as a string and pre-compute anything time-dependent. */
  releasedAt: string
  isNew: boolean
  watched: number
  pinned: boolean
  youtubeUrl: string | null
}

export interface EpisodeRow {
  id: string
  slug: string
  episode_number: number | null
  title: string
  description: string | null
  pillar: string | null
  pinned: boolean | null
  guest_name: string | null
  guest_title: string | null
  guest_company: string | null
  guest_image_url: string | null
  thumbnail_url: string | null
  duration_seconds: number | null
  published_at: string | null
  youtube_url: string | null
}

export interface ProgressRow {
  episode_id: string
  progress: number
}

const VALID_PILLARS: ReadonlySet<string> = new Set([
  'foundation',
  'identity',
  'mental-toughness',
  'strategy',
  'accountability',
  'execution',
])

const NEW_WINDOW_DAYS = 30

export function dbRowToEpisode(row: EpisodeRow, progress?: ProgressRow): PodcastEpisode {
  // Compute isNew on the server only — anything that calls Date.now()
  // during render hydrates differently between server and client and
  // surfaces as React error #418/#425. Tile + Hero now read episode.isNew
  // directly instead of recomputing.
  const releasedAtDate = row.published_at ? new Date(row.published_at) : new Date(0)
  const releasedAt = releasedAtDate.toISOString()
  const isNew = row.published_at
    ? Date.now() - releasedAtDate.getTime() < NEW_WINDOW_DAYS * 86_400_000
    : false

  const pillar: PodcastPillar = row.pillar && VALID_PILLARS.has(row.pillar)
    ? (row.pillar as PodcastPillar)
    : 'foundation'

  const guestRole = [row.guest_title, row.guest_company]
    .filter(s => s && s.trim().length > 0)
    .join(' · ')

  return {
    id: row.id,
    slug: row.slug,
    episode: row.episode_number ?? 0,
    title: row.title,
    blurb: row.description ?? '',
    pillar,
    guest: {
      name: row.guest_name ?? '',
      role: guestRole,
      photo: row.guest_image_url,
    },
    cover: row.guest_image_url ?? row.thumbnail_url,
    duration: row.duration_seconds ? Math.round(row.duration_seconds / 60) : 0,
    releasedAt,
    isNew,
    watched: progress?.progress ?? 0,
    pinned: row.pinned ?? false,
    youtubeUrl: row.youtube_url,
  }
}

/**
 * Display-only title cleanup (SPRINT B). Episode titles frequently repeat the
 * guest as a trailing " with <guest>" or " — with <guest>". On the cover card
 * the guest name is already the headline, so strip that suffix at DISPLAY TIME
 * — this NEVER mutates the stored title. No-op when the title carries no such
 * suffix (e.g. Ep06 "Leading a Digital Evolution at Salem Media") or when there
 * is no guest (the pilot).
 */
export function displayEpisodeTitle(
  title: string,
  guestName: string | null | undefined,
): string {
  const g = (guestName ?? '').trim()
  if (!g || !title) return title
  const escaped = g.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Optional em-dash / en-dash / hyphen separator before "with <guest>" at end.
  const re = new RegExp(`\\s*(?:[—–-]\\s*)?with\\s+${escaped}\\s*$`, 'i')
  return title.replace(re, '').trim()
}

// Single source of truth for CATEGORY → pillar token (PODCAST-CLEANUP S2).
// `color` is a CSS custom-property reference, never a literal hex — badge,
// dot, filter pill and card hover-border all read from here so the six
// categories can never drift out of the brand palette again. Tints are
// derived at the call site with color-mix() against the same token.
export const PILLAR_META: Record<PodcastPillar, { label: string; color: string }> = {
  foundation:         { label: 'Foundation',        color: 'var(--pillar-1)' },
  identity:           { label: 'Identity',          color: 'var(--pillar-2)' },
  'mental-toughness': { label: 'Mental Toughness',  color: 'var(--pillar-3)' },
  strategy:           { label: 'Strategy',          color: 'var(--pillar-4)' },
  accountability:     { label: 'Accountability',    color: 'var(--pillar-5)' },
  execution:          { label: 'Execution',         color: 'var(--pillar-6)' },
}

/** Ordered pillar list — drives the filter rail without re-listing keys. */
export const PILLAR_ORDER: PodcastPillar[] = [
  'foundation', 'identity', 'mental-toughness', 'strategy', 'accountability', 'execution',
]

/**
 * Deterministic catalogue order (PODCAST-CLEANUP S6): newest publish date
 * first, with the higher episode number winning ties so same-day episodes
 * stop flipping between reloads. Returns a new array; never mutates input.
 */
export function sortEpisodesNewest(episodes: PodcastEpisode[]): PodcastEpisode[] {
  return [...episodes].sort((a, b) => {
    const dt = new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime()
    return dt !== 0 ? dt : b.episode - a.episode
  })
}

/**
 * Lightweight build/dev guard (PODCAST-CLEANUP S6): episode numbering should
 * be monotonic with publish date — i.e. sorting by date should yield the same
 * order as sorting by episode number. Pilots (episode 0) are excluded since
 * they carry a chip, not a sequence number. Warns rather than throws so live
 * data issues never hard-break a build; surfaces the drift for content fixes.
 */
export function assertMonotonicNumbering(episodes: PodcastEpisode[]): void {
  if (process.env.NODE_ENV === 'production') return
  const numbered = episodes.filter(e => e.episode > 0)
  const byDate = sortEpisodesNewest(numbered)
  const byNumber = [...numbered].sort((a, b) => b.episode - a.episode)
  const mismatch = byDate.some((e, i) => e.id !== byNumber[i]?.id)
  if (mismatch) {
    // eslint-disable-next-line no-console
    console.warn(
      '[podcast] episode numbering is not monotonic with publish date — ' +
      'newest-by-date order differs from newest-by-number. Renumber or fix ' +
      'publish dates so #N order matches chronology.',
    )
  }
}

// Locale-stable, deterministic between server and client. Using
// toLocaleDateString here was a hydration footgun — server runs in
// en-US/UTC, the client runs in whatever the user's browser reports —
// so the rendered string drifted and React #425'd. Hand-formatted UTC
// month/day matches the previous "Jan 5" shape without hitting Intl.
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function fmtPodcastDate(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(dt.getTime())) return ''
  return `${MONTHS_SHORT[dt.getUTCMonth()]} ${dt.getUTCDate()}`
}
