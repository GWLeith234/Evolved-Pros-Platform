export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchUserProfile, fetchCourseByPillarNumber } from '@/lib/academy/fetchers'
import { PillarPageShell } from '@/components/academy/PillarPageShell'
import { LiveSessionCard } from '@/components/academy/LiveSessionCard'
import { HierarchySort } from '@/components/academy/HierarchySort'
import { WIGWizard } from '@/components/academy/WIGWizard'
import { NotToDoTool } from '@/components/academy/NotToDoTool'
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
    scenario: 'You have 12 priorities this quarter. Your manager wants all of them treated as #1. You…',
    options: [
      {
        id: 'a', text: 'Work on all 12 equally',
        isCorrect: false,
        explanation: 'Strategy is the art of saying no. One WIG executed beats twelve half-finished goals.',
      },
      {
        id: 'b', text: 'Identify the one WIG that drives everything else and protect it',
        isCorrect: true,
        explanation: 'Strategy is the art of saying no. One WIG executed beats twelve half-finished goals.',
      },
      {
        id: 'c', text: 'Ask your manager to rank them',
        isCorrect: false,
        explanation: 'Abdicating the prioritisation decision misses the point — you need to own your WIG. Waiting for someone else to decide is a reactive posture.',
      },
      {
        id: 'd', text: 'Delegate 8 and keep 4',
        isCorrect: false,
        explanation: 'Four competing priorities still dilutes focus. The WIG framework exists precisely because even four goals are too many to execute with full force.',
      },
    ],
  },
  {
    id: 'p4-m1-q2',
    scenario: 'Your lag measure (revenue) is behind. You focus all energy on it directly. Your coach says…',
    options: [
      {
        id: 'a', text: 'Good — attack the lag directly',
        isCorrect: false,
        explanation: 'Lag measures are history. Lead measures are where your leverage lives.',
      },
      {
        id: 'b', text: 'Wrong — only lead measures are within your control',
        isCorrect: true,
        explanation: 'Lag measures are history. Lead measures are where your leverage lives.',
      },
      {
        id: 'c', text: 'Add more lag measures to track',
        isCorrect: false,
        explanation: 'More lag metrics doesn\'t create more control. You can only influence lag outcomes by executing lead measures consistently.',
      },
      {
        id: 'd', text: 'Change your WIG entirely',
        isCorrect: false,
        explanation: 'Changing the goal before fixing the lead measure execution is premature. Diagnose the lag first, then decide.',
      },
    ],
  },
  {
    id: 'p4-m1-q3',
    scenario: 'A great opportunity appears — a new product line, a new market. But it\'s outside your WIG. You…',
    options: [
      {
        id: 'a', text: 'Pursue it — great opportunities are rare',
        isCorrect: false,
        explanation: 'Every yes is a no to your WIG. Protect your focus like it\'s your most valuable asset.',
      },
      {
        id: 'b', text: 'Add it to your Q2 plan',
        isCorrect: false,
        explanation: 'Deferring instead of deciding isn\'t strategic — it\'s avoidance. If it genuinely replaces your WIG, update it. If not, decline now.',
      },
      {
        id: 'c', text: 'Say no and stay focused on your WIG',
        isCorrect: true,
        explanation: 'Every yes is a no to your WIG. Protect your focus like it\'s your most valuable asset.',
      },
      {
        id: 'd', text: 'Do both in parallel',
        isCorrect: false,
        explanation: 'Divided focus is one of the most common causes of underperformance in high-potential professionals. Parallel pursuit typically means full delivery on neither.',
      },
    ],
  },
  {
    id: 'p4-m1-q4',
    scenario: 'You haven\'t reviewed your strategic plan in 3 weeks. This week you…',
    options: [
      {
        id: 'a', text: 'Review it on Sunday night before the week starts',
        isCorrect: true,
        explanation: 'Weekly review is the operating system of strategic execution. Without it, plans become wishes.',
      },
      {
        id: 'b', text: 'Review it when things slow down',
        isCorrect: false,
        explanation: 'Things rarely slow down. Waiting for bandwidth to review your plan means the plan never gets reviewed — and never gets executed.',
      },
      {
        id: 'c', text: 'Send it to your manager for accountability',
        isCorrect: false,
        explanation: 'External accountability helps but it doesn\'t replace internal ownership. You need to review your own plan first.',
      },
      {
        id: 'd', text: 'Update it with new targets to stay motivated',
        isCorrect: false,
        explanation: 'Constantly updating targets avoids the harder work of executing on the original ones. Review first — then adjust if the evidence warrants it.',
      },
    ],
  },
  {
    id: 'p4-m1-q5',
    scenario: 'Your lead measure is 20 discovery calls per week. You\'re at 12. You…',
    options: [
      {
        id: 'a', text: 'Lower the target to 15',
        isCorrect: false,
        explanation: 'Lead measures expose the real constraint. Diagnose the gap before changing the target.',
      },
      {
        id: 'b', text: 'Identify the specific behaviour blocking calls 13–20',
        isCorrect: true,
        explanation: 'Lead measures expose the real constraint. Diagnose the gap before changing the target.',
      },
      {
        id: 'c', text: 'Focus on call quality instead of quantity',
        isCorrect: false,
        explanation: 'Switching metrics when you\'re underperforming on one is a common avoidance move. Address the quantity gap first — quality can be refined once volume is consistent.',
      },
      {
        id: 'd', text: 'Add a second lead measure to compensate',
        isCorrect: false,
        explanation: 'Adding measures doesn\'t fix underperformance on the existing one. Identify and remove the blocking behaviour first.',
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
      {p4Course && <NotToDoTool courseId={p4Course.id} />}
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
          title="Strategy — Group Discussion"
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
