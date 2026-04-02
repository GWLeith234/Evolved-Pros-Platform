import Link from 'next/link'
import { getAvatarColor } from '@/lib/community/types'
import { MemberBadge } from '@/components/ui/MemberBadge'
import { Tooltip } from '@/components/ui/Tooltip'
import { tierColor } from '@/lib/tier-color'
import type { LeaderboardEntry, MemberSummary, CommunityAd, EpisodeSummary } from '@/lib/community/types'

interface LeaderboardRailProps {
  leaderboard: LeaderboardEntry[]
  activeMembers: MemberSummary[]
  currentUserId: string
  currentUserTier?: string | null
  ads?: CommunityAd[]
  episode?: EpisodeSummary | null
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function Divider() {
  return <div className="my-4" style={{ height: '1px', backgroundColor: 'rgba(27,60,90,0.08)' }} />
}

function RailSection({ eyebrow, children, tooltip }: { eyebrow: string; children: React.ReactNode; tooltip?: string }) {
  return (
    <div>
      {tooltip ? (
        <Tooltip content={tooltip}>
          <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] mb-3 cursor-help" style={{ color: '#ef0e30' }}>
            {eyebrow}
          </p>
        </Tooltip>
      ) : (
        <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] mb-3" style={{ color: '#ef0e30' }}>
          {eyebrow}
        </p>
      )}
      {children}
    </div>
  )
}

function LeaderboardRow({ entry, currentUserTier }: { entry: LeaderboardEntry; currentUserTier?: string | null }) {
  const avatarBg = getAvatarColor(entry.userId)
  const isTop3 = entry.rank <= 3
  const tc = entry.isCurrentUser ? tierColor(currentUserTier) : null
  const rankColor = entry.isCurrentUser ? (tc ?? '#c9a84c') : isTop3 ? '#c9a84c' : 'rgba(255,255,255,0.15)'

  return (
    <div className="flex items-center gap-2.5 py-2">
      <span className="font-display font-black w-6 text-right flex-shrink-0" style={{ fontSize: '18px', color: rankColor, lineHeight: 1 }}>
        {entry.rank}
      </span>
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ backgroundColor: avatarBg }}>
        {entry.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.avatarUrl} alt={entry.displayName} className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <span style={{ fontSize: '9px' }} className="font-condensed font-bold text-white">{getInitials(entry.displayName)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] leading-tight truncate" style={{ color: tc && entry.isCurrentUser ? tc : 'rgba(255,255,255,0.75)', fontWeight: entry.isCurrentUser ? 700 : 500 }}>
          {entry.displayName}{entry.isCurrentUser ? ' (You)' : ''}
        </p>
        <p className="font-condensed font-bold text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
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
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ backgroundColor: avatarBg }}>
        {member.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.avatarUrl} alt={member.displayName} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <span className="text-[10px] font-condensed font-bold text-white">{getInitials(member.displayName)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-body text-[13px] font-medium text-[#1b3c5a] group-hover:text-[#68a2b9] transition-colors truncate">{member.displayName}</span>
          {member.tier && <MemberBadge tier={member.tier} size="sm" />}
        </div>
        {member.roleTitle && <p className="font-condensed text-[10px] text-[#7a8a96] truncate">{member.roleTitle}</p>}
      </div>
    </Link>
  )
}

function AdCard({ ad }: { ad: CommunityAd }) {
  const href = [ad.click_url, ad.link_url].find(u => u && u !== '#') ?? null
  const label = ad.headline ?? ad.tool_name ?? ad.sponsor_name ?? 'Sponsored'
  const cta = ad.cta_text ?? 'Learn More →'

  const inner = (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(27,60,90,0.1)' }}>
      {ad.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ad.image_url}
          alt={label}
          className="w-full object-cover"
          style={{ aspectRatio: '4/3' }}
        />
      ) : (
        <div
          className="w-full flex items-center justify-center"
          style={{ aspectRatio: '4/3', backgroundColor: 'rgba(27,60,90,0.06)' }}
        >
          <span className="font-condensed text-[11px]" style={{ color: 'rgba(27,60,90,0.3)' }}>{label}</span>
        </div>
      )}
      <div className="px-3 py-2.5" style={{ backgroundColor: '#f5f7f9' }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-condensed font-bold text-[12px] leading-tight truncate" style={{ color: '#112535' }}>{label}</p>
            <p className="font-condensed font-semibold text-[11px] mt-1" style={{ color: '#68a2b9' }}>{cta}</p>
          </div>
          <span
            className="font-condensed font-bold text-[8px] uppercase tracking-wider rounded flex-shrink-0 px-1.5 py-0.5"
            style={{ backgroundColor: '#ef0e30', color: 'white' }}
          >
            Ad
          </span>
        </div>
      </div>
    </div>
  )

  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className="block hover:opacity-95 transition-opacity">{inner}</a>
  }
  return <div>{inner}</div>
}

function PodcastCard({ episode }: { episode: EpisodeSummary }) {
  const duration = formatDuration(episode.duration_seconds)
  const date = formatDate(episode.published_at)

  return (
    <Link href="/podcast" className="block group">
      {/* 16:9 image */}
      <div className="relative w-full rounded-t-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
        {episode.guest_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={episode.guest_image_url}
            alt={episode.title}
            className="w-full h-full object-cover object-top"
          />
        ) : episode.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={episode.thumbnail_url}
            alt={episode.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: 'linear-gradient(135deg, #0a2030, #0d1e2c)' }}
          />
        )}

        {/* Gradient overlay bottom-to-top */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(13,30,44,0.9) 0%, transparent 60%)' }}
        />

        {/* Episode number + title overlaid */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          {episode.episode_number != null && (
            <p className="font-display font-black text-[13px] leading-none" style={{ color: '#C9A84C' }}>
              #{episode.episode_number}
            </p>
          )}
          <p className="font-display font-bold text-[12px] leading-tight text-white line-clamp-2">
            {episode.title}
          </p>
        </div>
      </div>

      {/* Card body */}
      <div
        className="rounded-b-lg px-3 py-2.5"
        style={{ backgroundColor: '#0d1e2c', border: '1px solid rgba(255,255,255,0.06)', borderTop: 'none' }}
      >
        {episode.guest_name && (
          <p className="font-condensed font-bold text-[12px] text-white leading-tight">{episode.guest_name}</p>
        )}
        {(episode.guest_title || episode.guest_company) && (
          <p className="font-condensed font-semibold text-[10px]" style={{ color: '#C9A84C' }}>
            {episode.guest_title}
            {episode.guest_title && episode.guest_company && ' · '}
            {episode.guest_company}
          </p>
        )}
        {(duration || date) && (
          <p className="font-condensed text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {duration}{duration && date ? ' · ' : ''}{date}
          </p>
        )}

        {/* Watch button */}
        <div
          className="mt-2.5 rounded py-2 text-center font-condensed font-bold uppercase tracking-[0.12em] text-[11px] text-white transition-all group-hover:bg-[#1b3c5a]"
          style={{ backgroundColor: '#112535', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          ▶ Watch Now
        </div>
      </div>

      <p
        className="font-condensed text-[9px] text-center mt-1.5 uppercase tracking-[0.18em]"
        style={{ color: '#0ABFA3' }}
      >
        ↻ Updates every week
      </p>
    </Link>
  )
}

export function LeaderboardRail({ leaderboard, activeMembers, currentUserId, currentUserTier, ads = [], episode = null }: LeaderboardRailProps) {
  const top4 = leaderboard.slice(0, 4)
  const currentInTop4 = top4.some(e => e.isCurrentUser)
  const currentEntry = !currentInTop4 ? leaderboard.find(e => e.isCurrentUser) : null
  const displayEntries = currentEntry ? [...top4, currentEntry] : top4

  const adSlot1 = ads[0] ?? null
  const adSlot2 = ads[1] ?? null

  return (
    <aside
      className="overflow-y-auto flex-shrink-0"
      style={{
        width: '260px',
        borderLeft: '1px solid rgba(27,60,90,0.1)',
        backgroundColor: 'var(--card-bg)',
        padding: '20px',
      }}
    >
      {/* 6a. Leaderboard */}
      <RailSection eyebrow="Leaderboard — This Week" tooltip="Earn points by posting, replying, and getting likes. Top contributors recognized each week.">
        <div className="space-y-0.5">
          {displayEntries.length === 0 ? (
            <p className="font-condensed text-xs text-[#7a8a96]">No data yet</p>
          ) : (
            displayEntries.map(entry => (
              <LeaderboardRow key={entry.userId} entry={entry} currentUserTier={currentUserTier} />
            ))
          )}
        </div>
      </RailSection>

      {/* 6b. Ad slot 1 */}
      {adSlot1 && (
        <>
          <Divider />
          <AdCard ad={adSlot1} />
        </>
      )}

      <Divider />

      {/* 6c. Active Members */}
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

      {/* 6d. Ad slot 2 */}
      {adSlot2 && (
        <>
          <Divider />
          <AdCard ad={adSlot2} />
        </>
      )}

      {/* 6e. Latest podcast card */}
      {episode && (
        <>
          <Divider />
          <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] mb-3" style={{ color: '#ef0e30' }}>
            Latest Podcast
          </p>
          <PodcastCard episode={episode} />
        </>
      )}
    </aside>
  )
}
