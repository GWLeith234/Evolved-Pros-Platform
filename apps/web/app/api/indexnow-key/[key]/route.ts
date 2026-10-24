import { indexNowKeyFileBody } from '@/lib/seo/indexnow'

export const dynamic = 'force-dynamic'

// Reached as /<INDEXNOW_KEY>.txt via the afterFiles rewrite in next.config.mjs.
export function GET(_request: Request, { params }: { params: { key: string } }) {
  const body = indexNowKeyFileBody(params.key)
  if (!body) return new Response('Not found', { status: 404 })
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
