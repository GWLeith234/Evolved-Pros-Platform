import Link from 'next/link'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'

const TAGLINES: Record<number, string> = {
  1: 'The ground every operator stands on.',
  2: 'Decide who you are before the work asks.',
  3: 'Hold the line when the day pushes back.',
  4: 'Pick the move with the highest leverage.',
  5: 'Score yourself before anyone else does.',
  6: 'Ship the thing. Then ship the next.',
}

export interface ClimbingTowardCardProps {
  pillar: {
    number: 1 | 2 | 3 | 4 | 5 | 6
    name: string
    totalLessons: number
  }
  courseSlug: string
}

export function ClimbingTowardCard({ pillar, courseSlug }: ClimbingTowardCardProps) {
  const cfg = PILLAR_CONFIG[pillar.number]
  const tagline = TAGLINES[pillar.number] ?? ''

  return (
    <Link
      href={`/academy/${courseSlug}`}
      className="relative block rounded-lg overflow-hidden p-5 transition-opacity hover:opacity-100"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        opacity: 0.85,
      }}
    >
      {/* Pillar accent strip — matches the active pillar card / goal cards. */}
      <span
        aria-hidden="true"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: cfg.color }}
      />

      <p
        className="font-condensed font-bold uppercase tracking-[0.18em] text-[12px] mb-2"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Climbing toward
      </p>

      <div className="flex items-baseline gap-2 mb-1">
        <span
          className="font-display font-black leading-none"
          style={{ fontSize: 28, color: cfg.color }}
        >
          {pillar.number}
        </span>
        <span
          className="font-condensed font-bold uppercase tracking-[0.14em]"
          style={{ fontSize: 14, color: 'var(--text-primary)' }}
        >
          {pillar.name}
        </span>
      </div>

      {tagline && (
        <p
          className="mb-3"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 13, fontStyle: 'italic', color: 'var(--text-secondary)' }}
        >
          {tagline}
        </p>
      )}

      <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[12px]" style={{ color: 'var(--text-secondary)' }}>
        {pillar.totalLessons} lessons
        <span style={{ margin: '0 6px', color: 'var(--text-tertiary)' }}>·</span>
        {pillar.name} badge
        <span style={{ margin: '0 6px', color: 'var(--text-tertiary)' }}>·</span>
        Join the cohort
      </p>
    </Link>
  )
}
