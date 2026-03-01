'use client'

import { useState, useRef } from 'react'
import { ProtectedRoute } from '@/components/ui/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { UserAvatar } from '@/components/ui/UserAvatar'

function ProfileContent() {
  const { user } = useAuth()
  const { username, avatarUrl, loading, updateUsername, uploadAvatar, removeAvatar } = useProfile()
  const [editName, setEditName] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startEditing = () => {
    setEditName(username || '')
    setEditing(true)
    setMessage(null)
  }

  const handleSaveName = async () => {
    if (!editName.trim()) return
    setSaving(true)
    setMessage(null)
    try {
      await updateUsername(editName.trim())
      setEditing(false)
      setMessage({ type: 'success', text: 'ユーザー名を更新しました' })
    } catch {
      setMessage({ type: 'error', text: 'ユーザー名の更新に失敗しました' })
    } finally {
      setSaving(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'ファイルサイズは10MB以下にしてください' })
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = () => setPreviewUrl(reader.result as string)
    reader.readAsDataURL(file)

    setSaving(true)
    setMessage(null)
    try {
      await uploadAvatar(file)
      setPreviewUrl(null)
      setMessage({ type: 'success', text: 'アバターを更新しました' })
    } catch (err) {
      setPreviewUrl(null)
      const detail = err instanceof Error ? err.message : ''
      setMessage({ type: 'error', text: `アバターのアップロードに失敗しました${detail ? `: ${detail}` : ''}` })
    } finally {
      setSaving(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await removeAvatar()
      setMessage({ type: 'success', text: 'アバターを削除しました' })
    } catch {
      setMessage({ type: 'error', text: 'アバターの削除に失敗しました' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
        プロフィール
      </h1>

      {/* Message */}
      {message && (
        <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Avatar Section */}
        <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-6">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            アバター
          </label>
          <div className="flex items-center gap-4">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="preview" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <UserAvatar username={username} avatarUrl={avatarUrl} size="lg" className="!w-16 !h-16 !text-xl" />
            )}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-neutral-700 dark:text-neutral-300 rounded-lg transition-colors disabled:opacity-50"
              >
                画像を変更
              </button>
              {avatarUrl && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors disabled:opacity-50"
                >
                  削除
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Username Section */}
        <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-6">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            ユーザー名
          </label>
          {editing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg text-sm text-neutral-900 dark:text-neutral-100 focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 transition-all outline-none"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                disabled={saving || !editName.trim()}
                className="px-4 py-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                {saving ? '保存中...' : '保存'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
              >
                キャンセル
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-900 dark:text-neutral-100">
                {username || '未設定'}
              </span>
              <button
                onClick={startEditing}
                className="px-3 py-1.5 text-sm font-medium text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-950 rounded-lg transition-colors"
              >
                編集
              </button>
            </div>
          )}
        </div>

        {/* Email Section (read-only) */}
        <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-6">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            メールアドレス
          </label>
          <span className="text-sm text-neutral-500">
            {user?.email}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  )
}
