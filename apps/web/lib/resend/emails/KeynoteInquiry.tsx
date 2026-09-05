import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import React from 'react'
import { inquiryFieldLines, type CleanInquiry } from '@/lib/speaking/inquiry'

interface KeynoteInquiryEmailProps {
  inquiry: CleanInquiry
  crmUrl: string
}

// Existing transactional path for the internal "someone wants to book George"
// alert. Same brand chrome as the other templates. Every filled field is shown
// so George can reply from his inbox without opening the CRM first.
export function KeynoteInquiryEmail({ inquiry, crmUrl }: KeynoteInquiryEmailProps) {
  const rows = inquiryFieldLines(inquiry)

  return (
    <Html>
      <Head />
      <Preview>{`Booking inquiry from ${inquiry.full_name}${inquiry.company ? ` · ${inquiry.company}` : ''}`}</Preview>
      <Body style={bodyStyle}>
        <Section style={headerStyle}>
          <Text style={logoStyle}>
            EVOLVED<span style={{ color: '#ef0e30' }}>·</span>PROS
          </Text>
        </Section>

        <Container style={containerStyle}>
          <Text style={labelStyle}>Booking inquiry</Text>
          <Text style={headingStyle}>{inquiry.full_name}</Text>

          {rows.map(row => (
            <Text key={row.label} style={rowStyle}>
              <span style={rowKeyStyle}>{row.label}</span>
              {row.value}
            </Text>
          ))}

          <Hr style={hrStyle} />

          <Text style={footerStyle}>
            Logged in the CRM as a keynote-interested lead: {crmUrl}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const bodyStyle: React.CSSProperties = {
  backgroundColor: '#0A0F18',
  fontFamily: 'Barlow, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
}

const headerStyle: React.CSSProperties = { padding: '28px 0 8px', textAlign: 'center' }

const logoStyle: React.CSSProperties = {
  color: '#faf9f7',
  fontSize: 18,
  fontWeight: 800,
  letterSpacing: '0.22em',
  margin: 0,
}

const containerStyle: React.CSSProperties = {
  backgroundColor: '#111926',
  border: '1px solid rgba(255,255,255,0.08)',
  borderTop: '3px solid #C9A84C',
  margin: '0 auto',
  maxWidth: 560,
  padding: '28px 32px 32px',
}

const labelStyle: React.CSSProperties = {
  color: '#C9A84C',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.28em',
  margin: '0 0 6px',
  textTransform: 'uppercase',
}

const headingStyle: React.CSSProperties = {
  color: '#faf9f7',
  fontSize: 24,
  fontWeight: 800,
  lineHeight: 1.2,
  margin: '0 0 20px',
}

const rowStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.86)',
  fontSize: 14,
  lineHeight: 1.5,
  margin: '0 0 6px',
}

const rowKeyStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.5)',
  display: 'inline-block',
  fontSize: 11,
  letterSpacing: '0.14em',
  minWidth: 92,
  textTransform: 'uppercase',
}

const hrStyle: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid rgba(255,255,255,0.1)',
  margin: '20px 0',
}

const footerStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.45)',
  fontSize: 12,
  lineHeight: 1.5,
  margin: 0,
}
