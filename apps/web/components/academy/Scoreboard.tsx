'use client'

import { useState, useEffect } from 'react'

const GOLD = '#C9A84C'
const TEAL = '#0ABFA3'

interface ScoreboardRow {
  id: string
  wig_statement: string
  lag_label: string
  lag_current: number
  lag_target: number
  lag_unit: string
  lead_1_label: string
  lead_1_weekly_target: number
  lead_2_label: string
  lead_2_weekly_target: number
  updated_at: string
}

interface ScoreboardUpdate {
  id: string
  lag_value: number
  lead_1_count: number
  lead_2_count: number
  update_date: string
}

interface SetupForm {
  wigStatement: string
  lagLabel: string
  lagCurrent: string
  lagTarget: string
  lagUnit: string
  lead1Label: string
  lead1Target: string
  lead2Label: string
  lead2Target: string
}

interface Props {
  courseId: string
  initialWigStatement?: string
}

function fmtValue(unit: string, value: number): string {
  if (unit === '$') return `$${value.toLocaleString()}`
  if (unit === '%') return `${value}%`
  return `${value.toLocaleString()}${unit ? ` ${unit}` : ''}`
}

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const EMPTY_SETUP: SetupForm = {
  wigStatement: '', lagLabel: '', lagCurrent: '', lagTarget: '', lagUnit: '$',
  lead1Label: '', lead1Target: '', lead2Label: '', lead2Target: '',
}

export function Scoreboard({ courseId, initialWigStatement }: Props) {
  const [scoreboard, setScoreboard] = useState<ScoreboardRow | null>(null)
  const [updates, setUpdates]       = useState<ScoreboardUpdate[]>([])
  const [loading, setLoading]       = useState(true)
  const [mode, setMode]             = useState<'view' | 'setup'>('setup')

  const [setupForm, setSetupForm]   = useState<SetupForm>({ ...EMPTY_SETUP, wigStatement: initialWigStatement ?? '' })
  const [creating, setCreating]     = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [weeklyLag, setWeeklyLag]   = useState('')
  const [lead1Count, setLead1Count] = useState(0)
  const [lead2Count, setLead2Count] = useState(0)
  const [savingWeek, setSavingWeek] = useState(false)
  const [weekSaved, setWeekSaved]   = useState(false)
  const [weekError, setWeekError]   = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/scoreboards?course_id=${encodeURIComponent(courseId)}`)
      .then(r => r.json())
      .then((data: { scoreboard?: ScoreboardRow | null; updates?: ScoreboardUpdate[] }) => {
        if (data.scoreboard) {
          setScoreboard(data.scoreboard)
          setUpdates(data.updates ?? [])
          setMode('view')
          const latest = data.updates?.[0]
          setWeeklyLag(String(latest?.lag_value ?? data.scoreboard.lag_current))
          setLead1Count(latest?.lead_1_count ?? 0)
          setLead2Count(latest?.lead_2_count ?? 0)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [courseId])

  function startEdit() {
    if (!scoreboard) return
    setSetupForm({
      wigStatement: scoreboard.wig_statement,
      lagLabel:     scoreboard.lag_label,
      lagCurrent:   String(scoreboard.lag_current),
      lagTarget:    String(scoreboard.lag_target),
      lagUnit:      scoreboard.lag_unit,
      lead1Label:   scoreboard.lead_1_label,
      lead1Target:  String(scoreboard.lead_1_weekly_target),
      lead2Label:   scoreboard.lead_2_label,
      lead2Target:  String(scoreboard.lead_2_weekly_target),
    })
    setCreateError(null)
    setMode('setup')
  }

  function patchSetup(patch: Partial<SetupForm>) {
    setSetupForm(s => ({ ...s, ...patch }))
  }

  async function handleCreate() {
    if (!setupForm.wigStatement.trim() || creating) return
    setCreating(true)
    setCreateError(null)
    try {
      const isEditing = !!scoreboard
      const url    = isEditing ? `/api/scoreboards/${scoreboard.id}` : '/api/scoreboards'
      const method = isEditing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id:            courseId,
          wig_statement:        setupForm.wigStatement.trim(),
          lag_label:            setupForm.lagLabel.trim(),
          lag_current:          Number(setupForm.lagCurrent)  || 0,
          lag_target:           Number(setupForm.lagTarget)   || 0,
          lag_unit:             setupForm.lagUnit.trim(),
          lead_1_label:         setupForm.lead1Label.trim(),
          lead_1_weekly_target: Number(setupForm.lead1Target) || 0,
          lead_2_label:         setupForm.lead2Label.trim(),
          lead_2_weekly_target: Number(setupForm.lead2Target) || 0,
        }),
      })
      const json = await res.json() as { scoreboard?: ScoreboardRow; error?: string }
      if (!res.ok) { setCreateError(json.error ?? 'Failed to save'); return }
      if (json.scoreboard) {
        setScoreboard(json.scoreboard)
        if (!scoreboard) {
          // Fresh creation — reset weekly form to scoreboard's baseline
          setWeeklyLag(String(json.scoreboard.lag_current))
          setLead1Count(0)
          setLead2Count(0)
          setUpdates([])
        }
        setMode('view')
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleSaveWeek() {
    if (!scoreboard || savingWeek) return
    setSavingWeek(true)
    setWeekError(null)
    setWeekSaved(false)
    try {
      const res = await fetch(`/api/scoreboards/${scoreboard.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lag_value:    Number(weeklyLag) || 0,
          lead_1_count: lead1Count,
          lead_2_count: lead2Count,
          update_date:  new Date().toISOString().split('T')[0],
        }),
      })
      const json = await res.json() as { update?: ScoreboardUpdate; error?: string }
      if (!res.ok) { setWeekError(json.error ?? 'Failed to save'); return }
      if (json.update) {
        setUpdates(prev => {
          const filtered = prev.filter(u => u.update_date !== json.update!.update_date)
          return [json.update!, ...filtered].slice(0, 4)
        })
        setWeekSaved(true)
      }
    } finally {
      setSavingWeek(false)
    }
  }

  if (loading) {
    return (
      <div style={card}>
        <p style={{ color: 'rgba(250,249,247,0.2)', fontFamily: '"Barlow Condensed", sans-serif', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Loading scoreboard…
        </p>
      </div>
    )
  }

  /* ── SETUP / EDIT FORM ─────────────────────────────────────────────── */
  if (mode === 'setup') {
    const canSubmit = setupForm.wigStatement.trim().length > 0
    return (
      <div style={card}>
        <div style={{ marginBottom: '24px' }}>
          <p style={eyebrow}>Accountability Scoreboard</p>
          <p style={{ color: '#faf9f7', fontSize: '15px', fontWeight: 600, margin: '0 0 6px' }}>
            {scoreboard ? 'Edit Scoreboard' : 'Create Your Scoreboard'}
          </p>
          <p style={{ color: 'rgba(250,249,247,0.4)', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
            Define your WIG, lag measure, and two lead measures you&apos;ll track weekly.
          </p>
        </div>

        {/* WIG Statement */}
        <div style={{ marginBottom: '20px' }}>
          <label style={fieldLabel}>WIG Statement</label>
          <textarea
            value={setupForm.wigStatement}
            onChange={e => patchSetup({ wigStatement: e.target.value })}
            placeholder="From $180k to $280k revenue by December 31, 2026"
            rows={3}
            style={textareaS}
          />
        </div>

        {/* Lag measure */}
        <div style={{ marginBottom: '20px' }}>
          <label style={fieldLabel}>Lag Measure</label>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 72px', gap: '8px' }}>
            <input value={setupForm.lagLabel}   onChange={e => patchSetup({ lagLabel:   e.target.value })} placeholder="e.g. Revenue"  style={inputS} />
            <input value={setupForm.lagCurrent} onChange={e => patchSetup({ lagCurrent: e.target.value })} placeholder="Current" type="number" style={inputS} />
            <input value={setupForm.lagTarget}  onChange={e => patchSetup({ lagTarget:  e.target.value })} placeholder="Target"  type="number" style={inputS} />
            <input value={setupForm.lagUnit}    onChange={e => patchSetup({ lagUnit:    e.target.value })} placeholder="$"       style={inputS} />
          </div>
          <p style={{ color: 'rgba(250,249,247,0.22)', fontSize: '11px', margin: '5px 0 0' }}>
            Label · Current value · Target value · Unit ($, %, deals…)
          </p>
        </div>

        {/* Lead measure 1 */}
        <div style={{ marginBottom: '14px' }}>
          <label style={fieldLabel}>Lead Measure 1</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '8px' }}>
            <input value={setupForm.lead1Label}  onChange={e => patchSetup({ lead1Label:  e.target.value })} placeholder="e.g. Discovery calls"  style={inputS} />
            <input value={setupForm.lead1Target} onChange={e => patchSetup({ lead1Target: e.target.value })} placeholder="Weekly target" type="number" style={inputS} />
          </div>
        </div>

        {/* Lead measure 2 */}
        <div style={{ marginBottom: '28px' }}>
          <label style={fieldLabel}>Lead Measure 2</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '8px' }}>
            <input value={setupForm.lead2Label}  onChange={e => patchSetup({ lead2Label:  e.target.value })} placeholder="e.g. Proposals sent"   style={inputS} />
            <input value={setupForm.lead2Target} onChange={e => patchSetup({ lead2Target: e.target.value })} placeholder="Weekly target" type="number" style={inputS} />
          </div>
        </div>

        {createError && <p style={{ color: '#ef0e30', fontSize: '12px', margin: '0 0 12px' }}>{createError}</p>}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canSubmit || creating}
            style={{
              backgroundColor: canSubmit ? GOLD : `${GOLD}22`,
              color: canSubmit ? '#0A0F18' : `${GOLD}55`,
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '11px 28px', borderRadius: '4px', border: 'none',
              cursor: canSubmit ? 'pointer' : 'default', transition: 'all 0.15s',
            }}
          >
            {creating ? 'Saving…' : scoreboard ? 'Save Changes' : 'Create Scoreboard'}
          </button>
          {scoreboard && (
            <button
              type="button"
              onClick={() => setMode('view')}
              style={ghostBtn}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    )
  }

  /* ── ACTIVE SCOREBOARD VIEW ────────────────────────────────────────── */
  if (!scoreboard) return null

  const lagNum  = Number(weeklyLag) || 0
  const lagPct  = scoreboard.lag_target > 0
    ? Math.min(100, Math.round((lagNum / scoreboard.lag_target) * 100))
    : 0

  const leadMeasures = [
    {
      label:  scoreboard.lead_1_label  || 'Lead 1',
      target: scoreboard.lead_1_weekly_target,
      count:  lead1Count,
      onDec:  () => setLead1Count(c => Math.max(0, c - 1)),
      onInc:  () => setLead1Count(c => c + 1),
    },
    {
      label:  scoreboard.lead_2_label  || 'Lead 2',
      target: scoreboard.lead_2_weekly_target,
      count:  lead2Count,
      onDec:  () => setLead2Count(c => Math.max(0, c - 1)),
      onInc:  () => setLead2Count(c => c + 1),
    },
  ]

  return (
    <div style={{ backgroundColor: '#111926', border: `1px solid ${GOLD}22`, borderRadius: '8px', overflow: 'hidden' }}>
      {/* Gold top bar */}
      <div style={{ height: '3px', backgroundColor: GOLD }} />

      <div style={{ padding: '28px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <p style={eyebrow}>Accountability Scoreboard</p>
          <button type="button" onClick={startEdit} style={ghostBtn}>Edit</button>
        </div>

        {/* WIG statement */}
        <p style={{ color: GOLD, fontSize: 'clamp(14px, 1.8vw, 17px)', fontWeight: 700, fontStyle: 'italic', lineHeight: 1.55, margin: '0 0 28px' }}>
          &ldquo;{scoreboard.wig_statement}&rdquo;
        </p>

        {/* Lag measure */}
        {scoreboard.lag_label && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
              <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(250,249,247,0.45)' }}>
                {scoreboard.lag_label} <span style={{ color: 'rgba(250,249,247,0.25)', fontWeight: 400 }}>Lag</span>
              </span>
              <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '12px', color: GOLD }}>
                {fmtValue(scoreboard.lag_unit, lagNum)} → {fmtValue(scoreboard.lag_unit, scoreboard.lag_target)}
              </span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}>
              <div style={{ height: '100%', width: `${lagPct}%`, backgroundColor: GOLD, borderRadius: '4px', transition: 'width 0.4s ease', minWidth: lagPct > 0 ? '4px' : '0' }} />
            </div>
            <p style={{ color: 'rgba(250,249,247,0.22)', fontSize: '11px', margin: '5px 0 0', textAlign: 'right' }}>
              {lagPct}% to target
            </p>
          </div>
        )}

        {/* Lead measure cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          {leadMeasures.map(({ label, target, count, onDec, onInc }, i) => {
            const met = count >= target
            return (
              <div
                key={i}
                style={{
                  backgroundColor: '#0A0F18',
                  border: `1px solid ${met ? TEAL + '33' : GOLD + '22'}`,
                  borderRadius: '6px',
                  padding: '16px',
                }}
              >
                <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(250,249,247,0.4)', margin: '0 0 12px' }}>
                  {label} <span style={{ color: 'rgba(250,249,247,0.2)', fontWeight: 400 }}>Lead</span>
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {/* Counter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={onDec}
                      aria-label="Decrease"
                      style={{ width: '30px', height: '30px', borderRadius: '4px', border: `1px solid ${GOLD}44`, backgroundColor: 'transparent', color: GOLD, fontSize: '18px', lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      −
                    </button>
                    <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900, fontSize: '30px', color: met ? TEAL : '#faf9f7', minWidth: '36px', textAlign: 'center', lineHeight: 1 }}>
                      {count}
                    </span>
                    <button
                      type="button"
                      onClick={onInc}
                      aria-label="Increase"
                      style={{ width: '30px', height: '30px', borderRadius: '4px', border: `1px solid ${GOLD}44`, backgroundColor: 'transparent', color: GOLD, fontSize: '18px', lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      +
                    </button>
                  </div>
                  {/* Status */}
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: met ? TEAL : 'rgba(250,249,247,0.25)', margin: 0 }}>
                      {met ? '✓ Target met' : `${target - count} to go`}
                    </p>
                    <p style={{ color: 'rgba(250,249,247,0.22)', fontSize: '11px', margin: '3px 0 0' }}>
                      Target: {target}/wk
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Lag input + Save this week */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: updates.length > 0 ? '28px' : '0' }}>
          {scoreboard.lag_label && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'rgba(250,249,247,0.4)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                {scoreboard.lag_label}:
              </span>
              <input
                type="number"
                value={weeklyLag}
                onChange={e => { setWeeklyLag(e.target.value); setWeekSaved(false) }}
                style={{ width: '110px', backgroundColor: '#0A0F18', border: `1px solid ${GOLD}33`, borderRadius: '4px', padding: '8px 10px', color: '#faf9f7', fontSize: '14px', outline: 'none' }}
              />
            </div>
          )}
          <button
            type="button"
            onClick={handleSaveWeek}
            disabled={savingWeek}
            style={{
              backgroundColor: GOLD, color: '#0A0F18',
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '10px 24px', borderRadius: '4px', border: 'none',
              cursor: savingWeek ? 'default' : 'pointer',
            }}
          >
            {savingWeek ? 'Saving…' : 'Save this week'}
          </button>
          {weekSaved && (
            <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: TEAL }}>
              ✓ Saved
            </span>
          )}
          {weekError && !weekSaved && (
            <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '11px', color: '#ef0e30' }}>
              {weekError}
            </span>
          )}
        </div>

        {/* History */}
        {updates.length > 0 && (
          <div>
            <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(250,249,247,0.22)', margin: '0 0 10px' }}>
              Recent history
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {updates.map(u => {
                const l1Met = u.lead_1_count >= scoreboard.lead_1_weekly_target
                const l2Met = u.lead_2_count >= scoreboard.lead_2_weekly_target
                return (
                  <div
                    key={u.id}
                    style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr 1fr', gap: '8px', padding: '8px 12px', backgroundColor: '#0A0F18', borderRadius: '4px', alignItems: 'center' }}
                  >
                    <span style={{ color: 'rgba(250,249,247,0.3)', fontSize: '12px' }}>{fmtDate(u.update_date)}</span>
                    <span style={{ color: GOLD, fontSize: '12px', fontWeight: 600 }}>{fmtValue(scoreboard.lag_unit, u.lag_value)}</span>
                    <span style={{ fontSize: '12px', color: l1Met ? TEAL : 'rgba(250,249,247,0.45)' }}>
                      {scoreboard.lead_1_label ? `${scoreboard.lead_1_label.split(' ')[0]}: ` : ''}{u.lead_1_count}{l1Met ? ' ✓' : ''}
                    </span>
                    <span style={{ fontSize: '12px', color: l2Met ? TEAL : 'rgba(250,249,247,0.45)' }}>
                      {scoreboard.lead_2_label ? `${scoreboard.lead_2_label.split(' ')[0]}: ` : ''}{u.lead_2_count}{l2Met ? ' ✓' : ''}
                    </span>
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

/* ── shared micro-styles ──────────────────────────────────────────── */

const card: React.CSSProperties = {
  backgroundColor: '#111926',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '8px',
  padding: '28px',
}

const eyebrow: React.CSSProperties = {
  fontFamily: '"Barlow Condensed", sans-serif',
  fontWeight: 700,
  fontSize: '10px',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: GOLD,
  margin: 0,
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
  width: '100%',
  backgroundColor: '#0A0F18',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '4px',
  padding: '10px 12px',
  color: '#faf9f7',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
}

const textareaS: React.CSSProperties = {
  ...inputS,
  resize: 'vertical',
  fontFamily: 'inherit',
  lineHeight: 1.6,
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
