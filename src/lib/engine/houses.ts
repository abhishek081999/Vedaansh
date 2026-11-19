// ─────────────────────────────────────────────────────────────
//  src/lib/engine/houses.ts
//  Ascendant + house cusp calculations
//  Supports: Whole Sign, Placidus, Equal, Bhava Chalita (Sripati)
// ─────────────────────────────────────────────────────────────

import sweph from 'sweph'
import { getAyanamsha, toSidereal, signOf, degreeInSign } from '@/lib/engine/ephemeris'
import type { AyanamshaMode, GrahaId, HouseSystem, Rashi } from '@/types/astrology'

// ── KP horary: house frame for a chosen ascendant ────────────

const angDiff = (a: number, b: number) => ((a - b + 540) % 360) - 180

/**
 * Houses for the ARMC at which the tropical ascendant equals `targetAsc`
 * (KP horary numbers fix cusp 1 and rotate the other cusps with it).
 */
function housesForAscendant(jd: number, lat: number, code: string, targetAsc: number): unknown {
  const nut = sweph.calc_ut(jd, sweph.constants.SE_ECL_NUT, 0) as any
  const eps: number = nut?.data?.[0] ?? 23.4367
  const ascAt = (armc: number): number => {
    const h = sweph.houses_armc(((armc % 360) + 360) % 360, lat, eps, code) as any
    return h.data?.points?.[0] ?? h.data?.houses?.[0] ?? 0
  }
  // The ascendant rises monotonically with ARMC: scan, then bisect the crossing.
  let lo = 0
  let prev = angDiff(ascAt(0), targetAsc)
  for (let a = 2; a <= 360; a += 2) {
    const cur = angDiff(ascAt(a), targetAsc)
    if (prev <= 0 && cur >= 0 && cur - prev < 180) { lo = a - 2; break }
    prev = cur
  }
  let hi = lo + 2
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (angDiff(ascAt(mid), targetAsc) < 0) lo = mid
    else hi = mid
  }
  return sweph.houses_armc(((hi % 360) + 360) % 360, lat, eps, code)
}

// ── House system codes for sweph ─────────────────────────────
const HOUSE_SYSTEM_CODES: Record<HouseSystem, string> = {
  whole_sign:    'W',  // Whole Sign
  placidus:      'P',  // Placidus
  equal:         'A',  // Equal (from Ascendant)
  bhava_chalita: 'S',  // Sripati (used for Bhava Chalita midpoint system)
}

// ── Types ─────────────────────────────────────────────────────

export interface HouseData {
  ascendant:        number    // Tropical ascendant degree 0–360
  ascendantSidereal:number    // Sidereal ascendant
  ascRashi:         Rashi     // Ascendant sign 1–12
  ascDegreeInRashi: number    // 0–30 within sign
  mc:               number    // Midheaven (tropical)
  mcSidereal:       number    // Midheaven (sidereal)

  // House cusps (12 values, index 0 = cusp of house 1)
  cusps:         number[]    // Tropical cusps
  cuspsSidereal: number[]    // Sidereal cusps

  // For Bhava Chalita: midpoint (mid-bhava) of each house
  bhavas:        number[]    // Tropical bhava midpoints (Sripati)
  bhavasidereal: number[]    // Sidereal bhava midpoints
}

// ── Main house calculator ─────────────────────────────────────

/**
 * Calculate house cusps and ascendant for a given moment and location
 *
 * @param jd        Julian Day (UT)
 * @param lat       Geographic latitude (degrees N positive)
 * @param lng       Geographic longitude (degrees E positive)
 * @param mode      Ayanamsha mode for sidereal conversion
 * @param system    House system
 */
export function calcHouses(
  jd:   number,
  lat:  number,
  lng:  number,
  mode: AyanamshaMode,
  system: HouseSystem = 'whole_sign',
  fixedSiderealAsc?: number,
): HouseData {
  const ayanamsha = getAyanamsha(jd, mode)
  const code = HOUSE_SYSTEM_CODES[system]

  // sweph.houses returns { data: { houses: [h1..h12], points: [asc, mc, ...] } }.
  // KP horary (fixedSiderealAsc): rotate the whole house frame so cusp 1 sits on
  // the chosen degree — search the ARMC whose ascendant equals it.
  const r = (fixedSiderealAsc !== undefined
    ? housesForAscendant(jd, lat, code, ((fixedSiderealAsc + ayanamsha) % 360 + 360) % 360)
    : sweph.houses(jd, lat, lng, code)) as any
  if (r.error) throw new Error(`houses error: ${r.error}`)

  // Newer sweph: data.houses is 0-indexed [h1..h12]; older builds: cusps[1..12].
  const cuspsTropical: number[] = Array.isArray(r.data?.houses)
    ? r.data.houses.slice(0, 12)
    : (r.data?.cusps ?? r.cusps ?? []).slice(1, 13)
  if (cuspsTropical.length !== 12 || cuspsTropical.some((c: number) => !Number.isFinite(c))) {
    throw new Error(`houses error: no cusps for system ${system}`)
  }

  const ascTropical = r.data?.points?.[0] ?? r.ascendant ?? cuspsTropical[0]
  const mcTropical  = r.data?.points?.[1] ?? r.mc ?? 0

  const ascSidereal = fixedSiderealAsc !== undefined ? fixedSiderealAsc : toSidereal(ascTropical, ayanamsha)
  const mcSidereal  = toSidereal(mcTropical,  ayanamsha)

  // Sidereal cusps
  const cuspsSidereal = cuspsTropical.map((c: number) => toSidereal(c, ayanamsha))

  // Bhava Chalita midpoints (Sripati midpoint system)
  // Mid-bhava = midpoint between consecutive cusps
  const bhavas: number[] = []
  for (let i = 0; i < 12; i++) {
    const c1 = cuspsTropical[i]
    const c2 = cuspsTropical[(i + 1) % 12]
    let mid = (c1 + c2) / 2
    // Handle wrap-around at 360°
    if (c2 < c1) mid = ((c1 + c2 + 360) / 2) % 360
    bhavas.push(mid)
  }
  const bhavasidereal = bhavas.map((b) => toSidereal(b, ayanamsha))

  // For Whole Sign: cusps are simply 0° of each sign from Asc sign
  if (system === 'whole_sign') {
    const ascSign = signOf(ascSidereal)  // 1–12
    const wseCusps: number[] = []
    const wseSidereal: number[] = []
    for (let i = 0; i < 12; i++) {
      const sign = ((ascSign - 1 + i) % 12) + 1
      const sidDeg = (sign - 1) * 30
      wseSidereal.push(sidDeg)
      wseCusps.push((sidDeg + ayanamsha) % 360)
    }
    return {
      ascendant:         ascTropical,
      ascendantSidereal: ascSidereal,
      ascRashi:          signOf(ascSidereal) as Rashi,
      ascDegreeInRashi:  degreeInSign(ascSidereal),
      mc:                mcTropical,
      mcSidereal,
      cusps:         wseCusps,
      cuspsSidereal: wseSidereal,
      bhavas:        wseCusps,      // same as cusps for whole sign
      bhavasidereal: wseSidereal,
    }
  }

  return {
    ascendant:         ascTropical,
    ascendantSidereal: ascSidereal,
    ascRashi:          signOf(ascSidereal) as Rashi,
    ascDegreeInRashi:  degreeInSign(ascSidereal),
    mc:                mcTropical,
    mcSidereal,
    cusps:         cuspsTropical,
    cuspsSidereal,
    bhavas,
    bhavasidereal,
  }
}

/**
 * Determine which house (1–12) a planet is in
 * Works for both Whole Sign (uses sign) and Placidus/Sripati (uses cusps)
 *
 * @param planetSidereal  Planet sidereal longitude
 * @param houses          HouseData from calcHouses
 * @param useBhava        If true, use Bhava Chalita midpoints
 */
export function planetHouse(
  planetSidereal: number,
  houses: HouseData,
  useBhava = false,
): number {
  const cusps = useBhava ? houses.bhavasidereal : houses.cuspsSidereal
  const lon = ((planetSidereal % 360) + 360) % 360

  for (let i = 0; i < 12; i++) {
    const c1 = cusps[i]
    const c2 = cusps[(i + 1) % 12]

    if (c2 > c1) {
      if (lon >= c1 && lon < c2) return i + 1
    } else {
      // Wrap-around (crosses 0°/360°)
      if (lon >= c1 || lon < c2) return i + 1
    }
  }

  return 1  // fallback
}

/**
 * Get the sign (Rashi) that falls in a given house number
 * For Whole Sign only — house N has sign (Asc sign + N - 1) mod 12
 */
export function wholeSignHouseSign(ascRashi: Rashi, house: number): Rashi {
  return (((ascRashi - 1 + house - 1) % 12) + 1) as Rashi
}

/**
 * Get the lord of a house (Whole Sign)
 * Returns the ruling planet of the sign in that house
 */
export function houseSignLord(ascRashi: Rashi, house: number): GrahaId {
  const sign = wholeSignHouseSign(ascRashi, house)
  const SIGN_LORDS: Record<number, GrahaId> = {
    1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
    7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
  }
  return SIGN_LORDS[sign]
}
