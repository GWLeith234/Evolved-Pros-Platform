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
import { AUTH_ORIGIN, resolveAuthOrigin } from '@/lib/auth/authOrigin'

interface MagicLinkEmailProps {
  magicLink: string
  /** signup: password confirm link. login: magic link and invites. */
  kind?: 'login' | 'signup'
}

const APP_URL = resolveAuthOrigin() || AUTH_ORIGIN

export function MagicLinkEmail({ magicLink, kind = 'login' }: MagicLinkEmailProps) {
  const signup = kind === 'signup'
  return (
    <Html>
      <Head />
      <Preview>
        {signup
          ? 'Confirm your Evolved Pros account.'
          : 'Your Evolved Pros login link — click to sign in.'}
      </Preview>
      <Body style={bodyStyle}>

        {/* Header */}
        <Section style={headerStyle}>
          <Text style={logoStyle}>
            EVOLVED<span style={{ color: '#ef0e30' }}>·</span>PROS
          </Text>
        </Section>

        {/* Content */}
        <Container style={containerStyle}>
          <Text style={labelStyle}>{signup ? 'Confirm your account' : 'Secure Login Link'}</Text>
          <Text style={headingStyle}>
            {signup ? 'Confirm your email.' : 'One click to get in.'}
          </Text>

          <Text style={bodyTextStyle}>
            {signup
              ? 'Click the button below to finish creating your Evolved Pros account. This link expires in 24 hours, works in any browser, and can only be used once.'
              : 'Click the button below to log in to your Evolved Pros account. This link expires in 24 hours and can only be used once.'}
          </Text>

          <Section style={{ textAlign: 'center', margin: '36px 0' }}>
            <Button href={magicLink} style={ctaStyle}>
              {signup ? 'Confirm your account →' : 'Log in to Evolved Pros →'}
            </Button>
          </Section>

          <Hr style={dividerStyle} />

          <Text style={noteStyle}>
            {signup
              ? "If you didn't create an Evolved Pros account, you can ignore this email."
              : "If you didn't request this link, you can safely ignore this email. Your account is secure."}
          </Text>

          <Text style={linkFallbackLabel}>Or copy and paste this URL into your browser:</Text>
          <Text style={linkFallbackStyle}>{magicLink}</Text>
        </Container>

        {/* Footer */}
        <Section style={footerStyle}>
          <Text style={footerTextStyle}>
            © {new Date().getFullYear()} Evolved Pros · evolvedpros.com
          </Text>
          <Text style={footerTextStyle}>
            {signup
              ? "You're receiving this because you asked to create an Evolved Pros account."
              : "You're receiving this because you're an Evolved Pros member."}
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

// ── Styles ─────────────────────────────────────────────────────────────────

const bodyStyle: React.CSSProperties = {
  backgroundColor: '#112535',
  fontFamily:      'Barlow, -apple-system, BlinkMacSystemFont, sans-serif',
  margin:          0,
  padding:         0,
}

const headerStyle: React.CSSProperties = {
  backgroundColor: '#0d1c27',
  padding:         '24px 40px',
  borderBottom:    '1px solid rgba(255,255,255,0.06)',
}

const logoStyle: React.CSSProperties = {
  fontFamily:    '"Barlow Condensed", sans-serif',
  fontSize:      '20px',
  fontWeight:    700,
  letterSpacing: '0.15em',
  color:         '#ffffff',
  margin:        0,
}

const containerStyle: React.CSSProperties = {
  maxWidth: '560px',
  margin:   '0 auto',
  padding:  '40px',
}

const labelStyle: React.CSSProperties = {
  fontFamily:    '"Barlow Condensed", sans-serif',
  fontSize:      '10px',
  fontWeight:    700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color:         '#68a2b9',
  margin:        '0 0 12px',
}

const headingStyle: React.CSSProperties = {
  fontFamily:  '"Playfair Display", Georgia, serif',
  fontSize:    '36px',
  fontWeight:  700,
  color:       '#faf9f7',
  margin:      '0 0 20px',
  lineHeight:  1.15,
}

const bodyTextStyle: React.CSSProperties = {
  fontSize:   '15px',
  lineHeight: 1.65,
  color:      'rgba(250,249,247,0.7)',
  margin:     '0 0 8px',
}

const ctaStyle: React.CSSProperties = {
  backgroundColor: '#ef0e30',
  color:           '#ffffff',
  fontFamily:      '"Barlow Condensed", sans-serif',
  fontSize:        '14px',
  fontWeight:      700,
  letterSpacing:   '0.10em',
  textTransform:   'uppercase',
  padding:         '15px 40px',
  borderRadius:    '4px',
  textDecoration:  'none',
  display:         'inline-block',
}

const dividerStyle: React.CSSProperties = {
  borderColor: 'rgba(255,255,255,0.06)',
  margin:      '32px 0',
}

const noteStyle: React.CSSProperties = {
  fontSize:   '13px',
  color:      'rgba(250,249,247,0.4)',
  lineHeight: 1.6,
  margin:     '0 0 24px',
}

const linkFallbackLabel: React.CSSProperties = {
  fontSize:   '11px',
  color:      '#7a8a96',
  margin:     '0 0 6px',
  fontFamily: '"Barlow Condensed", sans-serif',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const linkFallbackStyle: React.CSSProperties = {
  fontSize:       '11px',
  color:          '#68a2b9',
  wordBreak:      'break-all',
  lineHeight:     1.5,
}

const footerStyle: React.CSSProperties = {
  borderTop: '1px solid rgba(255,255,255,0.06)',
  padding:   '24px 40px',
  textAlign: 'center',
}

const footerTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color:    '#7a8a96',
  margin:   '0 0 4px',
}
