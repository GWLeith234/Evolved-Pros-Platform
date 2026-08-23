/**
 * Pure helpers for /api/admin/podcast/sync (SPRINT SYNC-1).
 *
 * Product rules:
 * - `published_at` = platform release (set when an admin publishes), never RSS pubDate.
 * - New RSS rows land as drafts (`is_published: false`) so pillar + guest art can land first.
 * - Never write thumbnail_url, guest_image_url, or pillar — cover/portrait layers and
 *   pillar assignment are admin-owned before publish.
 */

export interface RssEnclosure {
  '@_url'?: string
  '@_type'?: string
  '@_length'?: string
}

export interface RssItunesImage {
  '@_href'?: string
}

export interface RssItem {
  guid?: string | { '#text'?: string }
  title?: string
  description?: string
  pubDate?: string
  enclosure?: RssEnclosure
  'content:encoded'?: string
  'itunes:duration'?: string | number
  'itunes:episode'?: string | number
  'itunes:season'?: string | number
  'itunes:image'?: RssItunesImage
}

export interface EpisodeInsertRow {
  transistor_episode_id: string
  title: string
  slug: string
  description: string | null
  show_notes: string | null
  audio_url: string | null
  published_at: null
  duration_seconds: number | null
  episode_number: number | null
  season: number
  is_published: false
  is_members_only: false
  pinned: false
}

export function pickGuid(guid: RssItem['guid']): string | null {
  if (!guid) return null
  if (typeof guid === 'string') return guid.trim() || null
  if (typeof guid === 'object' && typeof guid['#text'] === 'string') {
    return guid['#text'].trim() || null
  }
  return null
}

export function parseDuration(value: string | number | undefined): number | null {
  if (value === undefined || value === null) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const str = String(value).trim()
  if (!str) return null
  if (str.includes(':')) {
    const parts = str.split(':').map(p => parseInt(p, 10))
    if (parts.some(n => Number.isNaN(n))) return null
    let seconds = 0
    for (const part of parts) seconds = seconds * 60 + part
    return seconds
  }
  const n = parseInt(str, 10)
  return Number.isNaN(n) ? null : n
}

export function parseInteger(value: string | number | undefined): number | null {
  if (value === undefined || value === null) return null
  if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : null
  const n = parseInt(String(value), 10)
  return Number.isNaN(n) ? null : n
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 200)
}

export function uniqueSlug(
  title: string,
  guid: string,
  episodeNumber: number | null,
  taken: Set<string>,
): string {
  let slug = slugify(title)
  if (!slug) slug = `episode-${guid.slice(0, 8)}`

  if (taken.has(slug)) {
    const suffix = episodeNumber !== null ? `-${episodeNumber}` : `-${guid.slice(0, 6)}`
    slug = `${slug}${suffix}`
  }
  if (taken.has(slug)) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`
  }
  return slug
}

/** Draft insert row — review gate before members see it. */
export function buildDraftEpisodeRow(
  item: RssItem,
  guid: string,
  slug: string,
): EpisodeInsertRow {
  const title = typeof item.title === 'string' ? item.title.trim() : ''
  const description = typeof item.description === 'string' ? item.description : null
  const showNotes = typeof item['content:encoded'] === 'string'
    ? item['content:encoded']
    : description
  const seasonRaw = parseInteger(item['itunes:season'])

  return {
    transistor_episode_id: guid,
    title,
    slug,
    description,
    show_notes: showNotes,
    audio_url: item.enclosure?.['@_url'] ?? null,
    published_at: null,
    duration_seconds: parseDuration(item['itunes:duration']),
    episode_number: parseInteger(item['itunes:episode']),
    season: seasonRaw ?? 1,
    is_published: false,
    is_members_only: false,
    pinned: false,
  }
}
