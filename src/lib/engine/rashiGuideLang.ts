// ─────────────────────────────────────────────────────────────
//  src/lib/engine/rashiGuideLang.ts
//  Rashi profile + planet-in-sign text in a display language for the
//  House → Rashi guide. Reads the English tables in rashiInterpretations
//  and the Hindi tables (rashiProfiles.hi via rashiProfileText,
//  planetCard.hi RASHI_CORE_HI, interpretations.hi summary layer,
//  rashiGuide.hi lordSummary + full layer). English output unchanged.
// ─────────────────────────────────────────────────────────────

import type { EngineLang } from './lang'
import type { ClassicalGrahaId, HouseNumber } from './houseInterpretations'
import {
  getPlanetInSign,
  getRashiInHouse,
  getRashiProfile,
  rashiProfileText,
  type InterpDetail,
  type RashiProfile,
} from './rashiInterpretations'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { RASHI_CORE_HI } from './locale/planetCard.hi'
import { PLANET_IN_SIGN_FULL_HI, RASHI_LORD_SUMMARY_HI } from './locale/rashiGuide.hi'

/** Rashi profile with display strings in `lang` (ids, lord and maps keep their keys). */
export function getRashiProfileInLang(rashi: number, lang: EngineLang = 'en'): RashiProfile | null {
  const en = getRashiProfile(rashi)
  if (!en || lang !== 'hi') return en
  const t = (s: string) => rashiProfileText(s, 'hi')
  const inHouse = Object.fromEntries(
    Object.entries(en.inHouse).map(([h, s]) => [h, t(s)]),
  ) as Record<HouseNumber, string>
  return {
    ...en,
    english: RASHI_HI[en.rashi] ?? en.english,
    lordHindi: GRAHA_HI[en.lord] ?? en.lordHindi,
    coreSummary: RASHI_CORE_HI[en.rashi - 1] ?? en.coreSummary,
    coreNature: en.coreNature.map(t),
    lordSummary: RASHI_LORD_SUMMARY_HI[en.rashi] ?? en.lordSummary,
    lordNotes: en.lordNotes.map(t),
    inHouse,
    remedies: en.remedies.map(t),
    specialRules: en.specialRules.map(t),
  }
}

export function getRashiInHouseInLang(rashi: number, house: number, lang: EngineLang = 'en'): string | null {
  const en = getRashiInHouse(rashi, house)
  return en && lang === 'hi' ? rashiProfileText(en, 'hi') : en
}

/** Planet-in-sign note; Hindi has both the summary and the full layer. */
export function getPlanetInSignInLang(
  grahaId: string,
  rashi: number,
  detail: InterpDetail = 'summary',
  lang: EngineLang = 'en',
): string | null {
  if (lang !== 'hi') return getPlanetInSign(grahaId, rashi, detail)
  if (detail === 'full') {
    return PLANET_IN_SIGN_FULL_HI[rashi]?.[grahaId as ClassicalGrahaId] ?? getPlanetInSign(grahaId, rashi, 'summary', 'hi')
  }
  return getPlanetInSign(grahaId, rashi, 'summary', 'hi')
}
