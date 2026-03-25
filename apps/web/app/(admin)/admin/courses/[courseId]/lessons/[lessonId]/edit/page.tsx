import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { LessonForm } from '../../../LessonForm'

interface Props {
  params: { courseId: string; lessonId: string }
}

export default async function EditLessonPage({ params }: Props) {
  const supabase = createClient()

  type CourseData = { id: string; title: string }
  type LessonData = {
    id: string; title: string; slug: string; description: string | null
    duration_seconds: number | null; sort_order: number; is_published: boolean
    mux_playback_id: string | null
  }

  const [{ data: courseRaw }, { data: lessonRaw }] = await Promise.all([
    supabase.from('courses').select('id, title').eq('id', params.courseId).single(),
    supabase.from('lessons')
      .select('id, title, slug, description, duration_seconds, sort_order, is_published, mux_playback_id')
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
          className="font-condensed font-semibold uppercase tracking-wide text-[11px] text-[#7a8a96] hover:text-[#1b3c5a] transition-colors"
        >
          ← Back to {course.title}
        </Link>
      </div>
      <h1 className="font-display font-black text-[28px] text-[#112535] mb-6">Edit Lesson</h1>
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
        }}
      />
    </div>
  )
}
