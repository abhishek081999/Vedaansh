// ─────────────────────────────────────────────────────────────
//  src/lib/engine/ashtakavargaKakshya.ts
//  Kakshya Ashtakavarga — degree-level transit timing (JHora order)
// ─────────────────────────────────────────────────────────────

import type { AshtakavargaResult, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { RASHI_SHORT } from '@/types/astrology'

/** Kakshya lords in order within each sign (Parasara / JHora). */
export const KAKSHYA_LORDS = ['Sa', 'Ju', 'Ma', 'Su', 'Ve', 'Me', 'Mo', 'As'] as const
export type KakshyaLord = (typeof KAKSHYA_LORDS)[number]

export const KAKSHYA_SPAN_DEG = 30 / 8 // 3°45'

const TRANSIT_PLANETS = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const

export interface KakshyaPosition {
  rashi: Rashi
  degreeInSign: number
  kakshyaIndex: number
  kakshyaLord: KakshyaLord
  /** Whether the kakshya lord contributed a bindu in this planet's BAV for the sign */
  hasBindu: boolean
  quality: 'favorable' | 'unfavorable'
}

export interface KakshyaTransitRow {
  planet: GrahaId
  date: string
  rashi: Rashi
  degreeInSign: number
  kakshyaLord: KakshyaLord
  hasBindu: boolean
  quality: 'favorable' | 'unfavorable'
  bavInSign: number
  savInSign: number
  score: number
}

function normDeg(d: number): number {
  return ((d % 360) + 360) % 360
}

function degreeInSignFromGraha(g: GrahaData): number {
  const total = g.totalDegree ?? g.lonSidereal ?? ((g.rashi - 1) * 30 + (g.degree ?? 0))
  return normDeg(total) % 30
}

/** Kakshya index 0–7 from degree within sign (0–30). */
export function kakshyaIndexFromDegree(degreeInSign: number): number {
  const d = Math.max(0, Math.min(29.9999, degreeInSign))
  return Math.min(7, Math.floor(d / KAKSHYA_SPAN_DEG))
}

export function kakshyaLordFromDegree(degreeInSign: number): KakshyaLord {
  return KAKSHYA_LORDS[kakshyaIndexFromDegree(degreeInSign)]
}

/** Resolve kakshya bindu for a planet transiting at a given sign + degree. */
export function resolveKakshyaPosition(
  ashtakavarga: AshtakavargaResult,
  planet: string,
  rashi: number,
  degreeInSign: number,
): KakshyaPosition {
  const kakshyaIndex = kakshyaIndexFromDegree(degreeInSign)
  const kakshyaLord = KAKSHYA_LORDS[kakshyaIndex]
  const prastara = ashtakavarga.prastara?.[planet]
  const hasBindu = prastara
    ? (prastara.byContributor[kakshyaLord]?.[rashi - 1] ?? 0) === 1
    : false

  return {
    rashi: rashi as Rashi,
    degreeInSign,
    kakshyaIndex,
    kakshyaLord,
    hasBindu,
    quality: hasBindu ? 'favorable' : 'unfavorable',
  }
}

export function resolveKakshyaFromGraha(
  ashtakavarga: AshtakavargaResult,
  graha: GrahaData,
): KakshyaPosition | null {
  if (!TRANSIT_PLANETS.includes(graha.id as (typeof TRANSIT_PLANETS)[number])) return null
  const rashi = graha.rashi
  if (!rashi || rashi < 1 || rashi > 12) return null
  return resolveKakshyaPosition(ashtakavarga, graha.id, rashi, degreeInSignFromGraha(graha))
}

function transitScore(bav: number, sav: number, hasBindu: boolean): number {
  const base = (bav / 8) * 45 + (sav / 40) * 35
  return Math.round(base + (hasBindu ? 20 : 0))
}

/** Build kakshya-aware transit rows from current transit grahas. */
export function buildKakshyaTransitWatch(
  ashtakavarga: AshtakavargaResult,
  transitGrahas: GrahaData[],
  dateLabel = 'now',
): KakshyaTransitRow[] {
  const rows: KakshyaTransitRow[] = []

  for (const planet of TRANSIT_PLANETS) {
    const tg = transitGrahas.find((g) => g.id === planet)
    if (!tg?.rashi) continue
    const deg = degreeInSignFromGraha(tg)
    const kak = resolveKakshyaPosition(ashtakavarga, planet, tg.rashi, deg)
    const bav = ashtakavarga.bav[planet]?.bindus[tg.rashi - 1] ?? 0
    const sav = ashtakavarga.sav[tg.rashi - 1] ?? 0
    rows.push({
      planet,
      date: dateLabel,
      rashi: tg.rashi as Rashi,
      degreeInSign: Math.round(deg * 100) / 100,
      kakshyaLord: kak.kakshyaLord,
      hasBindu: kak.hasBindu,
      quality: kak.quality,
      bavInSign: bav,
      savInSign: sav,
      score: transitScore(bav, sav, kak.hasBindu),
    })
  }

  return rows.sort((a, b) => b.score - a.score)
}

export interface KakshyaTimelinePoint {
  date: string
  score: number
  favorableCount: number
  unfavorableCount: number
  tag: 'best' | 'good' | 'caution'
}

/** Aggregate kakshya quality across sample dates (for timeline UI). */
export function aggregateKakshyaTimeline(
  samples: Array<{ date: string; grahas: GrahaData[] }>,
  ashtakavarga: AshtakavargaResult,
): KakshyaTimelinePoint[] {
  const points = samples.map(({ date, grahas }) => {
    const rows = buildKakshyaTransitWatch(ashtakavarga, grahas, date)
    const favorableCount = rows.filter((r) => r.hasBindu).length
    const unfavorableCount = rows.length - favorableCount
    const score = rows.length
      ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length)
      : 0
    return { date, score, favorableCount, unfavorableCount, tag: 'good' as const }
  })

  const ranked = [...points].sort((a, b) => b.score - a.score)
  const bestSet = new Set(ranked.slice(0, 2).map((x) => x.date))
  const lowSet = new Set(ranked.slice(-2).map((x) => x.date))

  return points.map((p) => ({
    ...p,
    tag: bestSet.has(p.date) ? 'best' : lowSet.has(p.date) ? 'caution' : 'good',
  }))
}

export function kakshyaNote(row: KakshyaTransitRow): string {
  const sign = RASHI_SHORT[row.rashi]
  const lord = row.kakshyaLord === 'As' ? 'Lagna' : row.kakshyaLord
  if (row.hasBindu) {
    return `${row.planet} at ${row.degreeInSign.toFixed(1)}° ${sign} — ${lord} kakshya active (bindu present). Favorable fine-timing window.`
  }
  return `${row.planet} at ${row.degreeInSign.toFixed(1)}° ${sign} — ${lord} kakshya without bindu. Exercise caution for ${row.planet} significations.`
}
