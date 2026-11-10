// Locale for opengraph-image routes.
// Next calls the image function as ({ params }) only — searchParams are not passed.
// Layouts append ?lang=hi, and the proxy copies that onto the locale header.

import { headers } from 'next/headers'
import { LOCALE_COOKIE, LOCALE_HEADER, isAppLocale } from '@/i18n/config'
import { pageLocale } from '@/lib/seo/i18nMeta'

export type OgSearchParams = { lang?: string | string[] }

function langParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  return raw === 'hi' || raw === 'en' ? raw : undefined
}

function urlLooksHindi(h: Headers): boolean {
  const url = [
    h.get('next-url'),
    h.get('x-url'),
    h.get('x-invoke-path'),
    h.get('x-forwarded-uri'),
    h.get('x-middleware-request-url'),
    h.get('referer'),
  ].filter(Boolean).join(' ')
  return /(?:\?|&)lang=hi(?:&|$)|\/hi\//.test(url)
}

function cookieIsHindi(h: Headers): boolean {
  const cookie = h.get('cookie') ?? ''
  return new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=hi(?:;|$)`).test(cookie)
}

/** Hindi when searchParams, the locale header (pageLocale), the cookie, or the URL says hi. */
export async function ogIsHindi(
  searchParams?: Promise<OgSearchParams | undefined> | OgSearchParams,
): Promise<boolean> {
  const sp = searchParams instanceof Promise ? await searchParams : searchParams
  const query = langParam(sp?.lang)
  if (query === 'hi') return true
  if (query === 'en') return false

  let h: Headers | undefined
  try {
    h = await headers()
  } catch {
    h = undefined
  }

  if (h) {
    const headerLocale = h.get(LOCALE_HEADER)
    if (headerLocale === 'hi' || cookieIsHindi(h) || urlLooksHindi(h)) return true
    if (isAppLocale(headerLocale)) return false
  }

  try {
    return (await pageLocale()) === 'hi'
  } catch {
    return false
  }
}
