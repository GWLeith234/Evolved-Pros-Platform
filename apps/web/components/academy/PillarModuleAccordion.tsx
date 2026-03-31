'use client'

import { useState } from 'react'
import Link from 'next/link'

interface LessonItem {
  id: string
  slug: string
  title: string
  sortOrder: number
  completedAt: string | null
  durationSeconds: number | null
}

interface ModuleGroup {
  moduleNumber: number
  lessons: LessonItem[]
}

interface Props {
  modules: ModuleGroup[]
  courseSlug: string
  pillarColor: string
}

function formatDur(s: number | null): string {
  if (!s) return ''
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

export function PillarModuleAccordion({ modules, courseSlug, pillarColor }: Props) {
  const defaultOpen = modules.find(m => m.lessons.some(l => !l.completedAt))?.moduleNumber
    ?? modules[0]?.moduleNumber
    ?? 1
  const [open, setOpen] = useState<Set<number>>(new Set([defaultOpen]))

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
                    fontSize: '11px', fontFamily: '"Barlow Condensed", sans-serif',
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
                    fontSize: '11px', fontFamily: '"Barlow Condensed", sans-serif',
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
                {lessons.map((lesson, idx) => (
                  <Link
                    key={lesson.id}
                    href={`/academy/${courseSlug}/${lesson.slug}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '14px 20px',
                      borderBottom: idx < lessons.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
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
                          fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
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
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
