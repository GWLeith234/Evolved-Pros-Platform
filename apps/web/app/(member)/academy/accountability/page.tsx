export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchUserProfile, fetchCourseByPillarNumber, fetchWIGByDomain } from '@/lib/academy/fetchers'
import { PillarPageShell } from '@/components/academy/PillarPageShell'
import { LiveSessionCard } from '@/components/academy/LiveSessionCard'
import { Scoreboard } from '@/components/academy/Scoreboard'
import { PartnerCheckin } from '@/components/academy/PartnerCheckin'
import { ScenarioMCQ } from '@/components/academy/ScenarioMCQ'
import { PeerDiscussion } from '@/components/academy/PeerDiscussion'
import { Capstone } from '@/components/academy/Capstone'
import { ConceptMatch } from '@/components/academy/ConceptMatch'
import type { ComponentProps } from 'react'

const P5_CONCEPT_PAIRS: ComponentProps<typeof ConceptMatch>['pairs'] = [
  { id: 'wig',        term: 'WIG',                       definition: 'A Wildly Important Goal — the one goal that matters most above all others' },
  { id: 'lag',        term: 'Lag measure',               definition: 'An outcome you can track but can\'t directly control — the result' },
  { id: 'lead',       term: 'Lead measure',              definition: 'A predictive, influenceable behaviour that drives the lag measure' },
  { id: 'scoreboard', term: 'Scoreboard',                definition: 'A visible weekly display of WIG, lag, and lead measure progress' },
  { id: 'cadence',    term: 'Cadence of accountability', definition: 'A brief weekly meeting where team members report on commitments' },
  { id: 'partner',    term: 'Accountability partner',    definition: 'A peer who holds you to your weekly commitments and you theirs' },
]

const P5_MCQ_QUESTIONS: ComponentProps<typeof ScenarioMCQ>['questions'] = [
  {
    id: 'p5-m1-q1',
    scenario: 'Your lag measure is behind after 3 weeks. You should focus on…',
    options: [
      {
        id: 'a', text: 'The lag measure directly — work harder on revenue',
        isCorrect: false,
        explanation: 'Lag measures are history. You can\'t change them. Lead measures are where your leverage is.',
      },
      {
        id: 'b', text: 'Your lead measures — they drive the lag',
        isCorrect: true,
        explanation: 'Lag measures are history. You can\'t change them. Lead measures are where your leverage is.',
      },
      {
        id: 'c', text: 'Changing your WIG to something more achievable',
        isCorrect: false,
        explanation: 'Changing the goal is a last resort after diagnosing execution gaps — not a first response to three weeks of lag.',
      },
      {
        id: 'd', text: 'Your manager — ask for a lower target',
        isCorrect: false,
        explanation: 'Requesting a lower target before examining your lead measure execution avoids the real problem and signals a lack of ownership.',
      },
    ],
  },
  {
    id: 'p5-m1-q2',
    scenario: 'You hit your lead measure targets 3 weeks in a row but the lag is still behind. You…',
    options: [
      {
        id: 'a', text: 'Panic and drop lead measures for direct revenue activity',
        isCorrect: false,
        explanation: 'Lag measures respond slowly. Consistent lead measure execution always moves the lag — give it time.',
      },
      {
        id: 'b', text: 'Trust the process — lag lags',
        isCorrect: true,
        explanation: 'Lag measures respond slowly. Consistent lead measure execution always moves the lag — give it time.',
      },
      {
        id: 'c', text: 'Add more lead measures to accelerate results',
        isCorrect: false,
        explanation: 'Adding measures doesn\'t accelerate results — it dilutes focus. Stay locked on the two lead measures you\'re already executing.',
      },
      {
        id: 'd', text: 'Reduce your lead measure targets to reduce pressure',
        isCorrect: false,
        explanation: 'You\'re hitting your targets — that\'s exactly when you should hold the line, not retreat.',
      },
    ],
  },
  {
    id: 'p5-m1-q3',
    scenario: 'You haven\'t updated your scoreboard in 2 weeks. You…',
    options: [
      {
        id: 'a', text: 'Catch up all at once and backfill both weeks',
        isCorrect: false,
        explanation: 'Backfilling without a fixed routine just delays the same problem. The real fix is a committed weekly cadence, not a one-off catch-up.',
      },
      {
        id: 'b', text: 'Wait for things to settle before resuming',
        isCorrect: false,
        explanation: 'Things rarely settle. Waiting for the right moment is how scoreboards die.',
      },
      {
        id: 'c', text: 'Update it now and lock in a fixed weekly review time',
        isCorrect: true,
        explanation: 'The scoreboard only works if you update it. A fixed weekly cadence — not motivation — is what drives accountability.',
      },
      {
        id: 'd', text: 'Start a fresh scoreboard with this week as week 1',
        isCorrect: false,
        explanation: 'Starting over erases context and reinforces the habit of abandoning systems under pressure. Fix the cadence, not the scoreboard.',
      },
    ],
  },
  {
    id: 'p5-m1-q4',
    scenario: 'Your accountability partner keeps giving you a pass when you miss your lead targets. You…',
    options: [
      {
        id: 'a', text: 'Appreciate the support and keep them as your partner',
        isCorrect: false,
        explanation: 'An accountability partner who never challenges you isn\'t holding you accountable — they\'re enabling you. Name the pattern and raise the standard together.',
      },
      {
        id: 'b', text: 'Have a direct conversation about raising the standard',
        isCorrect: true,
        explanation: 'An accountability partner who never challenges you isn\'t holding you accountable — they\'re enabling you. Name the pattern and raise the standard together.',
      },
      {
        id: 'c', text: 'Replace them immediately with someone stricter',
        isCorrect: false,
        explanation: 'Replacing them before having the conversation misses a development opportunity for both of you, and creates a habit of exiting relationships when they get hard.',
      },
      {
        id: 'd', text: 'Stop sharing your numbers to avoid the awkwardness',
        isCorrect: false,
        explanation: 'Withdrawing from accountability when it gets uncomfortable is the opposite of what accountability is for.',
      },
    ],
  },
  {
    id: 'p5-m1-q5',
    scenario: 'You\'ve hit your lead measure targets 4 weeks in a row. You…',
    options: [
      {
        id: 'a', text: 'Take the week off — you\'ve earned it',
        isCorrect: false,
        explanation: 'Consistency is the habit you\'re building — breaking it at the first milestone undermines the streak that\'s driving results.',
      },
      {
        id: 'b', text: 'Raise the targets immediately to stay challenged',
        isCorrect: false,
        explanation: 'Raising targets immediately risks disrupting a rhythm that\'s working. Acknowledge the win first, then evaluate calibration.',
      },
      {
        id: 'c', text: 'Acknowledge the win, then evaluate whether targets need to increase',
        isCorrect: true,
        explanation: 'Consistent lead measure execution is the signal to evaluate: are your targets still ambitious enough? Acknowledge the habit first, then calibrate.',
      },
      {
        id: 'd', text: 'Focus entirely on the lag measure now that leads are sorted',
        isCorrect: false,
        explanation: 'Shifting focus from leads to lag is the trap. The leads are driving the lag — keep executing them.',
      },
    ],
  },
]

export default async function Page() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, p5Course, wigRow] = await Promise.all([
    fetchUserProfile(supabase, user.id),
    fetchCourseByPillarNumber(supabase, 5),
    fetchWIGByDomain(supabase, user.id, 'professional'),
  ])

  const memberName   = profile?.full_name ?? profile?.display_name ?? null
  const wigContent   = wigRow?.content as { statement?: string } | null
  const wigStatement = wigContent?.statement ?? undefined

  return (
    <PillarPageShell pillarNumber={5} showReflection showAudit>
      <LiveSessionCard pillarId="accountability" pillarNumber={5} />
      {p5Course && (
        <Scoreboard
          courseId={p5Course.id}
          initialWigStatement={wigStatement}
        />
      )}
      {p5Course && (
        <PartnerCheckin
          courseId={p5Course.id}
          currentUserId={user.id}
        />
      )}
      {p5Course && (
        <ConceptMatch
          courseId={p5Course.id}
          pairs={P5_CONCEPT_PAIRS}
          title="Accountability Concepts"
        />
      )}
      {p5Course && (
        <ScenarioMCQ
          courseId={p5Course.id}
          moduleNumber={1}
          questions={P5_MCQ_QUESTIONS}
        />
      )}
      {p5Course && (
        <PeerDiscussion
          courseId={p5Course.id}
          moduleNumber={1}
          title="Accountability — Group Discussion"
        />
      )}
      {p5Course && (
        <Capstone
          courseId={p5Course.id}
          pillarNumber={5}
          memberName={memberName}
        />
      )}
    </PillarPageShell>
  )
}
