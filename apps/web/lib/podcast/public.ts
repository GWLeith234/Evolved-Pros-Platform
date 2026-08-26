import 'server-only'
import { adminClient } from '@/lib/supabase/admin'
import { SPONSOR_AD_COLUMNS, type SponsorAd } from '@/components/home/HomeSponsorAd'
import { ensurePodcastSponsors } from '@/lib/sponsors/partners'
import { resolveCanonicalOrigin } from '@/lib/seo/canonical'

// ---------------------------------------------------------------------------
// Public podcast data + SEO helpers (SPRINT — Public SEO Podcast Pages).
//
// One place the public /podcast index, /podcast/[slug] episode page, the
// sitemap, and the RSS feed all read from — so URLs, fallbacks, and the
// published filter never drift. The episodes table's anon-read-published RLS
// policy is what makes these pages indexable; we still fetch via adminClient
// server-side (no cookie coupling, works during ISR/build).
// ---------------------------------------------------------------------------

/** Brand domain for canonical / OG / sitemap / RSS URLs. Always www —
 *  platform / apex / preview hosts are collapsed by resolveCanonicalOrigin. */
export const SITE_URL = resolveCanonicalOrigin(process.env.NEXT_PUBLIC_SITE_URL)

export const SERIES_NAME = 'The Evolved Pros Podcast'

export interface Chapter { ts: number; title: string }
export interface PullQuote { ts: number; speaker?: string | null; text: string }
export interface TranscriptSegment { speaker?: string | null; ts: number; text: string }

export interface PublicEpisode {
  id: string
  slug: string
  episode_number: number | null
  title: string
  guest_name: string | null
  guest_bio: string | null
  /** Guest's role, e.g. "Chief Digital Officer". Populated on all 9 guests. */
  guest_title: string | null
  /** Guest's org, e.g. "Salem Media". Populated on all 9 guests. */
  guest_company: string | null
  guest_image_url: string | null
  thumbnail_url: string | null
  published_at: string | null
  youtube_id: string | null
  spotify_url: string | null
  apple_url: string | null
  duration_seconds: number | null
  location: string | null
  summary: string | null
  tags: string[]
  /** Primary pillar slug. Populated on all 10 published episodes. */
  pillar: string | null
  /** Secondary pillar slugs. Populated on only 3 today; [] elsewhere. */
  pillars: string[]
  chapters: Chapter[]
  pull_quotes: PullQuote[]
  transcript_text: string | null
  transcript_segments: TranscriptSegment[]
}

const SELECT_COLS =
  'id, slug, episode_number, title, guest_name, guest_bio, guest_title, guest_company, ' +
  'guest_image_url, thumbnail_url, published_at, ' +
  'youtube_id, youtube_url, spotify_url, apple_url, duration_seconds, location, ' +
  'summary, description, tags, pillar, pillars, chapters, pull_quotes, transcript_text, transcript, transcript_segments'

const YT_ID_RE = /^[A-Za-z0-9_-]{8,15}$/

/** Pull a YouTube video id from a bare id or any youtube URL form. */
export function parseYouTubeId(idOrUrl: string | null | undefined): string | null {
  if (!idOrUrl) return null
  const raw = idOrUrl.trim()
  if (YT_ID_RE.test(raw) && !raw.includes('/') && !raw.includes('.')) return raw
  const candidates = /^https?:\/\//i.test(raw) ? [raw] : [`https://${raw}`]
  for (const c of candidates) {
    let u: URL
    try { u = new URL(c) } catch { continue }
    const host = u.hostname.toLowerCase().replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0]
      if (id && YT_ID_RE.test(id)) return id
    }
    if (host.endsWith('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v && YT_ID_RE.test(v)) return v
      const seg = u.pathname.split('/').filter(Boolean)
      if (seg.length >= 2 && ['embed', 'shorts', 'v', 'live'].includes(seg[0]) && YT_ID_RE.test(seg[1])) return seg[1]
    }
  }
  return null
}

/** jsonb columns arrive parsed; a placeholder string (early payloads) must not
 *  crash a `.map`. Coerce anything non-array to []. */
function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(row: any): PublicEpisode {
  // Prefer the new SEO columns; fall back to the legacy member-podcast columns
  // so the 8 pre-existing rows render before they are re-seeded.
  const transcriptText: string | null = row.transcript_text ?? row.transcript ?? null
  return {
    id: row.id,
    slug: row.slug,
    episode_number: row.episode_number ?? null,
    title: row.title,
    guest_name: row.guest_name ?? null,
    guest_bio: row.guest_bio ?? null,
    guest_title: row.guest_title ?? null,
    guest_company: row.guest_company ?? null,
    guest_image_url: row.guest_image_url ?? null,
    thumbnail_url: row.thumbnail_url ?? null,
    published_at: row.published_at ?? null,
    youtube_id: parseYouTubeId(row.youtube_id ?? row.youtube_url),
    spotify_url: row.spotify_url ?? null,
    apple_url: row.apple_url ?? null,
    duration_seconds: row.duration_seconds ?? null,
    location: row.location ?? null,
    summary: row.summary ?? row.description ?? null,
    tags: asArray<string>(row.tags),
    pillar: row.pillar ?? null,
    // `pillars` is string[] | null in the schema — coerce the null to [].
    pillars: asArray<string>(row.pillars),
    chapters: asArray<Chapter>(row.chapters),
    pull_quotes: asArray<PullQuote>(row.pull_quotes),
    transcript_text: transcriptText,
    transcript_segments: asArray<TranscriptSegment>(row.transcript_segments),
  }
}

export async function getPublishedEpisodes(): Promise<PublicEpisode[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (adminClient as any)
    .from('episodes')
    .select(SELECT_COLS)
    .eq('is_published', true) // NULL-safe: never rely on IS NOT false (bit events before)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('episode_number', { ascending: false, nullsFirst: false })
  return ((data ?? []) as unknown[]).map(normalize)
}

export async function getEpisodeBySlug(slug: string): Promise<PublicEpisode | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (adminClient as any)
    .from('episodes')
    .select(SELECT_COLS)
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()
  return data ? normalize(data) : null
}

/** 3–4 published episodes sharing the most tags with `ep` (fallback: newest). */
export function relatedEpisodes(ep: PublicEpisode, all: PublicEpisode[], limit = 4): PublicEpisode[] {
  const tags = new Set(ep.tags)
  const scored = all
    .filter(e => e.slug !== ep.slug)
    .map(e => ({ e, score: e.tags.reduce((s, t) => s + (tags.has(t) ? 1 : 0), 0) }))
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map(s => s.e)
}

// ── formatting / SEO helpers ───────────────────────────────────────────────

export function episodeUrl(slug: string): string {
  return `${SITE_URL}/podcast/${slug}`
}

export function ytThumb(youtubeId: string | null, quality: 'hq' | 'max' = 'max'): string | null {
  if (!youtubeId) return null
  return `https://i.ytimg.com/vi/${youtubeId}/${quality === 'max' ? 'maxresdefault' : 'hqdefault'}.jpg`
}

/** Best available poster for the episode player facade. */
export function episodePosterUrl(ep: Pick<PublicEpisode, 'thumbnail_url' | 'guest_image_url' | 'youtube_id'>): string | null {
  return ep.thumbnail_url?.trim()
    || ep.guest_image_url?.trim()
    || ytThumb(ep.youtube_id, 'max')
}

export function summaryText(ep: PublicEpisode): string {
  return (ep.summary ?? '').trim()
}

/** Real transcript body → paragraphs, or [] when only a placeholder/empty. */
export function transcriptParagraphs(ep: PublicEpisode): string[] {
  const t = (ep.transcript_text ?? '').trim()
  if (!t || /^(SEED FROM SOURCE|PENDING)\b/i.test(t)) return []
  return t.split(/\n{2,}/).map(p => p.replace(/\s+/g, ' ').trim()).filter(Boolean)
}

export function hasSegments(ep: PublicEpisode): boolean {
  return ep.transcript_segments.length > 0
}

/** ISO-8601 duration (PT#H#M#S) for schema.org. */
export function isoDuration(seconds: number | null): string | undefined {
  if (!seconds || seconds <= 0) return undefined
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s ? `${s}S` : ''}` || 'PT0S'
}

export function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export function formatTimestamp(ts: number): string {
  const h = Math.floor(ts / 3600)
  const m = Math.floor((ts % 3600) / 60)
  const s = ts % 60
  const mm = h ? String(m).padStart(2, '0') : String(m)
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}

export function youtubeTimestampUrl(youtubeId: string | null, ts: number): string | null {
  if (!youtubeId) return null
  return `https://youtu.be/${youtubeId}?t=${ts}`
}

/**
 * Evolution Partner + Academy pool for podcast surfaces (index + episode pages).
 * Uses podcast/`all` placements only — never dumps every active ad (which was
 * pulling clipped Academy banners into the archive grid). Always includes the
 * Academy architecture promo + flagship partners.
 */
export async function getPodcastSponsorPool(): Promise<SponsorAd[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = adminClient as any
  const nowIso = new Date().toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inDate = (q: any) =>
    q
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${nowIso}`)
      .or(`end_date.is.null,end_date.gte.${nowIso}`)
      .order('sort_order')
      .limit(24)
  try {
    const primary = await inDate(
      sb.from('platform_ads').select(SPONSOR_AD_COLUMNS).in('placement', ['podcast', 'all']),
    )
    const rows = (primary.data ?? []) as SponsorAd[]
    return ensurePodcastSponsors(rows)
  } catch {
    return ensurePodcastSponsors([])
  }
}
