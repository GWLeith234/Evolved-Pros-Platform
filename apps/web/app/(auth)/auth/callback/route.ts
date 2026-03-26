import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import type { Database } from '@evolved-pros/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code       = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type       = searchParams.get('type') as EmailOtpType | null
  const next       = searchParams.get('next') ?? '/home'

  // Use forwarded headers to get the real public URL (request.url is the
  // internal Railway address, e.g. http://localhost:8080/...)
  const host    = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'web-production-db912.up.railway.app'
  const proto   = request.headers.get('x-forwarded-proto') || 'https'
  const baseUrl = `${proto}://${host}`

  console.log('[auth/callback] url:', request.url, '| baseUrl:', baseUrl)
  console.log('[auth/callback] code:', code, '| token_hash:', token_hash, '| next:', next)

  const cookieStore = cookies()
  const allCookies = cookieStore.getAll()
  console.log('[auth/callback] request cookies:', allCookies.map(c => c.name).join(', '))

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
          toSet.forEach(c => cookiesToSet.push(c))
        },
      },
    }
  )

  // Build redirect using the request URL as base so Railway's public domain
  // is preserved — avoids localhost:8080 appearing in the Location header
  function buildRedirect(destination: string | URL) {
    const url = destination instanceof URL ? destination : new URL(destination, baseUrl)
    const res = NextResponse.redirect(url)
    cookiesToSet.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
    )
    console.log('[auth/callback] redirecting to', url.toString(), '| setting cookies:', cookiesToSet.map(c => c.name).join(', '))
    return res
  }

  // PKCE OAuth code exchange
  if (code) {
    console.log('[auth/callback] exchanging PKCE code...')
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('[auth/callback] exchangeCodeForSession error:', error?.message ?? 'none')
    if (!error) return buildRedirect(resolveNext(baseUrl, next))
  }

  // Magic-link / OTP token hash
  if (token_hash && type) {
    console.log('[auth/callback] verifying OTP token_hash...')
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    console.log('[auth/callback] verifyOtp error:', error?.message ?? 'none')
    if (!error) return buildRedirect(resolveNext(baseUrl, next))
  }

  // Post-password-login: browser already stored session cookies via document.cookie.
  // setSession() re-hydrates the server client and triggers applyServerStorage so
  // cookiesToSet is populated and written as Set-Cookie headers on the redirect.
  console.log('[auth/callback] checking for existing session in cookies...')
  const { data: { session }, error: sessionErr } = await supabase.auth.getSession()
  console.log('[auth/callback] getSession — session:', session ? `user=${session.user.id}` : 'null', '| error:', sessionErr?.message ?? 'none')

  if (session) {
    console.log('[auth/callback] calling setSession to trigger server-side cookie write...')
    const { data: setData, error: setErr } = await supabase.auth.setSession({
      access_token:  session.access_token,
      refresh_token: session.refresh_token,
    })
    console.log('[auth/callback] setSession — user:', setData?.user?.id ?? 'null', '| error:', setErr?.message ?? 'none')
    if (!setErr) return buildRedirect(resolveNext(baseUrl, next))
  }

  console.error('[auth/callback] no valid code, token_hash, or session — redirecting to login')
  return buildRedirect(new URL('/login?error=auth_failed', baseUrl))
}

function resolveNext(baseUrl: string, next: string): URL {
  return new URL(next, baseUrl)
}
