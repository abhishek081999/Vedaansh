// ─────────────────────────────────────────────────────────────
//  src/lib/engine/satpanchasikaFacts.ts
//  Chart facts for the Ṣaṭpañcāśikā rule engine: sign tables, planet
//  natures, house lookups, aspects and strength. Pure, no React/DB/Redis.
//  Interpretive decisions are listed in SATPANCHASIKA_INTERPRETIVE_NOTES.
// ─────────────────────────────────────────────────────────────

import type { Dignity, GrahaData, GrahaId, LagnaData, Rashi } from '@/types/astrology'
import { RASHI_NAMES } from '@/types/astrology'
import { hasParasharaAspect, wholeSignCount } from './aspects'
import { D9 } from './vargas'
import { SIGN_LORDS } from './krishneeyam'

export type Mobility = 'movable' | 'fixed' | 'dual'
export type Rising = 'head' | 'back' | 'both'

export interface SignInfo {
  mobility: Mobility
  rising: Rising
  strongBy: 'day' | 'night'
  direction: 'East' | 'South' | 'West' | 'North'
}

/** Source sign table (mobility; rises by; strong by; direction). */
export const SIGN_TABLE: Record<Rashi, SignInfo> = {
  1: { mobility: 'movable', rising: 'back', strongBy: 'night', direction: 'East' },
  2: { mobility: 'fixed', rising: 'back', strongBy: 'night', direction: 'South' },
  3: { mobility: 'dual', rising: 'head', strongBy: 'night', direction: 'West' },
  4: { mobility: 'movable', rising: 'back', strongBy: 'night', direction: 'North' },
  5: { mobility: 'fixed', rising: 'head', strongBy: 'day', direction: 'East' },
  6: { mobility: 'dual', rising: 'head', strongBy: 'day', direction: 'South' },
  7: { mobility: 'movable', rising: 'head', strongBy: 'day', direction: 'West' },
  8: { mobility: 'fixed', rising: 'head', strongBy: 'day', direction: 'North' },
  9: { mobility: 'dual', rising: 'back', strongBy: 'night', direction: 'East' },
  10: { mobility: 'movable', rising: 'back', strongBy: 'night', direction: 'South' },
  11: { mobility: 'fixed', rising: 'head', strongBy: 'day', direction: 'West' },
  12: { mobility: 'dual', rising: 'both', strongBy: 'day', direction: 'North' },
}

/** 4.2's list. The sign table also calls Sagittarius "human, then quadruped"; see notes. */
export const HUMAN_SIGNS: Rashi[] = [3, 6, 7, 11]
/** Aries, Taurus, Leo, and Sagittarius (table: "human, then quadruped"). */
export const QUADRUPED_SIGNS: Rashi[] = [1, 2, 5, 9]
/** The table's "watery" signs. Scorpio is listed as reptile only. */
export const WATERY_SIGNS: Rashi[] = [4, 10, 12]

export const SEVEN_GRAHAS: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']
export const KENDRAS = [1, 4, 7, 10]
export const TRIKONAS = [5, 9]

export const GRAHA_LABEL: Partial<Record<GrahaId, string>> = {
  Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury', Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
}

export const PLANET_DIRECTION: Partial<Record<GrahaId, string>> = {
  Ju: 'North-East', Ve: 'South-East', Me: 'North', Mo: 'North-West', Su: 'East', Ma: 'South', Sa: 'West',
}

/** Age signification per Utpala. Mars has none in the source. */
export const PLANET_AGE: Partial<Record<GrahaId, string>> = {
  Ju: 'around 50', Ve: 'around 32', Me: 'around 12', Mo: 'a child', Su: 'around 70', Sa: 'around 80',
}

const NAVAMSA_SPAN = 30 / 9

const DIGNITY_FACTOR: Record<Dignity, number> = {
  exalted: 1.4, moolatrikona: 1.3, own: 1.2, great_friend: 1.1, friend: 1.05,
  neutral: 1, enemy: 0.85, great_enemy: 0.75, debilitated: 0.6,
}

export interface SatpanchasikaChartInput {
  lagnas: Pick<LagnaData, 'ascRashi' | 'ascDegree'>
  grahas: GrahaData[]
  /** Ṣaḍbala from the chart. Without it, strength falls back to dignity. */
  shadbala?: { planets: Record<string, { ratio: number }> }
}

export const grahaName = (id: GrahaId): string => GRAHA_LABEL[id] ?? id
export const signName = (s: number): string => RASHI_NAMES[s as Rashi]

export const ordinal = (n: number): string => {
  const rem = n % 100
  if (rem >= 11 && rem <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}

export const listNames = (ids: GrahaId[]): string => ids.map(grahaName).join(', ')

export function navamsaIndexOf(degreeInSign: number): number {
  return Math.min(9, Math.floor(degreeInSign / NAVAMSA_SPAN) + 1)
}

export function drekkanaIndexOf(degreeInSign: number): 1 | 2 | 3 {
  return (Math.min(2, Math.floor(degreeInSign / 10)) + 1) as 1 | 2 | 3
}

/** Everything a rule may read about the chart. */
export interface ChartFacts {
  lagna: Rashi
  lagnaDegree: number
  lagnaLord: GrahaId
  lagnaInfo: SignInfo
  /** Dual lagna split by degree (2.2): first half like fixed, second like movable. */
  lagnaBehaves: 'movable' | 'fixed'
  navamsaIndex: number
  navamsaSign: Rashi
  navamsaLord: GrahaId
  vargottama: boolean
  drekkanaIndex: 1 | 2 | 3
  elongation: number
  moonWaxing: boolean
  moonFull: boolean
  moonYoung: boolean
  strengthSource: 'shadbala' | 'dignity'
  strongest: GrahaId
  grahas: Record<string, GrahaData>
  house(id: GrahaId): number
  signAt(house: number): Rashi
  lordOf(house: number): GrahaId
  inHouse(house: number): GrahaId[]
  inHouses(houses: number[]): GrahaId[]
  isBenefic(id: GrahaId): boolean
  benefics: GrahaId[]
  malefics: GrahaId[]
  aspects(id: GrahaId, sign: Rashi): boolean
  beneficAspectsOn(sign: Rashi, exclude?: GrahaId): GrahaId[]
  maleficAspectsOn(sign: Rashi, exclude?: GrahaId): GrahaId[]
  strengthFactor(id: GrahaId): number
  isStrong(id: GrahaId): boolean
  navamsaOf(id: GrahaId): Rashi
}

export function buildChartFacts(chart: SatpanchasikaChartInput): ChartFacts {
  const byId: Record<string, GrahaData> = {}
  for (const id of SEVEN_GRAHAS) {
    const g = chart.grahas.find(x => x.id === id)
    if (!g) throw new Error(`Satpanchasika needs all seven grahas; ${id} is missing`)
    byId[id] = g
  }
  const lagna = chart.lagnas.ascRashi
  const lagnaDegree = ((chart.lagnas.ascDegree % 30) + 30) % 30
  const lagnaInfo = SIGN_TABLE[lagna]
  const lagnaBehaves = lagnaInfo.mobility === 'dual'
    ? (lagnaDegree < 15 ? 'fixed' : 'movable')
    : lagnaInfo.mobility

  const navamsaSign = D9(chart.lagnas.ascDegree) as Rashi
  const elongation = ((byId.Mo.totalDegree - byId.Su.totalDegree) + 360) % 360

  const moonWaxing = elongation < 180
  const naturalMalefics: GrahaId[] = moonWaxing ? ['Su', 'Ma', 'Sa'] : ['Su', 'Ma', 'Sa', 'Mo']
  const mercuryJoinedMalefic = naturalMalefics.some(m => byId[m].rashi === byId.Me.rashi)
  const isBenefic = (id: GrahaId): boolean => {
    if (id === 'Ju' || id === 'Ve') return true
    if (id === 'Mo') return moonWaxing
    if (id === 'Me') return !mercuryJoinedMalefic
    return false
  }

  const strengthFactor = (id: GrahaId): number => {
    const ratio = chart.shadbala?.planets?.[id]?.ratio
    if (typeof ratio === 'number' && Number.isFinite(ratio) && ratio > 0) {
      return Math.min(1.5, Math.max(0.5, ratio))
    }
    const g = byId[id]
    return (DIGNITY_FACTOR[g.dignity] ?? 1) * (g.isCombust ? 0.8 : 1)
  }
  const strengthSource = SEVEN_GRAHAS.every(id => typeof chart.shadbala?.planets?.[id]?.ratio === 'number')
    ? 'shadbala' as const
    : 'dignity' as const

  const house = (id: GrahaId) => wholeSignCount(lagna, byId[id].rashi)
  const signAt = (h: number) => (((lagna - 1 + h - 1) % 12) + 1) as Rashi
  const inHouse = (h: number) => SEVEN_GRAHAS.filter(id => house(id) === h)
  const benefics = SEVEN_GRAHAS.filter(isBenefic)
  const malefics = SEVEN_GRAHAS.filter(id => !isBenefic(id))
  const aspects = (id: GrahaId, sign: Rashi) => hasParasharaAspect(byId[id].rashi, id, sign)
  const strongest = SEVEN_GRAHAS.reduce((best, id) => (strengthFactor(id) > strengthFactor(best) ? id : best), SEVEN_GRAHAS[0])

  return {
    lagna,
    lagnaDegree,
    lagnaLord: SIGN_LORDS[lagna],
    lagnaInfo,
    lagnaBehaves,
    navamsaIndex: navamsaIndexOf(lagnaDegree),
    navamsaSign,
    navamsaLord: SIGN_LORDS[navamsaSign],
    vargottama: navamsaSign === lagna,
    drekkanaIndex: drekkanaIndexOf(lagnaDegree),
    elongation,
    moonWaxing,
    // Bright half 10th tithi to dark half 5th tithi, as the existing engine reads "full-bodied".
    moonFull: elongation >= 108 && elongation <= 240,
    moonYoung: elongation <= 72,
    strengthSource,
    strongest,
    grahas: byId,
    house,
    signAt,
    lordOf: h => SIGN_LORDS[signAt(h)],
    inHouse,
    inHouses: hs => SEVEN_GRAHAS.filter(id => hs.includes(house(id))),
    isBenefic,
    benefics,
    malefics,
    aspects,
    beneficAspectsOn: (sign, exclude) => benefics.filter(id => id !== exclude && aspects(id, sign)),
    maleficAspectsOn: (sign, exclude) => malefics.filter(id => id !== exclude && aspects(id, sign)),
    strengthFactor,
    isStrong: id => strengthFactor(id) >= 1,
    navamsaOf: id => D9(byId[id].totalDegree) as Rashi,
  }
}

/** Decisions on ambiguous text, shown beside every reading so none is hidden. */
export const SATPANCHASIKA_INTERPRETIVE_NOTES: Array<{ slokas: string; note: string }> = [
  { slokas: '1.3 and throughout', note: 'Aspect means Parashari whole-sign drishti (all planets 7th; Mars 4, 8; Jupiter 5, 9; Saturn 3, 10). Houses are whole-sign from the rising sign.' },
  { slokas: 'Planet table', note: 'Only the seven planets the text names are judged. Rahu, Ketu and the outer planets are ignored for occupancy, aspect, kendra direction and timing counts.' },
  { slokas: 'Planet table', note: 'The Moon is benefic while waxing (0 to 180° from the Sun) and malefic while waning. Mercury is malefic when in the same sign as the Sun, Mars, Saturn or a waning Moon.' },
  { slokas: '1.5, 6.3', note: 'A "full" Moon is 108 to 240° from the Sun (10th tithi of the bright half to 5th of the dark half). The text gives no range; this one comes from the Ayer reading used by the earlier engine.' },
  { slokas: '1.4', note: 'Pisces rises "both" ways, so it is neither śīrṣodaya nor pṛṣṭhodaya and counts as mixed. "Benefic\'s varga" is read as the rising navāṃśa having a benefic lord.' },
  { slokas: '2.2', note: 'A dual lagna behaves as fixed below 15° and as movable from 15°. Ślokas 2.6 to 2.8 name sign types directly, so they use the sign\'s own type, not this split.' },
  { slokas: '2.3, 3.1, 4.x', note: 'A list of houses means any of them, since one planet holds one house. A list of planets means all of them (2.10, 2.11, 7.2), unless the text says "or" or "singly" (3.5).' },
  { slokas: '3.1, 3.2', note: 'The town\'s defender is read as the party holding the position, and the attacker as the challenger. Polarity flips with the role you pick.' },
  { slokas: '4.2 vs sign table', note: 'Conflict in the source: 4.2 lists four human signs (Libra, Virgo, Gemini, Aquarius), while the sign table also calls Sagittarius "human, then quadruped". The engine follows 4.2 for human signs and counts Sagittarius as quadruped in 2.4.' },
  { slokas: '4.3 vs 1.5', note: 'The Moon in the lagna is "not good" in 4.3 but recovers the lost in 1.5. Each rule is applied only to its own question type, so they never meet.' },
  { slokas: '1.6 vs 1.7', note: 'These can disagree. 1.7 gives the class from the rising navāṃśa; 1.6 is read from the strongest planet aspecting the lagna, 5th or 9th. Both are shown, neither is overruled.' },
  { slokas: '1.7, worked example', note: 'Checked: Leo 12° is the 4th navāṃśa (Cancer), and 1-4-7 in an odd sign gives dhātu, so the worked example agrees with 1.7 and the engine\'s D9.' },
  { slokas: '2.14, 7.7', note: '"Strongest" means the highest ṣaḍbala ratio among the seven planets. If ṣaḍbala is missing, dignity and combustion are used, and the reading says so.' },
  { slokas: '2.17, 5.5', note: 'Counts are inclusive, with the lagna as 1, because the book\'s 5.5 example counts Taurus to Virgo as 5. 2.17 is given the same treatment.' },
  { slokas: '1.2', note: 'The commentary\'s "degrees to the 4th = days" uses the direct planet nearest the 4th sign. Its actual motion is shown beside it, since the two differ widely, for the Moon above all.' },
  { slokas: '7.5', note: 'Male varga means an odd rising navāṃśa, and female an even one. Male planets are the Sun, Mars and Jupiter; female are the Moon and Venus. Mercury and Saturn count as neither.' },
  { slokas: '7.9', note: '"Just left the 7th" means a planet within the first navāṃśa span (3°20\') of the 8th sign.' },
  { slokas: '6.4', note: 'Distance is reported only as navāṃśa steps from the middle and read proportionally to the setting. Yojanas are not converted.' },
  { slokas: '6.5, 7.6, 7.10', note: 'Caste, class and "kind of woman" statements stay in the śloka reference. Readings use only the planet\'s age signification, in neutral words.' },
]
