// ─────────────────────────────────────────────────────────────
//  src/lib/engine/sripatiBhava.ts
//  Pure Sripati Bhava Madhya / Sandhi — no sweph (safe for client)
// ─────────────────────────────────────────────────────────────

export interface SripatiBhavaResult {
  /** 1st house madhya = Ascendant */
  lagnaMadhya: number
  /** 10th house madhya = Midheaven (Dasham Madhya) */
  dashamMadhya: number
  /** 7th house madhya = Descendant */
  saptamaMadhya: number
  /** 4th house madhya = IC */
  chaturthaMadhya: number
  /** Midpoint of each house (index 0 = H1 … 11 = H12) */
  madhyas: number[]
  /** Junction after each house (index i = end of house i+1 / start of i+2) */
  sandhis: number[]
}

function norm360(lon: number): number {
  return ((lon % 360) + 360) % 360
}

function arcMid(a: number, b: number): number {
  const aN = norm360(a)
  const bN = norm360(b)
  return (aN + ((bN - aN + 360) % 360) / 2) % 360
}

/**
 * Sripati / Bhava Chalita madhyas + sandhis from Asc & MC.
 *
 * Anchors: Lagna Madhya = Asc, Dasham Madhya = MC, 7th/4th = +180°.
 * Intermediate madhyas trisect each quadrant (equivalent to classroom
 * “difference ÷ 6” successive steps that alternate sandhi / madhya).
 * Sandhis are midpoints between consecutive madhyas.
 */
export function calcSripatiBhava(asc: number, mc: number): SripatiBhavaResult {
  const lagnaMadhya = norm360(asc)
  const dashamMadhya = norm360(mc)
  const saptamaMadhya = (lagnaMadhya + 180) % 360
  const chaturthaMadhya = (dashamMadhya + 180) % 360

  const madhyas: number[] = new Array(12)
  madhyas[0] = lagnaMadhya
  madhyas[3] = chaturthaMadhya
  madhyas[6] = saptamaMadhya
  madhyas[9] = dashamMadhya

  const q1 = (chaturthaMadhya - lagnaMadhya + 360) % 360
  madhyas[1] = (lagnaMadhya + q1 / 3) % 360
  madhyas[2] = (lagnaMadhya + (2 * q1) / 3) % 360

  const q2 = (saptamaMadhya - chaturthaMadhya + 360) % 360
  madhyas[4] = (chaturthaMadhya + q2 / 3) % 360
  madhyas[5] = (chaturthaMadhya + (2 * q2) / 3) % 360

  const q3 = (dashamMadhya - saptamaMadhya + 360) % 360
  madhyas[7] = (saptamaMadhya + q3 / 3) % 360
  madhyas[8] = (saptamaMadhya + (2 * q3) / 3) % 360

  const q4 = (lagnaMadhya - dashamMadhya + 360) % 360
  madhyas[10] = (dashamMadhya + q4 / 3) % 360
  madhyas[11] = (dashamMadhya + (2 * q4) / 3) % 360

  const sandhis: number[] = []
  for (let i = 0; i < 12; i++) {
    sandhis.push(arcMid(madhyas[i], madhyas[(i + 1) % 12]))
  }

  return {
    lagnaMadhya,
    dashamMadhya,
    saptamaMadhya,
    chaturthaMadhya,
    madhyas,
    sandhis,
  }
}

/**
 * House (1–12) for a longitude using Sripati sandhis.
 * House N spans [sandhis[N-2], sandhis[N-1]) with wrap (N=1 uses sandhis[11]).
 */
export function planetInSripatiHouse(lon: number, sandhis: number[]): number {
  const x = norm360(lon)
  for (let i = 0; i < 12; i++) {
    const sStart = sandhis[(i + 11) % 12]
    const sEnd = sandhis[i]
    if (sEnd > sStart) {
      if (x >= sStart && x < sEnd) return i + 1
    } else if (x >= sStart || x < sEnd) {
      return i + 1
    }
  }
  return 1
}
