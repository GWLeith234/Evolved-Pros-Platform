/**
 * Locked public legal copy (George, 2026-08-29).
 *
 * These strings replace the FOOTER-1 `TODO GEORGE / COUNSEL` blanks on /terms
 * and /privacy. They are the owner's locked facts, not invented doctrine.
 * MacDermid Lamarsh still blesses wording later.
 *
 * Do not substitute AdCellerant, 199 Bay Street Toronto, a Calgary office,
 * or 234 Bornstein Court. Firm spelling is MacDermid Lamarsh (not MacDirmid).
 * The published street line is the firm's own contact page, which wins over
 * stale directories that list 301 3rd Avenue South.
 */

export const LEGAL_ENTITY_NAME = 'GWLeith Revenue Growth Solutions'
export const REGISTERED_OFFICE_CARE_OF = 'MacDermid Lamarsh'

/** Street, city/postal, country — as published at macmarsh.ca/contact-us. */
export const REGISTERED_OFFICE_STREET = '216 1st Avenue South, 3rd Floor'
export const REGISTERED_OFFICE_CITY_LINE = 'Saskatoon, Saskatchewan  S7K 1K3'
export const REGISTERED_OFFICE_COUNTRY = 'Canada'

/**
 * How the registered office is presented on /terms and /privacy:
 * entity, c/o the firm, then the published address. No personal name,
 * no "George's lawyer", no firm phone or email.
 */
export const REGISTERED_OFFICE_LINES = [
  LEGAL_ENTITY_NAME,
  `c/o ${REGISTERED_OFFICE_CARE_OF}`,
  REGISTERED_OFFICE_STREET,
  REGISTERED_OFFICE_CITY_LINE,
  REGISTERED_OFFICE_COUNTRY,
] as const

export const GOVERNING_LAW_SENTENCE =
  'These terms are governed by the laws of the Province of Saskatchewan, Canada.'

export const GOVERNING_VENUE_SENTENCE = 'Venue: courts of Saskatchewan.'

export const GOVERNING_LAW_AND_VENUE = `${GOVERNING_LAW_SENTENCE} ${GOVERNING_VENUE_SENTENCE}`

/**
 * Paid membership (VIP, Professional, any other recurring platform plan).
 * Keynotes and LIVE events are named only to put them out of scope — do not
 * invent a ticket or deposit policy here.
 */
export const MEMBERSHIP_REFUND_PARAS = [
  'You may cancel a paid membership (VIP, Professional, or any other recurring platform plan) at any time. Cancellation stops renewal. You keep access until the end of the period already paid. We do not give a prorated refund of the current period.',
  'First paid charge only: if you ask within 7 days of that first charge, we refund that charge in full and revoke access.',
  'After that 7-day window, we do not refund membership payments except for rights that Saskatchewan law does not let a supplier waive. Those include internet sales and remote-contract cancellation under The Consumer Protection and Business Practices Act and its regulations: 7 days after receiving a copy of the contract if required disclosure was not given; 30 days after entering the contract if you were not given a copy; and a refund of the consideration within 15 days of a valid statutory cancellation. This is not a blanket cooling-off period.',
  'To cancel or request a refund, write to support@evolvedpros.com. Payments are processed by Stripe.',
  'Keynotes and LIVE events have their own terms, provided at booking.',
] as const
