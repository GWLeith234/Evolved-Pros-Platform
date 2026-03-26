'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'password' | 'magic'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.refresh()
        router.push('/home')
      }
    })
    return () => { subscription.unsubscribe() }
  }, [router])

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    setLoading(false)
    if (err) setError(err.message)
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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: '#112535' }}
    >
      <div className="w-full max-w-[400px] bg-white rounded-lg overflow-hidden shadow-2xl">
        <div className="h-1 bg-[#ef0e30]" />
        <div className="px-8 py-10">
          <div className="mb-8 text-center">
            <p
              className="text-[#1b3c5a] tracking-[0.18em] text-lg font-bold"
              style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
            >
              EVOLVED<span style={{ color: '#ef0e30' }}>·</span>PROS
            </p>
          </div>

          {sent ? (
            <div className="text-center py-4">
              <h2 className="text-[#1b3c5a] text-2xl mb-3" style={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700 }}>
                Check your inbox.
              </h2>
              <p className="text-[#7a8a96] text-sm">A login link is on its way to {email}</p>
            </div>
          ) : (
            <>
              <h2
                className="text-[#112535] text-3xl font-bold mb-6"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                Welcome back.
              </h2>

              {/* Tabs */}
              <div className="flex mb-6 border border-[rgba(27,60,90,0.12)] rounded overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setTab('password'); setError(null) }}
                  className="flex-1 py-2 text-xs font-bold tracking-wider transition-colors"
                  style={{
                    fontFamily: '"Barlow Condensed", sans-serif',
                    backgroundColor: tab === 'password' ? '#1b3c5a' : 'transparent',
                    color: tab === 'password' ? '#fff' : '#7a8a96',
                  }}
                >
                  PASSWORD
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('magic'); setError(null) }}
                  className="flex-1 py-2 text-xs font-bold tracking-wider transition-colors"
                  style={{
                    fontFamily: '"Barlow Condensed", sans-serif',
                    backgroundColor: tab === 'magic' ? '#1b3c5a' : 'transparent',
                    color: tab === 'magic' ? '#fff' : '#7a8a96',
                  }}
                >
                  MAGIC LINK
                </button>
              </div>

              {error && (
                <p className="text-[#ef0e30] text-sm rounded bg-[rgba(239,14,48,0.06)] px-3 py-2 border border-[rgba(239,14,48,0.15)] mb-4">
                  {error}
                </p>
              )}

              {tab === 'password' ? (
                <form onSubmit={handlePassword} className="space-y-4">
                  <div>
                    <label className="block text-[#1b3c5a] text-xs font-bold tracking-widest mb-1" style={{ fontFamily: '"Barlow Condensed", sans-serif' }}>
                      EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full border border-[rgba(27,60,90,0.18)] rounded px-3 py-2 text-sm text-[#1b3c5a] focus:outline-none focus:border-[#68a2b9]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#1b3c5a] text-xs font-bold tracking-widest mb-1" style={{ fontFamily: '"Barlow Condensed", sans-serif' }}>
                      PASSWORD
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="w-full border border-[rgba(27,60,90,0.18)] rounded px-3 py-2 text-sm text-[#1b3c5a] focus:outline-none focus:border-[#68a2b9]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded font-bold uppercase tracking-wider text-sm text-white transition-all disabled:opacity-50"
                    style={{ fontFamily: '"Barlow Condensed", sans-serif', backgroundColor: '#ef0e30' }}
                  >
                    {loading ? 'Signing in…' : 'Sign In →'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div>
                    <label className="block text-[#1b3c5a] text-xs font-bold tracking-widest mb-1" style={{ fontFamily: '"Barlow Condensed", sans-serif' }}>
                      EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full border border-[rgba(27,60,90,0.18)] rounded px-3 py-2 text-sm text-[#1b3c5a] focus:outline-none focus:border-[#68a2b9]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded font-bold uppercase tracking-wider text-sm text-white transition-all disabled:opacity-50"
                    style={{ fontFamily: '"Barlow Condensed", sans-serif', backgroundColor: '#ef0e30' }}
                  >
                    {loading ? 'Sending…' : 'Send Login Link →'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
        <div className="px-8 py-4 border-t text-center" style={{ borderColor: 'rgba(27,60,90,0.08)', backgroundColor: 'rgba(27,60,90,0.02)' }}>
          <p className="text-xs text-[#7a8a96]">Access is granted through your Evolved Pros membership.</p>
        </div>
      </div>
    </div>
  )
}
