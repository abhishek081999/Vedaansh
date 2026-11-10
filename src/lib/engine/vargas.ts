// ─────────────────────────────────────────────────────────────
//  src/lib/engine/vargas.ts
//  Divisional chart (Varga) calculations — all 41 schemes
//  Every function is pure: (siderealLongitude) → rashiSign (1–12)
//
//  Plan §5.3 — D1 through D150 + variants
// ─────────────────────────────────────────────────────────────

// ── Core Helpers ──────────────────────────────────────────────

/** Normalise any longitude to 0–360 */
const norm = (lon: number) => ((lon % 360) + 360) % 360

/** Sign 1–12 from longitude */
export const signOf = (lon: number): number => {
  const normalized = norm(lon)
  if (isNaN(normalized)) return 1
  return Math.min(12, Math.max(1, Math.floor(normalized / 30) + 1))
}

/** Degree within sign (0–30) */
export const degInSign = (lon: number): number =>
  norm(lon) % 30

/** Cycle sign: mod12, always 1–12 */
export const mod12 = (n: number): number => {
  if (isNaN(n)) return 1
  return ((((Math.floor(n) - 1) % 12) + 12) % 12) + 1
}

/** Is sign odd (1,3,5,7,9,11)? */
const isOdd = (sign: number): boolean => sign % 2 === 1

/** Divide a sign into N equal parts; return which part (0-based) */
const part = (lon: number, n: number): number =>
  Math.floor(degInSign(lon) / (30 / n))

// ── Tier 1 — Core Vargas (Kala: D1, D9, D60) ─────────────────

/** D1 — Rashi (direct) */
export const D1 = (lon: number): number => signOf(lon)

/** D9 — Navamsha (most important divisional chart)
 *  Each sign is split into 9 padas of 3°20'
 *  Group start: Aries/Leo/Sag → Ar; Tau/Vir/Cp → Cp; Gem/Lib/Aq → Li; Can/Sc/Pi → Cn
 */
export const D9 = (lon: number): number => {
  const sign = signOf(lon)
  const pada = part(lon, 9)  // 0–8
  // Navamsha group starts: Fire→Aries(1), Earth→Capricorn(10), Air→Libra(7), Water→Cancer(4)
  const groupStarts = [1, 10, 7, 4]
  // Each sign maps to its element group (0=Fire, 1=Earth, 2=Air, 3=Water)
  // Ar=Fire, Ta=Earth, Ge=Air, Cn=Water, Le=Fire, Vi=Earth, Li=Air, Sc=Water, Sg=Fire, Cp=Earth, Aq=Air, Pi=Water
  const groupMap = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3]  // sign-1 → group index
  const groupStart = groupStarts[groupMap[sign - 1]]
  return mod12(groupStart + pada)
}

/** D60 — Shashtiamsha (past karma, most sensitive — changes every 2 minutes)
 *  Parashara rule: Count forward as many parts as the Shashtiamsha index (N)
 *  starting from the occupied natal sign (tadraaseh).
 */
export const D60 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 60)  // 0–59
  return mod12(sign + p)
}

// ── Tier 2 — Vela Vargas (D1–D60 standard set) ───────────────

/** D2 — Hora (Parashara: Sun's hora=Leo=5, Moon's hora=Cancer=4) */
export const D2 = (lon: number): number => {
  const sign = signOf(lon)
  const deg  = degInSign(lon)
  return deg < 15 ? (isOdd(sign) ? 5 : 4) : (isOdd(sign) ? 4 : 5)
}

/** D3 — Drekkana (Parashara: each sign divided into 3 parts of 10°) */
export const D3 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 3)  // 0, 1, 2
  // Trikona lords: same sign, 5th, 9th
  return mod12(sign + p * 4)
}

/** D4 — Chaturthamsha (Turyamsha: health, property)
 *  Rule: The four parts start from the same sign, its 4th, 7th, and 10th.
 */
export const D4 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 4)  // 0–3
  return mod12(sign + p * 3)
}

/** D5 — Panchamsha (fame, authority)
 *  PVR / Saravali lords: odd → Ar,Aq,Sg,Ge,Li; even → Ta,Vi,Pi,Cp,Sc.
 */
export const D5 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 5)  // 0–4
  const odd = [1, 11, 9, 3, 7] as const
  const even = [2, 6, 12, 10, 8] as const
  return (isOdd(sign) ? odd : even)[p]
}

/** D6 — Shashthamsha (health, enemies, debts)
 *  6 parts of 5°. Odd from Aries; even from Libra (PVR).
 */
export const D6 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 6)  // 0–5
  return isOdd(sign) ? mod12(1 + p) : mod12(7 + p)
}

/** D7 — Saptamsha (children and grandchildren) */
export const D7 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 7)  // 0–6
  return isOdd(sign) ? mod12(sign + p) : mod12(sign + p + 6)
}

/** D8 — Ashtamsha (longevity, unexpected events)
 *  8 parts of 3°45'. Movable→Aries, Fixed→Sagittarius, Dual→Leo (PVR).
 */
export const D8 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 8)  // 0–7
  const base = [1, 9, 5][(sign - 1) % 3]
  return mod12(base + p)
}

/** D10 — Dashamsha (career, status, profession) */
export const D10 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 10)  // 0–9
  return isOdd(sign) ? mod12(sign + p) : mod12(sign + p + 8)
}

/** D12 — Dwadashamsha (parents) */
export const D12 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 12)  // 0–11
  return mod12(sign + p)  // starts from own sign, adds parts
}

/** D16 — Shodashamsha (vehicles, comforts, happiness)
 *  Movable (1,4,7,10) → starts from Aries (1)
 *  Fixed (2,5,8,11)   → starts from Leo (5)
 *  Dual (3,6,9,12)    → starts from Sagittarius (9)
 */
export const D16 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 16)  // 0–15
  const base = [1, 5, 9][(sign - 1) % 3]
  return mod12(base + p)
}

/** D20 — Vimshamsha (spiritual progress, upasana)
 *  Parashara: Movable→Aries, Fixed→Sagittarius, Dual→Leo.
 */
export const D20 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 20)  // 0–19
  const base = [1, 9, 5][(sign - 1) % 3]
  return mod12(base + p)
}

/** D24 — Chaturvimshamsha (Siddhamsha: education, learning)
 *  Parashara: odd signs from Leo; even signs from Cancer (forward).
 */
export const D24 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 24)  // 0–23
  return isOdd(sign) ? mod12(5 + p) : mod12(4 + p)
}

/** D27 — Bhamsha / Nakshatramsha (strength, vitality)
 *  Parashara: Fire→Ar(1), Earth→Cn(4), Air→Li(7), Water→Cp(10).
 */
export const D27 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 27)  // 0–26
  const base = [1, 4, 7, 10][(sign - 1) % 4]
  return mod12(base + p)
}

interface D30Arc {
  from: number
  to: number
  rashi: number
}

const D30_ODD_ARCS: readonly D30Arc[] = [
  { from: 0,  to: 5,  rashi: 1 },   // Aries (Mars, 5°)
  { from: 5,  to: 10, rashi: 11 },  // Aquarius (Saturn, 5°)
  { from: 10, to: 18, rashi: 9 },   // Sagittarius (Jupiter, 8°)
  { from: 18, to: 25, rashi: 3 },   // Gemini (Mercury, 7°)
  { from: 25, to: 30, rashi: 7 },   // Libra (Venus, 5°)
]

const D30_EVEN_ARCS: readonly D30Arc[] = [
  { from: 0,  to: 5,  rashi: 2 },   // Taurus (Venus, 5°)
  { from: 5,  to: 12, rashi: 6 },   // Virgo (Mercury, 7°)
  { from: 12, to: 20, rashi: 12 },  // Pisces (Jupiter, 8°)
  { from: 20, to: 25, rashi: 10 },  // Capricorn (Saturn, 5°)
  { from: 25, to: 30, rashi: 8 },   // Scorpio (Mars, 5°)
]

function getD30Arc(lon: number): { arc: D30Arc; deg: number } {
  const deg = degInSign(lon)
  const sign = signOf(lon)
  const table = isOdd(sign) ? D30_ODD_ARCS : D30_EVEN_ARCS
  const clamped = Math.max(0, Math.min(29.999999, deg))
  const arc = table.find(a => clamped >= a.from && clamped < a.to) ?? table[table.length - 1]
  return { arc, deg: clamped }
}

/** D30 — Trimshamsha (Parashara: evils and misfortunes) */
export const D30 = (lon: number): number => {
  return getD30Arc(lon).arc.rashi
}

/** D40 — Khavedamsha (Parashara: auspicious/inauspicious effects) */
export const D40 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 40)  // 0–39
  return isOdd(sign) ? mod12(1 + p) : mod12(7 + p)
}

/** D45 — Akshavedamsha (all matters, general well-being) */
export const D45 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 45)  // 0–44
  if (sign % 3 === 1) return mod12(1 + p)   // Fire → Aries
  if (sign % 3 === 2) return mod12(5 + p)   // Earth → Leo
  return mod12(9 + p)                        // Air/Water → Sagittarius
}

// ── Tier 3 — Hora Vargas (41 total) ──────────────────────────

/** D2 — Parivritti Dvaya (bicyclical): consecutive halves cycle the zodiac twice. */
export const D2_Parivritti = (lon: number): number =>
  (Math.floor(norm(lon) / 15) % 12) + 1

/** Day-strong / night-strong sign of the occupied sign's lord (Kasinath / SJC). */
const DAY_OWN: Record<number, number> = {
  1: 8, 2: 7, 3: 6, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 12, 10: 11, 11: 11, 12: 12,
}
const NIGHT_OWN: Record<number, number> = {
  1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 3, 7: 2, 8: 1, 9: 9, 10: 10, 11: 10, 12: 9,
}

/** D2 — Kasinath: Sun-hora → day-strong of sign lord; Moon-hora → night-strong. */
export const D2_Kasinath = (lon: number): number => {
  const sign = signOf(lon)
  const deg = degInSign(lon)
  const sunHora = isOdd(sign) ? deg < 15 : deg >= 15
  return sunHora ? DAY_OWN[sign] : NIGHT_OWN[sign]
}

/** D2 — Samasaptama (1st / 7th halves by odd/even). */
export const D2_Samasaptama = (lon: number): number => {
  const sign = signOf(lon)
  const deg = degInSign(lon)
  if (isOdd(sign)) return deg < 15 ? sign : mod12(sign + 6)
  return deg < 15 ? mod12(sign + 6) : sign
}

/** D2 — Somanath (simplified Moon/Sun hora as Cancer/Leo only). */
export const D2_Somanath = (lon: number): number => {
  const deg = degInSign(lon)
  return deg < 15 ? 4 : 5
}

/** D2 — Raman Suprajarama hora table (day/night × 11th-lord hybrid). */
const RAMAN_HORA: Record<number, [number, number]> = {
  1: [8, 10], 2: [2, 12], 3: [6, 1], 4: [4, 7],
  5: [5, 3], 6: [3, 4], 7: [7, 5], 8: [1, 6],
  9: [12, 2], 10: [10, 8], 11: [11, 9], 12: [9, 11],
}
export const D2_Raman = (lon: number): number => {
  const sign = signOf(lon)
  const half = degInSign(lon) < 15 ? 0 : 1
  return RAMAN_HORA[sign][half]
}

/** D3 — Jagannath Drekkana (trines; first always movable). */
export const D3_Jagannath = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 3)
  const kind = (sign - 1) % 3 // 0 movable, 1 fixed, 2 dual
  if (kind === 0) return mod12(sign + p * 4)           // 1st, 5th, 9th
  if (kind === 1) return [mod12(sign + 8), sign, mod12(sign + 4)][p] // 9th, 1st, 5th
  return [mod12(sign + 4), mod12(sign + 8), sign][p]  // 5th, 9th, 1st
}

/** D3 — Somanath Drekkana (odd forward / even reverse hybrid cycle). */
const SOMANATH_D3: Record<number, [number, number, number]> = {
  1: [1, 2, 3], 2: [9, 8, 7], 3: [4, 5, 6], 4: [12, 11, 10],
  5: [7, 8, 9], 6: [3, 2, 1], 7: [10, 11, 12], 8: [6, 5, 4],
  9: [1, 2, 3], 10: [9, 8, 7], 11: [4, 5, 6], 12: [12, 11, 10],
}
export const D3_Somanath = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 3)
  return SOMANATH_D3[sign][p]
}

/** D3 — Nadi Drekkana (elemental trine cycle). */
export const D3_Nadi = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 3)
  const nadiMap: Record<number, number[]> = {
    1: [1, 5, 9], 2: [5, 9, 1], 3: [9, 1, 5], 4: [4, 8, 12],
    5: [8, 12, 4], 6: [12, 4, 8], 7: [7, 11, 3], 8: [11, 3, 7],
    9: [3, 7, 11], 10: [10, 2, 6], 11: [2, 6, 10], 12: [6, 10, 2],
  }
  return nadiMap[sign]?.[p] ?? sign
}

/** D4 — Parivritti Chaturthamsha (continuous 7°30′ cycle from Aries). */
export const D4_Parivritti = (lon: number): number =>
  (Math.floor(norm(lon) / 7.5) % 12) + 1

/** D9 — Pada Navamsha: 108 equal padas from 0° Aries (= Parashara D9). */
export const D9_Pada = (lon: number): number =>
  (Math.floor(norm(lon) / (360 / 108)) % 12) + 1

/**
 * Uniform Krishna Mishra / Somanatha Navamsha:
 * Fire→Ar fwd, Earth→Vi rev, Air→Li fwd, Water→Pi rev.
 */
function krishnaMishraNavamsha(lon: number): number {
  const sign = signOf(lon)
  const p = part(lon, 9)
  const element = (sign - 1) % 4 // 0 fire, 1 earth, 2 air, 3 water
  if (element === 0) return mod12(1 + p)       // Ar forward
  if (element === 1) return mod12(6 - p)       // Vi reverse
  if (element === 2) return mod12(7 + p)       // Li forward
  return mod12(12 - p)                        // Pi reverse
}

/** D9 — Nadi Navamsha (Uniform Krishna Mishra). */
export const D9_Nadi = (lon: number): number => krishnaMishraNavamsha(lon)

/** D9 — Somanatha Navamsha (same Uniform Krishna Mishra / Kalpalata table). */
export const D9_Somanatha = (lon: number): number => krishnaMishraNavamsha(lon)

/** D12 — Ganaamsha (groups of 12) */
export const D12_Ganaamsha = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 12)
  return mod12(sign + p)
}

/** D24 — Paravidya / Vedavahvamsha (para-vidya variation)
 *  Odd signs: Leo forward (same as D24). Even signs: Cancer reverse.
 */
export const D24_Paravidya = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 24)
  if (isOdd(sign)) return mod12(5 + p)
  return mod12(4 - p)
}

/** D30 — Venkatesa Trimshamsha (alternate scheme) */
export const D30_Venkatesa = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 30)
  return isOdd(sign) ? mod12(p + 1) : mod12(p + 7)
}

/** D60 — Nadi Shashtiamsha */
export const D60_Nadi = (lon: number): number => {
  const p = part(lon, 60)
  return mod12(p + 1)
}

/** D81 — Navanavamsha (Navamsha of Navamsha) */
export const D81 = (lon: number): number => {
  const arc = 30 / 9
  const frac = (degInSign(lon) % arc) / arc // 0–1 within the natal navamsha pada
  const d9Lon = (D9(lon) - 1) * 30 + frac * 30
  return D9(d9Lon)
}

/** D81 — Nadi variant */
export const D81_Nadi = (lon: number): number => {
  const p = part(lon, 81)
  return mod12(p % 12 + 1)
}

/** D108 — Ashtottaramsha (108 = 9×12) — Guru (Jupiter) variant */
export const D108_Guru = (lon: number): number => {
  const p = part(lon, 108)
  return mod12(p % 12 + 1)
}

/** D108 — Shukra (Venus) variant */
export const D108_Shukra = (lon: number): number => {
  const p = part(lon, 108)
  return mod12(p % 12 + 7)  // starts from Libra
}

/** D144 — Dwadashdwadashamsha (D12 applied twice, retaining intermediate degree). */
export const D144 = (lon: number): number => {
  const arc = 30 / 12
  const frac = (degInSign(lon) % arc) / arc
  const d12Lon = (D12(lon) - 1) * 30 + frac * 30
  return D12(d12Lon)
}

/** D150 — Nadi Panchadeshamsha */
export const D150 = (lon: number): number => {
  const p = part(lon, 150)
  return mod12(p % 12 + 1)
}

// ── Registry ───────────────────────────────────────────────────

export type VargaName =
  | 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7' | 'D8' | 'D9' | 'D10' | 'D12'
  | 'D16' | 'D20' | 'D24' | 'D27' | 'D30' | 'D40' | 'D45' | 'D60'
  | 'D2_Parivritti' | 'D2_Kasinath' | 'D2_Samasaptama'
  | 'D2_Somanath' | 'D2_Raman'
  | 'D3_Jagannath' | 'D3_Somanath' | 'D3_Nadi'
  | 'D4_Parivritti'
  | 'D9_Pada' | 'D9_Nadi' | 'D9_Somanatha'
  | 'D12_Ganaamsha' | 'D24_Paravidya' | 'D30_Venkatesa'
  | 'D60_Nadi' | 'D81' | 'D81_Nadi'
  | 'D108_Guru' | 'D108_Shukra' | 'D144' | 'D150'
  | 'Chalit'

export const VARGA_FUNCTIONS: Record<VargaName, (lon: number) => number> = {
  D1, D2, D3, D4, D5, D6, D7, D8, D9, D10, D12,
  D16, D20, D24, D27, D30, D40, D45, D60,
  D2_Parivritti, D2_Kasinath, D2_Samasaptama, D2_Somanath, D2_Raman,
  D3_Jagannath, D3_Somanath, D3_Nadi,
  D4_Parivritti,
  D9_Pada, D9_Nadi, D9_Somanatha,
  D12_Ganaamsha, D24_Paravidya, D30_Venkatesa,
  D60_Nadi, D81, D81_Nadi,
  D108_Guru, D108_Shukra, D144, D150,
  Chalit: D1,
}

// Standard Parashara Shodashavarga (16 divisional charts)
export const SHODASHA_VARGAS: VargaName[] = [
  'D1', 'D2', 'D3', 'D4', 'D7', 'D9', 'D10', 'D12',
  'D16', 'D20', 'D24', 'D27', 'D30', 'D40', 'D45', 'D60'
]

/** Extra divisions + classical variants beyond Shodashavarga (25) → 16+25 = 41 */
export const EXTENDED_VARGAS: VargaName[] = [
  'D5', 'D6', 'D8',
  'D2_Parivritti', 'D2_Kasinath', 'D2_Samasaptama', 'D2_Somanath', 'D2_Raman',
  'D3_Jagannath', 'D3_Somanath', 'D3_Nadi',
  'D4_Parivritti',
  'D9_Pada', 'D9_Nadi', 'D9_Somanatha',
  'D12_Ganaamsha', 'D24_Paravidya', 'D30_Venkatesa',
  'D60_Nadi', 'D81', 'D81_Nadi',
  'D108_Guru', 'D108_Shukra', 'D144', 'D150',
]

// Full Platinum suite — exactly 41 divisional schemes (Chalit is a house chart, not counted)
export const PLATINUM_VARGAS: VargaName[] = [...SHODASHA_VARGAS, ...EXTENDED_VARGAS]

// All registry keys including Chalit (for getVargaPosition / tests)
export const ADVANCED_VARGAS: VargaName[] = Object.keys(VARGA_FUNCTIONS) as VargaName[]

// Default set for free/gold calculation responses
export const FREE_VARGAS: VargaName[] = SHODASHA_VARGAS
export const GOLD_VARGAS = SHODASHA_VARGAS

// Engine / tests: full 41 schemes (no Chalit)
export const ALL_VARGAS: VargaName[] = PLATINUM_VARGAS

/** Vargas included in free/gold API responses (+ Chalit added by calculator) */
export const FREE_RESPONSE_VARGAS: ReadonlySet<string> = new Set<string>([
  ...SHODASHA_VARGAS,
  'Chalit',
])

/** Strip Platinum-only vargas from a chart payload for free/gold plans. */
export function filterChartVargasForPlan<T extends {
  vargas?: Record<string, unknown>
  vargaLagnas?: Record<string, unknown>
}>(chart: T, plan: 'free' | 'gold' | 'platinum'): T {
  if (plan === 'platinum' || !chart?.vargas) return chart

  const vargas: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(chart.vargas)) {
    if (FREE_RESPONSE_VARGAS.has(key)) vargas[key] = value
  }

  const vargaLagnas: Record<string, unknown> = {}
  if (chart.vargaLagnas) {
    for (const [key, value] of Object.entries(chart.vargaLagnas)) {
      if (FREE_RESPONSE_VARGAS.has(key)) vargaLagnas[key] = value
    }
  }

  return { ...chart, vargas, vargaLagnas }
}

/**
 * Calculate all requested varga signs for a planet
 * @param siderealLon  Planet sidereal longitude
 * @param vargas       List of varga names to calculate
 */
export function calcVargas(
  siderealLon: number,
  vargas: VargaName[] = FREE_VARGAS,
): Record<VargaName, number> {
  const result = {} as Record<VargaName, number>
  for (const name of vargas) {
    result[name] = VARGA_FUNCTIONS[name](siderealLon)
  }
  return result
}

/**
 * Detailed varga position including relative degree (0-30)
 */
export interface VargaPosition {
  rashi: number
  degree: number
  totalDegree: number
}

/**
 * Calculate the exact position of a planet in a divisional chart.
 * For equal-division vargas, it scales the fractional part to 0-30.
 */
export function getVargaPosition(lon: number, vname: VargaName): VargaPosition {
  const rashi = VARGA_FUNCTIONS[vname](lon)
  
  // Extract division number N from vname (e.g., D9 -> 9)
  // Handle special names like D2_Parivritti
  const match = vname.match(/^D(\d+)/)
  const n = match ? parseInt(match[1], 10) : 1
  
  let degree = 0
  if (n === 1) {
    degree = degInSign(lon)
  } else if (vname === 'D30') {
    // Parashara Trimshamsha has unequal arcs: scale proportionally within the arc to 0-30°
    const { arc, deg } = getD30Arc(lon)
    degree = ((deg - arc.from) / (arc.to - arc.from)) * 30
  } else {
    // Equal divisions: (NatalLon % (30/N)) * N
    const arcSize = 30 / n
    degree = (degInSign(lon) % arcSize) * n
  }
  
  return {
    rashi,
    degree,
    totalDegree: (rashi - 1) * 30 + degree
  }
}

/**
 * Human-readable varga metadata (UI + gating)
 */
import type { EngineLang } from './lang'
import { VARGA_HI } from './locale/vargas.hi'

export const VARGA_META: Record<string, { full: string; topic: string; tier: 'free' | 'gold' | 'platinum' }> = {
  D1:  { full: 'Rashi',               topic: 'Lagna chart — personality, body, overall life',        tier: 'free' },
  Chalit: { full: 'Bhava Chalit',     topic: 'House positions — actual house placements (Sripati)', tier: 'free' },
  D2:  { full: 'Hora',                topic: 'Wealth & assets — income, Sun/Moon Hora',              tier: 'free' },
  D3:  { full: 'Drekkana',            topic: 'Subconscious mind — effort, thought focus, siblings',  tier: 'free' },
  D4:  { full: 'Chaturthamsha',       topic: 'Home & property — dwelling, ancestral property',       tier: 'free' },
  D5:  { full: 'Panchamsha',          topic: 'Fame & authority — recognition, status',               tier: 'platinum' },
  D6:  { full: 'Shashthamsha',        topic: 'Health & enemies — debts, disputes, service',          tier: 'platinum' },
  D7:  { full: 'Saptamsha',           topic: 'Children — progeny, offspring, influence',             tier: 'free' },
  D8:  { full: 'Ashtamsha',           topic: 'Longevity — unexpected events, crises',                tier: 'platinum' },
  D9:  { full: 'Navamsha',            topic: 'Marriage, Destiny — Marriage, Destiny & Inner self',   tier: 'free' },
  D10: { full: 'Dasamsha',            topic: 'Career — profession, achievements, reputation',        tier: 'free' },
  D12: { full: 'Dwadasamsha',         topic: 'Parents, past residue — isolation, dreams, unfinished thirst', tier: 'free' },
  D16: { full: 'Shodasamsha',         topic: 'Vehicles & comforts — transport, luxuries',            tier: 'free' },
  D20: { full: 'Vimsamsha',           topic: 'Spirituality — religious actions, devotion',           tier: 'free' },
  D24: { full: 'Chaturvimsamsha',     topic: 'Education — learning, academic achievements',          tier: 'free' },
  D27: { full: 'Saptvimsamsha',       topic: 'Bandwidth & deep desire — vitality, voiced concerns',  tier: 'free' },
  D30: { full: 'Trimsamsha',          topic: 'Obstacles — negative influences, karmic challenges',   tier: 'free' },
  D40: { full: 'Khavedamsha',         topic: 'Life events and mother — auspicious or inauspicious',  tier: 'free' },
  D45: { full: 'Akshavedamsha',       topic: 'All life matters and father — comprehensive',          tier: 'free' },
  D60: { full: 'Shastyamsha',         topic: 'Past-life karma — karmic influences, soul evolution',  tier: 'free' },
  D2_Parivritti:  { full: 'Hora (Parivritti)',     topic: 'Wealth — Parivritti Dvaya Hora scheme',           tier: 'platinum' },
  D2_Kasinath:    { full: 'Hora (Kasinath)',       topic: 'Wealth — Kasinath Hora scheme',                   tier: 'platinum' },
  D2_Samasaptama: { full: 'Hora (Samasaptama)',    topic: 'Wealth — Samasaptama Hora scheme',                tier: 'platinum' },
  D2_Somanath:    { full: 'Hora (Somanath)',       topic: 'Wealth — Somanath Moon-based Hora',               tier: 'platinum' },
  D2_Raman:       { full: 'Hora (Raman)',          topic: 'Wealth — Raman Hora scheme',                      tier: 'platinum' },
  D3_Jagannath:   { full: 'Drekkana (Jagannath)',  topic: 'Siblings — Jagannath Drekkana',                   tier: 'platinum' },
  D3_Somanath:    { full: 'Drekkana (Somanath)',   topic: 'Siblings — Somanath Drekkana',                    tier: 'platinum' },
  D3_Nadi:        { full: 'Drekkana (Nadi)',       topic: 'Siblings — Nadi Drekkana',                        tier: 'platinum' },
  D4_Parivritti:  { full: 'Chaturthamsha (Parivritti)', topic: 'Property — Parivritti Chaturthamsha',        tier: 'platinum' },
  D9_Pada:        { full: 'Navamsha (Pada)',       topic: 'Destiny — nakshatra-pada Navamsha',               tier: 'platinum' },
  D9_Nadi:        { full: 'Navamsha (Nadi)',       topic: 'Destiny — Nadi Navamsha',                         tier: 'platinum' },
  D9_Somanatha:   { full: 'Navamsha (Somanatha)',  topic: 'Destiny — Somanatha Navamsha',                    tier: 'platinum' },
  D12_Ganaamsha:  { full: 'Dwadasamsha (Gana)',    topic: 'Parents — Ganaamsha variant',                     tier: 'platinum' },
  D24_Paravidya:  { full: 'Siddhamsha (Paravidya)', topic: 'Education — Paravidya higher-learning variant',  tier: 'platinum' },
  D30_Venkatesa:  { full: 'Trimsamsha (Venkatesa)', topic: 'Obstacles — Venkatesa Trimshamsha',              tier: 'platinum' },
  D60_Nadi:       { full: 'Shastyamsha (Nadi)',    topic: 'Karma — Nadi Shashtiamsha',                       tier: 'platinum' },
  D81:            { full: 'Navanavamsha',          topic: 'Detailed karmic analysis — Navamsha of Navamsha', tier: 'platinum' },
  D81_Nadi:       { full: 'Navanavamsha (Nadi)',   topic: 'Detailed karma — Nadi D81',                       tier: 'platinum' },
  D108_Guru:      { full: 'Ashtottaramsha (Guru)', topic: 'Fine division — Jupiter-based D108',              tier: 'platinum' },
  D108_Shukra:    { full: 'Ashtottaramsha (Shukra)', topic: 'Fine division — Venus-based D108',              tier: 'platinum' },
  D144:           { full: 'Dwadashdwadashamsha',   topic: 'Fine division — D12 of D12',                      tier: 'platinum' },
  D150:           { full: 'Nadiamsha',             topic: 'Nadi timing — Panchadeshamsha',                   tier: 'platinum' },
}

/** Ordered list for chart switchers — Chalit + full 41 suite */
export const VARGA_UI_LIST: Array<{ name: string; full: string; topic: string; tier: 'free' | 'gold' | 'platinum' }> = [
  { name: 'D1', ...VARGA_META.D1 },
  { name: 'Chalit', ...VARGA_META.Chalit },
  ...PLATINUM_VARGAS.filter((n) => n !== 'D1').map((name) => ({
    name,
    full: VARGA_META[name]?.full ?? name,
    topic: VARGA_META[name]?.topic ?? '',
    tier: VARGA_META[name]?.tier ?? 'platinum',
  })),
]

/** VARGA_UI_LIST with Hindi names and topics when lang is 'hi'. Names (D9…) and tiers never change. */
export function vargaUiList(lang: EngineLang = 'en'): typeof VARGA_UI_LIST {
  if (lang !== 'hi') return VARGA_UI_LIST
  return VARGA_UI_LIST.map(v => ({ ...v, ...(VARGA_HI[v.name] ?? {}) }))
}

/** One varga's display name and topic in the given language. */
export function vargaText(name: string, lang: EngineLang = 'en'): { full: string; topic: string } | null {
  const base = VARGA_META[name]
  if (!base) return null
  const hi = lang === 'hi' ? VARGA_HI[name] : undefined
  return { full: hi?.full ?? base.full, topic: hi?.topic ?? base.topic }
}
