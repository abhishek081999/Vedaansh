// ─────────────────────────────────────────────────────────────
//  src/lib/engine/ashtakavarga.ts
//  Ashtakavarga — Eight-source contribution grid
//  Reference: BPHS Ch. 66-76, Ashtakavarga System of Prediction
//
//  Each of 8 contributors (Su,Mo,Ma,Me,Ju,Ve,Sa,Asc) casts
//  benefic points to 12 houses. Sum = Sarvashtakavarga (SAV).
// ─────────────────────────────────────────────────────────────

import type { GrahaData, LagnaData } from '@/types/astrology'

// ── Types ─────────────────────────────────────────────────────

export interface PlanetBAV {
  planet:     string         // 'Su','Mo' etc.
  bindus:     number[]       // 12 values (house 1–12 bindus)
  total:      number         // sum of bindus (usually 48–56)
}

export interface AshtakavargaResult {
  bav:    Record<string, PlanetBAV>   // BAV per planet
  sav:    number[]                    // SAV: sum of all 7 BAVs, 12 values
  savTotal: number                    // grand total (usually ~337)
}

// ── Benefic positions (from BPHS) ────────────────────────────
// For each planet, the positions (1-based from planet's own position)
// that receive a benefic point from each contributor.
// Format: BENEFIC_MAP[planet][contributor] = Set of relative positions (1-12)

// Positions are relative to each contributor's sign
const BENEFIC_POSITIONS: Record<string, Record<string, number[]>> = {
  Su: {
    Su: [1,2,4,7,8,9,10,11],
    Mo: [3,6,10,11],
    Ma: [1,2,4,7,8,9,10,11],
    Me: [3,5,6,9,10,11,12],
    Ju: [5,6,9,11],
    Ve: [6,7,12],
    Sa: [1,2,4,7,8,9,10,11],
    As: [3,4,6,10,11,12],
  },
  Mo: {
    Su: [3,6,7,8,10,11],
    Mo: [1,3,6,7,10,11],
    Ma: [2,3,5,6,9,10,11],
    Me: [1,3,4,5,7,8,10,11],
    Ju: [1,4,7,8,10,11,12],
    Ve: [3,4,5,7,9,10,11],
    Sa: [3,5,6,11],
    As: [3,6,10,11],
  },
  Ma: {
    Su: [3,5,6,10,11],
    Mo: [3,6,11],
    Ma: [1,2,4,7,8,10,11],
    Me: [3,5,6,11],
    Ju: [6,10,11,12],
    Ve: [6,8,11,12],
    Sa: [1,4,7,8,9,10,11],
    As: [1,3,6,10,11],
  },
  Me: {
    Su: [5,6,9,11,12],
    Mo: [2,4,6,8,10,11],
    Ma: [1,2,4,7,8,9,10,11],
    Me: [1,3,5,6,9,10,11,12],
    Ju: [6,8,11,12],
    Ve: [1,2,3,4,5,8,9,11],
    Sa: [1,2,4,7,8,9,10,11],
    As: [1,2,4,6,8,10,11],
  },
  Ju: {
    Su: [1,2,3,4,7,8,9,10,11],
    Mo: [2,5,7,9,11],
    Ma: [1,2,4,7,8,10,11],
    Me: [1,2,4,5,6,9,10,11],
    Ju: [1,2,3,4,7,8,10,11],
    Ve: [2,5,6,9,10,11],
    Sa: [3,5,6,12],
    As: [1,2,4,5,6,7,9,10,11],
  },
  Ve: {
    Su: [8,11,12],
    Mo: [1,2,3,4,5,8,9,11,12],
    Ma: [3,5,6,9,11,12],
    Me: [3,5,6,9,11],
    Ju: [5,8,9,10,11],
    Ve: [1,2,3,4,5,8,9,10,11],
    Sa: [3,4,5,8,9,10,11],
    As: [1,2,3,4,5,8,9,11],
  },
  Sa: {
    Su: [1,2,4,7,8,10,11],
    Mo: [3,6,11],
    Ma: [3,5,6,10,11,12],
    Me: [6,8,9,10,11,12],
    Ju: [5,6,11,12],
    Ve: [6,11,12],
    Sa: [3,5,6,11],
    As: [1,3,4,6,10,11],
  },
}

// ── Core calculation ──────────────────────────────────────────

function getRashi(totalDeg: number): number {
  return Math.floor(((totalDeg % 360) + 360) % 360 / 30) + 1  // 1–12
}

function relativePosition(fromRashi: number, toRashi: number): number {
  return ((toRashi - fromRashi + 12) % 12) + 1  // 1–12
}

function computePlanetBAV(
  planet:     string,
  grahas:     GrahaData[],
  ascRashi:   number,
): PlanetBAV {
  const bindus = Array(12).fill(0)

  // Get contributor positions
  const contributors: Record<string, number> = {
    As: ascRashi,
  }
  for (const g of grahas) {
    if (['Su','Mo','Ma','Me','Ju','Ve','Sa'].includes(g.id)) {
      contributors[g.id] = getRashi(g.totalDegree ?? 0)
    }
  }

  const beneficMap = BENEFIC_POSITIONS[planet]
  if (!beneficMap) return { planet, bindus, total: 0 }

  // For each contributor, add benefic points to houses
  for (const [contrib, beneficPositions] of Object.entries(beneficMap)) {
    const contribRashi = contributors[contrib]
    if (!contribRashi) continue

    for (const pos of beneficPositions) {
      // pos is relative to contributor's sign
      const targetRashi = ((contribRashi - 1 + pos - 1) % 12) + 1
      bindus[targetRashi - 1]++
    }
  }

  const total = bindus.reduce((a, b) => a + b, 0)
  return { planet, bindus, total }
}

// ── Main function ─────────────────────────────────────────────

export function calculateAshtakavarga(
  grahas:  GrahaData[],
  lagnas:  LagnaData,
): AshtakavargaResult {
  const ascRashi = lagnas.ascRashi ?? 1
  const planets  = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']

  const bav: Record<string, PlanetBAV> = {}

  for (const planet of planets) {
    bav[planet] = computePlanetBAV(planet, grahas, ascRashi)
  }

  // SAV = sum of all 7 planet BAVs (not Ascendant)
  const sav = Array(12).fill(0)
  for (const planet of planets) {
    for (let i = 0; i < 12; i++) {
      sav[i] += bav[planet].bindus[i]
    }
  }
  const savTotal = sav.reduce((a, b) => a + b, 0)

  return { bav, sav, savTotal }
}