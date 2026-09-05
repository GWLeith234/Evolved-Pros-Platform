'use client'

import { BookingInquiryForm, BookingInquiryHeading } from './BookingInquiryForm'

// Shared LIVE booking intake. The hero + upcoming-dates Inquire CTAs open the
// same form in a modal; this section is the in-page destination for #book-george.

export function LiveBookingInquiry() {
  return (
    <section id="book-george" className="live-section-pad" style={{ margin: '0 auto 88px', scrollMarginTop: 24 }}>
      <div
        className="ep-card-pad"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-soft2)',
          borderTop: '3px solid var(--brand-gold)',
          padding: 'clamp(24px, 4vw, 40px)',
        }}
      >
        <BookingInquiryHeading />
        <div style={{ maxWidth: 680 }}>
          <BookingInquiryForm idPrefix="live" />
        </div>
      </div>
    </section>
  )
}
