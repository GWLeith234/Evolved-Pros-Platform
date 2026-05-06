'use client'

import Link from 'next/link'
import { Card, CardBody } from '@evolved-pros/ui'

export type QuarterlyGoal = {
  id: string
  title: string
  period: string
  progress_pct: number
  weekly_delta: number
  pillar: string | null
}

interface QuarterlyGoalsProps {
  goals: QuarterlyGoal[]
  editHref?: string
}

const PILLAR_COLOR: Record<string, string> = {
  foundation: '#FFA538',
  identity: '#A78BFA',
  mental: '#F87171',
  strategy: '#60A5FA',
  accountability: '#C9A84C',
  execution: '#0ABFA3',
}

const DEFAULT_COLOR = '#68a2b9'

function colorFor(pillar: string | null): string {
  if (!pillar) return DEFAULT_COLOR
  return PILLAR_COLOR[pillar.toLowerCase()] ?? DEFAULT_COLOR
}

function isStreakGoal(title: string): boolean {
  return /streak/i.test(title)
}

function deltaLabel(goal: QuarterlyGoal): string | null {
  if (isStreakGoal(goal.title)) {
    const day = Math.max(0, Math.round((goal.progress_pct / 100) * 60))
    return `↑ DAY ${day}`
  }
  if (goal.weekly_delta === 0) return null
  const sign = goal.weekly_delta > 0 ? '↑ +' : '↓ '
  return `${sign}${Math.abs(goal.weekly_delta)}% WK`
}

export function QuarterlyGoals({ goals, editHref = '#' }: QuarterlyGoalsProps) {
  return (
    <Card>
      <CardBody className="!px-6 !py-5 space-y-4">
        {/* HOME-1: single 22px/500 uppercase headline + right-aligned
            action link. Replaces the eyebrow "THE LONG GAME" + h3
            "Quarterly Goals" stack. */}
        <div className="flex items-baseline justify-between gap-3">
          <h3
            className="font-condensed text-[22px] font-medium uppercase tracking-[0.04em] text-[#1b3c5a] leading-none"
          >
            Long Game
          </h3>
          <Link
            href={editHref}
            className="font-condensed text-[11px] tracking-[0.18em] text-[#68a2b9] hover:text-[#1b3c5a] uppercase whitespace-nowrap"
          >
            Edit →
          </Link>
        </div>

        {goals.length === 0 ? (
          <p className="font-condensed text-xs tracking-widest text-[#7a8a96] text-center py-4">
            No active goals yet
          </p>
        ) : (
          <div className="space-y-3">
            {goals.map(goal => {
              const color = colorFor(goal.pillar)
              const delta = deltaLabel(goal)
              return (
                <div
                  key={goal.id}
                  className="rounded-lg border border-[rgba(27,60,90,0.08)] bg-white px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-body font-bold text-[12px] leading-snug text-[#1b3c5a]">
                      {goal.title}
                    </span>
                    <span
                      className="font-condensed text-[9px] font-bold tracking-[0.12em] uppercase rounded px-1.5 py-0.5 shrink-0"
                      style={{ color, backgroundColor: `${color}1f` }}
                    >
                      {goal.period}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span
                      className="font-display font-extrabold text-[22px] leading-none"
                      style={{ color }}
                    >
                      {goal.progress_pct}%
                    </span>
                    {delta && (
                      <span
                        className="font-condensed text-[10px] font-bold tracking-[0.1em]"
                        style={{ color }}
                      >
                        {delta}
                      </span>
                    )}
                  </div>
                  <div
                    className="w-full rounded-full overflow-hidden"
                    style={{ height: '4px', backgroundColor: 'rgba(27,60,90,0.08)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${goal.progress_pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
