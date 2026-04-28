import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { dbRowToEpisode, type EpisodeRow, type ProgressRow } from '@/lib/podcast/transforms'
import { PodcastPageShell } from '@/components/podcast/PodcastPageShell'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'The Evolved Pros Podcast | Evolved Pros' }

export default async function PodcastIndexPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all published episodes via adminClient (bypass RLS for catalog browsing).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawEpisodes } = await (adminClient as any)
    .from('episodes')
    .select('id, slug, episode_number, title, description, pillar, pinned, guest_name, guest_title, guest_company, guest_image_url, thumbnail_url, duration_seconds, published_at, youtube_url')
    .eq('is_published', true)
    .order('published_at', { ascending: false }) as { data: EpisodeRow[] | null }

  // Per-user watched progress (auth.uid maps directly to user_episode_progress.user_id).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawProgress } = await (adminClient as any)
    .from('user_episode_progress')
    .select('episode_id, progress')
    .eq('user_id', user.id) as { data: ProgressRow[] | null }

  const progressByEpisode = new Map<string, ProgressRow>()
  for (const p of rawProgress ?? []) progressByEpisode.set(p.episode_id, p)

  const episodes = (rawEpisodes ?? []).map(row => dbRowToEpisode(row, progressByEpisode.get(row.id)))

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? ''

  return <PodcastPageShell episodes={episodes} shareUrlBase={siteUrl} />
}
