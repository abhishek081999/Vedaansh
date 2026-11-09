// Shared display helpers for Jaimini engine text.
// English ordinals and names stay exactly as the English modules wrote them.

import type { GrahaId, Rashi } from '@/types/astrology'
import { termHi } from '@/i18n/jyotish'
import { gName, rName, type EngineLang } from '@/lib/engine/divisionalLang'

export type { EngineLang }

export function say(lang: EngineLang, en: string, hi: string): string {
  return lang === 'hi' ? hi : en
}

export function jLang(lang?: EngineLang): EngineLang {
  return lang === 'hi' ? 'hi' : 'en'
}

const HI_ORD = [
  '',
  'पहले', 'दूसरे', 'तीसरे', 'चौथे', 'पाँचवें', 'छठे',
  'सातवें', 'आठवें', 'नौवें', 'दसवें', 'ग्यारहवें', 'बारहवें',
]

/** English 1st/2nd/3rd/nth. Hindi ordinal for houses 1–12. */
export function jOrd(n: number, lang: EngineLang): string {
  if (lang !== 'hi') {
    if (n === 1) return '1st'
    if (n === 2) return '2nd'
    if (n === 3) return '3rd'
    return `${n}th`
  }
  return HI_ORD[n] ?? `${n}वें`
}

export function jG(id: GrahaId, lang: EngineLang): string {
  return gName(id, lang)
}

export function jR(rashi: Rashi, lang: EngineLang): string {
  return rName(rashi, lang)
}

/** Nakshatra and planet-name display. English names stay English. */
export function jStar(name: string, lang: EngineLang): string {
  return lang === 'hi' ? termHi(name) : name
}
