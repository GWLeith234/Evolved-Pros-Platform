'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CourseWithProgress } from '@/lib/academy/types'

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
      style={{
        transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function AcademyMobileProgress({ courses, userTier, overallPct }: AcademyMobileProgressProps) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="md:hidden flex-shrink-0"
      style={{ backgroundColor: '#112535', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ color: 'rgba(255,255,255,0.8)' }}
      >
        <span className="font-condensed font-semibold uppercase tracking-wide text-sm flex items-center gap-2">
          My Progress
          <span
            className="font-display font-black"
            style={{ fontSize: '18px', color: '#68a2b9' }}
          >
            {overallPct}%
          </span>
        </span>
        <ChevronIcon rotated={open} />
      </button>

      {open && (
        <div className="px-4 pb-4">
          {/* Progress bar */}
          <div
            className="h-[3px] rounded-full overflow-hidden mb-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${overallPct}%`, backgroundColor: '#68a2b9' }}
            />
          </div>

          {/* All Courses link */}
          <Link
            href="/academy"
            className="block py-2 font-condensed font-semibold uppercase tracking-wide text-[12px] mb-1"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            All Courses
          </Link>

          {/* Per-course progress */}
          {courses.map(course => {
            const locked = !course.hasAccess
            const badgeLabel = course.requiredTier === 'pro' ? 'Pro' : 'VIP'
            const label = `0${course.pillarNumber} — ${SIDEBAR_SHORT_NAMES[course.pillarNumber] ?? course.title}`
            return (
              <div key={course.id} className="mb-2">
                {locked ? (
                  <div
                    className="flex items-center justify-between py-1.5"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    <span className="font-condensed font-semibold text-[11px] uppercase tracking-wide">{label}</span>
                    <span
                      className="font-condensed font-bold uppercase text-[8px] rounded px-1.5 py-0.5"
                      style={{ color: '#ef0e30', backgroundColor: 'rgba(239,14,48,0.12)', border: '1px solid rgba(239,14,48,0.2)' }}
                    >
                      {badgeLabel}
                    </span>
                  </div>
                ) : (
                  <Link
                    href={`/academy/${course.slug}`}
                    className="flex items-center justify-between py-1.5"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    <span className="font-condensed font-semibold text-[11px] uppercase tracking-wide">{label}</span>
                    <span className="font-condensed font-bold text-[11px]" style={{ color: '#68a2b9' }}>
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
