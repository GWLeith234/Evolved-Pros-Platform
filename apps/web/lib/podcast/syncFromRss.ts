import 'server-only'
import { XMLParser } from 'fast-xml-parser'
import { adminClient } from '@/lib/supabase/admin'

interface RssEnclosure {
  '@_url'?: string
  '@_type'?: string
  '@_length'?: string
}

interface RssItunesImage {
  '@_href'?: string
}

interface RssItem {
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

interface RssChannel {
  'itunes:image'?: RssItunesImage
  item?: RssItem | RssItem[]
}

interface RssPayload {
  rss?: { channel?: RssChannel }
}

interface EpisodeRow {
  transistor_episode_id: string
  title: string
  slug: string
  description: string | null
  show_notes: string | null
  audio_url: string | null
  thumbnail_url: string | null
  published_at: string | null
  duration_seconds: number | null
  episode_number: number | null
  season: number
  is_published: boolean
  is_members_only: boolean
  pinned: boolean
}

export type PodcastSyncOk = {
  ok: true
  inserted: number
  skipped: number
  malformed: number
  episodes: string[]
}

export type PodcastSyncErr = {
  ok: false
  status: number
  error: string
}

export type PodcastSyncResult = PodcastSyncOk | PodcastSyncErr

function pickGuid(guid: RssItem['guid']): string | null {
  if (!guid) return null
  if (typeof guid === 'string') return guid.trim() || null
  if (typeof guid === 'object' && typeof guid['#text'] === 'string') {
    return guid['#text'].trim() || null
  }
  return null
}

function parseDuration(value: string | number | undefined): number | null {
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

function parseInteger(value: string | number | undefined): number | null {
  if (value === undefined || value === null) return null
  if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : null
  const n = parseInt(String(value), 10)
  return Number.isNaN(n) ? null : n
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 200)
}

/**
 * Pull the Transistor RSS feed and insert any new episodes.
 * Used by GET /api/cron/podcast-sync (in-process) and the admin Sync button.
 * Do not HTTP-hop this from the cron route — middleware 401s unauthenticated
 * POSTs to /api/admin/* before x-cron-secret is read.
 */
export async function syncPodcastFromRss(): Promise<PodcastSyncResult> {
  const rssUrl = process.env.PODCAST_RSS_URL
  if (!rssUrl) {
    return { ok: false, status: 500, error: 'PODCAST_RSS_URL not set' }
  }

  let xml: string
  try {
    const res = await fetch(rssUrl, { cache: 'no-store' })
    if (!res.ok) {
      return { ok: false, status: 502, error: `RSS fetch failed: ${res.status} ${res.statusText}` }
    }
    xml = await res.text()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, status: 502, error: `RSS fetch error: ${msg}` }
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: false,
    trimValues: true,
  })

  let parsed: RssPayload
  try {
    parsed = parser.parse(xml) as RssPayload
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, status: 502, error: `XML parse error: ${msg}` }
  }

  const channel = parsed.rss?.channel
  if (!channel) {
    return { ok: false, status: 502, error: 'RSS has no <channel>' }
  }

  const channelArtwork = channel['itunes:image']?.['@_href'] ?? null
  const rawItems = channel.item
  const items: RssItem[] = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : []

  if (items.length === 0) {
    return { ok: true, inserted: 0, skipped: 0, malformed: 0, episodes: [] }
  }

  const { data: existingSlugRows } = await adminClient
    .from('episodes')
    .select('slug')
  const existingSlugs = new Set((existingSlugRows ?? []).map(r => r.slug))

  const seenSlugs = new Set<string>()
  const episodes: EpisodeRow[] = []
  const skippedReasons: string[] = []

  for (const item of items) {
    const guid = pickGuid(item.guid)
    const title = typeof item.title === 'string' ? item.title.trim() : ''
    const audioUrl = item.enclosure?.['@_url'] ?? null

    if (!guid || !title) {
      skippedReasons.push(`malformed item (guid="${guid ?? ''}", title="${title}")`)
      continue
    }

    let slug = slugify(title)
    if (!slug) slug = `episode-${guid.slice(0, 8)}`
    const episodeNumber = parseInteger(item['itunes:episode'])

    if (existingSlugs.has(slug) || seenSlugs.has(slug)) {
      const suffix = episodeNumber !== null ? `-${episodeNumber}` : `-${guid.slice(0, 6)}`
      slug = `${slug}${suffix}`
    }
    if (existingSlugs.has(slug) || seenSlugs.has(slug)) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`
    }
    seenSlugs.add(slug)

    const description = typeof item.description === 'string' ? item.description : null
    const showNotes = typeof item['content:encoded'] === 'string'
      ? item['content:encoded']
      : description
    const thumbnailUrl = item['itunes:image']?.['@_href'] ?? channelArtwork
    const publishedAt = item.pubDate
      ? (() => {
          const d = new Date(item.pubDate as string)
          return Number.isNaN(d.getTime()) ? null : d.toISOString()
        })()
      : null
    const seasonRaw = parseInteger(item['itunes:season'])

    episodes.push({
      transistor_episode_id: guid,
      title,
      slug,
      description,
      show_notes: showNotes,
      audio_url: audioUrl,
      thumbnail_url: thumbnailUrl,
      published_at: publishedAt,
      duration_seconds: parseDuration(item['itunes:duration']),
      episode_number: episodeNumber,
      season: seasonRaw ?? 1,
      is_published: true,
      is_members_only: false,
      pinned: false,
    })
  }

  const { data: inserted, error: upsertError } = await adminClient
    .from('episodes')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(episodes as any, {
      onConflict: 'transistor_episode_id',
      ignoreDuplicates: true,
    })
    .select('id, title')

  if (upsertError) {
    console.error('[podcast-sync] RSS upsert failed:', upsertError)
    return { ok: false, status: 500, error: 'Sync failed. Check server logs for details.' }
  }

  const insertedRows = (inserted ?? []) as Array<{ id: string; title: string }>

  return {
    ok: true,
    inserted: insertedRows.length,
    skipped: episodes.length - insertedRows.length,
    malformed: skippedReasons.length,
    episodes: insertedRows.map(r => r.title),
  }
}
