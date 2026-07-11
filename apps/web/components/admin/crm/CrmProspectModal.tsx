'use client'

import { useState } from 'react'
import {
  CRM_COLUMNS,
  CRM_STATUSES,
  type CrmProspect,
  type CrmStage,
  type CrmStatus,
} from '@/lib/admin/crm'

interface SavePayload {
  id?: string
  full_name: string
  email: string
  phone?: string
  company?: string
  notes?: string
  source?: string
  stage: CrmStage
  status: CrmStatus
}

interface CrmProspectModalProps {
  prospect: CrmProspect | null
  busy?: boolean
  onClose: () => void
  onSave: (payload: SavePayload) => void | Promise<void>
  onDelete?: () => void | Promise<void>
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 40,
  padding: '8px 12px',
  fontFamily: '"Barlow", sans-serif',
  fontSize: 13,
  border: '1px solid rgba(27,60,90,0.14)',
  borderRadius: 4,
  background: '#fff',
  color: '#1b3c5a',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: '"Barlow Condensed", sans-serif',
  fontWeight: 700,
  fontSize: 10,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: '#7a8a96',
  marginBottom: 6,
}

export function CrmProspectModal({
  prospect,
  busy = false,
  onClose,
  onSave,
  onDelete,
}: CrmProspectModalProps) {
  const isEdit = !!prospect
  const [fullName, setFullName] = useState(prospect?.full_name ?? '')
  const [email, setEmail] = useState(prospect?.email ?? '')
  const [phone, setPhone] = useState(prospect?.phone ?? '')
  const [company, setCompany] = useState(prospect?.company ?? '')
  const [notes, setNotes] = useState(prospect?.notes ?? '')
  const [source, setSource] = useState(prospect?.source ?? '')
  const [stage, setStage] = useState<CrmStage>(prospect?.stage ?? 'lead')
  const [status, setStatus] = useState<CrmStatus>(prospect?.status ?? 'active')
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) {
      setError('Name is required.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Valid email is required.')
      return
    }
    setError(null)
    await onSave({
      id: prospect?.id,
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
      notes: notes.trim() || undefined,
      source: source.trim() || undefined,
      stage,
      status,
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit prospect' : 'Add prospect'}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(17,37,53,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 8,
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 24,
          borderTop: '3px solid #C9A84C',
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p
              className="font-condensed font-bold uppercase tracking-[0.18em] text-[11px]"
              style={{ color: '#C9A84C', margin: 0 }}
            >
              CRM
            </p>
            <h2
              className="font-display font-black text-[22px]"
              style={{ color: '#112535', margin: '4px 0 0' }}
            >
              {isEdit ? 'Edit prospect' : 'Add prospect'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              lineHeight: 1,
              color: '#7a8a96',
              cursor: 'pointer',
              minWidth: 36,
              minHeight: 36,
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={e => void submit(e)} className="space-y-3">
          <div>
            <label style={labelStyle} htmlFor="crm-name">
              Full name
            </label>
            <input
              id="crm-name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              style={inputStyle}
              required
              autoFocus
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="crm-email">
              Email
            </label>
            <input
              id="crm-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label style={labelStyle} htmlFor="crm-phone">
                Phone
              </label>
              <input
                id="crm-phone"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle} htmlFor="crm-company">
                Company
              </label>
              <input
                id="crm-company"
                value={company}
                onChange={e => setCompany(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label style={labelStyle} htmlFor="crm-stage">
                Stage
              </label>
              <select
                id="crm-stage"
                value={stage}
                onChange={e => setStage(e.target.value as CrmStage)}
                style={inputStyle}
              >
                {CRM_COLUMNS.map(c => (
                  <option key={c.stage} value={c.stage}>
                    {c.label} — {c.desc}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle} htmlFor="crm-status">
                Status
              </label>
              <select
                id="crm-status"
                value={status}
                onChange={e => setStatus(e.target.value as CrmStatus)}
                style={inputStyle}
              >
                {CRM_STATUSES.map(s => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle} htmlFor="crm-source">
              Source
            </label>
            <input
              id="crm-source"
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="e.g. Live keynote, LinkedIn, referral"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="crm-notes">
              Notes
            </label>
            <textarea
              id="crm-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="Context, objections, next step…"
            />
          </div>

          {error && (
            <p className="font-body text-[13px]" style={{ color: '#ef0e30', margin: 0 }}>
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div>
              {isEdit && onDelete && (
                confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onDelete()}
                      className="font-condensed font-bold uppercase text-[11px] tracking-wider px-3 py-2 rounded"
                      style={{ background: 'rgba(239,14,48,0.1)', color: '#ef0e30', border: 'none', cursor: 'pointer' }}
                    >
                      Confirm delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="font-condensed text-[11px]"
                      style={{ background: 'none', border: 'none', color: '#7a8a96', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="font-condensed font-bold uppercase text-[11px] tracking-wider"
                    style={{ background: 'none', border: 'none', color: '#ef0e30', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                )
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="font-condensed font-bold uppercase tracking-[0.12em] text-[12px] rounded px-4 py-2"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(27,60,90,0.14)',
                  color: '#1b3c5a',
                  cursor: 'pointer',
                  minHeight: 40,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="font-condensed font-bold uppercase tracking-[0.12em] text-[12px] rounded px-4 py-2"
                style={{
                  background: '#1b3c5a',
                  border: 'none',
                  color: '#fff',
                  cursor: busy ? 'wait' : 'pointer',
                  minHeight: 40,
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add prospect'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
