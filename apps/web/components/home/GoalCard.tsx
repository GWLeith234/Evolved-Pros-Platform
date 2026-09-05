import Link from 'next/link'
import { ProgressBar } from '@evolved-pros/ui'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import { formatDate, formatPct, formatTrend } from '@/lib/format'

// Map AI / DB pillar slugs → numeric key used by PILLAR_CONFIG.
const PILLAR_SLUG_TO_NUMBER: Record<string, 1 | 2 | 3 | 4 | 5 | 6> = {
  foundation:        1,
  identity:          2,
  mental:            3,
  'mental-toughness': 3,
  strategy:          4,
  'strategic-approach': 4,
  accountability:    5,
  execution:         6,
}

export interface GoalForCard {
  id: string
  title: string
  /** e.g. 'Q2-2026' */
  period: string
  progress_pct: number
  weekly_delta: number
  pillar: string | null
}

interface GoalCardProps {
  goal: GoalForCard
  /**
   * If set and matches the goal's pillar, render the "↳ TIED TO PATH FORWARD"
   * footer with a CONTINUE link to the in-progress lesson.
   */
  inProgressPillarSlug?: string | null
  inProgressContinueHref?: string | null
}

interface PaceInfo {
  expectedPct: number
  status: 'on-track' | 'ahead' | 'behind'
  label: string
  /** Days remaining until period end. Negative means past due. */
  daysLeft: number
}

/**
 * Derive pace info from a quarterly_goals row. The schema doesn't store an
 * explicit target_date, so we infer it from `period` ('Q{1-4}-YYYY' or 'YYYY-Q{1-4}').
 * On-track threshold: within 10% of the linear-pace expectation.
 */
function computePace(period: string, progressPct: number, now: Date = new Date()): PaceInfo | null {
  const m = period.match(/Q(\d)[-/](\d{4})/i) ?? period.match(/(\d{4})[-/]Q(\d)/i)
  if (!m) return null
  const q     = parseInt(m[1].length === 4 ? m[2] : m[1], 10)
  const yyyy  = parseInt(m[1].length === 4 ? m[1] : m[2], 10)
  if (q < 1 || q > 4) return null

  const startMonth = (q - 1) * 3 // 0,3,6,9
  const start = new Date(Date.UTC(yyyy, startMonth, 1))
  const end   = new Date(Date.UTC(yyyy, startMonth + 3, 0, 23, 59, 59)) // last day of quarter

  const totalMs   = end.getTime() - start.getTime()
  const elapsedMs = Math.max(0, Math.min(totalMs, now.getTime() - start.getTime()))
  const expectedPct = Math.round((elapsedMs / totalMs) * 100)
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  const delta = progressPct - expectedPct
  let status: PaceInfo['status'] = 'on-track'
  if (delta > 10)  status = 'ahead'
  if (delta < -10) status = 'behind'

  const label = status === 'on-track'
    ? 'On track'
    : status === 'ahead'
      ? `Ahead by ${formatPct(delta / 100)}`
      : `Behind by ${formatPct(Math.abs(delta) / 100)}`

  return { expectedPct, status, label, daysLeft }
}

const STATUS_STYLE: Record<PaceInfo['status'], { bg: string; color: string }> = {
  'on-track': { bg: 'rgba(34,197,94,0.10)',  color: '#22c55e' },
  'ahead':    { bg: 'rgba(10,191,163,0.10)', color: '#0ABFA3' },
  'behind':   { bg: 'rgba(239,14,48,0.08)',  color: '#ef0e30' },
}

export function GoalCard({ goal, inProgressPillarSlug, inProgressContinueHref }: GoalCardProps) {
  const pillarKey = goal.pillar ? PILLAR_SLUG_TO_NUMBER[goal.pillar.toLowerCase()] : null
  const cfg = pillarKey ? PILLAR_CONFIG[pillarKey] : null
  // Fill/tint/border-accent base: always the raw pillar hue (matches
  // QuarterlyGoals.tsx's PILLAR_RAW_COLOR — never the ink).
  const accentColor = cfg?.color ?? '#68a2b9'
  // Text color: --pillar-N-ink in light mode (WCAG-checked against parchment
  // surfaces, defined in globals.css), raw --pillar-N hue in dark mode via
  // the var() fallback — same ink+tint split as QuarterlyGoals.tsx.
  const textColor = pillarKey ? `var(--pillar-${pillarKey}-ink, var(--pillar-${pillarKey}))` : accentColor

  const pace = computePace(goal.period, goal.progress_pct)
  // Resolve both sides to the canonical numeric key so 'mental' and
  // 'mental-toughness' (DB vs course-slug forms) compare equal.
  const inProgressKey = inProgressPillarSlug ? PILLAR_SLUG_TO_NUMBER[inProgressPillarSlug.toLowerCase()] : null
  const tiedToPath = !!inProgressKey && !!pillarKey && inProgressKey === pillarKey

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="font-body font-bold text-[13px] leading-snug" style={{ color: 'var(--text-primary)' }}>
            {goal.title}
          </span>
          <span
            className="font-condensed text-[12px] font-bold tracking-[0.12em] uppercase rounded px-1.5 py-0.5 shrink-0"
            style={{ color: textColor, backgroundColor: `${accentColor}1f` }}
          >
            {formatDate(goal.period, 'deadline')}
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-1.5">
          {/* A4.2: platform metric numeral = Bebas Neue (--font-logo), not
              Playfair. Playfair is reserved for editorial copy. */}
          <span
            className="leading-none"
            style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '0.02em', fontSize: 26, color: textColor }}
          >
            {formatPct(goal.progress_pct / 100)}
          </span>
          <span
            className="font-condensed font-bold tracking-[0.1em] text-[12px]"
            style={{ color: goal.weekly_delta < 0 ? '#ef0e30' : textColor }}
          >
            {formatTrend(goal.weekly_delta / 100)}
          </span>
        </div>

        <ProgressBar
          value={goal.progress_pct}
          pillar={pillarKey ?? undefined}
          color={accentColor}
          size="sm"
          showPercent={false}
        />

        {pace && (
          <div className="flex items-center justify-between mt-2">
            {/* pace is derived from `new Date()` at render scope (computePace's
                default arg). Server (UTC clock) and client can disagree if a
                threshold is crossed mid-hydration — suppress the resulting
                #425 warning; the value re-renders correctly on first effect. */}
            <span
              className="font-condensed font-bold uppercase tracking-[0.14em] text-[12px] px-2 py-0.5 rounded"
              style={STATUS_STYLE[pace.status]}
              suppressHydrationWarning
            >
              {pace.label}
            </span>
            <span
              className="font-condensed text-[12px]"
              style={{ color: 'var(--text-tertiary)' }}
              suppressHydrationWarning
            >
              {pace.daysLeft >= 0 ? `${pace.daysLeft} days left` : 'past due'}
            </span>
          </div>
        )}
      </div>

      {tiedToPath && inProgressContinueHref && (
        <Link
          href={inProgressContinueHref}
          className="flex items-center justify-between px-4 py-2 transition-colors hover:bg-[var(--bg-elevated)]"
          style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-elevated)' }}
        >
          <span
            className="font-condensed font-bold uppercase tracking-[0.16em] text-[12px]"
            style={{ color: textColor }}
          >
            ↳ Tied to path forward
          </span>
          <span
            className="font-condensed font-bold uppercase tracking-[0.14em] text-[12px]"
            style={{ color: textColor }}
          >
            Continue →
          </span>
        </Link>
      )}
    </div>
  )
}
