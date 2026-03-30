import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import { ContentBuilder } from './ContentBuilder'

export const dynamic = 'force-dynamic'

interface Props {
  params: { pillarSlug: string; lessonId: string }
}

export default async function AdminContentBuilderPage({ params }: Props) {
  const supabase = createClient()

  const [{ data: course }, { data: lesson }] = await Promise.all([
    supabase
      .from('courses')
      .select('id, pillar_number, slug, title')
      .eq('slug', params.pillarSlug)
      .single(),
    supabase
      .from('lessons')
      .select('id, title, slug, is_published, content_blocks')
      .eq('id', params.lessonId)
      .single(),
  ])

  if (!course || !lesson) notFound()

  const config = PILLAR_CONFIG[course.pillar_number] ?? PILLAR_CONFIG[1]

  return (
    <div className="px-8 py-6 max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/admin/academy/${params.pillarSlug}`}
          className="font-condensed font-semibold uppercase tracking-wide text-[11px] text-[#7a8a96] hover:text-[#1b3c5a] transition-colors"
        >
          ← {config.label}
        </Link>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <p
              className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px] mb-0.5"
              style={{ color: config.color }}
            >
              Content Builder
            </p>
            <h1 className="font-display font-black text-[26px] text-[#112535] leading-tight">
              {lesson.title}
            </h1>
          </div>
        </div>
      </div>

      <ContentBuilder
        lessonId={lesson.id}
        lessonTitle={lesson.title}
        isPublished={lesson.is_published}
        initialBlocks={Array.isArray(lesson.content_blocks) ? lesson.content_blocks : []}
        pillarSlug={params.pillarSlug}
        accentColor={config.color}
      />
    </div>
  )
}
