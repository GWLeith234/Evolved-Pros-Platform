import {
  THANKS_GEORGE_SIGNOFF,
  THANKS_TEMPLATE_IDS,
  type ThanksCadenceStep,
} from './constants'

export type ThanksEmailVars = {
  first_name: string
  claim_url: string
  george_signoff: string
}

export type ThanksEmailCopy = {
  templateId: string
  subject: string
  preview: string
  paragraphs: string[]
  cta: string
  vars: ThanksEmailVars
}

const FORBIDDEN_PITCH = [
  'vip',
  'pro',
  'professional',
  'upgrade',
  'stripe',
  'mastermind',
  '$49',
  '$249',
  'paid plan',
]

export function thanksFirstName(raw: string | null | undefined): string {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return 'there'
  return trimmed.split(/\s+/)[0] ?? 'there'
}

export function stripPreviewSubjectPrefix(subject: string): string {
  return subject.replace(/^\[PREVIEW[^\]]*\]\s*/i, '').trim()
}

export function buildThanksEmailCopy(
  step: ThanksCadenceStep,
  vars: Partial<ThanksEmailVars> & { claim_url: string },
): ThanksEmailCopy {
  const first = thanksFirstName(vars.first_name)
  const signoff = (vars.george_signoff ?? THANKS_GEORGE_SIGNOFF).trim() || THANKS_GEORGE_SIGNOFF
  const filled: ThanksEmailVars = {
    first_name: first,
    claim_url: vars.claim_url,
    george_signoff: signoff,
  }

  const bodies: Record<ThanksCadenceStep, { subject: string; preview: string; paragraphs: string[] }> = {
    0: {
      subject: "You've been in my corner",
      preview: 'A thank you, and your Community invite.',
      paragraphs: [
        `${first}, thank you. You have been in my corner, and I wanted you here in Community with no card and no catch.`,
        'Claim your free Community access when you are ready. This note is a thank you, not a pitch.',
      ],
    },
    1: {
      subject: 'Foundation: start with the basics',
      preview: 'Start with the basics.',
      paragraphs: [
        `${first}, start with the basics. Foundation is the first of the six pillars.`,
        'Same Community seat. Same thank you. Claim when you are ready.',
      ],
    },
    2: {
      subject: 'Identity: stand for something',
      preview: 'Stand for something people can feel.',
      paragraphs: [
        `${first}, identity is standing for something people can feel.`,
        'Your Community invite is still open.',
      ],
    },
    3: {
      subject: 'Mental Toughness: ritual over mood',
      preview: 'Ritual over mood.',
      paragraphs: [
        `${first}, mental toughness is ritual over mood.`,
        'No new offer. Same Community seat.',
      ],
    },
    4: {
      subject: 'Strategy: decide where attention goes',
      preview: 'Decide where attention goes.',
      paragraphs: [
        `${first}, strategy is deciding where attention goes.`,
        'Your Community invite is still waiting.',
      ],
    },
    5: {
      subject: 'Accountability: pipeline is not a wish list',
      preview: 'A pipeline is not a wish list.',
      paragraphs: [
        `${first}, a pipeline is not a wish list. Accountability keeps the list honest.`,
        'Same thank you. Same Community seat.',
      ],
    },
    6: {
      subject: 'Execution: make the next call better',
      preview: 'Make the next call better.',
      paragraphs: [
        `${first}, execution is making the next call better than the last one.`,
        'Claim when you are ready. No rush.',
      ],
    },
    7: {
      subject: 'How the six pillars fit together',
      preview: 'How the six pillars fit together.',
      paragraphs: [
        `${first}, the six pillars fit together as one way of working.`,
        'Your Community seat is still yours.',
      ],
    },
    8: {
      subject: 'If you want to go deeper',
      preview: 'If you want to go deeper.',
      paragraphs: [
        `${first}, if you want to go deeper, Community is the door.`,
        'No new offer. The invite is still open.',
      ],
    },
    9: {
      subject: 'LIVE and the AI conversation',
      preview: 'LIVE and the AI conversation.',
      paragraphs: [
        `${first}, LIVE is where the AI conversation gets real.`,
        'Your Community invite is still open.',
      ],
    },
    10: {
      subject: 'EVOLVED on Amazon Oct 15',
      preview: 'EVOLVED on Amazon October 15.',
      paragraphs: [
        `${first}, EVOLVED lands on Amazon October 15.`,
        'This is still a thank you, not a pitch. Your Community seat stays open.',
      ],
    },
    11: {
      subject: 'Last note from me on this',
      preview: 'This is the last cadence note I will send.',
      paragraphs: [
        `${first}, this is the last note I will send on this invite.`,
        'Your Community invite stays good until the date on the claim page. I would love to see you inside.',
      ],
    },
  }

  const body = bodies[step]
  return {
    templateId: THANKS_TEMPLATE_IDS[step],
    subject: stripPreviewSubjectPrefix(body.subject),
    preview: body.preview,
    paragraphs: body.paragraphs,
    cta: 'Claim your Community access',
    vars: filled,
  }
}

export function thanksCopyViolations(text: string): string[] {
  const hits: string[] = []
  if (text.includes('\u2014') || text.includes('\u2013')) hits.push('em_or_en_dash')
  const lower = text.toLowerCase()
  for (const word of FORBIDDEN_PITCH) {
    if (lower.includes(word)) hits.push(word)
  }
  return hits
}

export function assertThanksCopyClean(copy: ThanksEmailCopy): string[] {
  const blob = [copy.subject, copy.preview, copy.cta, ...copy.paragraphs, copy.vars.george_signoff].join('\n')
  return thanksCopyViolations(blob)
}
