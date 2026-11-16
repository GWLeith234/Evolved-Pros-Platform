import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import type { Database } from '@evolved-pros/db'
import { authCookieOptions } from '@/lib/auth/authCookies'

function requestHost(): string | null {
  try {
    const headerList = headers()
    return headerList.get('x-forwarded-host') ?? headerList.get('host')
  } catch {
    return null
  }
}

export function createClient() {
  const cookieStore = cookies()
  const host = requestHost()
  const cookieOptions = authCookieOptions(host)

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...options, ...cookieOptions })
            )
          } catch {
            // Called from a Server Component. Middleware refreshes the session.
          }
        },
      },
    }
  )
}
