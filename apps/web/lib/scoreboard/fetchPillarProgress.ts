/**
 * Shared pillar progress for Enhanced Scoreboard (Sprint 4C).
 * Keys lesson_progress on public.users.id via adminClient.
 */
import { adminClient } from '@/lib/supabase/admin'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import type { PillarProgressRow } from '@/components/scoreboard/ScoreboardHero'

const PILLAR_SLUG: Record<number, string> = {
  1: 'foundation',
  2: 'identity',
  3: 'mental-toughness',
  4: 'strategy',
  5: 'accountability',
  6: 'execution',
}

export async function fetchPillarProgress(profileId: string): Promise<PillarProgressRow[]> {
  try {
    const [courses, lessons, progress] = await Promise.all([
      adminClient
        .from('courses')
        .select('id, title, slug, sort_order, pillar_number')
        .eq('is_published', true)
        .order('sort_order'),
      adminClient
        .from('lessons')
        .select('id, course_id')
        .eq('is_published', true),
      adminClient
        .from('lesson_progress')
        .select('lesson_id, completed_at')
        .eq('user_id', profileId),
    ])

    const completed = new Set(
      (progress.data ?? []).filter(p => p.completed_at).map(p => p.lesson_id),
    )
    const touched = new Set((progress.data ?? []).map(p => p.lesson_id))

    const lessonsByCourse: Record<string, string[]> = {}
    for (const l of lessons.data ?? []) {
      if (!lessonsByCourse[l.course_id]) lessonsByCourse[l.course_id] = []
      lessonsByCourse[l.course_id].push(l.id)
    }

    const byPillar = new Map<number, PillarProgressRow>()

    for (const c of courses.data ?? []) {
      const n = c.pillar_number as number | null
      if (!n || n < 1 || n > 6) continue
      const ids = lessonsByCourse[c.id] ?? []
      const total = ids.length
      const done = ids.filter(id => completed.has(id)).length
      const any = ids.some(id => touched.has(id))
      const pct = total > 0 ? Math.round((done / total) * 100) : 0
      let state: PillarProgressRow['state'] = 'untouched'
      if (total > 0 && done >= total) state = 'done'
      else if (any && done < total) state = 'active'
      else if (!any && total === 0) state = 'untouched'

      const slug = c.slug ?? PILLAR_SLUG[n] ?? 'foundation'
      const name =
        PILLAR_CONFIG[n as 1 | 2 | 3 | 4 | 5 | 6]?.label ?? c.title ?? `Pillar ${n}`

      // Prefer first course per pillar_number (sorted)
      if (!byPillar.has(n)) {
        byPillar.set(n, {
          number: n as 1 | 2 | 3 | 4 | 5 | 6,
          name,
          slug,
          pct,
          completed: done,
          total,
          state,
        })
      }
    }

    return ([1, 2, 3, 4, 5, 6] as const).map(n => {
      return (
        byPillar.get(n) ?? {
          number: n,
          name: PILLAR_CONFIG[n]?.label ?? `Pillar ${n}`,
          slug: PILLAR_SLUG[n],
          pct: 0,
          completed: 0,
          total: 0,
          state: 'untouched' as const,
        }
      )
    })
  } catch (err) {
    console.error('[fetchPillarProgress]', err)
    return ([1, 2, 3, 4, 5, 6] as const).map(n => ({
      number: n,
      name: PILLAR_CONFIG[n]?.label ?? `Pillar ${n}`,
      slug: PILLAR_SLUG[n],
      pct: 0,
      completed: 0,
      total: 0,
      state: 'untouched' as const,
    }))
  }
}
