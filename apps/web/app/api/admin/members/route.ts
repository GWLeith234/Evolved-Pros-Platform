import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
export async function GET() {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data: members, error } = await supabase.from('users').select('id, email, full_name, display_name, tier, tier_status, role, created_at, avatar_url, points').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ members })
}
export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json()
  const { email, fullName, tier } = body
  if (!email || typeof email !== 'string') return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  const safeTier = ((tier as string) ?? 'community').toLowerCase()
  if (!['community', 'pro'].includes(safeTier)) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, { data: { full_name: fullName ?? null, tier: safeTier, role: 'member' } })
  if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 400 })
  if (invited?.user) {
    await adminClient.from('users').upsert({ id: invited.user.id, email, full_name: fullName ?? null, tier: safeTier, tier_status: 'active', role: 'member' }, { onConflict: 'id', ignoreDuplicates: true })
  }
  return NextResponse.json({ success: true })
}
