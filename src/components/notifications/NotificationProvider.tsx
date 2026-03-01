'use client'

import { ReactNode } from 'react'
import { NotificationContext, useNotificationsState } from '@/hooks/useNotifications'

export function NotificationProvider({ children }: { children: ReactNode }) {
  const notificationState = useNotificationsState()

  return (
    <NotificationContext.Provider value={notificationState}>
      {children}
    </NotificationContext.Provider>
  )
}
