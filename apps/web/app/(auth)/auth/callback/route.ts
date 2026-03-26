import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import type { Database } from '@evolved-pros/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code       = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type       = searchParams.get('type') as EmailOtpType | null
  const next       = searchParams.get('next') ?? '/home'

  console.log('[auth/callback] url:', request.url)
  console.log('[auth/callback] code:', code, '| token_hash:', token_hash, '| next:', next)

  const cookieStore = cookies()
  const allCookies = cookieStore.getAll()
  console.log('[auth/callback] request cookies:', allCookies.map(c => c.name).join(', '))

  // Build a supabase server client that can write Set-Cookie headers onto
  // a response we control, rather than relying on next/headers cookies()
  // which may not merge into a NextResponse.redirect().
  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = []

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return allCookies
        },
        setAll(toSet) {
          // Collect cookies — we'll apply them to the redirect response below
          toSet.forEach(c => cookiesToSet.push(c))
        },
      },
    }
  )

  function buildRedirect(url: string) {
    const res = NextResponse.redirect(url)
    cookiesToSet.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
    )
    console.log('[auth/callback] redirecting to', url, '| setting cookies:', cookiesToSet.map(c => c.name).join(', '))
    return res
  }

  // PKCE OAuth code exchange
  if (code) {
    console.log('[auth/callback] exchanging PKCE code...')
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('[auth/callback] exchangeCodeForSession error:', error?.message ?? 'none')
    if (!error) return buildRedirect(await resolveNext(supabase, origin, next))
  }

  // Magic-link / OTP token hash
  if (token_hash && type) {
    console.log('[auth/callback] verifying OTP token_hash...')
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    console.log('[auth/callback] verifyOtp error:', error?.message ?? 'none')
    if (!error) return buildRedirect(await resolveNext(supabase, origin, next))
  }

  // Post-password-login: browser already stored session cookies via document.cookie.
  // Call setSession() to re-hydrate the server client and trigger applyServerStorage,
  // which populates cookiesToSet so we can write Set-Cookie onto the redirect.
  console.log('[auth/callback] checking for existing session in cookies...')
  const { data: { session }, error: sessionErr } = await supabase.auth.getSession()
  console.log('[auth/callback] getSession result — session:', session ? `user=${session.user.id}` : 'null', '| error:', sessionErr?.message ?? 'none')

  if (session) {
    console.log('[auth/callback] calling setSession to trigger server-side cookie write...')
    const { data: setData, error: setErr } = await supabase.auth.setSession({
      access_token:  session.access_token,
      refresh_token: session.refresh_token,
    })
    console.log('[auth/callback] setSession result — user:', setData?.user?.id ?? 'null', '| error:', setErr?.message ?? 'none')
    if (!setErr) return buildRedirect(await resolveNext(supabase, origin, next))
  }

  console.error('[auth/callback] no valid code, token_hash, or session — redirecting to login')
  return buildRedirect(`${origin}/login?error=auth_failed`)
}

async function resolveNext(
  supabase: ReturnType<typeof createServerClient<Database>>,
  origin: string,
  next: string,
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('onboarded_at, display_name')
      .eq('id', user.id)
      .single()
    if (!profile?.onboarded_at || !profile?.display_name) {
      return `${origin}/onboard`
    }
  }
  return `${origin}${next}`
}
