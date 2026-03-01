'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useJoinCircle } from '@/hooks/useJoinCircle'

interface JoinByCodeDialogProps {
  open: boolean
  onClose: () => void
}

export function JoinByCodeDialog({ open, onClose }: JoinByCodeDialogProps) {
  const router = useRouter()
  const { joinByCode, loading } = useJoinCircle()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setError(null)

    try {
      const circleId = await joinByCode(code)
      setCode('')
      onClose()
      router.push(`/circles/${circleId}`)
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? (err as { message: string }).message
            : '参加に失敗しました'
      setError(
        message.includes('Invalid invite code')
          ? '無効な招待コードです'
          : message
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-surface-900 rounded-xl shadow-xl border border-surface-200 dark:border-surface-800 p-6">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
          招待コードで参加
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              招待コード
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.slice(0, 6))}
              placeholder="6文字のコードを入力"
              maxLength={6}
              className="w-full px-3 py-2.5 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 transition-all outline-none tracking-widest text-center text-lg font-mono"
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading || code.trim().length < 1}
              className="px-5 py-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              {loading ? '参加中...' : '参加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
