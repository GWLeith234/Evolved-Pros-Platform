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
  'w-full px-3 py-2.5 rounded border border-[rgba(27,60,90,0.2)] bg-white text-[#1b3c5a] text-sm ' +
  'placeholder:text-[#7a8a96] ' +
  'focus:outline-none focus:border-[#68a2b9] focus:ring-2 focus:ring-[#68a2b9]/20 ' +
  'transition-colors duration-150 ' +
  'font-body'

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block font-condensed font-semibold uppercase tracking-wide text-xs text-[#7a8a96] mb-1">
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
        <label className="block font-condensed font-semibold uppercase tracking-wide text-xs text-[#7a8a96] mb-1">
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
