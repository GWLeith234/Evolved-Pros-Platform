import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { safeRedirectPath } from '@/lib/auth/safeRedirect'
import { loginCopyFor } from '@/lib/auth/loginCopy'
import { LoginForm } from './LoginForm'

interface LoginSearchParams {
  // Next's real runtime shape — a repeated param arrives as string[]. Typing
  // either of these as plain string compiles fine and then misbehaves at
  // request time.
  redirect?: string | string[]
  mode?: string | string[]
}

/**
 * SPRINT DOORS-1 — was a static `metadata` object hardcoded to
 * 'Sign In — Evolved Pros'. /join and /signup now 308 here with ?mode=signup,
 * and a static export cannot see that, so every /join arrival got a browser
 * tab (and a shared-link preview) telling them to sign in. generateMetadata
 * reads the param; the copy itself lives in lib/auth/loginCopy.ts, which is
 * where LoginForm reads it too, so the tab and the button cannot disagree.
 */
export function generateMetadata({
  searchParams,
}: {
  searchParams: LoginSearchParams
}): Metadata {
  return { title: loginCopyFor(searchParams.mode).metaTitle }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: LoginSearchParams
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Already signed in — honour ?redirect= too, so a member who lands here with
  // a live session (stale 401, back button, shared link) still reaches the page
  // they were headed for rather than /home.
  if (user) redirect(safeRedirectPath(searchParams.redirect))

  // Wraps LoginForm so its useSearchParams() read of ?mode=signup
  // can't make the prerendered HTML disagree with the hydrated client (#425).
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
