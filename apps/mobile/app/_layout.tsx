import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/hooks/useAuth'

export default function RootLayout() {
  const { session, setSession } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    // Hydrate session on mount
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => setSession(s),
    )

    return () => { subscription.unsubscribe() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)'
    if (!session && !inAuthGroup) router.replace('/(auth)/login')
    if (session && inAuthGroup)   router.replace('/(tabs)')
  }, [session, segments, router])

  return <Stack screenOptions={{ headerShown: false }} />
}
