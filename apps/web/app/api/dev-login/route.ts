import { NextResponse } from 'next/server'

const DEV_PROFILE = JSON.stringify({
  id: 'dev-00000000-0000-0000-0000-000000000000',
  email: 'dev@evolvedpros.com',
  display_name: 'Dev User',
  full_name: 'Dev User',
  avatar_url: null,
  tier: 'Platinum',
  tier_status: 'active',
  role: 'admin',
  points: 9999,
})

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: { email?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 422 })
  }

  // Skip Supabase entirely — set a dev session cookie and redirect to /home
  const res = NextResponse.json({ url: '/home' })
  res.cookies.set('dev_session', DEV_PROFILE, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
  return res
}
