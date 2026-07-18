import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/login',
  '/auth/callback',
  '/api/webhooks/vendasta',
  '/api/health',
  '/api/cron',
  '/dev-login',
  '/api/dev-login',
  '/pricing',
  '/media',
  // Public SEO podcast section (index, episode pages, RSS) — must be reachable
  // by logged-out visitors and crawlers. Also removed from the matcher below.
  '/podcast',
  // Closed-beta lockout screen — must be reachable by suspended members, so it
  // is never gated (also absent from the matcher below, belt-and-suspenders).
  '/beta-paused',
]

// Routes that are publicly accessible but still need session refresh
// so server components can read the user's auth state.
const SESSION_OPTIONAL_ROUTES = ['/membership']
const ADMIN_ROUTES = ['/admin', '/api/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Media subdomain: skip all auth — entire site is public
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? ''
  if (host.startsWith('media.')) {
    const response = NextResponse.next()
    response.headers.set('x-media-standalone', 'true')
    return response
  }

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
            if (pathname.startsWith('/api/')) {
              return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
            return NextResponse.redirect(new URL('/home', request.url))
          }
        } catch {
          if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
          }
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
    // /api/* paths are programmatic — return JSON 401 instead of a 307 redirect
    // to /login (which would leak HTML to a fetch() caller).
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Carry forward any cookies Supabase wrote during getUser() (e.g. a partial
    // token-refresh attempt). A bare NextResponse.redirect() drops them, which
    // can drop the user's session on the very next request — the symptom QA hit
    // when /home → /podcast or /home → /live unexpectedly bounced to /login.
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const redirect = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(c => {
      redirect.cookies.set(c.name, c.value, c)
    })
    return redirect
  }

  // Onboarding routes: authenticated user is allowed through unconditionally.
  // The page itself decides whether to render or redirect to /home.
  // This guard must come before the onboarding-gate check below.
  if (pathname.startsWith('/onboarding')) {
    return supabaseResponse
  }

  // Single admin-client query for both role + onboarding checks.
  // Previously this was two separate queries — consolidated to halve middleware latency.
  const isAdminRoute  = ADMIN_ROUTES.some(r => pathname.startsWith(r))
  const isMemberRoute = !pathname.startsWith('/api/') && !pathname.startsWith('/admin') && !pathname.startsWith('/onboarding')

  if (isAdminRoute || isMemberRoute) {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: profile } = await adminClient
      .from('users')
      .select('role, onboarding_completed, access_status, comp_promo_code_id')
      .eq('email', user.email!)
      .single()

    // Admin route guard — JSON 403 for /api/admin/*, redirect for /admin/*
    if (isAdminRoute && profile?.role !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/home', request.url))
    }

    // Beta gate (SPRINT Q): pause non-admin, non-comped members during the
    // closed beta. Admins and comped Friends of George (comp_promo_code_id set)
    // always pass. Reversible — flip access_status back to 'active' to restore.
    // Keyed on comp_promo_code_id, NOT tier_status, so comped Pros aren't paused.
    if (
      isMemberRoute &&
      profile?.role !== 'admin' &&
      profile?.access_status === 'suspended' &&
      !profile?.comp_promo_code_id
    ) {
      return NextResponse.redirect(new URL('/beta-paused', request.url))
    }

    // Onboarding gate: redirect new members to /onboarding until they complete the flow
    if (isMemberRoute && !profile?.onboarding_completed) {
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
    // NOTE: /podcast is intentionally NOT matched — it is a public SEO section
    // (see PUBLIC_ROUTES). Middleware must not run on it so logged-out visitors
    // and crawlers get the server-rendered page instead of an auth redirect.
    '/live',
    '/live/:path*',
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
    '/api/cron/:path*',
  ],
}
