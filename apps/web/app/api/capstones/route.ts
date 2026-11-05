export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { sendProgramCompletionEmail } from '@/lib/resend/emails/program-completion'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { canAccessAcademy } from '@/lib/entitlements'
import { capstoneCoversProgram } from '@/lib/academy/capstoneGrant'
import { clientSafeError } from '@/lib/http/clientError'
import type { Database } from '@evolved-pros/db'

type Profile = Database['public']['Tables']['users']['Row']

/**
 * POST /api/capstones
 *
 * The insert uses the service role, which bypasses RLS. Two writes used to
 * ride along with that:
 *
 *   - courses.is_locked = false on the NEXT pillar. That row is shared.
 *     The first member to submit a capstone opened the pillar for everyone.
 *   - On pillar 6, program_completed_at plus the alumni badge, with no
 *     check that pillars 1–5 had been submitted. Course ids are on the
 *     academy storefront, so a free account could post Execution's id.
 *
 * Tier access is still what opens a pillar. This route records the
 * member's own capstone and grants alumni only when all six are in.
 */
export async function POST(request: Request) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (profile.role !== 'admin' && !canAccessAcademy(profile.tier, profile.tier_status)) {
    return NextResponse.json({ error: 'Capstones are part of the Academy.' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const courseId = typeof body.course_id === 'string' ? body.course_id.trim() : null
  const content = typeof body.content === 'string' ? body.content.trim() : ''

  if (!courseId) return NextResponse.json({ error: 'course_id is required' }, { status: 422 })
  if (content.length < 200) return NextResponse.json({ error: 'Capstone must be at least 200 characters' }, { status: 422 })

  const { data: course, error: courseError } = await adminClient
    .from('courses')
    .select('id, pillar_number')
    .eq('id', courseId)
    .eq('is_published', true)
    .maybeSingle()

  if (courseError) {
    return NextResponse.json(
      { error: clientSafeError('[POST /api/capstones] course lookup', courseError, 'Could not submit capstone') },
      { status: 500 },
    )
  }
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const submittedAt = new Date().toISOString()
  const { data: capstone, error: insertError } = await adminClient
    .from('capstones')
    .insert({
      user_id: profile.id,
      course_id: courseId,
      content,
      status: 'submitted',
      submitted_at: submittedAt,
    })
    .select('id, course_id, status, submitted_at')
    .single()

  if (insertError || !capstone) {
    return NextResponse.json(
      { error: clientSafeError('[POST /api/capstones] insert', insertError, 'Failed to submit capstone') },
      { status: 500 },
    )
  }

  const currentPillar = course.pillar_number ?? 0
  if (currentPillar >= 1 && currentPillar <= 6) {
    await grantProgramIfComplete(profile)
  }

  if (currentPillar === 6) {
    return NextResponse.json({ capstone, nextCourseSlug: 'completion' }, { status: 201 })
  }

  const nextPillarNumber = currentPillar + 1
  if (nextPillarNumber < 1 || nextPillarNumber > 6) {
    return NextResponse.json({ capstone, nextCourseSlug: null })
  }

  const { data: nextCourse, error: nextError } = await adminClient
    .from('courses')
    .select('slug')
    .eq('pillar_number', nextPillarNumber)
    .eq('is_published', true)
    .maybeSingle()

  if (nextError || !nextCourse) {
    if (nextError) {
      clientSafeError('[POST /api/capstones] next course lookup', nextError, 'Could not submit capstone')
    }
    return NextResponse.json({ capstone, nextCourseSlug: null })
  }

  return NextResponse.json({
    capstone,
    nextCourseSlug: nextCourse.slug,
  }, { status: 201 })
}

/**
 * Alumni only after a submitted capstone exists for every pillar. Does not
 * write `courses`. A failure here leaves the capstone saved and skips the
 * credential rather than failing the submission.
 */
async function grantProgramIfComplete(profile: Profile) {
  if (profile.program_completed_at) return

  const { data: submitted, error: listError } = await adminClient
    .from('capstones')
    .select('course_id')
    .eq('user_id', profile.id)

  if (listError || !submitted) {
    clientSafeError('[POST /api/capstones] capstone list', listError, 'Could not submit capstone')
    return
  }

  const courseIds = [...new Set(
    submitted
      .map(row => row.course_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0),
  )]
  if (courseIds.length === 0) return

  const { data: pillars, error: pillarError } = await adminClient
    .from('courses')
    .select('pillar_number')
    .in('id', courseIds)

  if (pillarError || !pillars) {
    clientSafeError('[POST /api/capstones] pillar lookup', pillarError, 'Could not submit capstone')
    return
  }

  if (!capstoneCoversProgram(pillars.map(row => row.pillar_number))) return

  const now = new Date().toISOString()
  await Promise.all([
    adminClient
      .from('users')
      .update({ program_completed_at: now })
      .eq('id', profile.id),
    adminClient
      .from('member_badges')
      .upsert(
        { user_id: profile.id, pillar_number: 7, pillar_name: 'EVOLVED Alumni', awarded_at: now },
        { onConflict: 'user_id,pillar_number' },
      ),
  ])

  const displayName = profile.display_name ?? profile.full_name ?? 'Member'
  const completionDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  if (profile.email) {
    sendProgramCompletionEmail({ email: profile.email, displayName, completionDate }).catch(err => {
      clientSafeError('[POST /api/capstones] completion email', err, 'Could not submit capstone')
    })
  }
}
