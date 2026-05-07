import { adminClient } from '@/lib/supabase/admin'
import { TranscriptDisclosure } from './TranscriptDisclosure'

interface TranscriptSectionProps {
  slug: string
}

// Async RSC: fetches just the transcript for one episode so the rest of the
// episode page can stream first. The transcript column is the heaviest field
// on `episodes` (often multi-KB plain text) — pulling it in the page's primary
// fetch held up first paint while contributing nothing above the fold.
export async function TranscriptSection({ slug }: TranscriptSectionProps) {
  const { data } = await adminClient
    .from('episodes')
    .select('transcript')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  const transcript = (data as { transcript?: string | null } | null)?.transcript ?? null
  return <TranscriptDisclosure transcript={transcript} />
}

// Suspense fallback that matches the collapsed disclosure height so the
// transcript card lands without layout shift when the fetch resolves.
export function TranscriptSkeleton() {
  return (
    <div
      className="rounded-xl h-[58px] animate-pulse"
      style={{ border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)' }}
      aria-hidden="true"
    />
  )
}
