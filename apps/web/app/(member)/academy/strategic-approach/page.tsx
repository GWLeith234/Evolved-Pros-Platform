export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchUserProfile, fetchCourseByPillarNumber } from '@/lib/academy/fetchers'
import { PillarPageShell } from '@/components/academy/PillarPageShell'
import { LiveSessionCard } from '@/components/academy/LiveSessionCard'
import { HierarchySort } from '@/components/academy/HierarchySort'
import { WIGWizard } from '@/components/academy/WIGWizard'
import { ScenarioMCQ } from '@/components/academy/ScenarioMCQ'
import { PeerDiscussion } from '@/components/academy/PeerDiscussion'
import { Capstone } from '@/components/academy/Capstone'
import type { ComponentProps } from 'react'

const P4_DOMAIN_ITEMS = [
  { id: 'professional', label: 'Professional', description: 'Career growth, skills, and client relationships' },
  { id: 'financial',    label: 'Financial',    description: 'Revenue targets, income goals, and financial freedom' },
  { id: 'health',       label: 'Health',       description: 'Physical performance, energy, and longevity' },
  { id: 'relational',   label: 'Relational',   description: 'Key relationships, team, family, and network' },
]

const P4_MCQ_QUESTIONS: ComponentProps<typeof ScenarioMCQ>['questions'] = [
  {
    id: 'p4-m1-q1',
    scenario: 'You have 6 priorities marked as "urgent" for the week. You…',
    options: [
      {
        id: 'a', text: 'Work longer hours to get through all of them',
        isCorrect: false,
        explanation: 'Adding hours without adding strategy just creates more noise. If everything is urgent, nothing is — you need a framework to identify what truly moves the needle.',
      },
      {
        id: 'b', text: 'Identify your single Wildly Important Goal and ruthlessly protect it',
        isCorrect: true,
        explanation: 'Strategic discipline means choosing what NOT to do as much as choosing what to do. Protecting your WIG from the whirlwind of daily urgency is the core skill of strategic execution.',
      },
      {
        id: 'c', text: 'Delegate everything else and only do what you enjoy',
        isCorrect: false,
        explanation: 'Delegation is valuable but it isn\'t a strategy on its own. Without clear priorities, you\'re delegating the wrong things or still spreading yourself across too many goals.',
      },
      {
        id: 'd', text: 'Address the most visible priority first to manage perception',
        isCorrect: false,
        explanation: 'Managing optics instead of outcomes is a reactive posture. Visible priorities aren\'t always the most impactful ones.',
      },
    ],
  },
  {
    id: 'p4-m1-q2',
    scenario: 'Your Q1 results are behind target. You review your activity and realise you\'ve been extremely busy. You…',
    options: [
      {
        id: 'a', text: 'Increase total activity volume across all areas',
        isCorrect: false,
        explanation: 'More activity in the wrong direction accelerates the problem. Busyness without strategic alignment is a common trap.',
      },
      {
        id: 'b', text: 'Analyse which lead measures are actually correlated with your lag results',
        isCorrect: true,
        explanation: 'Lead measures predict lag results. When lag results are off, the answer is to examine whether you\'re executing on the right lead measures — not to simply do more.',
      },
      {
        id: 'c', text: 'Adjust your targets to be more realistic',
        isCorrect: false,
        explanation: 'Lowering targets before examining strategy is premature. Most people underperform their targets due to execution gaps, not target problems.',
      },
      {
        id: 'd', text: 'Wait for Q2 and reset with a fresh mindset',
        isCorrect: false,
        explanation: 'Waiting without changing the underlying approach guarantees the same outcome next quarter. Analysis and adjustment must happen now.',
      },
    ],
  },
  {
    id: 'p4-m1-q3',
    scenario: 'You\'re offered a significant new opportunity that isn\'t aligned with your WIG. You…',
    options: [
      {
        id: 'a', text: 'Take it — opportunities don\'t wait',
        isCorrect: false,
        explanation: 'Taking every opportunity dilutes your capacity for the one thing that matters most. Strategic discipline requires saying no to good things to protect great ones.',
      },
      {
        id: 'b', text: 'Evaluate it against your WIG criteria and decline if it diverts focus',
        isCorrect: true,
        explanation: 'The discipline to say no to misaligned opportunities is what separates strategic performers from perpetually distracted ones. Every yes to something outside your WIG is a no to your WIG.',
      },
      {
        id: 'c', text: 'Pursue it alongside your WIG to keep options open',
        isCorrect: false,
        explanation: 'Pursuing both typically means delivering on neither. Divided focus is one of the most common causes of underperformance in high-potential professionals.',
      },
      {
        id: 'd', text: 'Ask your manager to decide for you',
        isCorrect: false,
        explanation: 'Outsourcing strategic decisions reflects a reactive orientation. You need to own your WIG and defend it proactively.',
      },
    ],
  },
  {
    id: 'p4-m1-q4',
    scenario: 'You set a 90-day goal but haven\'t made any measurable progress after 30 days. You…',
    options: [
      {
        id: 'a', text: 'Extend the timeline to reduce pressure',
        isCorrect: false,
        explanation: 'Extending timelines without identifying the root cause doesn\'t solve the problem — it delays it. The real question is why progress stalled.',
      },
      {
        id: 'b', text: 'Run a structured review: identify what lead measures you\'ve neglected and course-correct',
        isCorrect: true,
        explanation: 'A 30-day review point is exactly when structured diagnosis matters. Identifying gaps in lead measure execution — not the goal itself — is how you course-correct before it\'s too late.',
      },
      {
        id: 'c', text: 'Keep going and trust the process — results take time',
        isCorrect: false,
        explanation: 'Blind persistence without adaptation isn\'t trust — it\'s hope. Strategic performers check in regularly and adjust based on evidence.',
      },
      {
        id: 'd', text: 'Abandon the goal and set a more achievable one',
        isCorrect: false,
        explanation: 'Abandoning a goal at 30 days eliminates any chance of success and creates a habit of quitting. Review first, then decide.',
      },
    ],
  },
  {
    id: 'p4-m1-q5',
    scenario: 'Your team asks you to join 4 new committees that will consume 6 hours per week. You…',
    options: [
      {
        id: 'a', text: 'Join all — visibility is important for career growth',
        isCorrect: false,
        explanation: 'Six hours per week on misaligned committees is 24+ hours per month diverted from your WIG. Visibility that costs you strategic progress is a net loss.',
      },
      {
        id: 'b', text: 'Decline all — you don\'t have time for extra commitments',
        isCorrect: false,
        explanation: 'Blanket refusal isn\'t strategic either. One committee that aligns directly with your WIG might be worth it — the answer requires evaluation, not automatic rejection.',
      },
      {
        id: 'c', text: 'Evaluate each against your WIG and only commit to those that directly advance it',
        isCorrect: true,
        explanation: 'Strategic resource allocation means every commitment — including time — must be run through the WIG filter. This is how elite performers protect execution capacity.',
      },
      {
        id: 'd', text: 'Agree provisionally and see if they become a problem',
        isCorrect: false,
        explanation: 'Provisional agreement without a clear WIG filter leads to scope creep. You need to make an intentional decision upfront, not react once you\'re already overcommitted.',
      },
    ],
  },
]

export default async function Page() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, p4Course] = await Promise.all([
    fetchUserProfile(supabase, user.id),
    fetchCourseByPillarNumber(supabase, 4),
  ])

  const memberName = profile?.full_name ?? profile?.display_name ?? null

  return (
    <PillarPageShell pillarNumber={4} showReflection showAudit>
      <LiveSessionCard pillarId="strategic-approach" pillarNumber={4} />
      <HierarchySort
        title="Which life domain needs your strategic focus most?"
        items={P4_DOMAIN_ITEMS}
        saveKey="p4-domain-hierarchy"
      />
      {p4Course && <WIGWizard courseId={p4Course.id} />}
      {p4Course && (
        <ScenarioMCQ
          courseId={p4Course.id}
          moduleNumber={1}
          questions={P4_MCQ_QUESTIONS}
        />
      )}
      {p4Course && (
        <PeerDiscussion
          courseId={p4Course.id}
          moduleNumber={1}
          title="Strategic Approach — Group Discussion"
        />
      )}
      {p4Course && (
        <Capstone
          courseId={p4Course.id}
          pillarNumber={4}
          memberName={memberName}
        />
      )}
    </PillarPageShell>
  )
}
