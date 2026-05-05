export const dynamic = 'force-dynamic'

// Lightweight keep-warm endpoint pinged every ~5 min by an external cron
// (cron-job.org). Returns immediately — no DB / network — so a Railway
// container that's been idle responds within its first event loop tick
// without paying the cold-start tax on the next real request.
//
// Listed in middleware.PUBLIC_ROUTES via the '/api/cron' prefix so no
// auth is required. The route trusts the public network — there's nothing
// to leak and no side effect to abuse.
export async function GET() {
  return Response.json({ ok: true, ts: Date.now() })
}
