// ─────────────────────────────────────────────────────────────
//  src/i18n/config.ts
//  Locale constants and path helpers. No Next.js imports, so the
//  proxy, server code and tests can all use it.
//
//  URL scheme: English has no prefix (/chart), Hindi lives under
//  /hi (/hi/chart). The proxy strips /hi and rewrites to the same
//  page, passing the locale in LOCALE_HEADER — pages do not move
//  into an app/[locale] folder.
// ─────────────────────────────────────────────────────────────

export const LOCALES = ['en', 'hi'] as const
export type AppLocale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = 'en'

/** Request header the proxy sets with the resolved locale. */
export const LOCALE_HEADER = 'x-vedaansh-locale'

/** Request header the proxy sets with the path minus its locale prefix. */
export const PATHNAME_HEADER = 'x-vedaansh-pathname'

/** Remembers the visitor's language choice (also read by API routes). */
export const LOCALE_COOKIE = 'NEXT_LOCALE'

/** BCP 47 tags for <html lang>, Open Graph and hreflang. */
export const LOCALE_TAGS: Record<AppLocale, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
}

export const OG_LOCALES: Record<AppLocale, string> = {
  en: 'en_IN',
  hi: 'hi_IN',
}

/** Name of each language in that language, for the switcher. */
export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: 'English',
  hi: 'हिन्दी',
}

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/** Locales that carry a URL prefix (every one except the default). */
const PREFIXED = LOCALES.filter((l) => l !== DEFAULT_LOCALE)

/**
 * Split a pathname into its locale and the path without the prefix.
 * `/hi/chart` → { locale: 'hi', pathname: '/chart', prefixed: true }
 * `/hi`       → { locale: 'hi', pathname: '/',      prefixed: true }
 * `/chart`    → { locale: 'en', pathname: '/chart', prefixed: false }
 */
export function splitLocalePath(pathname: string): {
  locale: AppLocale
  pathname: string
  prefixed: boolean
} {
  for (const locale of PREFIXED) {
    if (pathname === `/${locale}`) return { locale, pathname: '/', prefixed: true }
    if (pathname.startsWith(`/${locale}/`)) {
      return { locale, pathname: pathname.slice(locale.length + 1), prefixed: true }
    }
  }
  return { locale: DEFAULT_LOCALE, pathname, prefixed: false }
}

/** Add the locale prefix to an unprefixed, root-relative path. */
export function localizePath(pathname: string, locale: AppLocale): string {
  if (locale === DEFAULT_LOCALE) return pathname
  if (pathname === '/' || pathname === '') return `/${locale}`
  return `/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`
}

/**
 * Paths that are never localized: APIs, framework assets, files.
 * The proxy neither prefixes nor redirects these.
 */
export function isLocalizablePath(pathname: string): boolean {
  if (pathname.startsWith('/api/') || pathname === '/api') return false
  if (pathname.startsWith('/_next/')) return false
  if (pathname.startsWith('/.well-known/')) return false
  if (pathname === '/sw.js' || pathname.startsWith('/swe-worker')) return false
  if (pathname === '/manifest.json' || pathname === '/robots.txt' || pathname === '/sitemap.xml') return false
  if (pathname.startsWith('/opengraph-image') || pathname.endsWith('/opengraph-image')) return false
  if (/\.[a-z0-9]{2,5}$/i.test(pathname)) return false
  return true
}

/** Intl tag for dates and numbers. Hindi keeps Western digits (0–9). */
export function intlTag(locale: string): string {
  return locale === 'hi' ? 'hi-IN' : 'en-IN'
}
