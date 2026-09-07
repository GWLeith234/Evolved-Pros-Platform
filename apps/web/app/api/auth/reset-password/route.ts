export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { authCallbackUrl } from '@/lib/auth/authOrigin'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: authCallbackUrl(),
  })

  if (error) {
    return NextResponse.json({ error: 'Unable to send reset email' }, { status: 400 })
  }

  return NextResponse.json({ message: 'Reset email sent' })
}
