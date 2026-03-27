import Link from 'next/link'
import { getAvatarColor } from '@/lib/community/types'
import { MemberBadge } from '@/components/ui/MemberBadge'
import { Tooltip } from '@/components/ui/Tooltip'
import type { LeaderboardEntry, MemberSummary } from '@/lib/community/types'

interface LeaderboardRailProps {
  leaderboard: LeaderboardEntry[]
  activeMembers: MemberSummary[]
  currentUserId: string
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function RailSection({ eyebrow, children, tooltip }: { eyebrow: string; children: React.ReactNode; tooltip?: string }) {
  return (
    <div>
      {tooltip ? (
        <Tooltip content={tooltip}>
          <p
            className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] mb-3 cursor-help"
            style={{ color: '#ef0e30' }}
          >
            {eyebrow}
          </p>
        </Tooltip>
      ) : (
        <p
          className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] mb-3"
          style={{ color: '#ef0e30' }}
        >
          {eyebrow}
        </p>
      )}
      {children}
    </div>
  )
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const avatarBg = getAvatarColor(entry.userId)
  const isTop3 = entry.rank <= 3
  const rankColor = isTop3 ? '#c9a84c' : 'rgba(27,60,90,0.2)'

  return (
    <div className="flex items-center gap-2.5 py-2">
      {/* Rank */}
      <span
        className="font-display font-black w-6 text-right flex-shrink-0"
        style={{ fontSize: '18px', color: rankColor, lineHeight: 1 }}
      >
        {entry.rank}
      </span>

      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: avatarBg }}
      >
        {entry.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.avatarUrl} alt={entry.displayName} className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <span style={{ fontSize: '9px' }} className="font-condensed font-bold text-white">
            {getInitials(entry.displayName)}
          </span>
        )}
      </div>

      {/* Name + points */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] leading-tight truncate"
          style={{
            color: '#1b3c5a',
            fontWeight: entry.isCurrentUser ? 700 : 500,
          }}
        >
          {entry.displayName}{entry.isCurrentUser ? ' (You)' : ''}
        </p>
        <p className="font-condensed font-bold text-[12px]" style={{ color: '#112535' }}>
          {entry.points.toLocaleString()} pts
        </p>
      </div>
    </div>
  )
}

function ActiveMemberRow({ member }: { member: MemberSummary }) {
  const avatarBg = getAvatarColor(member.id)

  return (
    <Link href={`/profile/${member.id}`} className="flex items-center gap-2.5 py-2 group">
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: avatarBg }}
      >
        {member.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.avatarUrl} alt={member.displayName} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <span className="text-[10px] font-condensed font-bold text-white">
            {getInitials(member.displayName)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-body text-[13px] font-medium text-[#1b3c5a] group-hover:text-[#68a2b9] transition-colors truncate">
            {member.displayName}
          </span>
          {member.tier && <MemberBadge tier={member.tier} size="sm" />}
        </div>
        {member.roleTitle && (
          <p className="font-condensed text-[10px] text-[#7a8a96] truncate">{member.roleTitle}</p>
        )}
      </div>
    </Link>
  )
}

export function LeaderboardRail({ leaderboard, activeMembers, currentUserId }: LeaderboardRailProps) {
  // Show top 4 + current user (if not in top 4)
  const top4 = leaderboard.slice(0, 4)
  const currentInTop4 = top4.some(e => e.isCurrentUser)
  const currentEntry = !currentInTop4 ? leaderboard.find(e => e.isCurrentUser) : null
  const displayEntries = currentEntry ? [...top4, currentEntry] : top4

  return (
    <aside
      className="overflow-y-auto flex-shrink-0"
      style={{
        width: '260px',
        borderLeft: '1px solid rgba(27,60,90,0.1)',
        backgroundColor: 'white',
        padding: '20px',
      }}
    >
      <RailSection eyebrow="Leaderboard — This Week" tooltip="Earn points by posting, replying, and getting likes. Top contributors recognized each week.">
        <div className="space-y-0.5">
          {displayEntries.length === 0 ? (
            <p className="font-condensed text-xs text-[#7a8a96]">No data yet</p>
          ) : (
            displayEntries.map(entry => (
              <LeaderboardRow key={entry.userId} entry={entry} />
            ))
          )}
        </div>
      </RailSection>

      <div
        className="my-4"
        style={{ height: '1px', backgroundColor: 'rgba(27,60,90,0.08)' }}
      />

      <RailSection eyebrow="Active Members">
        <div className="space-y-0.5">
          {activeMembers.length === 0 ? (
            <p className="font-condensed text-xs text-[#7a8a96]">No members yet</p>
          ) : (
            activeMembers.map(member => (
              <ActiveMemberRow key={member.id} member={member} />
            ))
          )}
        </div>
      </RailSection>
    </aside>
  )
}
