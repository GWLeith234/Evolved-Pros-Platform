import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/login',
  '/auth/callback',
  '/api/webhooks/vendasta',
  '/api/health',
  '/dev-login',
  '/api/dev-login',
]

// Routes that are publicly accessible but still need session refresh
// so server components can read the user's auth state.
const SESSION_OPTIONAL_ROUTES = ['/membership']
const ADMIN_ROUTES = ['/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // RSC prefetch requests must not be redirected — Next.js cannot parse a
  // redirect response as RSC data and reports it as a 503. Let these through;
  // the server component itself enforces auth for its own rendered output.
  if (
    request.headers.get('RSC') === '1' ||
    request.headers.get('Next-Router-Prefetch') === '1'
  ) {
    return NextResponse.next()
  }

  // Allow public routes through immediately
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  // Dev bypass: skip Supabase auth when dev_session cookie is present
  if (process.env.NODE_ENV === 'development') {
    const devSession = request.cookies.get('dev_session')?.value
    if (devSession) {
      if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
        try {
          const profile = JSON.parse(devSession) as { role?: string }
          if (profile.role !== 'admin') {
            return NextResponse.redirect(new URL('/home', request.url))
          }
        } catch {
          return NextResponse.redirect(new URL('/login', request.url))
        }
      }
      return NextResponse.next()
    }
  }

  // Official Supabase SSR pattern: refresh session and protect routes
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as any)
          )
        },
      },
    }
  )

  // IMPORTANT: do not add logic between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Session-optional routes (e.g. /membership): let them through without auth.
    // Session was still refreshed above so server components can call getUser().
    if (SESSION_OPTIONAL_ROUTES.some(r => pathname.startsWith(r))) {
      return supabaseResponse
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Onboarding routes: authenticated user is allowed through unconditionally.
  // The page itself decides whether to render or redirect to /home.
  // This guard must come before the onboarding-gate check below.
  if (pathname.startsWith('/onboarding')) {
    return supabaseResponse
  }

  // Admin route guard
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: profile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/home', request.url))
    }
  }

  // Onboarding gate: redirect new members to /onboarding until they complete the flow.
  // Only applies to member-facing routes — skip admin, API, and /onboarding itself.
  const isMemberRoute = !pathname.startsWith('/api/') && !pathname.startsWith('/admin') && !pathname.startsWith('/onboarding')
  if (isMemberRoute) {
    // Use email (not id) because auth UUID may differ from public.users UUID
    const onboardingAdminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: onboardProfile } = await onboardingAdminClient
      .from('users')
      .select('onboarding_completed')
      .eq('email', user.email!)
      .single()

    if (!onboardProfile?.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Known app routes that require auth checking.
    // Anything not listed here falls through to Next.js naturally,
    // so unknown URLs render not-found.tsx instead of redirecting to /login.
    '/home',
    '/home/:path*',
    '/community',
    '/community/:path*',
    '/events',
    '/events/:path*',
    '/academy',
    '/academy/:path*',
    '/podcast',
    '/podcast/:path*',
    '/profile/:path*',
    '/messages',
    '/messages/:path*',
    '/settings',
    '/settings/:path*',
    '/notifications',
    '/notifications/:path*',
    '/membership',
    '/onboarding',
    '/onboarding/:path*',
    '/admin',
    '/admin/:path*',
    '/api/posts/:path*',
    '/api/admin/:path*',
    '/api/onboarding/:path*',
    '/api/settings/:path*',
  ],
}
