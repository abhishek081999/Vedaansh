// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dailyHoroscopeSky.ts
//  Sidereal sky snapshot for the general (chart-free) daily
//  horoscope: nine grahas at 06:00 IST plus the Moon's sign
//  ingress inside the sunrise-to-sunrise day (06:00 → 06:00 IST).
//  Geocentric longitudes are location-independent for this use.
// ─────────────────────────────────────────────────────────────

import {
  dateToJD,
  getAyanamsha,
  getPlanetPosition,
  ketuLongitude,
  NODE_IDS,
  SWISSEPH_IDS,
  signOf,
  toSidereal,
} from '@/lib/engine/ephemeris'
import { getHoraLord, getKarana, getNakshatra, getRahuKalam, getTithi, getVara, getYoga } from '@/lib/engine/nakshatra'
import { getSunriseSunset, getSunrise } from '@/lib/engine/sunrise'
import type { GrahaId, Rashi } from '@/types/astrology'
import type { GocharPlanet } from '@/lib/engine/gocharRules'

export interface SkyGraha {
  id: GocharPlanet
  /** Sidereal longitude (Lahiri), 0–360. */
  longitude: number
  rashi: Rashi
  retro: boolean
}

/** One planetary hour (hora); 12 by day (sunrise→sunset), 12 by night. */
export interface SkyHora {
  start: string
  end: string
  lord: GocharPlanet
  day: boolean
}

/**
 * Timings (sunrise, horas, Rahu Kalam) are local; the general horoscope uses
 * one shared reference place, the same one as the homepage panchang.
 */
export const HOROSCOPE_REFERENCE = { lat: 23.18, lng: 75.78, tz: 'Asia/Kolkata', label: 'Ujjain' } as const

export interface DailyHoroscopeSky {
  /** IST calendar date, YYYY-MM-DD. */
  date: string
  /** Start of the Vedic day used for the reading (06:00 IST). */
  dayStart: string
  dayEnd: string
  grahas: SkyGraha[]
  moonNakshatra: { index: number; name: string; pada: number }
  /** Moon changes sign during the day: the instant and the new sign. */
  moonIngress: { at: string; toRashi: Rashi } | null
  /** Panchang at the reading instant (06:00 IST). */
  panchang: {
    vara: { name: string; sanskrit: string; lord: string }
    tithi: { name: string; paksha: 'shukla' | 'krishna' }
    yoga: { name: string; quality: 'auspicious' | 'inauspicious' | 'neutral' }
    karana: { name: string; isBhadra: boolean }
  }
  /** Local timings at HOROSCOPE_REFERENCE. */
  timings: {
    place: string
    sunrise: string
    sunset: string
    rahuKalam: { start: string; end: string }
    horas: SkyHora[]
  }
}

const DAY_MS = 86_400_000
const BODIES: Array<Exclude<GocharPlanet, 'Ke'>> = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra']

function moonSiderealAt(when: Date): number {
  const jd = dateToJD(when)
  return toSidereal(getPlanetPosition(jd, SWISSEPH_IDS.Mo).longitude, getAyanamsha(jd, 'lahiri'))
}

/** 06:00 IST on `date` (= 00:30 UTC). */
export function horoscopeDayStart(date: string): Date {
  return new Date(`${date}T00:30:00Z`)
}

export function buildDailyHoroscopeSky(date: string): DailyHoroscopeSky {
  const start = horoscopeDayStart(date)
  const end = new Date(start.getTime() + DAY_MS)
  const jd = dateToJD(start)
  const ayan = getAyanamsha(jd, 'lahiri')

  const grahas: SkyGraha[] = BODIES.map((id) => {
    const pos = getPlanetPosition(jd, id === 'Ra' ? NODE_IDS.mean : SWISSEPH_IDS[id])
    const longitude = toSidereal(pos.longitude, ayan)
    // Mean nodes are always retrograde; sweph's mean-node speed can be noisy, so state it.
    return { id, longitude, rashi: signOf(longitude) as Rashi, retro: id === 'Ra' ? true : pos.isRetro }
  })
  const rahu = grahas.find((g) => g.id === 'Ra')!
  const ketuLon = ketuLongitude(rahu.longitude)
  grahas.push({ id: 'Ke', longitude: ketuLon, rashi: signOf(ketuLon) as Rashi, retro: true })

  const moon = grahas.find((g) => g.id === 'Mo')!
  const nak = getNakshatra(moon.longitude)
  const sun = grahas.find((g) => g.id === 'Su')!
  const vara = getVara(jd)
  const tithi = getTithi(moon.longitude, sun.longitude)
  const yoga = getYoga(sun.longitude, moon.longitude)
  const karana = getKarana(moon.longitude, sun.longitude)

  const timings = buildTimings(date, vara.number, vara.lord as GrahaId)

  // The Moon moves ~13°/day, so it changes sign at most once in 24 h.
  let moonIngress: DailyHoroscopeSky['moonIngress'] = null
  const endRashi = signOf(moonSiderealAt(end)) as Rashi
  if (endRashi !== moon.rashi) {
    let lo = start.getTime()
    let hi = end.getTime()
    while (hi - lo > 30_000) {
      const mid = (lo + hi) / 2
      if (signOf(moonSiderealAt(new Date(mid))) === moon.rashi) lo = mid
      else hi = mid
    }
    moonIngress = { at: new Date(Math.round(hi / 60_000) * 60_000).toISOString(), toRashi: endRashi }
  }

  return {
    date,
    dayStart: start.toISOString(),
    dayEnd: end.toISOString(),
    grahas,
    moonNakshatra: { index: nak.index, name: nak.name, pada: nak.pada },
    moonIngress,
    panchang: {
      vara: { name: vara.name, sanskrit: vara.sanskrit, lord: vara.lord },
      tithi: { name: tithi.name, paksha: tithi.paksha },
      yoga: { name: yoga.name, quality: yoga.quality },
      karana: { name: karana.name, isBhadra: karana.isBhadra },
    },
    timings,
  }
}

function buildTimings(date: string, varaNumber: number, varaLord: GrahaId): DailyHoroscopeSky['timings'] {
  const { lat, lng, tz, label } = HOROSCOPE_REFERENCE
  const { sunrise, sunset } = getSunriseSunset(date, lat, lng, tz)
  const next = new Date(`${date}T12:00:00Z`)
  next.setUTCDate(next.getUTCDate() + 1)
  const nextSunrise = getSunrise(next.toISOString().slice(0, 10), lat, lng, tz)

  const horas: SkyHora[] = []
  const dayLen = (sunset.getTime() - sunrise.getTime()) / 12
  const nightLen = (nextSunrise.getTime() - sunset.getTime()) / 12
  for (let i = 0; i < 24; i++) {
    const day = i < 12
    const t0 = day ? sunrise.getTime() + i * dayLen : sunset.getTime() + (i - 12) * nightLen
    const t1 = t0 + (day ? dayLen : nightLen)
    horas.push({
      start: new Date(t0).toISOString(),
      end: new Date(t1).toISOString(),
      lord: getHoraLord(varaLord, i) as GocharPlanet,
      day,
    })
  }
  const rahu = getRahuKalam(sunrise, sunset, varaNumber)
  return {
    place: label,
    sunrise: sunrise.toISOString(),
    sunset: sunset.toISOString(),
    rahuKalam: { start: rahu.start.toISOString(), end: rahu.end.toISOString() },
    horas,
  }
}

/**
 * Next span when the Moon occupies `rashi`, searching forward from `from`
 * (returns the current span if the Moon is already there). Used for
 * Chandrashtama — the Moon in the 8th sign from one's Janma Rashi.
 */
export function findMoonInSign(from: Date, rashi: Rashi, horizonDays = 32): { start: string; end: string } | null {
  const inSign = (t: number) => signOf(moonSiderealAt(new Date(t))) === rashi
  const STEP = 3 * 3_600_000
  const bisect = (lo: number, hi: number, loIn: boolean) => {
    while (hi - lo > 60_000) {
      const mid = (lo + hi) / 2
      if (inSign(mid) === loIn) lo = mid
      else hi = mid
    }
    return Math.round(hi / 60_000) * 60_000
  }

  let t = from.getTime()
  let start: number
  if (inSign(t)) {
    // Walk back to the ingress (a sign lasts ≤ ~2.7 days).
    let back = t
    while (inSign(back - STEP) && t - back < 4 * 86_400_000) back -= STEP
    start = bisect(back - STEP, back, false)
  } else {
    const limit = t + horizonDays * 86_400_000
    while (t < limit && !inSign(t + STEP)) t += STEP
    if (t >= limit) return null
    start = bisect(t, t + STEP, false)
  }
  let e = start
  while (inSign(e + STEP)) e += STEP
  const end = bisect(e, e + STEP, true)
  return { start: new Date(start).toISOString(), end: new Date(end).toISOString() }
}
