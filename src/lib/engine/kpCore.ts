/**
 * src/lib/engine/kpCore.ts
 *
 * Pure Krishnamurti Paddhati (KP) primitives — no ephemeris, safe in the browser.
 *  - 4-level stellar lords (sign / star / sub / sub-sub) for any sidereal longitude
 *  - The classical 249-sub table (243 Vimshottari subs, split where a sub crosses a sign)
 *  - Placidus bhava lookup and cusp ownership
 */

import { NAKSHATRA_LORDS, type GrahaId, type Rashi } from '@/types/astrology'

export const KP_SEQUENCE: readonly GrahaId[] = ['Ke', 'Ve', 'Su', 'Mo', 'Ma', 'Ra', 'Ju', 'Sa', 'Me']

export const KP_DASHA_YEARS: Readonly<Record<string, number>> = {
  Ke: 7, Ve: 20, Su: 6, Mo: 10, Ma: 7, Ra: 18, Ju: 16, Sa: 19, Me: 17,
}

export const KP_SIGN_LORDS: Readonly<Record<number, GrahaId>> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const NAK_SPAN = 360 / 27
/** Guards float noise at exact boundaries (≈ 0.0036″). */
const EPS = 1e-9

export const norm360 = (lon: number): number => ((lon % 360) + 360) % 360

export const rashiOf = (lon: number): Rashi => (Math.floor(norm360(lon) / 30) + 1) as Rashi

export interface StellarPosition {
  signLord: GrahaId
  starLord: GrahaId
  subLord: GrahaId
  subSubLord: GrahaId
}

export interface StellarDetail extends StellarPosition {
  rashi: Rashi
  degInSign: number
  nakshatraIndex: number
  /** 1–4 */
  pada: number
  degInNakshatra: number
  /** Absolute sidereal start / end of the sub that holds this longitude. */
  subStart: number
  subEnd: number
}

/** Divide `span` among the 9 lords in Vimshottari proportion, starting from `firstLord`. */
function walk(firstLord: GrahaId, offset: number, span: number): { lord: GrahaId; start: number; size: number } {
  const startIdx = KP_SEQUENCE.indexOf(firstLord)
  let cursor = 0
  for (let i = 0; i < 9; i++) {
    const lord = KP_SEQUENCE[(startIdx + i) % 9]
    const size = (KP_DASHA_YEARS[lord] / 120) * span
    if (offset < cursor + size - EPS || i === 8) return { lord, start: cursor, size }
    cursor += size
  }
  /* istanbul ignore next */
  return { lord: firstLord, start: 0, size: span }
}

export function kpStellarDetail(longitude: number): StellarDetail {
  const lon = norm360(longitude)
  const rashi = rashiOf(lon)
  const nakshatraIndex = Math.min(26, Math.floor((lon + EPS) / NAK_SPAN))
  const nakStart = nakshatraIndex * NAK_SPAN
  const degInNakshatra = Math.max(0, lon - nakStart)
  const starLord = NAKSHATRA_LORDS[nakshatraIndex]
  const sub = walk(starLord, degInNakshatra, NAK_SPAN)
  const subSub = walk(sub.lord, degInNakshatra - sub.start, sub.size)
  return {
    signLord: KP_SIGN_LORDS[rashi],
    starLord,
    subLord: sub.lord,
    subSubLord: subSub.lord,
    rashi,
    degInSign: lon - (rashi - 1) * 30,
    nakshatraIndex,
    pada: Math.min(4, Math.floor(degInNakshatra / (NAK_SPAN / 4)) + 1),
    degInNakshatra,
    subStart: nakStart + sub.start,
    subEnd: nakStart + sub.start + sub.size,
  }
}

export function kpStellar(longitude: number): StellarPosition {
  const d = kpStellarDetail(longitude)
  return { signLord: d.signLord, starLord: d.starLord, subLord: d.subLord, subSubLord: d.subSubLord }
}

// ── 249 sub table ──────────────────────────────────────────────

export interface KPSubRow {
  /** Horary number 1–249 */
  num: number
  start: number
  end: number
  rashi: Rashi
  nakshatraIndex: number
  signLord: GrahaId
  starLord: GrahaId
  subLord: GrahaId
}

let SUB_TABLE: KPSubRow[] | null = null

/** The 249 KP subs from 0° Aries. Subs that straddle a sign boundary are split in two. */
export function kpSubTable(): readonly KPSubRow[] {
  if (SUB_TABLE) return SUB_TABLE
  const rows: KPSubRow[] = []
  for (let nak = 0; nak < 27; nak++) {
    const starLord = NAKSHATRA_LORDS[nak]
    const startIdx = KP_SEQUENCE.indexOf(starLord)
    let cursor = nak * NAK_SPAN
    for (let i = 0; i < 9; i++) {
      const subLord = KP_SEQUENCE[(startIdx + i) % 9]
      const end = cursor + (KP_DASHA_YEARS[subLord] / 120) * NAK_SPAN
      const boundary = Math.ceil(cursor / 30 - EPS) * 30
      const pieces: [number, number][] =
        boundary > cursor + EPS && boundary < end - EPS ? [[cursor, boundary], [boundary, end]] : [[cursor, end]]
      for (const [s, e] of pieces) {
        const rashi = rashiOf(s + EPS)
        rows.push({
          num: rows.length + 1, start: s, end: e, rashi, nakshatraIndex: nak,
          signLord: KP_SIGN_LORDS[rashi], starLord, subLord,
        })
      }
      cursor = end
    }
  }
  SUB_TABLE = rows
  return rows
}

/** Starting sidereal longitude of KP horary number 1–249 (0 when out of range). */
export function kpHoraryNumberDegree(num: number): number {
  if (!Number.isInteger(num) || num < 1 || num > 249) return 0
  return kpSubTable()[num - 1].start
}

/** Horary number (1–249) whose sub holds this longitude. */
export function kpHoraryNumberOf(longitude: number): number {
  const lon = norm360(longitude)
  const table = kpSubTable()
  for (const r of table) if (lon >= r.start - EPS && lon < r.end - EPS) return r.num
  return 249
}

// ── Placidus bhava helpers ────────────────────────────────────

/** House 1–12 for a longitude given 12 sidereal cusps (cusp-to-cusp, KP style). */
export function bhavaOf(longitude: number, cusps: readonly number[]): number {
  const lon = norm360(longitude)
  for (let i = 0; i < 12; i++) {
    const c1 = norm360(cusps[i])
    const c2 = norm360(cusps[(i + 1) % 12])
    if (c2 > c1 ? lon >= c1 && lon < c2 : lon >= c1 || lon < c2) return i + 1
  }
  return 1
}

/** Houses owned by each planet: a planet owns house h when it rules the sign on cusp h. */
export function cuspOwnership(cusps: readonly number[]): Record<string, number[]> {
  const out: Record<string, number[]> = {}
  cusps.forEach((c, i) => {
    const lord = KP_SIGN_LORDS[rashiOf(c)]
    ;(out[lord] ??= []).push(i + 1)
  })
  return out
}
