'use client'

import { useState } from 'react'

interface DeleteCircleDialogProps {
  open: boolean
  circleName: string
  onClose: () => void
  onConfirm: () => Promise<unknown>
}

export function DeleteCircleDialog({
  open,
  circleName,
  onClose,
  onConfirm,
}: DeleteCircleDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)

    try {
      await onConfirm()
      onClose()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'サークルの削除に失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-surface-900 rounded-xl shadow-xl border border-surface-200 dark:border-surface-800 p-6">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          サークルを削除
        </h2>
        <p className="text-sm text-neutral-500 mb-2">
          「{circleName}」を削除しますか？
        </p>
        <p className="text-sm text-red-500 mb-4">
          チャンネル・メッセージ・メンバー情報もすべて削除されます。この操作は取り消せません。
        </p>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {loading ? '削除中...' : '削除'}
          </button>
        </div>
      </div>
    </div>
  )
}
