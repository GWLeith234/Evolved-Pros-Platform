import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { redeemComp } from '@/lib/promo/redeemComp'

export const dynamic = 'force-dynamic'

// POST /api/redeem — member-facing comp/access code redemption.
// Requires an authenticated session; grants the code's tier to the caller.
export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Sign in to redeem a code.' }, { status: 401 })
  }

  let body: { code?: unknown }
  try {
    body = (await request.json()) as { code?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const code = typeof body.code === 'string' ? body.code.trim() : ''
  if (!code) return NextResponse.json({ error: 'Enter a code.' }, { status: 422 })

  const result = await redeemComp(user.id, user.email, code)
  if (!result.ok) {
    if (result.error === 'invalid') {
      return NextResponse.json(
        { error: "That code isn't valid or has reached its limit." },
        { status: 422 },
      )
    }
    return NextResponse.json(
      { error: 'Something went wrong redeeming your code. Please try again.' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    tier: result.grantsTier,
    label: result.label,
    alreadyRedeemed: result.alreadyRedeemed,
  })
}
