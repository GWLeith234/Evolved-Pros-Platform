import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components'
import React from 'react'

interface FriendInviteEmailProps {
  inviteUrl: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://platform.evolvedpros.com'

// SPRINT P — the "Friends of George" invite email. Same brand chrome as the
// MagicLink template, but the copy frames it as a personal comp invite rather
// than a login link. The inviteUrl is a durable /welcome?token= link (not an
// expiring Supabase action link), so it works whether it's emailed or pasted.
export function FriendInviteEmail({ inviteUrl }: FriendInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>George invited you to Evolved Pros — Professional access, on the house.</Preview>
      <Body style={bodyStyle}>
        <Section style={headerStyle}>
          <Text style={logoStyle}>
            EVOLVED<span style={{ color: '#ef0e30' }}>·</span>PROS
          </Text>
        </Section>

        <Container style={containerStyle}>
          <Text style={labelStyle}>Friends of George</Text>
          <Text style={headingStyle}>You&rsquo;re in.</Text>

          <Text style={bodyTextStyle}>
            George Leith invited you to Evolved Pros with full{' '}
            <strong style={{ color: '#faf9f7' }}>Professional</strong> access — the complete
            6-Pillar Academy, the accountability system, and the bi-weekly mastermind, on the house.
          </Text>
          <Text style={bodyTextStyle}>
            Click below to claim your access. No card, no catch.
          </Text>

          <Section style={{ textAlign: 'center', margin: '36px 0' }}>
            <Button href={inviteUrl} style={ctaStyle}>
              Claim your access →
            </Button>
          </Section>

          <Hr style={dividerStyle} />

          <Text style={linkFallbackLabel}>Or copy and paste this URL into your browser:</Text>
          <Text style={linkFallbackStyle}>{inviteUrl}</Text>
        </Container>

        <Section style={footerStyle}>
          <Text style={footerTextStyle}>
            © {new Date().getFullYear()} Evolved Pros · evolvedpros.com
          </Text>
          <Text style={footerTextStyle}>
            You&rsquo;re receiving this because George invited you personally.
          </Text>
          <Text style={{ ...footerTextStyle, marginTop: 8 }}>
            <a href={APP_URL} style={{ color: '#68a2b9', textDecoration: 'none' }}>
              {APP_URL}
            </a>
          </Text>
        </Section>
      </Body>
    </Html>
  )
}

// ── Styles (mirrors MagicLink.tsx) ──────────────────────────────────────────

const bodyStyle: React.CSSProperties = {
  backgroundColor: '#112535',
  fontFamily: 'Barlow, -apple-system, BlinkMacSystemFont, sans-serif',
  margin: 0,
  padding: 0,
}
const headerStyle: React.CSSProperties = {
  backgroundColor: '#0d1c27',
  padding: '24px 40px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
}
const logoStyle: React.CSSProperties = {
  fontFamily: '"Barlow Condensed", sans-serif',
  fontSize: '20px',
  fontWeight: 700,
  letterSpacing: '0.15em',
  color: '#ffffff',
  margin: 0,
}
const containerStyle: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '40px',
}
const labelStyle: React.CSSProperties = {
  fontFamily: '"Barlow Condensed", sans-serif',
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: '#C9A84C',
  margin: '0 0 12px',
}
const headingStyle: React.CSSProperties = {
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: '36px',
  fontWeight: 700,
  color: '#faf9f7',
  margin: '0 0 20px',
  lineHeight: 1.15,
}
const bodyTextStyle: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: 1.65,
  color: 'rgba(250,249,247,0.7)',
  margin: '0 0 12px',
}
const ctaStyle: React.CSSProperties = {
  backgroundColor: '#ef0e30',
  color: '#ffffff',
  fontFamily: '"Barlow Condensed", sans-serif',
  fontSize: '14px',
  fontWeight: 700,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  padding: '15px 40px',
  borderRadius: '4px',
  textDecoration: 'none',
  display: 'inline-block',
}
const dividerStyle: React.CSSProperties = {
  borderColor: 'rgba(255,255,255,0.06)',
  margin: '32px 0',
}
const linkFallbackLabel: React.CSSProperties = {
  fontSize: '11px',
  color: '#7a8a96',
  margin: '0 0 6px',
  fontFamily: '"Barlow Condensed", sans-serif',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}
const linkFallbackStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#68a2b9',
  wordBreak: 'break-all',
  lineHeight: 1.5,
}
const footerStyle: React.CSSProperties = {
  borderTop: '1px solid rgba(255,255,255,0.06)',
  padding: '24px 40px',
  textAlign: 'center',
}
const footerTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#7a8a96',
  margin: '0 0 4px',
}
