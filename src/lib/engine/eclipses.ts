// ─────────────────────────────────────────────────────────────
//  src/lib/engine/eclipses.ts   (server-only: sweph)
//  Solar & lunar eclipses (Surya / Chandra Grahan) with local
//  visibility, contact times and sutak for a location.
//
//  Sutak (traditional): solar — 4 prahar (12 h) before the eclipse
//  begins locally; lunar — 3 prahar (9 h) before. Only when the
//  eclipse is visible at the place; none for penumbral lunar eclipses.
// ─────────────────────────────────────────────────────────────

import sweph from 'sweph'
import type { Rashi } from '@/types/astrology'
import { SWISSEPH_IDS, dateToJD, getAyanamsha, getPlanetPosition, jdToDate, signOf, toSidereal } from '@/lib/engine/ephemeris'
import { getNakshatra } from '@/lib/engine/nakshatra'

const C = sweph.constants

export type EclipseKind = 'solar' | 'lunar'
export type EclipseType = 'total' | 'annular' | 'hybrid' | 'partial' | 'penumbral'

export interface EclipseLocal {
  visible: boolean
  /** Local first contact / maximum / last contact (ISO). Undefined when not visible. */
  start?: string
  max?: string
  end?: string
  /** Sutak start (ISO), when it applies. */
  sutakStart?: string
  /** Already in progress when the Sun / Moon rises at the place. */
  inProgressAtRise?: boolean
  /** Still in progress when the Sun / Moon sets at the place. */
  inProgressAtSet?: boolean
}

export interface EclipseInfo {
  kind: EclipseKind
  type: EclipseType
  /** Global greatest eclipse (ISO). */
  max: string
  /** Global start / end of the eclipse (ISO). */
  start: string
  end: string
  /** Sidereal sign and nakshatra of the Moon at maximum. */
  sign: Rashi
  nakshatra: string
  local: EclipseLocal
}

function typeOf(kind: EclipseKind, flag: number): EclipseType {
  if (kind === 'lunar') {
    if (flag & C.SE_ECL_TOTAL) return 'total'
    if (flag & C.SE_ECL_PARTIAL) return 'partial'
    return 'penumbral'
  }
  if (flag & C.SE_ECL_ANNULAR_TOTAL) return 'hybrid'
  if (flag & C.SE_ECL_TOTAL) return 'total'
  if (flag & C.SE_ECL_ANNULAR) return 'annular'
  return 'partial'
}

const iso = (jd: number | undefined) => (jd && jd > 0 ? jdToDate(jd).toISOString() : undefined)

function moonAt(jd: number): { sign: Rashi; nakshatra: string } {
  const ayan = getAyanamsha(jd, 'lahiri')
  const lon = toSidereal(getPlanetPosition(jd, SWISSEPH_IDS.Mo).longitude, ayan)
  return { sign: signOf(lon) as Rashi, nakshatra: getNakshatra(lon).name }
}

function solarAt(jdStart: number, loc: { lat: number; lng: number }): EclipseInfo | null {
  // sweph's typings say number, but the native binding requires a boolean for `backwards`.
  const g = sweph.sol_eclipse_when_glob(jdStart, C.SEFLG_SWIEPH, 0, false as unknown as number)
  if (g.flag <= 0) return null
  const [max, , begin, end] = g.data
  const kind: EclipseKind = 'solar'
  const local: EclipseLocal = { visible: false }
  const l = sweph.sol_eclipse_when_loc(max - 1, C.SEFLG_SWIEPH, [loc.lng, loc.lat, 0], false)
  if (l.flag > 0 && Math.abs(l.data[0] - max) < 0.6 && l.flag & C.SE_ECL_VISIBLE) {
    const first = l.data[1] > 0 ? l.data[1] : begin
    const last = l.data[4] > 0 ? l.data[4] : end
    local.visible = true
    local.start = iso(first)
    local.max = iso(l.data[0])
    local.end = iso(last)
    local.inProgressAtRise = !(l.data[1] > 0)
    local.inProgressAtSet = !(l.data[4] > 0)
    local.sutakStart = iso(first - 0.5)
  }
  return { kind, type: typeOf(kind, g.flag), max: iso(max)!, start: iso(begin)!, end: iso(end)!, ...moonAt(max), local }
}

function lunarAt(jdStart: number, loc: { lat: number; lng: number }): EclipseInfo | null {
  const g = sweph.lun_eclipse_when(jdStart, C.SEFLG_SWIEPH, 0, false)
  if (g.flag <= 0) return null
  const d = g.data
  const max = d[0]
  const kind: EclipseKind = 'lunar'
  const type = typeOf(kind, g.flag)
  const start = type === 'penumbral' ? d[6] : d[2]
  const end = type === 'penumbral' ? d[7] : d[3]
  const local: EclipseLocal = { visible: false }
  const l = sweph.lun_eclipse_when_loc(max - 1, C.SEFLG_SWIEPH, [loc.lng, loc.lat, 0], false)
  if (l.flag > 0 && Math.abs(l.data[0] - max) < 0.6 && l.flag & C.SE_ECL_VISIBLE) {
    // Contacts: partial phase for umbral eclipses, penumbral otherwise.
    const rawFirst = type === 'penumbral' ? l.data[6] : l.data[2]
    const rawLast = type === 'penumbral' ? l.data[7] : l.data[3]
    const first = rawFirst > 0 ? rawFirst : start
    const last = rawLast > 0 ? rawLast : end
    local.visible = true
    local.start = iso(first)
    local.max = iso(l.data[0])
    local.end = iso(last)
    local.inProgressAtRise = !(rawFirst > 0)
    local.inProgressAtSet = !(rawLast > 0)
    if (type !== 'penumbral') local.sutakStart = iso(first - 0.375)
  }
  return { kind, type, max: iso(max)!, start: iso(start)!, end: iso(end)!, ...moonAt(max), local }
}

/** Every solar and lunar eclipse whose maximum falls in [from, to], sorted by time. */
export function findEclipses(from: Date, to: Date, loc: { lat: number; lng: number }): EclipseInfo[] {
  const out: EclipseInfo[] = []
  const endJd = dateToJD(to)
  for (const finder of [solarAt, lunarAt]) {
    let jd = dateToJD(from)
    for (let i = 0; i < 40; i += 1) {
      const e = finder(jd, loc)
      if (!e) break
      const maxJd = dateToJD(new Date(e.max))
      if (maxJd > endJd) break
      out.push(e)
      jd = maxJd + 10
    }
  }
  return out.sort((a, b) => a.max.localeCompare(b.max))
}

/** The next `n` eclipses after `from`. */
export function nextEclipses(from: Date, n: number, loc: { lat: number; lng: number }): EclipseInfo[] {
  const to = new Date(from.getTime() + 400 * 86_400_000)
  return findEclipses(from, to, loc).slice(0, n)
}
