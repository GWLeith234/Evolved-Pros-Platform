import Link from 'next/link'
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

  return (
    <div
      className="relative rounded-lg overflow-hidden bg-white p-6"
      style={{ border: '1px solid rgba(27,60,90,0.1)' }}
    >
      {/* Pillar accent strip */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: cfg.color }}
      />

      {/* Cohort-day stamp. This is a SEPARATE axis from lesson progress (the
          21-day program cadence), explicitly labelled "Cohort day" so it does
          not read as completion next to the "N of M lessons · NN%" headline,
          which is the real progress metric (A3.2). */}
      {dayOfTwentyOne !== null && (
        <span
          className="absolute font-condensed font-bold uppercase tracking-[0.18em] text-[12px] px-2 py-1 rounded"
          style={{
            top: 12, right: 12,
            color: cfg.color,
            backgroundColor: cfg.colorMuted,
            border: `1px solid ${cfg.color}33`,
          }}
        >
          Cohort day {dayOfTwentyOne} of 21
        </span>
      )}

      <div className="flex items-baseline gap-3 mb-1">
        {/* A4.2: platform metric numeral = Bebas Neue (--font-logo), not Playfair. */}
        <span
          className="leading-none"
          style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '0.02em', fontSize: 48, color: cfg.color }}
        >
          {pillar.number}
        </span>
        <span
          className="font-condensed font-bold uppercase tracking-[0.14em]"
          style={{ fontSize: 18, color: '#1b3c5a' }}
        >
          {pillar.name}
        </span>
      </div>

      {tagline && (
        <p
          className="mt-1 mb-4"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 16, fontStyle: 'italic', color: '#1b3c5a' }}
        >
          {tagline}
        </p>
      )}

      {/* Progress bar */}
      <div className="mb-1">
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 6, backgroundColor: 'rgba(27,60,90,0.08)' }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pillar.progressPct}%`, backgroundColor: cfg.color }}
          />
        </div>
        {/* Headline progress metric: lesson completion + percent — the two
            agree because both derive from the same course pct (A3.2). The
            percent shown here is the SAME number as "Foundation NN%" in the
            lower Path Forward / Active courses card (one source: course.pct). */}
        <div className="flex items-baseline justify-between mt-1">
          <span className="font-condensed text-[12px]" style={{ color: '#7a8a96' }}>
            {pillar.completedLessons} of {pillar.totalLessons} lessons
          </span>
          {/* A4.2: platform metric numeral = Bebas Neue (--font-logo), not Playfair. */}
          <span
            className="leading-none"
            style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '0.02em', fontSize: 22, color: cfg.color }}
          >
            {formatPct(pillar.progressPct / 100)}
          </span>
        </div>
      </div>

      {/* NEXT UP preview */}
      {nextLessonTitle && (
        <div
          className="mt-4 rounded p-3"
          style={{ background: cfg.colorMuted, border: `1px solid ${cfg.color}33` }}
        >
          <p
            className="font-condensed font-bold uppercase tracking-[0.18em] text-[12px] mb-1"
            style={{ color: cfg.color }}
          >
            Next up
          </p>
          <p className="font-body text-[13px] leading-snug" style={{ color: '#1b3c5a' }}>
            {nextLessonTitle}
          </p>
        </div>
      )}

      <Link
        href={ctaHref}
        className="mt-4 inline-flex items-center justify-center w-full font-condensed font-bold uppercase tracking-[0.14em] text-[12px] py-2.5 rounded transition-opacity hover:opacity-90"
        style={{ backgroundColor: cfg.color, color: '#fff' }}
      >
        Continue →
      </Link>
    </div>
  )
}
