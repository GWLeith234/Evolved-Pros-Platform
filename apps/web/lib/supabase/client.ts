import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@evolved-pros/db'
import { authCookieOptions } from '@/lib/auth/authCookies'

export function createClient() {
  const host = typeof window === 'undefined' ? null : window.location.host
  // Host-only. authCookieOptions never sets Domain.
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: authCookieOptions(host) }
  )
}
