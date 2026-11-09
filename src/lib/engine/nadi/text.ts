// Shared display helpers for Nadi prose. English ordinals and joins match
// the forms already emitted by the child readers.

import type { GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { fill, type EngineLang } from '@/lib/engine/lang'
import type { ClassicalGrahaId } from '@/lib/engine/houseInterpretations'

export type { EngineLang }

export function nLang(lang?: EngineLang): EngineLang {
  return lang === 'hi' ? 'hi' : 'en'
}

export function nSay(lang: EngineLang | undefined, en: string, hi: string): string {
  return lang === 'hi' ? hi : en
}

export function nFill(
  lang: EngineLang | undefined,
  en: string,
  hi: string,
  slots: Record<string, string | number>,
): string {
  return fill(lang === 'hi' ? hi : en, slots)
}

export function nG(id: GrahaId | ClassicalGrahaId, lang: EngineLang | undefined): string {
  return lang === 'hi' ? GRAHA_HI[id as GrahaId] : GRAHA_NAMES[id as GrahaId]
}

export function nR(sign: Rashi, lang: EngineLang | undefined): string {
  return lang === 'hi' ? RASHI_HI[sign] : RASHI_NAMES[sign]
}

const HI_ORD = ['', 'पहले', 'दूसरे', 'तीसरे', 'चौथे', 'पाँचवें', 'छठे', 'सातवें', 'आठवें', 'नौवें', 'दसवें', 'ग्यारहवें', 'बारहवें']

/** English ordinal without a leading "the". Hindi is the oblique form used before भाव. */
export function nOrd(n: number, lang: EngineLang | undefined = 'en'): string {
  if (lang === 'hi') return HI_ORD[n] ?? `${n}वें`
  const mod = n % 10
  if (mod === 1 && n !== 11) return `${n}st`
  if (mod === 2 && n !== 12) return `${n}nd`
  if (mod === 3 && n !== 13) return `${n}rd`
  return `${n}th`
}

const HI_NOM = ['', 'पहला', 'दूसरा', 'तीसरा', 'चौथा', 'पाँचवाँ', 'छठा', 'सातवाँ', 'आठवाँ', 'नौवाँ', 'दसवाँ', 'ग्यारहवाँ', 'बारहवाँ']

/** Hindi house ordinal in the direct case, for a sentence subject: "पहला". */
export function nNom(n: number): string {
  return HI_NOM[n] ?? `${n}वाँ`
}

export function nJoin(names: readonly string[], lang: EngineLang | undefined): string {
  if (names.length <= 1) return names[0] ?? ''
  if (lang === 'hi') {
    // A part that already has "और" inside it takes "तथा" as the last joiner.
    const glue = names.some((name) => name.includes(' और ')) ? ' तथा ' : ' और '
    if (names.length === 2) return `${names[0]}${glue}${names[1]}`
    return `${names.slice(0, -1).join(', ')}${glue}${names[names.length - 1]}`
  }
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

const PLANET_WORDS: readonly [string, string][] = [
  ['Saturn', 'शनि'],
  ['Jupiter', 'गुरु'],
  ['Mercury', 'बुध'],
  ['Venus', 'शुक्र'],
  ['Mars', 'मंगल'],
  ['Moon', 'चंद्र'],
  ['Rahu', 'राहु'],
  ['Ketu', 'केतु'],
  ['Sun', 'सूर्य'],
]

/** Swap English planet words in a fixed label. Longer names are replaced first. */
export function nPlanetWords(text: string, lang: EngineLang | undefined): string {
  if (lang !== 'hi') return text
  return PLANET_WORDS.reduce((line, [en, hi]) => line.replaceAll(en, hi), text)
}
