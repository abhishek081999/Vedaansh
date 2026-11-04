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
import { getKarana, getNakshatra, getTithi, getVara, getYoga } from '@/lib/engine/nakshatra'
import type { Rashi } from '@/types/astrology'
import type { GocharPlanet } from '@/lib/engine/gocharRules'

export interface SkyGraha {
  id: GocharPlanet
  /** Sidereal longitude (Lahiri), 0–360. */
  longitude: number
  rashi: Rashi
  retro: boolean
}

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
  }
}
