'use client'

import { useId, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Tooltip } from '@/components/ui/Tooltip'
import { INQUIRE_BOOKING_LABEL, INQUIRE_BOOKING_TOOLTIP } from '@/lib/live/s4-cta'
import { BookingInquiryForm, BookingInquiryHeading } from './BookingInquiryForm'

const FBC = 'Barlow Condensed, sans-serif'

export { INQUIRE_BOOKING_LABEL, INQUIRE_BOOKING_TOOLTIP }

export function BookingInquiryModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const prefix = useId().replace(/:/g, '')

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel="Inquire about booking"
      maxWidth={560}
      panelStyle={{
        background: 'var(--bg-surface)',
        color: 'var(--text-1)',
        borderRadius: 2,
        border: '1px solid var(--border-soft2)',
        borderTop: '3px solid var(--brand-gold)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div className="ep-card-pad" style={{ padding: 'clamp(20px, 4vw, 32px)' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '-4px -4px 8px 0' }}>
          <button
            type="button"
            onClick={onClose}
            className="ep-pressable ep-touch-target"
            aria-label="Close inquiry form"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-3)',
              fontFamily: FBC,
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              minHeight: 40,
              padding: '8px 10px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
        <BookingInquiryHeading compact />
        <BookingInquiryForm idPrefix={`inq-${prefix}`} compact />
      </div>
    </Modal>
  )
}

export function InquireBookingButton({
  children = INQUIRE_BOOKING_LABEL,
  className,
  style,
  tooltip = INQUIRE_BOOKING_TOOLTIP,
}: {
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  tooltip?: string | null
}) {
  const [open, setOpen] = useState(false)

  const button = (
    <button
      type="button"
      className={className}
      style={style}
      onClick={() => setOpen(true)}
    >
      {children}
    </button>
  )

  return (
    <>
      {tooltip ? <Tooltip content={tooltip}>{button}</Tooltip> : button}
      <BookingInquiryModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
