'use client'

import Link from 'next/link'
import { formatDurationSeconds, formatDurationMMSS } from '@/lib/academy/types'
import type { LessonWithProgress } from '@/lib/academy/types'

interface LessonItemProps {
  lesson: LessonWithProgress
  index: number
  isActive: boolean
  courseSlug: string
  accentColor: string
}

function CheckIcon() {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 5l3.5 3.5L11 1" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 1.5l7 4-7 4V1.5z" fill="#68a2b9"/>
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.75" y="5.25" width="8.5" height="6.5" rx="1.25" stroke="#7a8a96" strokeWidth="1.25"/>
      <path d="M2.75 5.25V3.5a2.25 2.25 0 014.5 0v1.75" stroke="#7a8a96" strokeWidth="1.25" strokeLinecap="round"/>
    </svg>
  )
}

// Matches Tabler's ti-player-play glyph (icon-tabler-player-play) — no
// icon-library dependency added, consistent with this file's other icons.
function ThumbnailPlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M7 4v16l13 -8z" fill="#fff"/>
    </svg>
  )
}

export function LessonItem({ lesson, index, isActive, courseSlug, accentColor }: LessonItemProps) {
  const isCompleted = !!lesson.completedAt
  const duration = formatDurationSeconds(lesson.durationSeconds)
  const thumbnailDuration = formatDurationMMSS(lesson.durationSeconds)

  const statusIcon = isCompleted ? (
    <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}>
      <CheckIcon />
    </div>
  ) : lesson.isLocked ? (
    <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: 'rgba(27,60,90,0.05)' }}>
      <LockIcon />
    </div>
  ) : (
    <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: 'rgba(104,162,185,0.1)' }}>
      <PlayIcon />
    </div>
  )

  const inner = (
    <div
      className="flex items-center gap-3 px-5 py-3.5 transition-colors"
      style={{
        borderBottom: '1px solid rgba(27,60,90,0.06)',
        backgroundColor: isActive ? `${accentColor}12` : 'transparent',
        borderLeft: isActive ? `2px solid ${accentColor}` : '2px solid transparent',
        paddingLeft: isActive ? '18px' : '20px',
        cursor: lesson.isLocked ? 'default' : 'pointer',
      }}
      onMouseEnter={e => {
        if (!lesson.isLocked && !isActive)
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(27,60,90,0.02)'
      }}
      onMouseLeave={e => {
        if (!lesson.isLocked && !isActive)
          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
      }}
    >
      <span
        className="font-condensed font-bold text-[12px] w-[28px] flex-shrink-0 text-center"
        style={{ color: '#7a8a96' }}
      >
        {String(index + 1).padStart(2, '0')}
      </span>
      {statusIcon}
      <span
        className="font-body text-[13px] font-medium flex-1 min-w-0 truncate"
        style={{ color: lesson.isLocked ? '#7a8a96' : '#1b3c5a' }}
      >
        {lesson.title}
      </span>
      {duration && (
        <span className="font-condensed text-[12px] flex-shrink-0" style={{ color: '#7a8a96' }}>
          {duration}
        </span>
      )}
      <div
        style={{
          position: 'relative',
          width: 96,
          height: 64,
          flexShrink: 0,
          borderRadius: 6,
          overflow: 'hidden',
          backgroundImage: lesson.thumbnailUrl
            ? `url(${lesson.thumbnailUrl})`
            : `linear-gradient(135deg, ${accentColor}33 0%, ${accentColor}11 100%)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#0d1620',
          opacity: lesson.isLocked ? 0.5 : 1,
        }}
      >
        {!lesson.isLocked && (
          <div
            className="absolute flex items-center justify-center"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: 'rgba(10,15,24,0.45)',
            }}
          >
            <ThumbnailPlayIcon />
          </div>
        )}
        {thumbnailDuration && (
          <span
            className="absolute font-condensed font-bold"
            style={{
              bottom: 3,
              right: 4,
              fontSize: '10px',
              lineHeight: '14px',
              color: '#fff',
              backgroundColor: 'rgba(10,15,24,0.6)',
              padding: '0 3px',
              borderRadius: 2,
            }}
          >
            {thumbnailDuration}
          </span>
        )}
      </div>
    </div>
  )

  if (lesson.isLocked) return <div>{inner}</div>
  return (
    <Link href={`/academy/${courseSlug}/${lesson.slug}`} prefetch={false}>
      {inner}
    </Link>
  )
}
