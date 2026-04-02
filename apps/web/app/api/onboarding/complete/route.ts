import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from('users')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ onboarding_completed: true, onboarding_step: 5 } as any)
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
