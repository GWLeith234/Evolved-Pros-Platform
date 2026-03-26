export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

const DEV_PROFILE = JSON.stringify({
  id: 'dev-00000000-0000-0000-0000-000000000000',
  email: 'dev@evolvedpros.com',
  display_name: 'Dev User',
  full_name: 'Dev User',
  avatar_url: null,
  tier: 'pro',
  tier_status: 'active',
  role: 'admin',
  points: 9999,
})

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const res = NextResponse.json({ url: '/home' })
  res.cookies.set('dev_session', DEV_PROFILE, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
  return res
}
