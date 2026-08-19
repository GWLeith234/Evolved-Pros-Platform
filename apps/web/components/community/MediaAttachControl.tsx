'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { IMAGE_ACCEPT_ATTR, validateImageUpload } from '@/lib/community/media'

/**
 * Attach-one-image control for the community composers (SPRINT CM-1).
 *
 * The <input type="file"> is ALWAYS in the DOM — visually hidden, never
 * conditionally rendered. Screen readers and automation both need a real
 * input to find; a button that fabricates a file dialog is not equivalent.
 * It is hidden with clip-path rather than display:none so it stays focusable
 * and stays in the accessibility tree.
 *
 * One file max in v1. Removing the preview restores the text-only submit
 * byte-for-byte — the caller simply gets file === null.
 */

interface MediaAttachControlProps {
  file: File | null
  onChange: (file: File | null) => void
  /** Rejection message from the client-side check, or from the server. */
  error: string | null
  onError: (message: string | null) => void
  disabled?: boolean
  /** Compact styling for the reply composer. */
  compact?: boolean
}

export function MediaAttachControl({
  file,
  onChange,
  error,
  onError,
  disabled = false,
  compact = false,
}: MediaAttachControlProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  /* Object URLs leak until revoked — tie the lifetime to the selected file. */
  useEffect(() => {
    if (!file) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null
    if (!picked) return

    /* Same rules the API route enforces — this is the early, friendly copy of
       the check, not a replacement for it. */
    const check = validateImageUpload({ type: picked.type, size: picked.size })
    if (!check.ok) {
      onError(check.error)
      onChange(null)
      /* Clear the input so re-picking the SAME bad file still fires change. */
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    onError(null)
    onChange(picked)
  }

  function handleRemove() {
    onChange(null)
    onError(null)
    if (inputRef.current) inputRef.current.value = ''
    inputRef.current?.focus()
  }

  const chipSize = compact ? 11 : 12

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      {/* Visually hidden but present, focusable, and labelled. */}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={IMAGE_ACCEPT_ATTR}
        onChange={handleSelect}
        disabled={disabled}
        data-testid="community-attach-input"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clipPath: 'inset(50%)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
        <label
          htmlFor={inputId}
          aria-disabled={disabled || undefined}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            minHeight: compact ? 34 : 40,
            padding: compact ? '6px 10px' : '8px 14px',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: chipSize,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            background: 'var(--attach-chip-bg)',
            color: 'var(--attach-chip-text)',
            border: '1px solid var(--attach-chip-border)',
            borderRadius: 0,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'opacity 140ms ease',
          }}
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
          {file ? 'Replace image' : 'Add image'}
        </label>

        {file && previewUrl && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 0,
              maxWidth: '100%',
              padding: '4px 4px 4px 4px',
              background: 'var(--attach-chip-bg)',
              border: '1px solid var(--attach-chip-border)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt=""
              style={{
                width: 34,
                height: 34,
                objectFit: 'cover',
                display: 'block',
                flexShrink: 0,
                background: 'var(--post-media-frame-bg)',
              }}
            />
            <span
              title={file.name}
              style={{
                fontFamily: '"Barlow", sans-serif',
                fontSize: 12,
                color: 'var(--attach-chip-text)',
                maxWidth: 180,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {file.name}
            </span>
            <button
              type="button"
              onClick={handleRemove}
              aria-label={`Remove ${file.name}`}
              style={{
                minWidth: 30,
                minHeight: 30,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: 'var(--attach-chip-text)',
                fontSize: 16,
                lineHeight: 1,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </span>
        )}
      </div>

      {error && (
        <p
          role="alert"
          style={{
            margin: 0,
            fontFamily: '"Barlow", sans-serif',
            fontSize: 12,
            color: 'var(--attach-error-text)',
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
