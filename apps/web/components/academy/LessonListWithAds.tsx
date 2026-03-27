'use client'

import React from 'react'
import { LessonItem } from './LessonItem'
import { SponsorCard } from '@/components/ads/SponsorCard'
import { useSponsorAd } from '@/hooks/useSponsorAd'
import type { LessonWithProgress } from '@/lib/academy/types'

interface LessonListWithAdsProps {
  lessons: LessonWithProgress[]
  currentLessonId: string | null
  courseSlug: string
}

export function LessonListWithAds({ lessons, currentLessonId, courseSlug }: LessonListWithAdsProps) {
  const adData = useSponsorAd('academy')

  if (lessons.length === 0) {
    return (
      <p className="px-7 py-6 font-condensed text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
        No lessons published yet.
      </p>
    )
  }

  return (
    <>
      {lessons.map((lesson, i) => (
        <React.Fragment key={lesson.id}>
          <LessonItem
            lesson={lesson}
            index={i}
            isActive={lesson.id === currentLessonId}
            courseSlug={courseSlug}
          />
          {i === 0 && adData && (
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <SponsorCard ad={adData} variant="academy" />
            </div>
          )}
        </React.Fragment>
      ))}
    </>
  )
}
