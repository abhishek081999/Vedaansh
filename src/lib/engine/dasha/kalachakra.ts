// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dasha/kalachakra.ts
//  Kalachakra Dasha — rashi periods from the Moon's nakshatra pada
//  Reference: BPHS ch. 46. Sign rows and paramayu follow the
//  Parashara/PVR tables (Savya I–II, Apasavya I–II).
//  Balance walks paramayu across the pada, which reproduces the
//  worked example: Krittika at 1s 4°50' leaves 3y 7m 24d of Capricorn.
// ─────────────────────────────────────────────────────────────

import type { DashaNode, Rashi } from '@/types/astrology'
import { NAKSHATRA_NAMES, RASHI_NAMES, RASHI_SHORT } from '@/types/astrology'

/** Aries → Pisces. Each pada row sums to its paramayu (100, 86, 85, or 83). */
const SIGN_YEARS = [7, 16, 9, 21, 5, 9, 16, 7, 10, 4, 4, 10] as const

/** 0-based sign indexes. Each group has one 9-sign row per pada. */
const ROWS: number[][][] = [
  // Savya I — Ashwini, Krittika, Punarvasu, Ashlesha, Hasta, Swati, Mula, Uttara Ashadha, Purva Bhadra
  [
    [0, 1, 2, 3, 4, 5, 6, 7, 8],
    [9, 10, 11, 7, 6, 5, 3, 4, 2],
    [1, 0, 11, 10, 9, 8, 0, 1, 2],
    [3, 4, 5, 6, 7, 8, 9, 10, 11],
  ],
  // Savya II — Bharani, Pushya, Chitra, Purva Ashadha, Uttara Bhadra, Revati
  [
    [7, 6, 5, 3, 4, 2, 1, 0, 11],
    [10, 9, 8, 0, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11, 7, 6, 5],
    [3, 4, 2, 1, 0, 11, 10, 9, 8],
  ],
  // Apasavya I — Rohini, Magha, Vishakha, Shravana
  [
    [8, 9, 10, 11, 0, 1, 2, 4, 3],
    [5, 6, 7, 11, 10, 9, 8, 7, 6],
    [5, 4, 3, 2, 1, 0, 8, 9, 10],
    [11, 0, 1, 2, 4, 3, 5, 6, 7],
  ],
  // Apasavya II — Mrigashira, Ardra, Purva Phalguni, Uttara Phalguni, Anuradha, Jyeshtha, Dhanishtha, Shatabhisha
  [
    [11, 10, 9, 8, 7, 6, 5, 4, 3],
    [2, 1, 0, 8, 9, 10, 11, 0, 1],
    [2, 4, 3, 5, 6, 7, 11, 10, 9],
    [8, 7, 6, 5, 4, 3, 2, 1, 0],
  ],
]

const PARAMAYU: number[][] = [
  [100, 85, 83, 86],
  [100, 85, 83, 86],
  [86, 83, 85, 100],
  [86, 83, 85, 100],
]

/** Nakshatra index 0–26 → chakra group 0–3. */
const NAK_GROUP: number[] = [
  0, 1, 0, 2, 3, 3, 0, 1, 0, 2, 3, 3, 0, 1, 0, 2, 3, 3, 0, 1, 0, 2, 3, 3, 0, 1, 1,
]

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000
const NAK_SPAN = 360 / 27
const PADA_SPAN = 360 / 108

export interface KalachakraSeed {
  nakshatraIndex: number
  nakshatraName: string
  /** 1–4 */
  pada: number
  gati: 'Savya' | 'Apasavya'
  paramayu: number
  deha: Rashi
  jeeva: Rashi
  dehaName: string
  jeevaName: string
}

interface Cycle {
  kc: number
  pa: number
  signs: Rashi[]
  years: number[]
  paramayu: number
}

function normLon(lon: number): number {
  const x = lon % 360
  return x < 0 ? x + 360 : x
}

function cycle(kc: number, pa: number): Cycle {
  const signs = ROWS[kc][pa].map((s) => (s + 1) as Rashi)
  return {
    kc,
    pa,
    signs,
    years: signs.map((s) => SIGN_YEARS[s - 1]),
    paramayu: PARAMAYU[kc][pa],
  }
}

/** After pada 4, Savya I swaps with Savya II and Apasavya I with Apasavya II. */
function nextPada(kc: number, pa: number): { kc: number; pa: number } {
  if (pa < 3) return { kc, pa: pa + 1 }
  return { kc: [1, 0, 3, 2][kc], pa: 0 }
}

function rotateFrom(signs: Rashi[], start: Rashi): Rashi[] {
  const i = signs.indexOf(start)
  if (i <= 0) return signs
  return signs.slice(i).concat(signs.slice(0, i))
}

/** 360-day year (12 × 30) so a fractional year reads as the classical y-m-d. */
export function formatKalachakraSpan(years: number): string {
  if (!Number.isFinite(years) || years <= 0) return '0d'
  let days = Math.round(years * 360)
  const y = Math.floor(days / 360)
  days -= y * 360
  const m = Math.floor(days / 30)
  days -= m * 30
  const parts: string[] = []
  if (y) parts.push(`${y}y`)
  if (m) parts.push(`${m}m`)
  if (days || parts.length === 0) parts.push(`${days}d`)
  return parts.join(' ')
}

function snapYears(years: number): number {
  const rounded = Math.round(years)
  return Math.abs(years - rounded) < 1e-6 ? rounded : years
}

function moonPada(lon: number): { nak: number; pa: number; frac: number } {
  const nak = Math.min(26, Math.floor(lon / NAK_SPAN))
  const into = lon - nak * NAK_SPAN
  const pa = Math.min(3, Math.floor(into / PADA_SPAN))
  const frac = Math.min(1, Math.max(0, (into - pa * PADA_SPAN) / PADA_SPAN))
  return { nak, pa, frac }
}

interface BirthPlacement {
  physicalKc: number
  physicalPa: number
  kc: number
  pa: number
  idx: number
  remainingYears: number
  row: Cycle
}

/**
 * Walk `frac × paramayu` through the pada row. When paramayu exceeds the
 * row's sign-years, the surplus continues in the next pada.
 */
function placeMoon(lon: number): BirthPlacement {
  const { nak, pa, frac } = moonPada(lon)
  let kc = NAK_GROUP[nak]
  let cursorPa = pa
  const physicalKc = kc
  const physicalPa = pa
  let row = cycle(kc, cursorPa)
  let walked = frac * row.paramayu

  for (let guard = 0; guard < 8 && walked >= sum(row.years) - 1e-9; guard++) {
    walked -= sum(row.years)
    const next = nextPada(kc, cursorPa)
    kc = next.kc
    cursorPa = next.pa
    row = cycle(kc, cursorPa)
  }

  let acc = 0
  let idx = row.years.length - 1
  let remaining = row.years[idx]
  for (let i = 0; i < row.years.length; i++) {
    acc += row.years[i]
    if (acc > walked) {
      idx = i
      remaining = acc - walked
      break
    }
  }

  return {
    physicalKc,
    physicalPa,
    kc,
    pa: cursorPa,
    idx,
    remainingYears: snapYears(Math.max(remaining, 0)),
    row,
  }
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

export function describeKalachakra(moonLonSidereal: number): KalachakraSeed {
  const lon = normLon(moonLonSidereal)
  const { nak, pa } = moonPada(lon)
  const kc = NAK_GROUP[nak]
  const row = cycle(kc, pa)
  const deha = row.signs[0]
  const jeeva = row.signs[row.signs.length - 1]
  return {
    nakshatraIndex: nak,
    nakshatraName: NAKSHATRA_NAMES[nak] ?? 'Nakshatra',
    pada: pa + 1,
    gati: kc < 2 ? 'Savya' : 'Apasavya',
    paramayu: row.paramayu,
    deha,
    jeeva,
    dehaName: RASHI_NAMES[deha],
    jeevaName: RASHI_NAMES[jeeva],
  }
}

export function kalachakraCaption(moonLonSidereal: number): string {
  const seed = describeKalachakra(moonLonSidereal)
  return `${seed.nakshatraName} pada ${seed.pada} · ${seed.gati} · paramayu ${seed.paramayu}y · Deha ${seed.dehaName} · Jeeva ${seed.jeevaName}`
}

interface MahaSlot {
  sign: Rashi
  years: number
  kc: number
  pa: number
}

function mahadashas(lon: number): MahaSlot[] {
  const birth = placeMoon(lon)
  const next = nextPada(birth.kc, birth.pa)
  const nextRow = cycle(next.kc, next.pa)
  const head = birth.row.signs.slice(birth.idx)
  const tail = nextRow.signs.slice(0, birth.idx)
  const slots: MahaSlot[] = []

  head.forEach((sign, i) => {
    const sourceIndex = birth.idx + i
    slots.push({
      sign,
      years: i === 0 ? birth.remainingYears : birth.row.years[sourceIndex],
      kc: birth.kc,
      pa: birth.pa,
    })
  })
  tail.forEach((sign, i) => {
    slots.push({
      sign,
      years: nextRow.years[i],
      kc: next.kc,
      pa: next.pa,
    })
  })
  return slots
}

function buildChildren(
  parentSign: Rashi,
  parentStartMs: number,
  parentYears: number,
  kc: number,
  pa: number,
  level: number,
  maxDepth: number,
  now: number,
): DashaNode[] {
  const row = cycle(kc, pa)
  const signs = rotateFrom(row.signs, parentSign)
  const weights = signs.map((sign) => SIGN_YEARS[sign - 1])
  const total = sum(weights) || 1
  const nodes: DashaNode[] = []
  let cursor = parentStartMs

  for (let i = 0; i < signs.length; i++) {
    const years = snapYears(parentYears * (weights[i] / total))
    const durationMs = years * YEAR_MS
    const start = new Date(cursor)
    const end = new Date(cursor + durationMs)
    const sign = signs[i]
    nodes.push({
      lord: RASHI_SHORT[sign],
      label: `${RASHI_NAMES[sign]} (${formatKalachakraSpan(years)})`,
      start,
      end,
      durationMs,
      level,
      isCurrent: now >= start.getTime() && now < end.getTime(),
      children: level < maxDepth
        ? buildChildren(sign, cursor, years, kc, pa, level + 1, maxDepth, now)
        : [],
    })
    cursor += durationMs
  }
  return nodes
}

/**
 * Kalachakra mahadasha → antardasha → pratyantar.
 * Nine signs from the birth pada, continued into the next pada so the
 * sequence stays nine signs. Sub-periods are the same row, rotated to
 * the parent sign, scaled so they sum to the parent.
 */
export function calcKalachakra(
  moonLonSidereal: number,
  birthDate: Date,
  depth: number = 3,
): DashaNode[] {
  const lon = normLon(moonLonSidereal)
  const now = Date.now()
  const slots = mahadashas(lon)
  const nodes: DashaNode[] = []
  let cursor = birthDate.getTime()
  const maxDepth = Math.max(1, Math.min(3, depth))

  for (const slot of slots) {
    const years = snapYears(slot.years)
    const durationMs = years * YEAR_MS
    const start = new Date(cursor)
    const end = new Date(cursor + durationMs)
    nodes.push({
      lord: RASHI_SHORT[slot.sign],
      label: `${RASHI_NAMES[slot.sign]} (${formatKalachakraSpan(years)})`,
      start,
      end,
      durationMs,
      level: 1,
      isCurrent: now >= start.getTime() && now < end.getTime(),
      children: maxDepth > 1
        ? buildChildren(slot.sign, cursor, years, slot.kc, slot.pa, 2, maxDepth, now)
        : [],
    })
    cursor += durationMs
  }

  return nodes
}
