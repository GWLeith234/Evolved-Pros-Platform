import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'

/** Admin role for preview routes. Development also honors the dev_session cookie. */
export async function isSignedInAdmin(): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') {
    const raw = cookies().get('dev_session')?.value
    if (raw) {
      try {
        const profile = JSON.parse(raw) as { role?: string }
        return profile.role === 'admin'
      } catch {
        return false
      }
    }
  }

  try {
    const profile = await resolveCurrentUser()
    return profile?.role === 'admin'
  } catch {
    return false
  }
}

export const isSignedInAdminCached = cache(isSignedInAdmin)
