'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MemberDirectoryModal } from './MemberDirectoryModal'
import type { Channel } from '@/lib/community/types'

interface ChannelSidebarProps {
  channels: Channel[]
  currentSlug: string
  unreadCounts: Record<string, number>
}

function HashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="px-4 mt-5 mb-1 font-condensed font-bold uppercase tracking-[0.22em] text-[9px]"
      style={{ color: 'rgba(255,255,255,0.2)' }}
    >
      {children}
    </p>
  )
}

function ChannelItem({
  slug,
  name,
  active,
  unreadCount,
}: {
  slug: string
  name: string
  active: boolean
  unreadCount: number
}) {
  const isPillarChannel = slug !== 'general'
  const badgeColor = isPillarChannel ? '#68a2b9' : '#ef0e30'

  return (
    <Link
      href={slug === 'general' ? '/community' : `/community/${slug}`}
      className="flex items-center gap-2.5 px-4 py-[9px] transition-all duration-150 w-full"
      style={{
        color: active ? '#68a2b9' : 'rgba(255,255,255,0.5)',
        backgroundColor: active ? 'rgba(255,255,255,0.06)' : 'transparent',
        borderLeft: active ? '2px solid #68a2b9' : '2px solid transparent',
        paddingLeft: active ? '14px' : '16px',
      }}
      onMouseEnter={e => {
        if (!active) {
          const el = e.currentTarget as HTMLElement
          el.style.backgroundColor = 'rgba(255,255,255,0.04)'
          el.style.color = 'rgba(255,255,255,0.8)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          const el = e.currentTarget as HTMLElement
          el.style.backgroundColor = 'transparent'
          el.style.color = 'rgba(255,255,255,0.5)'
        }
      }}
    >
      <span style={{ opacity: 0.6 }}><HashIcon /></span>
      <span className="font-condensed font-semibold text-[12px] tracking-wide flex-1 truncate">
        {name}
      </span>
      {unreadCount > 0 && (
        <span
          className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full font-condensed font-bold text-[9px] text-white flex items-center justify-center"
          style={{ backgroundColor: badgeColor }}
        >
          {unreadCount}
        </span>
      )}
    </Link>
  )
}

export function ChannelSidebar({ channels, currentSlug, unreadCounts }: ChannelSidebarProps) {
  const [directoryOpen, setDirectoryOpen] = useState(false)

  return (
    <>
      <aside
        className="flex flex-col py-3 overflow-y-auto flex-shrink-0"
        style={{
          width: '200px',
          backgroundColor: '#112535',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <SectionLabel>Channels</SectionLabel>
        {channels.map(ch => (
          <ChannelItem
            key={ch.id}
            slug={ch.slug}
            name={ch.name}
            active={ch.slug === currentSlug}
            unreadCount={unreadCounts[ch.slug] ?? 0}
          />
        ))}

        <SectionLabel>Members</SectionLabel>

        <button
          onClick={() => setDirectoryOpen(true)}
          className="flex items-center gap-2.5 px-4 py-[9px] transition-all duration-150 w-full text-left"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)'
            ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'
          }}
        >
          <span style={{ opacity: 0.6 }}><UsersIcon /></span>
          <span className="font-condensed font-semibold text-[12px] tracking-wide">Directory</span>
        </button>

        <button
          disabled
          className="flex items-center gap-2.5 px-4 py-[9px] w-full text-left cursor-default"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          <span style={{ opacity: 0.6 }}><MessageIcon /></span>
          <span className="font-condensed font-semibold text-[12px] tracking-wide flex-1" style={{ opacity: 0.65 }}>
            Direct Messages
          </span>
          <span
            className="font-condensed font-bold uppercase text-[9px] tracking-wide flex-shrink-0"
            style={{
              color: '#68a2b9',
              backgroundColor: 'rgba(104,162,185,0.12)',
              border: '1px solid rgba(104,162,185,0.35)',
              borderRadius: '3px',
              padding: '1px 5px',
            }}
          >
            Soon
          </span>
        </button>
      </aside>

      {directoryOpen && (
        <MemberDirectoryModal onClose={() => setDirectoryOpen(false)} />
      )}
    </>
  )
}
