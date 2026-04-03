import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const baseInput =
  'w-full px-3 py-2.5 rounded border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] text-sm ' +
  'placeholder:text-[var(--text-tertiary)] ' +
  'focus:outline-none focus:border-[#68a2b9] focus:ring-1 focus:ring-[rgba(104,162,185,0.2)] ' +
  'transition-colors duration-150 ' +
  'font-body'

const labelClass = 'block font-condensed font-medium uppercase text-[11px] mb-1'
const labelStyle = { color: 'var(--text-secondary)', letterSpacing: '0.06em' }

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className={labelClass} style={labelStyle}>
          {label}
        </label>
      )}
      <input
        className={`${baseInput} ${error ? 'border-[#ef0e30] focus:border-[#ef0e30] focus:ring-[#ef0e30]/20' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-[#ef0e30] font-body">{error}</p>
      )}
    </div>
  )
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className={labelClass} style={labelStyle}>
          {label}
        </label>
      )}
      <textarea
        className={`${baseInput} resize-y min-h-[100px] ${error ? 'border-[#ef0e30] focus:border-[#ef0e30] focus:ring-[#ef0e30]/20' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-[#ef0e30] font-body">{error}</p>
      )}
    </div>
  )
}
