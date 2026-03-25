import * as Notifications from 'expo-notifications'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { supabase } from '@/lib/supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
})

async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name:      'default',
      importance: Notifications.AndroidImportance.MAX,
    })
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') return null

  const token = await Notifications.getExpoPushTokenAsync()
  return token.data
}

export function useNotifications(userId: string): void {
  useEffect(() => {
    if (!userId) return

    registerForPushNotifications().then(async token => {
      if (!token) return
      await supabase
        .from('users')
        .update({ push_token: token })
        .eq('id', userId)
    })
  }, [userId])
}
