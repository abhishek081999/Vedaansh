// ─────────────────────────────────────────────────────────────
//  src/lib/engine/divisionalLang.ts
//  Shared language helpers for the divisional-chart engines
//  (D3, D4, D9, D10, D12, D27). English output is unchanged; Hindi
//  names come from the glossary and display tables live in
//  src/lib/engine/locale/divisional*.hi.ts.
// ─────────────────────────────────────────────────────────────

import type { Dignity, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { fill, type EngineLang } from '@/lib/engine/lang'

export { fill, type EngineLang }

export const DIGNITY_HI: Record<Dignity, string> = {
  exalted: 'उच्च',
  moolatrikona: 'मूलत्रिकोण',
  own: 'स्वराशि',
  great_friend: 'अधिमित्र राशि',
  friend: 'मित्र राशि',
  neutral: 'सम राशि',
  enemy: 'शत्रु राशि',
  great_enemy: 'अधिशत्रु राशि',
  debilitated: 'नीच',
}

/** Graha display name in the requested language. */
export function gName(id: GrahaId, lang: EngineLang = 'en'): string {
  return lang === 'hi' ? GRAHA_HI[id] ?? GRAHA_NAMES[id] : GRAHA_NAMES[id]
}

/** Rashi display name in the requested language. */
export function rName(rashi: Rashi, lang: EngineLang = 'en'): string {
  return lang === 'hi' ? RASHI_HI[rashi] ?? RASHI_NAMES[rashi] : RASHI_NAMES[rashi]
}

/** Dignity as display text ("great enemy" / "अधिशत्रु राशि"). */
export function dignityText(d: Dignity, lang: EngineLang = 'en'): string {
  return lang === 'hi' ? DIGNITY_HI[d] ?? d : d.replace(/_/g, ' ')
}

/** Pick the English or Hindi variant of a same-shaped value. */
export function pick<T>(en: T, hi: T, lang: EngineLang = 'en'): T {
  return lang === 'hi' ? hi : en
}
