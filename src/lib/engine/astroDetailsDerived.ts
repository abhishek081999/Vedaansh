// Derived values for the Astro Details summary (natal chart).
import type { GrahaId, Rashi } from '@/types/astrology'

const SIGN_LORD: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const VIMSHOTTARI_YEARS: Record<GrahaId, number> = {
  Ke: 7, Ve: 20, Su: 6, Mo: 10, Ma: 7, Ra: 18, Ju: 16, Sa: 19, Me: 17,
  Ur: 0, Ne: 0, Pl: 0,
}

/** Indu Lagna sign: sum of Vimśottarī years of lords of houses 1–9 from Moon, mod 12. */
export function getInduLagnaRashi(moonRashi: Rashi): Rashi {
  let sum = 0
  for (let h = 1; h <= 9; h++) {
    const houseSign = ((((moonRashi + h - 2) % 12) + 12) % 12 + 1) as Rashi
    const lord = SIGN_LORD[houseSign]
    sum += VIMSHOTTARI_YEARS[lord] ?? 0
  }
  const rem = sum % 12
  return (rem === 0 ? 12 : rem) as Rashi
}

/** Circular midpoint of two sidereal longitudes (Bhrigu Bindu: Moon–Rāhu midpoint). */
export function getBhriguBinduLon(moonLon: number, rahuLon: number): number {
  let a = ((moonLon % 360) + 360) % 360
  let b = ((rahuLon % 360) + 360) % 360
  if (Math.abs(a - b) > 180) {
    if (a < b) a += 360
    else b += 360
  }
  return (((a + b) / 2) % 360 + 360) % 360
}

const TATVA: Record<number, 'Fire' | 'Earth' | 'Air' | 'Water'> = {
  1: 'Fire', 2: 'Earth', 3: 'Air', 4: 'Water',
  5: 'Fire', 6: 'Earth', 7: 'Air', 8: 'Water',
  9: 'Fire', 10: 'Earth', 11: 'Air', 12: 'Water',
}

export function getRashiTatva(rashi: Rashi): 'Fire' | 'Earth' | 'Air' | 'Water' {
  return TATVA[rashi] ?? 'Fire'
}

/** Paya from birth Nakṣatra pada (1–4): Gold → Silver → Copper → Iron. */
export function getNakshatraPaya(pada: number): 'Swarna (Gold)' | 'Rajata (Silver)' | 'Tāmra (Copper)' | 'Lauha (Iron)' {
  const p = ((pada - 1) % 4 + 4) % 4
  return (['Swarna (Gold)', 'Rajata (Silver)', 'Tāmra (Copper)', 'Lauha (Iron)'] as const)[p]
}

/**
 * Starting syllables for naming (one lead sound per pada; traditions vary slightly).
 * Index: nakṣatra 0–26, pada 1–4.
 */
const PADA_SOUNDS: string[][] = [
  ['Chu', 'Che', 'Cho', 'La'],
  ['Li', 'Lu', 'Le', 'Lo'],
  ['A', 'I', 'U', 'E'],
  ['O', 'Va', 'Vi', 'Vu'],
  ['Ve', 'Vo', 'Ka', 'Ke'],
  ['Ku', 'Gha', 'ṅa', 'Chha'],
  ['Ke', 'Ko', 'Ha', 'Hi'],
  ['Hu', 'He', 'Ho', 'Da'],
  ['Di', 'Du', 'De', 'Do'],
  ['Ma', 'Mi', 'Mu', 'Me'],
  ['Mo', 'Ta', 'Ti', 'Tu'],
  ['Te', 'To', 'Pa', 'Pi'],
  ['Pu', 'Sha', 'Na', 'ṭha'],
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
  ['Du', 'Tha', 'Jha', 'ṇa'],
  ['De', 'Do', 'Cha', 'Chi'],
]

export function getPadaNamingSyllable(nakshatraIndex: number, pada: number): string {
  const i = ((nakshatraIndex % 27) + 27) % 27
  const p = Math.min(Math.max(pada, 1), 4) - 1
  return PADA_SOUNDS[i]?.[p] ?? '—'
}

/** Rough Śaka / Vikrama years from civil date (Gregorian); regional lunar-year boundaries differ. */
export function approxIndianEras(isoDate: string): { shaka: number; vikram: number; note: string } {
  const d = new Date(`${isoDate}T12:00:00`)
  const y = d.getFullYear()
  const m = d.getMonth()
  const day = d.getDate()
  // Śaka generally aligned ~22 Mar; use as a simple split.
  const afterYearStart = m > 2 || (m === 2 && day >= 22)
  const shaka = (afterYearStart ? y - 78 : y - 79)
  const vikram = shaka + 135
  return {
    shaka,
    vikram,
    note: 'Approximate civil correlation; exact Hindu lunar year depends on region (Amānta/Pūrṇimānta).',
  }
}

export function formatSiderealLongitude(lon: number): { rashi: Rashi; degInSign: number } {
  const x = ((lon % 360) + 360) % 360
  const rashi = (Math.floor(x / 30) + 1) as Rashi
  const degInSign = x % 30
  return { rashi, degInSign }
}
