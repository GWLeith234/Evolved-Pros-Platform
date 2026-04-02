import { MemberBadge } from '@/components/ui/MemberBadge'
import { Tooltip } from '@/components/ui/Tooltip'
import { tierColor, tierColorRgba } from '@/lib/tier-color'

const PILLAR_LABELS: Record<string, string> = {
  p1: 'Foundation',
  p2: 'Identity',
  p3: 'Mental Toughness',
  p4: 'Strategy',
  p5: 'Accountability',
  p6: 'Execution',
}

type ProfileHeaderUser = {
  id: string
  display_name: string | null
  full_name: string | null
  avatar_url: string | null
  banner_url?: string | null
  role_title: string | null
  tier: string | null
  points: number
  created_at: string
  postCount: number
  company?: string | null
  linkedin_url?: string | null
  website_url?: string | null
  twitter_handle?: string | null
  location?: string | null
  current_pillar?: string | null
  goal_90day?: string | null
  goal_visible?: boolean
  pioneer_driver_type?: string | null
}

interface ProfileHeaderProps {
  user: ProfileHeaderUser
  isOwn?: boolean
  onChangeBanner?: () => void
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function formatJoinDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function ProfileHeader({ user, isOwn = false, onChangeBanner }: ProfileHeaderProps) {
  const displayName = user.display_name ?? user.full_name ?? 'Member'
  const tc = tierColor(user.tier)
  const hasSocialLinks = !!(user.linkedin_url || user.website_url || user.twitter_handle)

  const statCards: { label: string; value: string; tooltip?: string }[] = [
    { label: 'Posts', value: String(user.postCount) },
    { label: 'Points', value: user.points.toLocaleString(), tooltip: 'Points are earned through community engagement — posting, replying, and receiving likes.' },
    { label: 'Joined', value: formatJoinDate(user.created_at) },
    ...(user.company ? [{ label: 'Company', value: user.company }] : []),
  ]

  return (
    <div style={{ backgroundColor: '#111926', borderRadius: '10px', overflow: 'hidden' }}>
      {/* Banner */}
      <div style={{ position: 'relative', height: '180px' }}>
        {user.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.banner_url}
            alt="Profile banner"
            style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '180px', background: 'linear-gradient(135deg, #112535 0%, #1b3c5a 100%)' }} />
        )}
        {/* Gradient fade to page bg */}
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 30%, #0A0F18 100%)',
          }}
        />
        {isOwn && onChangeBanner && (
          <Tooltip content="Your profile banner is the header image at the top of your profile. Choose a preset or upload your own.">
            <button
              type="button"
              onClick={onChangeBanner}
              style={{
                position: 'absolute', bottom: '12px', right: '12px', zIndex: 10,
                background: 'rgba(0,0,0,0.6)', color: 'white',
                border: '0.5px solid rgba(255,255,255,0.3)', borderRadius: '6px',
                padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Change Banner
            </button>
          </Tooltip>
        )}
      </div>

      {/* Profile info */}
      <div style={{ padding: '0 28px 28px' }}>
        {/* Avatar + Identity */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '20px' }}>
          {/* Avatar — overlaps banner bottom edge */}
          <div
            style={{
              width: '120px', height: '120px', borderRadius: '50%',
              flexShrink: 0, overflow: 'hidden',
              marginTop: '-64px', position: 'relative', zIndex: 10,
              border: `3px solid ${tc}`,
              boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              backgroundColor: '#ef0e30',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt={displayName}
                style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, color: 'white', fontSize: '34px' }}>
                {getInitials(displayName)}
              </span>
            )}
          </div>

          {/* Identity */}
          <div style={{ paddingBottom: '4px', flex: 1, minWidth: 0 }}>
            {/* Row 1: name + tier badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'white', lineHeight: 1.05, fontFamily: '"Arial Black", Arial, sans-serif', margin: 0 }}>
                {displayName}
              </h1>
              <MemberBadge tier={user.tier} size="md" />
            </div>
            {/* Row 2: role · location · pillar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {user.role_title && (
                <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.45)' }}>
                  {user.role_title}
                </span>
              )}
              {user.location && (
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>📍 {user.location}</span>
              )}
              {user.current_pillar && PILLAR_LABELS[user.current_pillar] && (
                <span style={{
                  borderRadius: '4px', padding: '2px 8px',
                  fontSize: '9px', fontWeight: 600, fontFamily: '"Barlow Condensed", sans-serif',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: '#C9A84C', border: '1px solid rgba(201,168,76,0.25)', background: 'rgba(201,168,76,0.06)',
                }}>
                  {user.current_pillar.toUpperCase()} · {PILLAR_LABELS[user.current_pillar]}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stat cards row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: hasSocialLinks || user.pioneer_driver_type ? '16px' : '0' }}>
          {statCards.map(({ label, value, tooltip }) => {
            const card = (
              <div
                key={label}
                style={{
                  background: tierColorRgba(user.tier, 0.08),
                  border: `1px solid ${tierColorRgba(user.tier, 0.2)}`,
                  borderRadius: '8px',
                  padding: '8px 14px',
                }}
              >
                <p style={{
                  fontSize: '18px', fontWeight: 900, color: 'white', lineHeight: 1,
                  fontFamily: '"Arial Black", Arial, sans-serif', margin: '0 0 3px',
                }}>
                  {value}
                </p>
                <p style={{
                  fontSize: '8px', fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: tc,
                  fontFamily: '"Barlow Condensed", sans-serif', margin: 0,
                }}>
                  {label}
                </p>
              </div>
            )
            return tooltip ? (
              <Tooltip key={label} content={tooltip}>{card}</Tooltip>
            ) : card
          })}
        </div>

        {/* Pioneer-Driver type badge */}
        {user.pioneer_driver_type && (
          <div style={{ marginBottom: hasSocialLinks ? '12px' : '0' }}>
            <span style={{
              border: '1px solid #C9A84C', color: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.08)',
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              fontSize: '10px', padding: '2px 8px', borderRadius: '4px', display: 'inline-block',
            }}>
              {user.pioneer_driver_type} TYPE
            </span>
          </div>
        )}

        {/* Social links */}
        {hasSocialLinks && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user.linkedin_url && (
              <a
                href={user.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn"
                style={{ color: 'rgba(255,255,255,0.45)', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = tc)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect x="2" y="9" width="4" height="12"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
            )}
            {user.website_url && (
              <a
                href={user.website_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Website"
                style={{ color: 'rgba(255,255,255,0.45)', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = tc)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </a>
            )}
            {user.twitter_handle && (
              <a
                href={`https://twitter.com/${user.twitter_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                title={`@${user.twitter_handle} on X`}
                style={{ color: 'rgba(255,255,255,0.45)', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = tc)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
