import { DailyPulseCard, type DailyPulseHabit, type DailyPulseCommitment } from './DailyPulseCard'
import { LagMeasures } from './LagMeasures'
import { TimeBlocks, type TimeBlock } from './TimeBlocks'
import type { GoalForCard } from './GoalCard'

interface TodaysEvolutionProps {
  displayName: string
  habits: DailyPulseHabit[]
  commitments: DailyPulseCommitment[]
  goals: GoalForCard[]
  timeBlocks: TimeBlock[]
}

/**
 * "Today's Evolution" — the primary daily dashboard. One motivational frame
 * around three focused, high-value tools:
 *   1. Lead measures (DailyPulseCard) — the daily reps you control + streaks.
 *   2. Lag measures (LagMeasures)     — the outcomes those reps drive.
 *   3. Time blocks (TimeBlocks)       — protect time for the work that matters.
 * Lead measures drive lag measures — win the day to win the quarter.
 */
export function TodaysEvolution({ displayName, habits, commitments, goals, timeBlocks }: TodaysEvolutionProps) {
  return (
    <section id="today" aria-label="Today's Evolution" style={{ width: '100%', maxWidth: 1440, margin: '0 auto' }}>
      <div style={{ marginBottom: 14 }}>
        <p style={{
          margin: 0, fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 800, fontSize: 11,
          letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--brand-red, #C9302A)',
        }}>Today&apos;s Evolution</p>
        <h2 style={{
          margin: '4px 0 0', fontFamily: '"Bebas Neue", sans-serif', fontSize: 30, letterSpacing: '0.03em',
          lineHeight: 1, color: 'var(--text-primary)', textTransform: 'uppercase',
        }}>Win today, {displayName}.</h2>
        <p style={{
          margin: '6px 0 0', fontFamily: '"Barlow", sans-serif', fontSize: 13.5, lineHeight: 1.5,
          color: 'var(--text-secondary)', maxWidth: 640,
        }}>
          Move your <strong style={{ color: 'var(--text-primary)' }}>lead measures</strong> — the daily reps you
          control — and the <strong style={{ color: 'var(--text-primary)' }}>lag measures</strong> (your outcomes)
          follow. Block the time, log the win, keep the streak.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <DailyPulseCard habits={habits} commitments={commitments} />
        <LagMeasures goals={goals} />
        <TimeBlocks initial={timeBlocks} />
      </div>
    </section>
  )
}
