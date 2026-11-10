// ─────────────────────────────────────────────────────────────
//  src/lib/seo/i18nMeta.ts
//  Per-locale metadata for translated pages: canonical points at the
//  page in its own language, hreflang lists every language.
//  Use only on pages whose UI is translated; untranslated pages keep
//  their English canonical so /hi copies are not indexed as duplicates.
// ─────────────────────────────────────────────────────────────
import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { LOCALES, LOCALE_TAGS, OG_LOCALES, isAppLocale, localizePath, type AppLocale } from '@/i18n/config'
import { SITE_URL } from '@/lib/seo/site'

export async function pageLocale(): Promise<AppLocale> {
  const raw = await getLocale()
  return isAppLocale(raw) ? raw : 'en'
}

export function absoluteUrl(path: string, locale: AppLocale): string {
  const p = localizePath(path, locale)
  return p === '/' ? SITE_URL : `${SITE_URL}${p}`
}

export function localeAlternates(path: string, locale: AppLocale): NonNullable<Metadata['alternates']> {
  return {
    canonical: absoluteUrl(path, locale),
    languages: {
      ...Object.fromEntries(LOCALES.map((l) => [LOCALE_TAGS[l], absoluteUrl(path, l)])),
      'x-default': absoluteUrl(path, 'en'),
    },
  }
}

/**
 * Take an English Metadata object and, for Hindi, swap in Hindi copy and
 * localized URLs. `hi` holds only the fields that differ.
 */
export function localizeMetadata(
  path: string,
  locale: AppLocale,
  en: Metadata,
  hi: { title: string; description: string; ogTitle?: string; ogDescription?: string; keywords?: string[] },
): Metadata {
  const isHi = locale === 'hi'
  const url = absoluteUrl(path, locale)
  return {
    ...en,
    ...(isHi ? { title: hi.title, description: hi.description, keywords: hi.keywords ?? en.keywords } : {}),
    alternates: localeAlternates(path, locale),
    openGraph: {
      ...en.openGraph,
      url,
      locale: OG_LOCALES[locale],
      ...(isHi ? { title: hi.ogTitle ?? hi.title, description: hi.ogDescription ?? hi.description } : {}),
    },
    twitter: {
      ...en.twitter,
      ...(isHi ? { title: hi.ogTitle ?? hi.title, description: hi.ogDescription ?? hi.description } : {}),
    },
  }
}

/** Hindi shares need ?lang=hi on the image URL. The image route reads that flag. */
export function withHindiOgImage(
  meta: Metadata,
  locale: AppLocale,
  imagePath: string,
  altHi: string,
): Metadata {
  if (locale !== 'hi') return meta
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
  const image = `${SITE_URL}${path}?lang=hi`
  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      images: [{ url: image, width: 1200, height: 630, alt: altHi }],
    },
    twitter: {
      ...meta.twitter,
      images: [image],
    },
  }
}
