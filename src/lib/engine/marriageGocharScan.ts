// src/lib/engine/marriageGocharScan.ts
// Server-only Ju–Sa marriage transit window scanner (Swiss Ephemeris).
// Do not import this from client components — use /api/marriage/gochar-windows.

import type { Rashi } from '@/types/astrology'
import { SWISSEPH_IDS, dateToJD, getPlanetPosition, signOf } from '@/lib/engine/ephemeris'
import {
  classifyTransitMonth,
  mergeTransitMonths,
  type MarriageTransitKind,
} from '@/lib/engine/marriageGochar'

function houseOf(rashi: number, asc: number): number {
  return ((rashi - asc + 12) % 12) + 1
}

function utcNoon(y: number, m: number, d = 15): Date {
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
}

export function scanMarriageTransitWindows(
  asc: Rashi,
  opts: { now?: Date; years?: number } = {},
): { start: string; end: string; kind: MarriageTransitKind }[] {
  const now = opts.now ?? new Date()
  const years = opts.years ?? 8
  const months: { ym: string; kind: MarriageTransitKind }[] = []
  const startY = now.getUTCFullYear()
  const startM = now.getUTCMonth() + 1
  const total = Math.max(12, Math.floor(years * 12))
  for (let i = 0; i < total; i++) {
    const mIndex = startM - 1 + i
    const y = startY + Math.floor(mIndex / 12)
    const m = (mIndex % 12) + 1
    const jd = dateToJD(utcNoon(y, m))
    const ju = signOf(getPlanetPosition(jd, SWISSEPH_IDS.Ju, true).longitude)
    const sa = signOf(getPlanetPosition(jd, SWISSEPH_IDS.Sa, true).longitude)
    const kind = classifyTransitMonth(houseOf(ju, asc), houseOf(sa, asc))
    if (kind) months.push({ ym: `${y}-${String(m).padStart(2, '0')}`, kind })
  }
  return mergeTransitMonths(months)
}
