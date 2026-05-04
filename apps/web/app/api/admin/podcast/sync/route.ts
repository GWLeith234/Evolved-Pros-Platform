export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'
import { XMLParser } from 'fast-xml-parser'

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
    // HH:MM:SS or MM:SS
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

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const cronHeader = request.headers.get('x-cron-secret')
  const isCron = !!cronSecret && cronHeader === cronSecret

  if (!isCron) {
    const guard = await requireAdminApi()
    if (guard instanceof Response) return guard
  }

  const rssUrl = process.env.PODCAST_RSS_URL
  if (!rssUrl) {
    return NextResponse.json({ error: 'PODCAST_RSS_URL not set' }, { status: 500 })
  }

  // Fetch RSS
  let xml: string
  try {
    const res = await fetch(rssUrl, { cache: 'no-store' })
    if (!res.ok) {
      return NextResponse.json(
        { error: `RSS fetch failed: ${res.status} ${res.statusText}` },
        { status: 502 },
      )
    }
    xml = await res.text()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `RSS fetch error: ${msg}` }, { status: 502 })
  }

  // Parse XML
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
    return NextResponse.json({ error: `XML parse error: ${msg}` }, { status: 502 })
  }

  const channel = parsed.rss?.channel
  if (!channel) {
    return NextResponse.json({ error: 'RSS has no <channel>' }, { status: 502 })
  }

  const channelArtwork = channel['itunes:image']?.['@_href'] ?? null
  const rawItems = channel.item
  const items: RssItem[] = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : []

  if (items.length === 0) {
    return NextResponse.json({ inserted: 0, skipped: 0, episodes: [] })
  }

  // Pre-fetch existing slugs once so we can resolve collisions in-memory
  // before sending the upsert.
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

    // Slug collision: append episode number, then a short guid suffix.
    if (existingSlugs.has(slug) || seenSlugs.has(slug)) {
      const suffix = episodeNumber !== null ? `-${episodeNumber}` : `-${guid.slice(0, 6)}`
      slug = `${slug}${suffix}`
    }
    if (existingSlugs.has(slug) || seenSlugs.has(slug)) {
      // Final fallback — guarantee uniqueness.
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

  // Upsert by transistor_episode_id, never overwriting existing rows.
  // ignoreDuplicates: true => existing transistor_episode_id rows pass
  // through unchanged. Insert returns only the newly-created rows.
  const { data: inserted, error: upsertError } = await adminClient
    .from('episodes')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(episodes as any, {
      onConflict: 'transistor_episode_id',
      ignoreDuplicates: true,
    })
    .select('id, title')

  if (upsertError) {
    console.error('[podcast/sync] upsert error:', upsertError)
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  const insertedRows = (inserted ?? []) as Array<{ id: string; title: string }>

  return NextResponse.json({
    inserted: insertedRows.length,
    skipped: episodes.length - insertedRows.length,
    malformed: skippedReasons.length,
    episodes: insertedRows.map(r => r.title),
  })
}
