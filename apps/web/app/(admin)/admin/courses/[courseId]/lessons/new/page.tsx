import { adminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { LessonForm } from '../../LessonForm'

interface Props {
  params: { courseId: string }
}

export default async function NewLessonPage({ params }: Props) {
  const h = headers()
  if (h.get('RSC') === '1' || h.get('Next-Router-Prefetch') === '1') {
    return null
  }

  // RLS-FIX: adminClient — courses SELECT policy filters drafts; admins
  // need to add lessons to draft courses too.
  const { data: course } = await adminClient
    .from('courses')
    .select('id, title, pillar_number')
    .eq('id', params.courseId)
    .single()

  if (!course) notFound()

  // Default sort order = last lesson + 1
  const { data: lastLesson } = await adminClient
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
          className="font-condensed font-semibold uppercase tracking-wide text-[11px] text-[color:var(--admin-text-2)] hover:text-[color:var(--admin-text)] transition-colors"
        >
          ← Back to {course.title}
        </Link>
      </div>
      <h1 className="font-display font-black text-[28px] text-[color:var(--admin-text-strong)] mb-6">Add Lesson</h1>
      <LessonForm
        courseId={params.courseId}
        initialValues={{ sortOrder: nextOrder }}
      />
    </div>
  )
}
