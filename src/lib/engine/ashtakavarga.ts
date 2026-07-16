// ─────────────────────────────────────────────────────────────
//  src/lib/engine/ashtakavarga.ts
//  Ashtakavarga — Jagannatha Hora / Parasara (Santhanam) tables
//
//  Reference implementation: PyJHora (naturalstupid/pyjhora)
//  ashtaka_varga_dict + Trikona/Ekadhipatya/Sodhya Pinda rules.
//  Validated against PVR Chart 7 (BAV/SAV totals 337).
// ─────────────────────────────────────────────────────────────

import type {
  AshtakavargaResult,
  GrahaData,
  LagnaData,
  PlanetBAV,
  Rashi,
} from '@/types/astrology'

export type { AshtakavargaResult, PlanetBAV }

/** Fresh calculation always includes Sodhya / Prastara fields. */
export type CalculatedAshtakavargaResult = Required<AshtakavargaResult>

/** Prastara: which of the 8 contributors gave a bindu in each sign */
export interface PrastaraBAV {
  planet: string
  /** contributor → 12 flags (0|1) by rashi */
  byContributor: Record<string, number[]>
}

export interface SodhyaPinda {
  planet: string
  rasiPinda:  number
  grahaPinda: number
  sodhyaPinda: number
}

/** Classical BAV totals (checksum) — same in JHora */
export const BAV_TOTALS: Record<string, number> = {
  Su: 48, Mo: 49, Ma: 39, Me: 54, Ju: 56, Ve: 52, Sa: 39, As: 49,
}

const PLANETS = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const
const CONTRIBUTORS = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'As'] as const

// ── JHora / PyJHora benefic tables (Parasara–Santhanam) ───────
// BENEFIC_POSITIONS[target][contributor] = relative houses (1–12)

const BENEFIC_POSITIONS: Record<string, Record<string, number[]>> = {
  Su: {
    Su: [1, 2, 4, 7, 8, 9, 10, 11],
    Mo: [3, 6, 10, 11],
    Ma: [1, 2, 4, 7, 8, 9, 10, 11],
    Me: [3, 5, 6, 9, 10, 11, 12],
    Ju: [5, 6, 9, 11],
    Ve: [6, 7, 12],
    Sa: [1, 2, 4, 7, 8, 9, 10, 11],
    As: [3, 4, 6, 10, 11, 12],
  },
  // Moon table differs from B.V. Raman — this is JHora’s Parasara set
  Mo: {
    Su: [3, 6, 7, 8, 10, 11],
    Mo: [1, 3, 6, 7, 9, 10, 11],
    Ma: [2, 3, 5, 6, 10, 11],
    Me: [1, 3, 4, 5, 7, 8, 10, 11],
    Ju: [1, 2, 4, 7, 8, 10, 11],
    Ve: [3, 4, 5, 7, 9, 10, 11],
    Sa: [3, 5, 6, 11],
    As: [3, 6, 10, 11],
  },
  Ma: {
    Su: [3, 5, 6, 10, 11],
    Mo: [3, 6, 11],
    Ma: [1, 2, 4, 7, 8, 10, 11],
    Me: [3, 5, 6, 11],
    Ju: [6, 10, 11, 12],
    Ve: [6, 8, 11, 12],
    Sa: [1, 4, 7, 8, 9, 10, 11],
    As: [1, 3, 6, 10, 11],
  },
  Me: {
    Su: [5, 6, 9, 11, 12],
    Mo: [2, 4, 6, 8, 10, 11],
    Ma: [1, 2, 4, 7, 8, 9, 10, 11],
    Me: [1, 3, 5, 6, 9, 10, 11, 12],
    Ju: [6, 8, 11, 12],
    Ve: [1, 2, 3, 4, 5, 8, 9, 11],
    Sa: [1, 2, 4, 7, 8, 9, 10, 11],
    As: [1, 2, 4, 6, 8, 10, 11],
  },
  Ju: {
    Su: [1, 2, 3, 4, 7, 8, 9, 10, 11],
    Mo: [2, 5, 7, 9, 11],
    Ma: [1, 2, 4, 7, 8, 10, 11],
    Me: [1, 2, 4, 5, 6, 9, 10, 11],
    Ju: [1, 2, 3, 4, 7, 8, 10, 11],
    Ve: [2, 5, 6, 9, 10, 11],
    Sa: [3, 5, 6, 12],
    As: [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  // Venus from Mars: 3,4,6,9,11,12 (JHora) — not 3,5,6,…
  Ve: {
    Su: [8, 11, 12],
    Mo: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    Ma: [3, 4, 6, 9, 11, 12],
    Me: [3, 5, 6, 9, 11],
    Ju: [5, 8, 9, 10, 11],
    Ve: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    Sa: [3, 4, 5, 8, 9, 10, 11],
    As: [1, 2, 3, 4, 5, 8, 9, 11],
  },
  Sa: {
    Su: [1, 2, 4, 7, 8, 10, 11],
    Mo: [3, 6, 11],
    Ma: [3, 5, 6, 10, 11, 12],
    Me: [6, 8, 9, 10, 11, 12],
    Ju: [5, 6, 11, 12],
    Ve: [6, 11, 12],
    Sa: [3, 5, 6, 11],
    As: [1, 3, 4, 6, 10, 11],
  },
  As: {
    Su: [3, 4, 6, 10, 11, 12],
    Mo: [3, 6, 10, 11, 12],
    Ma: [1, 3, 6, 10, 11],
    Me: [1, 2, 4, 6, 8, 10, 11],
    Ju: [1, 2, 4, 5, 6, 7, 9, 10, 11],
    Ve: [1, 2, 3, 4, 5, 8, 9],
    Sa: [1, 3, 4, 6, 10, 11],
    As: [3, 6, 10, 11],
  },
}

/** Fire/earth/air/water trikonas (1-based rashis) */
const TRIKONAS: readonly (readonly number[])[] = [
  [1, 5, 9],
  [2, 6, 10],
  [3, 7, 11],
  [4, 8, 12],
]

/** Dual-lord pairs for Ekadhipatya (Cancer/Leo exempt) */
const EKADHIPATYA_PAIRS: readonly [number, number][] = [
  [1, 8],   // Mars
  [3, 6],   // Mercury
  [9, 12],  // Jupiter
  [2, 7],   // Venus
  [10, 11], // Saturn
]

/** Rasi gunakara — JHora / PyJHora ashtakavarga_rasimana_multipliers */
const RASI_GUNAKARA = [7, 10, 8, 4, 10, 6, 7, 8, 9, 5, 11, 12]

/** Graha gunakara — Su…Sa */
const GRAHA_GUNAKARA: Record<string, number> = {
  Su: 5, Mo: 5, Ma: 8, Me: 5, Ju: 10, Ve: 7, Sa: 5,
}

// ── Helpers ───────────────────────────────────────────────────

function getRashiFromDegree(totalDeg: number): number {
  return Math.floor((((totalDeg % 360) + 360) % 360) / 30) + 1
}

function contributorRashi(g: GrahaData): number {
  if (g.rashi >= 1 && g.rashi <= 12) return g.rashi
  return getRashiFromDegree(g.totalDegree ?? g.lonSidereal ?? 0)
}

function sumBindus(bindus: number[]): number {
  return bindus.reduce((a, b) => a + b, 0)
}

function makeBAV(planet: string, bindus: number[]): PlanetBAV {
  return { planet, bindus, total: sumBindus(bindus) }
}

function buildContributors(grahas: GrahaData[], ascRashi: number): Record<string, number> {
  const contributors: Record<string, number> = { As: ascRashi }
  for (const g of grahas) {
    if ((PLANETS as readonly string[]).includes(g.id)) {
      contributors[g.id] = contributorRashi(g)
    }
  }
  return contributors
}

/**
 * Occupied signs for Ekadhipatya — JHora counts Su–Sa plus Ra/Ke
 * (any graha body in the sign). Lagna alone does not occupy.
 */
function occupiedSigns(grahas: GrahaData[]): Set<number> {
  const occupied = new Set<number>()
  for (const g of grahas) {
    if (['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'].includes(g.id)) {
      occupied.add(contributorRashi(g))
    }
  }
  return occupied
}

// ── Core BAV + Prastara ───────────────────────────────────────

function computePlanetBAV(
  planet: string,
  contributors: Record<string, number>,
): { bav: PlanetBAV; prastara: PrastaraBAV } {
  const bindus = Array(12).fill(0) as number[]
  const byContributor: Record<string, number[]> = {}
  for (const c of CONTRIBUTORS) byContributor[c] = Array(12).fill(0)

  const beneficMap = BENEFIC_POSITIONS[planet]
  if (!beneficMap) {
    return { bav: makeBAV(planet, bindus), prastara: { planet, byContributor } }
  }

  for (const [contrib, beneficPositions] of Object.entries(beneficMap)) {
    const contribRashi = contributors[contrib]
    if (!contribRashi) continue
    for (const pos of beneficPositions) {
      const targetRashi = ((contribRashi - 1 + pos - 1) % 12) + 1
      const idx = targetRashi - 1
      bindus[idx]++
      byContributor[contrib][idx] = 1
    }
  }

  return {
    bav: makeBAV(planet, bindus),
    prastara: { planet, byContributor },
  }
}

// ── Sodhana (JHora / PyJHora rules) ───────────────────────────

/**
 * Trikona Sodhana (JHora):
 * 1. If any of the three is 0 → no reduction
 * 2. If all three equal → zero all
 * 3. Else subtract the minimum from all three
 * (No separate “two zeros → wipe third” rule — that is Raman-only.)
 */
export function applyTrikonaSodhana(bindus: number[]): number[] {
  const out = [...bindus]
  for (const group of TRIKONAS) {
    const vals = group.map((r) => out[r - 1])
    if (vals.some((v) => v === 0)) continue
    if (vals[0] === vals[1] && vals[1] === vals[2]) {
      for (const r of group) out[r - 1] = 0
      continue
    }
    const min = Math.min(...vals)
    for (const r of group) out[r - 1] -= min
  }
  return out
}

/**
 * Ekadhipatya Sodhana (JHora / PyJHora):
 * Applied to every BAV for each dual-lord pair.
 * When one sign occupied and figures equal → keep both (do not wipe empty).
 */
export function applyEkadhipatyaSodhana(
  bindus: number[],
  occupied: Set<number>,
): number[] {
  const out = [...bindus]

  for (const [a, b] of EKADHIPATYA_PAIRS) {
    let fa = out[a - 1]
    let fb = out[b - 1]
    const occA = occupied.has(a)
    const occB = occupied.has(b)

    if (fa === 0 || fb === 0) continue
    if (occA && occB) continue

    if (!occA && !occB) {
      if (fa === fb) {
        fa = 0
        fb = 0
      } else {
        const min = Math.min(fa, fb)
        fa = min
        fb = min
      }
    } else if (occA && !occB) {
      // empty = B
      if (fb < fa) fb = 0
      else fb = fa // higher or equal → set empty to occupied value
    } else {
      // empty = A
      if (fa < fb) fa = 0
      else fa = fb
    }

    out[a - 1] = fa
    out[b - 1] = fb
  }

  return out
}

export function applyMandalaSodhana(sav: number[]): number[] {
  return sav.map((v) => {
    if (v === 0) return 0
    const rem = v % 12
    return rem === 0 ? 12 : rem
  })
}

export function reduceBAV(bindus: number[], occupied: Set<number>): number[] {
  return applyEkadhipatyaSodhana(applyTrikonaSodhana(bindus), occupied)
}

/** Optional SAV reduction path (Mandala → Trikona → Ekadhipatya) */
export function reduceSAV(sav: number[], occupied: Set<number>): number[] {
  return applyEkadhipatyaSodhana(applyTrikonaSodhana(applyMandalaSodhana(sav)), occupied)
}

function computeSodhyaPindas(
  bavReduced: Record<string, PlanetBAV>,
  grahas: GrahaData[],
): Record<string, SodhyaPinda> {
  const planetHouses = PLANETS.map((id) => {
    const g = grahas.find((x) => x.id === id)
    return g ? contributorRashi(g) : 1
  })

  const out: Record<string, SodhyaPinda> = {}
  for (const planet of PLANETS) {
    const bindus = bavReduced[planet]?.bindus ?? Array(12).fill(0)
    const rasiPinda = bindus.reduce((sum, v, i) => sum + v * RASI_GUNAKARA[i], 0)
    const grahaPinda = planetHouses.reduce((sum, houseRashi, i) => {
      const owner = PLANETS[i]
      return sum + GRAHA_GUNAKARA[owner] * bindus[houseRashi - 1]
    }, 0)
    out[planet] = {
      planet,
      rasiPinda,
      grahaPinda,
      sodhyaPinda: rasiPinda + grahaPinda,
    }
  }
  return out
}

// ── Main ──────────────────────────────────────────────────────

export function calculateAshtakavarga(
  grahas: GrahaData[],
  lagnas: LagnaData,
): CalculatedAshtakavargaResult {
  const ascRashi = (lagnas.ascRashi ?? 1) as Rashi
  const contributors = buildContributors(grahas, ascRashi)
  const occupied = occupiedSigns(grahas)

  const bav: Record<string, PlanetBAV> = {}
  const bavReduced: Record<string, PlanetBAV> = {}
  const prastara: Record<string, PrastaraBAV> = {}

  for (const planet of [...PLANETS, 'As'] as const) {
    const { bav: raw, prastara: pav } = computePlanetBAV(planet, contributors)
    bav[planet] = raw
    prastara[planet] = pav
    bavReduced[planet] = makeBAV(planet, reduceBAV(raw.bindus, occupied))
  }

  const sav = Array(12).fill(0) as number[]
  for (const planet of PLANETS) {
    for (let i = 0; i < 12; i++) sav[i] += bav[planet].bindus[i]
  }

  // JHora Sodhita SAV = sum of reduced planet BAVs (Lagna excluded)
  const savReduced = Array(12).fill(0) as number[]
  for (const planet of PLANETS) {
    for (let i = 0; i < 12; i++) savReduced[i] += bavReduced[planet].bindus[i]
  }

  return {
    bav,
    sav,
    savTotal: sumBindus(sav),
    bavReduced,
    savReduced,
    savReducedTotal: sumBindus(savReduced),
    rekhas: sav.map((v) => 56 - v),
    prastara,
    sodhyaPindas: computeSodhyaPindas(bavReduced, grahas),
  }
}

/** Reorder a 12-length rashi array to houses 1–12 from Ascendant (JHora table view). */
export function toHousesFromLagna(valuesByRashi: number[], ascRashi: number): number[] {
  return Array.from({ length: 12 }, (_, h) => {
    const rashi = ((ascRashi - 1 + h) % 12) + 1
    return valuesByRashi[rashi - 1] ?? 0
  })
}
