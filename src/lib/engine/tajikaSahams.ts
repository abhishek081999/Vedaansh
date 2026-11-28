// ─────────────────────────────────────────────────────────────
//  src/lib/engine/tajikaSahams.ts
//  Tajika sahams (sensitive points), as tabulated in Tājika Nīlakaṇṭhī.
//  Each is A − B + C. By night many reverse to B − A + C. When C does not
//  fall between B and A (counting forward from B), 30° is added.
//  House cusps are equal houses from the lagna degree; lords are whole-sign.
//  Authors differ on a few formulas; this is one consistent table.
//  Pure, no React/DB/Redis.
// ─────────────────────────────────────────────────────────────

import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { TAJIKA_SIGN_LORD } from './tajikaBala'

export type SahamId =
  | 'punya' | 'vidya' | 'yasas' | 'mitra' | 'mahatmya' | 'asha' | 'samartha' | 'bhratri'
  | 'gaurava' | 'pitri' | 'rajya' | 'matri' | 'putra' | 'jeeva' | 'karma' | 'roga' | 'kali'
  | 'sastra' | 'bandhu' | 'mrityu' | 'paradesa' | 'artha' | 'paradara' | 'vanik' | 'karyasiddhi'
  | 'vivaha' | 'prasava' | 'santapa' | 'shraddha' | 'preeti' | 'jadya' | 'vyapara' | 'shatru'
  | 'jalapatana' | 'bandhana' | 'apamrityu' | 'labha'

/**
 * A term: a planet, 'L' (lagna), 'H<n>' (equal-house cusp), 'LL<n>' (lord of
 * the n-th sign from lagna), 'Cn15' (15° Cancer), or another saham.
 */
type Term = GrahaId | 'L' | `H${number}` | `LL${number}` | 'Cn15' | SahamId

interface SahamDef { id: SahamId; en: string; hi: string; day: [Term, Term, Term]; night: 'reverse' | 'same' }

export const SAHAMS: SahamDef[] = [
  { id: 'punya', en: 'Puṇya', hi: 'पुण्य', day: ['Mo', 'Su', 'L'], night: 'reverse' },
  { id: 'vidya', en: 'Vidyā', hi: 'विद्या', day: ['Su', 'Mo', 'L'], night: 'reverse' },
  { id: 'yasas', en: 'Yaśas', hi: 'यश', day: ['Ju', 'punya', 'L'], night: 'reverse' },
  { id: 'mitra', en: 'Mitra', hi: 'मित्र', day: ['Ju', 'punya', 'Ve'], night: 'same' },
  { id: 'mahatmya', en: 'Māhātmya', hi: 'माहात्म्य', day: ['punya', 'Ma', 'L'], night: 'reverse' },
  { id: 'asha', en: 'Āśā', hi: 'आशा', day: ['Sa', 'Ma', 'L'], night: 'reverse' },
  { id: 'samartha', en: 'Sāmarthya', hi: 'सामर्थ्य', day: ['Ma', 'LL1', 'L'], night: 'reverse' },
  { id: 'bhratri', en: 'Bhrātṛ', hi: 'भ्रातृ', day: ['Ju', 'Sa', 'L'], night: 'same' },
  { id: 'gaurava', en: 'Gaurava', hi: 'गौरव', day: ['Ju', 'Mo', 'Su'], night: 'reverse' },
  { id: 'pitri', en: 'Pitṛ', hi: 'पितृ', day: ['Sa', 'Su', 'L'], night: 'reverse' },
  { id: 'rajya', en: 'Rājya', hi: 'राज्य', day: ['Sa', 'Su', 'L'], night: 'reverse' },
  { id: 'matri', en: 'Mātṛ', hi: 'मातृ', day: ['Mo', 'Ve', 'L'], night: 'reverse' },
  { id: 'putra', en: 'Putra', hi: 'पुत्र', day: ['Ju', 'Mo', 'L'], night: 'same' },
  { id: 'jeeva', en: 'Jīva', hi: 'जीव', day: ['Sa', 'Ju', 'L'], night: 'reverse' },
  { id: 'karma', en: 'Karma', hi: 'कर्म', day: ['Ma', 'Me', 'L'], night: 'reverse' },
  { id: 'roga', en: 'Roga', hi: 'रोग', day: ['L', 'Mo', 'L'], night: 'same' },
  { id: 'kali', en: 'Kali', hi: 'कलि', day: ['Ju', 'Ma', 'L'], night: 'reverse' },
  { id: 'sastra', en: 'Śāstra', hi: 'शास्त्र', day: ['Ju', 'Sa', 'Me'], night: 'reverse' },
  { id: 'bandhu', en: 'Bandhu', hi: 'बन्धु', day: ['Me', 'Mo', 'L'], night: 'reverse' },
  { id: 'mrityu', en: 'Mṛtyu', hi: 'मृत्यु', day: ['H8', 'Mo', 'Sa'], night: 'same' },
  { id: 'paradesa', en: 'Paradeśa', hi: 'परदेश', day: ['H9', 'LL9', 'L'], night: 'same' },
  { id: 'artha', en: 'Artha', hi: 'अर्थ', day: ['H2', 'LL2', 'L'], night: 'same' },
  { id: 'paradara', en: 'Paradāra', hi: 'परदार', day: ['Ve', 'Su', 'L'], night: 'same' },
  { id: 'vanik', en: 'Vaṇik', hi: 'वणिक्', day: ['Mo', 'Me', 'L'], night: 'same' },
  { id: 'karyasiddhi', en: 'Kāryasiddhi', hi: 'कार्यसिद्धि', day: ['Sa', 'Su', 'L'], night: 'same' },
  { id: 'vivaha', en: 'Vivāha', hi: 'विवाह', day: ['Ve', 'Sa', 'L'], night: 'same' },
  { id: 'prasava', en: 'Prasava', hi: 'प्रसव', day: ['Ju', 'Me', 'L'], night: 'reverse' },
  { id: 'santapa', en: 'Santāpa', hi: 'सन्ताप', day: ['Sa', 'Mo', 'H6'], night: 'reverse' },
  { id: 'shraddha', en: 'Śraddhā', hi: 'श्रद्धा', day: ['Ve', 'Ma', 'L'], night: 'reverse' },
  { id: 'preeti', en: 'Prīti', hi: 'प्रीति', day: ['sastra', 'punya', 'L'], night: 'reverse' },
  { id: 'jadya', en: 'Jāḍya', hi: 'जाड्य', day: ['Ma', 'Sa', 'Me'], night: 'reverse' },
  { id: 'vyapara', en: 'Vyāpāra', hi: 'व्यापार', day: ['Ma', 'Sa', 'L'], night: 'same' },
  { id: 'shatru', en: 'Śatru', hi: 'शत्रु', day: ['Ma', 'Sa', 'L'], night: 'reverse' },
  { id: 'jalapatana', en: 'Jalapatana', hi: 'जलपतन', day: ['Cn15', 'Sa', 'L'], night: 'reverse' },
  { id: 'bandhana', en: 'Bandhana', hi: 'बन्धन', day: ['punya', 'Sa', 'L'], night: 'reverse' },
  { id: 'apamrityu', en: 'Apamṛtyu', hi: 'अपमृत्यु', day: ['H8', 'Ma', 'L'], night: 'same' },
  { id: 'labha', en: 'Lābha', hi: 'लाभ', day: ['H11', 'LL11', 'L'], night: 'same' },
]

export interface Saham {
  id: SahamId
  name: string
  longitude: number
  rashi: Rashi
  degree: number
  lord: GrahaId
  /** Whole-sign house from the lagna. */
  house: number
  /** A, B, C actually used, after the night reversal. */
  formula: [string, string, string]
  plus30: boolean
}

export interface SahamInput {
  ascDegree: number
  grahas: Record<string, GrahaData>
  /** Defaults to the Sun above the horizon (in houses 7–12 by longitude). */
  isDay?: boolean
}

const norm = (x: number) => ((x % 360) + 360) % 360

/** Sun above the horizon: more than 180° ahead of the ascendant along the zodiac. */
export const sunAboveHorizon = (ascDegree: number, sunLon: number) => norm(sunLon - ascDegree) >= 180

/** A − B + C, plus 30° when C is not between B and A counting forward from B. */
export function sahamPoint(a: number, b: number, c: number): { lon: number; plus30: boolean } {
  const plus30 = !(norm(c - b) < norm(a - b))
  return { lon: norm(a - b + c + (plus30 ? 30 : 0)), plus30 }
}

export function computeSahams(input: SahamInput, lang: 'en' | 'hi' = 'en'): Saham[] {
  const { ascDegree, grahas } = input
  const ascRashi = (Math.floor(norm(ascDegree) / 30) + 1) as Rashi
  const isDay = input.isDay ?? (grahas.Su ? sunAboveHorizon(ascDegree, grahas.Su.totalDegree) : true)
  const done: Partial<Record<SahamId, number>> = {}
  const out: Saham[] = []

  const lon = (t: Term): number => {
    if (t === 'L') return norm(ascDegree)
    if (t === 'Cn15') return 105
    if (/^H\d+$/.test(t)) return norm(ascDegree + 30 * (Number(t.slice(1)) - 1))
    if (/^LL\d+$/.test(t)) {
      const lord = TAJIKA_SIGN_LORD[((ascRashi - 1 + Number(t.slice(2)) - 1) % 12) + 1]
      return grahas[lord].totalDegree
    }
    if (t in done) return done[t as SahamId]!
    return grahas[t].totalDegree
  }
  const label = (t: Term): string => {
    if (/^LL\d+$/.test(t)) return TAJIKA_SIGN_LORD[((ascRashi - 1 + Number(t.slice(2)) - 1) % 12) + 1]
    return t
  }

  for (const def of SAHAMS) {
    let [a, b, c] = def.day
    // Sāmarthya: when Mars itself rules the lagna, Jupiter takes its place.
    if (def.id === 'samartha' && TAJIKA_SIGN_LORD[ascRashi] === 'Ma') { a = 'Ju'; b = 'Ma' }
    // Kāryasiddhi: Saturn − Sun + lord of the Sun's sign by day; Saturn − Moon + lord of the Moon's sign by night.
    if (def.id === 'karyasiddhi') {
      const lum: GrahaId = isDay ? 'Su' : 'Mo'
      const lord = TAJIKA_SIGN_LORD[grahas[lum].rashi]
      a = 'Sa'; b = lum; c = lord
    } else if (!isDay && def.night === 'reverse') {
      ;[a, b] = [b, a]
    }
    const p = sahamPoint(lon(a), lon(b), lon(c))
    done[def.id] = p.lon
    const rashi = (Math.floor(p.lon / 30) + 1) as Rashi
    out.push({
      id: def.id,
      name: lang === 'hi' ? def.hi : def.en,
      longitude: Math.round(p.lon * 100) / 100,
      rashi,
      degree: Math.round((p.lon % 30) * 100) / 100,
      lord: TAJIKA_SIGN_LORD[rashi],
      house: ((rashi - ascRashi + 12) % 12) + 1,
      formula: [label(a), label(b), label(c)],
      plus30: p.plus30,
    })
  }
  return out
}

/** Sahams that speak to each praśna matter, most important first. */
export const TOPIC_SAHAMS: Record<string, SahamId[]> = {
  general: ['karyasiddhi', 'punya'],
  career: ['rajya', 'karma'],
  money: ['artha', 'labha'],
  marriage: ['vivaha'],
  children: ['putra', 'prasava'],
  health: ['roga'],
  education: ['vidya', 'sastra'],
  property: ['karyasiddhi'],
  travel: ['paradesa'],
  dispute: ['shatru', 'kali'],
}
