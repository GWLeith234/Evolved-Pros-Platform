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
  accentColor: string
  midQuoteIdx?: number
  quoteText?: string
  bannerUrl?: string
}

export function LessonListWithAds({ lessons, currentLessonId, courseSlug, accentColor, midQuoteIdx, quoteText, bannerUrl }: LessonListWithAdsProps) {
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
            accentColor={accentColor}
          />
          {i === 0 && adData && (
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <SponsorCard ad={adData} variant="academy" />
            </div>
          )}
          {midQuoteIdx !== undefined && i === midQuoteIdx && quoteText && bannerUrl && (
            <div className="relative overflow-hidden my-1" style={{ height: '110px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to right, rgba(10,15,24,0.88) 0%, rgba(10,15,24,0.6) 100%)' }}
              />
              <div className="absolute inset-0 flex items-center px-7">
                <p
                  className="font-display font-black italic leading-snug"
                  style={{ fontSize: '14px', color: 'rgba(250,249,247,0.82)', maxWidth: '80%' }}
                >
                  {quoteText}
                </p>
              </div>
            </div>
          )}
        </React.Fragment>
      ))}
    </>
  )
}
