import { Hr, Link, Section, Text } from '@react-email/components'
import React from 'react'

/**
 * CASL-compliant campaign footer (SPRINT EM-1).
 *
 * Canada's Anti-Spam Legislation requires every commercial electronic message
 * to carry three things, and this component is the single place they live:
 *   1. Who is sending it — legal name and a physical mailing address.
 *   2. A working unsubscribe mechanism, visible and functional for 60 days.
 *   3. Enough context for the recipient to know why they got it.
 *
 * Transactional email does NOT use this — it is not commercial email and has
 * different rules. This belongs to campaign sends only, and sendCampaignEmail
 * injects it so no campaign can accidentally ship without it.
 */

export interface CampaignFooterProps {
  unsubscribeUrl: string
  /**
   * Pipe-separated sender identity from CAMPAIGN_SENDER_IDENTITY, e.g.
   * "GWLeith Revenue Growth Solutions | 123 Example St, Saskatoon SK S7K 0A1".
   */
  senderIdentity: string
  /** One line on why this person is hearing from us. */
  reason?: string
}

export const DEFAULT_CAMPAIGN_REASON =
  'You’re receiving this because of a prior business relationship with George Leith — a conversation, an event, or a connection request.'

/** Split the env string into display lines, dropping empty segments. */
export function senderIdentityLines(identity: string): string[] {
  return identity
    .split('|')
    .map(s => s.trim())
    .filter(Boolean)
}

export function CampaignFooter({
  unsubscribeUrl,
  senderIdentity,
  reason = DEFAULT_CAMPAIGN_REASON,
}: CampaignFooterProps) {
  const lines = senderIdentityLines(senderIdentity)

  return (
    <Section style={wrapStyle}>
      <Hr style={hrStyle} />
      <Text style={reasonStyle}>{reason}</Text>
      {lines.map((line, i) => (
        <Text key={i} style={i === 0 ? senderNameStyle : addressStyle}>
          {line}
        </Text>
      ))}
      <Text style={unsubStyle}>
        <Link href={unsubscribeUrl} style={unsubLinkStyle}>
          Unsubscribe
        </Link>{' '}
        — one click, no questions asked.
      </Text>
    </Section>
  )
}

/**
 * Plain-text counterpart. Resend derives a text part from the HTML, but that
 * derivation can mangle a link; campaign email needs the unsubscribe URL to
 * survive verbatim in the text/plain alternative, so it is built explicitly.
 */
export function campaignFooterText({
  unsubscribeUrl,
  senderIdentity,
  reason = DEFAULT_CAMPAIGN_REASON,
}: CampaignFooterProps): string {
  return [
    '',
    '—',
    reason,
    '',
    ...senderIdentityLines(senderIdentity),
    '',
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join('\n')
}

const wrapStyle: React.CSSProperties = { marginTop: 32 }

const hrStyle: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid rgba(0,0,0,0.12)',
  margin: '0 0 16px',
}

const reasonStyle: React.CSSProperties = {
  color: '#5a6472',
  fontSize: 12,
  lineHeight: 1.5,
  margin: '0 0 12px',
}

const senderNameStyle: React.CSSProperties = {
  color: '#3a4350',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: 1.5,
  margin: 0,
}

const addressStyle: React.CSSProperties = {
  color: '#5a6472',
  fontSize: 12,
  lineHeight: 1.5,
  margin: 0,
}

const unsubStyle: React.CSSProperties = {
  color: '#5a6472',
  fontSize: 12,
  lineHeight: 1.5,
  margin: '12px 0 0',
}

const unsubLinkStyle: React.CSSProperties = {
  color: '#1b3c5a',
  textDecoration: 'underline',
}
