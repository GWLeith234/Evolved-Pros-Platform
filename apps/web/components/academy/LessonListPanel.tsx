'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { LessonListWithAds } from './LessonListWithAds'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import type { LessonWithProgress } from '@/lib/academy/types'

const STORAGE = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public/Branding/'

interface LessonListPanelProps {
  course: {
    pillarNumber: number
    slug: string
    title: string
    description: string | null
  }
  lessons: LessonWithProgress[]
  currentLessonId: string | null
  progressPct: number
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

export function LessonListPanel({ course, lessons, currentLessonId, progressPct }: LessonListPanelProps) {
  const pillarNum = course.pillarNumber ?? 1
  const config = PILLAR_CONFIG[pillarNum] ?? PILLAR_CONFIG[1]
  const bannerUrl = STORAGE + config.image
  const heroRef = useRef<HTMLDivElement>(null)
  const [stickyVisible, setStickyVisible] = useState(false)

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const midIdx = lessons.length > 2 ? Math.floor(lessons.length * 0.6) : undefined
  const colorRgb = hexToRgb(config.color)

  return (
    <div style={{ backgroundColor: '#0a0f18' }}>
      {/* Hero banner */}
      <div ref={heroRef} className="relative w-full overflow-hidden aspect-[16/7]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bannerUrl}
          alt={course.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(10,15,24,0.94) 0%, rgba(10,15,24,0.55) 55%, rgba(10,15,24,0.18) 100%)' }}
        />
        <Link
          href="/academy"
          className="absolute top-4 left-5 flex items-center gap-1.5 font-condensed font-semibold text-[11px] uppercase tracking-wide transition-opacity hover:opacity-100"
          style={{
            color: 'rgba(255,255,255,0.9)',
            backgroundColor: 'rgba(0,0,0,0.42)',
            borderRadius: 9999,
            padding: '6px 12px',
            opacity: 0.85,
          }}
        >
          ← Academy
        </Link>
        <div className="absolute bottom-0 left-0 right-0 px-7 pb-5">
          <p
            className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px] mb-0.5"
            style={{ color: config.color }}
          >
            {config.label}
          </p>
          <p
            className="font-condensed text-[11px]"
            style={{ color: 'rgba(255,255,255,0.38)', letterSpacing: '0.07em' }}
          >
            The Evolved Architecture™
          </p>
          <h2
            className="font-display font-black leading-tight mt-1"
            style={{ fontSize: '24px', color: '#faf9f7' }}
          >
            {course.title}
          </h2>
        </div>
      </div>

      {/* Progress strip — directly below hero */}
      <div className="w-full h-[3px]" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progressPct}%`, backgroundColor: config.color }}
        />
      </div>

      {/* Sticky nav — IntersectionObserver controlled */}
      <div
        className="sticky top-0 z-20 flex items-center gap-3 px-6 py-3 transition-all duration-200"
        style={{
          backgroundColor: stickyVisible ? `rgba(${colorRgb}, 0.08)` : 'transparent',
          borderBottom: `1px solid ${stickyVisible ? `rgba(${colorRgb}, 0.15)` : 'transparent'}`,
          opacity: stickyVisible ? 1 : 0,
          pointerEvents: stickyVisible ? 'auto' : 'none',
        }}
      >
        <Link
          href="/academy"
          className="font-condensed font-semibold text-[11px] uppercase tracking-wide flex-shrink-0 transition-colors"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          ← Back
        </Link>
        <span
          className="font-condensed font-bold uppercase tracking-[0.16em] text-[10px] flex-shrink-0"
          style={{ color: config.color }}
        >
          {config.label}
        </span>
        <div
          className="flex-1 h-[2px] rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, backgroundColor: config.color }}
          />
        </div>
        <span
          className="font-condensed font-bold text-[10px] flex-shrink-0"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          {progressPct}%
        </span>
      </div>

      {/* Description */}
      {course.description && (
        <div className="px-7 pt-5 pb-3">
          <p className="font-body text-[13px] leading-relaxed" style={{ color: 'rgba(250,249,247,0.5)' }}>
            {course.description}
          </p>
        </div>
      )}

      {/* Lesson list */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <LessonListWithAds
          lessons={lessons}
          currentLessonId={currentLessonId}
          courseSlug={course.slug}
          accentColor={config.color}
          midQuoteIdx={midIdx}
          quoteText={`"${config.label} is the bedrock of everything that follows."`}
          bannerUrl={bannerUrl}
        />
      </div>
    </div>
  )
}
