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
    cover: row.thumbnail_url ?? row.guest_image_url,
    duration: row.duration_seconds ? Math.round(row.duration_seconds / 60) : 0,
    releasedAt,
    isNew,
    watched: progress?.progress ?? 0,
    pinned: row.pinned ?? false,
    youtubeUrl: row.youtube_url,
  }
}

export const PILLAR_META: Record<PodcastPillar, { label: string; color: string }> = {
  foundation:         { label: 'Foundation',        color: '#FFA538' },
  identity:           { label: 'Identity',          color: '#A78BFA' },
  'mental-toughness': { label: 'Mental Toughness',  color: '#F87171' },
  strategy:           { label: 'Strategy',          color: '#60A5FA' },
  accountability:     { label: 'Accountability',    color: '#C9A84C' },
  execution:          { label: 'Execution',         color: '#0ABFA3' },
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
