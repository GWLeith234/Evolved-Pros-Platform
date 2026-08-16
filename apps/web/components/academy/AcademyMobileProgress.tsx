'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CourseWithProgress } from '@/lib/academy/types'
import { buildUpgradeHref, tierBadgeLabel } from '@/lib/academy/gating'

interface AcademyMobileProgressProps {
  courses: CourseWithProgress[]
  userTier: string | null
  overallPct: number
}

const SIDEBAR_SHORT_NAMES: Record<number, string> = {
  1: 'Foundation',
  2: 'Identity',
  3: 'Mental Tough.',
  4: 'Strategy',
  5: 'Accountability',
  6: 'Execution',
}

function ChevronIcon({ rotated }: { rotated: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

/** Collapsible overall progress — phone/tablet only (Sprint 4A theme tokens). */
export function AcademyMobileProgress({ courses, userTier, overallPct }: AcademyMobileProgressProps) {
  const [open, setOpen] = useState(false)
  void userTier

  return (
    <div
      className="md:hidden flex-shrink-0"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 ep-pressable ep-touch-target"
        style={{ color: 'var(--text-primary)', minHeight: 48 }}
      >
        <span className="font-condensed font-semibold uppercase tracking-wide text-sm flex items-center gap-2">
          My Progress
          <span
            className="leading-none"
            style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 18,
              color: 'var(--brand-teal, #0ABFA3)',
            }}
          >
            {overallPct}%
          </span>
        </span>
        <ChevronIcon rotated={open} />
      </button>

      {open && (
        <div className="px-4 pb-4">
          <div
            className="h-[3px] rounded-full overflow-hidden mb-4"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
            role="progressbar"
            aria-valuenow={overallPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Overall academy progress"
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${overallPct}%`, backgroundColor: 'var(--brand-teal, #0ABFA3)' }}
            />
          </div>

          <Link
            href="/academy"
            className="ep-touch-target flex items-center py-3 font-condensed font-semibold uppercase tracking-wide text-[12px] mb-1"
            style={{ color: 'var(--text-secondary)', minHeight: 44 }}
          >
            All Courses
          </Link>

          {courses.map(course => {
            const locked = !course.hasAccess
            // SPRINT TIER-1: label and destination come from the course's own
            // required_tier, not a pro/else guess, and the locked row is now a
            // real link — mobile parity with the storefront grid.
            const badgeLabel = tierBadgeLabel(course.requiredTier)
            const label = `0${course.pillarNumber} — ${SIDEBAR_SHORT_NAMES[course.pillarNumber] ?? course.title}`
            return (
              <div key={course.id} className="mb-1">
                {locked ? (
                  <Link
                    href={buildUpgradeHref({
                      from: 'academy',
                      tier: course.requiredTier,
                      pillar: course.pillarNumber,
                    })}
                    className="ep-touch-target flex items-center justify-between py-2.5"
                    style={{ color: 'var(--text-tertiary)', minHeight: 44 }}
                  >
                    <span className="font-condensed font-semibold text-[12px] uppercase tracking-wide">
                      {label}
                    </span>
                    {badgeLabel && (
                      <span
                        className="font-condensed font-bold uppercase text-[8px] px-1.5 py-0.5"
                        style={{
                          color: `var(--pillar-${course.pillarNumber}-ink, var(--pillar-${course.pillarNumber}))`,
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        {badgeLabel}
                      </span>
                    )}
                  </Link>
                ) : (
                  <Link
                    href={`/academy/${course.slug}`}
                    className="ep-touch-target flex items-center justify-between py-2.5"
                    style={{ color: 'var(--text-secondary)', minHeight: 44 }}
                  >
                    <span className="font-condensed font-semibold text-[12px] uppercase tracking-wide">
                      {label}
                    </span>
                    <span
                      className="font-condensed font-bold text-[12px]"
                      style={{ color: 'var(--brand-teal, #0ABFA3)' }}
                    >
                      {course.progressPct}%
                    </span>
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
