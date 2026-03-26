import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json()
  const ALLOWED = ['tier', 'tier_status'] as const
  type AllowedKey = (typeof ALLOWED)[number]
  const updates: Record<AllowedKey, string> = {} as Record<AllowedKey, string>
  for (const key of ALLOWED) {
    if (body[key] !== undefined && typeof body[key] === 'string') updates[key] = body[key].toLowerCase().trim()
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  if (updates.tier && !['community', 'pro'].includes(updates.tier)) return NextResponse.json({ error: 'Invalid tier value' }, { status: 400 })
  if (updates.tier_status && !['active', 'suspended'].includes(updates.tier_status)) return NextResponse.json({ error: 'Invalid tier_status value' }, { status: 400 })
  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
  const { error: updateError } = await adminClient.from('users').update(updates).eq('id', params.id)
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
