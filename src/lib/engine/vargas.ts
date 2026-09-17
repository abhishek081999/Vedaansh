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
 *  5 parts of 6°. Odd signs from Aries; even signs from Libra.
 */
export const D5 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 5)  // 0–4
  return isOdd(sign) ? mod12(1 + p) : mod12(7 + p)
}

/** D6 — Shashthamsha (health, enemies, debts)
 *  6 parts of 5°. Odd from own sign; even from 7th.
 */
export const D6 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 6)  // 0–5
  return isOdd(sign) ? mod12(sign + p) : mod12(sign + 6 + p)
}

/** D7 — Saptamsha (children and grandchildren) */
export const D7 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 7)  // 0–6
  return isOdd(sign) ? mod12(sign + p) : mod12(sign + p + 6)
}

/** D8 — Ashtamsha (longevity, unexpected events)
 *  8 parts of 3°45'. Movable→Aries, Fixed→Leo, Dual→Sagittarius.
 */
export const D8 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 8)  // 0–7
  const base = [1, 5, 9][(sign - 1) % 3]
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

/** D20 — Vimshamsha (spiritual progress, upasana) */
export const D20 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 20)  // 0–19
  if (isOdd(sign)) return mod12(1 + p)   // Odd → from Aries
  return mod12(9 + p)                    // Even → from Sagittarius
}

/** D24 — Chaturvimshamsha (Siddhamsha: education, learning) */
export const D24 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 24)  // 0–23
  return isOdd(sign) ? mod12(4 + p) : mod12(1 + p)
}

/** D27 — Bhamsha / Nakshatramsha (strength, vitality) */
export const D27 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 27)  // 0–26
  // Fire→Ar(1), Earth→Cn(4), Air→Li(7), Water→Cp(10)
  const base = [1, 10, 7, 4][(sign - 1) % 4]
  return mod12(base + p)
}

/** D30 — Trimshamsha (Parashara: evils and misfortunes) */
export const D30 = (lon: number): number => {
  const deg = degInSign(lon)
  const sign = signOf(lon)

  if (isOdd(sign)) {
    // Odd: Ma 0-5°, Sa 5-12°, Ju 12-20°, Me 20-25°, Ve 25-30°
    // → Ar(1), Aq(11), Sg(9), Vi(6), Ta(2)
    if (deg < 5)  return 1   // Aries (Ma)
    if (deg < 12) return 11  // Aquarius (Sa)
    if (deg < 20) return 9   // Sagittarius (Ju)
    if (deg < 25) return 6   // Virgo (Me)
    return 2                  // Taurus (Ve)
  } else {
    // Even: Ve 0-5°, Me 5-12°, Ju 12-20°, Sa 20-25°, Ma 25-30°
    // → Li(7), Vi(6), Pi(12), Cp(10), Sc(8)
    if (deg < 5)  return 7   // Libra (Ve)
    if (deg < 12) return 6   // Virgo (Me) — Gemini alternate
    if (deg < 20) return 12  // Pisces (Ju)
    if (deg < 25) return 10  // Capricorn (Sa)
    return 8                  // Scorpio (Ma)
  }
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

/** D2 — Parivritti Dvaya (reverse alternating) */
export const D2_Parivritti = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 2)
  return isOdd(sign) ? (p === 0 ? sign : mod12(sign + 6)) : (p === 0 ? mod12(sign + 6) : sign)
}

/** D2 — Kasinath scheme (Su in Leo hora, Mo in Cancer hora always) */
export const D2_Kasinath = (lon: number): number => {
  const sign = signOf(lon)
  const deg  = degInSign(lon)
  // First hora = sign's own half, second = opposite half
  return deg < 15 ? sign : mod12(sign + 6)
}

/** D2 — Samasaptama (alternate forward/backward) */
export const D2_Samasaptama = (lon: number): number => {
  const sign = signOf(lon)
  const deg = degInSign(lon)
  if (isOdd(sign)) return deg < 15 ? sign : mod12(sign + 6)
  return deg < 15 ? mod12(sign + 6) : sign
}

/** D2 — Somanath (Moon-based hora) */
export const D2_Somanath = (lon: number): number => {
  const deg = degInSign(lon)
  return deg < 15 ? 4 : 5   // Cancer=4 (first), Leo=5 (second)
}

/** D2 — Raman scheme */
export const D2_Raman = (lon: number): number => {
  const sign = signOf(lon)
  const deg = degInSign(lon)
  return deg < 15 ? sign : mod12(sign + 1)
}

/** D3 — Jagannath Drekkana */
export const D3_Jagannath = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 3)
  return mod12(sign + p * 4)
}

/** D3 — Somanath Drekkana */
export const D3_Somanath = (lon: number): number => {
  const deg = degInSign(lon)
  if (deg < 10) return 1    // Aries
  if (deg < 20) return 9    // Sagittarius
  return 5                   // Leo
}

/** D3 — Nadi Drekkana (used in Nadi traditions) */
export const D3_Nadi = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 3)
  // Nadi: each decanate has fixed planetary association
  const nadiMap: Record<number, number[]> = {
    1:[1,5,9], 2:[5,9,1], 3:[9,1,5], 4:[4,8,12],
    5:[8,12,4], 6:[12,4,8], 7:[7,11,3], 8:[11,3,7],
    9:[3,7,11], 10:[10,2,6], 11:[2,6,10], 12:[6,10,2]
  }
  return nadiMap[sign]?.[p] ?? sign
}

/** D4 — Parivritti Chaturthamsha */
export const D4_Parivritti = (lon: number): number => {
  const p = part(lon, 4)
  return mod12(p * 3 + 1)   // Ar, Cn, Li, Cp
}

/** D9 — Pada Navamsha (based on pada of nakshatra) */
export const D9_Pada = (lon: number): number => {
  const normalized = norm(lon)
  const nakshatra = Math.floor(normalized / (360 / 27))
  const pada = Math.floor((normalized % (360 / 27)) / (360 / 108)) // 0–3
  return mod12(nakshatra % 12 + pada + 1)
}

/** D9 — Nadi Navamsha */
export const D9_Nadi = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 9)
  // Nadi: start depends on sign element
  const bases = [1, 4, 7, 10]  // fire, earth, air, water
  const element = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3][sign - 1]
  return mod12(bases[element] + p)
}

/** D9 — Somanatha Navamsha */
export const D9_Somanatha = (lon: number): number => {
  const p = part(lon, 9)
  return mod12(p + 1)   // always from Aries
}

/** D12 — Ganaamsha (groups of 12) */
export const D12_Ganaamsha = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 12)
  return mod12(sign + p)
}

/** D24 — Paravidya (higher learning variation) */
export const D24_Paravidya = (lon: number): number => {
  const p = part(lon, 24)
  return mod12(p + 4)   // starts from Cancer
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
  // Apply D9 twice
  const d9Sign = D9(lon)
  // Get a representative longitude in D9 sign
  const d9Lon = (d9Sign - 1) * 30 + degInSign(lon)
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

/** D144 — Dwadashdwadashamsha (144 = 12×12) */
export const D144 = (lon: number): number => {
  const sign = signOf(lon)
  const p = part(lon, 144)
  return mod12(sign + (p % 12))
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
    // For D30 (unequal), we just use the natal degree or 0? 
    // Parashara Trimshamsha has unequal arcs. 
    // Most software shows 0 or scales the specific arc.
    // For now, we'll use 0 to avoid misleading degrees in D30.
    degree = 0 
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
export const VARGA_META: Record<string, { full: string; topic: string; tier: 'free' | 'gold' | 'platinum' }> = {
  D1:  { full: 'Rashi',               topic: 'Lagna chart — personality, body, overall life',        tier: 'free' },
  Chalit: { full: 'Bhava Chalit',     topic: 'House positions — actual house placements (Sripati)', tier: 'free' },
  D2:  { full: 'Hora',                topic: 'Wealth & assets — income, Sun/Moon Hora',              tier: 'free' },
  D3:  { full: 'Drekkana',            topic: 'Siblings — relationships, talents, abilities',         tier: 'free' },
  D4:  { full: 'Chaturthamsha',       topic: 'Home & property — dwelling, ancestral property',       tier: 'free' },
  D5:  { full: 'Panchamsha',          topic: 'Fame & authority — recognition, status',               tier: 'platinum' },
  D6:  { full: 'Shashthamsha',        topic: 'Health & enemies — debts, disputes, service',          tier: 'platinum' },
  D7:  { full: 'Saptamsha',           topic: 'Children — progeny, offspring, influence',             tier: 'free' },
  D8:  { full: 'Ashtamsha',           topic: 'Longevity — unexpected events, crises',                tier: 'platinum' },
  D9:  { full: 'Navamsha',            topic: 'Marriage, Destiny — Marriage, Destiny & Inner self',   tier: 'free' },
  D10: { full: 'Dasamsha',            topic: 'Career — profession, achievements, reputation',        tier: 'free' },
  D12: { full: 'Dwadasamsha',         topic: 'Parents — relationship with parents, their influence', tier: 'free' },
  D16: { full: 'Shodasamsha',         topic: 'Vehicles & comforts — transport, luxuries',            tier: 'free' },
  D20: { full: 'Vimsamsha',           topic: 'Spirituality — religious actions, devotion',           tier: 'free' },
  D24: { full: 'Chaturvimsamsha',     topic: 'Education — learning, academic achievements',          tier: 'free' },
  D27: { full: 'Saptvimsamsha',       topic: 'Innate strength — inherent qualities, talents',        tier: 'free' },
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
