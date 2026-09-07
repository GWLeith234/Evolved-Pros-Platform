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
import {
  THANKS_GEORGE_SIGNOFF,
  THANKS_TEMPLATE_IDS,
  THANKS_WWW_ORIGIN,
  type ThanksCadenceStep,
} from '@/lib/thanks/constants'
import { buildThanksEmailCopy, type ThanksEmailVars } from '@/lib/thanks/copy'

/** Magic Link bar: EVOLVED + red interpunct + PROS. Required on every thanks template. */
export const EP_EMAIL_WORDMARK = (
  <>
    EVOLVED<span style={{ color: '#ef0e30' }}>·</span>PROS
  </>
)

export type CommunityThanksEmailProps = ThanksEmailVars & {
  step: ThanksCadenceStep
}

export function CommunityThanksEmail({
  step,
  first_name,
  claim_url,
  george_signoff = THANKS_GEORGE_SIGNOFF,
}: CommunityThanksEmailProps) {
  const copy = buildThanksEmailCopy(step, { first_name, claim_url, george_signoff })

  return (
    <Html>
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body style={bodyStyle}>
        <Section style={headerStyle}>
          <Text style={logoStyle}>{EP_EMAIL_WORDMARK}</Text>
        </Section>

        <Container style={containerStyle}>
          <Text style={labelStyle}>Community thank you</Text>
          <Text style={headingStyle}>You are invited.</Text>

          {copy.paragraphs.map(p => (
            <Text key={p} style={bodyTextStyle}>
              {p}
            </Text>
          ))}

          <Section style={{ textAlign: 'center', margin: '36px 0' }}>
            <Button href={claim_url} style={ctaStyle}>
              {copy.cta}
            </Button>
          </Section>

          <Text style={signoffStyle}>{copy.vars.george_signoff}</Text>

          <Hr style={dividerStyle} />

          <Text style={linkFallbackLabel}>Or copy and paste this URL into your browser:</Text>
          <Text style={linkFallbackStyle}>{claim_url}</Text>
          <Text style={metaStyle}>Template {THANKS_TEMPLATE_IDS[step]}</Text>
        </Container>

        <Section style={footerStyle}>
          <Text style={logoStyle}>{EP_EMAIL_WORDMARK}</Text>
          <Text style={footerTextStyle}>
            {`© ${new Date().getFullYear()} Evolved Pros · evolvedpros.com`}
          </Text>
          <Text style={footerTextStyle}>
            You are receiving this because George sent a personal thank-you Community invite.
          </Text>
          <Text style={{ ...footerTextStyle, marginTop: 8 }}>
            <a href={THANKS_WWW_ORIGIN} style={{ color: '#68a2b9', textDecoration: 'none' }}>
              {THANKS_WWW_ORIGIN}
            </a>
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
const signoffStyle: React.CSSProperties = {
  fontSize: '15px',
  color: '#faf9f7',
  margin: '8px 0 0',
  fontWeight: 600,
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
const metaStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#7a8a96',
  margin: '12px 0 0',
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
