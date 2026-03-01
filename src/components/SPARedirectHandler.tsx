'use client'

import { useEffect } from 'react'

export function SPARedirectHandler() {
  useEffect(() => {
    // Register Service Worker for SPA support + push notifications
    if ('serviceWorker' in navigator) {
      const swPath = window.location.hostname !== 'localhost' && window.location.pathname.startsWith('/second-campus')
        ? '/second-campus/sw.js'
        : '/sw.js'
      navigator.serviceWorker.register(swPath)
    }
  }, [])

  return null
}
