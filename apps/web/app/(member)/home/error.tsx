'use client'
import { useEffect } from 'react'
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#0A0F18] text-[#F5F0E8]">
      <h1 className="text-2xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        Something went wrong
      </h1>
      <p className="text-sm text-[#6B7A99]">We hit an unexpected error. Try refreshing or go home.</p>
      <div className="flex gap-3">
        <button onClick={reset} className="px-4 py-2 rounded bg-[#111926] border border-[#1E2A3A] text-sm hover:border-[#C9302A] transition-colors">
          Try again
        </button>
        <a href="/home" className="px-4 py-2 rounded bg-[#C9302A] text-white text-sm hover:bg-[#a8251e] transition-colors">
          Go home
        </a>
      </div>
    </div>
  )
}
