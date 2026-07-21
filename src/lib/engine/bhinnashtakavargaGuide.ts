// ─────────────────────────────────────────────────────────────
//  src/lib/engine/bhinnashtakavargaGuide.ts
//  Bhinnashtakavarga (BAV) interpretation — gochar + dasha rules
//  from class transcript. Does not alter bindu math.
// ─────────────────────────────────────────────────────────────

import { toHousesFromLagna } from '@/lib/engine/ashtakavarga'
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

export function rateBavStrength(bindus: number): {
  band: BavStrengthBand
  label: string
} {
  if (bindus <= 0) {
    return { band: 'critical', label: 'Zero bindus — no strength in this sign' }
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

function nakshatraFromCount(count: number): { index: number; name: string; rashi: number } {
  // Count Ashwini as #1; remainder after 27 wraps
  let n = count
  while (n > 27) n -= 27
  if (n <= 0) n = ((n % 27) + 27) % 27 || 27
  const index = n - 1 // 0-based
  const name = NAKSHATRA_NAMES[index] ?? `Nakshatra ${n}`
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
): FatherTimingResult {
  const lagnaTenthRashi = rashiOfHouse(10, ascRashi)
  const sunNinthRashi = ((sunRashi - 1 + 8) % 12) + 1
  const lagnaTenthBindus = bavFor(av, 'Su', lagnaTenthRashi)
  const sunNinthBindus = bavFor(av, 'Su', sunNinthRashi)
  let sum = lagnaTenthBindus + sunNinthBindus
  let adjusted = sum
  if (adjusted > 27) adjusted -= 27
  const target = nakshatraFromCount(Math.max(1, adjusted))
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
    note:
      `Add Sun BAV of 10th-from-Lagna (${lagnaTenthBindus}) + 9th-from-Sun (${sunNinthBindus}) = ${sum}` +
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
      excluded.push(`${PLANET_NAMES[pid as keyof typeof PLANET_NAMES] ?? pid} (${isDeb ? 'debilitated' : 'enemy'})`)
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
    note:
      `From Moon, 4th house points (male grahas → maternal uncles, female → maternal aunts). ` +
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
): BavFinding[] {
  const out: BavFinding[] = []
  const { band } = rateBavStrength(bindus)

  if (band === 'strong') {
    out.push({
      id: 'su-strong',
      severity: 'positive',
      title: 'Strong Sun BAV where placed',
      detail: `${bindus} bindus — class strength for health, personality, and leadership significations during Sun dasha/gochar.`,
    })
  } else if (band === 'weak' || band === 'critical') {
    out.push({
      id: 'su-weak',
      severity: 'caution',
      title: 'Weak Sun BAV in natal sign',
      detail: `Below 4 bindus — exaltation/placement alone does not confer strength for gochar or dasha results.`,
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
        detail: 'During Sun periods, results may fall on children — health, accidents, conception/pregnancy stress. Confirm with full chart.',
      })
    }
  }

  if ([3, 6, 10, 11].includes(house) && bindus >= 4) {
    out.push({
      id: 'su-upachaya',
      severity: 'positive',
      title: 'Sun in upachaya with workable BAV',
      detail: '3/6/10/11 — effort-growth houses. Unafflicted Sun here tends to deliver positive results with work.',
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

  return out
}

function moonNatalFindings(house: number, bindus: number): BavFinding[] {
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
      title: 'Moon in kendra/trikona with 6–8 BAV',
      detail: 'Education, scholarship, and academic excellence well indicated.',
    })
  }

  return out
}

function marsNatalFindings(house: number, bindus: number, av: AshtakavargaResult, ascRashi: number): BavFinding[] {
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
      detail: 'Initiative in that life area is harder — not the same as aggression (aggression comes from natal afflictions, not low BAV alone).',
    })
  }

  // Zero-point signs → Saturn transit bad for brothers
  const zeroSigns: number[] = []
  for (let r = 1; r <= 12; r++) {
    if (bavFor(av, 'Ma', r) === 0) zeroSigns.push(r)
  }
  if (zeroSigns.length) {
    out.push({
      id: 'ma-sibling-sa',
      severity: 'caution',
      title: 'Mars zero-bindu signs',
      detail: `When Saturn gochars ${zeroSigns.map((r) => `R${r}/H${houseOf(r, ascRashi)}`).join(', ')} and dasha supports — difficult period for brothers. Time with native’s dasha.`,
    })
  }

  return out
}

function mercuryNatalFindings(bindus: number): BavFinding[] {
  if (bindus >= 6) {
    return [{
      id: 'me-strong',
      severity: 'positive',
      title: 'Strong Mercury BAV',
      detail: 'Education, career intellect, arts and mathematics all supported in Mercury periods.',
    }]
  }
  if (bindus < 4) {
    return [{
      id: 'me-weak',
      severity: 'caution',
      title: 'Weak Mercury BAV',
      detail: 'Curiosity dulls; mental peace may dip during Mercury gochar in low-scoring signs.',
    }]
  }
  return []
}

function jupiterNatalFindings(house: number, bindus: number): BavFinding[] {
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
  return out
}

function venusNatalFindings(house: number, bindus: number, av: AshtakavargaResult, ascRashi: number): BavFinding[] {
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
    out.push({
      id: 've-h7-low',
      severity: 'caution',
      title: 'Low Venus BAV to 7th sign',
      detail: `When Venus gochars 7th (${h7Pts} bindus) — relationship friction or public-image dips possible (~24–28 days / sign; longer if retrograde).`,
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
  return out
}

function saturnNatalFindings(
  house: number,
  bindus: number,
  av: AshtakavargaResult,
  ascRashi: number,
  grahas: BhinnashtakavargaGuideInput['grahas'],
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

  const ninthLord = RASHI_LORD[rashiOfHouse(9, ascRashi)]
  const tenthLord = RASHI_LORD[rashiOfHouse(10, ascRashi)]
  const saRulesFame = ninthLord === 'Sa' || tenthLord === 'Sa'

  if (house === 10 && bindus >= 2 && bindus <= 3) {
    out.push({
      id: 'sa-foreign-go',
      severity: 'info',
      title: 'Saturn in 10th with 2–3 BAV',
      detail: 'Class note: foreign travel often compelled rather than joyful choice — confirm with full chart and 10th-lord links.',
    })
  }

  if (saRulesFame && [3, 6, 11].includes(house) && bindus >= 1 && bindus <= 3) {
    out.push({
      id: 'sa-king-life',
      severity: 'positive',
      title: 'Saturn as 9/10 lord with low BAV still king-like',
      detail: 'If Saturn rules 9th/10th, even 1–3 BAV in 3/6/11 can still give raja-like living — do not over-fear low points alone.',
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

  return out
}

function planetTransitNotes(
  planet: (typeof PLANET_ORDER)[number],
  weak: SignBinduRow[],
  strong: SignBinduRow[],
): string[] {
  const notes: string[] = []
  if (weak.length) {
    notes.push(
      `Gochar through low-BAV signs (${weak.map((w) => `H${w.house}:${w.bindus}`).join(', ')}) + matching dasha/AD → poor results for ${PLANET_NAMES[planet]} significations.`,
    )
  }
  if (strong.length) {
    notes.push(
      `Best gochar windows: ${strong.slice(0, 3).map((s) => `H${s.house} (${s.bindus})`).join(', ')} — prefer muhurta / important work then.`,
    )
  }
  if (planet === 'Mo') {
    notes.push('Moon moves fastest — use daily: high-BAV sign = mentally good day; 0–2 = difficult day. Useful for muhurta.')
  }
  if (planet === 'Ve') {
    notes.push('Venus stays ~24–28 days/sign (up to ~120 days if retrograde). Full 12-sign cycle ~224d 7h.')
  }
  if (planet === 'Su') {
    notes.push('Event activation often within ±1° of natal Sun degree; confirm exact timing with Moon degree.')
  }
  if (planet === 'Ju') {
    notes.push('Chintamani tip: Jupiter gochar over natal Jupiter’s sign (golik) favors conception timing — confirm medically.')
  }
  return notes
}

function buildPlanetGuide(
  planet: (typeof PLANET_ORDER)[number],
  input: BhinnashtakavargaGuideInput,
): PlanetBavGuide {
  const { ashtakavarga: av, ascRashi, grahas } = input
  const g = findPlanet(grahas, planet)
  const natalRashi = g?.rashi ?? null
  const natalHouse = natalRashi != null ? houseOf(natalRashi, ascRashi) : null
  const selfBindus = natalRashi != null ? bavFor(av, planet, natalRashi) : null
  const strengthInfo = selfBindus != null ? rateBavStrength(selfBindus) : null

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
        )
        break
      case 'Mo':
        natalFindings = moonNatalFindings(natalHouse, selfBindus)
        break
      case 'Ma':
        natalFindings = marsNatalFindings(natalHouse, selfBindus, av, ascRashi)
        break
      case 'Me':
        natalFindings = mercuryNatalFindings(selfBindus)
        break
      case 'Ju':
        natalFindings = jupiterNatalFindings(natalHouse, selfBindus)
        break
      case 'Ve':
        natalFindings = venusNatalFindings(natalHouse, selfBindus, av, ascRashi)
        break
      case 'Sa':
        natalFindings = saturnNatalFindings(natalHouse, selfBindus, av, ascRashi, grahas)
        break
    }
  }

  return {
    planet,
    name: PLANET_NAMES[planet],
    significations: SIGNIFICATIONS[planet],
    natalHouse,
    natalRashi,
    selfBindus,
    strength: strengthInfo?.band ?? null,
    strengthLabel: strengthInfo?.label ?? 'Planet position unavailable',
    natalFindings,
    weakTransitSigns,
    strongTransitSigns,
    transitNotes: planetTransitNotes(planet, weakTransitSigns, strongTransitSigns),
  }
}

function crossChartFindings(input: BhinnashtakavargaGuideInput): BavFinding[] {
  const { ashtakavarga: av, ascRashi, grahas, dashaLord } = input
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
        out.push({
          id: `father-59-${label}`,
          severity: 'caution',
          title: `Low Sun BAV in 5th/9th from ${label}`,
          detail: `5th=${p5}, 9th=${p9}. Softly malefic for father. Rahu (~1.5y) or Saturn (~2.5y) gochar there worsens; Mercury transit can raise hemorrhage/paralysis risk classically.`,
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
      const { band, label } = rateBavStrength(pts)
      out.push({
        id: 'current-dasha-bav',
        severity: band === 'strong' || band === 'good' ? 'positive' : band === 'borderline' ? 'info' : 'caution',
        title: `Current dasha lord ${PLANET_NAMES[lord]} BAV`,
        detail: `Natal sign BAV ${pts} — ${label}. Bhinnashtakavarga is for dasha/AD delivery, not general prediction.`,
      })
    }
  }

  // House SAV context reminder
  const houseSav = toHousesFromLagna(av.sav, ascRashi as Rashi)
  const lowHouses = houseSav
    .map((v, i) => ({ h: i + 1, v }))
    .filter((x) => x.v <= 23)
  if (lowHouses.length) {
    out.push({
      id: 'sav-low-houses',
      severity: 'info',
      title: 'Sarvashtakavarga weak houses',
      detail: `SAV ≤23 in H${lowHouses.map((x) => x.h).join(', ')} — use SAV for general prediction; use BAV for gochar timing into those signs.`,
    })
  }

  return out
}

function buildTransitWatch(input: BhinnashtakavargaGuideInput): TransitActivationRow[] {
  const transit = input.transitGrahas
  if (!transit?.length) return []
  const { ashtakavarga: av, ascRashi } = input
  const rows: TransitActivationRow[] = []

  for (const p of PLANET_ORDER) {
    const tg = transit.find((g) => g.id === p)
    if (!tg?.rashi) continue
    const natalBav = bavFor(av, p, tg.rashi)
    const { band } = rateBavStrength(natalBav)
    const house = houseOf(tg.rashi, ascRashi)
    let note = ''
    if (band === 'critical' || band === 'weak') {
      note = 'Low BAV transit — expect friction in this planet’s domains unless dasha is strongly protective.'
    } else if (band === 'strong') {
      note = 'High BAV transit — favorable window for this planet’s significations.'
    } else {
      note = 'Mixed/functional transit — results depend on dasha and aspects.'
    }
    rows.push({
      planet: p,
      transitRashi: tg.rashi,
      transitHouse: house,
      natalBav,
      strength: band,
      domains: SIGNIFICATIONS[p].slice(0, 3).join(', '),
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

  const fatherTiming = sun
    ? computeFatherTimingFromSunBav(input.ashtakavarga, input.ascRashi, sun.rashi)
    : null

  const maternalRelatives = moon
    ? countMaternalRelatives(input.ashtakavarga, moon.rashi, input.grahas)
    : null

  return {
    usageNote:
      'Use Sarvashtakavarga for general prediction. Use Bhinnashtakavarga only for gochar (transit) and dasha/antardasha result delivery — never as standalone general prediction.',
    planets,
    fatherTiming,
    maternalRelatives,
    transitWatch: buildTransitWatch(input),
    crossFindings: crossChartFindings(input),
  }
}
