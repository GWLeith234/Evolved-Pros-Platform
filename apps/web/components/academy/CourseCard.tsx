'use client'

import { useRouter } from 'next/navigation'
import { ProgressBar, Button } from '@evolved-pros/ui'
import type { CourseWithProgress } from '@/lib/academy/types'
import { Tooltip } from '@/components/ui/Tooltip'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'

interface CourseCardProps {
  course: CourseWithProgress
  isLocked: boolean
  userTier: string | null
}

function LockIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="6" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 6V4a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Immersive pillar course card — standardized progress, done state, hover
 * (Sprint 2). Visual language matches InProgressPillarHero + design tokens.
 */
export function CourseCard({ course, isLocked, userTier }: CourseCardProps) {
  const router = useRouter()
  const isComplete = course.progressPct === 100
  const imageUrl = PILLAR_CONFIG[course.pillarNumber]?.image ?? ''
  const pillarColor = PILLAR_CONFIG[course.pillarNumber]?.color ?? '#68a2b9'
  const pillar =
    course.pillarNumber >= 1 && course.pillarNumber <= 6
      ? (course.pillarNumber as 1 | 2 | 3 | 4 | 5 | 6)
      : undefined

  void userTier
  const needsPro = course.requiredTier === 'pro'
  const tierLabel = needsPro ? 'Pro' : 'VIP'
  const tooltipText = needsPro
    ? 'Upgrade to Pro to unlock this pillar.'
    : 'Upgrade to VIP to unlock this pillar.'

  function handleClick() {
    if (isLocked) return
    router.push(`/academy/${course.slug}`)
  }

  return (
    <div
      onClick={handleClick}
      role={isLocked ? undefined : 'button'}
      tabIndex={isLocked ? -1 : 0}
      onKeyDown={e => {
        if (!isLocked && (e.key === 'Enter' || e.key === ' ')) handleClick()
      }}
      className={`ep-course-card relative overflow-hidden${isLocked ? ' ep-course-card--locked' : ''}${isComplete ? ' ep-course-card--done' : ''}`}
      style={{
        // Mobile overrides height via .ep-course-card (Sprint 4A aspect-ratio).
        height: 240,
        width: '100%',
        maxWidth: '100%',
        border: `1px solid ${isComplete ? `${pillarColor}66` : 'var(--border-color)'}`,
        borderRadius: 0,
        opacity: isLocked ? 0.72 : 1,
        cursor: isLocked ? 'default' : 'pointer',
        boxShadow: isComplete ? `0 0 0 1px ${pillarColor}33` : undefined,
      }}
    >
      {/* Background pillar photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        aria-hidden="true"
        className="ep-course-card__media absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.40) 52%, transparent 100%)',
        }}
      />

      {/* Pillar accent top bar */}
      <span
        aria-hidden
        className="absolute top-0 left-0 right-0"
        style={{ height: 3, background: pillarColor, zIndex: 2 }}
      />

      {/* Large ghost pillar number */}
      <span
        className="absolute top-1 left-3 font-display font-black select-none leading-none"
        style={{ fontSize: 96, color: 'rgba(255,255,255,0.16)', lineHeight: 1 }}
      >
        {course.pillarNumber}
      </span>

      {/* Done badge */}
      {isComplete && !isLocked && (
        <span
          className="absolute top-3 right-3 z-10 font-condensed font-bold uppercase tracking-[0.14em] text-[11px] px-2 py-1"
          style={{
            color: '#0A0F18',
            background: 'var(--brand-gold, #C9A84C)',
            boxShadow: '0 0 16px rgba(201,168,76,0.45)',
          }}
        >
          ✓ Done
        </span>
      )}

      {/* Lock badge */}
      {isLocked && (
        <Tooltip content={tooltipText}>
          <div
            className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center z-10"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.85)' }}
          >
            <LockIcon />
          </div>
        </Tooltip>
      )}

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 z-[1]">
        {/* Eyebrow = pillar label. Suppress when it duplicates the title
            (e.g. a course literally titled "Foundation") so the card doesn't
            render "FOUNDATION / FOUNDATION". */}
        {(() => {
          const eyebrow = PILLAR_CONFIG[course.pillarNumber]?.label
          if (!eyebrow || eyebrow.trim().toLowerCase() === course.title.trim().toLowerCase()) return null
          return (
            <p
              className="font-condensed font-bold uppercase tracking-[0.12em] text-[12px] mb-1"
              style={{ color: pillarColor }}
            >
              {eyebrow}
            </p>
          )
        })()}

        <p className="font-condensed font-bold uppercase text-[14px] text-[#F5F0E8] leading-tight mb-3">
          {course.title}
        </p>

        {isLocked ? (
          <div className="flex items-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
            <span
              className="font-condensed font-bold uppercase text-[11px] px-2 py-0.5"
              style={{
                color: '#c9a84c',
                backgroundColor: 'rgba(201,168,76,0.15)',
                border: '1px solid rgba(201,168,76,0.30)',
              }}
            >
              {tierLabel} Required
            </span>
            <Button variant="secondary" size="sm" href="/pricing">
              Upgrade
            </Button>
          </div>
        ) : course.totalLessons === null ? (
          <p className="font-condensed text-[12px]" style={{ color: 'rgba(255,255,255,0.50)' }}>
            Lessons coming soon
          </p>
        ) : (
          <div className="space-y-1.5">
            <ProgressBar
              value={course.progressPct}
              pillar={pillar}
              color={isComplete ? '#22c55e' : pillarColor}
              size="sm"
              trackColor="rgba(255,255,255,0.15)"
              meta={
                isComplete
                  ? '✓ Done'
                  : `${course.completedLessons}/${course.totalLessons}`
              }
              showPercent={!isComplete}
              label={undefined}
            />
            <p
              className="font-condensed uppercase tracking-[0.12em] text-[11px]"
              style={{ color: 'rgba(255,255,255,0.55)', margin: 0 }}
            >
              {course.totalLessons} {course.totalLessons === 1 ? 'lesson' : 'lessons'}
              {course.progressPct > 0 && !isComplete ? ` · ${course.progressPct}%` : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
