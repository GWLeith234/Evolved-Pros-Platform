'use client'

import { useRouter } from 'next/navigation'
import type { CourseWithProgress } from '@/lib/academy/types'
import { Tooltip } from '@/components/ui/Tooltip'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'

const PILLAR_IMAGES: Record<number, string> = {
  1: 'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/pillar-1-foundation.jpg',
  2: 'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/pillar-2-identity.jpg',
  3: 'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/pillar-3-mental-toughness.jpg',
  4: 'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/pillar-4-strategy.jpg',
  5: 'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/pillar-5-accountability.jpg',
  6: 'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/pillar-6-execution.jpg',
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
  const isComplete = course.progressPct === 100
  const imageUrl = PILLAR_IMAGES[course.pillarNumber]

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
      className="relative rounded-lg overflow-hidden transition-all duration-150"
      style={{
        height: '220px',
        border: '1px solid rgba(27,60,90,0.10)',
        opacity: isLocked ? 0.70 : 1,
        cursor: isLocked ? 'default' : 'pointer',
      }}
      onMouseEnter={e => {
        if (!isLocked) {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = 'rgba(104,162,185,0.5)'
          el.style.transform = 'scale(1.02)'
          el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.28)'
        }
      }}
      onMouseLeave={e => {
        if (!isLocked) {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = 'rgba(27,60,90,0.10)'
          el.style.transform = 'scale(1)'
          el.style.boxShadow = 'none'
        }
      }}
    >
      {/* Background pillar photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Dark gradient overlay — black/60 at bottom, transparent at top */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)',
        }}
      />

      {/* Large ghost pillar number — top-left watermark */}
      <span
        className="absolute top-1 left-3 font-display font-black select-none leading-none"
        style={{ fontSize: '96px', color: 'rgba(255,255,255,0.18)', lineHeight: 1 }}
      >
        {course.pillarNumber}
      </span>

      {/* Lock badge — top-right */}
      {isLocked && (
        <Tooltip content="Upgrade to Pro to unlock these pillars.">
          <div
            className="absolute top-3 right-3 w-[24px] h-[24px] rounded flex items-center justify-center z-10"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.85)' }}
          >
            <LockIcon />
          </div>
        </Tooltip>
      )}

      {/* Bottom content on dark overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
        {/* Pillar label */}
        <p
          className="font-condensed font-bold uppercase tracking-[0.12em] text-[9px] mb-1"
          style={{ color: PILLAR_CONFIG[course.pillarNumber]?.color ?? '#68a2b9' }}
        >
          {PILLAR_CONFIG[course.pillarNumber]?.label ?? course.title}
        </p>

        {/* Course title */}
        <p className="font-condensed font-bold uppercase text-[13px] text-white leading-tight mb-2">
          {course.title}
        </p>

        {/* Progress / status */}
        {isLocked ? (
          <span
            className="font-condensed font-bold uppercase text-[9px] rounded px-2 py-0.5"
            style={{
              color: '#c9a84c',
              backgroundColor: 'rgba(201,168,76,0.15)',
              border: '1px solid rgba(201,168,76,0.30)',
            }}
          >
            Pro Plan Required
          </span>
        ) : course.totalLessons === 0 ? (
          <p className="font-condensed text-[11px]" style={{ color: 'rgba(255,255,255,0.50)' }}>
            Lessons coming soon
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <div
              className="flex-1 h-[3px] rounded-full overflow-hidden"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${course.progressPct}%`,
                  backgroundColor: isComplete ? '#22c55e' : '#ef0e30',
                }}
              />
            </div>
            <span
              className="font-condensed font-bold text-[10px] flex-shrink-0"
              style={{ color: isComplete ? '#22c55e' : 'rgba(255,255,255,0.65)' }}
            >
              {isComplete ? '✓ Done' : `${course.progressPct}%`}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
