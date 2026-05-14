import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { dbRowToEpisode, type EpisodeRow, type ProgressRow } from '@/lib/podcast/transforms'
import { PodcastPageShell } from '@/components/podcast/PodcastPageShell'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'

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
      .order('published_at', { ascending: false })
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

  return <PodcastPageShell episodes={episodes} />
}
