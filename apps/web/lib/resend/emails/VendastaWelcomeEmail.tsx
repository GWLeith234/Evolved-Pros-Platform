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

interface VendastaWelcomeEmailProps {
  firstName: string
  tier: VendastaTier
  magicLink: string
}

// TODO(george): VIP-specific copy/branding — currently mirrors pro styling.
const tierAccess: Record<VendastaTier, { label: string; accent: string; features: string[] }> = {
  community: {
    label: 'Community',
    accent: '#68a2b9',
    features: [
      'Pillars 1–4: Foundation, Identity, Mental Toughness & Strategy',
      'General community feed and all community channels',
      'Live event access (Community tier)',
    ],
  },
  vip: {
    label: 'VIP',
    accent: '#c9a84c',
    features: [
      'All Community access +',
      'VIP-only community channels and priority Q&A',
      'Exclusive VIP live events and replays',
    ],
  },
  pro: {
    label: 'Pro',
    accent: '#c9a84c',
    features: [
      'All VIP access +',
      'Pillars 5–6: Accountability & Execution',
      'Exclusive Pro channels and priority Q&A',
      'All live events including Pro-only sessions',
    ],
  },
}

export function VendastaWelcomeEmail({
  firstName,
  tier,
  magicLink,
}: VendastaWelcomeEmailProps) {
  const access = tierAccess[tier]

  return (
    <Html>
      <Head />
      <Preview>Welcome to Evolved Pros — your access is ready.</Preview>
      <Body style={bodyStyle}>
        <Section style={headerStyle}>
          <Text style={logoStyle}>
            EVOLVED<span style={{ color: '#ef0e30' }}>·</span>PROS
          </Text>
        </Section>

        <Container style={containerStyle}>
          <Heading style={headingStyle}>Your access is ready.</Heading>

          <Text style={textStyle}>
            {firstName}, welcome to Evolved Pros. You now have access to the{' '}
            <strong style={{ color: access.accent }}>{access.label}</strong>{' '}
            membership — built for professionals who are done with motivation and
            ready for architecture.
          </Text>

          <Section style={tierBadgeSection}>
            <Text style={{ ...tierBadgeText, color: access.accent }}>
              {access.label.toUpperCase()} MEMBER
            </Text>
          </Section>

          <Text style={sectionLabelStyle}>What you have access to:</Text>
          {access.features.map((feature, i) => (
            <Text key={i} style={featureStyle}>
              → {feature}
            </Text>
          ))}

          <Hr style={dividerStyle} />

          <Section style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button href={magicLink} style={ctaStyle}>
              Sign in & enter the platform →
            </Button>
          </Section>

          <Text style={footerNoteStyle}>
            This sign-in link is single-use and expires soon. If it stops working,
            reply to this email and we'll send a fresh one.
          </Text>
        </Container>

        <Section style={footerStyle}>
          <Text style={footerTextStyle}>
            © {new Date().getFullYear()} Evolved Pros · evolvedpros.com
          </Text>
          <Text style={footerTextStyle}>
            You're receiving this because you purchased an Evolved Pros membership.
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
