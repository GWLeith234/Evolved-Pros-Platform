import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemberPlanBadges } from '@/components/admin/MemberPlanBadges'
import { FOG_BADGE } from './fog'

describe('MemberPlanBadges — rendered FOG vs VIP pills', () => {
  it('renders a gold FOG pill next to PRO for a complimentary member', () => {
    const html = renderToStaticMarkup(
      <MemberPlanBadges role="member" tier="pro" isComped />,
    )
    expect(html).toContain('data-testid="fog-badge"')
    expect(html).toContain('FOG')
    expect(html).toContain('PRO')
    expect(html).toContain(FOG_BADGE.color)
    expect(html).toContain(FOG_BADGE.bg)
    expect(html).not.toContain('data-testid="tier-badge-vip"')
  })

  it('renders paid VIP as VIP and omits FOG', () => {
    const html = renderToStaticMarkup(
      <MemberPlanBadges role="member" tier="vip" isComped={false} />,
    )
    expect(html).toContain('data-testid="tier-badge-vip"')
    expect(html).toContain('VIP')
    expect(html).not.toContain('data-testid="fog-badge"')
  })

  it('does not render FOG for unpaid PRO (No MRR without the stored flag)', () => {
    const html = renderToStaticMarkup(
      <MemberPlanBadges role="member" tier="pro" isComped={false} />,
    )
    expect(html).toContain('PRO')
    expect(html).not.toContain('data-testid="fog-badge"')
  })

  it('can render FOG + VIP as two labeled pills', () => {
    const html = renderToStaticMarkup(
      <MemberPlanBadges role="member" tier="vip" isComped />,
    )
    expect(html).toContain('data-testid="fog-badge"')
    expect(html).toContain('data-testid="tier-badge-vip"')
    expect(html.indexOf('data-testid="fog-badge"')).toBeLessThan(html.indexOf('data-testid="tier-badge-vip"'))
  })
})
