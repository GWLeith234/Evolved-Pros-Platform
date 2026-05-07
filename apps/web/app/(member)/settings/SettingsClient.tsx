'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { EmailPrefsForm } from '@/components/notifications/EmailPrefsForm'

type TriOption = 'immediate' | 'digest' | 'off'
type BinOption = 'immediate' | 'off'
type Prefs = {
  community_reply: TriOption
  community_mention: TriOption
  event_reminder: BinOption
  course_unlock: BinOption
  system_billing: 'immediate'
}

interface SettingsClientProps {
  userId: string
  email: string
  fullName: string
  tier: string | null
  createdAt: string | null
  initialPrefs: Prefs
}

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'membership', label: 'Membership' },
  { key: 'account', label: 'Account' },
] as const

type TabKey = typeof TABS[number]['key']

function isTabKey(value: string | null): value is TabKey {
  return value === 'profile' || value === 'notifications' || value === 'membership' || value === 'account'
}

function tierBadge(tier: string | null): { label: string; color: string } {
  const t = tier?.toLowerCase()
  if (t === 'vip') return { label: 'VIP', color: '#C9A84C' }
  if (t === 'pro' || t === 'professional') return { label: 'Pro', color: '#C9302A' }
  return { label: 'Member', color: '#7a8a96' }
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  try {
    const d = new Date(value)
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return '—'
  }
}

export function SettingsClient({
  userId,
  email,
  fullName,
  tier,
  createdAt,
  initialPrefs,
}: SettingsClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const tabParam = searchParams?.get('tab') ?? null
  const [activeTab, setActiveTab] = useState<TabKey>(isTabKey(tabParam) ? tabParam : 'profile')

  useEffect(() => {
    if (isTabKey(tabParam) && tabParam !== activeTab) setActiveTab(tabParam)
  }, [tabParam, activeTab])

  function selectTab(next: TabKey) {
    setActiveTab(next)
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    params.set('tab', next)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="px-6 md:px-8 py-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display font-black text-[28px] text-[#112535] tracking-wide">SETTINGS</h1>
        <p className="font-condensed text-[12px] text-[#7a8a96] mt-0.5">
          Manage your profile, notifications, membership, and account.
        </p>
      </div>

      <div className="flex gap-1 border-b border-[rgba(27,60,90,0.12)] mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => selectTab(t.key)}
            className="px-4 py-2.5 font-condensed font-semibold uppercase tracking-wide text-xs transition-colors border-b-2 -mb-px whitespace-nowrap"
            style={{
              color: activeTab === t.key ? '#68a2b9' : '#7a8a96',
              borderColor: activeTab === t.key ? '#68a2b9' : 'transparent',
              background: 'none',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && <ProfileTab userId={userId} />}
      {activeTab === 'notifications' && <EmailPrefsForm initialPrefs={initialPrefs} />}
      {activeTab === 'membership' && <MembershipTab tier={tier} createdAt={createdAt} />}
      {activeTab === 'account' && <AccountTab userId={userId} email={email} fullName={fullName} />}
    </div>
  )
}

function ProfileTab({ userId }: { userId: string }) {
  return (
    <div
      className="rounded-lg p-6"
      style={{ border: '1px solid rgba(27,60,90,0.1)', backgroundColor: 'rgba(27,60,90,0.02)' }}
    >
      <h2 className="font-condensed font-bold uppercase tracking-widest text-xs text-[#1b3c5a] mb-2">
        Profile Details
      </h2>
      <p className="font-body text-[14px] text-[#7a8a96] mb-4 leading-relaxed">
        Your name, photo, bio, pillar, and 90-day goal are edited on your profile page.
      </p>
      <Link
        href={`/profile/${userId}?edit=1`}
        className="inline-block font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-6 py-2.5 transition-all"
        style={{ backgroundColor: '#1b3c5a', color: 'white' }}
      >
        Edit Profile
      </Link>
    </div>
  )
}

function MembershipTab({ tier, createdAt }: { tier: string | null; createdAt: string | null }) {
  const badge = tierBadge(tier)
  const t = tier?.toLowerCase()
  const isVip = t === 'vip'

  return (
    <div className="space-y-4">
      <div
        className="rounded-lg p-6"
        style={{ border: '1px solid rgba(27,60,90,0.1)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px] text-[#7a8a96] mb-1">
              Current Tier
            </p>
            <span
              className="inline-block font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-3 py-1.5"
              style={{ backgroundColor: badge.color, color: 'white' }}
            >
              {badge.label}
            </span>
          </div>
          <div className="text-right">
            <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px] text-[#7a8a96] mb-1">
              Member Since
            </p>
            <p className="font-body text-[14px] text-[#1b3c5a]">{formatDate(createdAt)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-4" style={{ borderTop: '1px solid rgba(27,60,90,0.06)' }}>
          {isVip && (
            <Link
              href="/pricing"
              className="font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-5 py-2.5 transition-all"
              style={{ backgroundColor: '#1b3c5a', color: 'white' }}
            >
              Upgrade to Pro
            </Link>
          )}
          <Link
            href="/pricing"
            className="font-condensed font-semibold uppercase tracking-wide text-[12px] rounded px-5 py-2.5 transition-all"
            style={{ border: '1px solid rgba(27,60,90,0.2)', color: '#1b3c5a' }}
          >
            Manage Billing
          </Link>
        </div>
      </div>

      <ComingSoonCard message="Detailed billing history and self-serve plan changes are coming soon." />
    </div>
  )
}

function AccountTab({ userId, email, fullName }: { userId: string; email: string; fullName: string }) {
  const [name, setName] = useState(fullName)
  const [savingName, setSavingName] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const [resetting, setResetting] = useState(false)
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  const [resetError, setResetError] = useState<string | null>(null)

  async function handleSaveName() {
    setSavingName(true)
    setNameError(null)
    setNameSaved(false)
    try {
      const res = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Save failed')
      }
      setNameSaved(true)
      setTimeout(() => setNameSaved(false), 3000)
    } catch (e) {
      setNameError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSavingName(false)
    }
  }

  async function handlePasswordReset() {
    setResetting(true)
    setResetError(null)
    setResetMessage(null)
    try {
      const res = await fetch('/api/auth/reset-password', { method: 'POST' })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'Request failed')
      }
      setResetMessage('Check your inbox for a password reset link.')
    } catch (e) {
      setResetError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setResetting(false)
    }
  }

  void userId

  return (
    <div className="space-y-5">
      <div
        className="rounded-lg p-5"
        style={{ border: '1px solid rgba(27,60,90,0.1)' }}
      >
        <label className="block">
          <span className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px] text-[#7a8a96] mb-2 block">
            Display Name
          </span>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={100}
            className="w-full px-3 py-2 rounded font-body text-[14px] text-[#1b3c5a] focus:outline-none"
            style={{ border: '1px solid rgba(27,60,90,0.18)', backgroundColor: 'white' }}
          />
        </label>
        {nameError && (
          <p className="font-condensed text-[11px] text-[#ef0e30] mt-2">{nameError}</p>
        )}
        <div className="flex items-center gap-4 mt-3">
          <button
            type="button"
            onClick={handleSaveName}
            disabled={savingName || name === fullName}
            className="font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-5 py-2 transition-all"
            style={{
              backgroundColor: '#1b3c5a',
              color: 'white',
              opacity: savingName || name === fullName ? 0.5 : 1,
              cursor: savingName || name === fullName ? 'default' : 'pointer',
            }}
          >
            {savingName ? 'Saving...' : 'Save Name'}
          </button>
          {nameSaved && (
            <span className="font-condensed text-[11px]" style={{ color: '#68a2b9' }}>
              Saved ✓
            </span>
          )}
        </div>
      </div>

      <div
        className="rounded-lg p-5"
        style={{ border: '1px solid rgba(27,60,90,0.1)' }}
      >
        <span className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px] text-[#7a8a96] mb-2 block">
          Email
        </span>
        <input
          type="email"
          value={email}
          readOnly
          disabled
          className="w-full px-3 py-2 rounded font-body text-[14px]"
          style={{
            border: '1px solid rgba(27,60,90,0.1)',
            backgroundColor: 'rgba(27,60,90,0.04)',
            color: '#7a8a96',
            cursor: 'not-allowed',
          }}
        />
        <p className="font-condensed text-[11px] text-[#7a8a96] mt-2">
          Contact support to change the email on your account.
        </p>
      </div>

      <div
        className="rounded-lg p-5"
        style={{ border: '1px solid rgba(27,60,90,0.1)' }}
      >
        <span className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px] text-[#7a8a96] mb-1 block">
          Password
        </span>
        <p className="font-body text-[14px] text-[#7a8a96] mb-3">
          We&apos;ll email you a secure link to set a new password.
        </p>
        <button
          type="button"
          onClick={handlePasswordReset}
          disabled={resetting}
          className="font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-5 py-2 transition-all"
          style={{
            backgroundColor: '#1b3c5a',
            color: 'white',
            opacity: resetting ? 0.7 : 1,
            cursor: resetting ? 'default' : 'pointer',
          }}
        >
          {resetting ? 'Sending...' : 'Change Password'}
        </button>
        {resetMessage && (
          <p className="font-condensed text-[11px] mt-3" style={{ color: '#68a2b9' }}>
            {resetMessage}
          </p>
        )}
        {resetError && (
          <p className="font-condensed text-[11px] text-[#ef0e30] mt-3">{resetError}</p>
        )}
      </div>
    </div>
  )
}

function ComingSoonCard({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg p-5"
      style={{
        border: '1px dashed rgba(27,60,90,0.18)',
        backgroundColor: 'rgba(27,60,90,0.02)',
      }}
    >
      <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px] text-[#7a8a96] mb-1">
        Coming Soon
      </p>
      <p className="font-body text-[13px] text-[#7a8a96] leading-relaxed">{message}</p>
    </div>
  )
}
