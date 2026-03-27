import type { LessonWithProgress } from '@/lib/academy/types'
import { LessonListWithAds } from './LessonListWithAds'

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
  return (
    <aside
      className="w-[340px] flex-shrink-0 flex flex-col overflow-hidden"
      style={{ backgroundColor: '#112535', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Header */}
      <div className="px-7 pt-7 pb-5 flex-shrink-0">
        <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] mb-2" style={{ color: '#68a2b9' }}>
          Pillar 0{course.pillarNumber} — The Evolved Architecture™
        </p>
        <h2
          className="font-display font-black leading-tight mb-2"
          style={{ fontSize: '24px', color: '#faf9f7' }}
        >
          {course.title}
        </h2>
        {course.description && (
          <p className="font-body text-[14px] leading-relaxed mb-4" style={{ color: 'rgba(250,249,247,0.6)' }}>
            {course.description}
          </p>
        )}
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div
            className="flex-1 h-[3px] rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, backgroundColor: '#68a2b9' }}
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
        />
      </div>
    </aside>
  )
}
