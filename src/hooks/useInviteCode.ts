'use client'

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useInviteCode(circleId: string) {
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCode = useCallback(async () => {
    if (!circleId) return

    const { data } = await supabase
      .from('circles')
      .select('invite_code')
      .eq('id', circleId)
      .single()

    setInviteCode(data?.invite_code ?? null)
    setLoading(false)
  }, [circleId])

  useEffect(() => {
    fetchCode()
  }, [fetchCode])

  const regenerateCode = useCallback(async () => {
    const newCode = Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map((b) => b.toString(36).slice(-1))
      .join('')
      .slice(0, 6)
      .padEnd(6, '0')

    const { error } = await supabase
      .from('circles')
      .update({ invite_code: newCode })
      .eq('id', circleId)

    if (error) throw error
    setInviteCode(newCode)
  }, [circleId])

  return { inviteCode, loading, regenerateCode, refetch: fetchCode }
}
