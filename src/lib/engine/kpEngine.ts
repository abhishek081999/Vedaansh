
/**
 * src/lib/engine/kpEngine.ts
 *
 * Krishnamurti Padhdhati (KP) Engine.
 * Implements: 4-level stellar positions, Significators (A/B/C/D),
 * Cuspal Interlinks, and Ruling Planets.
 */

import {
  type GrahaId, type Rashi,
  type KPSignificatorResult, type KPCuspalInterlink, type KPRulingPlanets,
  type GrahaData, type KPSignificatorLevels
} from '@/types/astrology'
import { signOf, getPlanetPosition, SWISSEPH_IDS } from './ephemeris'
import { type HouseData, planetHouse } from './houses'
import { kpStellar, kpHoraryNumberDegree, KP_SIGN_LORDS, type StellarPosition } from './kpCore'
import sweph from 'sweph'

// ── Stellar Position Calculations ──────────────────────────────

export type { StellarPosition } from './kpCore'

/** Calculates the 4-level KP lords for any sidereal longitude. */
export function getKPStellar(longitude: number): StellarPosition {
  return kpStellar(longitude)
}

const SIGN_LORDS = KP_SIGN_LORDS

// ── Significators ─────────────────────────────────────────────

/**
 * Calculate KP Significators A, B, C, D for all houses and planets.
 */
export function calculateKPSignificators(
  grahas: GrahaData[],
  houses: HouseData
): KPSignificatorResult {
  const houseSigs: Record<number, KPSignificatorLevels> = {}
  const planetSigs: Record<string, number[]> = {}
  
  // Initialize
  for (let i = 1; i <= 12; i++) {
    houseSigs[i] = { A: [], B: [], C: [], D: [] }
  }
  
  const occupants: Record<number, GrahaId[]> = {}
  const houseLords: Record<number, GrahaId> = {}
  
  // 1. Identify occupants and lords
  grahas.forEach(g => {
    const h = planetHouse(g.lonSidereal, houses)
    if (!occupants[h]) occupants[h] = []
    occupants[h].push(g.id)
    
    // Planet Significations Initialization
    planetSigs[g.id] = []
  })
  
  for (let i = 1; i <= 12; i++) {
    const rashi = signOf(houses.cuspsSidereal[i - 1]) as Rashi
    houseLords[i] = SIGN_LORDS[rashi]
  }
  
  // 2. Build Levels
  for (let h = 1; h <= 12; h++) {
    const hLords: KPSignificatorLevels = houseSigs[h]
    
    // Level B: Occupants
    hLords.B = occupants[h] || []
    
    // Level D: House Lord
    hLords.D = [houseLords[h]];
    
    // Level A: Planet in Star of Occupant
    (occupants[h] || []).forEach((occId: GrahaId) => {
      grahas.forEach(p => {
        if (p.kp?.starLord === occId) {
          if (!hLords.A.includes(p.id)) hLords.A.push(p.id)
        }
      })
    })
    
    // Level C: Planet in Star of House Lord
    const lordId = houseLords[h];
    grahas.forEach(p => {
      if (p.kp?.starLord === lordId) {
        if (!hLords.C.includes(p.id)) hLords.C.push(p.id)
      }
    })
  }
  
  // 3. Build Inverse (Planet -> Houses)
  grahas.forEach(g => {
    for (let h = 1; h <= 12; h++) {
      const levels = houseSigs[h]
      if (
        levels.A.includes(g.id) || 
        levels.B.includes(g.id) || 
        levels.C.includes(g.id) || 
        levels.D.includes(g.id)
      ) {
        planetSigs[g.id].push(h)
      }
    }
  })
  
  return { houseSignificators: houseSigs, planetSignificators: planetSigs }
}

// ── Cuspal Interlinks ─────────────────────────────────────────

export function calculateKPCusps(houses: HouseData): KPCuspalInterlink[] {
  return houses.cuspsSidereal.map((lon, i) => {
    const stellar = getKPStellar(lon)
    return {
      house:      i + 1,
      ...stellar,
      degree:     lon % 30,
      rashi:      signOf(lon) as Rashi
    }
  })
}

// ── Ruling Planets ────────────────────────────────────────────

/**
 * Calculates Ruling Planets (RP) for a given date and location.
 */
export function calculateRulingPlanets(
  jd: number,
  lat: number,
  lng: number,
  ayanValue: number,
  /** Vedic weekday (0=Sun), sunrise to sunrise. If omitted, approximated from local mean time. */
  varaNumber?: number,
): KPRulingPlanets {
  // 1. Day Lord — Math.floor(jd + 1.5) % 7 is the UTC weekday with 0 = Sunday.
  // Without a known vara, shift to local mean time and start the day ~6 am.
  const dOfWeek = varaNumber ?? Math.floor(jd + 1.5 + lng / 360 - 0.25) % 7
  const dayLordId = (['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const)[((dOfWeek % 7) + 7) % 7] as GrahaId

  // 2. Moon Star/Sign Lords — same ayanamsha value as the chart
  const moonTrop = getPlanetPosition(jd, SWISSEPH_IDS.Mo).longitude
  const moonStellar = getKPStellar((moonTrop - ayanValue + 360) % 360)
  
  // 3. Lagna Star/Sign Lords
  // We need to calculate Ascendant for this JD
  const r = sweph.houses(jd, lat, lng, 'P') as any // Placidus
  const ascTropical = r.ascendant || r.data?.points?.[0] || 0
  const ascSidereal = (ascTropical - ayanValue + 360) % 360
  const ascStellar = getKPStellar(ascSidereal)
  
  return {
    dayLord:      dayLordId,
    moonStarLord: moonStellar.starLord,
    moonSignLord: moonStellar.signLord,
    lagnaStarLord: ascStellar.starLord,
    lagnaSignLord: ascStellar.signLord
  }
}

/**
 * Starting sidereal degree for a KP Horary number (1-249).
 * Uses the classical table where subs crossing a sign boundary are split.
 */
export function getKPSeedDegree(seed: number): number {
  return kpHoraryNumberDegree(seed)
}
