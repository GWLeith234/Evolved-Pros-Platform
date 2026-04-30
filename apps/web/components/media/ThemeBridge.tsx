'use client'

import { useEffect } from 'react'

export function ThemeBridge() {
  useEffect(() => {
    document.body.setAttribute('data-theme', 'cream')
    document.documentElement.classList.add('cream-mode')
    return () => {
      document.body.removeAttribute('data-theme')
      document.documentElement.classList.remove('cream-mode')
    }
  }, [])
  return null
}
