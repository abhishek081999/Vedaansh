// ─────────────────────────────────────────────────────────────
//  src/lib/engine/jaimini/family.ts
//  Jaimini relationship significators.
//  Where two planets compete, the stronger dignity wins;
//  degree in sign breaks a tie.
//  Mars is noted as mother only when both Moon and Venus are weak.
// ─────────────────────────────────────────────────────────────

import type { GrahaData, GrahaId } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { jG, jLang, say, type EngineLang } from '../locale/jaiminiLang'

export interface FamilyKarakaRow {
  relation: string
  rule: string
  planet: GrahaId
  planetName: string
  note: string | null
}

function dignityScore(dignity?: string): number {
  switch (dignity) {
    case 'exalted': return 9
    case 'moolatrikona': return 8
    case 'own': return 7
    case 'great_friend': return 6
    case 'friend': return 5
    case 'neutral': return 4
    case 'enemy': return 3
    case 'great_enemy': return 2
    case 'debilitated': return 1
    default: return 0
  }
}

function isWeak(g: GrahaData | undefined): boolean {
  if (!g) return true
  return g.dignity === 'debilitated' || g.dignity === 'enemy' || g.dignity === 'great_enemy'
}

function stronger(a: GrahaId, b: GrahaId, grahas: GrahaData[]): GrahaId {
  const pa = grahas.find(g => g.id === a)
  const pb = grahas.find(g => g.id === b)
  if (!pa) return b
  if (!pb) return a
  const sa = dignityScore(pa.dignity) * 100 + pa.degree
  const sb = dignityScore(pb.dignity) * 100 + pb.degree
  if (sa !== sb) return sa >= sb ? a : b
  return pa.degree >= pb.degree ? a : b
}

function row(
  relation: string,
  rule: string,
  planet: GrahaId,
  lang: EngineLang,
  note: string | null = null,
): FamilyKarakaRow {
  return { relation, rule, planet, planetName: lang === 'hi' ? jG(planet, lang) : GRAHA_NAMES[planet], note }
}

/** Fixed Jaimini significators for relatives. These do not follow the chara-karaka order. */
export function calculateFamilyKarakas(grahas: GrahaData[], lang: EngineLang = 'en'): FamilyKarakaRow[] {
  const L = jLang(lang)
  const father = stronger('Su', 'Ve', grahas)
  const mother = stronger('Mo', 'Ve', grahas)
  const moon = grahas.find(g => g.id === 'Mo')
  const venus = grahas.find(g => g.id === 'Ve')
  const motherNote = isWeak(moon) && isWeak(venus)
    ? say(L, 'Moon and Venus are both weak, so Mars can signify the mother in this chart.', 'चंद्र और शुक्र दोनों निर्बल हैं, इसलिए इस कुंडली में मंगल माता का कारक बन सकता है।')
    : null

  return [
    row(say(L, 'Father', 'पिता'), say(L, 'Stronger of Sun or Venus', 'सूर्य या शुक्र में जो बलवान हो'), father, L),
    row(say(L, 'Mother', 'माता'), say(L, 'Stronger of Moon or Venus', 'चंद्र या शुक्र में जो बलवान हो'), mother, L, motherNote),
    row(say(L, 'Younger siblings', 'छोटे भाई-बहन'), say(L, 'Mars', 'मंगल'), 'Ma', L),
    row(say(L, 'Uncle / aunt', 'चाचा / बुआ'), say(L, 'Mercury', 'बुध'), 'Me', L),
    row(say(L, 'Paternal grandfather', 'दादा'), say(L, 'Jupiter', 'गुरु'), 'Ju', L),
    row(say(L, 'Spouse', 'पति / पत्नी'), say(L, 'Venus', 'शुक्र'), 'Ve', L),
    row(say(L, 'Children', 'संतान'), say(L, 'Saturn', 'शनि'), 'Sa', L),
    row(say(L, 'Maternal grandfather', 'नाना'), say(L, 'Rahu', 'राहु'), 'Ra', L),
    row(say(L, 'Grandmother', 'दादी / नानी'), say(L, 'Ketu', 'केतु'), 'Ke', L),
  ]
}
