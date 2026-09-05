/**
 * S4 LIVE CTA copy. Kept here so vitest (lib/**) can pin the locked strings
 * and the hero source order without importing the page.
 *
 * No em dashes. George lock 2026-09-04.
 */

export const INQUIRE_BOOKING_LABEL = 'Inquire about booking'
export const INQUIRE_BOOKING_TOOLTIP =
  'Request speaking details. No payment or commitment.'

export const SEE_EVENTS_LABEL = 'See events →'
export const SEE_EVENTS_HREF = '/events'
export const SEE_EVENTS_TOOLTIP =
  'Member event details. Sign in to continue and return to this event list.'

export const ANNUAL_BILLING_TOOLTIP = 'Annual billing includes two months free.'

export function liveCtaCopyStrings(): string[] {
  return [
    INQUIRE_BOOKING_LABEL,
    INQUIRE_BOOKING_TOOLTIP,
    SEE_EVENTS_LABEL,
    SEE_EVENTS_TOOLTIP,
    ANNUAL_BILLING_TOOLTIP,
  ]
}
