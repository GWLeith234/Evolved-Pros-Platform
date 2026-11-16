import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import type { Database } from '@evolved-pros/db'
import { authCookieOptions } from '@/lib/auth/authCookies'
import { authRedirectBase, safeAuthNext } from '@/lib/auth/authOrigin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code       = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type       = searchParams.get('type') as EmailOtpType | null
  // Relative paths stay. An absolute next is kept only when its host is
  // evolvedpros.com (then reduced to a path on the canonical origin).
  // External hosts, protocol-relative URLs, and script schemes become /home.
  const next       = safeAuthNext(searchParams.get('next'))

  // request.url on Railway is the internal address (localhost:8080). The
  // public host comes from forwarded headers. Brand hosts and a forged
  // X-Forwarded-Host become www. Loopback stays local. A preview host is
  // used only when it matches the configured app URL.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const hostHeader = request.headers.get('host')
  const baseUrl = authRedirectBase(
    forwardedHost,
    request.headers.get('x-forwarded-proto'),
    hostHeader,
  )
  const cookieOptions = authCookieOptions(forwardedHost ?? hostHeader)

  const cookieStore = cookies()
  const allCookies = cookieStore.getAll()

  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = []

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return allCookies
        },
        setAll(toSet) {
          toSet.forEach(({ name, value, options }) =>
            cookiesToSet.push({ name, value, options: { ...options, ...cookieOptions } })
          )
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

  // PKCE OAuth code exchange (password confirm / leftover SMTP links)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return buildRedirect(resolveNext(baseUrl, next))
    console.error('[auth/callback] exchangeCodeForSession failed', error.message)
  }

  // Magic-link / OTP token hash — no PKCE cookie required
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) return buildRedirect(resolveNext(baseUrl, next))
    console.error('[auth/callback] verifyOtp failed', error.message)
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
