import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { safeRedirectPath } from '@/lib/auth/safeRedirect'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = { title: 'Sign In — Evolved Pros' }

export default async function LoginPage({
  searchParams,
}: {
  // Next's real runtime shape — a repeated ?redirect= arrives as string[].
  // Typing it as plain string compiles fine and then throws at request time.
  searchParams: { redirect?: string | string[] }
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
