'use client'
// English ⇄ हिन्दी toggle. Saves the choice in NEXT_LOCALE (the proxy
// uses it to keep unprefixed links in the chosen language) and does a
// full navigation so <html lang>, metadata and server text all switch.
import { useLocale, useTranslations } from 'next-intl'
import { Languages } from 'lucide-react'
import { usePathname } from '@/i18n/navigation'
import {
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_LABELS,
  isAppLocale,
  localizePath,
  type AppLocale,
} from '@/i18n/config'

const ONE_YEAR = 60 * 60 * 24 * 365

export function switchLocale(target: AppLocale, pathname: string) {
  document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=${ONE_YEAR}; samesite=lax`
  const href = `${localizePath(pathname, target)}${window.location.search}${window.location.hash}`
  window.location.assign(href)
}

export function LanguageSwitcher({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const t = useTranslations('common.language')
  const raw = useLocale()
  const locale: AppLocale = isAppLocale(raw) ? raw : 'en'
  const pathname = usePathname()
  const target = LOCALES.find((l) => l !== locale) ?? 'en'

  return (
    <button
      type="button"
      className={`lang-switcher ${className}`.trim()}
      onClick={() => switchLocale(target, pathname)}
      aria-label={t('switchTo', { language: LOCALE_LABELS[target] })}
      title={t('current', { language: LOCALE_LABELS[locale] })}
      lang={target === 'hi' ? 'hi' : 'en'}
    >
      <Languages size={15} strokeWidth={2} aria-hidden />
      <span className="lang-switcher-label">{compact ? (target === 'hi' ? 'हि' : 'EN') : LOCALE_LABELS[target]}</span>
    </button>
  )
}
