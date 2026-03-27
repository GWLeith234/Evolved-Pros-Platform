'use client'

import { useRouter } from 'next/navigation'
import { PILLAR_GRADIENTS } from '@/lib/academy/types'
import type { CourseWithProgress } from '@/lib/academy/types'

const PILLAR_DESCRIPTIONS: Record<number, string> = {
  1: 'Build your core operating system',
  2: 'Define who you are and what you stand for',
  3: 'Develop resilience under pressure',
  4: 'Plan with clarity and precision',
  5: 'Stay accountable to your goals',
  6: 'Execute consistently at the highest level',
}

interface CourseCardProps {
  course: CourseWithProgress
  isLocked: boolean
}

function LockIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="6" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3.5 6V4a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function CourseCard({ course, isLocked }: CourseCardProps) {
  const router = useRouter()
  const gradient = PILLAR_GRADIENTS[course.pillarNumber] ?? PILLAR_GRADIENTS[1]
  const isComplete = course.progressPct === 100
  const notStarted = course.progressPct === 0 && course.completedLessons === 0

  function handleClick() {
    if (isLocked) return
    router.push(`/academy/${course.slug}`)
  }

  return (
    <div
      onClick={handleClick}
      role={isLocked ? undefined : 'button'}
      tabIndex={isLocked ? -1 : 0}
      onKeyDown={e => { if (!isLocked && (e.key === 'Enter' || e.key === ' ')) handleClick() }}
      className="rounded-lg overflow-hidden transition-all duration-150"
      style={{
        backgroundColor: 'white',
        border: '1px solid rgba(27,60,90,0.1)',
        opacity: isLocked ? 0.65 : 1,
        cursor: isLocked ? 'default' : 'pointer',
      }}
      onMouseEnter={e => {
        if (!isLocked) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(104,162,185,0.4)'
      }}
      onMouseLeave={e => {
        if (!isLocked) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(27,60,90,0.1)'
      }}
    >
      {/* Thumbnail */}
      <div className="relative h-[120px]" style={{ background: gradient }}>
        {/* Ghost pillar number */}
        <span
          className="absolute inset-0 flex items-center justify-center font-display font-black select-none"
          style={{ fontSize: '64px', color: 'rgba(255,255,255,0.07)', lineHeight: 1 }}
        >
          {course.pillarNumber}
        </span>

        {/* Pillar label */}
        <span
          className="absolute bottom-3 left-3 font-condensed font-bold uppercase tracking-[0.14em] text-[9px]"
          style={{ color: '#68a2b9' }}
        >
          Pillar {course.pillarNumber}
        </span>

        {/* Lock icon */}
        {isLocked && (
          <div
            className="absolute top-2 right-2 w-[22px] h-[22px] rounded flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.7)' }}
          >
            <LockIcon />
          </div>
        )}

        {/* Progress bar on thumbnail bottom edge */}
        {!isLocked && course.totalLessons > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 h-[3px]"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <div
              className="h-full"
              style={{
                width: `${course.progressPct}%`,
                backgroundColor: isComplete ? '#22c55e' : '#ef0e30',
              }}
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-3.5">
        <p className="font-condensed font-bold uppercase text-[14px] text-[#112535] mb-1 leading-tight">
          {course.title}
        </p>
        <p className="font-body text-[12px] text-[#7a8a96] mb-2 leading-tight">
          {PILLAR_DESCRIPTIONS[course.pillarNumber] ?? ''}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-2 mb-3">
          <span className="font-condensed text-[11px] text-[#7a8a96] flex items-center gap-1">
            {course.totalLessons > 0 ? (
              <><VideoIcon />{course.totalLessons} lessons</>
            ) : (
              'Lessons coming soon'
            )}
          </span>
        </div>

        {/* Progress row */}
        {isLocked ? (
          <span
            className="font-condensed font-bold uppercase text-[9px] rounded px-2 py-0.5"
            style={{ color: '#c9a84c', backgroundColor: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}
          >
            Pro Plan Required
          </span>
        ) : course.totalLessons === 0 ? (
          <p className="font-condensed text-[11px] text-[#7a8a96]">Lessons coming soon</p>
        ) : notStarted ? (
          <p className="font-condensed text-[11px] text-[#7a8a96]">Not started</p>
        ) : (
          <div className="flex items-center gap-2">
            <div
              className="flex-1 h-[3px] rounded-full overflow-hidden"
              style={{ backgroundColor: 'rgba(27,60,90,0.08)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${course.progressPct}%`,
                  backgroundColor: isComplete ? '#22c55e' : '#68a2b9',
                }}
              />
            </div>
            <span
              className="font-condensed font-bold text-[10px] flex-shrink-0"
              style={{ color: isComplete ? '#22c55e' : '#68a2b9' }}
            >
              {isComplete ? '100% ✓' : `${course.progressPct}%`}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function VideoIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  )
}
