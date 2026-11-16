import { readAuthCookieNames, signOutCookieHeaders } from './authCookies'

/**
 * Sign out on www. supabase.auth.signOut clears the host-only cookies it
 * knows about. We then expire every chunk and the stray .evolvedpros.com
 * variant, which signOut does not see because live cookies have no Domain.
 */
export async function signOutBrowser(): Promise<void> {
  const before = typeof document === 'undefined' ? '' : document.cookie
  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()
  await supabase.auth.signOut()
  if (typeof document === 'undefined') return
  const secure = typeof location !== 'undefined' && location.protocol === 'https:'
  const names = readAuthCookieNames(`${before}; ${document.cookie}`)
  for (const header of signOutCookieHeaders(names, secure)) {
    document.cookie = header
  }
}
