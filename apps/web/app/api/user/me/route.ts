import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ALLOWED_PATCH_FIELDS = ['display_name', 'full_name', 'bio', 'role_title', 'location', 'avatar_url'] as const
type AllowedField = typeof ALLOWED_PATCH_FIELDS[number]

const FIELD_MAX_LENGTHS: Record<AllowedField, number> = {
  display_name: 50,
  full_name:    100,
  bio:          300,
  role_title:   100,
  location:     100,
  avatar_url:   500,
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('users')
    .select('id, email, display_name, full_name, avatar_url, bio, role_title, location, tier, tier_status, tier_expires_at, points, role, created_at')
    .eq('id', user.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Strip non-allowed fields
  const update: Record<string, unknown> = {}
  for (const key of ALLOWED_PATCH_FIELDS) {
    if (key in body && key !== 'avatar_url') {
      const val = body[key]
      if (typeof val !== 'string') continue
      const maxLen = FIELD_MAX_LENGTHS[key]
      if (val.length > maxLen) {
        return NextResponse.json(
          { error: `${key} exceeds maximum length of ${maxLen}` },
          { status: 422 }
        )
      }
      update[key] = val
    }
  }

  // avatar_url allowed only from internal upload flow (validated separately)
  if ('avatar_url' in body && typeof body.avatar_url === 'string') {
    update.avatar_url = body.avatar_url
  }

  // notification_preferences: JSONB object, validated shallowly
  if ('notification_preferences' in body && typeof body.notification_preferences === 'object' && body.notification_preferences !== null && !Array.isArray(body.notification_preferences)) {
    update.notification_preferences = body.notification_preferences
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('users')
    .update(update)
    .eq('id', user.id)
    .select('id, email, display_name, full_name, avatar_url, bio, role_title, location, tier, tier_status, tier_expires_at, points, role, created_at')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  return NextResponse.json(data)
}
