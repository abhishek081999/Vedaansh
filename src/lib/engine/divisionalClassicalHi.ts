// ─────────────────────────────────────────────────────────────
//  src/lib/engine/divisionalClassicalHi.ts
//  Hindi stand-ins for the shared classical-note getters, used by the
//  divisional-chart engines (D4 / D10). classicalInterpretations.ts is
//  shared with many panels, so it stays English; in Hindi we return the
//  Hindi summary of the same note (first note of each English list) from
//  the existing Hindi tables. English callers keep the original getters.
// ─────────────────────────────────────────────────────────────

import {
  getDignityAwarePlanetInSign,
  getHouseClassical,
  getPlanetInHouseClassical,
  getRashiClassical,
  type ClassicalNote,
} from '@/lib/engine/classicalInterpretations'
import { HOUSE_THEMES_HI } from '@/lib/engine/locale/interpretations.hi'
import {
  CLASSICAL_HOUSE_SUMMARY_HI,
  CLASSICAL_SIGN_SUMMARY_HI,
  DIGNITY_CLASSICAL_HI,
  RASHI_CORE_HI,
} from '@/lib/engine/locale/planetCard.hi'
import type { EngineLang } from '@/lib/engine/lang'
import type { HouseNumber } from '@/lib/engine/houseInterpretations'

type G9 = keyof typeof CLASSICAL_HOUSE_SUMMARY_HI

function isG9(id: string): id is G9 {
  return id in CLASSICAL_HOUSE_SUMMARY_HI
}

export function planetInHouseNotes(grahaId: string, house: number, lang: EngineLang = 'en'): ClassicalNote[] {
  const en = getPlanetInHouseClassical(grahaId, house)
  if (lang !== 'hi') return en
  const text = isG9(grahaId) ? CLASSICAL_HOUSE_SUMMARY_HI[grahaId][house - 1] : undefined
  return text && en.length ? [{ source: en[0].source, text }] : []
}

export function planetInSignNotes(grahaId: string, rashi: number, dignity: string, lang: EngineLang = 'en'): ClassicalNote[] {
  const en = getDignityAwarePlanetInSign(grahaId, rashi, dignity)
  if (lang !== 'hi') return en
  const out: ClassicalNote[] = []
  const sign = isG9(grahaId) ? CLASSICAL_SIGN_SUMMARY_HI[grahaId][rashi - 1] : undefined
  if (sign) out.push({ source: 'BPHS', text: sign })
  const dig = DIGNITY_CLASSICAL_HI[dignity]
  if (dig) out.push({ source: 'BPHS', text: dig })
  return out
}

export function houseNotes(house: number, lang: EngineLang = 'en'): ClassicalNote[] {
  const en = getHouseClassical(house)
  if (lang !== 'hi') return en
  const h = HOUSE_THEMES_HI[house as HouseNumber]
  return h && en.length ? [{ source: en[0].source, text: `${h.sanskrit}: ${h.shortThemes}।` }] : []
}

export function rashiNotes(rashi: number, lang: EngineLang = 'en'): ClassicalNote[] {
  const en = getRashiClassical(rashi)
  if (lang !== 'hi') return en
  const text = RASHI_CORE_HI[rashi - 1]
  return text && en.length ? [{ source: en[0].source, text }] : []
}
