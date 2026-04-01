'use client'

import { useState, useEffect } from 'react'

const GOLD  = '#C9A84C'
const TEAL  = '#0ABFA3'
const AMBER = '#F59E0B'
const RED   = '#ef0e30'

type PairState = 'loading' | 'no-partner' | 'pending-sent' | 'pending-received' | 'active'
type Outcome   = 'kept' | 'partial' | 'missed'

interface PairRow {
  id: string
  user_id: string
  partner_id: string
  course_id: string
  status: string
  paired_at: string | null
  created_at: string
}

interface PartnerProfile {
  id: string
  display_name: string | null
  full_name: string | null
  avatar_url: string | null
  email: string
}

interface CheckinRow {
  id: string
  user_id: string
  pair_id: string
  week_start: string
  commitment: string | null
  outcome: Outcome | null
  note: string | null
  created_at: string
}

interface StatusResponse {
  state: PairState
  pair: PairRow | null
  partner: PartnerProfile | null
  myCheckins: CheckinRow[]
  partnerCheckins: CheckinRow[]
}

interface Props {
  courseId: string
  currentUserId: string
}

function getInitials(p: PartnerProfile): string {
  const name = p.full_name ?? p.display_name ?? p.email
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function fmtWeek(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const OUTCOME_CONFIG: Record<Outcome, { label: string; color: string; bg: string }> = {
  kept:    { label: 'Kept ✓',    color: TEAL,  bg: `${TEAL}18`  },
  partial: { label: 'Partial ⟳', color: AMBER, bg: `${AMBER}18` },
  missed:  { label: 'Missed ✗',  color: RED,   bg: `${RED}12`   },
}

export function PartnerCheckin({ courseId, currentUserId }: Props) {
  const [pageState, setPageState]         = useState<PairState>('loading')
  const [pair, setPair]                   = useState<PairRow | null>(null)
  const [partner, setPartner]             = useState<PartnerProfile | null>(null)
  const [myCheckins, setMyCheckins]       = useState<CheckinRow[]>([])
  const [partnerCheckins, setPartnerCheckins] = useState<CheckinRow[]>([])

  // Invite form
  const [inviteEmail, setInviteEmail]   = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteSent, setInviteSent]     = useState(false)
  const [inviteError, setInviteError]   = useState<string | null>(null)

  // Check-in form
  const [commitment, setCommitment] = useState('')
  const [outcome, setOutcome]       = useState<Outcome | null>(null)
  const [note, setNote]             = useState('')
  const [ciSubmitting, setCiSubmitting] = useState(false)
  const [ciSaved, setCiSaved]           = useState(false)
  const [ciError, setCiError]           = useState<string | null>(null)

  // Cancel/accept
  const [actioning, setActioning] = useState(false)

  useEffect(() => {
    fetch(`/api/accountability/status?course_id=${encodeURIComponent(courseId)}`)
      .then(r => r.json())
      .then((data: StatusResponse) => {
        setPageState(data.state ?? 'no-partner')
        setPair(data.pair)
        setPartner(data.partner)
        setMyCheckins(data.myCheckins ?? [])
        setPartnerCheckins(data.partnerCheckins ?? [])
        // Pre-fill check-in form from current week's checkin if it exists
        if (data.myCheckins?.[0]) {
          const c = data.myCheckins[0]
          if (c.commitment) setCommitment(c.commitment)
          if (c.outcome)    setOutcome(c.outcome)
          if (c.note)       setNote(c.note ?? '')
        }
      })
      .catch(console.error)
  }, [courseId])

  async function handleInvite() {
    if (!inviteEmail.trim() || inviteSending) return
    setInviteSending(true)
    setInviteError(null)
    try {
      const res = await fetch('/api/accountability/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner_email: inviteEmail.trim(), course_id: courseId }),
      })
      const json = await res.json() as { pair?: PairRow; partner?: PartnerProfile; error?: string }
      if (!res.ok) { setInviteError(json.error ?? 'Failed to send invite'); return }
      setPair(json.pair ?? null)
      setPartner(json.partner ?? null)
      setInviteSent(true)
      setPageState('pending-sent')
    } finally {
      setInviteSending(false)
    }
  }

  async function handleCancel() {
    if (!pair || actioning) return
    setActioning(true)
    try {
      await fetch(`/api/accountability/${pair.id}`, { method: 'PATCH' })
      setPair(null)
      setPartner(null)
      setPageState('no-partner')
      setInviteSent(false)
      setInviteEmail('')
    } finally {
      setActioning(false)
    }
  }

  async function handleAccept() {
    if (!pair || actioning) return
    setActioning(true)
    try {
      const res = await fetch(`/api/accountability/${pair.id}/accept`, { method: 'PATCH' })
      const json = await res.json() as { pair?: PairRow; error?: string }
      if (!res.ok) return
      if (json.pair) setPair(json.pair)
      setPageState('active')
    } finally {
      setActioning(false)
    }
  }

  async function handleCheckinSubmit() {
    if (!pair || !commitment.trim() || !outcome || ciSubmitting) return
    setCiSubmitting(true)
    setCiError(null)
    setCiSaved(false)
    try {
      const res = await fetch('/api/partner-checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pair_id: pair.id, commitment, outcome, note }),
      })
      const json = await res.json() as { checkin?: CheckinRow; error?: string }
      if (!res.ok) { setCiError(json.error ?? 'Failed to save'); return }
      if (json.checkin) {
        setMyCheckins(prev => {
          const filtered = prev.filter(c => c.week_start !== json.checkin!.week_start)
          return [json.checkin!, ...filtered].slice(0, 4)
        })
        setCiSaved(true)
      }
    } finally {
      setCiSubmitting(false)
    }
  }

  const GOLD_EYEBROW: React.CSSProperties = {
    fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
    fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase',
    color: GOLD, margin: '0 0 4px',
  }

  /* ── LOADING ──────────────────────────────────────────────────── */
  if (pageState === 'loading') {
    return (
      <div style={surfaceCard}>
        <p style={{ color: 'rgba(250,249,247,0.2)', fontFamily: '"Barlow Condensed", sans-serif', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Loading partner status…
        </p>
      </div>
    )
  }

  /* ── NO PARTNER — invite form ────────────────────────────────── */
  if (pageState === 'no-partner') {
    const canInvite = inviteEmail.trim().length > 0
    return (
      <div style={surfaceCard}>
        <p style={GOLD_EYEBROW}>Accountability Partner</p>
        <p style={{ color: '#faf9f7', fontSize: '15px', fontWeight: 600, margin: '0 0 6px' }}>
          Find an accountability partner
        </p>
        <p style={{ color: 'rgba(250,249,247,0.4)', fontSize: '13px', lineHeight: 1.55, margin: '0 0 20px' }}>
          Your accountability partner sees your weekly check-ins and holds you to your commitments. Choose someone who will tell you the truth.
        </p>

        {inviteSent ? (
          <p style={{ color: TEAL, fontSize: '14px', fontWeight: 600 }}>
            ✓ Invite sent to {inviteEmail}. Waiting for them to accept.
          </p>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => { setInviteEmail(e.target.value); setInviteError(null) }}
              onKeyDown={e => { if (e.key === 'Enter') handleInvite() }}
              placeholder="Partner's email address"
              style={inputS}
            />
            <button
              type="button"
              onClick={handleInvite}
              disabled={!canInvite || inviteSending}
              style={{
                backgroundColor: canInvite ? GOLD : `${GOLD}22`,
                color:           canInvite ? '#0A0F18' : `${GOLD}55`,
                fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '10px 20px', borderRadius: '4px', border: 'none',
                cursor: canInvite ? 'pointer' : 'default', flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {inviteSending ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        )}
        {inviteError && <p style={{ color: RED, fontSize: '12px', margin: '8px 0 0' }}>{inviteError}</p>}
      </div>
    )
  }

  /* ── PENDING SENT ─────────────────────────────────────────────── */
  if (pageState === 'pending-sent') {
    const partnerName = partner
      ? (partner.full_name ?? partner.display_name ?? partner.email)
      : 'your partner'
    return (
      <div style={surfaceCard}>
        <p style={GOLD_EYEBROW}>Accountability Partner</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={avatarCircle('#666')}>
            <span style={{ color: '#faf9f7', fontSize: '12px', fontWeight: 700 }}>?</span>
          </div>
          <div>
            <p style={{ color: '#faf9f7', fontSize: '14px', fontWeight: 600, margin: 0 }}>{partnerName}</p>
            <p style={{ color: AMBER, fontSize: '12px', margin: '2px 0 0' }}>Invite pending — waiting to accept</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          disabled={actioning}
          style={ghostBtn}
        >
          {actioning ? 'Cancelling…' : 'Cancel invite'}
        </button>
      </div>
    )
  }

  /* ── PENDING RECEIVED ─────────────────────────────────────────── */
  if (pageState === 'pending-received') {
    const inviterName = partner
      ? (partner.full_name ?? partner.display_name ?? partner.email)
      : 'Someone'
    return (
      <div style={surfaceCard}>
        <p style={GOLD_EYEBROW}>Accountability Partner</p>
        <p style={{ color: '#faf9f7', fontSize: '14px', fontWeight: 600, margin: '0 0 6px' }}>
          {inviterName} wants to be your accountability partner
        </p>
        <p style={{ color: 'rgba(250,249,247,0.4)', fontSize: '13px', margin: '0 0 20px', lineHeight: 1.5 }}>
          Accept to begin sharing weekly check-ins and holding each other accountable.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleAccept}
            disabled={actioning}
            style={{
              backgroundColor: GOLD, color: '#0A0F18',
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '10px 24px', borderRadius: '4px', border: 'none',
              cursor: actioning ? 'default' : 'pointer',
            }}
          >
            {actioning ? 'Accepting…' : 'Accept'}
          </button>
          <button type="button" onClick={handleCancel} disabled={actioning} style={ghostBtn}>
            Decline
          </button>
        </div>
      </div>
    )
  }

  /* ── ACTIVE ──────────────────────────────────────────────────── */
  if (pageState !== 'active' || !pair || !partner) return null

  const partnerDisplayName = partner.full_name ?? partner.display_name ?? partner.email
  const latestPartnerCheckin = partnerCheckins[0] ?? null
  const canSubmitCheckin = commitment.trim().length > 0 && !!outcome

  return (
    <div style={{ backgroundColor: '#111926', border: `1px solid ${GOLD}22`, borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ height: '2px', backgroundColor: GOLD }} />
      <div style={{ padding: '28px' }}>
        <p style={{ ...GOLD_EYEBROW, marginBottom: '16px' }}>Accountability Partner</p>

        {/* Partner card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px', padding: '14px 16px', backgroundColor: '#0A0F18', borderRadius: '6px', border: `1px solid ${GOLD}18` }}>
          {partner.avatar_url ? (
            <img
              src={partner.avatar_url}
              alt={partnerDisplayName}
              style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div style={avatarCircle(GOLD)}>
              <span style={{ color: '#0A0F18', fontSize: '14px', fontWeight: 700 }}>{getInitials(partner)}</span>
            </div>
          )}
          <div>
            <p style={{ color: '#faf9f7', fontSize: '14px', fontWeight: 600, margin: 0 }}>{partnerDisplayName}</p>
            <p style={{ color: 'rgba(250,249,247,0.35)', fontSize: '12px', margin: '2px 0 0' }}>Your accountability partner</p>
          </div>
          <button type="button" onClick={handleCancel} disabled={actioning} style={{ ...ghostBtn, marginLeft: 'auto' }}>
            End partnership
          </button>
        </div>

        {/* Partner's latest check-in (read only) */}
        {latestPartnerCheckin && (
          <div style={{ marginBottom: '28px' }}>
            <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(250,249,247,0.3)', margin: '0 0 10px' }}>
              {partnerDisplayName}&apos;s latest check-in
            </p>
            <div style={{ backgroundColor: '#0A0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', padding: '14px 16px' }}>
              {latestPartnerCheckin.outcome && (
                <span style={{
                  display: 'inline-block', marginBottom: '8px',
                  backgroundColor: OUTCOME_CONFIG[latestPartnerCheckin.outcome].bg,
                  color:           OUTCOME_CONFIG[latestPartnerCheckin.outcome].color,
                  fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                  fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                  padding: '3px 10px', borderRadius: '3px',
                }}>
                  {OUTCOME_CONFIG[latestPartnerCheckin.outcome].label}
                </span>
              )}
              {latestPartnerCheckin.commitment && (
                <p style={{ color: 'rgba(250,249,247,0.7)', fontSize: '13px', lineHeight: 1.55, margin: '0 0 6px' }}>
                  {latestPartnerCheckin.commitment}
                </p>
              )}
              {latestPartnerCheckin.note && (
                <p style={{ color: 'rgba(250,249,247,0.4)', fontSize: '12px', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
                  &ldquo;{latestPartnerCheckin.note}&rdquo;
                </p>
              )}
              <p style={{ color: 'rgba(250,249,247,0.2)', fontSize: '11px', margin: '8px 0 0' }}>
                Week of {fmtWeek(latestPartnerCheckin.week_start)}
              </p>
            </div>
          </div>
        )}

        {/* My check-in form */}
        <div style={{ marginBottom: myCheckins.length > 0 ? '28px' : '0' }}>
          <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(250,249,247,0.3)', margin: '0 0 14px' }}>
            My weekly check-in
          </p>

          {/* Commitment */}
          <div style={{ marginBottom: '14px' }}>
            <label style={fieldLabel}>What did you commit to last week?</label>
            <textarea
              value={commitment}
              onChange={e => { setCommitment(e.target.value); setCiSaved(false) }}
              placeholder="e.g. 20 discovery calls, review my WIG each morning…"
              rows={3}
              style={textareaS}
            />
          </div>

          {/* Outcome selector */}
          <div style={{ marginBottom: '14px' }}>
            <label style={fieldLabel}>How did you do?</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['kept', 'partial', 'missed'] as Outcome[]).map(o => {
                const cfg = OUTCOME_CONFIG[o]
                const selected = outcome === o
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => { setOutcome(o); setCiSaved(false) }}
                    style={{
                      padding: '9px 18px', borderRadius: '4px', border: `1px solid ${selected ? cfg.color : 'rgba(255,255,255,0.1)'}`,
                      backgroundColor: selected ? cfg.bg : 'transparent',
                      color: selected ? cfg.color : 'rgba(250,249,247,0.4)',
                      fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                      fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Note */}
          <div style={{ marginBottom: '16px' }}>
            <label style={fieldLabel}>Note (optional) — What got in the way? What will you do differently?</label>
            <textarea
              value={note}
              onChange={e => { setNote(e.target.value); setCiSaved(false) }}
              placeholder="Be honest. Your partner will see this."
              rows={2}
              style={textareaS}
            />
          </div>

          {/* Submit row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleCheckinSubmit}
              disabled={!canSubmitCheckin || ciSubmitting}
              style={{
                backgroundColor: canSubmitCheckin ? GOLD : `${GOLD}22`,
                color:           canSubmitCheckin ? '#0A0F18' : `${GOLD}55`,
                fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '10px 24px', borderRadius: '4px', border: 'none',
                cursor: canSubmitCheckin ? 'pointer' : 'default',
              }}
            >
              {ciSubmitting ? 'Saving…' : 'Submit check-in'}
            </button>
            {ciSaved && (
              <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: TEAL }}>
                ✓ Saved
              </span>
            )}
            {ciError && !ciSaved && (
              <span style={{ fontSize: '12px', color: RED }}>{ciError}</span>
            )}
          </div>
        </div>

        {/* History */}
        {myCheckins.length > 0 && (
          <div>
            <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(250,249,247,0.22)', margin: '0 0 10px' }}>
              My recent check-ins
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myCheckins.map(c => {
                const cfg = c.outcome ? OUTCOME_CONFIG[c.outcome] : null
                return (
                  <div key={c.id} style={{ backgroundColor: '#0A0F18', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', padding: '10px 12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, textAlign: 'center', minWidth: '52px' }}>
                      <p style={{ color: 'rgba(250,249,247,0.3)', fontSize: '11px', margin: 0 }}>{fmtWeek(c.week_start)}</p>
                      {cfg && (
                        <span style={{ color: cfg.color, fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          {cfg.label}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {c.commitment && (
                        <p style={{ color: 'rgba(250,249,247,0.65)', fontSize: '12px', lineHeight: 1.45, margin: 0 }}>
                          {c.commitment.length > 100 ? c.commitment.slice(0, 100) + '…' : c.commitment}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── shared micro-styles ──────────────────────────────────────── */

const surfaceCard: React.CSSProperties = {
  backgroundColor: '#111926',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '8px',
  padding: '28px',
}

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontFamily: '"Barlow Condensed", sans-serif',
  fontWeight: 700,
  fontSize: '10px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(250,249,247,0.4)',
  marginBottom: '8px',
}

const inputS: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#0A0F18',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '4px',
  padding: '10px 12px',
  color: '#faf9f7',
  fontSize: '14px',
  outline: 'none',
  minWidth: 0,
}

const textareaS: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#0A0F18',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '4px',
  padding: '10px 12px',
  color: '#faf9f7',
  fontSize: '14px',
  outline: 'none',
  resize: 'vertical',
  fontFamily: 'inherit',
  lineHeight: 1.55,
  boxSizing: 'border-box',
}

const ghostBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: '"Barlow Condensed", sans-serif',
  fontWeight: 700,
  fontSize: '10px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'rgba(250,249,247,0.3)',
  padding: 0,
}

function avatarCircle(bg: string): React.CSSProperties {
  return {
    width: '44px', height: '44px', borderRadius: '50%',
    backgroundColor: bg, display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
  }
}
