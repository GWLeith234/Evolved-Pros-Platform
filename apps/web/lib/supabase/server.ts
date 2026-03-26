import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@evolved-pros/db'

export function createClient() {
  const cookieStore = cookies()
  // @supabase/ssr v0.3.x uses get/set/remove (not getAll/setAll)
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value, ...options } as Parameters<typeof cookieStore.set>[0])
          } catch {}
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value: '', ...options } as Parameters<typeof cookieStore.set>[0])
          } catch {}
        },
      },
    }
  )
}
