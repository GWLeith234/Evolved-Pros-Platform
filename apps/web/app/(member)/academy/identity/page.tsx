export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchUserProfile, fetchCourseByPillarNumber } from '@/lib/academy/fetchers'
import { PillarPageShell } from '@/components/academy/PillarPageShell'
import { LiveSessionCard } from '@/components/academy/LiveSessionCard'
import { PioneerDriverAssessment } from '@/components/academy/PioneerDriverAssessment'
import { HonestLedger } from '@/components/academy/HonestLedger'
import { ScenarioMCQ } from '@/components/academy/ScenarioMCQ'
import type { ComponentProps } from 'react'

const P2_MODULE1_QUESTIONS: ComponentProps<typeof ScenarioMCQ>['questions'] = [
  {
    id: 'p2-m1-q1',
    scenario: 'A prospect ghosts you after a great first meeting. You…',
    options: [
      {
        id: 'a', text: 'Follow up once, then move on',
        isCorrect: false,
        explanation: 'One follow-up is too passive. Without a clear reason for the silence, you\'re leaving a real opportunity on the table.',
      },
      {
        id: 'b', text: 'Send a value-add resource and ask a direct question',
        isCorrect: true,
        explanation: 'Combining genuine value with a specific, low-friction question re-opens the conversation without pressure. It positions you as resourceful and intentional.',
      },
      {
        id: 'c', text: 'Call them every day until they respond',
        isCorrect: false,
        explanation: 'Repeated contact without new value signals desperation, not drive. It damages the relationship before it begins.',
      },
      {
        id: 'd', text: 'Assume they\'re not interested and close the file',
        isCorrect: false,
        explanation: 'Ghosts are rarely definitive nos — they\'re usually timing, priorities, or distraction. Closing the file too early means giving up on deals that could still close.',
      },
    ],
  },
  {
    id: 'p2-m1-q2',
    scenario: 'You\'re in a discovery call and the prospect keeps steering the conversation off-topic. You…',
    options: [
      {
        id: 'a', text: 'Let them talk — rapport is more important than the agenda',
        isCorrect: false,
        explanation: 'Rapport matters, but an unstructured call rarely ends in a clear next step. Your time and theirs is finite.',
      },
      {
        id: 'b', text: 'Redirect firmly: "I want to make sure we cover what matters most to you — can I ask a couple of specific questions?"',
        isCorrect: true,
        explanation: 'This is professional control — you\'re serving the prospect by keeping the call productive while honouring their autonomy. Strong identity means steering, not drifting.',
      },
      {
        id: 'c', text: 'End the call early since they\'re not taking it seriously',
        isCorrect: false,
        explanation: 'Ending early misreads the situation. The prospect may simply be processing out loud. Cutting it short burns the relationship unnecessarily.',
      },
      {
        id: 'd', text: 'Stay silent and follow wherever the conversation leads',
        isCorrect: false,
        explanation: 'Passivity in a sales call signals low confidence and lack of expertise. The best salespeople guide conversations with authority.',
      },
    ],
  },
  {
    id: 'p2-m1-q3',
    scenario: 'A colleague tells you that you come across as "too intense" with prospects. You…',
    options: [
      {
        id: 'a', text: 'Dismiss it — your style has always worked for you',
        isCorrect: false,
        explanation: 'Dismissing feedback without reflection is a self-awareness gap. Identity development requires willingness to examine blind spots.',
      },
      {
        id: 'b', text: 'Immediately change your entire approach to be more laid-back',
        isCorrect: false,
        explanation: 'Wholesale change without investigation leads to inauthenticity. The goal is refinement, not reinvention.',
      },
      {
        id: 'c', text: 'Ask a trusted client or prospect for honest feedback to understand how you\'re being received',
        isCorrect: true,
        explanation: 'Seeking direct feedback from the source is professional self-awareness in action. It gives you real data to calibrate — not assumptions from one colleague.',
      },
      {
        id: 'd', text: 'Internalise it as confirmation that you\'re doing something wrong',
        isCorrect: false,
        explanation: 'One piece of feedback doesn\'t define you. Internalising it without context creates unhelpful self-doubt rather than useful insight.',
      },
    ],
  },
  {
    id: 'p2-m1-q4',
    scenario: 'You\'re under pressure to hit a quarterly target and are tempted to oversell a product\'s capabilities to close a deal. You…',
    options: [
      {
        id: 'a', text: 'Do it — everyone exaggerates a little in sales',
        isCorrect: false,
        explanation: 'Rationalising dishonesty erodes your professional identity over time. What you tolerate becomes who you are.',
      },
      {
        id: 'b', text: 'Close the deal and fix the expectation problem later',
        isCorrect: false,
        explanation: 'Deferred honesty is still dishonesty. You\'re also setting yourself up for a damaged client relationship, churn, and reputation risk.',
      },
      {
        id: 'c', text: 'Be transparent about limitations and focus on the genuine fit',
        isCorrect: true,
        explanation: 'Selling authentically — even when it costs you a deal — is the foundation of a long-term career. Clients who buy on truth stay longer and refer others.',
      },
      {
        id: 'd', text: 'Walk away from the deal entirely rather than risk it',
        isCorrect: false,
        explanation: 'Walking away isn\'t necessary if you can position honestly. There\'s often a version of the truth that still serves the client and closes the deal.',
      },
    ],
  },
  {
    id: 'p2-m1-q5',
    scenario: 'You\'re presenting to a senior executive who challenges your credibility early in the meeting. You…',
    options: [
      {
        id: 'a', text: 'Apologise and try to lower the stakes of the meeting',
        isCorrect: false,
        explanation: 'Apologising under pressure signals low confidence and confirms their challenge. Executives respect poise, not appeasement.',
      },
      {
        id: 'b', text: 'Get defensive and point out your experience and track record',
        isCorrect: false,
        explanation: 'Defensiveness under pressure is an identity tell. It shows the challenge landed — which invites more of it.',
      },
      {
        id: 'c', text: 'Acknowledge the challenge, then demonstrate your value through how you think — not just what you know',
        isCorrect: true,
        explanation: 'Staying calm under pressure and leading with thinking shows a grounded identity. Executives challenge to test character — composure is the credential.',
      },
      {
        id: 'd', text: 'Change your entire approach mid-presentation to match what you think they want',
        isCorrect: false,
        explanation: 'Mid-meeting pivots that abandon your positioning signal inauthenticity. Adapt your communication style, not your professional identity.',
      },
    ],
  },
]

export default async function Page() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [, p2Course] = await Promise.all([
    fetchUserProfile(supabase, user.id),
    fetchCourseByPillarNumber(supabase, 2),
  ])

  return (
    <PillarPageShell pillarNumber={2} showReflection showAudit>
      <LiveSessionCard pillarId="identity" pillarNumber={2} />
      <PioneerDriverAssessment />
      {p2Course && (
        <HonestLedger courseId={p2Course.id} />
      )}
      {p2Course && (
        <ScenarioMCQ
          courseId={p2Course.id}
          moduleNumber={1}
          questions={P2_MODULE1_QUESTIONS}
        />
      )}
    </PillarPageShell>
  )
}
