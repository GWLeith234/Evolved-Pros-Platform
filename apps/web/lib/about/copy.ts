/**
 * Public /about copy.
 *
 * Source of truth: the About COPY-FRAME. Sentences below are that frame,
 * sentence-cased when a line stands alone as a heading. No metrics, prices,
 * rival-entity names, keynote sell, or em dashes.
 *
 * Join free matches the home primary door (JOIN_FREE_HREF). Footer Join free
 * stays /pricing and is not reused here.
 */

import { BOOK_PREORDER_PATH } from '@/lib/book/preorder'
import {
  HOME_JOIN_FREE,
  HOME_NAV_LINKS,
  HOME_OPEN_PLATFORM,
  HOME_OPEN_PLATFORM_HREF,
  HOME_SECONDARY_CTA,
  HOME_SIGN_IN,
  JOIN_FREE_HREF,
  SEE_PRICING_HREF,
} from '@/lib/home/conversion'

export const ABOUT_PATH = '/about' as const

export const ABOUT_TITLE = 'About | Evolved Pros'
export const ABOUT_DESCRIPTION =
  'Evolved Pros is the daily operating system for sales professionals. Free Community first. George Leith built it as the container he never had.'

export const ABOUT_H1 = 'The daily operating system for sales professionals.'

export const ABOUT_JOIN_LABEL = HOME_JOIN_FREE
export const ABOUT_JOIN_HREF = JOIN_FREE_HREF
export const ABOUT_PRICING_LABEL = HOME_SECONDARY_CTA
export const ABOUT_PRICING_HREF = SEE_PRICING_HREF
export const ABOUT_OPEN_LABEL = HOME_OPEN_PLATFORM
export const ABOUT_OPEN_HREF = HOME_OPEN_PLATFORM_HREF
export const ABOUT_SIGN_IN_LABEL = HOME_SIGN_IN
export const ABOUT_SIGN_IN_HREF = '/login' as const

export { HOME_NAV_LINKS }

/** First-person mission. The byline is George because the lines are his. */
export const ABOUT_WHY_KICKER = 'Why it exists'
export const ABOUT_BYLINE = 'George Leith'
export const ABOUT_ROLE = 'Founder'

export const ABOUT_MISSION = [
  'I built Evolved Pros because I spent a career in rooms where the craft was real and the container was missing.',
  'Sales has podcasts. It has books. It has stages. What it rarely has is a place you keep showing up: craft, accountability, and a system you can run on a Tuesday when the month is ugly.',
  'Evolved Pros is that container. Free Community first. Media and the Podcast open. LIVE when the room is live. Academy when you are ready to pay for the curriculum. Fit & Health as a beta for the body that has to carry the work. A book that names the transition.',
  'This is not a content feed with a login. It is a daily operating system for people who sell for a living and refuse to treat the job like a vibe.',
] as const

export const ABOUT_WHAT_KICKER = 'What Evolved Pros is'
export const ABOUT_WHAT_TITLE = 'A place you keep showing up.'
export const ABOUT_WHAT = [
  'Evolved Pros is a platform for sales professionals. It is not a podcast alone.',
  'You get a free Community, Evolved Pros Media, the Evolved Pros Podcast, LIVE sessions, and an Academy. George Leith built it as the container he never had. Members start free. You upgrade when the Academy (or the mastermind seat) is the next honest step.',
  'Everything but the curriculum is designed to be open.',
] as const

/** Negations already stated in the frame. The kicker carries "Not". */
export const ABOUT_NOTS = [
  { kicker: 'Not', title: 'A podcast alone' },
  { kicker: 'Not', title: 'A content feed with a login' },
] as const

export const ABOUT_ARCH_KICKER = 'The Evolved Architecture'
export const ABOUT_ARCH_TITLE = 'Evolved Pros is that container.'

export interface AboutSurface {
  n: string
  title: string
  body: string
  href: string
  link: string
  beta?: true
}

export const ABOUT_SURFACES: readonly AboutSurface[] = [
  {
    n: '01',
    title: 'Book',
    body: 'EVOLVED names the transition: leave the old game on purpose and run a system. On Amazon Oct 15.',
    href: BOOK_PREORDER_PATH,
    link: 'Pre-order',
  },
  {
    n: '02',
    title: 'Podcast',
    body: 'Long conversations with operators who still do the work. Listen, then bring the argument into Community.',
    href: '/podcast',
    link: 'Listen',
  },
  {
    n: '03',
    title: 'Platform',
    body: 'The home base: Community, Media, profile, habits, and the room you return to.',
    href: ABOUT_JOIN_HREF,
    link: ABOUT_JOIN_LABEL,
  },
  {
    n: '04',
    title: 'Academy',
    body: 'Paid curriculum on the six craft pillars (Foundation, Identity, Mental Toughness, Strategy, Accountability, Execution).',
    href: '/media/academy',
    link: 'See the Academy pillars',
  },
  {
    n: '05',
    title: 'Fit & Health',
    body: 'Beta. Training and recovery for the body that carries a sales career.',
    href: '/fit',
    link: 'See Fit',
    beta: true,
  },
  {
    n: '06',
    title: 'LIVE',
    body: 'Live rooms and sessions when the calendar says the room is open.',
    href: '/live',
    link: 'See LIVE',
  },
]

export const ABOUT_GEORGE_KICKER = 'Who George is'
export const ABOUT_GEORGE_NAME = 'George Leith'
export const ABOUT_GEORGE = [
  'George Leith is a sales operator who built Evolved Pros after decades in media, channel, and revenue leadership. He hosts the Evolved Pros Podcast, writes for Evolved Pros Media, and runs the Architecture in public so members can steal what works and ignore the theater.',
  'He is not selling a guru personality. He is selling a place to practice.',
] as const

export const ABOUT_GEORGE_LINKS = [
  { label: 'The Podcast', href: '/podcast' },
  { label: 'The book', href: BOOK_PREORDER_PATH },
] as const

/** George picks the final photo. Alternative: /live/george-cloud-broker.jpg */
export const ABOUT_PORTRAIT_SRC = '/live/george-interview.jpg'

export const ABOUT_WHO_KICKER = 'Who it is for'
export const ABOUT_WHO_TITLE =
  'People who sell for a living and refuse to treat the job like a vibe.'
export const ABOUT_WHO_FOR_LABEL = 'Who'
export const ABOUT_WHO_FOR = 'Sales professionals who want a system, not a pep talk.'
export const ABOUT_WHO_NOT_LABEL = 'Not for'
export const ABOUT_WHO_NOT = 'This is not a content feed with a login.'

export const ABOUT_START_KICKER = 'How you start'
export const ABOUT_STEPS = [
  {
    n: '01',
    title: 'Join free.',
    body: 'Community. Podcast, Media, LIVE access as designed on the platform. No card required for the free step.',
  },
  {
    n: '02',
    title: 'Upgrade when the Academy is the next step.',
    body: 'Curriculum and Fit library live on the paid path. See pricing on the platform if you need numbers.',
  },
  {
    n: '03',
    title: 'Mastermind seats when you want the deal pressure-tested.',
    body: 'Limited seats. See live pricing on platform.',
  },
] as const

export const ABOUT_START_TITLE = `${ABOUT_STEPS[0].title} ${ABOUT_STEPS[1].title}`

export const ABOUT_CLOSE_TITLE = 'Start free. Keep showing up.'
export const ABOUT_CLOSE_BODY =
  'Join the Evolved Pros Community. Bring a real problem from your week. Listen to an episode. Read a Media story. Come back tomorrow.'

export const ABOUT_HERO_KICKER = 'About'

export function aboutCopyStrings(): string[] {
  return [
    ABOUT_TITLE,
    ABOUT_DESCRIPTION,
    ABOUT_H1,
    ABOUT_JOIN_LABEL,
    ABOUT_PRICING_LABEL,
    ABOUT_OPEN_LABEL,
    ABOUT_SIGN_IN_LABEL,
    ABOUT_WHY_KICKER,
    ABOUT_BYLINE,
    ABOUT_ROLE,
    ...ABOUT_MISSION,
    ABOUT_WHAT_KICKER,
    ABOUT_WHAT_TITLE,
    ...ABOUT_WHAT,
    ...ABOUT_NOTS.flatMap(item => [item.kicker, item.title]),
    ABOUT_ARCH_KICKER,
    ABOUT_ARCH_TITLE,
    ...ABOUT_SURFACES.flatMap(item => [item.n, item.title, item.body, item.link, item.beta ? 'Beta' : '']),
    ABOUT_GEORGE_KICKER,
    ABOUT_GEORGE_NAME,
    ...ABOUT_GEORGE,
    ...ABOUT_GEORGE_LINKS.map(item => item.label),
    ABOUT_WHO_KICKER,
    ABOUT_WHO_TITLE,
    ABOUT_WHO_FOR_LABEL,
    ABOUT_WHO_FOR,
    ABOUT_WHO_NOT_LABEL,
    ABOUT_WHO_NOT,
    ABOUT_START_KICKER,
    ABOUT_START_TITLE,
    ...ABOUT_STEPS.flatMap(step => [step.n, step.title, step.body]),
    ABOUT_CLOSE_TITLE,
    ABOUT_CLOSE_BODY,
    ABOUT_HERO_KICKER,
    ...HOME_NAV_LINKS.map(link => link.label),
  ]
}
