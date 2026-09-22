import type { CSSProperties, ReactNode } from 'react'

/**
 * SPRINT M - the ad separation standard, in one container.
 *
 * THE RULE: advertiser creative is outside our control, so separation lives in
 * the CONTAINER, not the creative. A reader must be able to tell an ad from the
 * page without reading a word of it.
 *
 * Three things do that work, and all three live here so no surface can ship an
 * ad without them:
 *
 *   1. The ad plane steps AWAY from the page plane. Light mode: the container
 *      is darker than the cream page. Dark mode: it is lighter than the navy
 *      page. Direction is the rule; the values are --ad-plane-* in globals.css.
 *   2. A hairline border on all four sides, in a mid neutral. The step alone
 *      can be lost on a gradient or a photo; the border cannot.
 *   3. A real label. 11px minimum, uppercase, letter-spaced, >= 4.5:1 on its
 *      own container, above the unit and outside the creative. The old one was
 *      ~9px at 35% opacity: present in the DOM, invisible on the page.
 *
 * RESERVED COLOURS never appear in ad chrome - #112535 navy, #ef0e30 red
 * (especially not on a CTA inside an ad, where it would read as a platform
 * action), #F5F0E8 cream, and the six pillar colours. The --ad-plane-* tokens
 * are deliberately neutral and deliberately none of those.
 *
 * This component owns the chrome only. What goes inside is the creative, and
 * it renders untouched.
 */

/** The only two words allowed above a unit. */
export type AdPlaneLabel = 'Advertisement' | 'Sponsored'

export function AdPlane({
  /**
   * 'Advertisement' for paid third-party inventory, 'Sponsored' for partner
   * and house units. Either is honest; neither is optional.
   */
  label = 'Advertisement',
  /** Creative width in px. The plane never grows past its creative. */
  width,
  className,
  style,
  /** Extra data-* hooks for QA selectors. Never anything user-visible. */
  data,
  children,
}: {
  label?: AdPlaneLabel
  width?: number
  className?: string
  style?: CSSProperties
  data?: Record<string, string | undefined>
  children: ReactNode
}) {
  return (
    <div
      className={`ep-ad-plane${className ? ` ${className}` : ''}`}
      {...data}
      data-ad-plane="separated"
      data-ad-label={label.toLowerCase()}
      style={{
        maxWidth: width ? width + AD_PLANE_CHROME_X : undefined,
        ...style,
      }}
    >
      <p className="ep-ad-plane-label">{label}</p>
      {/* No minHeight here. The creative carries its own `aspect-ratio`, which
          reserves the right box at ANY rendered width; a fixed pixel height
          would leave visible dead space inside the plane whenever a 300x600
          has to shrink into a narrower rail. The old container could get away
          with that because it had no background to show the gap. */}
      <div className="ep-ad-plane-creative">{children}</div>
    </div>
  )
}

/**
 * Horizontal chrome the plane adds around its creative: 10px padding + 1px
 * hairline on each side. Kept in step with .ep-ad-plane in globals.css so a
 * 300px unit still renders at 300px inside a 322px plane rather than being
 * squeezed to 280.
 */
export const AD_PLANE_CHROME_X = 22
