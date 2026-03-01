'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useCircleContext } from '@/components/circles/CircleProvider'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { InviteToChannelDialog } from './InviteToChannelDialog'
import { ChannelJoinRequestList } from './ChannelJoinRequestList'

interface MemberInfo {
  user_id: string
  username: string | null
  avatar_url: string | null
}

interface ChannelMemberListProps {
  open: boolean
  onClose: () => void
  channelId: string
  isOwner: boolean
}

export function ChannelMemberList({ open, onClose, channelId, isOwner }: ChannelMemberListProps) {
  const { channels } = useCircleContext()
  const [members, setMembers] = useState<MemberInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  const channel = channels.find((c) => c.id === channelId)

  useEffect(() => {
    if (!open) return

    const fetchMembers = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('channel_members')
        .select('user_id, users(username, avatar_url)')
        .eq('channel_id', channelId)

      const result: MemberInfo[] = (data || []).map((d) => {
        const u = d.users as unknown as { username: string | null; avatar_url: string | null } | null
        return {
          user_id: d.user_id,
          username: u?.username ?? null,
          avatar_url: u?.avatar_url ?? null,
        }
      })
      setMembers(result)
      setLoading(false)
    }

    fetchMembers()
  }, [open, channelId])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative w-full max-w-sm mx-4 bg-white dark:bg-surface-900 rounded-xl shadow-xl">
          <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                メンバー
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">{members.length} 人</p>
            </div>
            <div className="flex items-center gap-2">
              {isOwner && (
                <button
                  onClick={() => setShowInvite(true)}
                  className="px-2.5 py-1 text-xs font-semibold bg-accent-500 hover:bg-accent-600 text-white rounded-md transition-colors"
                >
                  招待
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-800 text-neutral-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Join Requests (admin/owner only) */}
          {isOwner && channel?.is_private && (
            <ChannelJoinRequestList channelId={channelId} />
          )}

          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-neutral-500">読み込み中...</div>
            ) : members.length === 0 ? (
              <div className="p-4 text-center text-sm text-neutral-500">メンバーがいません</div>
            ) : (
              members.map((m) => (
                <div key={m.user_id} className="flex items-center gap-3 p-3">
                  <UserAvatar username={m.username} avatarUrl={m.avatar_url} size="md" />
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {m.username || '名前未設定'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <InviteToChannelDialog
        open={showInvite}
        onClose={() => setShowInvite(false)}
        channelId={channelId}
        existingMemberIds={members.map((m) => m.user_id)}
      />
    </>
  )
}
