import { adminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

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

  const displayText = episode.title
  const guestLabel = episode.guest_name ?? null
  const dateLabel = episode.published_at ? formatPublishedAt(episode.published_at) : null

  const sanitizedYtUrl = sanitizeYoutubeUrl(episode.youtube_url)
  const href = sanitizedYtUrl ?? (episode.slug ? `/podcast/${episode.slug}` : '/podcast')
  const ctaLabel = sanitizedYtUrl ? '▶ Watch on YouTube' : '▶ Watch now'

  return (
    <div
      style={{
        backgroundColor: '#111926',
        borderTop: '2px solid #C9302A',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        height: '38px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '20px',
        paddingRight: '20px',
        flexShrink: 0,
      }}
    >
      {/* Left: badge + guest/title + date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <span
          style={{
            backgroundColor: '#C9302A',
            color: '#ffffff',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '2px 8px',
            borderRadius: '3px',
            flexShrink: 0,
          }}
        >
          LATEST EPISODE
        </span>

        {/* Episode title — primary */}
        <span
          style={{
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {displayText}
        </span>

        {/* Guest name */}
        {guestLabel && (
          <>
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {guestLabel}
            </span>
          </>
        )}

        {/* Date */}
        {dateLabel && (
          <>
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {dateLabel}
            </span>
          </>
        )}
      </div>

      {/* Right: CTA button */}
      <Link
        href={href}
        style={{
          backgroundColor: 'rgba(201,48,42,0.15)',
          border: '1px solid rgba(201,48,42,0.3)',
          color: '#C9302A',
          fontSize: '11px',
          fontWeight: 500,
          padding: '4px 12px',
          borderRadius: '4px',
          textDecoration: 'none',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {ctaLabel}
      </Link>
    </div>
  )
}
