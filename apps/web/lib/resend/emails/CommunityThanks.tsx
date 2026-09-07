import {
  Body,
  Head,
  Html,
  Img,
  Preview,
} from '@react-email/components'
import React from 'react'
import {
  THANKS_GEORGE_SIGNOFF,
  THANKS_TEMPLATE_IDS,
  thanksCadenceLabel,
  type ThanksCadenceStep,
} from '@/lib/thanks/constants'
import { buildThanksEmailCopy, type ThanksEmailVars } from '@/lib/thanks/copy'

const GEORGE_HEADSHOT_CID = 'cid:george-headshot'

const PILLARS = [
  { label: 'Foundation', bg: '#FFA5381A', fg: '#FFA538', border: '#FFA53855' },
  { label: 'Identity', bg: '#A78BFA1A', fg: '#A78BFA', border: '#A78BFA55' },
  { label: 'Mental Toughness', bg: '#F871711A', fg: '#F87171', border: '#F8717155' },
  { label: 'Strategy', bg: '#60A5FA1A', fg: '#60A5FA', border: '#60A5FA55' },
  { label: 'Accountability', bg: '#C9A84C1A', fg: '#C9A84C', border: '#C9A84C55' },
  { label: 'Execution', bg: '#0ABFA31A', fg: '#0ABFA3', border: '#0ABFA355' },
] as const

const RESOURCES: Partial<Record<ThanksCadenceStep, { storyHref: string; storyLabel: string; podcastHref: string; podcastLabel: string }>> = {
  0: {
    storyHref: 'https://www.evolvedpros.com/media/identity/why-i-created-evolved-pros',
    storyLabel: 'Why Evolved Pros Exists',
    podcastHref: 'https://www.evolvedpros.com/podcast/evolved-pros-pilot-episode',
    podcastLabel: 'Pilot Episode · why reinvention matters now',
  },
  1: {
    storyHref: 'https://www.evolvedpros.com/media/foundation/hard-boiled-eggs-protein-snack-hack',
    storyLabel: 'Hard-Boiled Eggs: the protein snack I still use',
    podcastHref: 'https://www.evolvedpros.com/podcast/fitness-nutrition-evolved-pros-carson-teagarden',
    podcastLabel: 'Carson Teagarden · Fitness & Nutrition (Ep 002)',
  },
  2: {
    storyHref: 'https://www.evolvedpros.com/media/identity/tecovas-denver',
    storyLabel: 'Tecovas Denver',
    podcastHref: 'https://www.evolvedpros.com/podcast/dennis-yu-authority-content',
    podcastLabel: 'Dennis Yu · Authority and content',
  },
}

export type CommunityThanksEmailProps = ThanksEmailVars & {
  step: ThanksCadenceStep
}

const logoStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'Arial, sans-serif',
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: '0.15em',
  color: '#ffffff',
}

const wordmark = (
  <p style={logoStyle}>
    EVOLVED<span style={{ color: '#ef0e30' }}>·</span>PROS
  </p>
)

export function CommunityThanksEmail({
  step,
  first_name,
  claim_url,
  george_signoff = THANKS_GEORGE_SIGNOFF,
}: CommunityThanksEmailProps) {
  const copy = buildThanksEmailCopy(step, { first_name, claim_url, george_signoff })
  const resources = RESOURCES[step]

  return (
    <Html>
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body style={bodyStyle}>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={bodyStyle}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: 0 }}>
                <table role="presentation" width={560} cellPadding={0} cellSpacing={0} border={0} style={innerTableStyle}>
                  <tbody>
                    <tr>
                      <td style={headerStyle}>{wordmark}</td>
                    </tr>
                    <tr>
                      <td style={contentStyle}>
                        <p style={labelStyle}>Community thank you · {thanksCadenceLabel(step)}</p>
                        <h1 style={headingStyle}>{copy.subject}.</h1>
                        <p style={bodyTextStyle}>Hey {copy.vars.first_name},</p>
                        {copy.paragraphs.map(p => (
                          <p key={p} style={bodyTextStyle}>{p}</p>
                        ))}

                        {step === 0 && (
                          <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ margin: '12px 0 18px' }}>
                            <tbody>
                              <tr>
                                {PILLARS.slice(0, 3).map(pillar => (
                                  <td key={pillar.label} style={{ padding: '0 6px 8px 0' }}>
                                    <span style={pillStyle(pillar)}>{pillar.label}</span>
                                  </td>
                                ))}
                              </tr>
                              <tr>
                                {PILLARS.slice(3).map(pillar => (
                                  <td key={pillar.label} style={{ padding: '0 6px 8px 0' }}>
                                    <span style={pillStyle(pillar)}>{pillar.label}</span>
                                  </td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        )}

                        {resources && (
                          <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={resourceBoxStyle}>
                            <tbody>
                              <tr>
                                <td style={{ padding: '14px 16px' }}>
                                  <p style={resourceLineStyle}>
                                    <strong style={{ color: '#faf9f7' }}>Story:</strong>{' '}
                                    <a href={resources.storyHref} style={resourceLinkStyle}>{resources.storyLabel}</a>
                                  </p>
                                  <p style={{ ...resourceLineStyle, margin: 0 }}>
                                    <strong style={{ color: '#faf9f7' }}>Podcast:</strong>{' '}
                                    <a href={resources.podcastHref} style={resourceLinkStyle}>{resources.podcastLabel}</a>
                                  </p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        )}

                        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ margin: '28px 0' }}>
                          <tbody>
                            <tr>
                              <td align="center">
                                <a href={claim_url} style={ctaStyle}>Claim free Community →</a>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ marginTop: 28 }}>
                          <tbody>
                            <tr>
                              <td style={{ paddingTop: 24, borderTop: '1px solid #2a4050' }}>
                                <p style={{ ...bodyTextStyle, fontStyle: 'italic' }}>I will see you when I see you</p>
                                <p style={signoffStyle}>{copy.vars.george_signoff}</p>
                                <Img
                                  src={GEORGE_HEADSHOT_CID}
                                  alt="George Leith"
                                  width={160}
                                  style={headshotStyle}
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <p style={copyLabelStyle}>
                          Or copy:{' '}
                          <a href={claim_url} style={{ color: '#68a2b9', textDecoration: 'none' }}>{claim_url}</a>
                        </p>
                        <p style={metaStyle}>Template {THANKS_TEMPLATE_IDS[step]}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style={footerStyle}>
                        {wordmark}
                        <p style={footerTextStyle}>{`© ${new Date().getFullYear()} Evolved Pros · evolvedpros.com`}</p>
                        <p style={footerTextStyle}>Personal note from George</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  )
}

function pillStyle(pillar: (typeof PILLARS)[number]): React.CSSProperties {
  return {
    display: 'inline-block',
    fontFamily: 'Arial, sans-serif',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    padding: '5px 10px',
    borderRadius: 3,
    background: pillar.bg,
    color: pillar.fg,
    border: `1px solid ${pillar.border}`,
  }
}

const bodyStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  backgroundColor: '#112535',
}
const innerTableStyle: React.CSSProperties = {
  width: 560,
  maxWidth: 560,
  backgroundColor: '#112535',
}
const headerStyle: React.CSSProperties = {
  backgroundColor: '#0d1c27',
  padding: '28px 40px',
  borderBottom: '1px solid #2a4050',
}
const contentStyle: React.CSSProperties = {
  backgroundColor: '#112535',
  padding: '36px 40px 40px',
}
const labelStyle: React.CSSProperties = {
  margin: '0 0 10px',
  fontFamily: 'Arial, sans-serif',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '1.8px',
  textTransform: 'uppercase',
  color: '#C9A84C',
}
const headingStyle: React.CSSProperties = {
  margin: '0 0 16px',
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: 26,
  fontWeight: 700,
  color: '#faf9f7',
  lineHeight: 1.2,
}
const bodyTextStyle: React.CSSProperties = {
  margin: '0 0 14px',
  fontFamily: 'Arial, sans-serif',
  fontSize: 15,
  lineHeight: 1.65,
  color: '#c8d0d6',
}
const resourceBoxStyle: React.CSSProperties = {
  margin: '16px 0',
  background: '#163040',
  border: '1px solid #3a6070',
  borderRadius: 8,
}
const resourceLineStyle: React.CSSProperties = {
  margin: '0 0 8px',
  fontFamily: 'Arial, sans-serif',
  fontSize: 13,
  lineHeight: 1.5,
  color: '#c8d0d6',
}
const resourceLinkStyle: React.CSSProperties = {
  color: '#68a2b9',
  textDecoration: 'underline',
}
const ctaStyle: React.CSSProperties = {
  backgroundColor: '#ef0e30',
  color: '#ffffff',
  fontFamily: 'Arial, sans-serif',
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  padding: '15px 36px',
  borderRadius: 4,
  textDecoration: 'none',
  display: 'inline-block',
}
const signoffStyle: React.CSSProperties = {
  margin: '0 0 14px',
  fontFamily: 'Arial, sans-serif',
  fontSize: 15,
  lineHeight: 1.65,
  color: '#faf9f7',
  fontWeight: 600,
}
const headshotStyle: React.CSSProperties = {
  display: 'block',
  width: 160,
  maxWidth: 160,
  height: 'auto',
  borderRadius: 6,
  border: '1px solid #2a4050',
}
const copyLabelStyle: React.CSSProperties = {
  margin: '24px 0 8px',
  fontFamily: 'Arial, sans-serif',
  fontSize: 12,
  lineHeight: 1.5,
  color: '#7a8a96',
}
const metaStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'Arial, sans-serif',
  fontSize: 10,
  color: '#7a8a96',
}
const footerStyle: React.CSSProperties = {
  borderTop: '1px solid #2a4050',
  padding: '24px 40px',
  textAlign: 'center',
  backgroundColor: '#112535',
}
const footerTextStyle: React.CSSProperties = {
  margin: '0 0 4px',
  fontFamily: 'Arial, sans-serif',
  fontSize: 12,
  color: '#7a8a96',
}
