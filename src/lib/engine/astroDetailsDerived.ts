// Derived values for the Astro Details summary (natal chart).
// Client-safe: no ephemeris / sweph imports.
import type { GrahaData, GrahaId, LagnaData, Rashi } from '@/types/astrology'

function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360
}

const SIGN_LORD: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const INDU_RAYS: Partial<Record<GrahaId, number>> = {
  Su: 30, Mo: 16, Ma: 6, Me: 8, Ju: 10, Ve: 12, Sa: 1,
}

/**
 * Indu (Dhana) Lagna — Uttara Kalamrita / BPHS (Vishesha Chandra Yoga):
 * 1. Add Kala of 9th lord from Lagna + 9th lord from Moon (sign lords).
 * 2. Remainder ÷ 12 (0 → treat as 12th / previous sign from Moon per Astrobix).
 * 3. Count that many houses from Moon (Moon’s sign = 1st); keep Moon’s degree in the result sign.
 */
export function calcInduLagna(moonLon: number, moonRashi: Rashi, ascRashi: Rashi): number {
  const ninthFrom = (base: Rashi) => ((((base + 7) % 12) + 12) % 12 + 1) as Rashi
  const lord1 = SIGN_LORD[ninthFrom(ascRashi)]
  const lord2 = SIGN_LORD[ninthFrom(moonRashi)]
  const totalRays = (INDU_RAYS[lord1] ?? 0) + (INDU_RAYS[lord2] ?? 0)

  const remainder = totalRays % 12
  // Count N houses from Moon (N = remainder); Moon sign is the 1st house counted.
  const offset =
    remainder === 0
      ? -1 // 12th / previous sign from Moon when total is divisible by 12
      : remainder - 1

  const induSign = ((((moonRashi - 1 + offset) % 12) + 12) % 12 + 1) as Rashi
  const degInSign = ((moonLon % 30) + 30) % 30
  return norm360((induSign - 1) * 30 + degInSign)
}

/** Indu Lagna sign from full longitude (rays of 9th lords — see `calcInduLagna`). */
export function getInduLagnaRashiFromLon(induLon: number): Rashi {
  return (Math.floor(((induLon % 360) + 360) % 360 / 30) + 1) as Rashi
}

/** Indu Lagna sign from Moon/Lagna rashis (approximate if Moon degree unknown). */
export function getInduLagnaRashi(moonRashi: Rashi, ascRashi: Rashi, moonLon?: number): Rashi {
  const lon = moonLon ?? (moonRashi - 1) * 30
  return getInduLagnaRashiFromLon(calcInduLagna(lon, moonRashi, ascRashi))
}

/** Bhrigu Bindu: midpoint along forward arc from Rahu to Moon (BPHS / Jaimini tradition). */
export function calcBhriguBinduLon(moonLon: number, rahuLon: number): number {
  const distance = norm360(moonLon - rahuLon)
  return norm360(rahuLon + distance / 2)
}

/** @deprecated Use calcBhriguBinduLon — kept for callers expecting the old name. */
export function getBhriguBinduLon(moonLon: number, rahuLon: number): number {
  return calcBhriguBinduLon(moonLon, rahuLon)
}

/**
 * Recompute Indu Lagna / Bhrigu Bindu from grahas.
 * Always recalculates when Moon is present so stale Redis/DB cache (old formula) cannot persist.
 */
export function hydrateSpecialLagnas(lagnas: LagnaData, grahas: GrahaData[]): LagnaData {
  const moon = grahas.find(g => g.id === 'Mo')
  const rahu = grahas.find(g => g.id === 'Ra')

  let induLagna = lagnas.induLagna
  let bhriguBindu = lagnas.bhriguBindu

  if (moon) {
    induLagna = calcInduLagna(moon.totalDegree, moon.rashi, lagnas.ascRashi)
  }
  if (moon && rahu) {
    bhriguBindu = calcBhriguBinduLon(moon.totalDegree, rahu.totalDegree)
  }

  if (induLagna === lagnas.induLagna && bhriguBindu === lagnas.bhriguBindu) {
    return lagnas
  }
  return { ...lagnas, induLagna, bhriguBindu }
}

const TATVA: Record<number, 'Fire' | 'Earth' | 'Air' | 'Water'> = {
  1: 'Fire', 2: 'Earth', 3: 'Air', 4: 'Water',
  5: 'Fire', 6: 'Earth', 7: 'Air', 8: 'Water',
  9: 'Fire', 10: 'Earth', 11: 'Air', 12: 'Water',
}

export function getRashiTatva(rashi: Rashi): 'Fire' | 'Earth' | 'Air' | 'Water' {
  return TATVA[rashi] ?? 'Fire'
}

/** Paya from birth Nakshatra pada (1–4): Gold → Silver → Copper → Iron. */
export function getNakshatraPaya(pada: number): 'Swarna (Gold)' | 'Rajata (Silver)' | 'Tamra (Copper)' | 'Lauha (Iron)' {
  const p = ((pada - 1) % 4 + 4) % 4
  return (['Swarna (Gold)', 'Rajata (Silver)', 'Tamra (Copper)', 'Lauha (Iron)'] as const)[p]
}

/**
 * Starting syllables for naming (one lead sound per pada; traditions vary slightly).
 * Index: nakshatra 0–26, pada 1–4.
 */
const PADA_SOUNDS: string[][] = [
  ['Chu', 'Che', 'Cho', 'La'],
  ['Li', 'Lu', 'Le', 'Lo'],
  ['A', 'I', 'U', 'E'],
  ['O', 'Va', 'Vi', 'Vu'],
  ['Ve', 'Vo', 'Ka', 'Ke'],
  ['Ku', 'Gha', 'nga', 'Chha'],
  ['Ke', 'Ko', 'Ha', 'Hi'],
  ['Hu', 'He', 'Ho', 'Da'],
  ['Di', 'Du', 'De', 'Do'],
  ['Ma', 'Mi', 'Mu', 'Me'],
  ['Mo', 'Ta', 'Ti', 'Tu'],
  ['Te', 'To', 'Pa', 'Pi'],
  ['Pu', 'Sha', 'Na', 'tha'],
  ['Pe', 'Po', 'Ra', 'Ri'],
  ['Ru', 'Re', 'Ro', 'Ta'],
  ['Ti', 'Tu', 'Te', 'To'],
  ['Na', 'Ni', 'Nu', 'Ne'],
  ['No', 'Ya', 'Yi', 'Yu'],
  ['Ye', 'Yo', 'Bha', 'Bhi'],
  ['Bu', 'Dha', 'Bha', 'Dha'],
  ['Bhe', 'Jo', 'Ja', 'Ji'],
  ['Ju', 'Je', 'Jo', 'Khi'],
  ['Khu', 'Khe', 'Kho', 'Ga'],
  ['Go', 'Sa', 'Si', 'Su'],
  ['Se', 'So', 'Da', 'Di'],
  ['Du', 'Tha', 'Jha', 'na'],
  ['De', 'Do', 'Cha', 'Chi'],
]

export function getPadaNamingSyllable(nakshatraIndex: number, pada: number): string {
  const i = ((nakshatraIndex % 27) + 27) % 27
  const p = Math.min(Math.max(pada, 1), 4) - 1
  return PADA_SOUNDS[i]?.[p] ?? '—'
}

/** Rough Shaka / Vikrama years from civil date (Gregorian); regional lunar-year boundaries differ. */
export function approxIndianEras(isoDate: string): { shaka: number; vikram: number; note: string } {
  const d = new Date(`${isoDate}T12:00:00`)
  const y = d.getFullYear()
  const m = d.getMonth()
  const day = d.getDate()
  // Shaka generally aligned ~22 Mar; use as a simple split.
  const afterYearStart = m > 2 || (m === 2 && day >= 22)
  const shaka = (afterYearStart ? y - 78 : y - 79)
  const vikram = shaka + 135
  return {
    shaka,
    vikram,
    note: 'Approximate civil correlation; exact Hindu lunar year depends on region (Amanta/Purnimanta).',
  }
}

export function formatSiderealLongitude(lon: number): { rashi: Rashi; degInSign: number } {
  const x = ((lon % 360) + 360) % 360
  const rashi = (Math.floor(x / 30) + 1) as Rashi
  const degInSign = x % 30
  return { rashi, degInSign }
}
