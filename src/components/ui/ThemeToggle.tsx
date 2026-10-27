'use client'
// ─────────────────────────────────────────────────────────
//  ThemeToggle.tsx
//  Icon button – toggles data-theme on <html>
//  Persists to localStorage as 'jyotish-theme'
// ─────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { Moon, ScrollText, Sun } from 'lucide-react'

type ThemeType = 'dark' | 'light' | 'classic'

const NEXT_THEME: Record<ThemeType, { label: string; Icon: typeof Sun }> = {
  dark: { label: 'Light', Icon: Sun },
  light: { label: 'Classic', Icon: ScrollText },
  classic: { label: 'Dark', Icon: Moon },
}

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

  const { label, Icon } = NEXT_THEME[theme]

  return (
    <button
      id="theme-toggle-btn"
      className="theme-toggle-btn"
      onClick={toggle}
      aria-label={`Switch to ${label} theme`}
      title={`Switch to ${label} theme`}
    >
      <span className="theme-toggle-icon">
        <Icon size={16} strokeWidth={2} aria-hidden />
      </span>
      <span className="theme-toggle-label">
        {label}
      </span>
    </button>
  )
}
