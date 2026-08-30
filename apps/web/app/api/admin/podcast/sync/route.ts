export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'
import { XMLParser } from 'fast-xml-parser'
import {
  buildDraftEpisodeRow,
  pickGuid,
  parseInteger,
  uniqueSlug,
  type RssItem,
} from '@/lib/podcast/rssSync'

interface RssChannel {
  'itunes:image'?: { '@_href'?: string }
  item?: RssItem | RssItem[]
}

interface RssPayload {
  rss?: { channel?: RssChannel }
}

interface ExistingEpisode {
  id: string
  slug: string
  episode_number: number | null
  transistor_episode_id: string | null
}

export async function POST() {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  const rssUrl = process.env.PODCAST_RSS_URL
  if (!rssUrl) {
    return NextResponse.json({ error: 'PODCAST_RSS_URL not set' }, { status: 500 })
  }

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

  const rawItems = channel.item
  const items: RssItem[] = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : []

  if (items.length === 0) {
    return NextResponse.json({ inserted: 0, linked: 0, skipped: 0, episodes: [] })
  }

  const { data: existingRows } = await adminClient
    .from('episodes')
    .select('id, slug, episode_number, transistor_episode_id')

  const existing = (existingRows ?? []) as ExistingEpisode[]
  const existingSlugs = new Set(existing.map(r => r.slug).filter(Boolean))
  const byGuid = new Map(
    existing
      .filter(r => r.transistor_episode_id)
      .map(r => [r.transistor_episode_id as string, r]),
  )
  // Orphan catalog rows (manual / seed) waiting for a Transistor GUID.
  const orphanByNumber = new Map<number, ExistingEpisode>()
  for (const row of existing) {
    if (row.transistor_episode_id) continue
    if (row.episode_number === null || row.episode_number === undefined) continue
    if (!orphanByNumber.has(row.episode_number)) {
      orphanByNumber.set(row.episode_number, row)
    }
  }

  const seenSlugs = new Set<string>()
  const toInsert: ReturnType<typeof buildDraftEpisodeRow>[] = []
  const linkedTitles: string[] = []
  const skippedReasons: string[] = []
  let skippedKnown = 0

  for (const item of items) {
    const guid = pickGuid(item.guid)
    const title = typeof item.title === 'string' ? item.title.trim() : ''
    if (!guid || !title) {
      skippedReasons.push(`malformed item (guid="${guid ?? ''}", title="${title}")`)
      continue
    }

    if (byGuid.has(guid)) {
      skippedKnown += 1
      continue
    }

    const episodeNumber = parseInteger(item['itunes:episode'])
    const audioUrl = item.enclosure?.['@_url'] ?? null

    // Adopt: stamp GUID onto an existing episode_number row that has none.
    // Never touch thumbnail_url / published_at / is_published / guest art / pillar.
    const orphan = episodeNumber !== null ? orphanByNumber.get(episodeNumber) : undefined
    if (orphan) {
      const { error: linkError } = await adminClient
        .from('episodes')
        .update({
          transistor_episode_id: guid,
          ...(audioUrl ? { audio_url: audioUrl } : {}),
        })
        .eq('id', orphan.id)
        .is('transistor_episode_id', null)

      if (linkError) {
        console.error('[podcast-sync] GUID adopt failed:', linkError)
        return NextResponse.json(
          { error: 'Sync failed. Check server logs for details.' },
          { status: 500 },
        )
      }

      byGuid.set(guid, { ...orphan, transistor_episode_id: guid })
      orphanByNumber.delete(episodeNumber!)
      linkedTitles.push(orphan.slug || title)
      continue
    }

    const taken = new Set([...existingSlugs, ...seenSlugs])
    const slug = uniqueSlug(title, guid, episodeNumber, taken)
    seenSlugs.add(slug)

    toInsert.push(buildDraftEpisodeRow(item, guid, slug))
  }

  let insertedRows: Array<{ id: string; title: string }> = []

  if (toInsert.length > 0) {
    // Upsert by transistor_episode_id, never overwriting existing rows.
    // ignoreDuplicates: true => existing GUID rows pass through unchanged.
    const { data: inserted, error: upsertError } = await adminClient
      .from('episodes')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(toInsert as any, {
        onConflict: 'transistor_episode_id',
        ignoreDuplicates: true,
      })
      .select('id, title')

    if (upsertError) {
      console.error('[podcast-sync] RSS upsert failed:', upsertError)
      return NextResponse.json(
        { error: 'Sync failed. Check server logs for details.' },
        { status: 500 },
      )
    }

    insertedRows = (inserted ?? []) as Array<{ id: string; title: string }>
  }

  return NextResponse.json({
    inserted: insertedRows.length,
    linked: linkedTitles.length,
    skipped: skippedKnown + (toInsert.length - insertedRows.length),
    malformed: skippedReasons.length,
    episodes: [...linkedTitles, ...insertedRows.map(r => r.title)],
  })
}
