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

/** Browser chrome colour per theme — keep in sync with themeScript in app/layout.tsx. */
const THEME_CHROME: Record<ThemeType, string> = {
  dark: '#121212',
  light: '#ffffff',
  classic: '#8c0030',
}

function isTheme(value: string | null): value is ThemeType {
  return value === 'dark' || value === 'light' || value === 'classic'
}

function applyThemeChrome(theme: ThemeType) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_CHROME[theme])
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeType>('classic')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    let stored: string | null = null
    try {
      stored = localStorage.getItem('jyotish-theme')
    } catch {
      /* storage blocked — fall back to classic */
    }
    const initial: ThemeType = isTheme(stored) ? stored : 'classic'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
    applyThemeChrome(initial)
    setMounted(true)

    // Several toggles can be on screen (header + account settings) — keep them in step.
    const root = document.documentElement
    const observer = new MutationObserver(() => {
      const current = root.getAttribute('data-theme')
      if (isTheme(current)) setTheme(current)
    })
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const toggle = () => {
    const nextThemeMap: Record<ThemeType, ThemeType> = {
      dark: 'light',
      light: 'classic',
      classic: 'dark'
    }
    const next = nextThemeMap[theme] ?? 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    applyThemeChrome(next)
    try {
      localStorage.setItem('jyotish-theme', next)
    } catch {
      /* storage blocked — theme still applies for this page view */
    }
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
