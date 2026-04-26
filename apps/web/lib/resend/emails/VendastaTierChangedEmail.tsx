import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import React from 'react'

type VendastaTier = 'community' | 'vip' | 'pro'

interface VendastaTierChangedEmailProps {
  firstName: string
  oldTier: VendastaTier
  newTier: VendastaTier
}

const tierLabel: Record<VendastaTier, string> = {
  community: 'Community',
  vip:       'VIP',
  pro:       'Pro',
}

// TODO(george): VIP-specific accent — currently mirrors pro gold.
const tierAccent: Record<VendastaTier, string> = {
  community: '#68a2b9',
  vip:       '#c9a84c',
  pro:       '#c9a84c',
}

const TIER_RANK: Record<VendastaTier, number> = {
  community: 1,
  vip:       2,
  pro:       3,
}

export function VendastaTierChangedEmail({
  firstName,
  oldTier,
  newTier,
}: VendastaTierChangedEmailProps) {
  const isUpgrade = TIER_RANK[newTier] > TIER_RANK[oldTier]
  const verb      = isUpgrade ? 'upgraded' : 'changed'
  const newLabel  = tierLabel[newTier]
  const accent    = tierAccent[newTier]
  const appUrl    = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://platform.evolvedpros.com'

  return (
    <Html>
      <Head />
      <Preview>Your Evolved Pros tier was {verb} to {newLabel}.</Preview>
      <Body style={bodyStyle}>
        <Section style={headerStyle}>
          <Text style={logoStyle}>
            EVOLVED<span style={{ color: '#ef0e30' }}>·</span>PROS
          </Text>
        </Section>

        <Container style={containerStyle}>
          <Heading style={headingStyle}>
            You're now {newLabel}.
          </Heading>

          <Text style={textStyle}>
            {firstName}, your Evolved Pros tier was {verb} to{' '}
            <strong style={{ color: accent }}>{newLabel}</strong>. Your new access
            is live now — no further action needed.
          </Text>

          <Section style={tierBadgeSection}>
            <Text style={{ ...tierBadgeText, color: accent }}>
              {newLabel.toUpperCase()} MEMBER
            </Text>
          </Section>

          {isUpgrade && newTier === 'vip' && (
            <>
              <Text style={sectionLabelStyle}>What's newly unlocked:</Text>
              <Text style={featureStyle}>→ VIP-only community channels and priority Q&A</Text>
              <Text style={featureStyle}>→ Exclusive VIP live events and replays</Text>
            </>
          )}

          {isUpgrade && newTier === 'pro' && (
            <>
              <Text style={sectionLabelStyle}>What's newly unlocked:</Text>
              <Text style={featureStyle}>→ Pillars 5–6: Accountability & Execution</Text>
              <Text style={featureStyle}>→ Exclusive Pro channels and priority Q&A</Text>
              <Text style={featureStyle}>→ All live events including Pro-only sessions</Text>
            </>
          )}

          <Hr style={dividerStyle} />

          <Section style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button href={`${appUrl}/home`} style={ctaStyle}>
              Open the platform →
            </Button>
          </Section>

          <Text style={footerNoteStyle}>
            Questions? Reply to this email.
          </Text>
        </Container>

        <Section style={footerStyle}>
          <Text style={footerTextStyle}>
            © {new Date().getFullYear()} Evolved Pros · evolvedpros.com
          </Text>
        </Section>
      </Body>
    </Html>
  )
}

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

const headingStyle: React.CSSProperties = {
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: '48px',
  fontWeight: 900,
  color: '#faf9f7',
  margin: '0 0 24px',
  lineHeight: 1.1,
}

const textStyle: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: 1.6,
  color: 'rgba(250,249,247,0.8)',
  margin: '0 0 24px',
}

const tierBadgeSection: React.CSSProperties = {
  margin: '0 0 32px',
}

const tierBadgeText: React.CSSProperties = {
  display: 'inline-block',
  fontFamily: '"Barlow Condensed", sans-serif',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.15em',
  border: '1px solid currentColor',
  borderRadius: '4px',
  padding: '4px 10px',
  margin: 0,
}

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: '"Barlow Condensed", sans-serif',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: '#7a8a96',
  margin: '0 0 8px',
}

const featureStyle: React.CSSProperties = {
  fontSize: '14px',
  color: 'rgba(250,249,247,0.7)',
  margin: '0 0 6px',
  paddingLeft: '4px',
}

const dividerStyle: React.CSSProperties = {
  borderColor: 'rgba(255,255,255,0.06)',
  margin: '32px 0 0',
}

const ctaStyle: React.CSSProperties = {
  backgroundColor: '#ef0e30',
  color: '#ffffff',
  fontFamily: '"Barlow Condensed", sans-serif',
  fontSize: '14px',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '14px 32px',
  borderRadius: '4px',
  textDecoration: 'none',
  display: 'inline-block',
}

const footerNoteStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#7a8a96',
  margin: '24px 0 0',
  textAlign: 'center',
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
