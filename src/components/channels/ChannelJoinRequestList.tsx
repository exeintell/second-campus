'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useChannels } from '@/hooks/useChannels'
import { UserAvatar } from '@/components/ui/UserAvatar'

interface JoinRequest {
  id: string
  user_id: string
  created_at: string
  users: { username: string | null; avatar_url: string | null } | null
}

interface ChannelJoinRequestListProps {
  channelId: string
}

export function ChannelJoinRequestList({ channelId }: ChannelJoinRequestListProps) {
  const { approveJoinRequest, rejectJoinRequest } = useChannels()
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    const fetchRequests = async () => {
      const { data } = await supabase
        .from('channel_join_requests')
        .select('id, user_id, created_at, users(username, avatar_url)')
        .eq('channel_id', channelId)
        .eq('status', 'pending')
        .order('created_at')

      setRequests((data as unknown as JoinRequest[]) || [])
    }

    fetchRequests()
  }, [channelId])

  if (requests.length === 0) return null

  const handleApprove = async (requestId: string) => {
    setProcessing(requestId)
    try {
      await approveJoinRequest(requestId)
      setRequests((prev) => prev.filter((r) => r.id !== requestId))
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (requestId: string) => {
    setProcessing(requestId)
    try {
      await rejectJoinRequest(requestId)
      setRequests((prev) => prev.filter((r) => r.id !== requestId))
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="border-b border-surface-200 dark:border-surface-800 p-3">
      <p className="text-xs font-semibold text-neutral-500 mb-2">
        参加申請 <span className="text-accent-500">{requests.length}</span>
      </p>
      <div className="space-y-2">
        {requests.map((req) => (
          <div key={req.id} className="flex items-center gap-2 p-2 rounded-lg bg-surface-50 dark:bg-surface-950">
            <UserAvatar username={req.users?.username} avatarUrl={req.users?.avatar_url} size="sm" />
            <span className="flex-1 text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {req.users?.username || '名前未設定'}
            </span>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => handleApprove(req.id)}
                disabled={processing === req.id}
                className="px-2 py-0.5 text-[10px] font-semibold bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white rounded transition-colors"
              >
                承認
              </button>
              <button
                onClick={() => handleReject(req.id)}
                disabled={processing === req.id}
                className="px-2 py-0.5 text-[10px] font-medium text-neutral-500 hover:bg-surface-200 dark:hover:bg-surface-800 rounded transition-colors"
              >
                却下
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
