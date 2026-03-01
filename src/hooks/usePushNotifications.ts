'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

type PushPermission = 'granted' | 'denied' | 'default' | 'unsupported'

export function usePushNotifications() {
  const { user } = useAuth()
  const [permission, setPermission] = useState<PushPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)

  const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window

  // Check current state
  useEffect(() => {
    if (!isSupported) {
      setPermission('unsupported')
      setLoading(false)
      return
    }

    setPermission(Notification.permission as PushPermission)

    if (!user) {
      setLoading(false)
      return
    }

    // Check if already subscribed
    navigator.serviceWorker.ready.then(async (registration) => {
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user, isSupported])

  const subscribe = useCallback(async () => {
    if (!user || !isSupported) return

    try {
      const perm = await Notification.requestPermission()
      setPermission(perm as PushPermission)
      if (perm !== 'granted') return

      const registration = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        console.error('VAPID public key not configured')
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const subJson = subscription.toJSON()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('push_subscriptions').upsert(
        {
          user_id: user.id,
          endpoint: subJson.endpoint!,
          p256dh: subJson.keys!.p256dh!,
          auth: subJson.keys!.auth!,
        },
        { onConflict: 'user_id,endpoint' }
      )

      if (!error) {
        setIsSubscribed(true)
      }
    } catch (err) {
      console.error('Push subscription failed:', err)
    }
  }, [user, isSupported])

  const unsubscribe = useCallback(async () => {
    if (!user || !isSupported) return

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        const endpoint = subscription.endpoint
        await subscription.unsubscribe()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', endpoint)
      }

      setIsSubscribed(false)
    } catch (err) {
      console.error('Push unsubscribe failed:', err)
    }
  }, [user, isSupported])

  return { permission, isSubscribed, loading, subscribe, unsubscribe, isSupported }
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i)
  }
  return buffer
}
