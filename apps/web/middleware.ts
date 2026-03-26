import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/auth/callback', '/api/webhooks/vendasta', '/api/health', '/dev-login', '/api/dev-login']
const ADMIN_ROUTES  = ['/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))
  if (isPublic) return NextResponse.next()

  // Dev bypass: if a dev_session cookie is present, skip Supabase entirely
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

  let response = NextResponse.next({ request })

  // @supabase/ssr v0.3.x uses get/set/remove (not getAll/setAll)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value, ...options } as Parameters<typeof request.cookies.set>[0])
          response = NextResponse.next({ request })
          response.cookies.set({ name, value, ...options } as Parameters<typeof response.cookies.set>[0])
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value: '', ...options } as Parameters<typeof request.cookies.set>[0])
          response = NextResponse.next({ request })
          response.cookies.set({ name, value: '', ...options } as Parameters<typeof response.cookies.set>[0])
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  console.log('[middleware]', pathname, 'user:', user?.id ?? 'none', 'cookies:', request.cookies.getAll().map(c => c.name).join(', '))

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin route guard
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/home', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
