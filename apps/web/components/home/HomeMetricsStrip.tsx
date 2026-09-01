/**
 * Home metrics strip — personal scoreboard under the welcome banner.
 * Uses Sprint 1 StatCards so greeting + metrics share one design language.
 */
import { StatCard } from '@evolved-pros/ui'

export type HomeMetrics = {
  academyProgressPct: number
  pillarsUnlocked: number
  pillarsTotal: number
  communityMemberCount: number
  newMembersThisWeek: number
  leaderboardRank: number
}

interface HomeMetricsStripProps {
  stats: HomeMetrics
}

export function HomeMetricsStrip({ stats }: HomeMetricsStripProps) {
  const membersDelta =
    stats.newMembersThisWeek > 0
      ? `+${stats.newMembersThisWeek} this week`
      : 'Steady'

  return (
    <section
      aria-label="Your scoreboard"
      style={{ width: '100%', maxWidth: 1440, margin: '0 auto' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--brand-gold, #C9A84C)',
            }}
          >
            Your scoreboard
          </p>
          <h2
            style={{
              margin: '4px 0 0',
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 22,
              letterSpacing: '0.04em',
              lineHeight: 1,
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
            }}
          >
            Progress at a glance
          </h2>
        </div>
      </div>

      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        style={{ width: '100%' }}
      >
        <StatCard
          value={`${stats.academyProgressPct}%`}
          label="Academy"
          delta={
            stats.academyProgressPct >= 100
              ? 'Complete'
              : stats.academyProgressPct > 0
                ? 'In progress'
                : 'Not started'
          }
          deltaType={
            stats.academyProgressPct >= 100
              ? 'up'
              : stats.academyProgressPct > 0
                ? 'neutral'
                : 'neutral'
          }
          accent="teal"
        />
        <StatCard
          value={`${stats.pillarsUnlocked}/${stats.pillarsTotal || 6}`}
          label="Pillars unlocked"
          hint="Tier access"
          accent="gold"
        />
        <StatCard
          value={stats.communityMemberCount.toLocaleString()}
          label="Members"
          delta={membersDelta}
          deltaType={stats.newMembersThisWeek > 0 ? 'up' : 'neutral'}
          accent="violet"
        />
        <StatCard
          value={`#${stats.leaderboardRank}`}
          label="Leaderboard"
          hint="By points"
          accent="red"
        />
      </div>
    </section>
  )
}
