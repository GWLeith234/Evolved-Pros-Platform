import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { MediaStoryForm } from '../../MediaStoryForm'

export const dynamic = 'force-dynamic'

export default async function EditMediaStoryPage({ params }: { params: { id: string } }) {
  const { data: story, error } = await adminClient
    .from('media_stories')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !story) redirect('/admin/media')

  return (
    <div className="px-8 py-6">
      <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] mb-1" style={{ color: '#68a2b9' }}>
        Evolved Media
      </p>
      <h1 className="font-display font-bold text-xl mb-6" style={{ color: '#1b3c5a' }}>
        Edit Story
      </h1>
      <MediaStoryForm
        isEdit
        initial={{
          id: story.id,
          title: story.title,
          slug: story.slug,
          excerpt: story.excerpt ?? '',
          body: story.body ?? '',
          pillar: story.pillar ?? '',
          tags: Array.isArray(story.tags) ? (story.tags as string[]).join(', ') : '',
          story_type: story.story_type,
          source_url: story.source_url ?? '',
          source_name: story.source_name ?? '',
          featured_image_url: story.featured_image_url ?? '',
          author: story.author ?? 'George Leith',
          seo_title: story.seo_title ?? '',
          seo_description: story.seo_description ?? '',
          is_featured: story.is_featured ?? false,
        }}
      />
    </div>
  )
}
