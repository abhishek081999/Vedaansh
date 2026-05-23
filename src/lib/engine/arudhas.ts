// ─────────────────────────────────────────────────────────────
//  src/lib/engine/arudhas.ts
//  Arudha Padas — Bhava Arudhas (AL, A2–A12) + Graha Arudhas
//  Algorithm: BPHS Chapter on Arudha Padas
//
//  Rule: Arudha of bhava N = lord of N counted from N,
//        then count same number from lord → result sign
//  Edge cases (BPHS):
//    - If result = same sign as bhava N → go 10 signs from lord
//    - If result = 7th from bhava N → go 10 signs from lord
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi, ArudhaData } from '@/types/astrology'

// ── Sign lord table (for Whole Sign house system) ─────────────

const SIGN_LORD: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve',  3: 'Me',  4: 'Mo',
  5: 'Su', 6: 'Me',  7: 'Ve',  8: 'Ma',
  9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

// ── Core helpers ──────────────────────────────────────────────

/** Cycle a rashi value: always 1–12 */
function mod12(n: number): Rashi {
  return (((n - 1) % 12) + 12) % 12 + 1 as Rashi
}

/** Count `n` signs from `start` (1-indexed, forward) */
function countFrom(start: Rashi, n: number): Rashi {
  return mod12(start + n - 1)
}

/**
 * Find which sign a graha occupies in D1
 * @param grahas  Array of { id, rashi } from chart
 * @param id      GrahaId to find
 */
function grahaSign(
  grahas: Array<{ id: GrahaId; rashi: Rashi }>,
  id: GrahaId,
): Rashi {
  return grahas.find((g) => g.id === id)?.rashi ?? (1 as Rashi)
}

// ── Arudha calculation ────────────────────────────────────────

export interface ArudhaOptions {
  /** Apply BPHS 1st/7th-from-bhava corrections. Default: false (raw pada). */
  applyExceptions?: boolean
}

/**
 * Calculate the Arudha Pada of a given bhava
 *
 * @param bhavaSign    The sign of the bhava (house) — 1–12
 * @param grahas       All graha placements { id, rashi }
 * @param options      applyExceptions — BPHS 1st/7th corrections (default false)
 * @returns            Arudha sign (Rashi 1–12)
 *
 * Algorithm:
 *   1. Find lord of bhavaSign
 *   2. Count distance from bhavaSign to lord's sign (forward)
 *   3. Count same distance from lord's sign → result
 *   4. Optionally apply BPHS edge-case corrections
 */
export function calcArudha(
  bhavaSign: Rashi,
  grahas: Array<{ id: GrahaId; rashi: Rashi }>,
  options: ArudhaOptions = {},
): Rashi {
  const { applyExceptions = false } = options
  const lord = SIGN_LORD[bhavaSign]
  const lordSign = grahaSign(grahas, lord)

  // Distance from bhava to lord (1-indexed, forward)
  const dist = ((lordSign - bhavaSign + 12) % 12) + 1

  // Preliminary result
  let result = mod12(lordSign + dist - 1)

  if (applyExceptions) {
    // ── Edge cases (BPHS): Arudha cannot be in 1st or 7th from the bhava ──
    const seventh = mod12(bhavaSign + 6)
    if (result === bhavaSign) {
      // If result is in the bhava itself, take the 10th sign from the bhava
      result = mod12(bhavaSign + 9)
    } else if (result === seventh) {
      // If result is in the 7th from the bhava, take the 10th from THAT status (which is 4th from bhava)
      result = mod12(bhavaSign + 3)
    }
  }

  return result
}

// ── All 12 Bhava Arudhas ──────────────────────────────────────

export interface BhavaArudhas {
  AL:  Rashi   // Arudha Lagna (A1)
  A2:  Rashi
  A3:  Rashi
  A4:  Rashi
  A5:  Rashi
  A6:  Rashi
  A7:  Rashi
  A8:  Rashi
  A9:  Rashi
  A10: Rashi
  A11: Rashi
  A12: Rashi
}

/**
 * Calculate all 12 Bhava Arudhas
 *
 * @param ascRashi   Ascendant sign (Bhava 1 sign in Whole Sign)
 * @param grahas     All graha placements
 */
export function calcAllBhavaArudhas(
  ascRashi: Rashi,
  grahas: Array<{ id: GrahaId; rashi: Rashi }>,
  options: ArudhaOptions = {},
): BhavaArudhas {
  const bhavaSign = (n: number): Rashi => mod12(ascRashi + n - 1)

  return {
    AL:  calcArudha(bhavaSign(1),  grahas, options),
    A2:  calcArudha(bhavaSign(2),  grahas, options),
    A3:  calcArudha(bhavaSign(3),  grahas, options),
    A4:  calcArudha(bhavaSign(4),  grahas, options),
    A5:  calcArudha(bhavaSign(5),  grahas, options),
    A6:  calcArudha(bhavaSign(6),  grahas, options),
    A7:  calcArudha(bhavaSign(7),  grahas, options),
    A8:  calcArudha(bhavaSign(8),  grahas, options),
    A9:  calcArudha(bhavaSign(9),  grahas, options),
    A10: calcArudha(bhavaSign(10), grahas, options),
    A11: calcArudha(bhavaSign(11), grahas, options),
    A12: calcArudha(bhavaSign(12), grahas, options),
  }
}

// ── Graha Arudhas ─────────────────────────────────────────────

/**
 * Arudha of a graha = arudha of the bhava it lords
 * For each planet, find which bhava (house) it rules,
 * then compute that bhava's Arudha
 *
 * Returns primary Graha Arudha for each of the 9 grahas
 */
export function calcGrahaArudhas(
  ascRashi: Rashi,
  grahas: Array<{ id: GrahaId; rashi: Rashi }>,
  options: ArudhaOptions = {},
): Record<GrahaId, Rashi> {
  const result = {} as Record<GrahaId, Rashi>
  const grahaIds: GrahaId[] = ['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra','Ke']

  for (const gid of grahaIds) {
    // Find which bhava(s) this graha lords
    const lordedBhavas: number[] = []
    for (let h = 1; h <= 12; h++) {
      const sign = mod12(ascRashi + h - 1)
      if (SIGN_LORD[sign] === gid) {
        lordedBhavas.push(h)
      }
    }

    if (lordedBhavas.length === 0) {
      // Ra and Ke have no lordship — use their sign position
      const grahaSign_ = grahaSign(grahas, gid)
      result[gid] = calcArudha(grahaSign_, grahas, options)
    } else {
      // Use the primary (stronger) bhava — typically the first owned bhava
      const primaryBhava = lordedBhavas[0]
      const bhavaSign = mod12(ascRashi + primaryBhava - 1)
      result[gid] = calcArudha(bhavaSign, grahas, options)
    }
  }

  return result
}

// ── Upapada (A12) alias ───────────────────────────────────────

/**
 * Upapada Lagna (UL) = Arudha of 12th house
 * Used for spouse, partnership quality
 */
export function calcUpapada(
  ascRashi: Rashi,
  grahas: Array<{ id: GrahaId; rashi: Rashi }>,
  options: ArudhaOptions = {},
): Rashi {
  const twelfthSign = mod12(ascRashi + 11)
  return calcArudha(twelfthSign, grahas, options)
}

/**
 * Darapada (A7) = Arudha of 7th house
 * Used for marriage partner's public image
 */
export function calcDarapada(
  ascRashi: Rashi,
  grahas: Array<{ id: GrahaId; rashi: Rashi }>,
  options: ArudhaOptions = {},
): Rashi {
  const seventhSign = mod12(ascRashi + 6)
  return calcArudha(seventhSign, grahas, options)
}

// ── Full ArudhaData for ChartOutput ──────────────────────────

export interface ArudhaOutput {
  AL:  Rashi; A2: Rashi; A3: Rashi; A4: Rashi;
  A5:  Rashi; A6: Rashi; A7: Rashi; A8: Rashi;
  A9:  Rashi; A10:Rashi; A11:Rashi; A12:Rashi;
  grahaArudhas: Record<GrahaId, Rashi>
  upapada: Rashi
  darapada: Rashi
}

export function calcArudhaOutput(
  ascRashi: Rashi,
  grahas: Array<{ id: GrahaId; rashi: Rashi }>,
  options: ArudhaOptions = {},
): ArudhaOutput {
  const bhava = calcAllBhavaArudhas(ascRashi, grahas, options)
  return {
    ...bhava,
    grahaArudhas: calcGrahaArudhas(ascRashi, grahas, options),
    upapada: bhava.A12,
    darapada: bhava.A7,
  }
}

/** Full ArudhaData bundle for chart output (raw + optional BPHS-corrected). */
export function buildArudhaBundle(
  ascRashi: Rashi,
  grahas: Array<{ id: GrahaId; rashi: Rashi }>,
): { raw: ArudhaData; bphs: ArudhaData } {
  const toData = (options: ArudhaOptions) => {
    const bhava = calcAllBhavaArudhas(ascRashi, grahas, options)
    return {
      ...bhava,
      grahaArudhas: calcGrahaArudhas(ascRashi, grahas, options),
      suryaArudhas: {},
      chandraArudhas: {},
    }
  }
  return { raw: toData({ applyExceptions: false }), bphs: toData({ applyExceptions: true }) }
}

const BHAVA_ARUDHA_KEYS = [
  'AL', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12',
] as const

/** Pick raw or BPHS-corrected arudha set for display (new object each call). */
export function pickArudhaSet(
  raw: ArudhaData,
  bphs: ArudhaData | undefined,
  useBphsExceptions: boolean,
): ArudhaData {
  const src = useBphsExceptions && bphs ? bphs : raw
  return {
    AL: src.AL, A2: src.A2, A3: src.A3, A4: src.A4,
    A5: src.A5, A6: src.A6, A7: src.A7, A8: src.A8,
    A9: src.A9, A10: src.A10, A11: src.A11, A12: src.A12,
    grahaArudhas: { ...src.grahaArudhas },
    suryaArudhas: { ...src.suryaArudhas },
    chandraArudhas: { ...src.chandraArudhas },
  }
}

/** Count bhava arudhas that differ between raw and BPHS sets. */
export function countArudhaDifferences(raw: ArudhaData, bphs: ArudhaData): number {
  return BHAVA_ARUDHA_KEYS.filter((k) => raw[k] !== bphs[k]).length
}

/** Map rashi → arudha labels for chart overlay. */
export function buildArudhaLabelMap(
  arudhas: ArudhaData,
  show = true,
): Record<number, string[]> {
  const map: Record<number, string[]> = {}
  if (!show) return map
  for (const key of BHAVA_ARUDHA_KEYS) {
    const r = arudhas[key]
    if (typeof r !== 'number') continue
    if (!map[r]) map[r] = []
    map[r].push(key === 'A12' ? 'UL' : key)
  }
  return map
}
