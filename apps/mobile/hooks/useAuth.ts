import { useSyncExternalStore } from 'react'
import { Session } from '@supabase/supabase-js'

// ── Module-level singleton store (no external state lib needed) ────────────

interface AuthState {
  session: Session | null
}

let state: AuthState = { session: null }
const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function getSnapshot(): AuthState {
  return state
}

export function setSession(session: Session | null): void {
  state = { session }
  listeners.forEach(l => l())
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useAuthStore(): { session: Session | null; setSession: typeof setSession } {
  const { session } = useSyncExternalStore(subscribe, getSnapshot)
  return { session, setSession }
}
