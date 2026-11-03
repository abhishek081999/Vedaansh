// ─────────────────────────────────────────────────────────────
//  src/lib/engine/sunReadingMethod.ts
//  Surya Phala Vichar: the 5-step way to read the natal Sun
//  (background → traits → daivik support → negatives → remedies),
//  plus motion toward uchcha/neecha, solar month & Aditya of the
//  month, body side, appearance and activation ages.
//  Teaching source: Predictive Surya classes (case-study sessions)
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_LORDS, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'

export type SunMotion = 'uchchagami' | 'neechagami' | 'exalted_point' | 'debilitated_point'

export interface SunReadingStep {
  step: number
  title: string
  question: string
  points: string[]
}

export interface SolarMonthDef {
  rashi: Rashi
  month: string
  /** Aditya ruling the month as taught in class; null where the class name was not recorded */
  aditya: string | null
  /** Approximate sidereal (Lahiri) Sun ingress, month 1–12 / day */
  ingress: { month: number; day: number }
  /** Approximate days the Sun spends in the sign */
  days: number
}

export interface ActivationAge {
  age: number
  source: string
  mahadasha: string | null
}

export interface SunReadingResult {
  sun: {
    rashi: Rashi
    rashiName: string
    degreeInSign: number
    house: number
    nakshatraName: string
    pada: number
    nakshatraLord: GrahaId
    nakshatraLordHouse: number | null
    signLord: GrahaId
    signLordHouse: number | null
  }
  steps: SunReadingStep[]
  motion: {
    kind: SunMotion
    label: string
    detail: string
    degreesToExaltation: number
    degreesToDebilitation: number
  }
  sandhi: { active: boolean; detail: string }
  solarMonth: SolarMonthDef & { approxBirthWindow: string }
  bodySide: { side: 'right' | 'left' | 'central'; detail: string }
  appearance: { applies: boolean; reason: string; traits: string[] }
  activationAges: ActivationAge[]
  principles: string[]
  practices: string[]
}

const SIGN_LORD: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

/** Planetary maturity ages used in class to time when a placement "opens up". */
export const MATURITY_AGE: Partial<Record<GrahaId, number>> = {
  Ju: 16, Su: 22, Mo: 24, Ve: 25, Ma: 28, Me: 32, Sa: 36, Ra: 42, Ke: 48,
}

/** Primary sthira karaka per house — 8th → Saturn gives the "8th house matures at 36" rule. */
const HOUSE_KARAKA: Record<number, GrahaId> = {
  1: 'Su', 2: 'Ju', 3: 'Ma', 4: 'Mo', 5: 'Ju', 6: 'Ma',
  7: 'Ve', 8: 'Sa', 9: 'Ju', 10: 'Me', 11: 'Ju', 12: 'Sa',
}

/**
 * Aditya chakra of the twelve solar months as taught in class.
 * Mesha and Meena names were not captured clearly in the session notes.
 */
export const SOLAR_MONTHS: SolarMonthDef[] = [
  { rashi: 1, month: 'Chaitra', aditya: null, ingress: { month: 4, day: 14 }, days: 31 },
  { rashi: 2, month: 'Vaishakha', aditya: 'Savita', ingress: { month: 5, day: 15 }, days: 31 },
  { rashi: 3, month: 'Jyeshtha', aditya: 'Gabhasti', ingress: { month: 6, day: 15 }, days: 31 },
  { rashi: 4, month: 'Ashadha', aditya: 'Ravi', ingress: { month: 7, day: 16 }, days: 32 },
  { rashi: 5, month: 'Shravana', aditya: 'Parjanya', ingress: { month: 8, day: 17 }, days: 31 },
  { rashi: 6, month: 'Bhadrapada', aditya: 'Tvashta', ingress: { month: 9, day: 17 }, days: 30 },
  { rashi: 7, month: 'Ashwin', aditya: 'Mitra', ingress: { month: 10, day: 17 }, days: 30 },
  { rashi: 8, month: 'Kartika', aditya: 'Vishnu', ingress: { month: 11, day: 16 }, days: 30 },
  { rashi: 9, month: 'Margashirsha', aditya: 'Varuna', ingress: { month: 12, day: 16 }, days: 29 },
  { rashi: 10, month: 'Pausha (Makar Sankranti)', aditya: 'Surya', ingress: { month: 1, day: 14 }, days: 30 },
  { rashi: 11, month: 'Magha', aditya: 'Sahasranshu', ingress: { month: 2, day: 13 }, days: 30 },
  { rashi: 12, month: 'Phalguna', aditya: null, ingress: { month: 3, day: 14 }, days: 31 },
]

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const SUN_READING_PRINCIPLES = [
  'Always read the positives of a placement first — never open a chart with the negatives.',
  'To learn a planet, isolate it: read only the Sun (sign, house, nakshatra, degree) before mixing in conjunctions.',
  'Do not fit known events into the chart afterwards — first ask whether the yoga is promised, then time it.',
  'When most confident statements fail, suspect the birth data (a wrong year changes everything) and say so.',
  'Exalted is not automatically good today — see what the house and dasha actually deliver.',
  'Tell the client only what they are ready for (adhikari); some findings are kept for a one-to-one.',
  'Kharmas (Sun in Sagittarius/Pisces) makes the Sun slow, not evil — read it as lowered tej, not a curse.',
]

export const SUN_PRACTICES = [
  'Surya arghya at dawn (Savita time, before the disc fully rises) — with Gayatri only if initiated (adhikari).',
  'Aditya Hridaya Stotra — classical Surya stotra; pair with Vishnu Sahasranama for Vivasvan/Vishnu forms.',
  'Surya Namaskar — 12 asanas: Pranamasana, Hasta Uttanasana, Hasta Padasana, Ashwa Sanchalanasana, Dandasana, Ashtanga Namaskara, Bhujangasana, Adho Mukha Shvanasana, Ashwa Sanchalanasana, Hasta Padasana, Hasta Uttanasana, Tadasana/Pranamasana.',
  'Other Surya asanas: Tadasana, Vrikshasana, Garudasana, Trikonasana.',
  'Chakshushmati sadhana — for the eyes and inner sight (clarity of thought, intuitive vision).',
  'Surya trataka only under a guide — eye damage is a real risk.',
  'Honour the father / father figures; dissolve vaicharik matbhed with father and gurus — often the single strongest Sun remedy.',
  'Gem: Ruby (Manikya) — only after the whole chart is checked, never from Sun placement alone.',
]

function wholeSignHouse(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function normalizeLon(lon: number): number {
  return ((lon % 360) + 360) % 360
}

function aspectsByWholeSign(from: GrahaData, toRashi: Rashi): boolean {
  const offset = ((toRashi - from.rashi + 12) % 12) + 1
  if (offset === 7) return true
  if (from.id === 'Ju') return offset === 5 || offset === 9
  if (from.id === 'Ma') return offset === 4 || offset === 8
  if (from.id === 'Sa') return offset === 3 || offset === 10
  return false
}

function analyzeMotion(sunLon: number) {
  const lon = normalizeLon(sunLon)
  const EXALT = 10 // 10° Aries
  const DEBIL = 190 // 10° Libra
  const toExalt = normalizeLon(EXALT - lon)
  const toDebil = normalizeLon(DEBIL - lon)

  let kind: SunMotion
  if (Math.abs(lon - EXALT) < 0.5) kind = 'exalted_point'
  else if (Math.abs(lon - DEBIL) < 0.5) kind = 'debilitated_point'
  else kind = toExalt < toDebil ? 'uchchagami' : 'neechagami'

  const labels: Record<SunMotion, string> = {
    uchchagami: 'Uchchagami — moving toward exaltation',
    neechagami: 'Neechagami — moving toward debilitation',
    exalted_point: 'At deep exaltation (10° Aries)',
    debilitated_point: 'At deep debilitation (10° Libra)',
  }

  let detail: string
  if (kind === 'uchchagami') {
    detail = toExalt <= 40
      ? 'Close to exaltation and gaining strength — like walking home from office: once the house is in sight, energy returns. Treat even a Pisces Sun as normalising, not weak.'
      : 'On the rising half of the zodiac; tej is building over the sign cycle.'
  } else if (kind === 'neechagami') {
    detail = toDebil <= 40
      ? 'Close to debilitation (late Virgo / early Libra) — read neecha-like traits: ego clashes with father and gurus, starts duties loudly then pulls back, false pride. Works best when approached with love, not force.'
      : 'On the falling half of the zodiac; Sun spends strength as it moves toward Libra.'
  } else {
    detail = labels[kind]
  }

  return { kind, label: labels[kind], detail, degreesToExaltation: toExalt, degreesToDebilitation: toDebil }
}

function analyzeSandhi(sun: GrahaData) {
  const deg = sun.degree
  const isWaterEnd = [4, 8, 12].includes(sun.rashi) && deg >= 26 + 2 / 3
  const isFireStart = [1, 5, 9].includes(sun.rashi) && deg <= 3 + 1 / 3
  const gandanta = Boolean(sun.gandanta?.isGandanta) || isWaterEnd || isFireStart
  if (gandanta) {
    return {
      active: true,
      detail: `Sun is in a gandanta / sandhi junction (${deg.toFixed(1)}° ${RASHI_NAMES[sun.rashi]}) — end of one cycle, start of the next. Expect a sharp life transformation; the junction nakshatra lord shapes timing.`,
    }
  }
  if (deg < 1 || deg > 29) {
    return {
      active: true,
      detail: `Rashi sandhi (${deg.toFixed(1)}°) — Sun straddles two signs; blend both signs' results and check D9 before judging.`,
    }
  }
  return { active: false, detail: 'Sun is not in a sign junction — its sign results come through cleanly.' }
}

function solarMonthFor(sun: GrahaData): SolarMonthDef & { approxBirthWindow: string } {
  const def = SOLAR_MONTHS.find(m => m.rashi === sun.rashi) ?? SOLAR_MONTHS[0]
  const offsetDays = Math.round((sun.degree / 30) * def.days)
  // Fixed non-leap year is enough for an "around this date" hint.
  const base = new Date(Date.UTC(2001, def.ingress.month - 1, def.ingress.day + offsetDays))
  const lo = new Date(base.getTime() - 2 * 86400000)
  const hi = new Date(base.getTime() + 2 * 86400000)
  const fmt = (d: Date) => `${MONTH_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}`
  return { ...def, approxBirthWindow: `${fmt(lo)} – ${fmt(hi)}` }
}

function bodySideFor(house: number) {
  if (house === 1 || house === 7) {
    return { side: 'central' as const, detail: `Sun in house ${house} — central axis (head, spine, chest line) rather than one side.` }
  }
  if (house >= 8) {
    return {
      side: 'left' as const,
      detail: `Sun in house ${house} (8–12 band) — Surya issues (eyes, bones, legs) tend to show on the LEFT side, e.g. 12th → left eye, 8th → left leg/calf.`,
    }
  }
  return {
    side: 'right' as const,
    detail: `Sun in house ${house} (2–6 band) — Surya issues tend to show on the RIGHT side of the body.`,
  }
}

function appearanceFor(sun: GrahaData, house: number, chart: ChartOutput) {
  const asc = chart.lagnas.ascRashi as Rashi
  const reasons: string[] = []
  if (house === 1) reasons.push('Sun in Lagna')
  if (house === 7) reasons.push('Sun aspects Lagna from the 7th')
  if (asc === 5) reasons.push('Leo Lagna — Sun is lagnesh')
  if (house === 5 || house === 9) reasons.push(`Sun in trine (house ${house}) to Lagna`)
  return {
    applies: reasons.length > 0,
    reason: reasons.length ? reasons.join(' · ') : 'Sun has no direct hold on Lagna — read appearance from Lagna and its lord first.',
    traits: [
      'Broad forehead; bright, steady eyes',
      'Oval face with defined, slightly sharp features',
      'Broad chest and shoulders (rib cage), upright posture',
      'Hair thinner in volume but dark and dense where present',
      'Warm / golden undertone to the complexion',
      'Old head-injury or stitch marks are common when Sun is in Lagna',
    ],
  }
}

function mahadashaAt(chart: ChartOutput, age: number): string | null {
  const nodes = chart.dashas?.vimshottari
  const birth = chart.meta?.birthDate ? new Date(chart.meta.birthDate) : null
  if (!nodes?.length || !birth || Number.isNaN(birth.getTime())) return null
  const at = new Date(birth)
  at.setFullYear(at.getFullYear() + age)
  const node = nodes.find(n => new Date(n.start) <= at && at < new Date(n.end))
  if (!node) return null
  return GRAHA_NAMES[node.lord as GrahaId] ?? node.lord
}

function buildSteps(
  chart: ChartOutput,
  sun: GrahaData,
  house: number,
  houseOf: (id: GrahaId) => number | null,
  motion: ReturnType<typeof analyzeMotion>,
  sandhi: { active: boolean; detail: string },
): SunReadingStep[] {
  const signLord = SIGN_LORD[sun.rashi]
  const nakLord = NAKSHATRA_LORDS[sun.nakshatraIndex]
  const grahas = chart.grahas
  const ju = grahas.find(g => g.id === 'Ju')

  const background = [
    `Sign: ${RASHI_NAMES[sun.rashi]} ${sun.degree.toFixed(1)}° — lord ${GRAHA_NAMES[signLord]}${houseOf(signLord) ? ` in house ${houseOf(signLord)}` : ''}.`,
    `House: ${house} from Lagna.`,
    `Nakshatra: ${NAKSHATRA_NAMES[sun.nakshatraIndex]} pada ${sun.pada} — lord ${GRAHA_NAMES[nakLord]}${houseOf(nakLord) ? ` in house ${houseOf(nakLord)}` : ''}.`,
    `${motion.label}.`,
  ]
  if (sandhi.active) background.push('Junction degree — see Sandhi card.')

  const traits: string[] = []
  if (sun.rashi === 1) traits.push('Full light in Aries — self-driven, initiates with energy.')
  if (sun.rashi === 5) traits.push('Own sign — natural authority; watch for negative ego.')
  if ([3, 7, 11].includes(sun.rashi)) traits.push('Air sign — thinks, researches, manipulates through words more than force.')
  if ([4, 8, 12].includes(sun.rashi)) traits.push('Water sign — sensitive, emotional depth, keeps feelings hidden.')
  if ([2, 6, 10].includes(sun.rashi)) traits.push('Earth sign — practical, result-oriented; identity built through work.')
  if ([1, 5, 9].includes(sun.rashi)) traits.push('Fire sign — expressive self, leadership, honour-driven.')
  if (house === 8 || house === 12) traits.push('Hidden house — keeps his/her own mind to self, especially in Sun dasha/antardasha.')
  if (house === 5 || house === 11) traits.push('Popular in friend circles even when preferring solitude for personal matters.')
  if (house === 9) traits.push('9th — moral duties, father and guru shape bhagya.')

  const daivik: string[] = []
  if (ju && (ju.rashi === sun.rashi || aspectsByWholeSign(ju, sun.rashi))) {
    daivik.push(`Jupiter ${ju.rashi === sun.rashi ? 'conjoins' : 'aspects'} the Sun — guru / daivik protection on Surya.`)
  }
  if (nakLord === 'Ju' || nakLord === 'Ke') daivik.push(`Nakshatra lord ${GRAHA_NAMES[nakLord]} adds dharmic / moksha support.`)
  if ([9, 12].includes(house)) daivik.push(`House ${house} links the Sun to dharma / moksha.`)
  if ([1, 5, 8, 9].includes(sun.rashi)) daivik.push('Sun in its own, exalted or friendly sign.')
  if (!daivik.length) daivik.push('No direct daivik support on the Sun — remedies and conscious effort matter more.')

  const negatives: string[] = []
  if (sun.rashi === 7 || sun.dignity === 'debilitated') negatives.push('Debilitated in Libra — self-respect lowered; easily snubbed.')
  if (sun.rashi === 11) negatives.push('Aquarius — Surya energy weakens (Capricorn is not automatically weak).')
  if ([6, 8, 12].includes(house)) negatives.push(`Dusthana (house ${house}) — Sun works through struggle, hidden matters or loss.`)
  for (const id of ['Ra', 'Ke', 'Sa'] as GrahaId[]) {
    const g = grahas.find(x => x.id === id)
    if (g && g.rashi === sun.rashi) negatives.push(`With ${GRAHA_NAMES[id]} — eclipse/pressure on identity and father themes.`)
  }
  if (motion.kind === 'neechagami' && motion.degreesToDebilitation <= 40) negatives.push('Neechagami close to Libra — ego and father/guru clashes.')
  if (sun.rashi === 9 || sun.rashi === 12) negatives.push('Kharmas sign — slower, lower-tej Sun.')
  if (!negatives.length) negatives.push('No major Sun-specific negatives — keep reading conjunctions next.')

  return [
    { step: 1, title: 'Background check', question: 'Where does the Sun sit and whose support does it carry?', points: background },
    { step: 2, title: 'Characteristics', question: 'What nature does this Sun give? (positives first)', points: traits.length ? traits : ['Read the Aditya and house teaching for this Sun.'] },
    { step: 3, title: 'Daivik / spiritual support', question: 'Is there divine or guru support on the Sun?', points: daivik },
    { step: 4, title: 'Negatives', question: 'What can go wrong with this Sun?', points: negatives },
    { step: 5, title: 'Remedial measures', question: 'Can remedies help — and which?', points: ['See practices below; tailor to the negatives found in step 4.'] },
  ]
}

/**
 * Five-step Surya reading plus motion, month, body side, appearance and activation ages.
 */
export function analyzeSunReadingMethod(chart: ChartOutput): SunReadingResult | null {
  const sun = chart.grahas.find(g => g.id === 'Su')
  if (!sun) return null

  const asc = chart.lagnas.ascRashi as Rashi
  const house = wholeSignHouse(sun.rashi, asc)
  const houseOf = (id: GrahaId) => {
    const g = chart.grahas.find(x => x.id === id)
    return g ? wholeSignHouse(g.rashi, asc) : null
  }

  const motion = analyzeMotion(sun.lonSidereal)
  const sandhi = analyzeSandhi(sun)
  const nakLord = NAKSHATRA_LORDS[sun.nakshatraIndex]
  const signLord = SIGN_LORD[sun.rashi]

  const ageEntries: Array<{ age: number; source: string }> = [
    { age: MATURITY_AGE.Su!, source: 'Sun matures (22)' },
  ]
  const karaka = HOUSE_KARAKA[house]
  if (MATURITY_AGE[karaka]) {
    ageEntries.push({ age: MATURITY_AGE[karaka]!, source: `House ${house} matures via karaka ${GRAHA_NAMES[karaka]}` })
  }
  if (MATURITY_AGE[nakLord]) {
    ageEntries.push({ age: MATURITY_AGE[nakLord]!, source: `Nakshatra lord ${GRAHA_NAMES[nakLord]} matures` })
  }
  const seen = new Set<string>()
  const activationAges = ageEntries
    .sort((a, b) => a.age - b.age)
    .filter(e => {
      const key = `${e.age}|${e.source}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map(e => ({ ...e, mahadasha: mahadashaAt(chart, e.age) }))

  return {
    sun: {
      rashi: sun.rashi,
      rashiName: RASHI_NAMES[sun.rashi],
      degreeInSign: sun.degree,
      house,
      nakshatraName: NAKSHATRA_NAMES[sun.nakshatraIndex],
      pada: sun.pada,
      nakshatraLord: nakLord,
      nakshatraLordHouse: houseOf(nakLord),
      signLord,
      signLordHouse: houseOf(signLord),
    },
    steps: buildSteps(chart, sun, house, houseOf, motion, sandhi),
    motion,
    sandhi,
    solarMonth: solarMonthFor(sun),
    bodySide: bodySideFor(house),
    appearance: appearanceFor(sun, house, chart),
    activationAges,
    principles: SUN_READING_PRINCIPLES,
    practices: SUN_PRACTICES,
  }
}
