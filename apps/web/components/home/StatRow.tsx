import { StatCard } from '@evolved-pros/ui'
import { Tooltip } from '@/components/ui/Tooltip'

interface DashboardStats {
  communityMemberCount: number
  newMembersThisWeek: number
  pillarsUnlocked: number
  pillarsTotal: number
  academyProgressPct: number
  leaderboardRank: number
}

interface StatRowProps {
  stats: DashboardStats
}

export function StatRow({ stats }: StatRowProps) {
  const locked = stats.pillarsTotal - stats.pillarsUnlocked

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Tooltip content="Total active members in the Evolved Pros community.">
        <StatCard
          value={stats.communityMemberCount}
          label="Community Members"
          delta={`+${stats.newMembersThisWeek} this week`}
          deltaType="neutral"
          accent="red"
        />
      </Tooltip>
      <Tooltip content="Pillars are the 6 core course tracks in the Evolved Architecture. Your tier determines how many you can access.">
        <StatCard
          value={`${stats.pillarsUnlocked} / ${stats.pillarsTotal}`}
          label="Pillars Unlocked"
          delta={locked > 0 ? `${locked} more to unlock` : 'All unlocked'}
          deltaType={locked > 0 ? 'neutral' : 'up'}
          accent="teal"
        />
      </Tooltip>
      <Tooltip content="Tracks your completion across all Academy lessons. Complete lessons to increase your percentage.">
        <StatCard
          value={`${stats.academyProgressPct}%`}
          label="Academy Progress"
          delta={stats.academyProgressPct > 0 ? `${stats.academyProgressPct}% complete` : 'Start your first lesson →'}
          deltaType={stats.academyProgressPct > 0 ? 'up' : 'neutral'}
          accent="navy"
        />
      </Tooltip>
      <Tooltip content="Your weekly rank based on points from posts, replies, and engagement. Resets every Monday.">
        <StatCard
          value={`#${stats.leaderboardRank}`}
          label="Leaderboard Rank"
          deltaType="neutral"
          accent="gold"
        />
      </Tooltip>
    </div>
  )
}
