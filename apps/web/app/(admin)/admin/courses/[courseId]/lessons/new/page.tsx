import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { LessonForm } from '../../LessonForm'

interface Props {
  params: { courseId: string }
}

export default async function NewLessonPage({ params }: Props) {
  const supabase = createClient()
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, pillar_number')
    .eq('id', params.courseId)
    .single()

  if (!course) notFound()

  // Default sort order = last lesson + 1
  const { data: lastLesson } = await supabase
    .from('lessons')
    .select('sort_order')
    .eq('course_id', params.courseId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (lastLesson?.sort_order ?? 0) + 1

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
      <h1 className="font-display font-black text-[28px] text-[#112535] mb-6">Add Lesson</h1>
      <LessonForm
        courseId={params.courseId}
        initialValues={{ sortOrder: nextOrder }}
      />
    </div>
  )
}
