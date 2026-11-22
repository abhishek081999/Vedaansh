// ─────────────────────────────────────────────────────────────
//  src/lib/engine/prashnaGlance.ts
//  The prashna chart read through Prashna Essentials: all ten avasthas of
//  each planet, and a one-card summary (Lagna traits, Lagna lord, Moon,
//  kendras, event time). Pure: takes plain positions, returns ids and enums.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import type { EngineLang } from './lang'
import { classificationsOf, getRashiProfile } from './prashnaRashiEssentials'
import { EVENT_TIME, MOON_PUSHKARA, MRITYU_BHAGA, dignityOf, inBhaga, type DignityKind, type EventTime } from './prashnaPlanetEssentials'

export type AvasthaKind = 'deepta' | 'swastha' | 'mudita' | 'shanta' | 'shakta' | 'peedita' | 'deena' | 'khala' | 'vikala' | 'bheeta'
export const AVASTHA_ORDER: AvasthaKind[] = ['deepta', 'swastha', 'mudita', 'shanta', 'shakta', 'peedita', 'deena', 'khala', 'vikala', 'bheeta']

/** Planets that take avasthas (the nodes are left out: their dignities differ by school). */
export const AVASTHA_PLANETS: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']
const NATURAL_BENEFICS: GrahaId[] = ['Mo', 'Me', 'Ju', 'Ve']
const NATURAL_MALEFICS: GrahaId[] = ['Su', 'Ma', 'Sa', 'Ra', 'Ke']
const WAR_PLANETS: GrahaId[] = ['Ma', 'Me', 'Ju', 'Ve', 'Sa']
/** Shadvarga used for Shanta avastha. */
export const SHADVARGA = ['D1', 'D2', 'D3', 'D9', 'D12', 'D30'] as const
/** Bheeta: within this many degrees of the Sun (class notes). */
export const BHEETA_ORB = 10
export const WAR_ORB = 1

const SIGN_LORD: GrahaId[] = ['Ma', 'Ve', 'Me', 'Mo', 'Su', 'Me', 'Ve', 'Ma', 'Ju', 'Sa', 'Sa', 'Ju']
export const signLord = (r: Rashi): GrahaId => SIGN_LORD[r - 1]

export interface GlancePlanet {
  id: GrahaId
  rashi: Rashi
  /** Degree within the sign, 0–30. */
  degree: number
  lonSidereal: number
  latitude: number
  isCombust: boolean
  isRetro: boolean
}

export interface PlanetAvasthas {
  kinds: AvasthaKind[]
  dignity?: DignityKind
  /** Shadvarga signs owned by benefics, out of how many vargas were available. */
  beneficVargas?: { n: number; of: number }
  war?: { with: GrahaId; won: boolean }
}

const arc = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/** Planetary wars among Mars to Saturn: within 1°, the planet further north wins. */
export function planetaryWars(planets: GlancePlanet[]): { winner: GrahaId; loser: GrahaId }[] {
  const ps = planets.filter(p => WAR_PLANETS.includes(p.id))
  const out: { winner: GrahaId; loser: GrahaId }[] = []
  for (let i = 0; i < ps.length; i++) {
    for (let j = i + 1; j < ps.length; j++) {
      if (arc(ps[i].lonSidereal, ps[j].lonSidereal) > WAR_ORB) continue
      const [w, l] = ps[i].latitude >= ps[j].latitude ? [ps[i], ps[j]] : [ps[j], ps[i]]
      out.push({ winner: w.id, loser: l.id })
    }
  }
  return out
}

/**
 * All ten avasthas, per planet. A planet can be in several at once.
 * Deepta / Swastha / Mudita / Deena / Khala come from the sign (friend and enemy by
 * praśna group friendship; Khala also for a planet that loses a planetary war).
 * Shanta: at least 4 of the shadvarga signs owned by natural benefics.
 * Shakta: visible (not combust). Peedita: combust. Bheeta: within 10° of the Sun.
 * Vikala: in the same sign as a natural malefic.
 */
export function computeAvasthas(planets: GlancePlanet[], shadvarga?: Partial<Record<GrahaId, Rashi[]>>): Partial<Record<GrahaId, PlanetAvasthas>> {
  const sun = planets.find(p => p.id === 'Su')
  const wars = planetaryWars(planets)
  const out: Partial<Record<GrahaId, PlanetAvasthas>> = {}
  for (const p of planets) {
    if (!AVASTHA_PLANETS.includes(p.id)) continue
    const kinds = new Set<AvasthaKind>()
    const dignity = dignityOf(p.id, p.rashi, p.degree)
    if (dignity === 'exalted') kinds.add('deepta')
    if (dignity === 'own' || dignity === 'moolatrikona') kinds.add('swastha')
    if (dignity === 'friend') kinds.add('mudita')
    if (dignity === 'debilitated') kinds.add('deena')
    if (dignity === 'enemy') kinds.add('khala')

    let beneficVargas: PlanetAvasthas['beneficVargas']
    const signs = shadvarga?.[p.id]
    if (signs?.length) {
      const n = signs.filter(r => NATURAL_BENEFICS.includes(signLord(r))).length
      beneficVargas = { n, of: signs.length }
      if (n >= Math.ceil((signs.length * 2) / 3)) kinds.add('shanta')
    }

    if (p.id !== 'Su') {
      if (p.isCombust) kinds.add('peedita')
      else kinds.add('shakta')
      if (sun && arc(p.lonSidereal, sun.lonSidereal) <= BHEETA_ORB) kinds.add('bheeta')
    }

    if (planets.some(o => o.id !== p.id && o.rashi === p.rashi && NATURAL_MALEFICS.includes(o.id))) kinds.add('vikala')

    let war: PlanetAvasthas['war']
    const w = wars.find(x => x.winner === p.id || x.loser === p.id)
    if (w) {
      war = { with: w.winner === p.id ? w.loser : w.winner, won: w.winner === p.id }
      if (!war.won) kinds.add('khala')
    }

    out[p.id] = {
      kinds: AVASTHA_ORDER.filter(k => kinds.has(k)),
      ...(dignity ? { dignity } : {}),
      ...(beneficVargas ? { beneficVargas } : {}),
      ...(war ? { war } : {}),
    }
  }
  return out
}

// ── One-card summary ───────────────────────────────────────

/** House of sign `r` counted from the Lagna sign. */
export const houseOf = (asc: Rashi, r: Rashi) => ((r - asc + 12) % 12) + 1

export interface PrashnaGlance {
  lagna: {
    rashi: Rashi
    degree: number
    lord: GrahaId
    /** Localized labels: mobility, element, direction, feet, gender, rising, strength by time. */
    traits: { id: string; title: string; label: string; half?: 1 | 2 }[]
    dualTilt?: 'fixed' | 'movable'
    timeStrong: boolean
    mrityu: boolean
  }
  lagnaLord: { id: GrahaId; rashi: Rashi; house: number; avasthas?: PlanetAvasthas; retro: boolean }
  moon: { rashi: Rashi; house: number; avasthas?: PlanetAvasthas; benefic: boolean; pushkara: boolean; mrityu: boolean }
  /** Planets in houses 1, 4, 7 and 10. */
  kendras: { house: 1 | 4 | 7 | 10; planets: GrahaId[] }[]
  eventTimes: EventTime[]
  avasthas: Partial<Record<GrahaId, PlanetAvasthas>>
}

const TRAIT_CLASSES = ['mobility', 'element', 'direction', 'feet', 'gender', 'rising']
const NIGHT_SIGNS: Rashi[] = [1, 2, 3, 4, 9, 10]

export function buildPrashnaGlance(input: {
  ascRashi: Rashi
  ascDegree: number
  planets: GlancePlanet[]
  isDay: boolean
  tithi: number
  shadvarga?: Partial<Record<GrahaId, Rashi[]>>
}, lang: EngineLang = 'en'): PrashnaGlance {
  const { ascRashi: asc, planets } = input
  const deg = ((input.ascDegree % 30) + 30) % 30
  const avasthas = computeAvasthas(planets, input.shadvarga)
  const lordId = getRashiProfile(asc).lord
  const lord = planets.find(p => p.id === lordId)
  const moon = planets.find(p => p.id === 'Mo')

  const memberships = classificationsOf(asc, lang).filter(m => TRAIT_CLASSES.includes(m.classification.id))
  const traits = TRAIT_CLASSES.flatMap(id => memberships.filter(m => m.classification.id === id)
    // A split sign (feet of 9 and 10) takes the half the Lagna degree falls in.
    .filter((m, _, all) => all.length < 2 || m.half === (deg < 15 ? 1 : 2))
    .map(m => ({ id: m.group.id, title: m.classification.title, label: m.group.label, ...(m.half ? { half: m.half } : {}) })))

  const lagnaPlanets = planets.filter(p => p.rashi === asc).map(p => p.id)
  return {
    lagna: {
      rashi: asc, degree: deg, lord: lordId, traits,
      ...(asc % 3 === 0 ? { dualTilt: deg < 15 ? 'fixed' as const : 'movable' as const } : {}),
      timeStrong: NIGHT_SIGNS.includes(asc) !== input.isDay,
      mrityu: inBhaga(deg, MRITYU_BHAGA.La[asc - 1]),
    },
    lagnaLord: {
      id: lordId,
      rashi: lord?.rashi ?? asc,
      house: lord ? houseOf(asc, lord.rashi) : 1,
      avasthas: avasthas[lordId],
      retro: !!lord?.isRetro,
    },
    moon: {
      rashi: moon?.rashi ?? asc,
      house: moon ? houseOf(asc, moon.rashi) : 1,
      avasthas: avasthas.Mo,
      benefic: input.tithi >= 8 && input.tithi <= 22,
      pushkara: !!moon && inBhaga(moon.degree, MOON_PUSHKARA[moon.rashi - 1]),
      mrityu: !!moon && inBhaga(moon.degree, MRITYU_BHAGA.Mo[moon.rashi - 1]),
    },
    kendras: ([1, 4, 7, 10] as const).map(house => ({ house, planets: planets.filter(p => houseOf(asc, p.rashi) === house).map(p => p.id) })),
    eventTimes: [...new Set(lagnaPlanets.map(id => EVENT_TIME[id]).filter((x): x is EventTime => !!x))],
    avasthas,
  }
}
