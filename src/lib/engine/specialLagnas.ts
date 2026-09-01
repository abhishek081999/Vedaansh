// ─────────────────────────────────────────────────────────────────────────────
//  Special Lagnas (BPHS Ch.5, Ch.3 Pranapada, PVR Shri Lagna, Indu / Dhana Lagna)
//  Sun longitude is always at the applicable local sunrise (not birth-time Sun).
// ─────────────────────────────────────────────────────────────────────────────

import { getPlanetPosition, getAyanamsha, toSidereal, dateToJD, SWISSEPH_IDS } from '@/lib/engine/ephemeris'
import type { AyanamshaMode } from '@/types/astrology'
import { calcBhriguBinduLon, calcInduLagna } from '@/lib/engine/astroDetailsDerived'
import { fromZonedTime } from 'date-fns-tz'
import { getSunrise } from '@/lib/engine/sunrise'
import { getNakshatra } from '@/lib/engine/nakshatra'
import type { Rashi } from '@/types/astrology'

export { calcBhriguBinduLon, calcInduLagna } from '@/lib/engine/astroDetailsDerived'

const MS_PER_VIGHATIKA = 24_000   // 24 seconds
const MS_PER_GHATI     = 1_440_000 // 24 minutes (60 vighatikas)

export interface IshtaKala {
  /** Milliseconds from applicable sunrise to birth. */
  ms: number
  ghatis: number
  vighatikas: number
}

export interface SpecialLagnaResult {
  horaLagna: number
  ghatiLagna: number
  bhavaLagna: number
  vighatiLagna: number
  pranapada: number
  sriLagna: number
  varnadaLagna: number
  induLagna: number
  bhriguBindu: number
}

function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360
}

function signModality(sign: number): 'movable' | 'fixed' | 'dual' {
  if ([1, 4, 7, 10].includes(sign)) return 'movable'
  if ([2, 5, 8, 11].includes(sign)) return 'fixed'
  return 'dual'
}

function modalityOffset(sign: number): number {
  const m = signModality(sign)
  if (m === 'fixed') return 240
  if (m === 'dual') return 120
  return 0
}

/** Previous calendar day YYYY-MM-DD in local tz (for pre-sunrise births). */
function previousDateStr(dateStr: string, tz: string): string {
  const localMidnight = fromZonedTime(`${dateStr}T00:00:00`, tz)
  const prev = new Date(localMidnight.getTime() - 86_400_000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(prev)
}

/** Sunrise used for special lagnas + sidereal Sun at that instant. */
export function getSunriseContext(
  birthUtc: Date,
  birthDateStr: string,
  lat: number,
  lng: number,
  tz: string,
  ayanamshaMode: AyanamshaMode = 'lahiri',
): { sunrise: Date; sunLonAtSunrise: number } {
  let sunriseDateStr = birthDateStr
  let sunrise = getSunrise(birthDateStr, lat, lng, tz)

  if (birthUtc.getTime() < sunrise.getTime()) {
    sunriseDateStr = previousDateStr(birthDateStr, tz)
    sunrise = getSunrise(sunriseDateStr, lat, lng, tz)
  }

  const jd = dateToJD(sunrise)
  const ayan = getAyanamsha(jd, ayanamshaMode)
  const sunLon = toSidereal(getPlanetPosition(jd, SWISSEPH_IDS.Su, false).longitude, ayan)
  return { sunrise, sunLonAtSunrise: norm360(sunLon) }
}

export function getIshtaKala(birthUtc: Date, sunrise: Date): IshtaKala {
  const ms = Math.max(0, birthUtc.getTime() - sunrise.getTime())
  const vighatikas = ms / MS_PER_VIGHATIKA
  const ghatis = ms / MS_PER_GHATI
  return { ms, ghatis, vighatikas }
}

/** BPHS Ch.5 — Bhava Lagna: (ishta ghatis ÷ 5) × 30° + Sun at sunrise. */
export function calcBhavaLagna(sunLonAtSunrise: number, ghatis: number): number {
  return norm360(sunLonAtSunrise + (ghatis / 5) * 30)
}

/** BPHS Ch.5 — Hora Lagna: (ishta ghatis ÷ 2.5) × 30° + Sun at sunrise. */
export function calcHoraLagna(sunLonAtSunrise: number, ghatis: number): number {
  return norm360(sunLonAtSunrise + (ghatis / 2.5) * 30)
}

/** BPHS Ch.5 — Ghati Lagna: whole ghatis as signs + vighatis÷2 as degrees. */
export function calcGhatiLagna(sunLonAtSunrise: number, ghatis: number, vighatikas: number): number {
  const wholeGhatis = Math.floor(ghatis)
  const vighatisInGhati = vighatikas - wholeGhatis * 60
  const offset = wholeGhatis * 30 + vighatisInGhati / 2
  return norm360(sunLonAtSunrise + offset)
}

/** Vighati Lagna (JHora / Surya-siddhanta rate): Sun + (vighatikas ÷ 5) in degrees. */
export function calcVighatiLagna(sunLonAtSunrise: number, vighatikas: number): number {
  return norm360(sunLonAtSunrise + vighatikas / 5)
}

/** BPHS Ch.3 — Pranapada: (vighatikas ÷ 15) mod 12 signs + modality add to sunrise Sun. */
export function calcPranapada(sunLonAtSunrise: number, vighatikas: number): number {
  const signSpan = ((vighatikas / 15) % 12) * 30
  const sunSign = Math.floor(sunLonAtSunrise / 30) + 1
  return norm360(sunLonAtSunrise + signSpan + modalityOffset(sunSign))
}

/** PVR / BPHS Shri Lagna: Lagna + (Moon's nakshatra fraction × 360°). */
export function calcSriLagna(ascLon: number, moonLon: number): number {
  const nak = getNakshatra(moonLon)
  const span = 360 / 27
  const fraction = nak.degreeInNak / span
  return norm360(ascLon + fraction * 360)
}

/** BPHS Ch.5 Varnada sign; longitude keeps natal Lagna's degree in the resultant sign. */
export function calcVarnadaLagna(
  ascRashi: Rashi,
  ascDegreeInRashi: number,
  horaLagnaLon: number,
): number {
  const l1 = ascRashi
  const h1 = (Math.floor(horaLagnaLon / 30) + 1) as Rashi

  const c1 = l1 % 2 !== 0 ? l1 : 13 - l1
  const c2 = h1 % 2 !== 0 ? h1 : 13 - h1

  let v = l1 % 2 === h1 % 2 ? c1 + c2 : c1 - c2
  v = ((v - 1) % 12 + 12) % 12 + 1

  const varnadaSign = l1 % 2 !== 0 ? v : ((12 + v - 2) % 12) + 1
  return norm360((varnadaSign - 1) * 30 + ascDegreeInRashi)
}

export function calculateSpecialLagnas(params: {
  birthUtc: Date
  birthDateStr: string
  lat: number
  lng: number
  tz: string
  ayanamshaMode?: AyanamshaMode
  ascLon: number
  ascRashi: Rashi
  ascDegreeInRashi: number
  moonLon: number
  moonRashi: Rashi
  rahuLon: number
}): SpecialLagnaResult {
  const { sunrise, sunLonAtSunrise } = getSunriseContext(
    params.birthUtc,
    params.birthDateStr,
    params.lat,
    params.lng,
    params.tz,
    params.ayanamshaMode ?? 'lahiri',
  )
  const { ghatis, vighatikas } = getIshtaKala(params.birthUtc, sunrise)

  const horaLagna = calcHoraLagna(sunLonAtSunrise, ghatis)
  const ghatiLagna = calcGhatiLagna(sunLonAtSunrise, ghatis, vighatikas)
  const bhavaLagna = calcBhavaLagna(sunLonAtSunrise, ghatis)
  const vighatiLagna = calcVighatiLagna(sunLonAtSunrise, vighatikas)
  const pranapada = calcPranapada(sunLonAtSunrise, vighatikas)
  const sriLagna = calcSriLagna(params.ascLon, params.moonLon)
  const varnadaLagna = calcVarnadaLagna(params.ascRashi, params.ascDegreeInRashi, horaLagna)
  const induLagna = calcInduLagna(params.moonLon, params.moonRashi, params.ascRashi)
  const bhriguBindu = calcBhriguBinduLon(params.moonLon, params.rahuLon)

  return {
    horaLagna,
    ghatiLagna,
    bhavaLagna,
    vighatiLagna,
    pranapada,
    sriLagna,
    varnadaLagna,
    induLagna,
    bhriguBindu,
  }
}
