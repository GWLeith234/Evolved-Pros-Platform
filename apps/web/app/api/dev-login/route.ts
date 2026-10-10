export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

function productionNotFound(): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }
  return null
}

function methodNotAllowed(): NextResponse {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function GET() {
  return productionNotFound() ?? methodNotAllowed()
}

export const HEAD = GET
export const PUT = GET
export const PATCH = GET
export const DELETE = GET
export const OPTIONS = GET

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
  const blocked = productionNotFound()
  if (blocked) return blocked

  const res = NextResponse.json({ url: '/home' })
  res.cookies.set('dev_session', DEV_PROFILE, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
  return res
}
