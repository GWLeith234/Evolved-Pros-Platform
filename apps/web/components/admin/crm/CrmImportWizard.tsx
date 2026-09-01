'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Papa from 'papaparse'
import {
  CRM_CONSENT_BASES,
  parseTagInput,
  type CrmConsentBasis,
} from '@/lib/admin/crm'
import {
  CRM_IMPORT_BATCH_SIZE,
  CRM_IMPORT_TARGETS,
  CRM_IMPORT_TARGET_LABELS,
  CRM_PRESET_LABELS,
  addBatchResult,
  analyzeRows,
  autoMap,
  chunkRows,
  defaultSourceLabel,
  detectPreset,
  emptyBatchResult,
  mapRow,
  splitSheet,
  type CrmImportPreset,
  type CrmImportTarget,
  type ImportBatchResult,
  type MappedRow,
} from '@/lib/admin/crmImport'

/** ~25MB — a LinkedIn export of 30k connections is well under 10MB. */
const MAX_BYTES = 25 * 1024 * 1024

const STEPS = ['Upload', 'Mapping', 'Tagging', 'Preview', 'Import'] as const
type Step = (typeof STEPS)[number]

const CONSENT_LABELS: Record<CrmConsentBasis, string> = {
  express: 'Express — explicitly opted in',
  implied: 'Implied — existing business relationship',
  unknown: 'Unknown — not established',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 40,
  padding: '8px 12px',
  fontFamily: '"Barlow", sans-serif',
  fontSize: 13,
  border: '1px solid var(--admin-border)',
  borderRadius: 4,
  background: 'var(--admin-card)',
  color: 'var(--admin-text)',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: '"Barlow Condensed", sans-serif',
  fontWeight: 700,
  fontSize: 10,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--admin-text-2)',
  marginBottom: 6,
}

function btnStyle(kind: 'primary' | 'ghost' = 'primary'): React.CSSProperties {
  return {
    minHeight: 40,
    padding: '8px 18px',
    fontFamily: '"Barlow Condensed", sans-serif',
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    borderRadius: 4,
    cursor: 'pointer',
    background: kind === 'primary' ? 'var(--brand-teal)' : 'transparent',
    color: kind === 'primary' ? 'var(--navy-abyss)' : 'var(--admin-text)',
    border: kind === 'primary' ? 'none' : '1px solid var(--admin-border)',
  }
}

export function CrmImportWizard() {
  const [step, setStep] = useState<Step>('Upload')
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [dataRows, setDataRows] = useState<string[][]>([])
  const [preset, setPreset] = useState<CrmImportPreset>('generic')
  const [mapping, setMapping] = useState<CrmImportTarget[]>([])
  const [source, setSource] = useState('')
  const [consentBasis, setConsentBasis] = useState<CrmConsentBasis>('implied')
  const [tagsInput, setTagsInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(false)
  const [report, setReport] = useState<ImportBatchResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const mapped: MappedRow[] = useMemo(
    () => (mapping.length ? dataRows.map(r => mapRow(r, mapping)) : []),
    [dataRows, mapping],
  )
  const analysis = useMemo(() => analyzeRows(mapped), [mapped])
  const hasEmailColumn = mapping.includes('email')

  const onFile = useCallback((file: File) => {
    setError(null)
    setReport(null)
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please choose a .csv file.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError(`That file is ${(file.size / 1024 / 1024).toFixed(1)}MB — the limit is 25MB.`)
      return
    }
    setParsing(true)
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: false,
      complete: results => {
        setParsing(false)
        const sheet = splitSheet(results.data as string[][])
        if (!sheet) {
          setError(
            'No header row with an email column found in the first few lines. Check the file and try again.',
          )
          return
        }
        if (sheet.rows.length === 0) {
          setError('That file has a header but no data rows.')
          return
        }
        const detected = detectPreset(sheet.headers)
        setFileName(file.name)
        setHeaders(sheet.headers)
        setDataRows(sheet.rows)
        setPreset(detected)
        setMapping(autoMap(sheet.headers, detected))
        setSource(defaultSourceLabel(detected))
        setStep('Mapping')
      },
      error: () => {
        setParsing(false)
        setError('Could not read that file.')
      },
    })
  }, [])

  async function runImport() {
    setRunning(true)
    setError(null)
    setProgress(0)
    const batches = chunkRows(analysis.valid, CRM_IMPORT_BATCH_SIZE)
    let total = emptyBatchResult()
    // Invalid rows are counted here, client-side, so the report covers the
    // whole file rather than only the rows we sent. In-file duplicates are
    // reported separately from DB duplicates (see analysis.duplicatesInFile).
    total.invalid = analysis.invalid

    try {
      for (let i = 0; i < batches.length; i++) {
        const res = await fetch('/api/admin/crm/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rows: batches[i],
            source: source.trim(),
            consent_basis: consentBasis,
            tags: parseTagInput(tagsInput),
          }),
        })
        const json = (await res.json().catch(() => ({}))) as Partial<ImportBatchResult> & {
          error?: string
        }
        if (!res.ok) {
          setError(json.error ?? 'Import failed.')
          setRunning(false)
          setReport(total)
          return
        }
        total = addBatchResult(total, {
          imported: json.imported ?? 0,
          dupPros: json.dupPros ?? 0,
          dupMembers: json.dupMembers ?? 0,
          // The server re-counts invalid rows within a batch, but the batch was
          // already filtered client-side, so its count is 0 and would only
          // double-count what we recorded above.
          invalid: 0,
        })
        setProgress(Math.round(((i + 1) / batches.length) * 100))
      }
      setReport(total)
    } catch {
      setError('Network error during import.')
      setReport(total)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div style={{ maxWidth: 940 }}>
      <div className="mb-5">
        <Link
          href="/admin/crm"
          className="font-condensed font-bold uppercase text-[11px] tracking-wider"
          style={{ color: 'var(--admin-text-2)', textDecoration: 'none' }}
        >
          ← Prospects CRM
        </Link>
        <h1
          className="font-display font-black text-[28px]"
          style={{ color: 'var(--admin-text-strong)', margin: '4px 0 0' }}
        >
          Import CSV
        </h1>
        <p className="font-condensed text-[12px]" style={{ color: 'var(--admin-text-2)', margin: '2px 0 0' }}>
          LinkedIn connections, Google Contacts, or any CSV with an email column. Nothing is written
          until the final step.
        </p>
      </div>

      {/* Step rail */}
      <ol className="flex flex-wrap gap-2 mb-5" style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
        {STEPS.map((s, i) => {
          const active = s === step
          const done = STEPS.indexOf(step) > i
          return (
            <li
              key={s}
              className="font-condensed font-bold uppercase text-[10px] tracking-[0.14em] px-2.5 py-1.5 rounded"
              style={{
                background: active ? 'var(--brand-teal)' : 'var(--admin-subtle)',
                color: active ? 'var(--navy-abyss)' : done ? 'var(--admin-text)' : 'var(--admin-text-2)',
                border: '1px solid var(--admin-border)',
              }}
            >
              {i + 1}. {s}
            </li>
          )
        })}
      </ol>

      {error && (
        <p
          role="alert"
          className="font-body text-[13px] rounded px-3 py-2 mb-4"
          style={{
            color: 'var(--brand-red-hot)',
            background: 'var(--admin-subtle)',
            border: '1px solid var(--admin-border)',
          }}
        >
          {error}
        </p>
      )}

      <div
        className="rounded-md p-5"
        style={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)' }}
      >
        {/* ── 1. UPLOAD ─────────────────────────────────────────────── */}
        {step === 'Upload' && (
          <div>
            <label style={labelStyle} htmlFor="crm-import-file">CSV file (max 25MB)</label>
            <input
              id="crm-import-file"
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              disabled={parsing}
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) onFile(f)
              }}
              style={{ ...inputStyle, paddingTop: 9 }}
            />
            <p className="font-body text-[12px] mt-3" style={{ color: 'var(--admin-text-2)' }}>
              {parsing
                ? 'Parsing…'
                : "LinkedIn's Connections.csv starts with a few lines of notes before the real header — that's handled automatically."}
            </p>
          </div>
        )}

        {/* ── 2. MAPPING ────────────────────────────────────────────── */}
        {step === 'Mapping' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <p className="font-body text-[13px]" style={{ color: 'var(--admin-text)', margin: 0 }}>
                <strong>{fileName}</strong> · {dataRows.length.toLocaleString()} rows
              </p>
              <span
                className="font-condensed font-bold uppercase text-[10px] tracking-wider px-2 py-1 rounded"
                style={{
                  background: 'var(--admin-subtle)',
                  color: 'var(--brand-teal)',
                  border: '1px solid var(--admin-border)',
                }}
              >
                Detected: {CRM_PRESET_LABELS[preset]}
              </span>
            </div>

            <div className="mb-3">
              <label style={labelStyle} htmlFor="crm-import-preset">Source preset</label>
              <select
                id="crm-import-preset"
                value={preset}
                onChange={e => {
                  const p = e.target.value as CrmImportPreset
                  setPreset(p)
                  setMapping(autoMap(headers, p))
                  setSource(defaultSourceLabel(p))
                }}
                style={{ ...inputStyle, maxWidth: 340 }}
              >
                {(Object.keys(CRM_PRESET_LABELS) as CrmImportPreset[]).map(p => (
                  <option key={p} value={p}>{CRM_PRESET_LABELS[p]}</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['CSV column', 'First value', 'Imports as'].map(h => (
                      <th
                        key={h}
                        className="font-condensed font-bold uppercase text-[10px] tracking-[0.14em] text-left"
                        style={{
                          color: 'var(--admin-text-2)',
                          padding: '6px 8px',
                          borderBottom: '1px solid var(--admin-border)',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {headers.map((h, i) => (
                    <tr key={`${h}-${i}`}>
                      <td
                        className="font-body text-[13px]"
                        style={{ padding: '6px 8px', color: 'var(--admin-text)', whiteSpace: 'nowrap' }}
                      >
                        {h || <em style={{ color: 'var(--admin-text-2)' }}>(unnamed)</em>}
                      </td>
                      <td
                        className="font-body text-[12px] truncate"
                        style={{ padding: '6px 8px', color: 'var(--admin-text-2)', maxWidth: 240 }}
                      >
                        {dataRows[0]?.[i] || '—'}
                      </td>
                      <td style={{ padding: '4px 8px' }}>
                        <select
                          aria-label={`Map column ${h || i + 1}`}
                          value={mapping[i] ?? 'ignore'}
                          onChange={e => {
                            const next = [...mapping]
                            next[i] = e.target.value as CrmImportTarget
                            setMapping(next)
                          }}
                          style={{ ...inputStyle, minHeight: 34, maxWidth: 220 }}
                        >
                          {CRM_IMPORT_TARGETS.map(t => (
                            <option key={t} value={t}>{CRM_IMPORT_TARGET_LABELS[t]}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!hasEmailColumn && (
              <p className="font-body text-[13px] mt-3" style={{ color: 'var(--brand-red-hot)' }}>
                Map one column to <strong>Email</strong> — it is the identity for every prospect.
              </p>
            )}
            {mapping.filter(m => m === 'full_name').length > 1 && (
              <p className="font-body text-[12px] mt-2" style={{ color: 'var(--admin-text-2)' }}>
                {mapping.filter(m => m === 'full_name').length} columns map to Full name — they will be
                joined in column order.
              </p>
            )}

            <div className="flex gap-2 mt-4">
              <button type="button" style={btnStyle('ghost')} onClick={() => setStep('Upload')}>
                Back
              </button>
              <button
                type="button"
                style={{ ...btnStyle(), opacity: hasEmailColumn ? 1 : 0.5 }}
                disabled={!hasEmailColumn}
                onClick={() => setStep('Tagging')}
              >
                Next — tagging
              </button>
            </div>
          </div>
        )}

        {/* ── 3. TAGGING ────────────────────────────────────────────── */}
        {step === 'Tagging' && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label style={labelStyle} htmlFor="crm-import-source">Source</label>
                <input
                  id="crm-import-source"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  placeholder="e.g. linkedin-2026-08"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="crm-import-consent">Consent basis (CASL)</label>
                <select
                  id="crm-import-consent"
                  value={consentBasis}
                  onChange={e => setConsentBasis(e.target.value as CrmConsentBasis)}
                  style={inputStyle}
                >
                  {CRM_CONSENT_BASES.map(c => (
                    <option key={c} value={c}>{CONSENT_LABELS[c]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label style={labelStyle} htmlFor="crm-import-tags">Tags applied to every row</label>
              <input
                id="crm-import-tags"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder="Comma-separated — e.g. linkedin, cold, 2026-q3"
                style={inputStyle}
              />
            </div>
            <p className="font-body text-[12px] mt-3" style={{ color: 'var(--admin-text-2)' }}>
              Consent basis is a CASL record. Pick <strong>Express</strong> only where someone
              actually opted in — a LinkedIn connection is <strong>Implied</strong> at best.
            </p>
            <div className="flex gap-2 mt-4">
              <button type="button" style={btnStyle('ghost')} onClick={() => setStep('Mapping')}>
                Back
              </button>
              <button type="button" style={btnStyle()} onClick={() => setStep('Preview')}>
                Next — preview
              </button>
            </div>
          </div>
        )}

        {/* ── 4. PREVIEW ────────────────────────────────────────────── */}
        {step === 'Preview' && (
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <Stat label="Rows in file" value={analysis.total} />
              <Stat label="Will import" value={analysis.valid.length} accent="var(--brand-teal)" />
              <Stat
                label="Missing / invalid email"
                value={analysis.invalid}
                accent={analysis.invalid > 0 ? 'var(--brand-gold)' : undefined}
              />
              <Stat
                label="Duplicates in file"
                value={analysis.duplicatesInFile}
                accent={analysis.duplicatesInFile > 0 ? 'var(--brand-gold)' : undefined}
              />
            </div>

            <p className="font-condensed font-bold uppercase text-[10px] tracking-[0.14em] mb-2" style={{ color: 'var(--admin-text-2)' }}>
              First {Math.min(10, analysis.valid.length)} rows as they will import
            </p>
            <div className="overflow-x-auto">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Name', 'Email', 'Title', 'Company', 'Phone', 'LinkedIn'].map(h => (
                      <th
                        key={h}
                        className="font-condensed font-bold uppercase text-[10px] tracking-[0.14em] text-left"
                        style={{ color: 'var(--admin-text-2)', padding: '6px 8px', borderBottom: '1px solid var(--admin-border)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analysis.valid.slice(0, 10).map((r, i) => (
                    <tr key={`${r.email}-${i}`} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                      {[r.full_name, r.email, r.title, r.company, r.phone, r.linkedin_url].map((cell, j) => (
                        <td
                          key={j}
                          className="font-body text-[12px] truncate"
                          style={{ padding: '6px 8px', color: 'var(--admin-text)', maxWidth: 190 }}
                        >
                          {cell || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="font-body text-[12px] mt-3" style={{ color: 'var(--admin-text-2)' }}>
              Every row imports as <strong>Lead / Active</strong> with source{' '}
              <strong>{source.trim() || '—'}</strong>, consent <strong>{consentBasis}</strong>
              {parseTagInput(tagsInput).length > 0 && (
                <> and tags <strong>{parseTagInput(tagsInput).join(', ')}</strong></>
              )}
              . Contacts already in the CRM or already members are skipped.
            </p>

            <div className="flex gap-2 mt-4">
              <button type="button" style={btnStyle('ghost')} onClick={() => setStep('Tagging')}>
                Back
              </button>
              <button
                type="button"
                style={{ ...btnStyle(), opacity: analysis.valid.length ? 1 : 0.5 }}
                disabled={analysis.valid.length === 0}
                onClick={() => {
                  setStep('Import')
                  void runImport()
                }}
              >
                Import {analysis.valid.length.toLocaleString()} prospects
              </button>
            </div>
          </div>
        )}

        {/* ── 5. IMPORT ─────────────────────────────────────────────── */}
        {step === 'Import' && (
          <div>
            {running && (
              <>
                <p className="font-body text-[13px] mb-2" style={{ color: 'var(--admin-text)' }}>
                  Importing… {progress}%
                </p>
                <div
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  style={{
                    height: 8,
                    borderRadius: 4,
                    background: 'var(--admin-subtle)',
                    border: '1px solid var(--admin-border)',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ width: `${progress}%`, height: '100%', background: 'var(--brand-teal)', transition: 'width 200ms ease' }} />
                </div>
              </>
            )}

            {report && !running && (
              <div>
                <h2 className="font-display font-black text-[20px]" style={{ color: 'var(--admin-text-strong)', margin: '0 0 12px' }}>
                  Import complete
                </h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Stat label="Imported" value={report.imported} accent="var(--brand-teal)" />
                  <Stat label="Duplicates in file" value={analysis.duplicatesInFile} />
                  <Stat label="Already prospects" value={report.dupPros} />
                  <Stat label="Already members" value={report.dupMembers} />
                  <Stat label="Invalid email" value={report.invalid} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href="/admin/crm" style={{ ...btnStyle(), textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                    Back to the board
                  </Link>
                  <button
                    type="button"
                    style={btnStyle('ghost')}
                    onClick={() => {
                      setStep('Upload')
                      setHeaders([])
                      setDataRows([])
                      setMapping([])
                      setFileName('')
                      setReport(null)
                      setProgress(0)
                      if (fileRef.current) fileRef.current.value = ''
                    }}
                  >
                    Import another file
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div
      className="rounded px-3 py-2"
      style={{ background: 'var(--admin-subtle)', border: '1px solid var(--admin-border)', minWidth: 120 }}
    >
      <p
        className="font-condensed font-bold uppercase text-[9px] tracking-[0.14em]"
        style={{ color: 'var(--admin-text-2)', margin: 0 }}
      >
        {label}
      </p>
      <p
        className="font-display font-black text-[20px]"
        style={{ color: accent ?? 'var(--admin-text-strong)', margin: '2px 0 0' }}
      >
        {value.toLocaleString()}
      </p>
    </div>
  )
}
