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

interface WelcomeEmailProps {
  fullName: string
  tier: 'community' | 'pro'
}

const tierAccess = {
  community: {
    label: 'Community',
    features: [
      'Pillars 1–4: Foundation, Identity, Mental Toughness & Strategy',
      'General community feed and all community channels',
      'Live event access (Community tier)',
    ],
  },
  pro: {
    label: 'Pro',
    features: [
      'All Community access +',
      'Pillars 5–6: Accountability & Execution',
      'Exclusive Pro channels and priority Q&A',
      'All live events including Pro-only sessions',
    ],
  },
}

export function WelcomeEmail({ fullName, tier }: WelcomeEmailProps) {
  const firstName = fullName.split(' ')[0] ?? fullName
  const access    = tierAccess[tier]

  return (
    <Html>
      <Head />
      <Preview>Welcome to Evolved Pros — you're in.</Preview>
      <Body style={bodyStyle}>
        {/* Header */}
        <Section style={headerStyle}>
          <Text style={logoStyle}>
            EVOLVED<span style={{ color: '#ef0e30' }}>·</span>PROS
          </Text>
        </Section>

        <Container style={containerStyle}>
          {/* Headline */}
          <Heading style={headingStyle}>You're in.</Heading>

          {/* Body */}
          <Text style={textStyle}>
            {firstName}, welcome to Evolved Pros. You now have access to the{' '}
            <strong style={{ color: tier === 'pro' ? '#c9a84c' : '#68a2b9' }}>
              {access.label}
            </strong>{' '}
            membership — built for professionals who are done with motivation and
            ready for architecture.
          </Text>

          {/* Tier badge */}
          <Section style={tierBadgeSection}>
            <Text style={{ ...tierBadgeText, color: tier === 'pro' ? '#c9a84c' : '#68a2b9' }}>
              {access.label.toUpperCase()} MEMBER
            </Text>
          </Section>

          {/* What you can access */}
          <Text style={sectionLabelStyle}>What you have access to:</Text>
          {access.features.map((feature, i) => (
            <Text key={i} style={featureStyle}>
              → {feature}
            </Text>
          ))}

          <Hr style={dividerStyle} />

          {/* CTA */}
          <Section style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button
              href={`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://evolvedpros.up.railway.app'}/home`}
              style={ctaStyle}
            >
              Enter the Platform →
            </Button>
          </Section>

          <Text style={footerNoteStyle}>
            If you have questions about your membership, reply to this email.
          </Text>
        </Container>

        {/* Footer */}
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

// ── Styles ────────────────────────────────────────────────────────────────────

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
