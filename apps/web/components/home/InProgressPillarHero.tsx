import Link from 'next/link'
import { ProgressBar, Button } from '@evolved-pros/ui'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import { formatPct } from '@/lib/format'

const TAGLINES: Record<number, string> = {
  1: 'The ground every operator stands on.',
  2: 'Decide who you are before the work asks.',
  3: 'Hold the line when the day pushes back.',
  4: 'Pick the move with the highest leverage.',
  5: 'Score yourself before anyone else does.',
  6: 'Ship the thing. Then ship the next.',
}

export interface InProgressPillarHeroProps {
  pillar: {
    number: 1 | 2 | 3 | 4 | 5 | 6
    name: string
    progressPct: number
    completedLessons: number
    totalLessons: number
  }
  /** Slug of the pillar's course (foundation, identity, etc) for the CTA link. */
  courseSlug: string
  /** "DAY N OF 21" — N derived from earliest lesson_progress on this pillar. */
  dayOfTwentyOne: number | null
  /** Title of the next lesson, when known. */
  nextLessonTitle: string | null
  /** Slug of the next lesson, for the deep-link CTA. */
  nextLessonSlug: string | null
}

export function InProgressPillarHero({
  pillar,
  courseSlug,
  dayOfTwentyOne,
  nextLessonTitle,
  nextLessonSlug,
}: InProgressPillarHeroProps) {
  const cfg = PILLAR_CONFIG[pillar.number]
  const tagline = TAGLINES[pillar.number] ?? ''
  const ctaHref = nextLessonSlug
    ? `/academy/${courseSlug}/${nextLessonSlug}`
    : `/academy/${courseSlug}`
  const isDone = pillar.progressPct >= 100

  return (
    <div
      className="ep-surface-card relative overflow-hidden p-6"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 0,
      }}
    >
      {/* Pillar accent strip */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: cfg.color }}
      />

      {dayOfTwentyOne !== null && (
        <span
          className="absolute font-condensed font-bold uppercase tracking-[0.18em] text-[12px] px-2 py-1"
          style={{
            top: 12,
            right: 12,
            color: cfg.color,
            backgroundColor: cfg.colorMuted,
            border: `1px solid ${cfg.color}33`,
          }}
        >
          Cohort day {dayOfTwentyOne} of 21
        </span>
      )}

      <div className="flex items-baseline gap-3 mb-1">
        <span
          className="leading-none"
          style={{
            fontFamily: '"Bebas Neue", sans-serif',
            letterSpacing: '0.02em',
            fontSize: 48,
            color: cfg.color,
          }}
        >
          {pillar.number}
        </span>
        <span
          className="font-condensed font-bold uppercase tracking-[0.14em]"
          style={{ fontSize: 18, color: 'var(--text-primary)' }}
        >
          {pillar.name}
        </span>
        {isDone && (
          <span
            className="font-condensed font-bold uppercase tracking-[0.14em] text-[11px] px-2 py-0.5"
            style={{
              color: '#0A0F18',
              background: 'var(--brand-gold, #C9A84C)',
            }}
          >
            Done
          </span>
        )}
      </div>

      {tagline && (
        <p
          className="mt-1 mb-4"
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 16,
            fontStyle: 'italic',
            color: 'var(--text-secondary)',
          }}
        >
          {tagline}
        </p>
      )}

      <div className="mb-1">
        <ProgressBar
          value={pillar.progressPct}
          pillar={pillar.number}
          size="md"
          meta={`${pillar.completedLessons} of ${pillar.totalLessons} · ${formatPct(pillar.progressPct / 100)}`}
          showPercent={false}
        />
      </div>

      {nextLessonTitle && (
        <div
          className="mt-4 p-3"
          style={{ background: cfg.colorMuted, border: `1px solid ${cfg.color}33` }}
        >
          <p
            className="font-condensed font-bold uppercase tracking-[0.18em] text-[12px] mb-1"
            style={{ color: cfg.color }}
          >
            Next up
          </p>
          <p className="font-body text-[13px] leading-snug" style={{ color: 'var(--text-primary)' }}>
            {nextLessonTitle}
          </p>
        </div>
      )}

      <div className="mt-4">
        <Button
          variant={isDone ? 'success' : 'primary'}
          size="md"
          href={ctaHref}
          fullWidth
        >
          {nextLessonTitle ? 'Continue lesson' : isDone ? 'Review course' : 'Open course'}
        </Button>
      </div>
    </div>
  )
}
