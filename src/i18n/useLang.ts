'use client'
// Current page language for engine calls and Intl formatting.
import { useLocale } from 'next-intl'
import { intlTag, isAppLocale, type AppLocale } from './config'

export function useLang(): { lang: AppLocale; tag: string; hi: boolean } {
  const raw = useLocale()
  const lang: AppLocale = isAppLocale(raw) ? raw : 'en'
  return { lang, tag: intlTag(lang), hi: lang === 'hi' }
}
