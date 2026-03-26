import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code       = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type       = searchParams.get('type') as EmailOtpType | null
  const next       = searchParams.get('next') ?? '/home'
  const supabase   = createClient()

  // PKCE OAuth code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return redirectAfterAuth(supabase, origin, next)
    }
  }

  // Magic-link / OTP token hash
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      return redirectAfterAuth(supabase, origin, next)
    }
  }

  // Post-password-login: the browser client already set session cookies via
  // document.cookie after signInWithPassword succeeded.  Calling setSession()
  // here forces the server client to write proper Set-Cookie response headers
  // (via applyServerStorage) so middleware can read the session on /home.
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    const { error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })
    if (!error) {
      return redirectAfterAuth(supabase, origin, next)
    }
  }

  console.error('[auth/callback] no valid code, token_hash, or session found')
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
    if (!profile?.onboarded_at || !profile?.display_name) {
      return NextResponse.redirect(`${origin}/onboard`)
    }
  }
  return NextResponse.redirect(`${origin}${next}`)
}
