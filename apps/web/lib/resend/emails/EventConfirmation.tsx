import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from '@react-email/components'
import React from 'react'

interface EventConfirmationProps {
  displayName: string
  event: {
    id: string
    title: string
    eventType: 'live' | 'virtual' | 'inperson'
    startsAt: string
    endsAt: string | null
    zoomUrl: string | null
    description: string | null
  }
}

const FORMAT_LABELS = { live: 'Live Session', virtual: 'Virtual', inperson: 'In-Person' }

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
}

export function EventConfirmationEmail({ displayName, event }: EventConfirmationProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://evolvedpros.up.railway.app'
  const icsUrl = `${appUrl}/api/events/${event.id}/ics`
  const firstName = displayName.split(' ')[0] ?? displayName

  return (
    <Html>
      <Head />
      <Preview>You're registered for {event.title}</Preview>
      <Body style={bodyStyle}>
        <Section style={headerStyle}>
          <Text style={logoStyle}>EVOLVED<span style={{ color: '#ef0e30' }}>·</span>PROS</Text>
        </Section>

        <Container style={containerStyle}>
          <Heading style={headingStyle}>You're registered.</Heading>

          <Text style={textStyle}>
            {firstName}, you're confirmed for <strong style={{ color: '#faf9f7' }}>{event.title}</strong>.
            We'll see you there.
          </Text>

          {/* Event details */}
          <Section style={detailsBoxStyle}>
            <Text style={detailLabelStyle}>Event</Text>
            <Text style={detailValueStyle}>{event.title}</Text>

            <Text style={detailLabelStyle}>Date</Text>
            <Text style={detailValueStyle}>{formatDate(event.startsAt)}</Text>

            <Text style={detailLabelStyle}>Time</Text>
            <Text style={detailValueStyle}>{formatTime(event.startsAt)}{event.endsAt ? ` – ${formatTime(event.endsAt)}` : ''}</Text>

            <Text style={detailLabelStyle}>Format</Text>
            <Text style={detailValueStyle}>{FORMAT_LABELS[event.eventType]}</Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* Zoom link CTA */}
          {event.zoomUrl && (
            <Section style={{ textAlign: 'center', margin: '24px 0' }}>
              <Button href={event.zoomUrl} style={ctaStyle}>Join Event →</Button>
            </Section>
          )}

          {/* Add to Calendar */}
          <Section style={{ textAlign: 'center', margin: '16px 0' }}>
            <Button href={icsUrl} style={secondaryCtaStyle}>Add to Calendar</Button>
          </Section>

          <Text style={footerNoteStyle}>
            You'll receive a reminder 24 hours before the event starts.
          </Text>
        </Container>

        <Section style={footerStyle}>
          <Text style={footerTextStyle}>© {new Date().getFullYear()} Evolved Pros · evolvedpros.com</Text>
          <Text style={footerTextStyle}>You're receiving this because you registered for an event.</Text>
        </Section>
      </Body>
    </Html>
  )
}

const bodyStyle: React.CSSProperties = { backgroundColor: '#112535', fontFamily: 'Barlow, -apple-system, sans-serif', margin: 0, padding: 0 }
const headerStyle: React.CSSProperties = { backgroundColor: '#0d1c27', padding: '24px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)' }
const logoStyle: React.CSSProperties = { fontFamily: '"Barlow Condensed", sans-serif', fontSize: '20px', fontWeight: 700, letterSpacing: '0.15em', color: '#ffffff', margin: 0 }
const containerStyle: React.CSSProperties = { maxWidth: '560px', margin: '0 auto', padding: '40px' }
const headingStyle: React.CSSProperties = { fontFamily: '"Playfair Display", Georgia, serif', fontSize: '40px', fontWeight: 900, color: '#faf9f7', margin: '0 0 20px', lineHeight: 1.1 }
const textStyle: React.CSSProperties = { fontSize: '16px', lineHeight: 1.6, color: 'rgba(250,249,247,0.8)', margin: '0 0 24px' }
const detailsBoxStyle: React.CSSProperties = { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '20px 24px', border: '1px solid rgba(255,255,255,0.08)', margin: '0 0 24px' }
const detailLabelStyle: React.CSSProperties = { fontFamily: '"Barlow Condensed", sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7a8a96', margin: '0 0 2px' }
const detailValueStyle: React.CSSProperties = { fontSize: '14px', fontWeight: 600, color: '#faf9f7', margin: '0 0 14px' }
const dividerStyle: React.CSSProperties = { borderColor: 'rgba(255,255,255,0.06)', margin: '24px 0' }
const ctaStyle: React.CSSProperties = { backgroundColor: '#ef0e30', color: '#ffffff', fontFamily: '"Barlow Condensed", sans-serif', fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 32px', borderRadius: '4px', textDecoration: 'none', display: 'inline-block' }
const secondaryCtaStyle: React.CSSProperties = { ...ctaStyle, backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }
const footerNoteStyle: React.CSSProperties = { fontSize: '13px', color: '#7a8a96', margin: '24px 0 0', textAlign: 'center' }
const footerStyle: React.CSSProperties = { borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px 40px', textAlign: 'center' }
const footerTextStyle: React.CSSProperties = { fontSize: '12px', color: '#7a8a96', margin: '0 0 4px' }
