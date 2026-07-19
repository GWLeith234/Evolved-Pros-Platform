export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { resolveGuestEngagement, ensureGuestPersona } from '@/lib/guest/engagement'

// POST /api/guest/submit — an invited guest submits their intake.
// Body: { token, one_liner, short_bio, headshot_url, topics[], links[],
//         av_notes, tee_size, consent_release, first_name, last_name, company,
//         role_title, linkedin_url, twitter_handle, avatar_url }
//
// The signed token is the credential (validated: signature → existence →
// expiry). All writes go through the service-role adminClient. Writes:
//   1. guest_engagements — the submission payload + status='submitted'
//   2. users            — durable identity profile fields
//   3. episodes.guest_* — optional sync when the engagement is booked to an episode
function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map(x => (typeof x === 'string' ? x.trim() : '')).filter(Boolean).slice(0, 25)
}

// Links: accept ["https://..."] or [{ label, url }]. Normalize to {label,url}.
function toLinkArray(v: unknown): { label: string; url: string }[] {
  if (!Array.isArray(v)) return []
  const out: { label: string; url: string }[] = []
  for (const item of v) {
    if (typeof item === 'string' && item.trim()) {
      out.push({ label: '', url: item.trim() })
    } else if (item && typeof item === 'object') {
      const url = String((item as any).url ?? '').trim()
      if (url) out.push({ label: String((item as any).label ?? '').trim(), url })
    }
    if (out.length >= 15) break
  }
  return out
}

function str(v: unknown, max = 2000): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t ? t.slice(0, max) : null
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const token = typeof body.token === 'string' ? body.token.trim() : ''
  const resolved = await resolveGuestEngagement(token)
  if (!resolved.ok) {
    const status = resolved.reason === 'expired' ? 410 : resolved.reason === 'invalid' ? 401 : 404
    return NextResponse.json({ error: `This guest link is ${resolved.reason}.` }, { status })
  }
  const eng = resolved.engagement

  const consent = body.consent_release === true
  if (!consent) {
    return NextResponse.json(
      { error: 'Please confirm the recording release to submit.' },
      { status: 422 },
    )
  }

  const oneLiner   = str(body.one_liner, 280)
  const shortBio   = str(body.short_bio, 2000)
  const headshot   = str(body.headshot_url, 1000)
  const avNotes    = str(body.av_notes, 2000)
  const teeSize    = str(body.tee_size, 12)
  const topics     = toStringArray(body.topics)
  const links      = toLinkArray(body.links)
  const firstName  = str(body.first_name, 120)
  const lastName   = str(body.last_name, 120)
  const company    = str(body.company, 200)
  const roleTitle  = str(body.role_title, 200)
  const linkedin   = str(body.linkedin_url, 500)
  const twitter    = str(body.twitter_handle, 120)
  const avatarUrl  = str(body.avatar_url, 1000) ?? headshot

  const nowIso = new Date().toISOString()

  // 1. guest_engagements — submission payload.
  const { error: engErr } = await (adminClient as any)
    .from('guest_engagements')
    .update({
      one_liner: oneLiner,
      short_bio: shortBio,
      headshot_url: headshot,
      topics,
      links,
      av_notes: avNotes,
      tee_size: teeSize,
      consent_release: consent,
      status: 'submitted',
      submitted_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', eng.engagement_id)
  if (engErr) {
    return NextResponse.json({ error: 'Could not save your submission.' }, { status: 500 })
  }

  // 2. users — durable identity. Only overwrite a column when the guest gave a
  //    value, so a partial resubmit never wipes existing data.
  const fullName =
    [firstName, lastName].filter(Boolean).join(' ').trim() || eng.guest_full_name || null
  const userPatch: Record<string, unknown> = {}
  if (firstName !== null) userPatch.first_name = firstName
  if (lastName !== null) userPatch.last_name = lastName
  if (fullName) userPatch.full_name = fullName
  if (shortBio !== null) userPatch.bio = shortBio
  if (company !== null) userPatch.company = company
  if (roleTitle !== null) userPatch.role_title = roleTitle
  if (linkedin !== null) userPatch.linkedin_url = linkedin
  if (twitter !== null) userPatch.twitter_handle = twitter
  if (avatarUrl !== null) userPatch.avatar_url = avatarUrl
  if (Object.keys(userPatch).length > 0) {
    userPatch.updated_at = nowIso
    await adminClient.from('users').update(userPatch as any).eq('id', eng.user_id)
  }
  // Keep the persona/entitlement correct (idempotent).
  await ensureGuestPersona(eng.user_id)

  // 3. Optional sync to episodes.guest_* when booked to an episode.
  if (eng.episode_id) {
    const epPatch: Record<string, unknown> = {}
    if (fullName) epPatch.guest_name = fullName
    if (roleTitle !== null) epPatch.guest_title = roleTitle
    if (company !== null) epPatch.guest_company = company
    if (shortBio !== null) epPatch.guest_bio = shortBio
    if (headshot !== null) epPatch.guest_image_url = headshot
    if (Object.keys(epPatch).length > 0) {
      await adminClient.from('episodes').update(epPatch as any).eq('id', eng.episode_id)
    }
  }

  return NextResponse.json({ ok: true })
}
