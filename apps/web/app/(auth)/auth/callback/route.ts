import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function redirectAfterAuth(origin: string, next: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('onboarded_at')
      .eq('id', user.id)
      .single()
    if (!profile?.onboarded_at) {
      return NextResponse.redirect(`${origin}/onboard`)
    }
  }
  return NextResponse.redirect(`${origin}${next}`)
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/home'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return redirectAfterAuth(origin, next)
    }
  }

  if (token && type) {
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as 'magiclink' | 'email',
    })
    if (!error) {
      return redirectAfterAuth(origin, next)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
