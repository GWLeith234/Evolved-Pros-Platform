import { MemberBadge } from '@/components/ui/MemberBadge'
import { Tooltip } from '@/components/ui/Tooltip'

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
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function ProfileHeader({ user, isOwn = false, onChangeBanner }: ProfileHeaderProps) {
  const displayName = user.display_name ?? user.full_name ?? 'Member'
  const hasSocialLinks = user.linkedin_url || user.website_url || user.twitter_handle

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#112535' }}>
      {/* Banner */}
      <div className="relative" style={{ height: '200px' }}>
        {user.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.banner_url}
            alt="Profile banner"
            style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '200px',
              background: 'linear-gradient(135deg, #112535 0%, #1b3c5a 100%)',
            }}
          />
        )}
        {isOwn && onChangeBanner && (
          <Tooltip content="Your profile banner is the header image at the top of your profile. Choose a preset or upload your own.">
            <button
              type="button"
              onClick={onChangeBanner}
              style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                border: '0.5px solid rgba(255,255,255,0.3)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Change Banner
            </button>
          </Tooltip>
        )}
      </div>

      {/* Profile info */}
      <div style={{ padding: '28px' }}>
        {/* Top row: avatar + name block */}
        <div className="flex items-start gap-5 mb-5">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: '#ef0e30', marginTop: '-48px', border: '3px solid #112535' }}
          >
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt={displayName}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <span className="font-condensed font-bold text-white text-xl">
                {getInitials(displayName)}
              </span>
            )}
          </div>

          {/* Name + role + company + social */}
          <div style={{ marginTop: '-48px', paddingTop: '8px' }}>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1
                className="font-display font-bold text-white leading-tight"
                style={{ fontSize: '22px' }}
              >
                {displayName}
              </h1>
              <MemberBadge tier={user.tier} size="md" />
            </div>
            {user.role_title && (
              <p
                className="font-condensed font-semibold uppercase tracking-wide text-[11px]"
                style={{ color: '#68a2b9' }}
              >
                {user.role_title}
              </p>
            )}
            {user.company && (
              <p
                className="font-body text-[12px] mt-0.5"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                {user.company}
              </p>
            )}
            {user.location && (
              <p
                className="font-body text-[12px] mt-0.5"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                📍 {user.location}
              </p>
            )}

            {/* Current Pillar badge */}
            {user.current_pillar && PILLAR_LABELS[user.current_pillar] && (
              <div className="mt-2">
                <span
                  className="inline-block font-condensed font-bold uppercase tracking-wide text-[10px] px-2.5 py-1 rounded"
                  style={{ backgroundColor: 'rgba(104,162,185,0.15)', color: '#68a2b9' }}
                >
                  {user.current_pillar.toUpperCase()} · {PILLAR_LABELS[user.current_pillar]}
                </span>
              </div>
            )}

            {/* Social links row */}
            {hasSocialLinks && (
              <div className="flex items-center gap-3 mt-2">
                {user.linkedin_url && (
                  <a
                    href={user.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="LinkedIn"
                    style={{ color: 'rgba(255,255,255,0.45)', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#68a2b9')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                  >
                    {/* LinkedIn "in" icon */}
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
                    onMouseEnter={e => (e.currentTarget.style.color = '#68a2b9')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                  >
                    {/* Globe icon */}
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
                    onMouseEnter={e => (e.currentTarget.style.color = '#68a2b9')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                  >
                    {/* X (Twitter) icon */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div
          className="flex items-center gap-8 pt-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          {[
            { label: 'Posts', value: user.postCount, tooltip: undefined },
            { label: 'Points', value: user.points, tooltip: 'Points are earned through community engagement — posting, replying, and receiving likes.' },
            { label: 'Joined', value: formatJoinDate(user.created_at), tooltip: undefined },
          ].map(({ label, value, tooltip }) => {
            const inner = (
              <div>
                <p
                  className="font-display font-bold text-white leading-none"
                  style={{ fontSize: typeof value === 'number' ? '20px' : '14px' }}
                >
                  {value}
                </p>
                <p
                  className="font-condensed font-semibold uppercase tracking-widest text-[9px] mt-0.5"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  {label}
                </p>
              </div>
            )
            return tooltip ? (
              <Tooltip key={label} content={tooltip}>{inner}</Tooltip>
            ) : (
              <div key={label}>{inner}</div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
