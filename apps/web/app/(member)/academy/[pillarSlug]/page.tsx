import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { LessonListPanel } from '@/components/academy/LessonListPanel'
import { VideoPlaceholder } from '@/components/academy/VideoPlaceholder'
import { CompletionCertificate } from '@/components/academy/CompletionCertificate'
import {
  fetchCourseBySlug,
  fetchLessonsWithProgress,
  fetchCoursesWithProgress,
  fetchUserProfile,
} from '@/lib/academy/fetchers'
import { hasTierAccess } from '@/lib/tier'

export const dynamic = 'force-dynamic'

interface Props {
  params: { pillarSlug: string }
}

export default async function CourseDetailPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [course, profile] = await Promise.all([
    fetchCourseBySlug(supabase, params.pillarSlug),
    fetchUserProfile(supabase, user.id),
  ])
  const allCourses = await fetchCoursesWithProgress(supabase, user.id, profile?.tier)

  if (!course) notFound()

  if (!hasTierAccess(profile?.tier, course.required_tier as 'community' | 'pro')) {
    redirect('/academy?upgrade=true')
  }

  const lessons = await fetchLessonsWithProgress(supabase, params.pillarSlug, user.id, profile?.tier)

  const thisCourse = allCourses.find(c => c.slug === params.pillarSlug)
  const progressPct = thisCourse?.progressPct ?? 0

  // First incomplete lesson, or first lesson if all complete
  const currentLesson = lessons.find(l => !l.completedAt && !l.isLocked) ?? lessons[0]
  const isAllComplete = lessons.length > 0 && lessons.every(l => l.completedAt)

  // Next course for certificate
  const sortedCourses = [...allCourses].sort((a, b) => a.sortOrder - b.sortOrder)
  const thisIdx = sortedCourses.findIndex(c => c.slug === params.pillarSlug)
  const nextCourse = sortedCourses[thisIdx + 1]

  return (
    <>
      <LessonListPanel
        course={{
          pillarNumber: course.pillar_number,
          slug: course.slug,
          title: course.title,
          description: course.description,
        }}
        lessons={lessons}
        currentLessonId={currentLesson?.id ?? null}
        progressPct={progressPct}
      />
      {/* Video / completion section */}
      <div style={{ backgroundColor: '#faf9f7' }}>
        {isAllComplete ? (
          <div className="p-8">
            <CompletionCertificate
              courseTitle={course.title}
              courseSlug={course.slug}
              memberName={profile?.display_name ?? profile?.full_name ?? 'Member'}
              completedAt={lessons[0]?.completedAt ?? new Date().toISOString()}
              userId={user.id}
              nextCourseSlug={nextCourse?.hasAccess ? nextCourse.slug : undefined}
            />
          </div>
        ) : currentLesson ? (
          <div>
            <VideoPlaceholder lessonTitle={currentLesson.title} />
            <div className="px-7 py-4 border-b" style={{ borderColor: 'rgba(27,60,90,0.08)' }}>
              <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] text-[#68a2b9]">Now Playing</p>
              <h2 className="font-display font-bold text-[20px] text-[#112535] mt-1">{currentLesson.title}</h2>
            </div>
            <div className="px-7 py-4">
              <a
                href={`/academy/${params.pillarSlug}/${currentLesson.slug}`}
                className="font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-5 py-2.5 inline-block transition-all"
                style={{ backgroundColor: '#1b3c5a', color: 'white' }}
              >
                Open Lesson →
              </a>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-12">
            <p className="font-condensed text-[13px]" style={{ color: '#7a8a96' }}>
              No lessons available yet.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
