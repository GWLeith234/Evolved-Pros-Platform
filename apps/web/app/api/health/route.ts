import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Railway healthcheck — Sprint 5.
 *
 * - 503 only when critical env is missing (misconfigured deploy).
 * - 200 with `ready: false` if Supabase is flaky (avoids restart thrash
 *   during cold starts / brief network blips).
 *
 * `@/lib/supabase/admin` is imported lazily inside the try block, never at
 * module scope: it calls createClient(url!, serviceRoleKey!) on evaluation and
 * supabase-js throws 'supabaseKey is required' on a falsy key. A static import
 * would make this route throw during module evaluation on a deploy missing the
 * service-role key — an opaque 500 instead of a 503 `misconfigured` body.
 *
 * The public body never lists which secrets are configured. Deploy proofs
 * read `startedAt` (frozen at process boot) and `uptimeSec`.
 */
const startedAt = new Date(Date.now() - process.uptime() * 1000).toISOString()

export async function GET() {
  const supabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY

  // serviceRole is critical: without it the admin client cannot be constructed
  // at all, so a deploy missing it is genuinely broken and should fail its
  // healthcheck loudly via the 503 `misconfigured` response below. Which
  // secret is missing stays off this public payload.
  const criticalOk = supabaseUrl && supabaseKey && serviceRole

  const checks: {
    status: 'ok' | 'degraded' | 'misconfigured'
    ready: boolean
    timestamp: string
    startedAt: string
    version: string
    uptimeSec: number
    supabase: string
  } = {
    status: 'ok',
    ready: false,
    timestamp: new Date().toISOString(),
    startedAt,
    version: process.env.npm_package_version ?? '0.1.0',
    uptimeSec: Math.floor(process.uptime()),
    supabase: 'unknown',
  }

  if (!criticalOk) {
    checks.status = 'misconfigured'
    checks.ready = false
    return NextResponse.json(checks, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  try {
    // Lazy, inside the try: an import-time throw from the admin module degrades
    // the probe to `unreachable` instead of taking the whole route down.
    const { adminClient } = await import('@/lib/supabase/admin')

    // Service role + head-only count: the probe must survive public.users being
    // closed to anon (S1 — users_select_for_joins), and it has no business
    // pulling row data. `head: true` sends HEAD, so PostgREST returns the count
    // header and no body. A real connectivity failure still surfaces as
    // `error` and degrades the probe below.
    const { error } = await adminClient
      .from('users')
      .select('id', { head: true, count: 'exact' })
      .limit(1)
    if (error) {
      checks.supabase = `error: ${error.message}`
      checks.status = 'degraded'
      checks.ready = false
    } else {
      checks.supabase = 'connected'
      checks.status = 'ok'
      checks.ready = true
    }
  } catch {
    checks.supabase = 'unreachable'
    checks.status = 'degraded'
    checks.ready = false
  }

  // Always 200 once env is valid so Railway doesn't flap on transient DB issues.
  return NextResponse.json(checks, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  })
}
