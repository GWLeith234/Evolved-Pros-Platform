import type { Habit } from '@/types/habits'
import { PILLAR_COLORS } from '@/types/habits'

const PILLAR_COPY: Record<string, string> = {
  'Foundation':         'Your foundation is the bedrock everything else is built on — protect it today.',
  'Identity':           'The story you tell yourself shapes the man you become — reinforce it now.',
  'Mental Toughness':   'Discomfort is the price of growth — lean into the hard thing today.',
  'Strategic Approach': 'One focused hour of strategy is worth ten of scattered effort — plan before you act.',
  'Accountability':     'You can\'t improve what you don\'t measure — own today\'s numbers.',
  'Execution':          'Ideas are common; consistent execution is rare — close the gap today.',
}

interface NudgeCardProps {
  habits: Habit[]
  completedIds: Set<string>
}

export function NudgeCard({ habits, completedIds }: NudgeCardProps) {
  const pillars = Object.keys(PILLAR_COLORS)

  // Find pillar with lowest completion % (only include pillars with at least 1 habit)
  let weakestPillar: string | null = null
  let weakestPct = Infinity

  for (const pillar of pillars) {
    const group = habits.filter(h => h.pillar === pillar && h.is_active)
    if (group.length === 0) continue
    const done = group.filter(h => completedIds.has(h.id)).length
    const pct  = done / group.length
    if (pct < weakestPct) {
      weakestPct    = pct
      weakestPillar = pillar
    }
  }

  // Nothing to nudge if all pillars are complete or no pillar data
  if (!weakestPillar || weakestPct === 1) return null

  const color = PILLAR_COLORS[weakestPillar]
  const copy  = PILLAR_COPY[weakestPillar] ?? 'Stay consistent — small actions compound over time.'

  return (
    <div
      className="rounded-lg px-4 py-4"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderLeft: `3px solid ${color}`,
        border: `1px solid ${color}22`,
        borderLeftWidth: '3px',
        borderLeftColor: color,
      }}
    >
      <p
        className="font-condensed font-bold uppercase tracking-[0.14em] mb-1"
        style={{ fontSize: '9px', color }}
      >
        {weakestPillar} needs attention today
      </p>
      <p
        className="font-body leading-relaxed"
        style={{ fontSize: '13px', color: 'var(--text-secondary)' }}
      >
        {copy}
      </p>
    </div>
  )
}
