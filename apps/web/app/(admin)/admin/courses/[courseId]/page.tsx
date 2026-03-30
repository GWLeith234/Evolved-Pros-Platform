import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AdminLessonsTable } from './AdminLessonsTable'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'

export const dynamic = 'force-dynamic'

interface Props {
  params: { courseId: string }
}

export default async function AdminCourseDetailPage({ params }: Props) {
  const supabase = createClient()

  const [{ data: course }, { data: lessons }] = await Promise.all([
    supabase
      .from('courses')
      .select('id, pillar_number, slug, title, description, required_tier')
      .eq('id', params.courseId)
      .single(),
    supabase
      .from('lessons')
      .select('id, title, slug, description, duration_seconds, sort_order, is_published, mux_playback_id')
      .eq('course_id', params.courseId)
      .order('sort_order'),
  ])

  if (!course) notFound()

  return (
    <div className="px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-2">
          <Link
            href="/admin/courses"
            className="font-condensed font-semibold uppercase tracking-wide text-[11px] text-[#7a8a96] hover:text-[#1b3c5a] transition-colors"
          >
            ← Back to Courses
          </Link>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <p
              className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] mb-0.5"
              style={{ color: PILLAR_CONFIG[course.pillar_number]?.color ?? '#68a2b9' }}
            >
              {PILLAR_CONFIG[course.pillar_number]?.label ?? `Pillar ${course.pillar_number}`}
            </p>
            <h1 className="font-display font-black text-[28px] text-[#112535]">{course.title}</h1>
            <p className="font-condensed text-[12px] text-[#7a8a96] mt-0.5">
              {(lessons ?? []).length} lessons · {course.required_tier} tier
            </p>
          </div>
          <Link
            href={`/admin/courses/${course.id}/lessons/new`}
            className="font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-5 py-2.5 transition-all"
            style={{ backgroundColor: '#1b3c5a', color: 'white' }}
          >
            + Add Lesson
          </Link>
        </div>
      </div>

      <AdminLessonsTable lessons={lessons ?? []} courseId={params.courseId} />
    </div>
  )
}
