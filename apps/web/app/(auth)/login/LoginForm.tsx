'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LOGIN_NEW_HERE,
  SIGNUP_ALREADY_MEMBER,
  SIGNUP_ALREADY_MEMBER_ACTION,
  SIGNUP_ALREADY_MEMBER_PROMPT,
  gatedIntentFor,
  loginSwitchHref,
} from '@/lib/auth/gatedIntent'
import { loginCopyFor, resolveLoginMode } from '@/lib/auth/loginCopy'
import { PILLARS } from '@/lib/pillars'
import {
  EMAIL_ALREADY_REGISTERED,
  SIGNUP_CONFIRM_EMAIL,
  humanizeAuthError,
  interpretSignUpResult,
  passwordAuthMethodFor,
} from '@/lib/auth/passwordAuth'
import { requestJoinProvision, shouldProvisionJoin } from '@/lib/crm/join'
import { LogoMark } from '@/components/ui/LogoMark'

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      style={{ animation: 'loginSpin 0.8s linear infinite', marginRight: 8, verticalAlign: '-2px' }}
    >
      <path d="M12 3a9 9 0 0 1 9 9" />
      <style>{`@keyframes loginSpin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  )
}

export function LoginForm() {
  const searchParams = useSearchParams()
  // DOORS-1 — /join and /signup 308 here with ?mode=signup, so this screen has
  // to greet a first-time visitor as well as a returning member. The heading
  // and submit label come from lib/auth/loginCopy.ts, the same module
  // page.tsx's generateMetadata reads, so the tab title and the button can
  // never drift apart.
  const mode = resolveLoginMode(searchParams.get('mode'))
  const copy = loginCopyFor(mode)
  const intent = gatedIntentFor(searchParams.get('redirect'))

  // SPRINT I Phase 2 follow-up — return the member to where they came from.
  // /pricing sends ?redirect=/pricing when a paid CTA gets a 401 for an
  // anonymous visitor; the callback reads ?next=. The two names never agreed,
  // so the value was silently dropped and everyone landed on /home. Map it
  // here. Deliberately NOT re-sanitized: /auth/callback already rejects
  // anything that isn't a relative path (route.ts:16), and a second guard here
  // is how the two copies drift apart later.
  const nextPath = searchParams.get('redirect') ?? '/home'
  const callbackUrl = `/auth/callback?next=${encodeURIComponent(nextPath)}`
  const [tab, setTab] = useState<'password' | 'magic'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [sent, setSent] = useState<'magic' | 'confirm' | false>(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotError, setForgotError] = useState<string | null>(null)

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const emailNorm = email.trim().toLowerCase()
    // QA-FUNNEL-1 — the heading already said "Create account"; the submit
    // used to call signInWithPassword anyway. Branch here, and never fall
    // through from signUp to signIn (lib/auth/passwordAuth.ts).
    if (passwordAuthMethodFor(mode) === 'signUp') {
      const { data, error: err } = await supabase.auth.signUp({
        email: emailNorm,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${callbackUrl}`,
        },
      })
      setLoading(false)
      if (err) {
        setError(humanizeAuthError(err.message, 'signup'))
        return
      }
      const outcome = interpretSignUpResult(data)
      if (shouldProvisionJoin({ mode, kind: 'password-signup', outcome })) {
        void requestJoinProvision(emailNorm)
      }
      if (outcome === 'signedIn') {
        window.location.href = callbackUrl
        return
      }
      if (outcome === 'emailTaken') {
        setError(EMAIL_ALREADY_REGISTERED)
        return
      }
      if (outcome === 'confirmEmail') {
        setSent('confirm')
        return
      }
      setError('Could not create that account. Try again or use a magic link.')
      return
    }

    const { error: err } = await supabase.auth.signInWithPassword({
      email: emailNorm,
      password,
    })
    setLoading(false)
    if (err) {
      setError(humanizeAuthError(err.message, 'signin'))
      return
    }
    window.location.href = callbackUrl
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}${callbackUrl}`,
        shouldCreateUser: true,
      },
    })
    setLoading(false)
    if (err) { setError(humanizeAuthError(err.message, mode)); return }
    if (shouldProvisionJoin({ mode, kind: 'magic-otp' })) {
      void requestJoinProvision(email.trim().toLowerCase())
    }
    setSent('magic')
  }

  async function handleForgotPassword() {
    setForgotError(null)
    setForgotSent(false)
    if (!email.trim()) {
      setForgotError('Please enter your email address first.')
      return
    }
    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}${callbackUrl}` }
    )
    if (err) {
      setForgotError(err.message)
      return
    }
    setForgotSent(true)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: 'var(--navy-dark)' }}
    >
      <div className="w-full max-w-[400px] bg-white rounded-lg overflow-hidden shadow-2xl">
        <div className="h-1 bg-red-hot" />
        <div className="px-8 py-10">
          <div className="mb-8 flex justify-center">
            <LogoMark variant="dark" height={56} />
          </div>

          {sent ? (
            <div className="text-center py-4">
              <h2 className="text-[color:var(--navy)] text-2xl mb-3" style={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700 }}>
                Check your inbox.
              </h2>
              <p className="text-muted text-sm">
                {sent === 'confirm' ? SIGNUP_CONFIRM_EMAIL : `A login link is on its way to ${email}`}
              </p>
            </div>
          ) : (
            <>
              <h2
                className="text-navy-dark text-3xl font-bold mb-6"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                {copy.heading}
              </h2>

              {intent ? (
                <div
                  role="status"
                  className="mb-6 rounded px-3 py-3"
                  style={{
                    backgroundColor: 'rgba(27,60,90,0.05)',
                    border: '1px solid rgba(27,60,90,0.12)',
                  }}
                >
                  <p
                    className="text-[color:var(--navy)] text-sm font-bold"
                    style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                  >
                    {intent.headline}
                  </p>
                  <p className="text-muted text-xs mt-1 leading-relaxed">{intent.body}</p>
                  {intent.id === 'academy' ? (
                    <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'rgba(27,60,90,0.55)' }}>
                      {PILLARS.map(p => p.name).join(' · ')}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {/* Tabs */}
              <div className="flex mb-6 border border-[rgba(27,60,90,0.12)] rounded overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setTab('password'); setError(null) }}
                  className="flex-1 min-h-[44px] py-2 text-xs font-bold tracking-wider transition-colors"
                  style={{
                    fontFamily: '"Barlow Condensed", sans-serif',
                    backgroundColor: tab === 'password' ? 'var(--navy)' : 'transparent',
                    color: tab === 'password' ? 'var(--white)' : 'var(--muted)',
                  }}
                >
                  PASSWORD
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('magic'); setError(null) }}
                  className="flex-1 min-h-[44px] py-2 text-xs font-bold tracking-wider transition-colors"
                  style={{
                    fontFamily: '"Barlow Condensed", sans-serif',
                    backgroundColor: tab === 'magic' ? 'var(--navy)' : 'transparent',
                    color: tab === 'magic' ? 'var(--white)' : 'var(--muted)',
                  }}
                >
                  MAGIC LINK
                </button>
              </div>

              {error && (
                <p
                  role="alert"
                  aria-live="polite"
                  className="text-red-hot text-sm rounded bg-[rgba(239,14,48,0.06)] px-3 py-2 border border-[rgba(239,14,48,0.15)] mb-4"
                >
                  {error}
                </p>
              )}

              {tab === 'password' ? (
                <form onSubmit={handlePassword} className="space-y-4">
                  <div>
                    <label className="block text-[color:var(--navy)] text-xs font-bold tracking-widest mb-1" style={{ fontFamily: '"Barlow Condensed", sans-serif' }}>
                      EMAIL ADDRESS
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full min-h-[44px] border border-[rgba(27,60,90,0.18)] rounded px-3 py-2 text-sm text-[color:var(--navy)] focus:outline-none focus:border-teal-legacy"
                      style={{ backgroundColor: '#fff', colorScheme: 'light' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[color:var(--navy)] text-xs font-bold tracking-widest mb-1" style={{ fontFamily: '"Barlow Condensed", sans-serif' }}>
                      PASSWORD
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className="w-full min-h-[44px] border border-[rgba(27,60,90,0.18)] rounded px-3 py-2 pr-10 text-sm text-[color:var(--navy)] focus:outline-none focus:border-teal-legacy"
                        style={{ backgroundColor: '#fff', colorScheme: 'light' }}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: 'var(--muted)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--navy)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                    {mode !== 'signup' ? (
                    <div className="mt-1.5 flex items-center justify-between">
                      <div>
                        {forgotSent && (
                          <p className="text-[10px]" style={{ color: 'var(--success-green)' }}>
                            Password reset email sent. Check your inbox.
                          </p>
                        )}
                        {forgotError && (
                          <p className="text-[10px]" style={{ color: 'var(--brand-red-hot)' }}>
                            {forgotError}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs transition-colors ml-auto"
                        style={{ color: 'rgba(27,60,90,0.5)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(27,60,90,0.8)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(27,60,90,0.5)' }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    ) : null}
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    aria-busy={loading}
                    className={`w-full py-3 rounded font-bold uppercase tracking-wider text-sm text-white transition-all disabled:opacity-50 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    style={{ fontFamily: '"Barlow Condensed", sans-serif', backgroundColor: 'var(--brand-red-hot)' }}
                  >
                    {loading ? (<><Spinner />{mode === 'signup' ? 'Creating account…' : 'Signing in…'}</>) : copy.submit}
                  </button>
                  <AuthModeSwitch mode={mode} redirect={nextPath} />
                </form>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <p className="text-[11px] mb-2" style={{ color: 'rgba(27,60,90,0.5)' }}>
                    We&apos;ll email you a one-click login link. No password needed.
                  </p>
                  <div>
                    <label className="block text-[color:var(--navy)] text-xs font-bold tracking-widest mb-1" style={{ fontFamily: '"Barlow Condensed", sans-serif' }}>
                      EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full min-h-[44px] border border-[rgba(27,60,90,0.18)] rounded px-3 py-2 text-sm text-[color:var(--navy)] focus:outline-none focus:border-teal-legacy"
                      style={{ backgroundColor: '#fff', colorScheme: 'light' }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    aria-busy={loading}
                    className={`w-full py-3 rounded font-bold uppercase tracking-wider text-sm text-white transition-all disabled:opacity-50 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    style={{ fontFamily: '"Barlow Condensed", sans-serif', backgroundColor: 'var(--brand-red-hot)' }}
                  >
                    {loading ? (<><Spinner />Sending…</>) : 'Send Login Link →'}
                  </button>
                  <AuthModeSwitch mode={mode} redirect={nextPath} />
                </form>
              )}
            </>
          )}
        </div>
        <div className="px-8 py-4 border-t text-center" style={{ borderColor: 'rgba(27,60,90,0.08)', backgroundColor: 'rgba(27,60,90,0.02)' }}>
          <p className="text-xs text-muted">
            Access is granted through your Evolved Pros membership.{' '}
            <a href="/pricing" className="underline hover:text-[color:var(--navy)] transition-colors">View pricing</a>
          </p>
        </div>
      </div>
    </div>
  )
}

function AuthModeSwitch({
  mode,
  redirect,
}: {
  mode: 'signin' | 'signup'
  redirect: string
}) {
  if (mode === 'signup') {
    return (
      <p className="text-center text-sm pt-1" style={{ color: 'rgba(27,60,90,0.65)' }}>
        {SIGNUP_ALREADY_MEMBER_PROMPT}{' '}
        <a
          href={loginSwitchHref(redirect, 'signin')}
          className="underline hover:text-[color:var(--navy)] transition-colors"
        >
          {SIGNUP_ALREADY_MEMBER_ACTION}
        </a>
        <span className="sr-only">{SIGNUP_ALREADY_MEMBER}</span>
      </p>
    )
  }

  return (
    <p className="text-center text-sm pt-1" style={{ color: 'rgba(27,60,90,0.65)' }}>
      <a
        href={loginSwitchHref(redirect, 'signup')}
        className="underline hover:text-[color:var(--navy)] transition-colors"
      >
        {LOGIN_NEW_HERE}
      </a>
    </p>
  )
}
