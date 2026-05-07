import { createClient } from '@supabase/supabase-js'
import type { Database } from '@evolved-pros/db'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// One-time runtime diagnostic. When SUPABASE_SERVICE_ROLE_KEY is missing in
// the deploy env (Railway), the adminClient is constructed with the anon
// fallback and silently returns [] for every RLS-gated read — that's the
// "Lessons coming soon" footgun we keep tripping over. Log only the prefix so
// a real key never lands in logs.
if (typeof window === 'undefined') {
  // eslint-disable-next-line no-console
  console.log(
    '[supabase.adminClient] SUPABASE_SERVICE_ROLE_KEY prefix=',
    serviceRoleKey ? `${serviceRoleKey.slice(0, 8)}…` : 'MISSING',
    'NEXT_PUBLIC_SUPABASE_URL=',
    url ? 'set' : 'MISSING',
  )
}

export const adminClient = createClient<Database>(
  url!,
  serviceRoleKey!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export const hasServiceRoleKey = Boolean(serviceRoleKey)
