export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchUserProfile, fetchCourseByPillarNumber } from '@/lib/academy/fetchers'
import { PillarPageShell } from '@/components/academy/PillarPageShell'
import { LiveSessionCard } from '@/components/academy/LiveSessionCard'
import { MentalToughnessDiagnostic } from '@/components/academy/MentalToughnessDiagnostic'
import { CommitmentTracker } from '@/components/academy/CommitmentTracker'
import { HierarchySort } from '@/components/academy/HierarchySort'
import { PeerDiscussion } from '@/components/academy/PeerDiscussion'
import { ScenarioMCQ } from '@/components/academy/ScenarioMCQ'
import { Capstone } from '@/components/academy/Capstone'
import type { ComponentProps } from 'react'

function getCurrentMonday(): string {
  const now = new Date()
  const day = now.getDay() // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  return monday.toISOString().split('T')[0]
}

const P3_COMFORT_ZONE_ITEMS = [
  { id: 'fear-rejection',  label: 'Fear of rejection',          description: 'Avoiding calls or conversations to escape no' },
  { id: 'need-approval',  label: 'Need for approval',          description: "Letting the client's mood dictate your confidence" },
  { id: 'comfort-routine',label: 'Comfort routine',            description: 'Doing easy tasks instead of high-value activity' },
  { id: 'comparison',     label: 'Comparing yourself to others',description: 'Measuring your worth against leaderboard rankings' },
  { id: 'past-losses',    label: 'Dwelling on past losses',     description: "Letting yesterday's missed deal affect today's energy" },
]

const P3_MCQ_QUESTIONS: ComponentProps<typeof ScenarioMCQ>['questions'] = [
  {
    id: 'p3-m1-q1',
    scenario: 'You\'ve had 8 rejections in a row. Your next call is in 5 minutes. You…',
    options: [
      {
        id: 'a', text: 'Push through and dial with full energy',
        isCorrect: true,
        explanation: 'Mental toughness isn\'t the absence of doubt — it\'s dialling anyway. Momentum is built by action, not by waiting to feel ready.',
      },
      {
        id: 'b', text: 'Take the rest of the day off to reset',
        isCorrect: false,
        explanation: 'Rest has its place, but avoidance dressed as recovery isn\'t rest. Stepping away from the discomfort reinforces the fear rather than breaking through it.',
      },
      {
        id: 'c', text: 'Send emails instead to avoid more rejection',
        isCorrect: false,
        explanation: 'Switching to a lower-risk activity to sidestep rejection is avoidance. It compounds the problem by rewarding the fear response.',
      },
      {
        id: 'd', text: 'Tell your manager you need a lighter week',
        isCorrect: false,
        explanation: 'Externalising your resilience problem doesn\'t solve it. The ask signals a lack of self-management at the moment it matters most.',
      },
    ],
  },
  {
    id: 'p3-m1-q2',
    scenario: 'Your manager gives you critical feedback about your performance in front of the team. You…',
    options: [
      {
        id: 'a', text: 'Defend yourself immediately to protect your reputation',
        isCorrect: false,
        explanation: 'Public defensiveness rarely helps your reputation — it signals fragility. It also shuts down feedback loops you need to grow.',
      },
      {
        id: 'b', text: 'Stay silent, absorb it, then address it privately with your manager',
        isCorrect: true,
        explanation: 'Staying composed in the moment and handling it privately shows emotional maturity. You preserve relationships, gather full context, and respond from strength rather than ego.',
      },
      {
        id: 'c', text: 'Dismiss the feedback as unfair and move on',
        isCorrect: false,
        explanation: 'Dismissing feedback you dislike is a blind spot in development. Even poorly delivered feedback often contains a grain of truth worth examining.',
      },
      {
        id: 'd', text: 'Agree with everything to avoid conflict',
        isCorrect: false,
        explanation: 'Blanket agreement without reflection is as unhelpful as defensiveness. It avoids the discomfort without producing any growth or clarity.',
      },
    ],
  },
  {
    id: 'p3-m1-q3',
    scenario: 'You lose your biggest account to a competitor after 18 months. You…',
    options: [
      {
        id: 'a', text: 'Write it off and move to the next opportunity immediately',
        isCorrect: false,
        explanation: 'Moving on without learning anything is a missed development opportunity. Large losses contain valuable intelligence about your process, relationship, and positioning.',
      },
      {
        id: 'b', text: 'Conduct a thorough post-mortem, extract the lessons, then channel that energy into the next target',
        isCorrect: true,
        explanation: 'The battle-tested approach: feel it fully, extract every lesson, then redirect the energy forward. Losses processed this way compound into future wins.',
      },
      {
        id: 'c', text: 'Blame the competitor\'s pricing and note it for your manager',
        isCorrect: false,
        explanation: 'Externalising loss without examining your own contribution prevents growth. Competitors always exist — the question is what you can control.',
      },
      {
        id: 'd', text: 'Take extended time off to process before returning to full activity',
        isCorrect: false,
        explanation: 'Grief is valid, but extended withdrawal from activity amplifies the loss. The fastest recovery happens through purposeful action, not waiting.',
      },
    ],
  },
  {
    id: 'p3-m1-q4',
    scenario: 'A competitor undercuts your pricing by 30% in a deal you\'ve been working for 3 months. You…',
    options: [
      {
        id: 'a', text: 'Match their price to save the deal at any cost',
        isCorrect: false,
        explanation: 'Racing to the bottom on price destroys margin, sets a precedent, and signals that your value proposition isn\'t strong enough to stand on its own.',
      },
      {
        id: 'b', text: 'Panic and go back to your manager asking for a bigger discount',
        isCorrect: false,
        explanation: 'Reacting with panic shows the pressure got to you. It also weakens your position and may trigger a discount the client didn\'t even ask for.',
      },
      {
        id: 'c', text: 'Reframe the conversation around total value, risk, and relationship — not price',
        isCorrect: true,
        explanation: 'Staying composed and anchoring to value rather than reacting to price is the mentally tough move. It forces a real conversation about what matters, not a race to the lowest number.',
      },
      {
        id: 'd', text: 'Walk away — if they\'re buying on price alone, they\'re not your client',
        isCorrect: false,
        explanation: 'Walking away without exploring the real concern gives up too early. Most price objections are really risk or value concerns in disguise.',
      },
    ],
  },
  {
    id: 'p3-m1-q5',
    scenario: 'A prospect goes dark after giving you a verbal commitment to sign. You…',
    options: [
      {
        id: 'a', text: 'Send one polite follow-up, then close the file',
        isCorrect: false,
        explanation: 'One follow-up after a verbal commitment is insufficient. The prospect hasn\'t said no — they\'ve gone quiet. That requires a different, more direct response.',
      },
      {
        id: 'b', text: 'Assume something changed and start pitching them from scratch',
        isCorrect: false,
        explanation: 'Rewinding to the start without understanding the silence wastes the progress you\'ve made and can feel patronising to the prospect.',
      },
      {
        id: 'c', text: 'Call directly and say: "You mentioned you were ready to move — has something changed I should know about?"',
        isCorrect: true,
        explanation: 'Direct, respectful, and grounded. This response holds the commitment without pressure, opens the door for honest conversation, and demonstrates the confident identity of a seasoned professional.',
      },
      {
        id: 'd', text: 'Contact their manager to escalate the issue',
        isCorrect: false,
        explanation: 'Going over someone\'s head without attempting direct communication first damages trust and burns the relationship. It\'s a last resort, not a first response.',
      },
    ],
  },
]

export default async function Page() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, p3Course] = await Promise.all([
    fetchUserProfile(supabase, user.id),
    fetchCourseByPillarNumber(supabase, 3),
  ])

  const memberName = profile?.full_name ?? profile?.display_name ?? null
  const currentMonday = getCurrentMonday()

  return (
    <PillarPageShell pillarNumber={3} showReflection showAudit>
      <LiveSessionCard pillarId="mental-toughness" pillarNumber={3} />
      {p3Course && (
        <CommitmentTracker courseId={p3Course.id} weekStart={currentMonday} />
      )}
      <HierarchySort
        title="What's keeping you in your comfort zone?"
        items={P3_COMFORT_ZONE_ITEMS}
        saveKey="p3-comfort-zone-sort"
      />
      {p3Course && <MentalToughnessDiagnostic courseId={p3Course.id} />}
      {p3Course && (
        <ScenarioMCQ
          courseId={p3Course.id}
          moduleNumber={1}
          questions={P3_MCQ_QUESTIONS}
        />
      )}
      {p3Course && (
        <PeerDiscussion
          courseId={p3Course.id}
          moduleNumber={1}
          title="Mental Toughness — Group Discussion"
        />
      )}
      {p3Course && (
        <Capstone
          courseId={p3Course.id}
          pillarNumber={3}
          memberName={memberName}
        />
      )}
    </PillarPageShell>
  )
}
