'use client'

import Link from 'next/link'
import { Card, CardBody } from '@evolved-pros/ui'
import { formatDate, formatPct, formatTrend } from '@/lib/format'

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

// Text/border color: --pillar-N-ink in light mode (defined in globals.css,
// WCAG-checked against the parchment surface), raw --pillar-N in dark mode
// (that fallback is only reached because --pillar-N-ink is intentionally
// undefined outside html.light-mode — see globals.css THEME-TOGGLE-SPRINT).
const PILLAR_TEXT_COLOR: Record<string, string> = {
  foundation:     'var(--pillar-1-ink, var(--pillar-1))',
  identity:       'var(--pillar-2-ink, var(--pillar-2))',
  mental:         'var(--pillar-3-ink, var(--pillar-3))',
  strategy:       'var(--pillar-4-ink, var(--pillar-4))',
  accountability: 'var(--pillar-5-ink, var(--pillar-5))',
  execution:      'var(--pillar-6-ink, var(--pillar-6))',
}

// Fill/tint base: always the raw pillar hue, never the ink — a 12% tint of
// the vivid color reads fine under either the ink or the raw text color
// layered on top of it.
const PILLAR_RAW_COLOR: Record<string, string> = {
  foundation:     'var(--pillar-1)',
  identity:       'var(--pillar-2)',
  mental:         'var(--pillar-3)',
  strategy:       'var(--pillar-4)',
  accountability: 'var(--pillar-5)',
  execution:      'var(--pillar-6)',
}

const DEFAULT_COLOR = '#68a2b9'

function textColorFor(pillar: string | null): string {
  if (!pillar) return DEFAULT_COLOR
  return PILLAR_TEXT_COLOR[pillar.toLowerCase()] ?? DEFAULT_COLOR
}

function rawColorFor(pillar: string | null): string {
  if (!pillar) return DEFAULT_COLOR
  return PILLAR_RAW_COLOR[pillar.toLowerCase()] ?? DEFAULT_COLOR
}

function isStreakGoal(title: string): boolean {
  return /streak/i.test(title)
}

function deltaLabel(goal: QuarterlyGoal): string {
  if (isStreakGoal(goal.title)) {
    const day = Math.max(0, Math.round((goal.progress_pct / 100) * 60))
    return `↑ DAY ${day}`
  }
  // A4.1: always render the chip via formatTrend — the flat case shows
  // "— 0% wk" (em dash) rather than hiding, so every goal reads the same.
  return formatTrend(goal.weekly_delta / 100)
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
            className="font-condensed text-[12px] tracking-[0.18em] text-[#68a2b9] hover:text-[#1b3c5a] uppercase whitespace-nowrap"
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
              const textColor = textColorFor(goal.pillar)
              const rawColor = rawColorFor(goal.pillar)
              const tintColor = `color-mix(in srgb, ${rawColor} 12%, transparent)`
              const delta = deltaLabel(goal)
              return (
                <div
                  key={goal.id}
                  className="border border-[rgba(27,60,90,0.08)] bg-white px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-body font-bold text-[12px] leading-snug text-[#1b3c5a]">
                      {goal.title}
                    </span>
                    <span
                      className="font-condensed text-[12px] font-bold tracking-[0.12em] uppercase px-1.5 py-0.5 shrink-0"
                      style={{ color: textColor, backgroundColor: tintColor }}
                    >
                      {formatDate(goal.period, 'deadline')}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    {/* A4.2: platform metric numeral = Bebas Neue (--font-logo),
                        not Playfair. Playfair is reserved for editorial copy. */}
                    <span
                      className="text-[26px] leading-none"
                      style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '0.02em', color: textColor }}
                    >
                      {formatPct(goal.progress_pct / 100)}
                    </span>
                    <span
                      className="font-condensed text-[12px] font-bold tracking-[0.1em]"
                      style={{ color: textColor }}
                    >
                      {delta}
                    </span>
                  </div>
                  <div
                    className="w-full overflow-hidden"
                    style={{ height: '4px', backgroundColor: 'rgba(27,60,90,0.08)' }}
                  >
                    <div
                      className="h-full transition-all"
                      style={{ width: `${goal.progress_pct}%`, backgroundColor: rawColor }}
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
