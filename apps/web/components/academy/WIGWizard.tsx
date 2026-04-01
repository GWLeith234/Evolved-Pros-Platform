'use client'

import { useState, useEffect } from 'react'

const BLUE = '#60A5FA'
const GOLD = '#C9A84C'

type Domain = 'professional' | 'financial' | 'health' | 'relational'

const DOMAINS: { id: Domain; label: string }[] = [
  { id: 'professional', label: 'Professional' },
  { id: 'financial',    label: 'Financial'    },
  { id: 'health',       label: 'Health'       },
  { id: 'relational',   label: 'Relational'   },
]

const DOMAIN_PROMPTS: Record<Domain, { from: string; to: string }> = {
  professional: { from: 'e.g. "$180k revenue / year"',     to: 'e.g. "$280k revenue / year"'     },
  financial:    { from: 'e.g. "$15k in savings"',           to: 'e.g. "$50k in savings"'           },
  health:       { from: 'e.g. "200 lbs, no gym routine"',   to: 'e.g. "180 lbs, 4× per week"'     },
  relational:   { from: 'e.g. "Sporadic client contact"',   to: 'e.g. "Weekly touchpoints, 3 mentors"' },
}

interface WIGContent { from: string; to: string; by: string; statement: string }
interface SavedWIG   { id: string; domain: string; content: WIGContent; updated_at: string }

interface WizardState {
  step: 1 | 2 | 3 | 4
  from: string; to: string; by: string; statement: string
}

const EMPTY_WIZARD: WizardState = { step: 1, from: '', to: '', by: '', statement: '' }

interface Props { courseId: string; domain?: Domain }

function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function WIGWizard({ courseId, domain: defaultDomain = 'professional' }: Props) {
  const [activeDomain, setActiveDomain] = useState<Domain>(defaultDomain)
  const [savedWIGs, setSavedWIGs]       = useState<Partial<Record<Domain, SavedWIG>>>({})
  const [wizards, setWizards]           = useState<Record<Domain, WizardState>>({
    professional: EMPTY_WIZARD, financial: EMPTY_WIZARD, health: EMPTY_WIZARD, relational: EMPTY_WIZARD,
  })
  const [editing, setEditing]   = useState<Domain | null>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/strategic-plans?course_id=${encodeURIComponent(courseId)}`)
      .then(r => r.json())
      .then((data: { plans?: SavedWIG[] }) => {
        const map: Partial<Record<Domain, SavedWIG>> = {}
        for (const plan of data.plans ?? []) {
          map[plan.domain as Domain] = plan
        }
        setSavedWIGs(map)
      })
      .catch(() => {/* ignore */})
      .finally(() => setLoading(false))
  }, [courseId])

  function updateWizard(domain: Domain, patch: Partial<WizardState>) {
    setWizards(prev => ({ ...prev, [domain]: { ...prev[domain], ...patch } }))
  }

  function autoStatement(w: WizardState): string {
    const parts = [w.from && `From ${w.from}`, w.to && `to ${w.to}`, w.by && `by ${formatDate(w.by)}`]
    return parts.filter(Boolean).join(' ')
  }

  function goToStep(domain: Domain, step: 1 | 2 | 3 | 4) {
    if (step === 4) {
      const w = wizards[domain]
      const stmt = autoStatement(w)
      updateWizard(domain, { step, statement: stmt || w.statement })
    } else {
      updateWizard(domain, { step })
    }
  }

  async function handleSave(domain: Domain) {
    const w = wizards[domain]
    setSaving(true); setSaveError(null)
    try {
      const res = await fetch('/api/strategic-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId, domain,
          content: { from: w.from, to: w.to, by: w.by, statement: w.statement },
        }),
      })
      const json = await res.json() as { plan?: SavedWIG; error?: string }
      if (!res.ok) { setSaveError(json.error ?? 'Failed to save'); return }
      if (json.plan) {
        setSavedWIGs(prev => ({ ...prev, [domain]: json.plan! }))
        setEditing(null)
      }
    } finally {
      setSaving(false)
    }
  }

  function startEdit(domain: Domain) {
    const saved = savedWIGs[domain]
    if (saved) {
      setWizards(prev => ({
        ...prev,
        [domain]: { step: 1, from: saved.content.from, to: saved.content.to, by: saved.content.by, statement: saved.content.statement },
      }))
    }
    setEditing(domain)
  }

  const saved        = savedWIGs[activeDomain]
  const isEditing    = editing === activeDomain
  const showWizard   = !saved || isEditing
  const w            = wizards[activeDomain]

  return (
    <div style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, margin: '0 0 4px' }}>
          WIG Wizard
        </p>
        <p style={{ color: '#faf9f7', fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>Wildly Important Goals</p>
        <p style={{ color: 'rgba(250,249,247,0.4)', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
          Define one WIG per strategic domain. One goal per domain — executed relentlessly.
        </p>
      </div>

      {/* Domain tab bar */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {DOMAINS.map(d => {
          const hasSaved = !!savedWIGs[d.id]
          const isActive = activeDomain === d.id
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => { setActiveDomain(d.id); if (editing && editing !== d.id) setEditing(null) }}
              style={{
                fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                backgroundColor: isActive ? BLUE : 'rgba(255,255,255,0.05)',
                color: isActive ? '#0A0F18' : hasSaved ? BLUE : 'rgba(250,249,247,0.5)',
                position: 'relative', transition: 'all 0.15s',
              }}
            >
              {d.label}
              {hasSaved && !isActive && (
                <span style={{ position: 'absolute', top: '4px', right: '4px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: BLUE }} />
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <p style={{ color: 'rgba(250,249,247,0.2)', fontSize: '12px', fontFamily: '"Barlow Condensed", sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Loading…</p>
      ) : showWizard ? (
        <WizardForm
          domain={activeDomain}
          wizard={w}
          prompts={DOMAIN_PROMPTS[activeDomain]}
          saving={saving}
          saveError={saveError}
          isEditing={isEditing}
          onUpdateWizard={patch => updateWizard(activeDomain, patch)}
          onGoToStep={step => goToStep(activeDomain, step)}
          onSave={() => handleSave(activeDomain)}
          onCancelEdit={() => setEditing(null)}
        />
      ) : saved ? (
        <SavedCard wig={saved} onEdit={() => startEdit(activeDomain)} color={BLUE} />
      ) : null}
    </div>
  )
}

function WizardForm({ domain, wizard: w, prompts, saving, saveError, isEditing, onUpdateWizard, onGoToStep, onSave, onCancelEdit }: {
  domain: Domain; wizard: WizardState; prompts: { from: string; to: string }
  saving: boolean; saveError: string | null; isEditing: boolean
  onUpdateWizard: (p: Partial<WizardState>) => void
  onGoToStep: (s: 1 | 2 | 3 | 4) => void
  onSave: () => void
  onCancelEdit: () => void
}) {
  const STEPS = 4
  const stepLabels = ['Current state', 'Target state', 'Deadline', 'Your WIG']

  return (
    <div>
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        {Array.from({ length: STEPS }, (_, i) => {
          const n = i + 1 as 1|2|3|4
          const done = w.step > n
          const active = w.step === n
          return (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                backgroundColor: active ? BLUE : done ? `${BLUE}33` : 'rgba(255,255,255,0.07)',
                border: `2px solid ${active ? BLUE : done ? BLUE : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                {done
                  ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 2.5" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '11px', color: active ? '#0A0F18' : 'rgba(250,249,247,0.3)' }}>{n}</span>
                }
              </div>
              {n < STEPS && <div style={{ width: '20px', height: '2px', backgroundColor: done ? `${BLUE}55` : 'rgba(255,255,255,0.08)', borderRadius: '1px' }} />}
            </div>
          )
        })}
        <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: BLUE, marginLeft: '8px' }}>
          Step {w.step} of {STEPS} — {stepLabels[w.step - 1]}
        </span>
      </div>

      {/* Step content */}
      {w.step === 1 && (
        <StepInput
          label="Where are you now?"
          sublabel="Be specific and measurable."
          placeholder={prompts.from}
          value={w.from}
          onChange={v => onUpdateWizard({ from: v })}
          color={BLUE}
          canAdvance={w.from.trim().length > 0}
          onNext={() => onGoToStep(2)}
        />
      )}
      {w.step === 2 && (
        <StepInput
          label="Where do you need to be?"
          sublabel="Make it a stretch. If it doesn't scare you slightly, aim higher."
          placeholder={prompts.to}
          value={w.to}
          onChange={v => onUpdateWizard({ to: v })}
          color={BLUE}
          canAdvance={w.to.trim().length > 0}
          onNext={() => onGoToStep(3)}
          onBack={() => onGoToStep(1)}
        />
      )}
      {w.step === 3 && (
        <div>
          <p style={{ color: '#faf9f7', fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>By when?</p>
          <p style={{ color: 'rgba(250,249,247,0.4)', fontSize: '13px', margin: '0 0 16px' }}>Set a real deadline. A goal without a date is a wish.</p>
          <input
            type="date"
            value={w.by}
            onChange={e => onUpdateWizard({ by: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${w.by ? BLUE + '44' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '6px', padding: '10px 14px', color: w.by ? '#faf9f7' : 'rgba(250,249,247,0.3)',
              fontSize: '14px', outline: 'none', fontFamily: 'inherit',
              colorScheme: 'dark',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button type="button" onClick={() => onGoToStep(2)} style={backBtnStyle}>← Back</button>
            <button type="button" onClick={() => onGoToStep(4)} disabled={!w.by}
              style={{ ...nextBtnStyle, backgroundColor: w.by ? BLUE : `${BLUE}22`, color: w.by ? '#0A0F18' : `${BLUE}55`, cursor: w.by ? 'pointer' : 'default' }}>
              Preview WIG →
            </button>
          </div>
        </div>
      )}
      {w.step === 4 && (
        <div>
          <p style={{ color: '#faf9f7', fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>Your Wildly Important Goal</p>
          <p style={{ color: 'rgba(250,249,247,0.4)', fontSize: '13px', margin: '0 0 16px' }}>This is your WIG statement. Edit it until it's exactly right.</p>
          <textarea
            value={w.statement}
            onChange={e => onUpdateWizard({ statement: e.target.value })}
            rows={4}
            style={{
              width: '100%', backgroundColor: 'rgba(255,255,255,0.04)',
              border: `1px solid ${BLUE}44`, borderRadius: '6px', padding: '14px 16px',
              color: '#faf9f7', fontSize: '15px', lineHeight: 1.65, fontWeight: 600,
              resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
          {saveError && <p style={{ color: '#ef0e30', fontSize: '12px', margin: '8px 0 0' }}>{saveError}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => onGoToStep(3)} style={backBtnStyle}>← Back</button>
            <button type="button" onClick={onSave} disabled={!w.statement.trim() || saving}
              style={{ ...nextBtnStyle, backgroundColor: w.statement.trim() ? GOLD : `${GOLD}22`, color: w.statement.trim() ? '#0A0F18' : `${GOLD}55`, cursor: w.statement.trim() ? 'pointer' : 'default' }}>
              {saving ? 'Saving…' : 'Save WIG'}
            </button>
            {isEditing && (
              <button type="button" onClick={onCancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(250,249,247,0.25)', padding: 0 }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StepInput({ label, sublabel, placeholder, value, onChange, color, canAdvance, onNext, onBack }: {
  label: string; sublabel: string; placeholder: string; value: string
  onChange: (v: string) => void; color: string; canAdvance: boolean
  onNext: () => void; onBack?: () => void
}) {
  return (
    <div>
      <p style={{ color: '#faf9f7', fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>{label}</p>
      <p style={{ color: 'rgba(250,249,247,0.4)', fontSize: '13px', margin: '0 0 16px' }}>{sublabel}</p>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && canAdvance) onNext() }}
        placeholder={placeholder}
        autoFocus
        style={{
          width: '100%', backgroundColor: 'rgba(255,255,255,0.04)',
          border: `1px solid ${canAdvance ? color + '44' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '6px', padding: '12px 14px', color: '#faf9f7', fontSize: '14px',
          outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s',
        }}
      />
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        {onBack && <button type="button" onClick={onBack} style={backBtnStyle}>← Back</button>}
        <button type="button" onClick={onNext} disabled={!canAdvance}
          style={{ ...nextBtnStyle, backgroundColor: canAdvance ? color : `${color}22`, color: canAdvance ? '#0A0F18' : `${color}55`, cursor: canAdvance ? 'pointer' : 'default' }}>
          Next →
        </button>
      </div>
    </div>
  )
}

function SavedCard({ wig, onEdit, color }: { wig: SavedWIG; onEdit: () => void; color: string }) {
  const c = wig.content
  const updatedDate = new Date(wig.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return (
    <div style={{ backgroundColor: `${color}0A`, border: `1px solid ${color}22`, borderRadius: '8px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color, margin: 0 }}>
          Wildly Important Goal · Saved {updatedDate}
        </p>
        <button type="button" onClick={onEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(250,249,247,0.3)', padding: 0 }}>
          Edit
        </button>
      </div>
      <p style={{ color: '#faf9f7', fontSize: '16px', fontWeight: 600, lineHeight: 1.55, margin: '0 0 16px' }}>{c.statement}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        {[['FROM', c.from], ['TO', c.to], ['BY', c.by ? formatDate(c.by) : '—']].map(([k, v]) => (
          <div key={k}>
            <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color, margin: '0 0 4px' }}>{k}</p>
            <p style={{ color: 'rgba(250,249,247,0.65)', fontSize: '13px', margin: 0, lineHeight: 1.4 }}>{v}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const backBtnStyle: React.CSSProperties = {
  background: 'none', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
  fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
  fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'rgba(250,249,247,0.4)', padding: '9px 18px', borderRadius: '4px',
}
const nextBtnStyle: React.CSSProperties = {
  fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
  fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
  padding: '9px 22px', borderRadius: '4px', border: 'none', transition: 'all 0.15s',
}
