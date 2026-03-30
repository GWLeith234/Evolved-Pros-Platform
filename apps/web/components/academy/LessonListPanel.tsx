import type { LessonWithProgress } from '@/lib/academy/types'
import { LessonListWithAds } from './LessonListWithAds'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'

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

export function LessonListPanel({
  course,
  lessons,
  currentLessonId,
  progressPct,
}: LessonListPanelProps) {
  const pillarNum = course.pillarNumber ?? 1
  const config = PILLAR_CONFIG[pillarNum] ?? PILLAR_CONFIG[1]
  const bannerUrl = STORAGE + config.image

  return (
    <aside
      className="w-[340px] flex-shrink-0 flex flex-col overflow-hidden"
      style={{ backgroundColor: '#112535', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Hero banner — pillar image with gradient overlay */}
      <div className="relative w-full h-[180px] flex-shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bannerUrl}
          alt={course.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(17,37,53,0.95) 0%, rgba(17,37,53,0.55) 55%, rgba(17,37,53,0.15) 100%)',
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 px-7 pb-5">
          <p
            className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] mb-1"
            style={{ color: config.color }}
          >
            Pillar {String(pillarNum).padStart(2, '0')} — The Evolved Architecture™
          </p>
          <h2
            className="font-display font-black leading-tight"
            style={{ fontSize: '20px', color: '#faf9f7' }}
          >
            {course.title}
          </h2>
        </div>
      </div>

      {/* Description + progress bar */}
      <div className="px-7 py-4 flex-shrink-0">
        {course.description && (
          <p className="font-body text-[13px] leading-relaxed mb-3" style={{ color: 'rgba(250,249,247,0.6)' }}>
            {course.description}
          </p>
        )}
        <div className="flex items-center gap-2">
          <div
            className="flex-1 h-[3px] rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, backgroundColor: config.color }}
            />
          </div>
          <span className="font-condensed font-bold text-[10px] flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {progressPct}% complete
          </span>
        </div>
      </div>

      {/* Lesson list — scrolls independently */}
      <div className="flex-1 overflow-y-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <LessonListWithAds
          lessons={lessons}
          currentLessonId={currentLessonId}
          courseSlug={course.slug}
          accentColor={config.color}
        />
      </div>
    </aside>
  )
}
