'use client'

import { useState } from 'react'

interface SlotInput {
  date: string
  startTime: string
  endTime: string
}

interface CreateEventDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (
    title: string,
    description: string,
    slots: { start_time: string; end_time: string | null }[]
  ) => Promise<unknown>
}

export function CreateEventDialog({
  open,
  onClose,
  onSubmit,
}: CreateEventDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [slots, setSlots] = useState<SlotInput[]>([
    { date: '', startTime: '', endTime: '' },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const addSlot = () => {
    setSlots([...slots, { date: '', startTime: '', endTime: '' }])
  }

  const removeSlot = (index: number) => {
    if (slots.length <= 1) return
    setSlots(slots.filter((_, i) => i !== index))
  }

  const updateSlot = (index: number, field: keyof SlotInput, value: string) => {
    setSlots(slots.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const validSlots = slots.filter((s) => s.date && s.startTime)
    if (validSlots.length === 0) {
      setError('少なくとも1つの候補日時を入力してください')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formattedSlots = validSlots.map((s) => ({
        start_time: `${s.date}T${s.startTime}:00`,
        end_time: s.endTime ? `${s.date}T${s.endTime}:00` : null,
      }))
      await onSubmit(title.trim(), description.trim(), formattedSlots)
      setTitle('')
      setDescription('')
      setSlots([{ date: '', startTime: '', endTime: '' }])
      onClose()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'イベントの作成に失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-surface-900 rounded-xl shadow-xl border border-surface-200 dark:border-surface-800 p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
          新しいイベントを作成
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              イベント名 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="イベントの名前"
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
              placeholder="イベントの説明（任意）"
              rows={2}
              className="w-full px-3 py-2.5 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 transition-all outline-none resize-none"
            />
          </div>

          {/* Candidate Slots */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                候補日時 *
              </label>
              <button
                type="button"
                onClick={addSlot}
                className="text-xs text-accent-500 hover:text-accent-600 font-medium"
              >
                + 候補を追加
              </button>
            </div>
            <div className="space-y-2">
              {slots.map((slot, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="date"
                    value={slot.date}
                    onChange={(e) => updateSlot(index, 'date', e.target.value)}
                    className="flex-1 px-2 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg text-sm text-neutral-900 dark:text-neutral-100 focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 transition-all outline-none"
                  />
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) =>
                      updateSlot(index, 'startTime', e.target.value)
                    }
                    className="w-24 px-2 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg text-sm text-neutral-900 dark:text-neutral-100 focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 transition-all outline-none"
                  />
                  <span className="text-neutral-400 text-xs">〜</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) =>
                      updateSlot(index, 'endTime', e.target.value)
                    }
                    placeholder="任意"
                    className="w-24 px-2 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg text-sm text-neutral-900 dark:text-neutral-100 focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 transition-all outline-none"
                  />
                  {slots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(index)}
                      className="w-7 h-7 flex items-center justify-center rounded text-neutral-400 hover:text-red-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors shrink-0"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
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
              disabled={loading || !title.trim()}
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
