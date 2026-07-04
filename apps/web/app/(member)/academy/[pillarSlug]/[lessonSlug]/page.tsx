import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { LessonPlayerClient } from './LessonPlayerClient'
import { LessonLayer } from './LessonLayer'
import { CompletionCertificate } from '@/components/academy/CompletionCertificate'
import { generateMuxToken } from '@/lib/mux/client'
import {
  fetchCourseBySlug,
  fetchLessonBySlug,
  fetchLessonsWithProgress,
  fetchLessonProgress,
  fetchCoursesWithProgress,
  fetchUserProfile,
} from '@/lib/academy/fetchers'
import { hasTierAccess } from '@/lib/tier'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import { asTranscriptSegments } from '@/lib/academy/transcript'
import { asKeyTakeaways } from '@/lib/academy/takeaways'

export const dynamic = 'force-dynamic'

interface Props {
  params: { pillarSlug: string; lessonSlug: string }
}

export default async function LessonPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [course, lessonRow, profile] = await Promise.all([
    fetchCourseBySlug(supabase, params.pillarSlug),
    fetchLessonBySlug(supabase, params.pillarSlug, params.lessonSlug),
    fetchUserProfile(supabase, user.id),
  ])

  if (!course || !lessonRow) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasTierAccess(profile?.tier as any, course.required_tier as any)) {
    redirect('/academy')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileTier = profile?.tier as any
  // lesson_progress is keyed on public.users.id (profile.id, resolved by
  // email in fetchUserProfile), not the auth session uid.
  const memberId = profile?.id ?? user.id
  const [lessons, progress, allCourses] = await Promise.all([
    fetchLessonsWithProgress(supabase, params.pillarSlug, memberId, profileTier),
    fetchLessonProgress(supabase, memberId, lessonRow.id),
    fetchCoursesWithProgress(supabase, memberId, profileTier),
  ])

  const muxToken = lessonRow.mux_playback_id
    ? await generateMuxToken(lessonRow.mux_playback_id)
    : null

  // Pillar resolution — keyed by course.pillar_number (1-6).
  // Fixes the "PILLAR UNDEFINED" breadcrumb bug: previous code interpolated
  // pillar_number raw or queried the slug-keyed config in lib/pillars.ts
  // which uses different keys (foundation/identity/...) than the route's
  // course slugs (e.g. "strategic-approach" for pillar 4).
  const pillarConfig = PILLAR_CONFIG[course.pillar_number]
  const pillarLabel = pillarConfig?.label ?? course.title
  const pillarColor = pillarConfig?.color ?? '#FFA538'

  const lessonsSorted = [...lessons].sort((a, b) => a.sortOrder - b.sortOrder)
  const currentIdx = lessonsSorted.findIndex(l => l.id === lessonRow.id)
  const nextLesson = lessonsSorted[currentIdx + 1] ?? null

  // Course-completion takeover (preserves existing behavior).
  const isAllComplete = lessons.length > 0 && lessons.every(l => l.completedAt)
  const sortedCourses = [...allCourses].sort((a, b) => a.sortOrder - b.sortOrder)
  const thisIdx = sortedCourses.findIndex(c => c.slug === params.pillarSlug)
  const nextCourse = sortedCourses[thisIdx + 1]

  if (isAllComplete && !progress?.completed_at) {
    return (
      <div className="p-8" style={{ backgroundColor: '#0A0F18', minHeight: '100%' }}>
        <CompletionCertificate
          courseTitle={course.title}
          courseSlug={course.slug}
          memberName={profile?.display_name ?? profile?.full_name ?? 'Member'}
          completedAt={new Date().toISOString()}
          userId={memberId}
          nextCourseSlug={nextCourse?.hasAccess ? nextCourse.slug : undefined}
        />
      </div>
    )
  }

  // Author — no `author` column on lessons or courses today; default to
  // George until that field lands. Tracked as follow-up.
  const author = 'George Leith'

  return (
    <div style={{ backgroundColor: '#0A0F18', minHeight: '100%' }}>
      {/* Breadcrumb — replaces the persistent left sidebar */}
      <nav
        aria-label="Breadcrumb"
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '20px 24px 12px',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#5A6070',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <Link href="/academy" style={{ color: '#B4B0A8', textDecoration: 'none' }}>
          Academy
        </Link>
        <span aria-hidden="true">›</span>
        <Link
          href={`/academy/${course.slug}`}
          style={{ color: '#B4B0A8', textDecoration: 'none' }}
        >
          {pillarLabel}
        </Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page" style={{ color: '#F5F0E8' }}>
          {lessonRow.title}
        </span>
      </nav>

      {/* Full-width player band */}
      <div
        style={{
          width: '100%',
          background: '#000',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <LessonPlayerClient
            embedUrl={lessonRow.embed_url}
            playbackId={lessonRow.mux_playback_id ?? ''}
            token={muxToken}
            initialProgress={progress?.watch_time_seconds ?? 0}
            lessonId={lessonRow.id}
            lessonNumber={currentIdx + 1}
            totalLessons={lessons.length}
            courseTitle={`Pillar ${course.pillar_number} — ${course.title}`}
            maxHeight={720}
          />
        </div>
      </div>

      {/* Learning layer */}
      <LessonLayer
        lesson={{
          id: lessonRow.id,
          title: lessonRow.title,
          description: lessonRow.description,
          durationSeconds: lessonRow.duration_seconds,
          // jsonb segments imported from HeyGen; null (or malformed) falls
          // back to the "Transcript coming soon" empty state.
          transcript: asTranscriptSegments(lessonRow.transcript),
          keyTakeaways: asKeyTakeaways(lessonRow.key_takeaways),
          discussionPrompt: lessonRow.discussion_prompt?.trim() || null,
        }}
        course={{ slug: course.slug, title: course.title }}
        pillar={{
          number: course.pillar_number,
          label: pillarLabel,
          color: pillarColor,
        }}
        author={author}
        isCompleted={!!progress?.completed_at}
        nextLesson={
          nextLesson
            ? {
                slug: nextLesson.slug,
                title: nextLesson.title,
                durationSeconds: nextLesson.durationSeconds,
                isLocked: nextLesson.isLocked,
              }
            : null
        }
      />
    </div>
  )
}
