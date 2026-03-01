'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import type { Database } from '@/types/database.types'

type Circle = Database['public']['Tables']['circles']['Row']

type SearchResult = Pick<Circle, 'id' | 'name' | 'description'>

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return (err as { message: string }).message
  }
  return fallback
}

export function useJoinCircle() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const joinByCode = useCallback(
    async (code: string): Promise<string> => {
      if (!user) throw new Error('Not authenticated')

      setLoading(true)
      setError(null)

      try {
        const { data, error: rpcError } = await supabase.rpc(
          'join_circle_by_code',
          { code: code.trim().toLowerCase() }
        )

        if (rpcError) throw rpcError
        return data as string
      } catch (err: unknown) {
        const message = getErrorMessage(err, '参加に失敗しました')
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [user]
  )

  const searchCircles = useCallback(
    async (query: string): Promise<SearchResult[]> => {
      if (!user) return []

      const { data, error: searchError } = await supabase
        .from('circles')
        .select('id, name, description')
        .ilike('name', `%${query}%`)
        .limit(20)

      if (searchError) {
        setError(searchError.message)
        return []
      }

      return data || []
    },
    [user]
  )

  const sendJoinRequest = useCallback(
    async (circleId: string) => {
      if (!user) throw new Error('Not authenticated')

      setLoading(true)
      setError(null)

      try {
        const { error: insertError } = await supabase
          .from('join_requests')
          .insert({ circle_id: circleId, user_id: user.id })

        if (insertError) {
          if (insertError.code === '23505') {
            throw new Error('既に申請済みです')
          }
          throw insertError
        }
      } catch (err: unknown) {
        const message = getErrorMessage(err, '申請に失敗しました')
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [user]
  )

  const getMyRequestStatus = useCallback(
    async (
      circleId: string
    ): Promise<'pending' | 'approved' | 'rejected' | null> => {
      if (!user) return null

      const { data } = await supabase
        .from('join_requests')
        .select('status')
        .eq('circle_id', circleId)
        .eq('user_id', user.id)
        .single()

      return (data?.status as 'pending' | 'approved' | 'rejected') ?? null
    },
    [user]
  )

  return { joinByCode, searchCircles, sendJoinRequest, getMyRequestStatus, loading, error }
}
