import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Railway healthcheck — Sprint 5.
 *
 * - 503 only when critical env is missing (misconfigured deploy).
 * - 200 with `ready: false` if Supabase is flaky (avoids restart thrash
 *   during cold starts / brief network blips).
 */
export async function GET() {
  const env = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    resend: !!process.env.RESEND_API_KEY,
    mux: !!(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET),
    vendasta: !!process.env.VENDASTA_VERIFIER_TOKEN,
    appUrl: !!(process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL),
  }

  const criticalOk = env.supabaseUrl && env.supabaseKey

  const checks = {
    status: 'ok' as 'ok' | 'degraded' | 'misconfigured',
    ready: false,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.1.0',
    uptimeSec: Math.floor(process.uptime()),
    supabase: 'unknown' as string,
    env,
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
