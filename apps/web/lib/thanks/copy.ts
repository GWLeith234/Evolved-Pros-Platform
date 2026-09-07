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
    d0: {
      subject: 'A thank you from George, and your Community invite',
      preview: 'Your free Community seat is ready.',
      paragraphs: [
        `${first}, thank you. I wanted you here, in Community, with no card and no catch.`,
        'Claim your free Community access when you are ready. This note is a thank you, not a pitch.',
      ],
    },
    d7: {
      subject: 'Still holding your Community spot',
      preview: 'Your Community invite is still open.',
      paragraphs: [
        `${first}, your Community invite is still open. Tap the link when you are ready.`,
        'No new offer. Same thank you. Same Community seat.',
      ],
    },
    d14: {
      subject: 'Your Community invite is still open',
      preview: 'Still holding your Community seat.',
      paragraphs: [
        `${first}, just a note that your Community seat is waiting.`,
        'No rush, and no pitch. The invite is still yours.',
      ],
    },
    d28: {
      subject: 'Last note on your Community invite',
      preview: 'This is the last cadence note I will send.',
      paragraphs: [
        `${first}, this is the last note I will send.`,
        'Your Community invite stays good until the date on the claim page. I would love to see you inside.',
      ],
    },
  }

  const body = bodies[step]
  return {
    templateId: THANKS_TEMPLATE_IDS[step],
    subject: body.subject,
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
