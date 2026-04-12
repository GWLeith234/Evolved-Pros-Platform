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
  const rawNext    = searchParams.get('next') ?? '/home'
  // Sanitize: only allow relative paths — block protocol schemes (javascript:, data:, etc.)
  const next       = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/home'

  // Use forwarded headers to get the real public URL (request.url is the
  // internal Railway address, e.g. http://localhost:8080/...)
  const host    = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'web-production-db912.up.railway.app'
  const proto   = request.headers.get('x-forwarded-proto') || 'https'
  const baseUrl = `${proto}://${host}`

  const cookieStore = cookies()
  const allCookies = cookieStore.getAll()

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
    return res
  }

  // PKCE OAuth code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return buildRedirect(resolveNext(baseUrl, next))
  }

  // Magic-link / OTP token hash
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) return buildRedirect(resolveNext(baseUrl, next))
  }

  // Post-password-login: browser already stored session cookies via document.cookie.
  // setSession() re-hydrates the server client and triggers applyServerStorage so
  // cookiesToSet is populated and written as Set-Cookie headers on the redirect.
  const { data: { session }, error: sessionErr } = await supabase.auth.getSession()

  if (session && !sessionErr) {
    const { data: setData, error: setErr } = await supabase.auth.setSession({
      access_token:  session.access_token,
      refresh_token: session.refresh_token,
    })
    if (!setErr && setData) return buildRedirect(resolveNext(baseUrl, next))
  }

  console.error('[auth/callback] no valid code, token_hash, or session — redirecting to login')
  return buildRedirect(new URL('/login?error=auth_failed', baseUrl))
}

function resolveNext(baseUrl: string, next: string): URL {
  return new URL(next, baseUrl)
}
