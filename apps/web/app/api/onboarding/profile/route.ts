import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { clientSafeError } from '@/lib/http/clientError'

const STRING_FIELDS = {
  avatar_url: 2048,
  display_name: 50,
  company: 150,
  bio: 300,
  location: 100,
  role_title: 100,
} as const

type StringField = keyof typeof STRING_FIELDS

const FOCUS_PILLARS = new Set([1, 2, 3, 4, 5, 6])

type ProfileUpdate = Partial<Record<StringField, string | null> & { focus_pillar: number | null }>

export function profilePatchUpdate(body: unknown): { ok: true; update: ProfileUpdate } | { ok: false; error: string } {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Invalid JSON' }
  }

  const record = body as Record<string, unknown>
  const update: ProfileUpdate = {}

  for (const field of Object.keys(STRING_FIELDS) as StringField[]) {
    if (!(field in record)) continue
    const value = record[field]
    if (value === null) {
      update[field] = null
      continue
    }
    if (typeof value !== 'string') {
      return { ok: false, error: `${field} must be a string` }
    }
    const trimmed = value.trim()
    if (trimmed.length > STRING_FIELDS[field]) {
      return { ok: false, error: `${field} exceeds maximum length of ${STRING_FIELDS[field]}` }
    }
    if (field === 'avatar_url' && trimmed.length > 0 && !/^https?:\/\//i.test(trimmed)) {
      return { ok: false, error: 'avatar_url must be http(s)' }
    }
    update[field] = trimmed.length === 0 ? null : trimmed
  }

  if ('focus_pillar' in record) {
    const value = record.focus_pillar
    if (value === null) {
      update.focus_pillar = null
    } else if (typeof value !== 'number' || !Number.isInteger(value) || !FOCUS_PILLARS.has(value)) {
      return { ok: false, error: 'focus_pillar must be an integer from 1 to 6' }
    } else {
      update.focus_pillar = value
    }
  }

  return { ok: true, update }
}

export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = profilePatchUpdate(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  if (Object.keys(parsed.update).length === 0) {
    return NextResponse.json({ ok: true })
  }

  // Use adminClient to bypass RLS on the users table.
  // Use email lookup because auth UUID may differ from public users UUID.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient as any)
    .from('users')
    .update(parsed.update)
    .eq('email', user.email)

  if (error) {
    return NextResponse.json(
      { error: clientSafeError('[PATCH /api/onboarding/profile]', error, 'Could not save your profile.') },
      { status: 500 },
    )
  }
  return NextResponse.json({ ok: true })
}
