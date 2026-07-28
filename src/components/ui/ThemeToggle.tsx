'use client'
// ─────────────────────────────────────────────────────────
//  ThemeToggle.tsx
//  Icon button – toggles data-theme on <html>
//  Persists to localStorage as 'jyotish-theme'
// ─────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'

type ThemeType = 'dark' | 'light' | 'classic'

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeType>('classic')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('jyotish-theme') as ThemeType | null
    const initial = stored && ['dark', 'light', 'classic'].includes(stored) ? stored : 'classic'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
    setMounted(true)
  }, [])

  const toggle = () => {
    const nextThemeMap: Record<ThemeType, ThemeType> = {
      dark: 'light',
      light: 'classic',
      classic: 'dark'
    }
    const next = nextThemeMap[theme as ThemeType] ?? 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('jyotish-theme', next)
  }

  if (!mounted) return null

  let icon = '☀️'
  let label = 'Light'
  let transform = 'rotate(0deg) scale(1)'

  if (theme === 'dark') {
    icon = '☀️'
    label = 'Light'
    transform = 'rotate(0deg) scale(1)'
  } else if (theme === 'light') {
    icon = '📜'
    label = 'Classic'
    transform = 'rotate(360deg) scale(1.1)'
  } else if (theme === 'classic') {
    icon = '🌙'
    label = 'Dark'
    transform = 'rotate(180deg) scale(1)'
  }

  return (
    <button
      id="theme-toggle-btn"
      className="theme-toggle-btn"
      onClick={toggle}
      aria-label={`Switch to ${label} theme`}
      title={`Switch to ${label} theme`}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-bright)'
        e.currentTarget.style.boxShadow = '0 0 12px var(--glow-gold-sm)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <span
        className="theme-toggle-icon"
        style={{ transform }}
      >
        {icon}
      </span>
      <span className="theme-toggle-label">
        {label}
      </span>
    </button>
  )
}
