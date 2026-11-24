// ─────────────────────────────────────────────────────────────
//  src/lib/engine/astroVastu.ts
//  Astro-Vastu zone mapping and scoring. Pure — no React/DB.
//
//  Direction frame (the Dig Bala frame of Parashara):
//    1st house = East, 4th = North, 7th = West, 10th = South.
//  Houses run E → N → W → S, so the 2nd/3rd sit in the north-east
//  quadrant, 5th/6th north-west, 8th/9th south-west, 11th/12th
//  south-east. Whole-sign houses, spread by degree inside the sign
//  so a planet at 15° of the Lagna sign sits exactly East.
// ─────────────────────────────────────────────────────────────

/** Compass bearing in degrees, clockwise from North (N=0, E=90, S=180, W=270). */
export function vastuBearing(rashi: number, degreeInRashi: number, ascRashi: number): number {
  const house = ((rashi - ascRashi + 12) % 12) + 1
  const offset = (house - 1) * 30 + (degreeInRashi - 15)
  return (((90 - offset) % 360) + 360) % 360
}

/** Bearing of the centre of house `h` (1–12) in the same frame: 1st = East, 4th = North. */
export function houseBearing(h: number): number {
  return (((90 - (h - 1) * 30) % 360) + 360) % 360
}

/** Smallest angular distance between two bearings (0–180). */
export function bearingDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/** Core 8-direction zones (id, angle, ruler). Mirrors ZONES_8 in components/ui/vastu/tables.ts (a test keeps them equal). */
export const VASTU_ZONES_8: readonly VastuZoneInput[] = [
  { id: 'N', angle: 0, ruling: 'Me' },
  { id: 'NE', angle: 45, ruling: 'Ju' },
  { id: 'E', angle: 90, ruling: 'Su' },
  { id: 'SE', angle: 135, ruling: 'Ve' },
  { id: 'S', angle: 180, ruling: 'Ma' },
  { id: 'SW', angle: 225, ruling: 'Ra' },
  { id: 'W', angle: 270, ruling: 'Sa' },
  { id: 'NW', angle: 315, ruling: 'Mo', coRuling: 'Ke' },
]

/** Planets with full (60 shashtiamsa) Dig Bala in a given direction. */
export const DIG_BALA_DIRECTION: Record<string, 'E' | 'N' | 'W' | 'S'> = {
  Ju: 'E', Me: 'E',   // 1st house
  Mo: 'N', Ve: 'N',   // 4th house
  Sa: 'W',            // 7th house
  Su: 'S', Ma: 'S',   // 10th house
}

export type DigBalaBand = 'strong' | 'neutral' | 'weak'

/** Dig Bala in shashtiamsas (0–60). `undefined` for Rahu/Ketu or missing data. */
export function digBalaShash(
  shadbala: { planets?: Record<string, { digBala?: number; componentShash?: { dig?: number } }> } | undefined,
  id: string,
): number | undefined {
  const p = shadbala?.planets?.[id]
  if (!p) return undefined
  if (typeof p.componentShash?.dig === 'number') return p.componentShash.dig
  if (typeof p.digBala === 'number') return p.digBala * 60 // stored in rupas
  return undefined
}

export function digBalaBand(shash: number | undefined): DigBalaBand {
  if (shash === undefined) return 'neutral'
  if (shash >= 40) return 'strong'
  if (shash <= 20) return 'weak'
  return 'neutral'
}

export interface VastuGrahaInput {
  id: string
  rashi: number
  degree: number
  dignity?: string
  isRetro?: boolean
}

export interface VastuZoneInput {
  id: string
  angle: number
  ruling: string
  /** Secondary ruler (e.g. Ketu sharing NW with the Moon); half weight. */
  coRuling?: string
}

export interface VastuZoneScore {
  id: string
  occupantIds: string[]
  score: number
}

const MALEFICS = new Set(['Sa', 'Ra', 'Ke', 'Ma'])
/** Water/wisdom quadrant that classical Vastu keeps light and free of malefics. */
const SATTVIC_ZONES = new Set(['N', 'NNE', 'NE', 'ENE', 'E'])

function dignityPoints(dignity: string | undefined, isRetro: boolean | undefined): number {
  let s = 0
  if (dignity === 'exalted') s += 30
  else if (dignity === 'moolatrikona') s += 25
  else if (dignity === 'own') s += 20
  else if (dignity === 'debilitated') s -= 30
  if (isRetro) s -= 10
  return s
}

/** Which zone (by id) a bearing falls into, for zones evenly spaced around the circle. */
export function zoneForBearing<Z extends { id: string; angle: number }>(bearing: number, zones: readonly Z[]): Z {
  let best = zones[0]
  let bestD = Infinity
  for (const z of zones) {
    const d = bearingDistance(bearing, z.angle)
    if (d < bestD) { bestD = d; best = z }
  }
  return best
}

export function analyzeVastuZones(
  grahas: readonly VastuGrahaInput[],
  ascRashi: number,
  zones: readonly VastuZoneInput[],
  shadbala?: Parameters<typeof digBalaShash>[0],
): VastuZoneScore[] {
  const byId = new Map(grahas.map(g => [g.id, g]))
  const occupants = new Map<string, string[]>(zones.map(z => [z.id, []]))
  for (const g of grahas) {
    if (g.id === 'Ur' || g.id === 'Ne' || g.id === 'Pl') continue
    const z = zoneForBearing(vastuBearing(g.rashi, g.degree, ascRashi), zones)
    occupants.get(z.id)!.push(g.id)
  }

  return zones.map(zone => {
    let score = 50
    const ruler = byId.get(zone.ruling)
    if (ruler) {
      score += dignityPoints(ruler.dignity, ruler.isRetro)
      const dig = digBalaShash(shadbala, zone.ruling)
      if (dig !== undefined) score += Math.round((dig - 30) / 3) // ±10
    }
    if (zone.coRuling) {
      const co = byId.get(zone.coRuling)
      if (co) score += Math.round(dignityPoints(co.dignity, co.isRetro) / 2)
    }
    const occ = occupants.get(zone.id)!
    if (SATTVIC_ZONES.has(zone.id) && occ.some(id => MALEFICS.has(id))) score -= 15
    return { id: zone.id, occupantIds: occ, score: Math.max(0, Math.min(100, score)) }
  })
}

/* ── Doshas ──────────────────────────────────────────────────── */

export type DoshaIndication = 'indicated' | 'clear' | 'property'

/**
 * Chart signal for a zone-based dosha: indicated when the zone scores
 * below 50 or a malefic sits in it. `zoneId` undefined → the dosha is a
 * physical property defect that no chart can show.
 */
export function doshaIndication(zoneId: string | undefined, zoneScores: readonly VastuZoneScore[]): DoshaIndication {
  if (!zoneId) return 'property'
  const z = zoneScores.find(s => s.id === zoneId)
  if (!z) return 'property'
  return z.score < 50 || z.occupantIds.some(id => MALEFICS.has(id)) ? 'indicated' : 'clear'
}

/* ── Main entrance ───────────────────────────────────────────── */

export const ENTRANCE_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const
export type EntranceDirection = (typeof ENTRANCE_DIRECTIONS)[number]

/** Sign direction of the Lagna (BPHS): fiery = E, earthy = S, airy = W, watery = N. */
export function lagnaDirection(ascRashi: number): 'E' | 'S' | 'W' | 'N' {
  return (['E', 'S', 'W', 'N'] as const)[(ascRashi - 1) % 4]
}

export interface EntranceVerdict {
  facing: EntranceDirection
  score: number
  band: 'good' | 'mid' | 'weak'
  lagnaDir: 'E' | 'S' | 'W' | 'N'
  matchesLagna: boolean
}

/** Judge the main door the user actually has, from the 8-zone scores and the Lagna direction. */
export function entranceVerdict(
  facing: EntranceDirection,
  zoneScores8: readonly VastuZoneScore[],
  ascRashi: number,
): EntranceVerdict {
  const lagnaDir = lagnaDirection(ascRashi)
  const matchesLagna = facing === lagnaDir
  const base = zoneScores8.find(z => z.id === facing)?.score ?? 50
  const score = Math.max(0, Math.min(100, base + (matchesLagna ? 10 : 0)))
  const band = score >= 60 ? 'good' : score >= 45 ? 'mid' : 'weak'
  return { facing, score, band, lagnaDir, matchesLagna }
}

/* ── My Home: room placement ─────────────────────────────────── */

export const HOME_ZONES = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'Center'] as const
export type HomeZone = (typeof HOME_ZONES)[number]

export const ROOM_IDS = [
  'pooja', 'kitchen', 'master', 'living', 'study', 'children', 'dining', 'toilet', 'storage', 'staircase', 'water',
] as const
export type RoomId = (typeof ROOM_IDS)[number]

/** Classical placement rules (Vishwakarma Prakash / Mayamata as taught in Vastu practice). Unlisted zones are neutral. */
export const ROOM_RULES: Record<RoomId, { best: HomeZone[]; good: HomeZone[]; avoid: HomeZone[] }> = {
  pooja:     { best: ['NE'],                 good: ['N', 'E'],        avoid: ['S', 'SW', 'SE'] },
  kitchen:   { best: ['SE'],                 good: ['NW'],            avoid: ['NE', 'SW', 'N', 'Center'] },
  master:    { best: ['SW'],                 good: ['S', 'W'],        avoid: ['NE', 'SE', 'Center'] },
  living:    { best: ['E', 'NE', 'N'],       good: ['NW', 'W', 'Center'], avoid: ['SW'] },
  study:     { best: ['W', 'N', 'E', 'NE'],  good: ['NW'],            avoid: ['SE', 'SW'] },
  children:  { best: ['W', 'NW'],            good: ['N', 'E'],        avoid: ['SW', 'SE'] },
  dining:    { best: ['W', 'NW'],            good: ['E', 'S'],        avoid: ['NE', 'SW'] },
  toilet:    { best: ['NW', 'W'],            good: ['S'],             avoid: ['NE', 'SE', 'SW', 'Center', 'N', 'E'] },
  storage:   { best: ['SW', 'S', 'W'],       good: ['NW'],            avoid: ['NE', 'Center'] },
  staircase: { best: ['S', 'SW', 'W'],       good: ['NW', 'SE'],      avoid: ['NE', 'N', 'Center'] },
  water:     { best: ['NE', 'N', 'E'],       good: ['W'],             avoid: ['SW', 'S', 'SE', 'Center'] },
}

export type RoomFit = 'best' | 'good' | 'neutral' | 'avoid'
export type HomeRooms = Partial<Record<RoomId, HomeZone[]>>

export interface RoomFinding {
  room: RoomId
  zone: HomeZone
  fit: RoomFit
  /** Chart score of the zone (8-direction), undefined for the centre. */
  zoneScore?: number
  /** high = wrong place; medium = neutral place in a weak zone; low = right place but the zone needs support. */
  priority: 'high' | 'medium' | 'low' | 'none'
}

export function roomFit(room: RoomId, zone: HomeZone): RoomFit {
  const r = ROOM_RULES[room]
  if (r.best.includes(zone)) return 'best'
  if (r.good.includes(zone)) return 'good'
  if (r.avoid.includes(zone)) return 'avoid'
  return 'neutral'
}

const WEAK_ZONE = 45

/** Judge each room the user placed, against Vastu rules and their chart's zone strength. Sorted most urgent first. */
export function analyzeHome(rooms: HomeRooms, zoneScores8: readonly VastuZoneScore[]): RoomFinding[] {
  const rank = { high: 0, medium: 1, low: 2, none: 3 } as const
  const out: RoomFinding[] = []
  for (const room of ROOM_IDS) {
    for (const zone of rooms[room] ?? []) {
      const fit = roomFit(room, zone)
      const zoneScore = zone === 'Center' ? undefined : zoneScores8.find(z => z.id === zone)?.score
      const weak = zoneScore !== undefined && zoneScore < WEAK_ZONE
      const priority = fit === 'avoid' ? 'high' : weak && fit === 'neutral' ? 'medium' : weak ? 'low' : 'none'
      out.push({ room, zone, fit, zoneScore, priority })
    }
  }
  return out.sort((a, b) => rank[a.priority] - rank[b.priority])
}

/** Dosha ids (see VASTU_DOSHAS) that the user's own room layout shows. */
export function homeDoshas(rooms: HomeRooms, facing?: EntranceDirection | null): Set<string> {
  const at = (room: RoomId, zones: HomeZone[]) => (rooms[room] ?? []).some(z => zones.includes(z))
  const found = new Set<string>()
  if (at('toilet', ['Center']) || at('kitchen', ['Center']) || at('staircase', ['Center']) || at('storage', ['Center'])) found.add('brahma-dosha')
  if (at('toilet', ['NE']) || at('kitchen', ['NE']) || at('staircase', ['NE']) || at('storage', ['NE'])) found.add('ishan-dosha')
  if (at('water', ['SE']) || at('toilet', ['SE'])) found.add('agni-dosha')
  if (at('water', ['SW']) || at('toilet', ['SW']) || facing === 'SW') found.add('nairiti-dosha')
  if (at('water', ['SW', 'S', 'SE'])) found.add('underground-water')
  if (at('staircase', ['NE', 'Center'])) found.add('staircase-dosha')
  return found
}

/* ── Dasha-timed Vastu ───────────────────────────────────────── */

/** Navagraha direction of each graha — matches NAVAGRAHA_ZONES. */
export const GRAHA_VASTU_DIR: Record<string, EntranceDirection> = {
  Su: 'E', Mo: 'NW', Ma: 'S', Me: 'N', Ju: 'NE', Ve: 'SE', Sa: 'W', Ra: 'SW', Ke: 'NW',
}

interface DashaLike { lord: string; start: Date | string; end: Date | string; children?: DashaLike[] }

export interface DashaPeriodFocus {
  lord: string
  start: Date
  end: Date
  zone: EntranceDirection
  zoneScore: number
  action: 'activate' | 'maintain' | 'balance'
}

export interface DashaVastuFocus {
  maha: DashaPeriodFocus
  antar?: DashaPeriodFocus
  /** The antardashas after the current one, in order. */
  upcoming: DashaPeriodFocus[]
}

function focusOf(node: DashaLike, zoneScores8: readonly VastuZoneScore[]): DashaPeriodFocus {
  const zone = GRAHA_VASTU_DIR[node.lord] ?? 'N'
  const zoneScore = zoneScores8.find(z => z.id === zone)?.score ?? 50
  const action = zoneScore >= 60 ? 'activate' : zoneScore < WEAK_ZONE ? 'balance' : 'maintain'
  return { lord: node.lord, start: new Date(node.start), end: new Date(node.end), zone, zoneScore, action }
}

/** Which Vastu zones the running Vimshottari periods point to, and the next few antardashas. */
export function dashaVastuFocus(
  mahadashas: readonly DashaLike[] | undefined,
  zoneScores8: readonly VastuZoneScore[],
  now: Date = new Date(),
  upcomingCount = 4,
): DashaVastuFocus | null {
  if (!mahadashas?.length) return null
  const t = now.getTime()
  const within = (n: DashaLike) => new Date(n.start).getTime() <= t && t < new Date(n.end).getTime()
  const mi = mahadashas.findIndex(within)
  if (mi < 0) return null
  const md = mahadashas[mi]
  const ads = md.children ?? []
  const ai = ads.findIndex(within)
  const upcoming: DashaPeriodFocus[] = []
  if (ai >= 0) {
    // Following antardashas, continuing into the next mahadasha if needed
    const rest = [...ads.slice(ai + 1), ...mahadashas.slice(mi + 1).flatMap(m => m.children ?? [])]
    for (const n of rest.slice(0, upcomingCount)) upcoming.push(focusOf(n, zoneScores8))
  }
  return {
    maha: focusOf(md, zoneScores8),
    antar: ai >= 0 ? focusOf(ads[ai], zoneScores8) : undefined,
    upcoming,
  }
}

/* ── Ayadi Shadvarga (area method, Mayamata / Manasara) ─────────
   Built-up area A = length × breadth, rounded to a whole unit.
     Aaya      = (A × 8) mod 12   income        (0 → 12)
     Vyaya     = (A × 9) mod 10   expenditure   (0 → 10)
     Yoni      = (A × 3) mod 8    1 Dhwaja … 8 Kaka (0 → 8)
     Nakshatra = (A × 8) mod 27   (0 → 27)
     Vara      = (A × 9) mod 7    1 = Sunday (0 → 7)
     Tithi     = (A × 6) mod 30   (0 → 30)
   Schools differ in unit and multipliers; this is the widely taught area form. */

export const YONI_IDS = ['dhwaja', 'dhooma', 'simha', 'shwana', 'vrishabha', 'khara', 'gaja', 'kaka'] as const
export type YoniId = (typeof YONI_IDS)[number]

/** Tara from the owner's janma nakshatra (1 = Janma … 9 = Parama Mitra). */
export const TARA_IDS = ['janma', 'sampat', 'vipat', 'kshema', 'pratyak', 'sadhana', 'naidhana', 'mitra', 'paramaMitra'] as const
export type TaraId = (typeof TARA_IDS)[number]
const GOOD_TARAS = new Set<TaraId>(['sampat', 'kshema', 'sadhana', 'mitra', 'paramaMitra'])

export interface AyadiCheck { ok: boolean }
export interface AyadiResult {
  area: number
  aaya: number
  vyaya: number
  /** 1–8; odd yonis (Dhwaja, Simha, Vrishabha, Gaja) are auspicious. */
  yoni: number
  yoniId: YoniId
  /** 1–27 (Ashwini = 1). */
  nakshatra: number
  /** Tara counted from the owner's birth nakshatra; undefined when not given. */
  tara?: TaraId
  /** 1–7 (Sunday = 1). */
  vara: number
  /** 1–30 (Shukla 1–15, Krishna 16–30). */
  tithi: number
  checks: {
    aayaOverVyaya: AyadiCheck
    yoni: AyadiCheck
    tara?: AyadiCheck
    vara: AyadiCheck
    tithi: AyadiCheck
  }
  passed: number
  total: number
}

const modOr = (n: number, m: number) => n % m || m

/** Ayadi from length and breadth in one unit. `birthNakshatra` is 1–27 (owner's Moon nakshatra). */
export function ayadi(length: number, breadth: number, birthNakshatra?: number): AyadiResult | null {
  if (!(length > 0) || !(breadth > 0)) return null
  const area = Math.round(length * breadth)
  if (area < 1) return null
  const aaya = modOr(area * 8, 12)
  const vyaya = modOr(area * 9, 10)
  const yoni = modOr(area * 3, 8)
  const nakshatra = modOr(area * 8, 27)
  const vara = modOr(area * 9, 7)
  const tithi = modOr(area * 6, 30)

  const tara = birthNakshatra && birthNakshatra >= 1 && birthNakshatra <= 27
    ? TARA_IDS[(((nakshatra - birthNakshatra + 27) % 27) % 9)]
    : undefined
  const pakshaTithi = ((tithi - 1) % 15) + 1

  const checks: AyadiResult['checks'] = {
    aayaOverVyaya: { ok: aaya > vyaya },
    yoni: { ok: yoni % 2 === 1 },
    vara: { ok: vara !== 1 && vara !== 3 && vara !== 7 },   // Sun, Tue, Sat avoided
    tithi: { ok: tithi !== 30 && ![4, 8, 9, 14].includes(pakshaTithi) }, // Rikta, Ashtami, Amavasya avoided
  }
  if (tara) checks.tara = { ok: GOOD_TARAS.has(tara) }
  const list = Object.values(checks).filter(Boolean) as AyadiCheck[]
  return {
    area, aaya, vyaya, yoni, yoniId: YONI_IDS[yoni - 1], nakshatra, tara, vara, tithi, checks,
    passed: list.filter(c => c.ok).length, total: list.length,
  }
}

/** Nearest size (each side changed by at most `maxDelta`, in `step`s) that passes more Ayadi checks; null if none is better. */
export function ayadiSuggest(
  length: number,
  breadth: number,
  birthNakshatra?: number,
  maxDelta = 2,
  step = 0.5,
): { length: number; breadth: number; result: AyadiResult } | null {
  const base = ayadi(length, breadth, birthNakshatra)
  if (!base) return null
  let best: { length: number; breadth: number; result: AyadiResult; cost: number } | null = null
  const n = Math.round(maxDelta / step)
  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      if (!i && !j) continue
      const l = +(length + i * step).toFixed(2), b = +(breadth + j * step).toFixed(2)
      const r = ayadi(l, b, birthNakshatra)
      if (!r || r.passed <= base.passed) continue
      const cost = Math.abs(i) + Math.abs(j)
      if (!best || r.passed > best.result.passed || (r.passed === best.result.passed && cost < best.cost)) {
        best = { length: l, breadth: b, result: r, cost }
      }
    }
  }
  return best && { length: best.length, breadth: best.breadth, result: best.result }
}

/* ── Live compass ────────────────────────────────────────────── */

/**
 * Compass heading (0 = North, clockwise) from a DeviceOrientation reading.
 * iOS gives `webkitCompassHeading` directly; elsewhere an absolute `alpha`
 * is counter-clockwise, so heading = 360 − alpha. `screenAngle` corrects
 * for a rotated screen. Returns null when the reading is not absolute.
 */
export function headingFromOrientation(r: {
  alpha: number | null
  absolute?: boolean
  webkitCompassHeading?: number | null
  screenAngle?: number
}): number | null {
  let h: number | null = null
  if (typeof r.webkitCompassHeading === 'number' && !Number.isNaN(r.webkitCompassHeading)) h = r.webkitCompassHeading
  else if (r.absolute && typeof r.alpha === 'number') h = 360 - r.alpha
  if (h === null) return null
  return (((h + (r.screenAngle ?? 0)) % 360) + 360) % 360
}

/** Move `prev` toward `next` along the shorter arc (circular low-pass filter). */
export function smoothHeading(prev: number | null, next: number, factor = 0.25): number {
  if (prev === null) return next
  let d = next - prev
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return (((prev + d * factor) % 360) + 360) % 360
}

/* ── Yearly transit zones (gochar) ───────────────────────────────
   Jupiter's and Saturn's sign over the coming year, counted as a
   house from the Lagna, gives a direction in the same frame.
   Jupiter's zone is the one to activate and expand; Saturn's is the
   one to order, repair and keep clear. Pure: spans come from the
   server (/api/transit/slow-spans). */

export interface TransitSpanLike { id: string; rashi: number; start: string; end: string }

export interface TransitZonePeriod {
  planet: 'Ju' | 'Sa'
  rashi: number
  house: number
  zone: string
  /** Clipped to the window [from, to). ISO days. */
  start: string
  end: string
  zoneScore: number
  current: boolean
}

export function transitVastuYear(
  spans: readonly TransitSpanLike[],
  ascRashi: number,
  zoneScores8: readonly VastuZoneScore[],
  now: Date = new Date(),
  months = 12,
): TransitZonePeriod[] {
  const from = now.toISOString().slice(0, 10)
  const until = new Date(now)
  until.setUTCMonth(until.getUTCMonth() + months)
  const to = until.toISOString().slice(0, 10)
  const out: TransitZonePeriod[] = []
  for (const s of spans) {
    if (s.id !== 'Ju' && s.id !== 'Sa') continue
    if (s.end <= from || s.start >= to) continue
    const house = ((s.rashi - ascRashi + 12) % 12) + 1
    const zone = zoneForBearing(houseBearing(house), VASTU_ZONES_8).id
    out.push({
      planet: s.id,
      rashi: s.rashi,
      house,
      zone,
      start: s.start < from ? from : s.start,
      end: s.end > to ? to : s.end,
      zoneScore: zoneScores8.find(z => z.id === zone)?.score ?? 50,
      current: s.start <= from && from < s.end,
    })
  }
  return out.sort((a, b) => (a.planet === b.planet ? a.start.localeCompare(b.start) : a.planet === 'Ju' ? -1 : 1))
}

/* ── Floor-plan overlay ──────────────────────────────────────── */

/**
 * Compass bearing of a point on a floor plan, measured from the plan's
 * centre. `dx`/`dy` are in screen pixels (y grows downward).
 * `northAngle` is where North points on the plan, clockwise from "up"
 * (0 = North is up, 90 = North points right).
 */
export function planBearing(dx: number, dy: number, northAngle: number): number {
  const screen = (Math.atan2(dx, -dy) * 180) / Math.PI // clockwise from up
  return (((screen - northAngle) % 360) + 360) % 360
}

/** Screen angle (clockwise from up) at which a compass bearing is drawn on the plan. */
export function planScreenAngle(bearing: number, northAngle: number): number {
  return (((bearing + northAngle) % 360) + 360) % 360
}

/**
 * Home zone of a point on the plan: the centre circle (Brahmasthan) when
 * the point is within `centreRadius` pixels, otherwise the nearest of the
 * 8 directions.
 */
export function planHomeZone(dx: number, dy: number, northAngle: number, centreRadius: number): HomeZone {
  if (Math.hypot(dx, dy) <= centreRadius) return 'Center'
  return zoneForBearing(planBearing(dx, dy, northAngle), VASTU_ZONES_8).id as HomeZone
}

/** Rooms that belong in a zone (best) and rooms to keep out of it (avoid). */
export function roomsForZone(zone: HomeZone): { best: RoomId[]; avoid: RoomId[] } {
  return {
    best: ROOM_IDS.filter(r => ROOM_RULES[r].best.includes(zone)),
    avoid: ROOM_IDS.filter(r => ROOM_RULES[r].avoid.includes(zone)),
  }
}

/* ── Household view ──────────────────────────────────────────────
   One home, several charts. Classical Vastu reads the home mainly for
   its owner (grihaswami), so the owner carries half the weight and the
   other members share the other half equally. */

export interface HouseholdMemberInput {
  key: string
  name: string
  /** 8-direction zone scores from analyzeVastuZones(…, VASTU_ZONES_8, …). */
  zones: readonly VastuZoneScore[]
}

export interface HouseholdMember {
  key: string
  name: string
  isOwner: boolean
  weight: number
  scores: Record<string, number>
  /** Strongest zone that is not ruled out for this person's bedroom. */
  bestRoomZone: string
  bestRoomScore: number
}

export interface HouseholdConflict {
  zone: string
  strongFor: string[]
  weakFor: string[]
}

export interface HouseholdResult {
  members: HouseholdMember[]
  combined: { id: string; score: number }[]
  conflicts: HouseholdConflict[]
}

export const HOUSEHOLD_MAX = 6
const OWNER_WEIGHT = 0.5

/** Weights for n members, owner first: 1 alone; else owner 0.5 and the rest share 0.5. */
export function householdWeights(n: number): number[] {
  if (n <= 0) return []
  if (n === 1) return [1]
  const other = (1 - OWNER_WEIGHT) / (n - 1)
  return [OWNER_WEIGHT, ...Array.from({ length: n - 1 }, () => other)]
}

/** Members[0] is the owner. Strong ≥ 65 and weak < 40 mark a conflict. */
export function combineHousehold(members: readonly HouseholdMemberInput[]): HouseholdResult {
  const list = members.slice(0, HOUSEHOLD_MAX)
  const w = householdWeights(list.length)
  const ids = VASTU_ZONES_8.map(z => z.id)
  const out: HouseholdMember[] = list.map((m, i) => {
    const scores = Object.fromEntries(ids.map(id => [id, m.zones.find(z => z.id === id)?.score ?? 50]))
    // Owner's room follows master-bedroom rules; others follow children's/other-bedroom rules.
    const rule: RoomId = i === 0 ? 'master' : 'children'
    const allowed = ids.filter(id => roomFit(rule, id as HomeZone) !== 'avoid')
    const best = [...allowed].sort((a, b) => scores[b] - scores[a])[0]
    return { key: m.key, name: m.name, isOwner: i === 0, weight: w[i], scores, bestRoomZone: best, bestRoomScore: scores[best] }
  })
  const combined = ids.map(id => ({ id, score: Math.round(out.reduce((a, m) => a + m.weight * m.scores[id], 0)) }))
  const conflicts: HouseholdConflict[] = out.length < 2 ? [] : ids.flatMap(id => {
    const strongFor = out.filter(m => m.scores[id] >= 65).map(m => m.name)
    const weakFor = out.filter(m => m.scores[id] < 40).map(m => m.name)
    return strongFor.length && weakFor.length ? [{ zone: id, strongFor, weakFor }] : []
  })
  return { members: out, combined, conflicts }
}
