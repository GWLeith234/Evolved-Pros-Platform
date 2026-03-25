import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code       = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type       = searchParams.get('type') as EmailOtpType | null
  const next       = searchParams.get('next') ?? '/home'
  const supabase   = createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return redirectAfterAuth(supabase, origin, next)
    }
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      return redirectAfterAuth(supabase, origin, next)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}

async function redirectAfterAuth(
  supabase: ReturnType<typeof createClient>,
  origin: string,
  next: string,
): Promise<NextResponse> {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('onboarded_at, display_name')
      .eq('id', user.id)
      .single()
    // New users (no onboarded_at or no display_name) go to onboarding
    if (!profile?.onboarded_at || !profile?.display_name) {
      return NextResponse.redirect(`${origin}/onboard`)
    }
  }
  return NextResponse.redirect(`${origin}${next}`)
}
