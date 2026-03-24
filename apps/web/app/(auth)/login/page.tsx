'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail]         = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSubmitted(true)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: '#112535' }}
    >
      {/* Card */}
      <div
        className="w-full max-w-[400px] bg-white rounded-lg overflow-hidden shadow-2xl"
      >
        {/* Top accent bar */}
        <div className="h-1 bg-[#ef0e30]" />

        <div className="px-8 py-10">
          {/* Logo */}
          <div className="mb-8 text-center">
            <p
              className="text-[#1b3c5a] tracking-[0.18em] text-lg font-bold"
              style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
            >
              EVOLVED<span style={{ color: '#ef0e30' }}>·</span>PROS
            </p>
          </div>

          {submitted ? (
            /* Confirmation state */
            <div className="text-center py-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'rgba(104,162,185,0.12)' }}
              >
                <svg className="w-6 h-6 text-[#68a2b9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2
                className="text-[#1b3c5a] text-2xl mb-3"
                style={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700 }}
              >
                Check your inbox.
              </h2>
              <p className="text-[#7a8a96] text-sm leading-relaxed" style={{ fontFamily: 'Barlow, sans-serif' }}>
                A login link is on its way to{' '}
                <span className="font-semibold text-[#1b3c5a]">{email}</span>.
              </p>
              <p className="text-[#7a8a96] text-xs mt-3" style={{ fontFamily: 'Barlow, sans-serif' }}>
                Check your spam folder if it doesn't arrive within a minute.
              </p>
            </div>
          ) : (
            /* Login form */
            <>
              <h1
                className="text-[#1b3c5a] text-3xl mb-2"
                style={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700 }}
              >
                Welcome back.
              </h1>
              <p className="text-[#7a8a96] text-sm mb-6" style={{ fontFamily: 'Barlow, sans-serif' }}>
                Enter your email to receive a login link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold uppercase tracking-widest text-[#7a8a96] mb-1"
                    style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2.5 rounded border border-[rgba(27,60,90,0.2)] text-[#1b3c5a] text-sm placeholder:text-[#7a8a96] focus:outline-none focus:border-[#68a2b9] focus:ring-2 focus:ring-[#68a2b9]/20 transition-colors"
                    style={{ fontFamily: 'Barlow, sans-serif' }}
                  />
                </div>

                {error && (
                  <p className="text-[#ef0e30] text-sm" style={{ fontFamily: 'Barlow, sans-serif' }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3 rounded font-bold uppercase tracking-wider text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    fontFamily: '"Barlow Condensed", sans-serif',
                    backgroundColor: loading ? '#c50a26' : '#ef0e30',
                  }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending…
                    </>
                  ) : (
                    'Send Login Link →'
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-8 py-4 border-t text-center"
          style={{ borderColor: 'rgba(27,60,90,0.08)', backgroundColor: 'rgba(27,60,90,0.02)' }}
        >
          <p
            className="text-xs text-[#7a8a96]"
            style={{ fontFamily: 'Barlow, sans-serif' }}
          >
            Access is granted through your Evolved Pros membership.
          </p>
        </div>
      </div>
    </div>
  )
}
