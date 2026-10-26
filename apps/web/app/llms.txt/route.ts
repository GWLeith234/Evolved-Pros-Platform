import { buildLlmsTxt, LLMS_TXT_CACHE_CONTROL } from '@/lib/seo/llmsTxt'
import { loadLlmsCatalogue } from '@/lib/seo/sitemapCatalogue'

// Same freshness as app/sitemap.ts. A story published today is listed
// within a minute. force-dynamic keeps a failed build from freezing an
// empty catalogue for a year (Next 14 stores a missing revalidate as
// CACHE_ONE_YEAR).
export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET(): Promise<Response> {
  const catalogue = await loadLlmsCatalogue()
  return new Response(buildLlmsTxt(catalogue), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': LLMS_TXT_CACHE_CONTROL,
    },
  })
}
