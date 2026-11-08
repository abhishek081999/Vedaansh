// src/i18n/request.ts — per-request next-intl config (locale from the proxy header)
import { headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { DEFAULT_LOCALE, LOCALE_HEADER, isAppLocale, type AppLocale } from './config'
import { loadMessages } from './messages'

export async function resolveRequestLocale(): Promise<AppLocale> {
  try {
    const value = (await headers()).get(LOCALE_HEADER)
    return isAppLocale(value) ? value : DEFAULT_LOCALE
  } catch {
    // Outside a request (build-time metadata, static routes)
    return DEFAULT_LOCALE
  }
}

export default getRequestConfig(async ({ locale: explicit }) => {
  const locale = isAppLocale(explicit) ? explicit : await resolveRequestLocale()
  return {
    locale,
    messages: await loadMessages(locale),
    timeZone: 'Asia/Kolkata',
    // A missing key renders its English fallback (merged in loadMessages);
    // if even that is missing, show the key path instead of crashing.
    onError(error) {
      if (process.env.NODE_ENV === 'development') console.warn('[i18n]', error.message)
    },
    getMessageFallback({ namespace, key }) {
      return namespace ? `${namespace}.${key}` : key
    },
  }
})
