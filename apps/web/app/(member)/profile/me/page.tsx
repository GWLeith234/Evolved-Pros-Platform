import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export default async function MyProfileRedirectPage() {
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

  redirect(`/profile/${profile.id}`)
}
