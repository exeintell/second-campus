'use client'

import { createContext, useContext } from 'react'
import { useCircleDetail } from '@/hooks/useCircleDetail'
import type { Database } from '@/types/database.types'
import type { MemberWithUser } from '@/hooks/useCircleDetail'

type Circle = Database['public']['Tables']['circles']['Row']
type Channel = Database['public']['Tables']['channels']['Row']

interface CircleContextType {
  circle: Circle | null
  channels: Channel[]
  members: MemberWithUser[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const CircleContext = createContext<CircleContextType | undefined>(undefined)

export function useCircleContext() {
  const context = useContext(CircleContext)
  if (!context) {
    throw new Error('useCircleContext must be used within CircleProvider')
  }
  return context
}

export function CircleProvider({
  circleId,
  children,
}: {
  circleId: string
  children: React.ReactNode
}) {
  const detail = useCircleDetail(circleId)

  return (
    <CircleContext.Provider value={detail}>{children}</CircleContext.Provider>
  )
}
