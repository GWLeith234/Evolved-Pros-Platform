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
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value, options)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: do not add logic between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log(
    '[middleware]',
    pathname,
    '| user:',
    user?.id ?? 'none',
    '| cookies:',
    request.cookies.getAll().map(c => c.name).join(', ')
  )
  const authCookie = request.cookies.getAll().find(c => c.name.includes('auth-token') || c.name.includes('supabase'))
  if (authCookie) console.log('[middleware] auth cookie found:', authCookie.name, '=', authCookie.value.slice(0, 40) + '...')

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

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
