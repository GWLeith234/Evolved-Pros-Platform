'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDurationMMSS } from '@/lib/academy/types'
import { assignThreadAds } from '@/lib/academy/threadAds'
import { IabAdvertisementSlot } from '@/components/ads/IabImageAd'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'

interface LessonItem {
  id: string
  slug: string
  title: string
  sortOrder: number
  completedAt: string | null
  durationSeconds: number | null
  thumbnailUrl: string | null
}

interface ModuleGroup {
  moduleNumber: number
  lessons: LessonItem[]
}

interface Props {
  modules: ModuleGroup[]
  courseSlug: string
  pillarColor: string
  /** One centered IAB after every three lesson cards, across the whole pillar. */
  ads?: SponsorAd[]
}

function formatDur(s: number | null): string {
  if (!s) return ''
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
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

function ThreadAd({ ad }: { ad: SponsorAd }) {
  if (!ad.image_url) return null
  return (
    <div
      data-academy-thread-ad
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        minHeight: 250,
      }}
    >
      <IabAdvertisementSlot
        ad={{ ...ad, image_url: ad.image_url }}
        locationId="academy-thread"
      />
    </div>
  )
}

export function PillarModuleAccordion({ modules, courseSlug, pillarColor, ads = [] }: Props) {
  const defaultOpen = modules.find(m => m.lessons.some(l => !l.completedAt))?.moduleNumber
    ?? modules[0]?.moduleNumber
    ?? 1
  const [open, setOpen] = useState<Set<number>>(new Set([defaultOpen]))
  const threadAds = ads.filter(a => a?.image_url)
  const adAfterLesson = assignThreadAds(
    modules.flatMap(m => m.lessons),
    threadAds,
  )

  function toggle(n: number) {
    setOpen(prev => {
      const next = new Set(prev)
      next.has(n) ? next.delete(n) : next.add(n)
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {modules.map(({ moduleNumber, lessons }) => {
        const isOpen = open.has(moduleNumber)
        const completedCount = lessons.filter(l => l.completedAt).length
        const allDone = completedCount === lessons.length && lessons.length > 0

        return (
          <div
            key={moduleNumber}
            style={{ backgroundColor: '#111926', borderRadius: '6px', overflow: 'hidden' }}
          >
            {/* Module header */}
            <button
              type="button"
              onClick={() => toggle(moduleNumber)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 20px', background: 'none', border: 'none', cursor: 'pointer',
                color: '#faf9f7',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Module number badge */}
                <span
                  style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: allDone ? pillarColor : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${allDone ? pillarColor : 'rgba(255,255,255,0.1)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontFamily: '"Barlow Condensed", sans-serif',
                    fontWeight: 700, color: allDone ? '#0A0F18' : 'rgba(250,249,247,0.5)',
                  }}
                >
                  {allDone ? '✓' : String(moduleNumber).padStart(2, '0')}
                </span>
                <span
                  style={{
                    fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                    fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: isOpen ? '#faf9f7' : 'rgba(250,249,247,0.65)',
                  }}
                >
                  Module {moduleNumber}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span
                  style={{
                    fontSize: '12px', fontFamily: '"Barlow Condensed", sans-serif',
                    fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: allDone ? pillarColor : 'rgba(250,249,247,0.3)',
                  }}
                >
                  {completedCount} / {lessons.length}
                </span>
                {/* Chevron */}
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(250,249,247,0.35)" strokeWidth="2"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>

            {/* Lesson list */}
            {isOpen && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {lessons.map((lesson, idx) => {
                  const insertAd = adAfterLesson.get(lesson.id)
                  return (
                  <div key={lesson.id}>
                  <Link
                    href={`/academy/${courseSlug}/${lesson.slug}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '14px 20px',
                      borderBottom: idx < lessons.length - 1 || insertAd ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      textDecoration: 'none',
                      backgroundColor: 'transparent',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Completion circle */}
                    <div
                      style={{
                        width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                        backgroundColor: lesson.completedAt ? pillarColor : 'transparent',
                        border: `1.5px solid ${lesson.completedAt ? pillarColor : 'rgba(255,255,255,0.15)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {lesson.completedAt && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0A0F18" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>

                    {/* Lesson number + title */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 600,
                          fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase',
                          color: 'rgba(250,249,247,0.3)', margin: '0 0 2px',
                        }}
                      >
                        Lesson {lesson.sortOrder}
                      </p>
                      <p
                        style={{
                          fontSize: '14px', color: lesson.completedAt ? 'rgba(250,249,247,0.5)' : '#faf9f7',
                          margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}
                      >
                        {lesson.title}
                      </p>
                    </div>

                    {/* Duration */}
                    {lesson.durationSeconds && (
                      <span
                        style={{
                          fontSize: '12px', fontFamily: '"Barlow Condensed", sans-serif',
                          fontWeight: 600, color: 'rgba(250,249,247,0.25)', flexShrink: 0,
                        }}
                      >
                        {formatDur(lesson.durationSeconds)}
                      </span>
                    )}

                    {/* Thumbnail */}
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
                          : `linear-gradient(135deg, ${pillarColor}33 0%, ${pillarColor}11 100%)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: '#0d1620',
                      }}
                    >
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
                      {formatDurationMMSS(lesson.durationSeconds) && (
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
                          {formatDurationMMSS(lesson.durationSeconds)}
                        </span>
                      )}
                    </div>
                  </Link>
                  {insertAd ? <ThreadAd ad={insertAd} /> : null}
                  </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
