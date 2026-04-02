export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchUserProfile, fetchCourseByPillarNumber } from '@/lib/academy/fetchers'
import { PillarPageShell } from '@/components/academy/PillarPageShell'
import { LiveSessionCard } from '@/components/academy/LiveSessionCard'
import { CompoundCalculator } from '@/components/academy/CompoundCalculator'
import { HabitStackBuilder } from '@/components/academy/HabitStackBuilder'
import { ReviewCadences } from '@/components/academy/ReviewCadences'
import { HabitHistoryChart } from '@/components/academy/HabitHistoryChart'
import { ScenarioMCQ } from '@/components/academy/ScenarioMCQ'
import { PeerDiscussion } from '@/components/academy/PeerDiscussion'
import { Capstone } from '@/components/academy/Capstone'
import type { ComponentProps } from 'react'

const P6_MCQ_QUESTIONS: ComponentProps<typeof ScenarioMCQ>['questions'] = [
  {
    id: 'p6-m1-q1',
    scenario: "You've set a habit of 20 cold calls per day. After week 1, you're averaging 12. You…",
    options: [
      {
        id: 'a', text: "Lower the target to 12 — that's what you can realistically do",
        isCorrect: false,
        explanation: 'Execution gaps are normal in week 1. Compound results appear in month 3+. Lowering the standard at the first sign of resistance kills the habit before it forms.',
      },
      {
        id: 'b', text: 'Push through and trust the compound effect — it takes time',
        isCorrect: true,
        explanation: 'Execution gaps are normal in week 1. Compound results appear in month 3+. Stay the course — the habit is still forming.',
      },
      {
        id: 'c', text: 'Switch habits — 20 calls was too ambitious',
        isCorrect: false,
        explanation: 'Switching habits before giving them a fair run is how you avoid the discomfort of growth. One week is not enough data.',
      },
      {
        id: 'd', text: 'Take a week off and reset',
        isCorrect: false,
        explanation: "A week off doesn't reset the habit — it breaks it. Momentum compounds the same way results do.",
      },
    ],
  },
  {
    id: 'p6-m1-q2',
    scenario: 'You have 6 habits you want to build simultaneously. Your execution rate after 2 weeks is 40%. You…',
    options: [
      {
        id: 'a', text: 'Push harder across all 6 — you just need more discipline',
        isCorrect: false,
        explanation: "Discipline isn't the issue — architecture is. Stacking too many new habits at once is the most common reason habit stacks fail.",
      },
      {
        id: 'b', text: 'Drop to 2–3 keystone habits and nail them first',
        isCorrect: true,
        explanation: "Start with the 2–3 habits that anchor everything else. A 90% execution rate on 3 habits beats 40% on 6 every time.",
      },
      {
        id: 'c', text: 'Replace the habits with ones that feel more natural',
        isCorrect: false,
        explanation: "The best habits are rarely the comfortable ones. Replace them only after honest execution — not because they feel hard.",
      },
      {
        id: 'd', text: 'Track them in an app so you don\'t forget',
        isCorrect: false,
        explanation: "Tracking is a tool, not a solution. An app won't reduce the cognitive load of managing 6 new behaviours at once.",
      },
    ],
  },
  {
    id: 'p6-m1-q3',
    scenario: "You've been executing your stack consistently for 6 weeks, but your weekly performance review keeps slipping to 'next week'. You…",
    options: [
      {
        id: 'a', text: 'Accept that you\'re an executer, not a planner',
        isCorrect: false,
        explanation: 'Execution without review is blind effort. Without review, you have no feedback loop to improve the quality of your execution.',
      },
      {
        id: 'b', text: 'Set a non-negotiable Sunday review window of 20 minutes',
        isCorrect: true,
        explanation: 'The weekly review is not optional — it is the mechanism that turns effort into learning and improvement. Schedule it like a flight.',
      },
      {
        id: 'c', text: 'Add a new habit to remind yourself to review',
        isCorrect: false,
        explanation: "A habit reminder doesn't fix a calendar problem. Block the time and protect it.",
      },
      {
        id: 'd', text: 'Review quarterly instead — weekly is too frequent',
        isCorrect: false,
        explanation: "Quarterly review can't catch and correct the micro-drift that compounds into major deviation. Weekly feedback loops are the standard for elite performers.",
      },
    ],
  },
  {
    id: 'p6-m1-q4',
    scenario: "You're spending 4 hours/day planning and 1 hour executing. You feel busy but results are stagnant. You…",
    options: [
      {
        id: 'a', text: 'Plan more thoroughly so execution is easier',
        isCorrect: false,
        explanation: "More planning amplifies the existing imbalance. At some point, planning becomes a sophisticated way to avoid execution.",
      },
      {
        id: 'b', text: 'Invert the ratio — 1 hour planning, 4 hours executing',
        isCorrect: true,
        explanation: "Elite execution is mostly doing. The 80/20 rule applies here — most of your time should be in execution, not planning.",
      },
      {
        id: 'c', text: 'Hire someone to execute your plans',
        isCorrect: false,
        explanation: "You can't outsource the behaviours that build your capability. Delegation comes after you've mastered the execution yourself.",
      },
      {
        id: 'd', text: 'Take a course on better planning frameworks',
        isCorrect: false,
        explanation: "You don't have a planning problem — you have an execution deficit. Another framework won't solve a behaviour gap.",
      },
    ],
  },
  {
    id: 'p6-m1-q5',
    scenario: "A colleague asks you to join a project that will disrupt your morning habit stack 3 days a week. The project is exciting. You…",
    options: [
      {
        id: 'a', text: 'Join — exciting opportunities are rare',
        isCorrect: false,
        explanation: "Every yes to a distraction is a no to your non-negotiables. Exciting ≠ aligned. Guard your execution system from disruption.",
      },
      {
        id: 'b', text: "Decline — your non-negotiables aren't negotiable",
        isCorrect: true,
        explanation: "Non-negotiables only work if you treat them that way. The people who execute at the highest level are protective of the routines that drive their results.",
      },
      {
        id: 'c', text: 'Join but try to fit habits in when you can',
        isCorrect: false,
        explanation: "'When I can' is not a habit stack — it's a wishful schedule. Habits require predictable triggers and consistent timing.",
      },
      {
        id: 'd', text: 'Ask your coach if it\'s okay to skip the habits occasionally',
        isCorrect: false,
        explanation: "You already know the answer. The question is whether you have the discipline to act on it.",
      },
    ],
  },
]

export default async function Page() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, p6Course] = await Promise.all([
    fetchUserProfile(supabase, user.id),
    fetchCourseByPillarNumber(supabase, 6),
  ])

  // Fetch habits, today's completions, and review cadences server-side
  const today = new Date().toISOString().split('T')[0]
  const [habitsRes, completionsRes, cadencesRes] = p6Course ? await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('habit_stacks')
      .select('id, name, time_of_day, sort_order, course_id, created_at')
      .eq('user_id', user.id)
      .eq('course_id', p6Course.id)
      .order('sort_order'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('habit_completions')
      .select('habit_id')
      .eq('user_id', user.id)
      .eq('completed_date', today),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('review_cadences')
      .select('id, cadence_type, schedule_json, focus_area')
      .eq('user_id', user.id)
      .eq('course_id', p6Course.id),
  ]) : [{ data: [] }, { data: [] }, { data: [] }]

  const memberName = profile?.full_name ?? profile?.display_name ?? null
  const initialHabits = (habitsRes.data ?? []) as { id: string; name: string; time_of_day: string; sort_order: number; course_id: string | null; created_at: string }[]
  const initialCompletions = ((completionsRes.data ?? []) as { habit_id: string }[]).map(c => c.habit_id)
  const initialCadences = (cadencesRes.data ?? []) as { id: string; cadence_type: 'weekly' | 'monthly' | 'quarterly'; schedule_json: Record<string, string>; focus_area: string | null }[]

  return (
    <PillarPageShell pillarNumber={6} showReflection showAudit>
      <LiveSessionCard pillarId="execution" pillarNumber={6} />
      <CompoundCalculator />
      {p6Course && (
        <HabitStackBuilder
          courseId={p6Course.id}
          initialHabits={initialHabits}
          initialCompletions={initialCompletions}
        />
      )}
      {p6Course && (
        <HabitHistoryChart userId={user.id} />
      )}
      {p6Course && (
        <ReviewCadences
          courseId={p6Course.id}
          initialCadences={initialCadences}
        />
      )}
      {p6Course && (
        <ScenarioMCQ
          courseId={p6Course.id}
          moduleNumber={1}
          questions={P6_MCQ_QUESTIONS}
        />
      )}
      {p6Course && (
        <PeerDiscussion
          courseId={p6Course.id}
          moduleNumber={1}
          title="Execution — Group Discussion"
        />
      )}
      {p6Course && (
        <Capstone
          courseId={p6Course.id}
          pillarNumber={6}
          memberName={memberName}
        />
      )}
    </PillarPageShell>
  )
}
