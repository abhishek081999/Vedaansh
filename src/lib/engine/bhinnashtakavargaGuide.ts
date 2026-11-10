// ─────────────────────────────────────────────────────────────
//  src/lib/engine/bhinnashtakavargaGuide.ts
//  Bhinnashtakavarga (BAV) interpretation — gochar + dasha rules
//  from class transcript. Does not alter bindu math.
// ─────────────────────────────────────────────────────────────

import { toHousesFromLagna } from '@/lib/engine/ashtakavarga'
import type { EngineLang } from '@/lib/engine/lang'
import { fill } from '@/lib/engine/lang'
import {
  BAV_BAND_HI,
  BAV_FINDING_HI,
  BAV_NO_POSITION_HI,
  BAV_SIG_HI,
  BAV_USAGE_HI,
  TRANSIT_NOTE_HI,
  WATCH_NOTE_HI,
  bavStrongLabelHi,
  dashaLordHi,
  debHighHi,
  exaltLowHi,
  excludedHi,
  fatherTimingHi,
  fatherWindowHi,
  marsZeroHi,
  maternalNoteHi,
  strongGocharHi,
  venusSeventhHi,
  weakGocharHi,
} from '@/lib/engine/locale/bhinnashtakavargaGuide.hi'
import { GRAHA_HI, NAKSHATRA_HI } from '@/i18n/jyotish'
import type { AshtakavargaResult, GrahaId, Rashi } from '@/types/astrology'
import { NAKSHATRA_NAMES } from '@/types/astrology'

export type BavStrengthBand = 'critical' | 'weak' | 'borderline' | 'good' | 'strong'

export type FindingSeverity = 'info' | 'positive' | 'caution' | 'critical'

export interface BavFinding {
  id: string
  severity: FindingSeverity
  title: string
  detail: string
}

export interface SignBinduRow {
  rashi: number
  house: number
  bindus: number
}

export interface PlanetBavGuide {
  planet: GrahaId
  name: string
  significations: string[]
  natalHouse: number | null
  natalRashi: number | null
  selfBindus: number | null
  strength: BavStrengthBand | null
  strengthLabel: string
  natalFindings: BavFinding[]
  weakTransitSigns: SignBinduRow[]
  strongTransitSigns: SignBinduRow[]
  transitNotes: string[]
}

export interface FatherTimingResult {
  lagnaTenthBindus: number
  sunNinthBindus: number
  sum: number
  adjusted: number
  targetNakshatraIndex: number
  targetNakshatraName: string
  targetRashi: number
  trineRashis: number[]
  note: string
}

export interface MaternalRelativeCount {
  houseFromMoon: number
  rashi: number
  mamaPoints: number
  mausiPoints: number
  excluded: string[]
  note: string
}

export interface TransitActivationRow {
  planet: GrahaId
  transitRashi: number
  transitHouse: number
  natalBav: number
  strength: BavStrengthBand
  domains: string
  note: string
}

export interface BhinnashtakavargaGuideResult {
  usageNote: string
  planets: PlanetBavGuide[]
  fatherTiming: FatherTimingResult | null
  maternalRelatives: MaternalRelativeCount | null
  transitWatch: TransitActivationRow[]
  crossFindings: BavFinding[]
}

export interface BhinnashtakavargaGuideInput {
  ashtakavarga: AshtakavargaResult
  ascRashi: number
  grahas: Array<{
    id: string
    rashi: number
    nakshatraIndex?: number
    pada?: number
    dignity?: string
  }>
  /** Current transit grahas (optional) */
  transitGrahas?: Array<{ id: string; rashi: number }>
  /** Current mahadasha lord */
  dashaLord?: string
  /** Moon birth nakshatra 0–26 */
  janmaNakshatraIndex?: number
  /** Moon pada 1–4 */
  janmaPada?: number
  /** Display language. Omitted and 'en' keep the English sentences. */
  lang?: EngineLang
}

function show(lang: EngineLang, en: string, hi: string): string {
  return lang === 'hi' ? hi : en
}

function gname(id: string, lang: EngineLang): string {
  if (lang !== 'hi') return PLANET_NAMES[id as keyof typeof PLANET_NAMES] ?? id
  return GRAHA_HI[id as GrahaId] ?? id
}

function localizeFindings(
  findings: BavFinding[],
  lang: EngineLang,
  vars: Record<string, string | number> = {},
): BavFinding[] {
  if (lang !== 'hi') return findings
  return findings.map((row) => {
    const hi = BAV_FINDING_HI[row.id]
    if (!hi) return row
    return { ...row, title: hi.title, detail: fill(hi.detail, vars) }
  })
}

const PLANET_ORDER = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const

const PLANET_NAMES: Record<(typeof PLANET_ORDER)[number], string> = {
  Su: 'Sun',
  Mo: 'Moon',
  Ma: 'Mars',
  Me: 'Mercury',
  Ju: 'Jupiter',
  Ve: 'Venus',
  Sa: 'Saturn',
}

const SIGNIFICATIONS: Record<(typeof PLANET_ORDER)[number], string[]> = {
  Su: ['Health', 'Personality', 'Leadership', 'Father', 'Government', 'Authority'],
  Mo: ['Mind', 'Emotions', 'Money flow', 'Mother', 'Fame', 'Daily mood'],
  Ma: ['Initiative', 'Courage', 'Property', 'Siblings', 'Startups / action'],
  Me: ['Education', 'Career intellect', 'Curiosity', 'Arts & maths', 'Speech'],
  Ju: ['Wealth', 'Dharma', 'Wisdom', 'Children', 'Husband (for females)', 'Teaching'],
  Ve: ['Marriage', 'Relationships', 'Luxury', 'Prosperity', 'Bhakti', 'Partner'],
  Sa: ['Longevity', 'Labor', 'Land / agriculture', 'Growth pace', 'Neighbors', 'Karma'],
}

/** Male grahas for maternal uncle count; female for maternal aunt. */
const MALE_CONTRIBUTORS = ['Su', 'Ju', 'Ma'] as const
const FEMALE_CONTRIBUTORS = ['Mo', 'Ve'] as const

const RASHI_LORD: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo',
  5: 'Su', 6: 'Me', 7: 'Ve', 8: 'Ma',
  9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const DEBILITATION: Partial<Record<GrahaId, number>> = {
  Su: 7, Mo: 8, Ma: 4, Me: 12, Ju: 10, Ve: 6, Sa: 1,
}

const ENEMY_SIGNS: Partial<Record<GrahaId, number[]>> = {
  Su: [2, 7], // Taurus enemy / Libra debilitation context
  Mo: [],
  Ma: [4],
  Me: [],
  Ju: [10],
  Ve: [6],
  Sa: [1, 5],
}

function houseOf(rashi: number, ascRashi: number): number {
  return ((rashi - ascRashi + 12) % 12) + 1
}

function rashiOfHouse(house: number, ascRashi: number): number {
  return ((ascRashi - 1 + house - 1) % 12) + 1
}

function findPlanet(
  grahas: BhinnashtakavargaGuideInput['grahas'],
  id: string,
) {
  return grahas.find((g) => g.id === id) ?? null
}

export function rateBavStrength(bindus: number, lang: EngineLang = 'en'): {
  band: BavStrengthBand
  label: string
} {
  if (lang === 'hi') {
    if (bindus <= 0) return { band: 'critical', label: BAV_BAND_HI.critical }
    if (bindus <= 3) return { band: 'weak', label: BAV_BAND_HI.weak }
    if (bindus === 4) return { band: 'borderline', label: BAV_BAND_HI.borderline }
    if (bindus === 5) return { band: 'good', label: BAV_BAND_HI.good }
    return { band: 'strong', label: bavStrongLabelHi(bindus) }
  }
  if (bindus <= 0) {
    return { band: 'critical', label: 'Zero bindus (strength points) — no strength in this sign' }
  }
  if (bindus <= 3) {
    return { band: 'weak', label: 'Below 4 — strength not accepted; poor gochar/dasha results' }
  }
  if (bindus === 4) {
    return { band: 'borderline', label: '4 — minimum acceptable (borderline)' }
  }
  if (bindus === 5) {
    return { band: 'good', label: '5 — good functional strength' }
  }
  return { band: 'strong', label: `${bindus} — strong (6+ ideal class strength)` }
}

/** Align Interpretation tab labels with class thresholds. */
export function bavTransitQualityDetailed(
  bavPoints: number,
): 'weak' | 'borderline' | 'good' | 'excellent' {
  const { band } = rateBavStrength(bavPoints)
  if (band === 'strong') return 'excellent'
  if (band === 'good') return 'good'
  if (band === 'borderline') return 'borderline'
  return 'weak'
}

function bavFor(
  av: AshtakavargaResult,
  planet: string,
  rashi: number,
): number {
  return av.bav[planet]?.bindus[rashi - 1] ?? 0
}

function nakshatraFromCount(count: number, lang: EngineLang = 'en'): { index: number; name: string; rashi: number } {
  // Count Ashwini as #1; remainder after 27 wraps
  let n = count
  while (n > 27) n -= 27
  if (n <= 0) n = ((n % 27) + 27) % 27 || 27
  const index = n - 1 // 0-based
  const name = lang === 'hi'
    ? (NAKSHATRA_HI[index] ?? `नक्षत्र ${n}`)
    : (NAKSHATRA_NAMES[index] ?? `Nakshatra ${n}`)
  // Each nakshatra spans 13°20'; 4 pada per sign → 9 nakshatras per 4 signs… standard: floor(index/2.25) style
  // 27 nakshatras / 12 signs → rashi = floor(index * 12 / 27) + 1, but classical: each sign has 2.25 nakshatras
  const rashi = (Math.floor((index * 4) / 9) % 12) + 1
  return { index, name, rashi }
}

/** Trikona signs from a rashi: 1st, 5th, 9th. */
function trinesOf(rashi: number): number[] {
  return [
    rashi,
    ((rashi - 1 + 4) % 12) + 1,
    ((rashi - 1 + 8) % 12) + 1,
  ]
}

/**
 * Sun father-timing method from class:
 * (BAV of Lagna's 10th) + (BAV of 9th from Sun).
 * If > 27 subtract 27. Count that many nakshatras from Ashwini.
 * When Saturn transits trines of that nakshatra's sign → father crisis window.
 */
export function computeFatherTimingFromSunBav(
  av: AshtakavargaResult,
  ascRashi: number,
  sunRashi: number,
  lang: EngineLang = 'en',
): FatherTimingResult {
  const lagnaTenthRashi = rashiOfHouse(10, ascRashi)
  const sunNinthRashi = ((sunRashi - 1 + 8) % 12) + 1
  const lagnaTenthBindus = bavFor(av, 'Su', lagnaTenthRashi)
  const sunNinthBindus = bavFor(av, 'Su', sunNinthRashi)
  let sum = lagnaTenthBindus + sunNinthBindus
  let adjusted = sum
  if (adjusted > 27) adjusted -= 27
  const target = nakshatraFromCount(Math.max(1, adjusted), lang)
  const trineRashis = trinesOf(target.rashi)
  return {
    lagnaTenthBindus,
    sunNinthBindus,
    sum,
    adjusted,
    targetNakshatraIndex: target.index,
    targetNakshatraName: target.name,
    targetRashi: target.rashi,
    trineRashis,
    note: lang === 'hi'
      ? fatherTimingHi({
          lagnaTenth: lagnaTenthBindus,
          sunNinth: sunNinthBindus,
          sum,
          adjusted,
          nakshatraIndex: target.index,
        })
      : `Add Sun BAV of 10th-from-Lagna (${lagnaTenthBindus}) + 9th-from-Sun (${sunNinthBindus}) = ${sum}` +
        (sum > 27 ? ` → ${adjusted} after −27` : '') +
        `. ${adjusted}th nakshatra from Ashwini = ${target.name}. ` +
        `Saturn gochar on trines of that sign (or its nakshatra) marks a critical father-health window — confirm with dasha.`,
  }
}

/**
 * Count maternal uncles/aunts from Moon's 4th house BAV contributors.
 * Exclude debilitated or enemy grahas for that sign. Male → mama, Female → mausi.
 */
export function countMaternalRelatives(
  av: AshtakavargaResult,
  moonRashi: number,
  grahas: BhinnashtakavargaGuideInput['grahas'],
  lang: EngineLang = 'en',
): MaternalRelativeCount {
  const fourthRashi = ((moonRashi - 1 + 3) % 12) + 1
  const houseFromMoon = 4
  const excluded: string[] = []
  let mamaPoints = 0
  let mausiPoints = 0

  const consider = (pid: GrahaId, gender: 'male' | 'female') => {
    const pts = bavFor(av, pid, fourthRashi)
    if (pts <= 0) return
    const g = findPlanet(grahas, pid)
    const isDeb = g?.dignity === 'debilitated' || DEBILITATION[pid] === fourthRashi
    const isEnemy = (ENEMY_SIGNS[pid] ?? []).includes(fourthRashi)
    if (isDeb || isEnemy) {
      excluded.push(lang === 'hi'
        ? excludedHi(gname(pid, lang), isDeb ? 'debilitated' : 'enemy')
        : `${PLANET_NAMES[pid as keyof typeof PLANET_NAMES] ?? pid} (${isDeb ? 'debilitated' : 'enemy'})`)
      return
    }
    if (gender === 'male') mamaPoints += pts
    else mausiPoints += pts
  }

  for (const p of MALE_CONTRIBUTORS) consider(p, 'male')
  for (const p of FEMALE_CONTRIBUTORS) consider(p, 'female')

  return {
    houseFromMoon,
    rashi: fourthRashi,
    mamaPoints,
    mausiPoints,
    excluded,
    note: lang === 'hi'
      ? maternalNoteHi(excluded)
      : `From Moon, 4th house points (male grahas → maternal uncles, female → maternal aunts). ` +
        `Debilitated/enemy contributors excluded` +
        (excluded.length ? `: ${excluded.join(', ')}` : '') +
        `. Indicative count — verify with family facts.`,
  }
}

function sunNatalFindings(
  house: number,
  rashi: number,
  bindus: number,
  janmaNakshatraIndex: number | undefined,
  janmaPada: number | undefined,
  lang: EngineLang = 'en',
): BavFinding[] {
  const out: BavFinding[] = []
  const { band } = rateBavStrength(bindus)

  if (band === 'strong') {
    out.push({
      id: 'su-strong',
      severity: 'positive',
      title: 'Strong Sun BAV where placed',
      detail: `${bindus} bindus (strength points) — class strength for health, personality, and leadership significations during Sun dasha/gochar.`,
    })
  } else if (band === 'weak' || band === 'critical') {
    out.push({
      id: 'su-weak',
      severity: 'caution',
      title: 'Weak Sun BAV in natal sign',
      detail: `Below 4 bindus (strength points) — exaltation/placement alone does not confer strength for gochar or dasha results.`,
    })
  }

  // Health caution: Sun in Lagna (Aries/Libra) or Capricorn with ≤3
  if (
    bindus <= 3 &&
    ((house === 1 && (rashi === 1 || rashi === 7)) || rashi === 10 || (house === 1 && rashi === 2))
  ) {
    out.push({
      id: 'su-heart',
      severity: 'critical',
      title: 'Sun health caution in dasha',
      detail:
        'Sun in lagna (esp. Aries/Libra), Taurus (maraka context), or Capricorn with ≤3 BAV — guard heart/vitality in Sun mahadasha or antardasha + matching gochar.',
    })
  }

  if (house === 10 && bindus >= 5) {
    out.push({
      id: 'su-h10-rajayoga',
      severity: 'positive',
      title: '10th-house Sun with 5+ BAV',
      detail: 'Rajayoga-class results likely; full in mahadasha, smaller rajayoga fruits in antardasha.',
    })
  }

  if (house === 5) {
    if (bindus >= 6) {
      out.push({
        id: 'su-h5-power',
        severity: 'positive',
        title: '5th-house Sun with 6–7 BAV',
        detail: 'Authority roles (minister/ambassador class) possible when dasha activates.',
      })
    } else if (bindus < 4) {
      out.push({
        id: 'su-h5-children',
        severity: 'caution',
        title: 'Weak Sun in 5th',
        detail: 'During Sun periods, children may need more attention: their health and safety, or stress around pregnancy. Confirm with the full chart.',
      })
    }
  }

  if ([3, 6, 10, 11].includes(house) && bindus >= 4) {
    out.push({
      id: 'su-upachaya',
      severity: 'positive',
      title: 'Sun in upachaya (growth houses: 3, 6, 10, 11) with workable BAV',
      detail: '3/6/10/11 — effort-growth houses. Free of difficult influences Sun here tends to deliver positive results with work.',
    })
  }

  if (house === 2 && bindus > 5) {
    out.push({
      id: 'su-h2',
      severity: 'positive',
      title: 'Sun in 2nd with 5+ BAV',
      detail: 'Strong speech/resources support when Sun periods run.',
    })
  }

  // Nakshatra father rules (all conditions must match)
  const isAshlesha4 = janmaNakshatraIndex === 8 && janmaPada === 4
  const isMoola1 = janmaNakshatraIndex === 18 && janmaPada === 1
  if ((isAshlesha4 || isMoola1) && (house === 1 || house === 5) && bindus <= 2) {
    out.push({
      id: 'su-nak-father',
      severity: 'critical',
      title: 'Combined father-sensitive pattern',
      detail:
        'Birth in Ashlesha 4th or Moola 1st pada + Sun in lagna/5th with ≤2 BAV — classical father-difficulty pattern. Requires all conditions; never use alone.',
    })
  }

  const pada = janmaPada ?? 0
  const nIdx = janmaNakshatraIndex ?? -1
  const oddFirstMeet =
    ((nIdx === 0 || nIdx === 26) && (pada === 2 || pada === 3)) ||
    ((nIdx === 8 || nIdx === 17) && pada === 4)
  if (oddFirstMeet && bindus <= 2) {
    out.push({
      id: 'su-first-meet',
      severity: 'caution',
      title: 'Father first-meeting irregularity pattern',
      detail:
        'Revati/Ashwini 2–3 or Ashlesha/Jyeshtha last pada + Sun BAV ≤2 — first father meeting may be delayed/hospital/travel (not necessarily life-threatening).',
    })
  }

  if (bindus === 0) {
    out.push({
      id: 'su-zero-self',
      severity: 'caution',
      title: 'Zero BAV in Sun’s own sign',
      detail: 'When Sun gochars its natal sign: month of financial strain, illness risk, or government friction.',
    })
  }

  return localizeFindings(out, lang, { bindus })
}

function moonNatalFindings(house: number, bindus: number, lang: EngineLang = 'en'): BavFinding[] {
  const out: BavFinding[] = []
  if (bindus >= 8) {
    out.push({
      id: 'mo-fame',
      severity: 'positive',
      title: 'Moon self-BAV 8',
      detail: 'Exceptional Moon strength — fame/public recognition tendency when Moon periods run.',
    })
  } else if (bindus >= 5) {
    out.push({
      id: 'mo-strong',
      severity: 'positive',
      title: 'Moon BAV 5–7',
      detail: 'Class range seen in skilled/artistic charts — mind and money flow supported.',
    })
  } else if (bindus < 4) {
    out.push({
      id: 'mo-weak',
      severity: 'caution',
      title: 'Weak Moon BAV',
      detail: 'Below 4 — mental restlessness and uneven results in Moon gochar/dasha until supported by aspects/chart strength.',
    })
  }

  if ([1, 4, 5, 7, 9, 10].includes(house) && bindus >= 6) {
    out.push({
      id: 'mo-kendra-trikona',
      severity: 'positive',
      title: 'Moon in kendra (angular houses: 1, 4, 7, 10)/trikona (trine houses: 1, 5, 9) with 6–8 BAV',
      detail: 'Education, scholarship, and academic excellence well indicated.',
    })
  }

  return localizeFindings(out, lang)
}

function marsNatalFindings(house: number, bindus: number, av: AshtakavargaResult, ascRashi: number, lang: EngineLang = 'en'): BavFinding[] {
  const out: BavFinding[] = []
  if (bindus >= 5) {
    out.push({
      id: 'ma-action',
      severity: 'positive',
      title: 'Mars initiative supported',
      detail: 'Action, courage, and startup-style risk-taking can manifest in Mars periods.',
    })
  } else if (bindus < 4) {
    out.push({
      id: 'ma-low-init',
      severity: 'info',
      title: 'Low Mars BAV where placed',
      detail: 'Initiative in that life area is harder — not the same as aggression (aggression comes from natal difficult influences, not low BAV alone).',
    })
  }

  // Zero-point signs → Saturn transit bad for brothers
  const zeroSigns: number[] = []
  for (let r = 1; r <= 12; r++) {
    if (bavFor(av, 'Ma', r) === 0) zeroSigns.push(r)
  }
  if (zeroSigns.length) {
    const places = zeroSigns.map((r) => `R${r}/H${houseOf(r, ascRashi)}`).join(', ')
    const hi = marsZeroHi(places)
    out.push({
      id: 'ma-sibling-sa',
      severity: 'caution',
      title: show(lang, 'Mars zero-bindu signs', hi.title),
      detail: show(lang, `When Saturn gochars ${places} and dasha supports — difficult period for brothers. Time with the person’s dasha.`, hi.detail),
    })
  }

  return localizeFindings(out, lang)
}

function mercuryNatalFindings(bindus: number, lang: EngineLang = 'en'): BavFinding[] {
  if (bindus >= 6) {
    return localizeFindings([{
      id: 'me-strong',
      severity: 'positive',
      title: 'Strong Mercury BAV',
      detail: 'Education, career intellect, arts and mathematics all supported in Mercury periods.',
    }], lang)
  }
  if (bindus < 4) {
    return localizeFindings([{
      id: 'me-weak',
      severity: 'caution',
      title: 'Weak Mercury BAV',
      detail: 'Curiosity dulls; mental peace may dip during Mercury gochar in low-scoring signs.',
    }], lang)
  }
  return []
}

function jupiterNatalFindings(house: number, bindus: number, lang: EngineLang = 'en'): BavFinding[] {
  const out: BavFinding[] = []
  if (house === 1 && bindus >= 6) {
    out.push({
      id: 'ju-lagna',
      severity: 'positive',
      title: 'Jupiter in lagna with strong BAV',
      detail: 'Wisdom, teaching sharpness, and expansion of Jupiter themes in dasha/gochar from lagna.',
    })
  }
  if (bindus >= 6) {
    out.push({
      id: 'ju-strong',
      severity: 'positive',
      title: 'Strong Jupiter BAV where placed',
      detail: 'Wealth, dharma, children, and wisdom significations strengthen when Jupiter transits high-scoring signs.',
    })
  } else if (bindus <= 3) {
    out.push({
      id: 'ju-weak',
      severity: 'caution',
      title: 'Weak Jupiter BAV in natal sign',
      detail: 'Even if Jupiter is well-placed by dignity, low BAV limits gochar/dasha delivery until high-score signs are transited.',
    })
  }
  out.push({
    id: 'ju-sign-lord',
    severity: 'info',
    title: 'Always check Jupiter’s sign lord',
    detail: 'Jupiter results also depend on the strength of the lord of the sign where Jupiter sits.',
  })
  return localizeFindings(out, lang)
}

function venusNatalFindings(house: number, bindus: number, av: AshtakavargaResult, ascRashi: number, lang: EngineLang = 'en'): BavFinding[] {
  const out: BavFinding[] = []
  if (bindus >= 5) {
    out.push({
      id: 've-strong',
      severity: 'positive',
      title: 'Venus strength supported',
      detail: 'Marriage, luxury, and relationship themes can deliver in Venus dasha/gochar.',
    })
  }
  const h7Rashi = rashiOfHouse(7, ascRashi)
  const h7Pts = bavFor(av, 'Ve', h7Rashi)
  if (h7Pts <= 3) {
    const hi = venusSeventhHi(h7Pts)
    out.push({
      id: 've-h7-low',
      severity: 'caution',
      title: show(lang, 'Low Venus BAV to 7th sign', hi.title),
      detail: show(
        lang,
        `When Venus gochars 7th (${h7Pts} bindus (strength points)) — relationship friction or public-image dips possible (~24–28 days / sign; longer if retrograde).`,
        hi.detail,
      ),
    })
  }
  if (house === 8 && bindus <= 4) {
    out.push({
      id: 've-h8',
      severity: 'info',
      title: 'Venus in 8th — average BAV',
      detail: 'Results more through transformation/shared resources; watch 7th-sign gochar for relationship timing.',
    })
  }
  return localizeFindings(out, lang)
}

function saturnNatalFindings(
  house: number,
  bindus: number,
  av: AshtakavargaResult,
  ascRashi: number,
  grahas: BhinnashtakavargaGuideInput['grahas'],
  lang: EngineLang = 'en',
): BavFinding[] {
  const out: BavFinding[] = []
  if (bindus >= 5) {
    out.push({
      id: 'sa-strong',
      severity: 'positive',
      title: 'Saturn BAV 5–8 where placed',
      detail: 'Excellent Saturn delivery in dasha/gochar for that house’s domains.',
    })
  } else if (bindus <= 3) {
    out.push({
      id: 'sa-weak-natal',
      severity: 'caution',
      title: 'Saturn ≤3 BAV in natal sign',
      detail: 'Saturn periods here stress health, finance, labor, property, and neighbors — always correlate Moon status.',
    })
  }

  // Foreign death rule (1–3 self bindus) — informational classical
  if (bindus >= 1 && bindus <= 3) {
    out.push({
      id: 'sa-away-death',
      severity: 'info',
      title: 'Classical: Saturn 1–3 self-bindus',
      detail: 'Some traditions link end-of-life away from current residence (not necessarily foreign country). Soft indicator only.',
    })
  }

  const tenthLord = RASHI_LORD[rashiOfHouse(10, ascRashi)]
  const saLinkedToTenth = tenthLord === 'Sa'

  if (house === 10 && bindus >= 2 && bindus <= 3) {
    out.push({
      id: 'sa-foreign-go',
      severity: 'info',
      title: 'Saturn in 10th with 2–3 BAV',
      detail: 'Foreign travel often compelled rather than joyful choice — confirm with full chart and 10th-lord links.',
    })
  }

  // Class rule: Saturn 3+ BAV with 10th-lord connection (incl. Sa as 10th lord)
  // even in 3/6/11 → king-like living.
  if (saLinkedToTenth && bindus >= 3 && [3, 6, 10, 11].includes(house)) {
    out.push({
      id: 'sa-king-life',
      severity: 'positive',
      title: 'Saturn–10th link with 3+ BAV',
      detail: 'Saturn connected to 10th lordship with workable BAV (incl. 3/6/10/11) — raja-like living tendency regardless of house alone. Confirm with full chart.',
    })
  }

  // Sade sati relief: trikona lord is Moon or Saturn
  const trikonaLords = [1, 5, 9].map((h) => RASHI_LORD[rashiOfHouse(h, ascRashi)])
  if (trikonaLords.some((l) => l === 'Mo' || l === 'Sa')) {
    out.push({
      id: 'sa-sadesati-soft',
      severity: 'positive',
      title: 'Sade Sati softener',
      detail: '1st/5th/9th lord is Moon or Saturn — Sade Sati typically brings fewer problems.',
    })
  }

  // Zero to 2nd house
  const h2Rashi = rashiOfHouse(2, ascRashi)
  if (bavFor(av, 'Sa', h2Rashi) === 0) {
    out.push({
      id: 'sa-h2-zero',
      severity: 'critical',
      title: 'Saturn gave 0 to 2nd house',
      detail: 'During Saturn dasha + Saturn gochar of 2nd — family loss risk classically noted. Handle with utmost care and full chart confirmation.',
    })
  }

  out.push({
    id: 'sa-check-moon',
    severity: 'info',
    title: 'Always pair Saturn BAV with Moon',
    detail: 'Weak Saturn + weak Moon compounds problems; strong Moon mitigates Saturn stress.',
  })

  return localizeFindings(out, lang)
}

function planetTransitNotes(
  planet: (typeof PLANET_ORDER)[number],
  weak: SignBinduRow[],
  strong: SignBinduRow[],
  lang: EngineLang = 'en',
): string[] {
  const notes: string[] = []
  const weakPlaces = weak.map((w) => `H${w.house}:${w.bindus}`).join(', ')
  const strongPlaces = strong.slice(0, 3).map((s) => `H${s.house} (${s.bindus})`).join(', ')
  if (weak.length) {
    notes.push(show(
      lang,
      `Gochar through low-BAV signs (${weakPlaces}) + matching dasha/AD → poor results for ${PLANET_NAMES[planet]} significations.`,
      weakGocharHi(weakPlaces, gname(planet, 'hi')),
    ))
  }
  if (strong.length) {
    notes.push(show(
      lang,
      `Best gochar windows: ${strongPlaces} — prefer muhurta / important work then.`,
      strongGocharHi(strongPlaces),
    ))
  }
  if (planet === 'Mo') {
    notes.push(show(lang, 'Moon moves fastest — use daily: high-BAV sign = mentally good day; 0–2 = difficult day. Useful for muhurta.', TRANSIT_NOTE_HI.moon))
  }
  if (planet === 'Ve') {
    notes.push(show(lang, 'Venus stays ~24–28 days/sign (up to ~120 days if retrograde). Full 12-sign cycle ~224d 7h.', TRANSIT_NOTE_HI.venus))
  }
  if (planet === 'Su') {
    notes.push(show(lang, 'Event activation often within ±1° of natal Sun degree; confirm exact timing with Moon degree.', TRANSIT_NOTE_HI.sun))
  }
  if (planet === 'Ju') {
    notes.push(show(lang, 'Chintamani tip: Jupiter gochar over natal Jupiter’s sign (golik) favors conception timing — confirm medically.', TRANSIT_NOTE_HI.jupiter))
  }
  return notes
}

function buildPlanetGuide(
  planet: (typeof PLANET_ORDER)[number],
  input: BhinnashtakavargaGuideInput,
): PlanetBavGuide {
  const { ashtakavarga: av, ascRashi, grahas } = input
  const lang = input.lang ?? 'en'
  const g = findPlanet(grahas, planet)
  const natalRashi = g?.rashi ?? null
  const natalHouse = natalRashi != null ? houseOf(natalRashi, ascRashi) : null
  const selfBindus = natalRashi != null ? bavFor(av, planet, natalRashi) : null
  const strengthInfo = selfBindus != null ? rateBavStrength(selfBindus, lang) : null

  const rows: SignBinduRow[] = []
  for (let r = 1; r <= 12; r++) {
    rows.push({
      rashi: r,
      house: houseOf(r, ascRashi),
      bindus: bavFor(av, planet, r),
    })
  }
  const weakTransitSigns = rows.filter((r) => r.bindus <= 3).sort((a, b) => a.bindus - b.bindus)
  const strongTransitSigns = rows.filter((r) => r.bindus >= 6).sort((a, b) => b.bindus - a.bindus)

  let natalFindings: BavFinding[] = []
  if (natalHouse != null && natalRashi != null && selfBindus != null) {
    switch (planet) {
      case 'Su':
        natalFindings = sunNatalFindings(
          natalHouse,
          natalRashi,
          selfBindus,
          input.janmaNakshatraIndex ?? findPlanet(grahas, 'Mo')?.nakshatraIndex,
          input.janmaPada ?? findPlanet(grahas, 'Mo')?.pada,
          lang,
        )
        break
      case 'Mo':
        natalFindings = moonNatalFindings(natalHouse, selfBindus, lang)
        break
      case 'Ma':
        natalFindings = marsNatalFindings(natalHouse, selfBindus, av, ascRashi, lang)
        break
      case 'Me':
        natalFindings = mercuryNatalFindings(selfBindus, lang)
        break
      case 'Ju':
        natalFindings = jupiterNatalFindings(natalHouse, selfBindus, lang)
        break
      case 'Ve':
        natalFindings = venusNatalFindings(natalHouse, selfBindus, av, ascRashi, lang)
        break
      case 'Sa':
        natalFindings = saturnNatalFindings(natalHouse, selfBindus, av, ascRashi, grahas, lang)
        break
    }

    // Golden rule: exaltation means little without BAV; debilitated + high BAV can still deliver.
    const dig = g?.dignity
    if (dig === 'exalted' && selfBindus < 4) {
      const hi = exaltLowHi(planet, selfBindus)
      natalFindings.push({
        id: `${planet.toLowerCase()}-exalt-low-bav`,
        severity: 'caution',
        title: show(lang, 'Exalted but low BAV', hi.title),
        detail: show(lang, `${PLANET_NAMES[planet]} is exalted yet only ${selfBindus} self-BAV — traditional teaching: exalted with low Ashtakavarga is weaker in dasha/gochar than a debilitated planet with high bindus (strength points).`, hi.detail),
      })
    } else if (dig === 'debilitated' && selfBindus >= 6) {
      const hi = debHighHi(planet, selfBindus)
      natalFindings.push({
        id: `${planet.toLowerCase()}-deb-high-bav`,
        severity: 'positive',
        title: show(lang, 'Debilitated but strong BAV', hi.title),
        detail: show(lang, `${PLANET_NAMES[planet]} is debilitated yet has ${selfBindus} self-BAV — can still deliver strong gochar/dasha results in this sign despite neecha dignity.`, hi.detail),
      })
    }
  }

  return {
    planet,
    name: gname(planet, lang),
    significations: lang === 'hi' ? BAV_SIG_HI[planet] : SIGNIFICATIONS[planet],
    natalHouse,
    natalRashi,
    selfBindus,
    strength: strengthInfo?.band ?? null,
    strengthLabel: strengthInfo?.label ?? show(lang, 'Planet position unavailable', BAV_NO_POSITION_HI),
    natalFindings,
    weakTransitSigns,
    strongTransitSigns,
    transitNotes: planetTransitNotes(planet, weakTransitSigns, strongTransitSigns, lang),
  }
}

function crossChartFindings(input: BhinnashtakavargaGuideInput): BavFinding[] {
  const { ashtakavarga: av, ascRashi, grahas, dashaLord } = input
  const lang = input.lang ?? 'en'
  const out: BavFinding[] = []

  // Low SAV/BAV 5th & 9th from Lagna or Sun — father caution
  const sun = findPlanet(grahas, 'Su')
  if (sun) {
    const checkFrom = (originRashi: number, label: string) => {
      const h5 = ((originRashi - 1 + 4) % 12) + 1
      const h9 = ((originRashi - 1 + 8) % 12) + 1
      const p5 = bavFor(av, 'Su', h5)
      const p9 = bavFor(av, 'Su', h9)
      if (p5 <= 3 || p9 <= 3) {
        const hi = fatherWindowHi(label === 'Lagna' ? 'लग्न' : 'सूर्य', p5, p9)
        out.push({
          id: `father-59-${label}`,
          severity: 'caution',
          title: show(lang, `Low Sun BAV in 5th/9th from ${label}`, hi.title),
          detail: show(lang, `5th=${p5}, 9th=${p9}. Softly difficult planet for father. Rahu (~1.5y) or Saturn (~2.5y) gochar there worsens; Mercury transit can raise hemorrhage/paralysis risk classically.`, hi.detail),
        })
      }
    }
    checkFrom(ascRashi, 'Lagna')
    checkFrom(sun.rashi, 'Sun')
  }

  // Sun + 2 or more planets + 5+ BAV
  if (sun) {
    const withSun = grahas.filter(
      (g) => g.rashi === sun.rashi && PLANET_ORDER.includes(g.id as (typeof PLANET_ORDER)[number]),
    )
    const suBav = bavFor(av, 'Su', sun.rashi)
    if (withSun.length >= 3 && suBav >= 5) {
      out.push({
        id: 'su-conjunction-strong',
        severity: 'positive',
        title: 'Sun with 2+ planets & 5+ BAV',
        detail: 'Excellent combined results across shared significations in Sun periods.',
      })
    }
  }

  if (dashaLord && PLANET_ORDER.includes(dashaLord as (typeof PLANET_ORDER)[number])) {
    const lord = dashaLord as (typeof PLANET_ORDER)[number]
    const g = findPlanet(grahas, lord)
    if (g) {
      const pts = bavFor(av, lord, g.rashi)
      const enInfo = rateBavStrength(pts)
      const hiInfo = dashaLordHi(gname(lord, 'hi'), pts, rateBavStrength(pts, 'hi').label)
      const { band } = enInfo
      out.push({
        id: 'current-dasha-bav',
        severity: band === 'strong' || band === 'good' ? 'positive' : band === 'borderline' ? 'info' : 'caution',
        title: show(lang, `Current dasha lord ${PLANET_NAMES[lord]} BAV`, hiInfo.title),
        detail: show(lang, `Natal sign BAV ${pts} — ${enInfo.label}. Bhinnashtakavarga is for dasha/AD delivery, not general prediction.`, hiInfo.detail),
      })
    }
  }

  // House SAV context reminder
  const houseSav = toHousesFromLagna(av.sav, ascRashi as Rashi)
  const lowHouses = houseSav
    .map((v, i) => ({ h: i + 1, v }))
    .filter((x) => x.v <= 23)
  const lowList = lowHouses.map((x) => x.h).join(', ')
  if (lowHouses.length) {
    out.push({
      id: 'sav-low-houses',
      severity: 'info',
      title: 'Sarvashtakavarga weak houses',
      detail: `SAV ≤23 in house ${lowList} — use SAV for general prediction; use BAV for gochar timing into those signs.`,
    })
  }

  return localizeFindings(out, lang, { houses: lowList })
}

function buildTransitWatch(input: BhinnashtakavargaGuideInput): TransitActivationRow[] {
  const transit = input.transitGrahas
  if (!transit?.length) return []
  const { ashtakavarga: av, ascRashi } = input
  const lang = input.lang ?? 'en'
  const rows: TransitActivationRow[] = []

  for (const p of PLANET_ORDER) {
    const tg = transit.find((g) => g.id === p)
    if (!tg?.rashi) continue
    const natalBav = bavFor(av, p, tg.rashi)
    const { band } = rateBavStrength(natalBav)
    const house = houseOf(tg.rashi, ascRashi)
    let note = ''
    if (band === 'critical' || band === 'weak') {
      note = show(lang, 'Low BAV transit — expect friction in this planet’s domains unless dasha is strongly protective.', WATCH_NOTE_HI.low)
    } else if (band === 'strong') {
      note = show(lang, 'High BAV transit — favorable window for this planet’s significations.', WATCH_NOTE_HI.high)
    } else {
      note = show(lang, 'Mixed/functional transit — results depend on dasha and aspects.', WATCH_NOTE_HI.mixed)
    }
    const domains = (lang === 'hi' ? BAV_SIG_HI[p] : SIGNIFICATIONS[p]).slice(0, 3).join(', ')
    rows.push({
      planet: p,
      transitRashi: tg.rashi,
      transitHouse: house,
      natalBav,
      strength: band,
      domains,
      note,
    })
  }

  return rows.sort((a, b) => a.natalBav - b.natalBav)
}

/**
 * Full Bhinnashtakavarga guide for a chart — planet profiles, special methods, transit watch.
 */
export function analyzeBhinnashtakavargaGuide(
  input: BhinnashtakavargaGuideInput,
): BhinnashtakavargaGuideResult {
  const planets = PLANET_ORDER.map((p) => buildPlanetGuide(p, input))
  const sun = findPlanet(input.grahas, 'Su')
  const moon = findPlanet(input.grahas, 'Mo')

  const lang = input.lang ?? 'en'
  const fatherTiming = sun
    ? computeFatherTimingFromSunBav(input.ashtakavarga, input.ascRashi, sun.rashi, lang)
    : null

  const maternalRelatives = moon
    ? countMaternalRelatives(input.ashtakavarga, moon.rashi, input.grahas, lang)
    : null

  return {
    usageNote: show(
      lang,
      'Use Sarvashtakavarga for general prediction. Use Bhinnashtakavarga only for gochar (transit) and dasha/antardasha result delivery — never as standalone general prediction.',
      BAV_USAGE_HI,
    ),
    planets,
    fatherTiming,
    maternalRelatives,
    transitWatch: buildTransitWatch(input),
    crossFindings: crossChartFindings(input),
  }
}
