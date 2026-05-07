import { ProfileStats } from './ProfileStats'
import { SendMessageButton } from './SendMessageButton'

interface ProfileViewData {
  id: string
  display_name: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  role_title: string | null
  banner_url: string | null
  points: number
  tier: string | null
  created_at: string
}

interface ProfileViewStats {
  posts: number
  badges: number[]
  lessons: number
}

function tierBadgeColor(tier: string | null): string | null {
  const t = tier?.toLowerCase()
  if (t === 'vip') return '#C9A84C'
  if (t === 'pro' || t === 'professional') return '#C9302A'
  return null
}

interface ProfileViewProps {
  profile: ProfileViewData
  stats: ProfileViewStats
  isSelf: boolean
}

const DEFAULT_BANNER =
  'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/pillar-1-foundation.jpg'

function getInitials(profile: ProfileViewData): string {
  const source = profile.full_name ?? profile.display_name ?? ''
  const parts = source.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return parts.map(p => p[0]!).slice(0, 2).join('').toUpperCase()
}

export function ProfileView({ profile, stats, isSelf }: ProfileViewProps) {
  const displayName = profile.display_name ?? profile.full_name ?? 'Member'
  const banner = profile.banner_url ?? DEFAULT_BANNER
  const tierColor = tierBadgeColor(profile.tier)

  return (
    <div style={{ backgroundColor: '#0A0F18', minHeight: '100%' }}>
      {/* Banner */}
      <div
        style={{
          position: 'relative',
          height: '240px',
          backgroundImage: `url(${banner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
          }}
        />
      </div>

      <div className="px-6">
        {/* Avatar + name row, overlapping banner by -64px */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginTop: '-64px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: '128px',
              height: '128px',
              borderRadius: '50%',
              border: '4px solid #0A0F18',
              backgroundColor: '#C9A84C',
              flexShrink: 0,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span
                style={{
                  fontFamily: '"Abril Fatface", Georgia, serif',
                  fontSize: '48px',
                  color: '#0A0F18',
                  lineHeight: 1,
                }}
              >
                {getInitials(profile)}
              </span>
            )}
          </div>

          <div style={{ flex: 1, paddingTop: '64px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontWeight: 700,
                  fontSize: '32px',
                  color: '#F5F0E8',
                  margin: 0,
                  lineHeight: 1.15,
                }}
              >
                {displayName}
              </h1>
              {tierColor && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    border: `1px solid ${tierColor}`,
                    backgroundColor: `${tierColor}22`,
                    color: tierColor,
                    fontFamily: '"Barlow Condensed", sans-serif',
                    fontWeight: 700,
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.16em',
                  }}
                >
                  {profile.tier!.toLowerCase() === 'vip' ? 'VIP' : 'Pro'}
                </span>
              )}
            </div>
            {profile.role_title && (
              <p
                style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: '#7a8a96',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  margin: '4px 0 0',
                }}
              >
                {profile.role_title}
              </p>
            )}
          </div>

          <div style={{ paddingTop: '64px', flexShrink: 0 }}>
            {isSelf ? (
              <a
                href={`/profile/${profile.id}?edit=1`}
                className="eop-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: '1px solid #C9A84C',
                  color: '#C9A84C',
                  backgroundColor: 'transparent',
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 700,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  textDecoration: 'none',
                }}
              >
                Edit profile →
              </a>
            ) : (
              <SendMessageButton recipientId={profile.id} />
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio ? (
          <p
            style={{
              maxWidth: '680px',
              marginTop: '20px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: '15px',
              color: '#D6D0C4',
              lineHeight: 1.6,
            }}
          >
            {profile.bio}
          </p>
        ) : isSelf ? (
          <p
            style={{
              maxWidth: '680px',
              marginTop: '20px',
              fontFamily: 'Inter, sans-serif',
              fontStyle: 'italic',
              fontSize: '14px',
              color: '#7a8a96',
            }}
          >
            <a href={`/profile/${profile.id}?edit=1`} style={{ color: '#7a8a96', textDecoration: 'underline' }}>
              Add a bio →
            </a>
          </p>
        ) : null}

        {/* Stats */}
        <div style={{ marginTop: '24px', paddingBottom: '24px' }}>
          <ProfileStats
            posts={stats.posts}
            points={profile.points}
            lessons={stats.lessons}
            badges={stats.badges}
          />
        </div>
      </div>
    </div>
  )
}
