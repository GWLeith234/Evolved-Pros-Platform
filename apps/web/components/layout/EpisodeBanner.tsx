import { adminClient } from '@/lib/supabase/admin'
import { EpisodeBannerClient } from './EpisodeBannerClient'

const YOUTUBE_CHANNEL = 'https://www.youtube.com/@EvolvedPros'
const BLOCKED_YT_IDS = new Set(['dQw4w9WgXcQ'])

function sanitizeYoutubeUrl(url: string | null): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const id = parsed.searchParams.get('v') ?? (parsed.hostname === 'youtu.be' ? parsed.pathname.slice(1) : null)
    if (id && BLOCKED_YT_IDS.has(id)) return YOUTUBE_CHANNEL
    return url
  } catch {
    return url
  }
}

type Episode = {
  id: string
  title: string
  slug: string | null
  guest_name: string | null
  guest_title: string | null
  published_at: string | null
  youtube_url: string | null
  mux_playback_id: string | null
}

function formatPublishedAt(dateStr: string): string {
  const d = new Date(dateStr)
  const month = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
  const date  = d.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' })
  return `${month} ${date}`
}

export async function EpisodeBanner() {
  let episode: Episode | null = null
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (adminClient as any)
      .from('episodes')
      .select('id, title, slug, guest_name, guest_title, published_at, youtube_url, mux_playback_id')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(1)
      .single()
    episode = data ?? null
  } catch {
    // episodes table may not exist yet — render nothing
  }

  if (!episode) return null

  const sanitizedYtUrl = sanitizeYoutubeUrl(episode.youtube_url)
  const href = sanitizedYtUrl ?? (episode.slug ? `/podcast/${episode.slug}` : '/podcast')
  const ctaLabel = sanitizedYtUrl ? '▶ Watch on YouTube' : '▶ Watch now'

  return (
    <EpisodeBannerClient
      episodeId={episode.id}
      displayText={episode.title}
      guestLabel={episode.guest_name ?? null}
      dateLabel={episode.published_at ? formatPublishedAt(episode.published_at) : null}
      href={href}
      ctaLabel={ctaLabel}
      externalLink={Boolean(sanitizedYtUrl)}
    />
  )
}
