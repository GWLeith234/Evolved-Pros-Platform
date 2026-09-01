import 'server-only'
import { adminClient } from '@/lib/supabase/admin'
import { PILLAR_NAMES } from '@/lib/academy/types'
import type { PillarScore } from '@/lib/academy/gating'

/**
 * SPRINT TIER-1 — the pillar assessment results feed.
 *
 * Reads the EXISTING pillar_audits data (written by components/academy/
 * PillarAudit via POST /api/pillar-audit). No new assessment is introduced
 * here: this is the read side that was missing, so a member could take an
 * audit on each pillar page and then never see the six scores together.
 *
 * Shape notes, learned from the live table:
 *   - pillar_audits.user_id FKs auth.users(id) — it stores the AUTH uuid, not
 *     public.users.id (see app/api/pillar-audit/route.ts). Callers must pass
 *     the auth uid here, which is the opposite of lesson_progress. Getting
 *     this backwards returns an empty result set silently.
 *   - score is 0-100 (the audit normalises its 1-5 Likert answers ×20).
 *   - There is one row per submission, not per pillar — a retake inserts
 *     another row. Latest-by-created_at wins per course.
 *   - course_id is nullable, so rows with no course are skipped.
 *
 * adminClient because the RLS policy on pillar_audits keys on auth.uid(),
 * which is unreliable in an RSC stream (the same footgun documented across
 * lib/academy/fetchers.ts).
 */

export interface PillarAssessment extends PillarScore {
  label: string
  /** courses.required_tier for this pillar — drives the CTA target. */
  requiredTier: string
  /** When this pillar was last audited. */
  takenAt: string | null
}

export async function fetchPillarAssessment(authUserId: string): Promise<PillarAssessment[]> {
  const [coursesResult, auditsResult] = await Promise.all([
    adminClient
      .from('courses')
      .select('id, pillar_number, title, required_tier')
      .eq('is_published', true)
      .order('pillar_number'),
    adminClient
      .from('pillar_audits')
      .select('course_id, score, created_at')
      .eq('user_id', authUserId)
      .order('created_at', { ascending: false }),
  ])

  if (coursesResult.error) {
    console.warn('[academy.fetchPillarAssessment] courses error:', coursesResult.error.message)
  }
  if (auditsResult.error) {
    console.warn('[academy.fetchPillarAssessment] audits error:', auditsResult.error.message)
  }

  const courses = coursesResult.data ?? []

  // Rows arrive newest-first, so the first row seen for a course is its latest
  // audit; later (older) rows for the same course are retake history.
  const latestByCourse = new Map<string, { score: number | null; created_at: string }>()
  for (const audit of auditsResult.data ?? []) {
    if (!audit.course_id) continue
    if (!latestByCourse.has(audit.course_id)) {
      latestByCourse.set(audit.course_id, { score: audit.score, created_at: audit.created_at })
    }
  }

  return courses
    .filter(c => c.pillar_number >= 1 && c.pillar_number <= 6)
    .map(course => {
      const latest = latestByCourse.get(course.id)
      return {
        pillarNumber: course.pillar_number,
        label: PILLAR_NAMES[course.pillar_number] ?? course.title,
        score: latest?.score ?? null,
        requiredTier: course.required_tier,
        takenAt: latest?.created_at ?? null,
      }
    })
    .sort((a, b) => a.pillarNumber - b.pillarNumber)
}
