import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { dbRowToEpisode, assertMonotonicNumbering, type EpisodeRow, type ProgressRow } from '@/lib/podcast/transforms'
import { PodcastPageShell } from '@/components/podcast/PodcastPageShell'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { SPONSOR_AD_COLUMNS, type SponsorAd } from '@/components/home/HomeSponsorAd'
import {
  ALL_FLAGSHIP_SPONSORS,
  ensureFlagshipSponsors,
} from '@/lib/sponsors/partners'
import { dedupeSponsors } from '@/lib/sponsors/rotate'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'The Evolved Pros Podcast | Evolved Pros' }

export default async function PodcastIndexPage() {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) redirect('/login')

  // Fetch all published episodes via adminClient (bypass RLS for catalog browsing).
  // Episodes + per-user progress are independent reads → parallelise.
  const [episodesRes, progressRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (adminClient as any)
      .from('episodes')
      .select('id, slug, episode_number, title, description, pillar, pinned, guest_name, guest_title, guest_company, guest_image_url, thumbnail_url, duration_seconds, published_at, youtube_url')
      .eq('is_published', true)
      // Deterministic catalogue order: newest publish date first, higher
      // episode number breaking same-day ties so the grid never flips
      // between reloads (PODCAST-CLEANUP S6).
      .order('published_at', { ascending: false })
      .order('episode_number', { ascending: false })
      .limit(100) as Promise<{ data: EpisodeRow[] | null }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (adminClient as any)
      .from('user_episode_progress')
      .select('episode_id, progress')
      .eq('user_id', profile.id) as Promise<{ data: ProgressRow[] | null }>,
  ])
  const rawEpisodes = episodesRes.data
  const rawProgress = progressRes.data

  const progressByEpisode = new Map<string, ProgressRow>()
  for (const p of rawProgress ?? []) progressByEpisode.set(p.episode_id, p)

  const episodes = (rawEpisodes ?? []).map(row => dbRowToEpisode(row, progressByEpisode.get(row.id)))

  // Dev-only sanity check: flag if episode numbering drifts from chronology.
  assertMonotonicNumbering(episodes)

  // Evolution Partner pool interleaved into the archive grid at 3:1. Each grid
  // slot rotates client-side through this whole pool honoring rotation_interval,
  // so we hand down the full active/in-date set (not a pre-sliced pair). Prefer
  // podcast/all-placed ads, then fall back to any active ad, then flagship
  // partners so a slot is never empty.
  const sponsorAds = await fetchPodcastSponsorAds()

  return <PodcastPageShell episodes={episodes} sponsorAds={sponsorAds} />
}

async function fetchPodcastSponsorAds(): Promise<SponsorAd[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = adminClient as any
  const nowIso = new Date().toISOString()
  // Only active, in-date inventory: null start/end = always-on flight window.
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
    if (rows.length < 2) {
      const fallback = await inDate(sb.from('platform_ads').select(SPONSOR_AD_COLUMNS))
      const seen = new Set(rows.map(r => r.id))
      for (const r of (fallback.data ?? []) as SponsorAd[]) {
        if (!seen.has(r.id)) {
          seen.add(r.id)
          rows.push(r)
        }
      }
    }
    // Guarantee the flagship partners are present, then de-dupe. Full pool is
    // returned; the grid's rotating slots cycle through it.
    const pool = rows.length ? ensureFlagshipSponsors(rows) : ALL_FLAGSHIP_SPONSORS
    return dedupeSponsors(pool)
  } catch {
    return dedupeSponsors(ALL_FLAGSHIP_SPONSORS)
  }
}
