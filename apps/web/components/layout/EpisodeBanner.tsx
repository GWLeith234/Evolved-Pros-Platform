import { adminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

type Episode = {
  id: string
  title: string
  guest_name: string | null
  air_date: string | null
  episode_url: string | null
  status: string | null
}

function formatAirDate(dateStr: string): string {
  // Parse as noon UTC to avoid day-shifting across timezones
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00Z`)
  const day   = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
  const month = d.toLocaleDateString('en-US', { month: 'long',   timeZone: 'UTC' })
  const date  = d.toLocaleDateString('en-US', { day: 'numeric',  timeZone: 'UTC' })
  return `${day} · ${month} ${date}`
}

export async function EpisodeBanner() {
  let episode: Episode | null = null
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (adminClient as any)
      .from('episodes')
      .select('id, title, guest_name, air_date, episode_url, status')
      .or('status.eq.upcoming,status.eq.live')
      .order('air_date', { ascending: true })
      .limit(1)
      .single()
    episode = data ?? null
  } catch {
    // episodes table may not exist yet — render nothing
  }

  if (!episode) return null

  const displayText = episode.guest_name ?? episode.title
  const airDateLabel = episode.air_date ? formatAirDate(episode.air_date) : null
  const href = episode.episode_url ?? '/podcast'
  const isLive = episode.status === 'live'

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
      {/* Left: badge + guest + date */}
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
          {isLive ? 'LIVE NOW' : 'NEXT EPISODE'}
        </span>

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

        {airDateLabel && (
          <>
            <span
              style={{
                width: '3px',
                height: '3px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                color: 'rgba(255,255,255,0.35)',
                fontSize: '11px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {airDateLabel}
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
        ▶ {isLive ? 'Watch live' : 'Watch now'}
      </Link>
    </div>
  )
}
