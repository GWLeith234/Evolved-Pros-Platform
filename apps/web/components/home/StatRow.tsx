import { StatCard } from '@evolved-pros/ui'

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
      <StatCard
        value={stats.communityMemberCount}
        label="Community Members"
        delta={`+${stats.newMembersThisWeek} this week`}
        deltaType="up"
        accent="red"
      />
      <StatCard
        value={`${stats.pillarsUnlocked} / ${stats.pillarsTotal}`}
        label="Pillars Unlocked"
        delta={locked > 0 ? `${locked} remaining` : 'All unlocked'}
        deltaType={locked > 0 ? 'neutral' : 'up'}
        accent="teal"
      />
      <StatCard
        value={`${stats.academyProgressPct}%`}
        label="Academy Progress"
        delta={stats.academyProgressPct > 0 ? `${stats.academyProgressPct}% complete` : 'Not started'}
        deltaType={stats.academyProgressPct > 0 ? 'up' : 'neutral'}
        accent="navy"
      />
      <StatCard
        value={`#${stats.leaderboardRank}`}
        label="Leaderboard Rank"
        deltaType="neutral"
        accent="gold"
      />
    </div>
  )
}
