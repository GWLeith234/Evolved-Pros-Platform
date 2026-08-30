import 'server-only'
import { XMLParser } from 'fast-xml-parser'
import { adminClient } from '@/lib/supabase/admin'
import {
  buildDraftEpisodeRow,
  pickGuid,
  parseInteger,
  uniqueSlug,
  type RssItem,
} from '@/lib/podcast/rssSync'

interface RssChannel {
  item?: RssItem | RssItem[]
}

interface RssPayload {
  rss?: { channel?: RssChannel }
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

/**
 * Pull the Transistor RSS feed and insert any new episodes as drafts.
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
  const episodes: ReturnType<typeof buildDraftEpisodeRow>[] = []
  const skippedReasons: string[] = []

  for (const item of items) {
    const guid = pickGuid(item.guid)
    const title = typeof item.title === 'string' ? item.title.trim() : ''

    if (!guid || !title) {
      skippedReasons.push(`malformed item (guid="${guid ?? ''}", title="${title}")`)
      continue
    }

    const episodeNumber = parseInteger(item['itunes:episode'])
    const taken = new Set([...existingSlugs, ...seenSlugs])
    const slug = uniqueSlug(title, guid, episodeNumber, taken)
    seenSlugs.add(slug)

    episodes.push(buildDraftEpisodeRow(item, guid, slug))
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
