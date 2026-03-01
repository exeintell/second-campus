'use client'

import { useState } from 'react'

interface CreateChannelDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (name: string, description: string) => Promise<unknown>
}

export function CreateChannelDialog({
  open,
  onClose,
  onSubmit,
}: CreateChannelDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    try {
      await onSubmit(name.trim(), description.trim())
      setName('')
      setDescription('')
      onClose()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'チャンネルの作成に失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-surface-900 rounded-xl shadow-xl border border-surface-200 dark:border-surface-800 p-6">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
          新しいチャンネルを作成
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              チャンネル名 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="チャンネルの名前"
              className="w-full px-3 py-2.5 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 transition-all outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              説明
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="チャンネルの説明（任意）"
              rows={3}
              className="w-full px-3 py-2.5 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 transition-all outline-none resize-none"
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
              disabled={loading || !name.trim()}
              className="px-5 py-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              {loading ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
