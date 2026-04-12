import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from '@react-email/components'
import React from 'react'

export interface DigestNotification {
  id: string
  type: string
  title: string
  body: string
  actionUrl: string | null
  createdAt: string
}

interface DigestEmailProps {
  displayName: string
  notifications: DigestNotification[]
  date: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function stripBold(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '$1')
}

const TYPE_LABEL: Record<string, string> = {
  community_reply:   'Community',
  community_mention: 'Community',
  event_reminder:    'Events',
  course_unlock:     'Academy',
  system_billing:    'System',
}

export function DigestEmail({ displayName, notifications, date }: DigestEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://evolvedpros.up.railway.app'
  const firstName = displayName.split(' ')[0] ?? displayName

  // Group notifications by category
  const community = notifications.filter(n => n.type === 'community_reply' || n.type === 'community_mention')
  const events     = notifications.filter(n => n.type === 'event_reminder')
  const academy    = notifications.filter(n => n.type === 'course_unlock')
  const system     = notifications.filter(n => n.type === 'system_billing')

  const sections = [
    { label: 'Community', items: community, color: '#68a2b9' },
    { label: 'Events',    items: events,    color: '#c9a84c' },
    { label: 'Academy',   items: academy,   color: '#ef0e30' },
    { label: 'System',    items: system,    color: '#7a8a96' },
  ].filter(s => s.items.length > 0)

  return (
    <Html>
      <Head />
      <Preview>{`Your Evolved Pros digest — ${notifications.length} update${notifications.length !== 1 ? 's' : ''} for ${date}`}</Preview>
      <Body style={bodyStyle}>
        <Section style={headerStyle}>
          <Text style={logoStyle}>EVOLVED<span style={{ color: '#ef0e30' }}>·</span>PROS</Text>
        </Section>

        <Container style={containerStyle}>
          <Heading style={headingStyle}>Your Daily Digest.</Heading>

          <Text style={textStyle}>
            {firstName}, here's what happened while you were away. {notifications.length} update{notifications.length !== 1 ? 's' : ''} from {date}.
          </Text>

          {sections.map(section => (
            <React.Fragment key={section.label}>
              <Section style={{ marginBottom: '8px' }}>
                <Text style={{ ...sectionLabelStyle, color: section.color }}>{section.label}</Text>
              </Section>

              <Section style={sectionBoxStyle}>
                {section.items.map((notif, i) => (
                  <React.Fragment key={notif.id}>
                    <Section style={notifRowStyle}>
                      <Text style={notifTitleStyle}>{notif.title}</Text>
                      <Text style={notifBodyStyle}>{stripBold(notif.body)}</Text>
                      <Text style={notifMetaStyle}>
                        {TYPE_LABEL[notif.type] ?? notif.type} · {formatDate(notif.createdAt)}
                      </Text>
                    </Section>
                    {i < section.items.length - 1 && (
                      <Hr style={innerDividerStyle} />
                    )}
                  </React.Fragment>
                ))}
              </Section>
            </React.Fragment>
          ))}

          <Hr style={dividerStyle} />

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href={`${appUrl}/notifications`} style={ctaStyle}>
              View All Notifications →
            </Button>
          </Section>

          <Section style={{ textAlign: 'center', margin: '16px 0' }}>
            <Button href={`${appUrl}/notifications/preferences`} style={secondaryCtaStyle}>
              Manage Email Preferences
            </Button>
          </Section>

          <Text style={footerNoteStyle}>
            You're receiving this digest because you have community notifications set to "digest" mode.
          </Text>
        </Container>

        <Section style={footerStyle}>
          <Text style={footerTextStyle}>© {new Date().getFullYear()} Evolved Pros · evolvedpros.com</Text>
          <Text style={footerTextStyle}>
            To stop receiving digests, update your{' '}
            <a href={`${appUrl}/notifications/preferences`} style={{ color: '#68a2b9' }}>
              notification preferences
            </a>.
          </Text>
        </Section>
      </Body>
    </Html>
  )
}

const bodyStyle: React.CSSProperties = { backgroundColor: '#112535', fontFamily: 'Barlow, -apple-system, sans-serif', margin: 0, padding: 0 }
const headerStyle: React.CSSProperties = { backgroundColor: '#0d1c27', padding: '24px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)' }
const logoStyle: React.CSSProperties = { fontFamily: '"Barlow Condensed", sans-serif', fontSize: '20px', fontWeight: 700, letterSpacing: '0.15em', color: '#ffffff', margin: 0 }
const containerStyle: React.CSSProperties = { maxWidth: '560px', margin: '0 auto', padding: '40px' }
const headingStyle: React.CSSProperties = { fontFamily: '"Playfair Display", Georgia, serif', fontSize: '48px', fontWeight: 900, color: '#faf9f7', margin: '0 0 20px', lineHeight: 1.1 }
const textStyle: React.CSSProperties = { fontSize: '16px', lineHeight: 1.6, color: 'rgba(250,249,247,0.8)', margin: '0 0 32px' }
const sectionLabelStyle: React.CSSProperties = { fontFamily: '"Barlow Condensed", sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 6px' }
const sectionBoxStyle: React.CSSProperties = { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px', overflow: 'hidden' }
const notifRowStyle: React.CSSProperties = { padding: '16px 20px' }
const notifTitleStyle: React.CSSProperties = { fontSize: '13px', fontWeight: 700, color: '#faf9f7', margin: '0 0 4px' }
const notifBodyStyle: React.CSSProperties = { fontSize: '13px', color: 'rgba(250,249,247,0.7)', margin: '0 0 6px', lineHeight: 1.5 }
const notifMetaStyle: React.CSSProperties = { fontFamily: '"Barlow Condensed", sans-serif', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a8a96', margin: 0 }
const innerDividerStyle: React.CSSProperties = { borderColor: 'rgba(255,255,255,0.06)', margin: 0 }
const dividerStyle: React.CSSProperties = { borderColor: 'rgba(255,255,255,0.06)', margin: '8px 0 24px' }
const ctaStyle: React.CSSProperties = { backgroundColor: '#ef0e30', color: '#ffffff', fontFamily: '"Barlow Condensed", sans-serif', fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 32px', borderRadius: '4px', textDecoration: 'none', display: 'inline-block' }
const secondaryCtaStyle: React.CSSProperties = { ...ctaStyle, backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }
const footerNoteStyle: React.CSSProperties = { fontSize: '12px', color: '#7a8a96', margin: '24px 0 0', textAlign: 'center', fontStyle: 'italic' }
const footerStyle: React.CSSProperties = { borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px 40px', textAlign: 'center' }
const footerTextStyle: React.CSSProperties = { fontSize: '12px', color: '#7a8a96', margin: '0 0 4px' }
