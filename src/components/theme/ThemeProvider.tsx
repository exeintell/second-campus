'use client'

import { ReactNode } from 'react'
import { ThemeContext, useThemeState } from '@/hooks/useTheme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeState = useThemeState()

  return (
    <ThemeContext.Provider value={themeState}>
      {children}
    </ThemeContext.Provider>
  )
}
