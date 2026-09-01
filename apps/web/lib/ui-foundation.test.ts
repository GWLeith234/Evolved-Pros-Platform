/**
 * Sprint 1 foundation — design tokens & metric helpers.
 * Isolation contract: package exports stay stable for the component library.
 */
import { describe, it, expect } from 'vitest'
import {
  colors,
  themes,
  spacing,
  radii,
  shadows,
  gradients,
  pillarColors,
  getPillarColor,
  typography,
} from '@evolved-pros/ui'

describe('design tokens', () => {
  it('exposes brand core colors', () => {
    expect(colors.red).toBe('#C9302A')
    expect(colors.gold).toBe('#C9A84C')
    expect(colors.teal).toBe('#0ABFA3')
    expect(colors.navy).toBe('#1B2A4A')
  })

  it('defines dark + light semantic themes', () => {
    expect(themes.dark.bgPage).toBe('#0A0F18')
    expect(themes.light.bgPage).toBe('#F5F0E8')
    expect(themes.dark.textPrimary).toBe('#FFFFFF')
    expect(themes.light.textPrimary).toBe('#1B2A4A')
    expect(themes.dark.shadowMd).toBeTruthy()
    expect(themes.light.shadowMd).toBeTruthy()
  })

  it('defines spacing, radii, shadows, gradients', () => {
    expect(spacing[1]).toBe('4px')
    expect(spacing[4]).toBe('16px')
    expect(radii.none).toBe('0px')
    expect(radii.pill).toBe('9999px')
    expect(shadows.md).toContain('--shadow-md')
    expect(gradients.primary).toContain('linear-gradient')
    expect(gradients.success).toContain('#0ABFA3')
  })

  it('locks all six pillar colors', () => {
    expect(Object.keys(pillarColors)).toHaveLength(6)
    expect(pillarColors[1].color).toBe('#FFA538')
    expect(pillarColors[6].color).toBe('#0ABFA3')
    expect(getPillarColor(3)).toBe('#F87171')
    expect(getPillarColor(null)).toBe(colors.muted)
  })

  it('exposes typography families and scale', () => {
    expect(typography.families.bebas).toContain('Bebas Neue')
    expect(typography.scale.body.size).toBe('0.9375rem')
    expect(typography.scale.eyebrow.tracking).toBe('0.14em')
  })
})
