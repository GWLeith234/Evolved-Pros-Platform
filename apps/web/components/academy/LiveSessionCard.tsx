import { adminClient } from '@/lib/supabase/admin'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'

interface Props {
  pillarId: string
  pillarNumber: number
}

interface EventRow {
  id: string
  title: string
  starts_at: string | null
  ends_at: string | null
  event_type: string | null
  zoom_url: string | null
  tier_access: string | null
}

function formatEventDate(iso: string | null): string {
  if (!iso) return 'Date TBD'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  })
}

export async function LiveSessionCard({ pillarNumber }: Props) {
  const config = PILLAR_CONFIG[pillarNumber]
  const label = config?.label ?? 'Pillar'

  // Filter upcoming published events that reference this pillar in title or description
  const now = new Date().toISOString()
  const { data: events } = await adminClient
    .from('events')
    .select('id, title, starts_at, ends_at, event_type, zoom_url, tier_access')
    .eq('is_published', true)
    .gt('starts_at', now)
    .or(`title.ilike.%${label}%,description.ilike.%${label}%`)
    .order('starts_at', { ascending: true })
    .limit(3)

  const upcoming = (events ?? []) as EventRow[]

  return (
    <div
      style={{
        backgroundColor: '#111926',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '8px',
        padding: '28px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <p
            style={{
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase',
              color: config?.color ?? '#68a2b9', margin: '0 0 4px',
            }}
          >
            Live Sessions
          </p>
          <p style={{ color: 'rgba(250,249,247,0.65)', fontSize: '14px', margin: 0 }}>
            Upcoming sessions for the {label} pillar
          </p>
        </div>
        <a
          href="/events"
          style={{
            fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
            fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'rgba(250,249,247,0.35)', textDecoration: 'none',
          }}
        >
          All Events →
        </a>
      </div>

      {upcoming.length === 0 ? (
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            backgroundColor: 'rgba(255,255,255,0.02)',
            borderRadius: '6px',
            border: '1px dashed rgba(255,255,255,0.08)',
          }}
        >
          <p
            style={{
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'rgba(250,249,247,0.25)', margin: '0 0 8px',
            }}
          >
            No upcoming sessions
          </p>
          <p style={{ color: 'rgba(250,249,247,0.2)', fontSize: '13px', margin: 0 }}>
            Check back soon — new sessions are added regularly.
          </p>
          <a
            href="/events"
            style={{
              display: 'inline-block', marginTop: '16px',
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase',
              color: config?.color ?? '#68a2b9', textDecoration: 'none',
            }}
          >
            Browse all events →
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {upcoming.map(event => (
            <div
              key={event.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '6px', padding: '16px 20px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Event type badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                      fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase',
                      color: config?.color ?? '#68a2b9',
                      backgroundColor: `${config?.color ?? '#68a2b9'}18`,
                      padding: '2px 8px', borderRadius: '3px',
                    }}
                  >
                    {event.event_type === 'live' ? 'Live' : event.event_type === 'virtual' ? 'Virtual' : 'Session'}
                  </span>
                  {event.tier_access === 'pro' && (
                    <span
                      style={{
                        fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                        fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase',
                        color: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.1)',
                        padding: '2px 8px', borderRadius: '3px',
                      }}
                    >
                      Pro Only
                    </span>
                  )}
                </div>
                <p
                  style={{
                    fontSize: '14px', fontWeight: 600, color: '#faf9f7',
                    margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                >
                  {event.title}
                </p>
                <p style={{ fontSize: '12px', color: 'rgba(250,249,247,0.4)', margin: 0 }}>
                  {formatEventDate(event.starts_at)}
                </p>
              </div>

              <a
                href={`/events`}
                style={{
                  flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center',
                  backgroundColor: config?.color ?? '#68a2b9', color: '#0A0F18',
                  fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                  fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '8px 16px', borderRadius: '4px', textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Register →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
