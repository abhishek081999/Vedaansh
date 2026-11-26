// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nakshatraKota.ts
//  Kota Chakra (the "fortress"): the 28 stars (Abhijit included)
//  counted from the janma star, seven to a side. In each side the
//  stars run Bahya → Prakara → Madhya → Stambha (entering, through the
//  corner) and back out Madhya → Prakara → Bahya (exiting, toward the
//  cardinal point). Malefics entering or in the Stambha threaten the
//  fort; benefics entering defend it. Retrograde motion (always for
//  Rahu/Ketu) swaps entering and exiting.
//  Kota Pala = Avakahaḍā syllable of the Moon pada → letter-class lord.
//  Pure — ids and numbers only.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import { AKSHAR_CHAKRA } from '@/lib/engine/naamkaran'
import { AKSHAR_CHAKRA_DE } from '@/lib/engine/locale/naamkaran.hi'

/** Abhijit: last pada of Uttara Ashadha + first 1/15 of Shravana (276°40' – 280°53'20"). */
export const ABHIJIT_START = 276 + 40 / 60
export const ABHIJIT_END = 280 + 53 / 60 + 20 / 3600
/** Index of Abhijit in the 28-star ring (between Uttara Ashadha = 20 and Shravana). */
export const ABHIJIT_28 = 21

const NAK_SPAN = 360 / 27
const PADA_SPAN = NAK_SPAN / 4

/** 28-star index (0–27) for a sidereal longitude. */
export function star28Of(lon: number): number {
  const n = ((lon % 360) + 360) % 360
  if (n >= ABHIJIT_START && n < ABHIJIT_END) return ABHIJIT_28
  const nak = Math.min(26, Math.floor(n / NAK_SPAN))
  return nak <= 20 ? nak : nak + 1
}

/** 27-star index for a 28-star index, or null for Abhijit. */
export function star27Of(k: number): number | null {
  if (k === ABHIJIT_28) return null
  return k < ABHIJIT_28 ? k : k - 1
}

/**
 * Pada 1–4 within the 27-star span that contains this longitude.
 * Abhijit’s window still returns the underlying Uttara Ashadha / Shravana pada;
 * callers that need the fort Pala for Abhijit should use kotaPalaOf(null, …).
 */
export function padaOf(lon: number): 1 | 2 | 3 | 4 {
  const n = ((lon % 360) + 360) % 360
  const within = n % NAK_SPAN
  return (Math.min(3, Math.floor(within / PADA_SPAN)) + 1) as 1 | 2 | 3 | 4
}

export type KotaLayer = 'stambha' | 'madhya' | 'prakara' | 'bahya'
export type KotaPath = 'entering' | 'stambha' | 'exiting'
/** Side of the fort: entry corner and exit direction. */
export type KotaSide = 'ne-e' | 'se-s' | 'sw-w' | 'nw-n'

const LAYERS: KotaLayer[] = ['bahya', 'prakara', 'madhya', 'stambha', 'madhya', 'prakara', 'bahya']
const SIDES: KotaSide[] = ['ne-e', 'se-s', 'sw-w', 'nw-n']

export interface KotaCell {
  star28: number
  /** 1–28 counted from janma. */
  count: number
  side: KotaSide
  /** 0–6 position within the side. */
  pos: number
  layer: KotaLayer
  path: KotaPath
}

export function kotaCells(janma28: number): KotaCell[] {
  return Array.from({ length: 28 }, (_, i) => {
    const pos = i % 7
    return {
      star28: (janma28 + i) % 28,
      count: i + 1,
      side: SIDES[Math.floor(i / 7)],
      pos,
      layer: LAYERS[pos],
      path: pos < 3 ? 'entering' : pos === 3 ? 'stambha' : 'exiting',
    }
  })
}

const MALEFIC = new Set<GrahaId>(['Su', 'Ma', 'Sa', 'Ra', 'Ke'])
const SIGN_LORD: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me', 7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

/** Palace layers where the Kota Swami is strongest. */
const SWAMI_LAYERS = new Set<KotaLayer>(['madhya', 'stambha'])
/** Guard wall where the Kota Pala should stand. */
const PALA_LAYERS = new Set<KotaLayer>(['prakara'])

// ── Kota Pala (Avakahaḍā letter-class) ────────────────────────

/** Eight phonetic classes → guard planet. Ketu rules no letters. */
const VOWELS_DE = new Set('अआइईउऊऋॠऌएऐओऔ'.split(''))
const KA_DE = new Set('कखगघङ'.split(''))
const CA_DE = new Set('चछजझञ'.split(''))
const TTA_DE = new Set('टठडढण'.split(''))
const TA_DE = new Set('तथदधन'.split(''))
const PA_DE = new Set('पफबभम'.split(''))
const YA_DE = new Set('यरलव'.split(''))
const SHA_DE = new Set('शषसह'.split(''))

const VOWEL_LATIN = new Set(['A', 'AA', 'I', 'EE', 'U', 'OO', 'RI', 'E', 'AI', 'O', 'AU'])
const KA_LATIN = ['K', 'G', 'NG']
const CA_LATIN = ['CH', 'J', 'NY']
const PA_LATIN = ['P', 'F', 'B', 'BH', 'M']
const YA_LATIN = ['Y', 'R', 'L', 'V', 'W']
const SHA_LATIN = ['SH', 'S', 'H']

function palaFromDevanagari(ch: string): GrahaId | null {
  if (VOWELS_DE.has(ch)) return 'Su'
  if (KA_DE.has(ch)) return 'Ma'
  if (CA_DE.has(ch)) return 'Ve'
  if (TTA_DE.has(ch)) return 'Me'
  if (TA_DE.has(ch)) return 'Ju'
  if (PA_DE.has(ch)) return 'Sa'
  if (YA_DE.has(ch)) return 'Mo'
  if (SHA_DE.has(ch)) return 'Ra'
  return null
}

/** Latin fallback when Devanagari is missing; cerebrals and dentals both look like T/D/N. */
function palaFromLatin(sound: string): GrahaId {
  const s = sound.trim().toUpperCase()
  if (!s) return 'Su'
  if (VOWEL_LATIN.has(s) || /^[AEIOU]/.test(s)) return 'Su'
  if (SHA_LATIN.some(p => s.startsWith(p))) return 'Ra'
  if (CA_LATIN.some(p => s.startsWith(p))) return 'Ve'
  if (KA_LATIN.some(p => s.startsWith(p))) return 'Ma'
  if (PA_LATIN.some(p => s.startsWith(p))) return 'Sa'
  if (YA_LATIN.some(p => s.startsWith(p))) return 'Mo'
  // Bare T/D/N without underdot: treat as dental (Guru), matching common panchanga rows
  // where cerebrals are marked in Devanagari (ट/ड/ण) and resolved above.
  if (/^[TDN]/.test(s)) return 'Ju'
  return 'Su'
}

function palaFromSyllable(nak27: number, pada: 1 | 2 | 3 | 4): GrahaId {
  const de = AKSHAR_CHAKRA_DE[nak27]?.[pada - 1]
  if (de) {
    const base = [...de][0]
    if (base) {
      const fromDe = palaFromDevanagari(base)
      if (fromDe) return fromDe
    }
  }
  return palaFromLatin(AKSHAR_CHAKRA[nak27]?.[pada - 1] ?? 'A')
}

/**
 * Kota Pala from the Moon’s nakshatra pada (Avakahaḍā letter-class lord).
 * @param nak27 27-star index, or null for Abhijit (always Venus)
 */
export function kotaPalaOf(nak27: number | null, pada: 1 | 2 | 3 | 4 = 1): GrahaId {
  if (nak27 == null) return 'Ve'
  const n = ((nak27 % 27) + 27) % 27
  const p = (Math.min(4, Math.max(1, pada)) as 1 | 2 | 3 | 4)
  return palaFromSyllable(n, p)
}

/** Kota Pala for a natal Moon longitude (Abhijit window → Venus). */
export function kotaPalaFromLon(lon: number): GrahaId {
  const k28 = star28Of(lon)
  if (k28 === ABHIJIT_28) return 'Ve'
  const nak27 = star27Of(k28)
  return kotaPalaOf(nak27, padaOf(lon))
}

export type KotaTone = 'alert' | 'caution' | 'support' | 'neutral'

/** Why a normally benefic Moon or Mercury is read as a malefic here. */
export type NatureReason = 'waningMoon' | 'mercuryWithMalefic'

export interface KotaPlacement {
  id: GrahaId
  star28: number
  cell: KotaCell
  retro: boolean
  /** Path after the retrograde swap. */
  effectivePath: KotaPath
  malefic: boolean
  natureReason: NatureReason | null
  tone: KotaTone
}

export interface KotaReading {
  janma28: number
  kotaSwami: GrahaId
  /** Avakahaḍā letter-class lord of the Moon’s pada (Abhijit → Venus). */
  kotaPala: GrahaId
  /** Moon pada 1–4 used for the Pala (1 when janma is Abhijit). */
  janmaPada: 1 | 2 | 3 | 4
  /** When the Moon and its sign lord exchange signs, the Moon is a secondary (gouna) Kota Swami. */
  gounaSwami: GrahaId | null
  swamiPlacement: KotaPlacement | null
  palaPlacement: KotaPlacement | null
  /** Kota Swami in Madhya or Stambha (palace / pillar). */
  swamiInside: boolean
  /** Kota Pala on the Prakara (guard wall). */
  palaOnPrakara: boolean
  /** Pala sitting in Madhya or Stambha (inside the palace). */
  palaInside: boolean
  /**
   * Swami outside the palace while Pala sits inside — lecture reads this as
   * weakened protection / self-undermining choices (health context).
   */
  invertedSeats: boolean
  /** Swami and Pala are the same planet. */
  dualRole: boolean
  /**
   * When dualRole: natural malefic prefers Prakara/Bahya; natural benefic prefers Madhya/Stambha.
   * Null when not dual.
   */
  dualRoleSeatOk: boolean | null
  placements: KotaPlacement[]
  /** Malefics entering while benefics leave: the fort is breached. */
  durgaBhanga: boolean
  /** Benefics entering while malefics leave: the fort holds. */
  vijaya: boolean
  /**
   * The core is exposed: two or more malefics in the Stambha, or one there
   * with another malefic entering the Madhya, and no benefic in the Stambha.
   */
  stambhaWeak: boolean
  /** A benefic in the Stambha shields the fort. */
  stambhaGuarded: boolean
}

function toneOf(malefic: boolean, path: KotaPath, layer: KotaLayer): KotaTone {
  if (malefic) {
    if (path === 'stambha' || (path === 'entering' && layer === 'madhya')) return 'alert'
    if (path === 'entering') return 'caution'
    return 'support'
  }
  if (path === 'exiting') return 'caution'
  return 'support'
}

function layerOf(p: KotaPlacement | null): KotaLayer | null {
  return p?.cell.layer ?? null
}

function dualRoleSeatOk(id: GrahaId, layer: KotaLayer | null): boolean | null {
  if (layer == null) return null
  if (MALEFIC.has(id)) return layer === 'prakara' || layer === 'bahya'
  return SWAMI_LAYERS.has(layer)
}

/**
 * Read planets in the Kota Chakra.
 * @param janma28        28-star index of the natal Moon (see star28Of)
 * @param moonSign       natal Moon sign — its lord is the Kota Swami
 * @param planets        positions to place (natal or transit), with retrograde flags
 * @param swamiNatalSign natal sign of the Kota Swami; if it is Cancer, the Moon and
 *                       the Swami exchange signs and the Moon becomes a secondary Swami
 * @param natalMoonLon   natal Moon longitude — sets Kota Pala from the pada syllable;
 *                       when omitted, Pala falls back to pada 1 of the janma star
 */
export function readKota(
  janma28: number,
  moonSign: Rashi,
  planets: Array<{ id: GrahaId; lonSidereal: number; isRetro?: boolean }>,
  swamiNatalSign?: Rashi,
  natalMoonLon?: number,
): KotaReading {
  const cells = kotaCells(janma28)
  const cellOf = (k: number) => cells.find(c => c.star28 === k)!
  const nine = planets.filter(p => ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'].includes(p.id))
  const lonOf = (id: GrahaId) => nine.find(p => p.id === id)?.lonSidereal
  // Natures: a waning Moon (more than 180° past the Sun) acts as a malefic, and
  // so does a Mercury in the same nakshatra as a natural malefic (as read in
  // M. Imran, "Kota Chakra & Professional Setback", case 4).
  const sun = lonOf('Su')
  const moon = lonOf('Mo')
  const mercury = lonOf('Me')
  const waningMoon = sun != null && moon != null && ((moon - sun + 360) % 360) > 180
  const mercuryWithMalefic = mercury != null && nine.some(p => MALEFIC.has(p.id) && star28Of(p.lonSidereal) === star28Of(mercury))
  const reasonFor = (id: GrahaId): NatureReason | null =>
    id === 'Mo' && waningMoon ? 'waningMoon' : id === 'Me' && mercuryWithMalefic ? 'mercuryWithMalefic' : null

  const placements: KotaPlacement[] = nine.map(p => {
    const star28 = star28Of(p.lonSidereal)
    const cell = cellOf(star28)
    const retro = Boolean(p.isRetro) || p.id === 'Ra' || p.id === 'Ke'
    const effectivePath: KotaPath =
      cell.path === 'stambha' || !retro ? cell.path : cell.path === 'entering' ? 'exiting' : 'entering'
    const natureReason = reasonFor(p.id)
    const malefic = MALEFIC.has(p.id) || natureReason != null
    return { id: p.id, star28, cell, retro, effectivePath, malefic, natureReason, tone: toneOf(malefic, effectivePath, cell.layer) }
  })
  const kotaSwami = SIGN_LORD[moonSign]
  const janmaPada: 1 | 2 | 3 | 4 =
    natalMoonLon != null && star28Of(natalMoonLon) !== ABHIJIT_28 ? padaOf(natalMoonLon) : 1
  const kotaPala =
    natalMoonLon != null
      ? kotaPalaFromLon(natalMoonLon)
      : kotaPalaOf(star27Of(janma28), janmaPada)
  const swamiPlacement = placements.find(p => p.id === kotaSwami) ?? null
  const palaPlacement = placements.find(p => p.id === kotaPala) ?? null
  const swamiLayer = layerOf(swamiPlacement)
  const palaLayer = layerOf(palaPlacement)
  const swamiInside = swamiLayer != null && SWAMI_LAYERS.has(swamiLayer)
  const palaOnPrakara = palaLayer != null && PALA_LAYERS.has(palaLayer)
  const palaInside = palaLayer != null && SWAMI_LAYERS.has(palaLayer)
  const dualRole = kotaSwami === kotaPala
  const maleficIn = placements.some(p => p.malefic && p.effectivePath !== 'exiting')
  const beneficOut = placements.some(p => !p.malefic && p.effectivePath === 'exiting')
  const beneficIn = placements.some(p => !p.malefic && p.effectivePath !== 'exiting')
  const maleficOut = placements.some(p => p.malefic && p.effectivePath === 'exiting')
  const durgaBhanga = maleficIn && beneficOut
  const inStambha = placements.filter(p => p.cell.layer === 'stambha')
  const maleficsInStambha = inStambha.filter(p => p.malefic).length
  const stambhaGuarded = inStambha.some(p => !p.malefic)
  const maleficApproaching = placements.some(p => p.malefic && p.cell.layer === 'madhya' && p.effectivePath === 'entering')
  const stambhaWeak = !stambhaGuarded && (maleficsInStambha >= 2 || (maleficsInStambha === 1 && maleficApproaching))
  const gounaSwami: GrahaId | null =
    kotaSwami !== 'Mo' && swamiNatalSign === 4 ? 'Mo' : null
  return {
    janma28,
    kotaSwami,
    kotaPala,
    janmaPada,
    gounaSwami,
    stambhaWeak,
    stambhaGuarded,
    swamiPlacement,
    palaPlacement,
    swamiInside,
    palaOnPrakara,
    palaInside,
    invertedSeats: !swamiInside && palaInside,
    dualRole,
    dualRoleSeatOk: dualRole ? dualRoleSeatOk(kotaSwami, swamiLayer ?? palaLayer) : null,
    placements,
    durgaBhanga,
    vijaya: !durgaBhanga && beneficIn && maleficOut,
  }
}

export interface NatalKotaReading {
  /** Malefics inside the fort (Stambha or Madhya) at birth: lasting weak points. */
  innerMalefics: GrahaId[]
  /** Of those, the ones running as mahadasha or antardasha lord now. */
  activeNow: GrahaId[]
  /** Benefics in the Stambha at birth: lasting protection. */
  guards: GrahaId[]
}

/**
 * Natal reading of the fort: malefics deep inside show inherent vulnerabilities
 * that tend to surface in their own dashas; benefics in the core protect.
 */
export function readNatalKota(reading: KotaReading, runningDashaLords: GrahaId[] = []): NatalKotaReading {
  const inner = reading.placements.filter(p => p.cell.layer === 'stambha' || p.cell.layer === 'madhya')
  const innerMalefics = inner.filter(p => p.malefic).map(p => p.id)
  return {
    innerMalefics,
    activeNow: innerMalefics.filter(id => runningDashaLords.includes(id)),
    guards: reading.placements.filter(p => p.cell.layer === 'stambha' && !p.malefic).map(p => p.id),
  }
}

export type KotaTwelfthReason = 'twelfthLord' | 'inTwelfth' | 'both'

export interface KotaMoonTwelfthCaution {
  active: boolean
  /** Running dasha lords that touch the 12th from the Moon. */
  lords: GrahaId[]
  reason: KotaTwelfthReason | null
  /** Sign that is 12th from the natal Moon. */
  twelfthSign: Rashi
  twelfthLord: GrahaId
}

/**
 * Lecture overlay: when the fort is already stressed, a running dasha lord that
 * is the 12th lord from the Moon, or sits in the 12th from the Moon, sharpens
 * the health / loss reading.
 */
export function kotaMoonTwelfthCaution(
  moonSign: Rashi,
  grahas: Array<{ id: GrahaId; rashi: Rashi }>,
  runningDashaLords: GrahaId[],
): KotaMoonTwelfthCaution {
  const twelfthSign = ((((moonSign - 2) % 12) + 12) % 12 + 1) as Rashi
  const twelfthLord = SIGN_LORD[twelfthSign]
  const inTwelfth = new Set(
    grahas.filter(g => g.rashi === twelfthSign).map(g => g.id),
  )
  const asLord = runningDashaLords.filter(id => id === twelfthLord)
  const asOccupant = runningDashaLords.filter(id => inTwelfth.has(id))
  const lords = [...new Set([...asLord, ...asOccupant])]
  const hasLord = asLord.length > 0
  const hasOcc = asOccupant.length > 0
  const reason: KotaTwelfthReason | null =
    hasLord && hasOcc ? 'both' : hasLord ? 'twelfthLord' : hasOcc ? 'inTwelfth' : null
  return {
    active: lords.length > 0,
    lords,
    reason,
    twelfthSign,
    twelfthLord,
  }
}
