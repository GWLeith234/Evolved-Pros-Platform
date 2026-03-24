import { Badge } from '@evolved-pros/ui'

type ProfileHeaderUser = {
  id: string
  display_name: string | null
  full_name: string | null
  avatar_url: string | null
  role_title: string | null
  tier: string | null
  points: number
  created_at: string
  postCount: number
}

interface ProfileHeaderProps {
  user: ProfileHeaderUser
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function formatJoinDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const displayName = user.display_name ?? user.full_name ?? 'Member'

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: '#112535', padding: '28px' }}
    >
      {/* Top row: avatar + name block */}
      <div className="flex items-start gap-5 mb-5">
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded flex-shrink-0 flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: '#ef0e30' }}
        >
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar_url}
              alt={displayName}
              className="w-16 h-16 object-cover"
            />
          ) : (
            <span className="font-condensed font-bold text-white text-xl">
              {getInitials(displayName)}
            </span>
          )}
        </div>

        {/* Name + role */}
        <div>
          <h1
            className="font-display font-bold text-white leading-tight mb-1"
            style={{ fontSize: '22px' }}
          >
            {displayName}
          </h1>
          {user.role_title && (
            <p
              className="font-condensed font-semibold uppercase tracking-wide text-[11px] mb-2"
              style={{ color: '#68a2b9' }}
            >
              {user.role_title}
            </p>
          )}
          {(user.tier === 'community' || user.tier === 'pro') && (
            <Badge kind="tier" tier={user.tier} />
          )}
        </div>
      </div>

      {/* Stats row */}
      <div
        className="flex items-center gap-8 pt-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        {[
          { label: 'Posts', value: user.postCount },
          { label: 'Points', value: user.points },
          { label: 'Joined', value: formatJoinDate(user.created_at) },
        ].map(stat => (
          <div key={stat.label}>
            <p
              className="font-display font-bold text-white leading-none"
              style={{ fontSize: typeof stat.value === 'number' ? '20px' : '14px' }}
            >
              {stat.value}
            </p>
            <p
              className="font-condensed font-semibold uppercase tracking-widest text-[9px] mt-0.5"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
