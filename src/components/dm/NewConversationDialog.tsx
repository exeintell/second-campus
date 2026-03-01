'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { UserAvatar } from '@/components/ui/UserAvatar'

interface UserOption {
  id: string
  username: string | null
  avatar_url: string | null
}

interface NewConversationDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (userId: string) => Promise<void>
}

export function NewConversationDialog({
  open,
  onClose,
  onSelect,
}: NewConversationDialogProps) {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selecting, setSelecting] = useState(false)

  useEffect(() => {
    if (!open || !user) return

    const fetchUsers = async () => {
      setLoading(true)

      // Get all circle members from user's circles
      const { data: myCircles } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', user.id)

      if (!myCircles || myCircles.length === 0) {
        setUsers([])
        setLoading(false)
        return
      }

      const circleIds = myCircles.map((c) => c.circle_id)

      const { data: members } = await supabase
        .from('circle_members')
        .select('user_id, users(id, username, avatar_url)')
        .in('circle_id', circleIds)
        .neq('user_id', user.id)

      if (!members) {
        setUsers([])
        setLoading(false)
        return
      }

      // Deduplicate by user_id
      const seen = new Set<string>()
      const uniqueUsers: UserOption[] = []
      for (const m of members) {
        const u = m.users as unknown as UserOption | null
        if (u && !seen.has(u.id)) {
          seen.add(u.id)
          uniqueUsers.push(u)
        }
      }

      // Sort by username
      uniqueUsers.sort((a, b) =>
        (a.username ?? '').localeCompare(b.username ?? '')
      )

      setUsers(uniqueUsers)
      setLoading(false)
    }

    fetchUsers()
  }, [open, user])

  if (!open) return null

  const filtered = search
    ? users.filter((u) =>
        (u.username ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : users

  const handleSelect = async (userId: string) => {
    setSelecting(true)
    try {
      await onSelect(userId)
    } finally {
      setSelecting(false)
      setSearch('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm mx-4 bg-white dark:bg-surface-900 rounded-xl shadow-xl">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              新しい会話
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-800 text-neutral-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ユーザーを検索..."
            className="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 transition-all outline-none"
          />
        </div>

        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-neutral-500">
              読み込み中...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-neutral-500">
              {search ? '該当するユーザーがいません' : 'サークルメンバーがいません'}
            </div>
          ) : (
            filtered.map((u) => (
              <button
                key={u.id}
                onClick={() => handleSelect(u.id)}
                disabled={selecting}
                className="w-full flex items-center gap-3 p-3 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
              >
                <UserAvatar username={u.username} avatarUrl={u.avatar_url} size="md" />
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {u.username || '名前未設定'}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
