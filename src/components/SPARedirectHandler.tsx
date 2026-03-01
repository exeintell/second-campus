'use client'

import { useEffect } from 'react'

export function SPARedirectHandler() {
  useEffect(() => {
    // Register Service Worker for GitHub Pages SPA support (client-side navigation)
    if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
      navigator.serviceWorker.register(
        `${window.location.pathname.startsWith('/second-campus') ? '/second-campus' : ''}/sw.js`
      )
    }
  }, [])

  return null
}
