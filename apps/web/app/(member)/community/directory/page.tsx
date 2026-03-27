import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemberDirectoryClient } from './MemberDirectoryClient'

export const metadata = {
  title: 'Member Directory',
}

export default async function MemberDirectoryPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <MemberDirectoryClient />
}
