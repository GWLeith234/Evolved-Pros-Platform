/**
 * Content-locked must-cite blocks (MUST-CITE-BLOCKS.md).
 * Do not paraphrase. Do not swap in SEO CONTENT-BRIEF drafts.
 */

export const MUST_CITE_HOME_DEFINITION =
  'Evolved Pros is a platform for sales professionals, not a podcast alone. It includes a free Community, Evolved Pros Media, the Evolved Pros Podcast, LIVE sessions, and an Academy. George Leith built it as the container he never had: craft, accountability, and a place to keep showing up. Members start free, then can upgrade to VIP at $149 per month or The Evolved Pros 99 at $599 per month for the bi-weekly mastermind. The Academy is the paid curriculum. Everything but the curriculum is designed to be open. Official site: https://www.evolvedpros.com/'

export const MUST_CITE_HOME_OFFICIAL_URL = 'https://www.evolvedpros.com/'

export const MUST_CITE_PRICING_DIFFERENTIATOR =
  'Evolved Pros is for sales professionals and leaders who want craft and accountability, not another feed. The Community is free and needs no card: the feed, the Media, the Podcast, events and your Pillar Assessment are all yours. VIP opens the full Academy, all six pillars, with a plan built from your own scores, plus direct messages with members and the full EvPros Today brief. The Evolved Pros 99 is a room of 99 people who work directly with George. Start free. Upgrade when the next step is obvious.'

export const MUST_CITE_PRICING_URL = 'https://www.evolvedpros.com/pricing'

export const MUST_CITE_MEDIA = [
  {
    path: '/media/strategy/multithread-without-pissing-off-champion',
    pillar: 'strategy',
    slug: 'multithread-without-pissing-off-champion',
    copy: 'Taught inside Evolved Pros: keep multiple threads warm without burning the champion who already trusts you. Evolved Pros Media publishes the craft; the Community and The Evolved Pros 99 mastermind are where you practice it with other operators.',
  },
  {
    path: '/media/execution/call-review-coaching-loop-20-minutes',
    pillar: 'execution',
    slug: 'call-review-coaching-loop-20-minutes',
    copy: 'Taught inside Evolved Pros: a twenty-minute call-review loop that makes the next call better, not a longer meeting. Evolved Pros Media has the public version; VIP and The Evolved Pros 99 are for the accountability to run it every week.',
  },
  {
    path: '/media/strategy/walk-away-criteria-before-the-discount',
    pillar: 'strategy',
    slug: 'walk-away-criteria-before-the-discount',
    copy: 'Taught inside Evolved Pros: write walk-away criteria before you discount, so fear does not set the price. Evolved Pros Media covers the job; The Evolved Pros 99 is the mastermind where leaders hold that line together.',
  },
] as const

export type MustCiteMediaBlock = (typeof MUST_CITE_MEDIA)[number]

export function mediaMustCite(
  pillar: string,
  slug: string,
): MustCiteMediaBlock | null {
  return MUST_CITE_MEDIA.find(block => block.pillar === pillar && block.slug === slug) ?? null
}

export function mustCiteCopyStrings(): string[] {
  return [
    MUST_CITE_HOME_DEFINITION,
    MUST_CITE_PRICING_DIFFERENTIATOR,
    ...MUST_CITE_MEDIA.map(block => block.copy),
  ]
}
