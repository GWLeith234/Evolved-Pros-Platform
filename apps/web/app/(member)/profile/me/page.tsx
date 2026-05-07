import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export default async function MyProfileRedirectPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // public.users uses a distinct UUID space from auth.users — must look up by email.
  const { data: profile } = await adminClient
    .from('users')
    .select('id')
    .eq('email', user.email!)
    .maybeSingle()

  if (!profile) redirect('/login')

  const params = new URLSearchParams()
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined) continue
      if (Array.isArray(value)) {
        for (const v of value) params.append(key, v)
      } else {
        params.append(key, value)
      }
    }
  }
  const qs = params.toString()
  redirect(`/profile/${profile.id}${qs ? `?${qs}` : ''}`)
}
