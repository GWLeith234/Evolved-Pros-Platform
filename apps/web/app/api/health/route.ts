import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks = {
    status:    'ok' as string,
    timestamp: new Date().toISOString(),
    version:   process.env.npm_package_version ?? '0.1.0',
    supabase:  'unknown' as string,
    env: {
      supabaseUrl:  !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey:  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRole:  !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      resend:       !!process.env.RESEND_API_KEY,
      mux:          !!process.env.MUX_TOKEN_ID,
      // The webhook's actual gate — there is no HMAC secret scheme.
      vendasta:     !!process.env.VENDASTA_VERIFIER_TOKEN,
    },
  }

  try {
    const supabase = createClient()
    const { error } = await supabase.from('users').select('id').limit(1)
    checks.supabase = error ? `error: ${error.message}` : 'connected'
  } catch {
    checks.supabase = 'unreachable'
  }

  return NextResponse.json(checks, { status: 200 })
}
