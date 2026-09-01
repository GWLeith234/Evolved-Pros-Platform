import { adminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { LessonForm } from '../../../LessonForm'
import { asKeyTakeaways } from '@/lib/academy/takeaways'

interface Props {
  params: { courseId: string; lessonId: string }
}

export default async function EditLessonPage({ params }: Props) {
  const h = headers()
  if (h.get('RSC') === '1' || h.get('Next-Router-Prefetch') === '1') {
    return null
  }

  type CourseData = { id: string; title: string }
  type LessonData = {
    id: string; title: string; slug: string; description: string | null
    duration_seconds: number | null; sort_order: number; is_published: boolean
    mux_playback_id: string | null; transcript: unknown; key_takeaways: unknown
    discussion_prompt: string | null
  }

  // RLS-FIX: adminClient — courses/lessons SELECT policies filter drafts,
  // causing false 404s when an admin opens an unpublished lesson.
  const [{ data: courseRaw }, { data: lessonRaw }] = await Promise.all([
    adminClient.from('courses').select('id, title').eq('id', params.courseId).single(),
    adminClient.from('lessons')
      .select('id, title, slug, description, duration_seconds, sort_order, is_published, mux_playback_id, transcript, key_takeaways, discussion_prompt')
      .eq('id', params.lessonId).eq('course_id', params.courseId).single(),
  ])

  const course = courseRaw as CourseData | null
  const lesson = lessonRaw as LessonData | null

  if (!course || !lesson) notFound()

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <Link
          href={`/admin/courses/${params.courseId}`}
          className="font-condensed font-semibold uppercase tracking-wide text-[11px] text-[color:var(--admin-text-2)] hover:text-[color:var(--admin-text)] transition-colors"
        >
          ← Back to {course.title}
        </Link>
      </div>
      <h1 className="font-display font-black text-[28px] text-[color:var(--admin-text-strong)] mb-6">Edit Lesson</h1>
      <LessonForm
        courseId={params.courseId}
        lessonId={params.lessonId}
        existingPlaybackId={lesson.mux_playback_id}
        initialValues={{
          title: lesson.title,
          description: lesson.description ?? '',
          slug: lesson.slug,
          sortOrder: lesson.sort_order,
          durationSeconds: lesson.duration_seconds ?? '',
          isPublished: lesson.is_published,
          transcriptJson: lesson.transcript ? JSON.stringify(lesson.transcript, null, 2) : '',
          keyTakeaways: asKeyTakeaways(lesson.key_takeaways) ?? [],
          discussionPrompt: lesson.discussion_prompt ?? '',
        }}
      />
    </div>
  )
}
