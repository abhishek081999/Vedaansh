// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nakshatraExtras.ts
//  More nakshatra techniques:
//   • Gandmool dosha (birth Moon in Ashwini, Ashlesha, Magha,
//     Jyeshtha, Mula or Revati) — pada effect, strength, remedy
//   • Namakshar — naming syllables and a name checker
//   • Ghatak chakra — unfavourable Moon sign, month, tithi, weekday
//     and nakshatra for a natal Moon sign
//  Pure: ids and numbers only; wording lives in messages/{en,hi}.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { AKSHAR_CHAKRA } from '@/lib/engine/naamkaran'
import { AKSHAR_CHAKRA_DE } from '@/lib/engine/locale/naamkaran.hi'

const NAK_SPAN = 360 / 27

// ─────────────────────────────────────────────────────────────
//  1. Gandmool
// ─────────────────────────────────────────────────────────────

/** The six Gandmool stars: Ketu's (Ashwini, Magha, Mula) and Mercury's (Ashlesha, Jyeshtha, Revati). */
export const GANDMOOL_STARS = [0, 8, 9, 17, 18, 26] as const

export type GandmoolEffect =
  | 'father' | 'mother' | 'self' | 'wealth' | 'elderSibling' | 'youngerSibling'
  | 'comfort' | 'honour' | 'minister' | 'auspicious' | 'gain'

const HARMFUL = new Set<GandmoolEffect>(['father', 'mother', 'self', 'wealth', 'elderSibling', 'youngerSibling'])

/** Effect of each pada (common Muhurta / panchang table; traditions differ in detail). */
const GANDMOOL_PADA: Record<number, [GandmoolEffect, GandmoolEffect, GandmoolEffect, GandmoolEffect]> = {
  0:  ['father', 'comfort', 'minister', 'honour'],             // Ashwini
  8:  ['auspicious', 'wealth', 'mother', 'father'],            // Ashlesha
  9:  ['mother', 'father', 'comfort', 'gain'],                 // Magha
  17: ['elderSibling', 'youngerSibling', 'mother', 'self'],    // Jyeshtha
  18: ['father', 'mother', 'wealth', 'auspicious'],            // Mula
  26: ['honour', 'minister', 'comfort', 'self'],               // Revati
}

/** Classical japa counts for the star lord (Ketu 17,000 · Mercury 9,000). */
const JAPA: Record<'Ke' | 'Me', number> = { Ke: 17000, Me: 9000 }

/** Abhukta Mula: last 2 ghatis of Jyeshtha / first 2 of Mula ≈ the Moon's ~0.43° of motion. */
export const ABHUKTA_ORB_DEG = 0.43

export interface GandmoolResult {
  isGandmool: boolean
  nakshatraIndex: number
  pada: number
  lord: 'Ke' | 'Me' | null
  /** Water star ending a sign group (Ashlesha, Jyeshtha, Revati) or fire star beginning one. */
  side: 'water' | 'fire' | null
  /** Strong in the pada that touches the water–fire junction (Gandanta). */
  severity: 'strong' | 'mild' | null
  abhukta: boolean
  effect: GandmoolEffect | null
  harmful: boolean
  japa: number | null
}

export function analyzeGandmool(moonLonSidereal: number): GandmoolResult {
  const lon = ((moonLonSidereal % 360) + 360) % 360
  const nak = Math.min(26, Math.floor(lon / NAK_SPAN))
  const inNak = lon - nak * NAK_SPAN
  const pada = Math.min(4, Math.floor(inNak / (NAK_SPAN / 4)) + 1)
  const table = GANDMOOL_PADA[nak]
  if (!table) {
    return { isGandmool: false, nakshatraIndex: nak, pada, lord: null, side: null, severity: null, abhukta: false, effect: null, harmful: false, japa: null }
  }
  const side: 'water' | 'fire' = nak === 8 || nak === 17 || nak === 26 ? 'water' : 'fire'
  const junctionPada = side === 'water' ? 4 : 1
  const lord: 'Ke' | 'Me' = side === 'fire' ? 'Ke' : 'Me'
  const abhukta =
    (nak === 17 && NAK_SPAN - inNak <= ABHUKTA_ORB_DEG) ||
    (nak === 18 && inNak <= ABHUKTA_ORB_DEG)
  const effect = table[pada - 1]
  return {
    isGandmool: true,
    nakshatraIndex: nak,
    pada,
    lord,
    side,
    severity: pada === junctionPada ? 'strong' : 'mild',
    abhukta,
    effect,
    harmful: HARMFUL.has(effect),
    japa: JAPA[lord],
  }
}

/** The full 6 × 4 table, for the reference grid. */
export function gandmoolTable(): Array<{ nakshatraIndex: number; padas: Array<{ effect: GandmoolEffect; harmful: boolean; strong: boolean }> }> {
  return GANDMOOL_STARS.map(nak => {
    const water = nak === 8 || nak === 17 || nak === 26
    return {
      nakshatraIndex: nak,
      padas: GANDMOOL_PADA[nak].map((effect, i) => ({
        effect,
        harmful: HARMFUL.has(effect),
        strong: i + 1 === (water ? 4 : 1),
      })),
    }
  })
}

// ─────────────────────────────────────────────────────────────
//  2. Namakshar
// ─────────────────────────────────────────────────────────────

export interface SyllableCell {
  nakshatraIndex: number
  pada: number
  latin: string
  devanagari: string
}

export function namaksharTable(): SyllableCell[][] {
  return AKSHAR_CHAKRA.map((row, n) =>
    row.map((latin, p) => ({ nakshatraIndex: n, pada: p + 1, latin, devanagari: AKSHAR_CHAKRA_DE[n]?.[p] ?? latin })),
  )
}

export function birthSyllable(nakshatraIndex: number, pada: number): SyllableCell {
  const n = ((nakshatraIndex % 27) + 27) % 27
  const p = Math.min(4, Math.max(1, pada))
  return { nakshatraIndex: n, pada: p, latin: AKSHAR_CHAKRA[n][p - 1], devanagari: AKSHAR_CHAKRA_DE[n]?.[p - 1] ?? AKSHAR_CHAKRA[n][p - 1] }
}

const latinKey = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '')

/**
 * Which padas a name's opening sound belongs to. Matches the longest
 * syllable that the name starts with (Latin or Devanagari); a sound such
 * as "Na" or "Ta" belongs to more than one pada, so all matches return.
 */
export function matchNameSyllable(name: string): SyllableCell[] {
  const raw = name.trim()
  if (!raw) return []
  const isDeva = /[ऀ-ॿ]/.test(raw)
  const cells = namaksharTable().flat()
  const key = isDeva ? raw.replace(/\s+/g, '') : latinKey(raw)
  if (!key) return []
  let best: SyllableCell[] = []
  let bestLen = 0
  for (const c of cells) {
    const syl = isDeva ? c.devanagari : latinKey(c.latin)
    if (!syl || !key.startsWith(syl)) continue
    if (syl.length > bestLen) {
      best = [c]
      bestLen = syl.length
    } else if (syl.length === bestLen) {
      best.push(c)
    }
  }
  return best
}

// ─────────────────────────────────────────────────────────────
//  3. Ghatak chakra
// ─────────────────────────────────────────────────────────────

export type TithiGroup = 'nanda' | 'bhadra' | 'jaya' | 'rikta' | 'purna'
export type LunarMonth =
  | 'chaitra' | 'vaishakha' | 'jyeshtha' | 'ashadha' | 'shravana' | 'bhadrapada'
  | 'ashwin' | 'kartik' | 'margashirsha' | 'pausha' | 'magha' | 'phalguna'

export const TITHI_GROUP_NUMBERS: Record<TithiGroup, number[]> = {
  nanda: [1, 6, 11], bhadra: [2, 7, 12], jaya: [3, 8, 13], rikta: [4, 9, 14], purna: [5, 10, 15],
}

export interface GhatakRow {
  moonSign: Rashi
  /** Transit Moon sign (Ghatak Chandra). */
  transitMoonSign: Rashi
  month: LunarMonth
  tithi: TithiGroup
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number
  nakshatraIndex: number
}

/** Ghatak chakra by natal Moon sign (panchang table; the Lagna column differs between texts and is left out). */
export const GHATAK: Record<Rashi, GhatakRow> = {
  1:  { moonSign: 1,  transitMoonSign: 1,  month: 'kartik',       tithi: 'nanda',  weekday: 0, nakshatraIndex: 9 },
  2:  { moonSign: 2,  transitMoonSign: 6,  month: 'margashirsha', tithi: 'purna',  weekday: 6, nakshatraIndex: 12 },
  3:  { moonSign: 3,  transitMoonSign: 11, month: 'ashadha',      tithi: 'bhadra', weekday: 1, nakshatraIndex: 14 },
  4:  { moonSign: 4,  transitMoonSign: 5,  month: 'pausha',       tithi: 'bhadra', weekday: 3, nakshatraIndex: 16 },
  5:  { moonSign: 5,  transitMoonSign: 10, month: 'jyeshtha',     tithi: 'jaya',   weekday: 6, nakshatraIndex: 18 },
  6:  { moonSign: 6,  transitMoonSign: 3,  month: 'bhadrapada',   tithi: 'purna',  weekday: 6, nakshatraIndex: 21 },
  7:  { moonSign: 7,  transitMoonSign: 9,  month: 'magha',        tithi: 'rikta',  weekday: 4, nakshatraIndex: 23 },
  8:  { moonSign: 8,  transitMoonSign: 2,  month: 'ashwin',       tithi: 'nanda',  weekday: 5, nakshatraIndex: 26 },
  9:  { moonSign: 9,  transitMoonSign: 12, month: 'shravana',     tithi: 'jaya',   weekday: 5, nakshatraIndex: 1 },
  10: { moonSign: 10, transitMoonSign: 5,  month: 'vaishakha',    tithi: 'rikta',  weekday: 2, nakshatraIndex: 3 },
  11: { moonSign: 11, transitMoonSign: 9,  month: 'chaitra',      tithi: 'jaya',   weekday: 4, nakshatraIndex: 5 },
  12: { moonSign: 12, transitMoonSign: 11, month: 'phalguna',     tithi: 'purna',  weekday: 5, nakshatraIndex: 8 },
}

/** Tithi 1–30 → its 1–15 position within the paksha. */
export const tithiInPaksha = (tithi: number) => ((Math.floor(tithi) - 1) % 15) + 1

export function tithiGroupOf(tithi: number): TithiGroup {
  const t = tithiInPaksha(tithi)
  return (Object.keys(TITHI_GROUP_NUMBERS) as TithiGroup[]).find(g => TITHI_GROUP_NUMBERS[g].includes(t))!
}

export interface GhatakToday {
  transitMoonSign: boolean
  tithi: boolean
  weekday: boolean
  nakshatra: boolean
  count: number
}

/** Compare a day's panchang with the natal Moon sign's ghatak row. */
export function ghatakMatches(
  natalMoonSign: Rashi,
  day: { moonSign: Rashi; tithi: number; weekday: number; nakshatraIndex: number },
): GhatakToday {
  const g = GHATAK[natalMoonSign]
  const r = {
    transitMoonSign: day.moonSign === g.transitMoonSign,
    tithi: tithiGroupOf(day.tithi) === g.tithi,
    weekday: day.weekday === g.weekday,
    nakshatra: day.nakshatraIndex === g.nakshatraIndex,
  }
  return { ...r, count: Object.values(r).filter(Boolean).length }
}
