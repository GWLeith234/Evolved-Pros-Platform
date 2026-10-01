import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { EM_DASH, hasEmDash } from '@/lib/home/conversion'
import { TIER_DISPLAY_NAMES, TIERS } from '@/lib/pricing'
import {
  MUST_CITE_HOME_DEFINITION,
  MUST_CITE_HOME_OFFICIAL_URL,
  MUST_CITE_MEDIA,
  MUST_CITE_PRICING_DIFFERENTIATOR,
  MUST_CITE_PRICING_URL,
  mediaMustCite,
  mustCiteCopyStrings,
} from './mustCite'

const here = dirname(fileURLToPath(import.meta.url))

describe('must-cite locked copy', () => {
  it('locks A in first person, with tier prices from TIERS, not the daily-OS draft', () => {
    expect(MUST_CITE_HOME_DEFINITION).toBe(
      `I built Evolved Pros for sales professionals. It is a platform, not a podcast alone. It includes a free Community, Evolved Pros Media, the Evolved Pros Podcast, LIVE sessions, and an Academy. I wanted the container I never had: craft, accountability, and a place to keep showing up. You start free, then you can step up to VIP at $${TIERS.vip.monthly} per month or ${TIER_DISPLAY_NAMES.professional} at $${TIERS.professional.monthly} per month for the bi-weekly mastermind. The Academy is the paid curriculum. Everything but the curriculum is open. Official site: ${MUST_CITE_HOME_OFFICIAL_URL}`,
    )
    expect(MUST_CITE_HOME_DEFINITION).toContain(MUST_CITE_HOME_OFFICIAL_URL)
    expect(MUST_CITE_HOME_DEFINITION).toContain('I built Evolved Pros')
    expect(MUST_CITE_HOME_DEFINITION).not.toMatch(/daily operating system/)
    expect(MUST_CITE_HOME_DEFINITION).not.toContain('/join')
    expect(MUST_CITE_HOME_DEFINITION).not.toContain('Pavilion')
  })

  it('locks B in first person, without Pavilion, RevOps, or a raw pricing URL', () => {
    expect(MUST_CITE_PRICING_DIFFERENTIATOR).toBe(
      'I built Evolved Pros for individual sales professionals and leaders who want accountability and craft, not another feed. It is not a podcast-only brand. The Community is free and needs no card. VIP and The Evolved Pros 99 are optional. The Evolved Pros 99 includes the bi-weekly mastermind. Public Evolved Pros Media already covers jobs like multithreading without losing your champion, twenty-minute call-review loops, and walk-away criteria before discounting.',
    )
    expect(MUST_CITE_PRICING_DIFFERENTIATOR).not.toContain('Pavilion')
    expect(MUST_CITE_PRICING_DIFFERENTIATOR).not.toContain('RevOps')
    expect(MUST_CITE_PRICING_DIFFERENTIATOR).not.toContain('Upgrade path')
    expect(MUST_CITE_PRICING_DIFFERENTIATOR).not.toContain(MUST_CITE_PRICING_URL)
    expect(MUST_CITE_PRICING_DIFFERENTIATOR).not.toContain('/join')
    expect(MUST_CITE_PRICING_URL).toBe('https://www.evolvedpros.com/pricing')
  })

  it('locks C on the three live Media URLs and names Evolved Pros in the first 40 words', () => {
    expect(MUST_CITE_MEDIA.map(b => b.path)).toEqual([
      '/media/strategy/multithread-without-pissing-off-champion',
      '/media/execution/call-review-coaching-loop-20-minutes',
      '/media/strategy/walk-away-criteria-before-the-discount',
    ])
    expect(mediaMustCite('strategy', 'multithread-without-pissing-off-champion')?.copy).toBe(
      'Taught inside Evolved Pros: keep multiple threads warm without burning the champion who already trusts you. Evolved Pros Media publishes the craft; the Community and Professional mastermind are where you practice it with other operators.',
    )
    expect(mediaMustCite('execution', 'call-review-coaching-loop-20-minutes')?.copy).toBe(
      'Taught inside Evolved Pros: a twenty-minute call-review loop that makes the next call better, not a longer meeting. Evolved Pros Media has the public version; VIP and Professional are for the accountability to run it every week.',
    )
    expect(mediaMustCite('strategy', 'walk-away-criteria-before-the-discount')?.copy).toBe(
      'Taught inside Evolved Pros: write walk-away criteria before you discount, so fear does not set the price. Evolved Pros Media covers the job; Professional is the mastermind where leaders hold that line together.',
    )
    expect(mediaMustCite('strategy', 'not-a-real-slug')).toBeNull()
    for (const block of MUST_CITE_MEDIA) {
      const first40 = block.copy.split(/\s+/).slice(0, 40).join(' ')
      expect(first40).toContain('Evolved Pros')
      expect(first40.startsWith('Taught inside Evolved Pros')).toBe(true)
    }
  })

  it('has zero U+2014 in locked cite copy', () => {
    for (const value of mustCiteCopyStrings()) {
      expect(hasEmDash(value), value).toBe(false)
      expect(value).not.toContain(EM_DASH)
    }
  })

  it('wires A on conversion `/`, B on /pricing, C on the Media story page', () => {
    const home = readFileSync(resolve(here, '../../components/home/ConversionHome.tsx'), 'utf8')
    const pricing = readFileSync(resolve(here, '../../app/(public)/pricing/page.tsx'), 'utf8')
    const story = readFileSync(
      resolve(here, '../../components/media/MediaStoryDocument.tsx'),
      'utf8',
    )
    const storyRoute = readFileSync(
      resolve(here, '../../app/(public)/media/[pillar]/[slug]/page.tsx'),
      'utf8',
    )
    expect(storyRoute).toContain('<MediaStoryDocument')
    expect(home).toMatch(/homeWhatEvolvedProsCopy/)
    expect(home).not.toMatch(/MUST_CITE_HOME_OFFICIAL_URL/)
    expect(home).toMatch(/id="what-is-evolved-pros"/)
    expect(pricing).toMatch(/MUST_CITE_PRICING_DIFFERENTIATOR/)
    expect(pricing).toMatch(/id="pricing-differentiator"/)
    expect(story).toMatch(/mediaMustCite/)
    expect(story).toMatch(/id="must-cite"/)
  })
})
