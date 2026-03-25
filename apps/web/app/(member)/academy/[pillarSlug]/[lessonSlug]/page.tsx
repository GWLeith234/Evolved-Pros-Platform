import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { AcademySidebar } from '@/components/academy/AcademySidebar'
import { LessonListPanel } from '@/components/academy/LessonList'
import { DynamicMuxPlayer } from '@/components/academy/DynamicMuxPlayer'
import { LessonContent } from '@/components/academy/LessonContent'
import { CompletionCertificate } from '@/components/academy/CompletionCertificate'
import { generateMuxToken } from '@/lib/mux/client'
import {
  fetchCourseBySlug,
  fetchLessonBySlug,
  fetchLessonsWithProgress,
  fetchLessonProgress,
  fetchLessonNotes,
  fetchCoursesWithProgress,
  fetchUserProfile,
} from '@/lib/academy/fetchers'
import { hasTierAccess } from '@/lib/tier'

export const dynamic = 'force-dynamic'

interface Props {
  params: { pillarSlug: string; lessonSlug: string }
}

export default async function LessonPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [course, lessonRow, profile, allCourses] = await Promise.all([
    fetchCourseBySlug(supabase, params.pillarSlug),
    fetchLessonBySlug(supabase, params.pillarSlug, params.lessonSlug),
    fetchUserProfile(supabase, user.id),
    fetchCoursesWithProgress(supabase, user.id),
  ])

  if (!course || !lessonRow) notFound()
  if (!hasTierAccess(profile?.tier, course.required_tier as 'community' | 'pro')) {
    redirect('/academy')
  }

  const [lessons, progress, notes] = await Promise.all([
    fetchLessonsWithProgress(supabase, params.pillarSlug, user.id, profile?.tier),
    fetchLessonProgress(supabase, user.id, lessonRow.id),
    fetchLessonNotes(supabase, user.id, lessonRow.id),
  ])

  const muxToken = lessonRow.mux_playback_id
    ? await generateMuxToken(lessonRow.mux_playback_id)
    : null

  const totalLessons = allCourses.reduce((s, c) => s + c.totalLessons, 0)
  const completedLessons = allCourses.reduce((s, c) => s + c.completedLessons, 0)
  const overallPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  const thisCourse = allCourses.find(c => c.slug === params.pillarSlug)
  const progressPct = thisCourse?.progressPct ?? 0

  // Build LessonWithProgress for this lesson
  const currentLessonWP = lessons.find(l => l.id === lessonRow.id) ?? {
    id: lessonRow.id,
    courseId: lessonRow.course_id,
    slug: lessonRow.slug,
    title: lessonRow.title,
    description: lessonRow.description,
    muxPlaybackId: lessonRow.mux_playback_id,
    durationSeconds: lessonRow.duration_seconds,
    sortOrder: lessonRow.sort_order,
    isPublished: lessonRow.is_published,
    completedAt: progress?.completed_at ?? null,
    watchTimeSeconds: progress?.watch_time_seconds ?? 0,
    isLocked: false,
  }

  // Find next lesson
  const lessonsSorted = [...lessons].sort((a, b) => a.sortOrder - b.sortOrder)
  const currentIdx = lessonsSorted.findIndex(l => l.id === lessonRow.id)
  const nextLesson = lessonsSorted[currentIdx + 1] ?? null

  // Check if all lessons complete (after potential mark-complete refresh)
  const isAllComplete = lessons.length > 0 && lessons.every(l => l.completedAt)

  // Next course for certificate
  const sortedCourses = [...allCourses].sort((a, b) => a.sortOrder - b.sortOrder)
  const thisIdx = sortedCourses.findIndex(c => c.slug === params.pillarSlug)
  const nextCourse = sortedCourses[thisIdx + 1]

  return (
    <div className="flex" style={{ minHeight: '100%' }}>
      <AcademySidebar
        courses={allCourses}
        userTier={profile?.tier ?? null}
        overallPct={overallPct}
      />
      <div className="flex flex-1 overflow-hidden">
        <LessonListPanel
          course={course}
          lessons={lessons}
          currentLessonId={lessonRow.id}
          progressPct={progressPct}
        />
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#faf9f7' }}>
          {isAllComplete && !progress?.completed_at ? (
            <div className="p-8">
              <CompletionCertificate
                courseTitle={course.title}
                courseSlug={course.slug}
                memberName={profile?.display_name ?? profile?.full_name ?? 'Member'}
                completedAt={new Date().toISOString()}
                userId={user.id}
                nextCourseSlug={nextCourse?.hasAccess ? nextCourse.slug : undefined}
              />
            </div>
          ) : (
            <>
              <DynamicMuxPlayer
                playbackId={lessonRow.mux_playback_id ?? ''}
                token={muxToken}
                initialProgress={progress?.watch_time_seconds ?? 0}
                lessonId={lessonRow.id}
                lessonNumber={currentIdx + 1}
                totalLessons={lessons.length}
                courseTitle={`Pillar ${course.pillar_number} — ${course.title}`}
                onComplete={() => {
                  // Handled server-side via progress API
                }}
              />
              <LessonContent
                lesson={currentLessonWP}
                courseSlug={params.pillarSlug}
                nextLessonSlug={nextLesson?.slug ?? null}
                initialNotes={notes ?? ''}
                isCompleted={!!progress?.completed_at}
              />
            </>
          )}
        </main>
      </div>
    </div>
  )
}
