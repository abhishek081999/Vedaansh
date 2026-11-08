// src/i18n/routing.ts — next-intl routing: English unprefixed, Hindi under /hi
import { defineRouting } from 'next-intl/routing'
import { DEFAULT_LOCALE, LOCALES } from './config'

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'as-needed',
  // src/proxy.ts owns detection and the NEXT_LOCALE cookie; next-intl's
  // middleware is not used.
  localeDetection: false,
  localeCookie: false,
  alternateLinks: false,
})
