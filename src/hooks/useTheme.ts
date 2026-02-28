'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

function getSystemDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyDarkClass(dark: boolean) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', dark)
}

export function useThemeState() {
  const [theme, setThemeState] = useState<Theme>('system')
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  const resolveAndApply = useCallback((t: Theme) => {
    const dark = t === 'dark' || (t === 'system' && getSystemDark())
    setIsDark(dark)
    applyDarkClass(dark)
  }, [])

  // Initial mount: read from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null
    const initial = saved || 'system'
    setThemeState(initial)
    resolveAndApply(initial)
    setMounted(true)
  }, [resolveAndApply])

  // Listen for OS preference changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      setIsDark(mq.matches)
      applyDarkClass(mq.matches)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    resolveAndApply(newTheme)
  }, [resolveAndApply])

  return { theme, setTheme, isDark, mounted }
}
