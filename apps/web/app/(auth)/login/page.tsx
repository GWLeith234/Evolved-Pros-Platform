import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = { title: 'Sign In — Evolved Pros' }

export default async function LoginPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/home')

  // Wraps LoginForm so its useSearchParams() read of ?mode=signup
  // can't make the prerendered HTML disagree with the hydrated client (#425).
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
