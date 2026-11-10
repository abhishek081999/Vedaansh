// Request locale for engine/PDF/email. English unless Hindi is explicit.
// API routes are not rewritten by the proxy, so the NEXT_LOCALE cookie
// and x-vedaansh-locale header are the request signal; user.language is the fallback.

import type { EngineLang } from '@/lib/engine/lang'
import { LOCALE_COOKIE, LOCALE_HEADER, isAppLocale } from '@/i18n/config'

function cookieValue(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined
  for (const part of cookieHeader.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return decodeURIComponent(rest.join('='))
  }
  return undefined
}

/** Header, then NEXT_LOCALE, then the account language field. */
export function engineLangFromRequest(req: Request, userLanguage?: string | null): EngineLang {
  const header = req.headers.get(LOCALE_HEADER)
  if (isAppLocale(header)) return header
  const cookie = cookieValue(req.headers.get('cookie'), LOCALE_COOKIE)
  if (isAppLocale(cookie)) return cookie
  if (userLanguage === 'hi') return 'hi'
  return 'en'
}

export function engineLangFromUser(userLanguage?: string | null): EngineLang {
  return userLanguage === 'hi' ? 'hi' : 'en'
}
