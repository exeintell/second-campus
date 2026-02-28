'use client'

import { useState, useRef } from 'react'

interface MessageInputProps {
  onSend: (content: string) => Promise<void>
  disabled?: boolean
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async () => {
    if (!content.trim() || disabled) return

    const text = content
    setContent('')
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      await onSend(text)
    } catch {
      // Restore content on error
      setContent(text)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = () => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }
  }

  return (
    <div className="border-t border-surface-200 dark:border-surface-800 p-3">
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            handleInput()
          }}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力... (Shift+Enter で改行)"
          rows={1}
          className="flex-1 px-3 py-2 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 transition-all outline-none resize-none"
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || disabled}
          className="px-4 py-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-sm shrink-0"
        >
          送信
        </button>
      </div>
    </div>
  )
}
