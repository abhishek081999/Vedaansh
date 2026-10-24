// src/lib/engine/marriageClass.ts
// Class reading of marriage type: D1 against D9, the three bonds
// (body, mind, soul), and karmic-trap against soulmate.
// A pattern is a tendency. Name the type before naming a year.
// Pure engine — no React/DB.

import type { ChartOutput, Dignity, Gender, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_LORDS, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { D9 } from '@/lib/engine/vargas'
import type { LifeTone, MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'

export type MarriageKind = 'physical' | 'mental' | 'soul' | 'open'
export type MarriagePattern = 'linear' | 'second' | 'divorce' | 'many' | 'open'
export type MarriageBond = 'karmic' | 'soul' | 'mixed' | 'open'

export interface MarriageClassFlags {
  kind: MarriageKind
  pattern: MarriagePattern
  bond: MarriageBond
  /** Classical second-bond / remarriage signature present (any gender). */
  remarriageSignal: boolean
  /** Several important bonds indicated (not automatically several weddings). */
  multiplicity: boolean
}

export interface MarriageClassReading {
  headline: string
  summary: string
  principles: string
  frame: MarriedLifeNote[]
  kind: MarriedLifeNote[]
  pillars: MarriedLifeNote[]
  pattern: MarriedLifeNote[]
  bond: MarriedLifeNote[]
  nakshatra: MarriedLifeNote[]
  navamsha: MarriedLifeNote[]
  strain: MarriedLifeNote[]
  flags: MarriageClassFlags
}

const LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const MALEFIC = new Set<GrahaId>(['Su', 'Ma', 'Sa', 'Ra', 'Ke'])
const DUSTHANA = new Set([6, 8, 12])
const KENDRA = new Set([1, 4, 7, 10])
const FIXED = new Set([2, 5, 8, 11])
const DUAL = new Set([3, 6, 9, 12])
const DIGNIFIED: Dignity[] = ['exalted', 'moolatrikona', 'own']
const CAPABLE: Dignity[] = ['exalted', 'moolatrikona', 'own', 'friend', 'great_friend']

const RAHU_NAKS = new Set([5, 14, 23])
const DUTY_NAKS = new Set([7, 16, 25])
const SOUL_NAKS = new Set([3, 11, 16, 26])
const JUPITER_NAKS = new Set([6, 15, 24])
const KETU_NAKS = new Set([0, 9, 18])

export const MARRIAGE_CLASS_PRINCIPLES =
  'A physical marriage is Mars, an emotional marriage is the Moon, and a soul marriage is Venus, especially in the Navamsha. The birth chart is the marriage as it is lived. The Navamsha (D9) is the same planet at a deeper level: its meaning stays, its strength can change. When a planet is weak in the birth chart and strong in the Navamsha, the deeper chart is what holds. When it is strong in the birth chart and weak in the Navamsha, that strength does not hold underneath. This is read for Venus, Jupiter, and every other planet. Look first at the 7th house, the planet that rules it, and Venus. In the Navamsha, look at Venus first, then the 7th house, then the Moon. Householder life works on the ego, on feeling, and on the spirit together. Name the kind of bond before naming a year. A break that cannot be restarted needs three things at once: the marriage lord under strain, a difficult planet on Navamsha Venus, and Rahu’s major period with Saturn’s sub-period. The spouse is one of the debts carried from an earlier life, along with children and the home. D7 shows how the household changes after a child. The nine Navamsha age windows are not used to name a year. Only the first two have a theme here: family karma, then emotional learning. Rahu, Ketu, or Saturn on the marriage move the rest. The year you meet, and the place, stay unnamed until the kind of bond is clear. A soul bond is named only when those combinations are on the chart. A few days of feeling do not make one.'

function houseOf(rashi: number, asc: number): number {
  return ((rashi - asc + 12) % 12) + 1
}

function signOf(asc: number, house: number): Rashi {
  return ((((asc - 1 + house - 1) % 12) + 1) as Rashi)
}

function rn(r: number): string {
  return RASHI_NAMES[r as Rashi] ?? `R${r}`
}

function plainStrength(d: Dignity | undefined): string {
  switch (d) {
    case 'exalted': return 'exalted, at its strongest'
    case 'moolatrikona': return 'in its best own sign'
    case 'own': return 'in its own sign'
    case 'great_friend': return 'in a very friendly sign'
    case 'friend': return 'in a friendly sign'
    case 'neutral': return 'of ordinary strength'
    case 'enemy': return 'in an unfriendly sign'
    case 'great_enemy': return 'in a hostile sign'
    case 'debilitated': return 'fallen, at its weakest'
    default: return 'of mixed strength'
  }
}

function gn(id: GrahaId | string): string {
  return GRAHA_NAMES[id as GrahaId] ?? id
}

function find(list: GrahaData[] | undefined, id: GrahaId): GrahaData | undefined {
  return list?.find(g => g.id === id)
}

function note(id: string, title: string, detail: string, tone: LifeTone): MarriedLifeNote {
  return { id, title, detail, tone }
}

function partner(gender: Gender | undefined): string {
  if (gender === 'male') return 'wife'
  if (gender === 'female') return 'husband'
  return 'partner'
}

function manyField(gender: Gender | undefined): string {
  if (gender === 'male') return 'In this chart the field is women.'
  if (gender === 'female') return 'In this chart the field is men.'
  return 'The field is this person’s own partnerships.'
}

function dignified(d: Dignity | undefined): boolean {
  return !!d && DIGNIFIED.includes(d)
}

function capable(d: Dignity | undefined): boolean {
  return !!d && CAPABLE.includes(d)
}

function weak(g: GrahaData | undefined): boolean {
  if (!g) return true
  return g.dignity === 'debilitated' || g.dignity === 'enemy' || g.dignity === 'great_enemy' || !!g.isCombust
}

type StrengthBand = 'strong' | 'ordinary' | 'weak'

/** Dignity band. Combustion is a birth-chart fact; Navamsha rows copy that flag, so it is not reapplied there. */
function dignityBand(g: GrahaData | undefined, natal: boolean): StrengthBand | null {
  if (!g) return null
  const fallen = g.dignity === 'debilitated' || g.dignity === 'enemy' || g.dignity === 'great_enemy' || (natal && !!g.isCombust)
  if (fallen) return 'weak'
  if (capable(g.dignity)) return 'strong'
  return 'ordinary'
}

/**
 * Navamsha decides when it is clearly strong or clearly weak.
 * A strong Navamsha holds the planet even when the birth chart is weak.
 */
function holdsAcross(d1: GrahaData | undefined, d9g: GrahaData | undefined): boolean {
  const deep = dignityBand(d9g, false)
  if (deep === 'strong') return true
  if (deep === 'weak') return false
  const birth = dignityBand(d1, true)
  return birth != null && birth !== 'weak'
}

function strengthSentence(name: string, d1: GrahaData | undefined, d9g: GrahaData | undefined): string {
  const birth = !d1
    ? `${name} is missing in the birth chart`
    : `In the birth chart ${name} is ${plainStrength(d1.dignity)}${d1.isCombust ? ', too close to the Sun' : ''}`
  const deep = !d9g
    ? 'the Navamsha is not available'
    : `in the Navamsha ${name} is ${plainStrength(d9g.dignity)}`
  const b = dignityBand(d1, true)
  const n = dignityBand(d9g, false)
  let verdict = 'Neither chart is especially strong or weak'
  if (n === 'strong' && b === 'weak') verdict = 'The birth chart is weak and the Navamsha is strong, so the deeper chart holds it'
  else if (n === 'strong' && b === 'strong') verdict = 'Both charts are strong'
  else if (n === 'strong') verdict = 'The Navamsha is strong, so the deeper chart holds it'
  else if (n === 'weak' && b === 'strong') verdict = 'The birth chart looks strong and the Navamsha is weak, so that strength does not hold underneath'
  else if (n === 'weak') verdict = 'The Navamsha is weak, so this planet does not hold'
  else if (b === 'weak') verdict = 'The birth chart is weak, and the Navamsha does not restore it'
  else if (b === 'strong') verdict = 'The birth chart is strong, and the Navamsha is ordinary'
  return `${birth}, and ${deep}. ${verdict}.`
}

function aspects(source: GrahaData, targetSign: number): boolean {
  if (source.rashi === targetSign) return false
  const diff = ((targetSign - source.rashi + 12) % 12) + 1
  if (diff === 7) return true
  if (source.id === 'Ma' && (diff === 4 || diff === 8)) return true
  if (source.id === 'Ju' && (diff === 5 || diff === 9)) return true
  if (source.id === 'Sa' && (diff === 3 || diff === 10)) return true
  return false
}

function joined(a: GrahaData | undefined, b: GrahaData | undefined): boolean {
  return !!a && !!b && a.id !== b.id && a.rashi === b.rashi
}

function sees(a: GrahaData | undefined, b: GrahaData | undefined): boolean {
  if (!a || !b || a.id === b.id) return false
  return a.rashi === b.rashi || aspects(a, b.rashi)
}

function maleficsOn(target: GrahaData, list: GrahaData[]): GrahaData[] {
  return list.filter(g => g.id !== target.id && MALEFIC.has(g.id) && (g.rashi === target.rashi || aspects(g, target.rashi)))
}

function beneficOn(target: GrahaData, list: GrahaData[]): boolean {
  return list.some(g => {
    if (g.id === target.id) return false
    if (g.id !== 'Ju' && g.id !== 'Ve' && g.id !== 'Mo') return false
    if (g.id === 'Mo' && g.isWaxingMoon === false) return false
    return g.rashi === target.rashi || aspects(g, target.rashi)
  })
}

function axis(a: number, b: number): '1-7' | '4-10' | '3-11' | '5-9' | '6-8' | '2-12' {
  const d = ((b - a + 12) % 12) + 1
  if (d === 1 || d === 7) return '1-7'
  if (d === 4 || d === 10) return '4-10'
  if (d === 3 || d === 11) return '3-11'
  if (d === 5 || d === 9) return '5-9'
  if (d === 6 || d === 8) return '6-8'
  return '2-12'
}

function nakName(index: number | undefined): string | null {
  if (index == null || index < 0 || index > 26) return null
  return NAKSHATRA_NAMES[index] ?? null
}

function nakLord(index: number | undefined): GrahaId | null {
  if (index == null || index < 0 || index > 26) return null
  return NAKSHATRA_LORDS[index] ?? null
}

function exchange(a: GrahaData, b: GrahaData): boolean {
  return LORDS[a.rashi] === b.id && LORDS[b.rashi] === a.id
}

/**
 * Marriage-class reading for one chart.
 * Returns null when the ascendant is missing.
 */
export function analyzeMarriageClass(chart: ChartOutput): MarriageClassReading | null {
  const asc = chart.lagnas?.ascRashi
  if (!asc) return null

  const spouse = partner(chart.meta?.gender)
  const seventh = signOf(asc, 7)
  const lordId = LORDS[seventh]
  const lord = find(chart.grahas, lordId)
  const lordHouse = lord ? houseOf(lord.rashi, asc) : null
  const venus = find(chart.grahas, 'Ve')
  const moon = find(chart.grahas, 'Mo')
  const mars = find(chart.grahas, 'Ma')
  const jupiter = find(chart.grahas, 'Ju')
  const saturn = find(chart.grahas, 'Sa')
  const rahu = find(chart.grahas, 'Ra')
  const ketu = find(chart.grahas, 'Ke')
  const lagnaLord = find(chart.grahas, LORDS[asc])
  const lagnaHouse = lagnaLord ? houseOf(lagnaLord.rashi, asc) : null

  const d9 = chart.vargas?.D9
  const d9Asc = chart.vargaLagnas?.D9
  const d9Venus = find(d9, 'Ve')
  const d9Moon = find(d9, 'Mo')
  const d9Mars = find(d9, 'Ma')
  const d9Lord = find(d9, lordId)
  const d9LagnaLord = d9Asc ? find(d9, LORDS[d9Asc]) : undefined
  const d9Seventh = d9Asc ? signOf(d9Asc, 7) : null
  const d9SeventhLord = d9Seventh ? find(d9, LORDS[d9Seventh]) : undefined
  const d9SeventhLordHouse = d9SeventhLord && d9Asc ? houseOf(d9SeventhLord.rashi, d9Asc) : null

  const frame: MarriedLifeNote[] = []
  const kindNotes: MarriedLifeNote[] = []
  const pillarNotes: MarriedLifeNote[] = []
  const patternNotes: MarriedLifeNote[] = []
  const bondNotes: MarriedLifeNote[] = []
  const nakNotes: MarriedLifeNote[] = []
  const navNotes: MarriedLifeNote[] = []
  const strainNotes: MarriedLifeNote[] = []

  if (lord && d9Lord) {
    const birthBand = dignityBand(lord, true)
    const deepBand = dignityBand(d9Lord, false)
    if (birthBand && deepBand && birthBand !== deepBand) {
      frame.push(note(
        'class-d1-d9',
        'One marriage planet, two strengths',
        `${gn(lord.id)} rules marriage in both charts. In the birth chart it is in ${rn(lord.rashi)}${lordHouse ? `, house ${lordHouse}` : ''}, ${plainStrength(lord.dignity)}. In the Navamsha it is in ${rn(d9Lord.rashi)}, ${plainStrength(d9Lord.dignity)}. The birth chart is the marriage people live. The Navamsha is the quality underneath, and these two strengths do not match.`,
        deepBand === 'strong' ? 'supportive' : 'caution',
      ))
    }
  } else if (!d9Lord && !d9Asc) {
    frame.push(note(
      'class-d9-missing',
      'The deeper marriage chart is missing',
      'A soul bond, an old account, and a second relationship need the Navamsha. Recalculate the chart so D9 is included.',
      'mixed',
    ))
  }

  const roster: { id: GrahaId; name: string }[] = [
    { id: 'Su', name: 'the Sun' },
    { id: 'Mo', name: 'the Moon' },
    { id: 'Ma', name: 'Mars' },
    { id: 'Me', name: 'Mercury' },
    { id: 'Ju', name: 'Jupiter' },
    { id: 'Ve', name: 'Venus' },
    { id: 'Sa', name: 'Saturn' },
  ]
  const strengthLines = roster.flatMap(p => {
    const natal = find(chart.grahas, p.id)
    const deep = find(d9, p.id)
    const birthBand = dignityBand(natal, true)
    const deepBand = dignityBand(deep, false)
    const flipped = (birthBand === 'weak' && deepBand === 'strong') || (birthBand === 'strong' && deepBand === 'weak')
    return flipped ? [strengthSentence(p.name, natal, deep)] : []
  })
  if (strengthLines.length) {
    const rescued = roster.some(p => dignityBand(find(chart.grahas, p.id), true) === 'weak' && dignityBand(find(d9, p.id), false) === 'strong')
    const undermined = roster.some(p => dignityBand(find(chart.grahas, p.id), true) === 'strong' && dignityBand(find(d9, p.id), false) === 'weak')
    frame.push(note(
      'class-strength',
      'Strength in the birth chart and in the Navamsha',
      strengthLines.join(' '),
      rescued && !undermined ? 'supportive' : undermined && !rescued ? 'caution' : 'mixed',
    ))
  }

  if (lord?.dignity === 'exalted') {
    frame.push(note(
      'class-exalted-lord',
      'A high standard, not a free gift',
      `The planet that rules marriage is exalted, at its strongest. That alone describes a ${spouse} of real quality. Children are a separate question. The same strength is hard to live up to. The fuller result needs a strong rising-sign lord in the 7th house, and a helpful planet joining or seeing that house.`,
      'mixed',
    ))
  }

  const beneficOnSeventh = chart.grahas.some(g => {
    if (g.id !== 'Ju' && g.id !== 'Ve' && g.id !== 'Mo') return false
    if (g.id === 'Mo' && g.isWaxingMoon === false) return false
    return houseOf(g.rashi, asc) === 7 || aspects(g, seventh)
  })
  const lagnaStrongIn7 = !!lagnaLord && lagnaHouse === 7 && capable(lagnaLord.dignity) && !lagnaLord.isCombust
  if (lord?.dignity === 'exalted' && lagnaStrongIn7 && beneficOnSeventh) {
    frame.push(note(
      'class-virtuous',
      'The three supports are present',
      'The marriage lord is exalted, a strong rising-sign lord sits in the 7th house, and a helpful planet joins or sees that house. This is a partner of real quality, and a marriage that can grow a family. The person is steady, the partner is mature, and the house around them is supportive.',
      'supportive',
    ))
  }

  if (lordId === 'Ma' && mars && (mars.dignity === 'exalted' || mars.dignity === 'own' || mars.dignity === 'moolatrikona') && KENDRA.has(houseOf(mars.rashi, asc))) {
    frame.push(note(
      'class-ruchaka',
      'Ruchaka supports this marriage lord',
      'Mars rules the 7th house and sits in a corner house (1st, 4th, 7th, or 10th) in its own sign or exaltation. That combination is called Ruchaka. It is the support a strong Mars needs before the high result is trusted. A weak Venus, or a damaged Navamsha, still has to be read on its own.',
      'supportive',
    ))
  }

  const touches = (g: GrahaData | undefined, asLord: boolean): number => {
    if (!g) return 0
    let n = 0
    if (houseOf(g.rashi, asc) === 7) n += 3
    if (asLord) n += 2
    if (aspects(g, seventh)) n += 1
    if (lord && g.id !== lord.id && g.rashi === lord.rashi) n += 2
    return n
  }
  let marsScore = touches(mars, lordId === 'Ma')
  let moonScore = touches(moon, lordId === 'Mo')
  let venusScore = touches(venus, lordId === 'Ve')
  if (d9Venus && capable(d9Venus.dignity) && !d9Venus.isCombust) venusScore += 2

  const kinds: { id: MarriageKind; score: number; title: string; detail: string }[] = [
    {
      id: 'physical',
      score: marsScore,
      title: 'A physical marriage',
      detail: 'Mars is the loudest voice on marriage. The choice runs through attraction, looks, family standing, and money. Feeling and soul can still be there. They are not what is driving the decision.',
    },
    {
      id: 'mental',
      score: moonScore,
      title: 'An emotional marriage',
      detail: 'The Moon is the loudest voice on marriage. Emotional fit matters more than how good the person looks on paper. The bond stands or falls on whether the two feel like they belong together.',
    },
    {
      id: 'soul',
      score: venusScore,
      title: 'A soul marriage',
      detail: 'Venus is the loudest voice, and the Navamsha is where that voice is trusted. Background and appearance matter less than the sense that the bond was already there. Venus still has to be strong in the Navamsha for this to hold.',
    },
  ]
  const ranked = [...kinds].sort((a, b) => b.score - a.score)

  let kind: MarriageKind = 'open'
  if (ranked[0].score >= 3 && ranked[0].score > ranked[1].score) {
    kind = ranked[0].id
    kindNotes.push(note(`class-kind-${kind}`, ranked[0].title, ranked[0].detail, kind === 'soul' ? 'supportive' : 'mixed'))
  }

  const d9Jupiter = find(d9, 'Ju')
  const d9Saturn = find(d9, 'Sa')
  const moonLinked = !!moon && (lordId === 'Mo' || houseOf(moon.rashi, asc) === 7 || aspects(moon, seventh) || joined(moon, lord))
  const venusLinked = !!venus && (lordId === 'Ve' || houseOf(venus.rashi, asc) === 7 || aspects(venus, seventh) || joined(venus, lord))
  const jupiterLinked = !!jupiter && (houseOf(jupiter.rashi, asc) === 7 || aspects(jupiter, seventh) || joined(jupiter, lord) || joined(jupiter, venus) || (!!venus && aspects(jupiter, venus.rashi)))
  const moonNodes = (!!moon && ((rahu && sees(rahu, moon)) || (ketu && sees(ketu, moon))))
    || (!!d9Moon && ((find(d9, 'Ra') && sees(find(d9, 'Ra'), d9Moon)) || (find(d9, 'Ke') && sees(find(d9, 'Ke'), d9Moon))))
  const moonHolds = holdsAcross(moon, d9Moon)
  const venusHolds = holdsAcross(venus, d9Venus)
  const jupiterHolds = holdsAcross(jupiter, d9Jupiter)
  const venusD1Mal = !!venus && maleficsOn(venus, chart.grahas).length > 0
  const venusD9Mal = !!d9Venus && maleficsOn(d9Venus, d9 ?? []).length > 0
  const jupiterD1Mal = !!jupiter && maleficsOn(jupiter, chart.grahas).length > 0
  const jupiterD9Mal = !!d9Jupiter && maleficsOn(d9Jupiter, d9 ?? []).length > 0
  const venusClear = dignityBand(d9Venus, false) === 'strong' ? !venusD9Mal : !venusD1Mal && !venusD9Mal
  const jupiterClear = dignityBand(d9Jupiter, false) === 'strong' ? !jupiterD9Mal : !jupiterD1Mal && !jupiterD9Mal
  const moonOk = moonLinked && moonHolds && !moonNodes
  const venusOk = venusLinked && venusHolds && venusClear
  const jupiterClean = !!jupiter && jupiterHolds && jupiterClear
  const jupiterOk = jupiterLinked && jupiterClean
  const missing = [moonOk, venusOk, jupiterOk].filter(v => !v).length
  const venusMalNote = venusD1Mal && dignityBand(d9Venus, false) === 'strong' && !venusD9Mal
    ? ' A difficult planet sits on Venus in the birth chart. The Navamsha is clear of that.'
    : ''
  const jupiterMalNote = jupiterD1Mal && dignityBand(d9Jupiter, false) === 'strong' && !jupiterD9Mal
    ? ' A difficult planet sits on Jupiter in the birth chart. The Navamsha is clear of that.'
    : ''
  pillarNotes.push(note(
    'class-pillars',
    missing >= 2 ? 'Two pillars of the marriage are missing' : missing === 1 ? 'One pillar is thin' : 'Emotional bond, attraction, and protection are all available',
    `Feeling (the Moon) ${!moonLinked ? 'does not reach the marriage house' : moonOk ? 'reaches the marriage and holds' : moonHolds ? 'reaches the marriage, and Rahu or Ketu still pulls the feelings' : 'reaches the marriage and does not hold'}. ${strengthSentence('the Moon', moon, d9Moon)} Attraction (Venus) ${!venusLinked ? 'does not reach the marriage house' : venusOk ? 'reaches the marriage and holds' : venusHolds ? 'reaches the marriage, and a difficult planet still sits on it' : 'reaches the marriage and does not hold'}. ${strengthSentence('Venus', venus, d9Venus)}${venusMalNote} Protection (Jupiter) ${!jupiterLinked ? 'does not reach the marriage house' : jupiterOk ? 'reaches the marriage and holds' : jupiterHolds ? 'reaches the marriage, and a difficult planet still sits on it' : 'reaches the marriage and does not hold'}. ${strengthSentence('Jupiter', jupiter, d9Jupiter)}${jupiterMalNote} A stable marriage needs all three. If two are missing, the marriage does not hold.`,
    missing >= 2 ? 'caution' : missing === 1 ? 'mixed' : 'supportive',
  ))

  if (jupiterLinked && jupiter && !jupiterClean) {
    pillarNotes.push(note(
      'class-jupiter-stained',
      'Jupiter touches the marriage, and the protection is thin',
      `A clean Jupiter seeing the 7th house or Venus can hold the marriage. ${strengthSentence('Jupiter', jupiter, d9Jupiter)} ${jupiterD1Mal || jupiterD9Mal ? 'A difficult planet sits on Jupiter where that strain is named, so guidance is refused there.' : 'The weakness is in Jupiter’s own strength.'}`,
      'caution',
    ))
  } else if (jupiterOk) {
    pillarNotes.push(note(
      'class-jupiter-clean',
      'A clean Jupiter can hold the vow',
      `Jupiter reaches the marriage. ${strengthSentence('Jupiter', jupiter, d9Jupiter)} That can hold the vow. It means the couple still has someone, inside the chart, who can listen.`,
      'supportive',
    ))
  }

  if (saturn && KENDRA.has(houseOf(saturn.rashi, asc)) && (dignityBand(saturn, true) === 'strong' || dignityBand(d9Saturn, false) === 'strong')) {
    const saturnHolds = holdsAcross(saturn, d9Saturn)
    pillarNotes.push(note(
      'class-saturn-stable',
      saturnHolds ? 'Saturn holds the marriage by consistency' : 'Saturn looks steady, and the Navamsha does not keep it',
      `The Moon and Saturn steady a marriage. Mars is secondary. Venus decides whether attraction exists. ${strengthSentence('Saturn', saturn, d9Saturn)} ${saturnHolds ? 'It keeps the vow by routine and boundaries, not by romance.' : 'A corner house in the birth chart is not enough once the Navamsha is weak.'}`,
      saturnHolds ? 'supportive' : 'mixed',
    ))
  }

  if (moon && venus) {
    const rel = axis(moon.rashi, venus.rashi)
    const code: Record<typeof rel, { title: string; detail: string; tone: LifeTone }> = {
      '5-9': {
        title: 'Moon and Venus support each other',
        detail: 'The Moon and Venus are in a supportive angle. Feeling and desire agree. This is the harmony a marriage needs between the two.',
        tone: 'supportive',
      },
      '3-11': {
        title: 'Moon and Venus assist each other',
        detail: 'The Moon and Venus are in a helpful angle. Feeling and desire can reach each other, through effort and through other people.',
        tone: 'supportive',
      },
      '1-7': {
        title: 'Moon and Venus share one axis',
        detail: 'Feeling and desire sit together, or they face each other. The bond is immediate. It can be devotion. It can also be too much of both at once.',
        tone: 'mixed',
      },
      '4-10': {
        title: 'Moon and Venus are in friction',
        detail: 'When a marriage is breaking, feeling and attraction are out of balance before any other combination shows it. Here the Moon and Venus are at a right angle. Affection keeps missing its aim.',
        tone: 'caution',
      },
      '6-8': {
        title: 'Moon and Venus scatter the bond',
        detail: 'This angle between the Moon and Venus is the one present when a marriage actually ends. Feeling goes one way. Attraction goes another. Intimacy has no center. Ego then finishes it: neither person will bend.',
        tone: 'caution',
      },
      '2-12': {
        title: 'Moon and Venus sit beside each other',
        detail: 'The Moon and Venus sit in neighboring signs. The link is unsettled, not decided. This angle alone does not mean a divorce.',
        tone: 'mixed',
      },
    }
    if (rel !== '2-12') patternNotes.push(note('class-moon-venus', code[rel].title, code[rel].detail, code[rel].tone))
  }

  const lordAfflicted = !!lord && (weak(lord) || (lordHouse != null && DUSTHANA.has(lordHouse)) || maleficsOn(lord, chart.grahas).length > 0)
  const venusAfflicted = !!venus && (weak(venus) || maleficsOn(venus, chart.grahas).length > 0)
  const d9VenusStrong = dignityBand(d9Venus, false) === 'strong'
  const d9VenusAfflicted = !!d9Venus && (dignityBand(d9Venus, false) === 'weak' || maleficsOn(d9Venus, d9 ?? []).length > 0)
  const d9LordStrong = !!d9SeventhLord && capable(d9SeventhLord.dignity) && !weak(d9SeventhLord) && (d9SeventhLordHouse == null || !DUSTHANA.has(d9SeventhLordHouse))
  const d9Unstable = d9VenusAfflicted || (!!d9SeventhLord && (weak(d9SeventhLord) || (d9SeventhLordHouse != null && DUSTHANA.has(d9SeventhLordHouse))))
  const venusSignLord = venus ? find(chart.grahas, LORDS[venus.rashi]) : undefined
  const seventhStrong = (!!lord && dignified(lord.dignity) && lordHouse != null && !DUSTHANA.has(lordHouse) && !weak(lord))
  const manyYoga = !!venus && DUAL.has(venus.rashi) && !!venusSignLord && capable(venusSignLord.dignity) && !venusSignLord.isCombust && seventhStrong

  let pattern: MarriagePattern = 'open'
  if (d9 && lordAfflicted && d9Unstable && (venusAfflicted || d9VenusAfflicted)) {
    pattern = 'divorce'
    patternNotes.push(note(
      'class-pattern-divorce',
      'Both charts and Venus are unsteady',
      'The marriage lord is under strain in the birth chart, the Navamsha repeats that strain, and Venus is under strain too. The marriage lord points to one break. Venus points to attraction losing its direction. The Navamsha repeating both raises a second relationship. This is the pattern. It is not a date.',
      'caution',
    ))
  } else if (d9 && lordAfflicted && d9VenusStrong && d9LordStrong) {
    pattern = 'second'
    patternNotes.push(note(
      'class-pattern-second',
      'The first bond finishes; a later one fits',
      'The marriage lord is under strain in the birth chart, in whatever house it occupies, while Venus and the marriage lord are strong in the Navamsha. The earlier bond is deep and can feel already decided. Depth does not keep it. It is the bond that finishes an old account. The later bond is the one that fits. A strong Navamsha means the marriage story is not over. This is not a certainty, and it is not a date. Keep this private if a spouse was never told.',
      'mixed',
    ))
  } else if (manyYoga) {
    pattern = 'many'
    patternNotes.push(note(
      'class-pattern-many',
      'Several bonds, from a strong Venus',
      `Venus is in a double-natured sign (Gemini, Virgo, Sagittarius, or Pisces), the lord of that sign is strong, and the 7th house is strong. All three are required. If one is missing, this does not apply. It means several important relationships, not automatically several weddings: one marriage with other bonds, or a life that grows by moving from person to person. A close friendship beside the marriage, with a clear boundary, is different. ${manyField(chart.meta?.gender)} The work is to stop using the next person as a way to improve oneself.`,
      'mixed',
    ))
  } else if (d9 && lord && lordHouse != null && KENDRA.has(lordHouse) && !lordAfflicted && !venusAfflicted && d9LordStrong && !!moon && FIXED.has(moon.rashi)) {
    pattern = 'linear'
    patternNotes.push(note(
      'class-pattern-linear',
      'A marriage that grows in a line',
      'The marriage lord is in a corner house and free of strain, Venus is free of strain, the Navamsha marriage lord is strong, and the Moon is in a fixed sign. The bond grows in a line: friendship, attachment, commitment, marriage. Loyalty is built in. The questions that arise are more often about children, property, and work than about a breakup.',
      'supportive',
    ))
  }

  const d1Moderate = !!lord && !lordAfflicted && !seventhStrong
  const venusVeryStrong = !!venus && dignified(venus.dignity) && !venus.isCombust && d9VenusStrong
  if (pattern === 'open' && d9 && d1Moderate && d9LordStrong && venusVeryStrong) {
    pattern = 'many'
    patternNotes.push(note(
      'class-pattern-moderate',
      'Several bonds, with a very strong Venus',
      'The birth chart is neither settled nor broken. The Navamsha marriage lord is strong, and Venus is very strong in both charts. Several important relationships can follow, one layer ending before the next begins. This is not counted from the 7th house alone, and it is not a count of weddings.',
      'mixed',
    ))
  }

  if (d9 && lordAfflicted && d9VenusStrong && !d9LordStrong && pattern !== 'divorce') {
    patternNotes.push(note(
      'class-karmic-first',
      'The first bond settles an old account',
      'The marriage lord is under strain in the birth chart, in whatever house it occupies, and Venus is strong in the Navamsha. The earlier bond is deep and can feel already decided. It is the bond that finishes the account. The later bond is the one that can align. Strength of Venus in the Navamsha does not make that first ending a certainty, and it does not name a year.',
      'mixed',
    ))
  }

  if (lordAfflicted && pattern !== 'divorce' && pattern !== 'second' && !(d9 && d9VenusStrong && !d9LordStrong)) {
    patternNotes.push(note(
      'class-one-break',
      'The marriage lord is under strain',
      'On its own, a strained marriage lord means one break in the relationship line. It does not name a second marriage, and it does not name a year. Those need Venus and the Navamsha to show the same damage.',
      'caution',
    ))
  }
  if (venusAfflicted && pattern !== 'divorce') {
    patternNotes.push(note(
      'class-attraction-crisis',
      'Attraction loses its direction',
      'Venus is under strain. This is separate from the marriage lord. The bond may still exist, while desire inside it scatters. Affection, love, and intimacy stop pointing the same way.',
      'caution',
    ))
  }
  if (d9 && lordAfflicted && d9VenusAfflicted && d9Unstable && pattern !== 'divorce') {
    patternNotes.push(note(
      'class-remarriage',
      'The Navamsha repeats the damage',
      'The strain on the marriage lord and the strain on Venus both show again in the Navamsha. That repeat is the question of a second bond. The first break, and the loss of attraction, are already in the birth chart.',
      'caution',
    ))
  }
  if (lordAfflicted && pattern !== 'divorce' && pattern !== 'second' && d9LordStrong && !d9VenusStrong) {
    patternNotes.push(note(
      'class-d9-protects',
      'The marriage story is not finished',
      'The marriage lord is under strain in the birth chart, and the Navamsha still has a strong marriage lord or an exalted Venus. There is still something to complete. The bond can survive for that reason, even while daily life is rough.',
      'mixed',
    ))
  }

  const touchedBy = (target: GrahaData | undefined, list: GrahaData[] | undefined): string[] => {
    if (!target || !list) return []
    return maleficsOn(target, list).map(g => gn(g.id))
  }
  const layerBits: string[] = []
  const lordTouch = touchedBy(lord, chart.grahas)
  const venusTouch = touchedBy(venus, chart.grahas)
  const d9VenusTouch = touchedBy(d9Venus, d9)
  const d9LordTouch = touchedBy(d9SeventhLord, d9)
  if (lordTouch.length) layerBits.push(`${lordTouch.join(' and ')} on the 7th lord`)
  if (lordHouse != null && DUSTHANA.has(lordHouse)) layerBits.push(`the 7th lord in house ${lordHouse}`)
  if (venusTouch.length) layerBits.push(`${venusTouch.join(' and ')} on Venus`)
  if (d9VenusTouch.length) layerBits.push(`${d9VenusTouch.join(' and ')} on D9 Venus`)
  if (d9LordTouch.length) layerBits.push(`${d9LordTouch.join(' and ')} on the D9 7th lord`)
  if (d9SeventhLordHouse != null && DUSTHANA.has(d9SeventhLordHouse)) layerBits.push(`the D9 7th lord in house ${d9SeventhLordHouse}`)
  if (layerBits.length) {
    patternNotes.push(note(
      'class-layers',
      'Where the strain sits',
      `Three questions stay separate. Here they are: ${layerBits.join('; ')}. The marriage lord answers whether a bond breaks. Venus answers whether attraction still has one direction. The Navamsha answers whether the same damage is still there at a deeper level. The first layer ends before the next one begins. Naming the place of the strain is not yet naming a year.`,
      'caution',
    ))
  }

  if (venus && (sees(rahu, venus) || (d9Venus && sees(find(d9, 'Ra'), d9Venus)))) {
    patternNotes.push(note(
      'class-cyclic-ra',
      'Venus with Rahu keeps restarting',
      'Venus and Rahu meet in the birth chart or in the Navamsha. The pull feels like a past life, and it behaves like a trap: fast, obsessive, and hard to end cleanly. The bond breaks and repairs on a loop. Venus with Mars is the other form of that loop.',
      'caution',
    ))
  } else if (venus && mars && (sees(mars, venus) || (d9Venus && d9Mars && sees(d9Mars, d9Venus)))) {
    patternNotes.push(note(
      'class-cyclic-ma',
      'Venus with Mars keeps restarting',
      'Venus and Mars meet in the birth chart or in the Navamsha. The attraction is physical and hard to close. The bond breaks and comes back because the heat never became a decision.',
      'mixed',
    ))
  }

  if (venus && d9Venus && dignified(venus.dignity) && d9Venus.dignity === 'debilitated') {
    const d9VenusHouse = d9Asc ? houseOf(d9Venus.rashi, d9Asc) : null
    const ownSign = venus.dignity === 'own' || venus.dignity === 'moolatrikona'
    patternNotes.push(note(
      'class-venus-flip',
      'Strong at the start, fallen underneath',
      `${ownSign ? `Venus is in its own sign, ${rn(venus.rashi)}, in the birth chart` : 'Venus is strong in the birth chart'} and fallen in the Navamsha${d9VenusHouse ? `, house ${d9VenusHouse}` : ''}. The opening is on again and off again, with turns that were not in the plan. The bond is still an old account. Strength in the birth chart does not cancel the fall underneath.`,
      'caution',
    ))
  }

  const debilityDouble = !!lord && lord.dignity === 'debilitated' && maleficsOn(lord, chart.grahas).some(g => g.rashi === lord.rashi)
  const seventhCuspNav = typeof chart.lagnas?.ascDegree === 'number' && Number.isFinite(chart.lagnas.ascDegree)
    ? D9((chart.lagnas.ascDegree + 180) % 360) as Rashi
    : null
  const klibaNav = (seventhCuspNav != null && DUAL.has(seventhCuspNav)) || (!!d9Lord && DUAL.has(d9Lord.rashi))
  if (debilityDouble && klibaNav) {
    const navWhere = seventhCuspNav != null && DUAL.has(seventhCuspNav)
      ? `the start of the 7th house falls in ${rn(seventhCuspNav)} in the Navamsha, a double-natured sign`
      : `the marriage lord sits in ${d9Lord ? rn(d9Lord.rashi) : 'a double-natured sign'} in the Navamsha`
    patternNotes.push(note(
      'class-two-bonds',
      'Two bonds: one finishes, one rebuilds',
      `The marriage lord is fallen and sitting with a difficult planet, and ${navWhere}. A double-natured sign on the 7th house in the birth chart is not enough for this. There are two partnerships. The first finishes an old account, often before a wedding or inside a bond that cannot continue. The second is the life rebuilt after that. This does not make the first ending certain. It says which bond is the account, and which bond is the rebuilding.`,
      'caution',
    ))
  }

  if (mars && venus && houseOf(mars.rashi, asc) === 7 && houseOf(venus.rashi, asc) === 7 && saturn && houseOf(saturn.rashi, asc) === 1 && lagnaHouse === 8) {
    patternNotes.push(note(
      'class-three-phases',
      'Attraction, then crisis, then a later calm',
      'Mars and Venus sit in the 7th house, Saturn sits in the rising sign so it sees the marriage, and the rising-sign lord is in the 8th house. All three are required. The first bond is driven by that heat. The second chapter is delay and crisis. The third can settle only by working through the change the 8th house brings. Problems still come in that last chapter. They are worked through. This is how the bonds unfold, not a count of weddings already held.',
      'mixed',
    ))
  }

  if (d9Venus && d9Mars && d9Venus.rashi === d9Mars.rashi && lord && saturn && (sees(saturn, lord) || (lordHouse != null && houseOf(saturn.rashi, asc) === 7))) {
    patternNotes.push(note(
      'class-three-deep',
      'Three deep bonds, the last one steady',
      'Venus and Mars are together in the Navamsha, and Saturn strains the marriage lord in the birth chart. There are three intense relationships. Steadiness arrives in the third. Keep this private unless both people already know the history.',
      'mixed',
    ))
  }

  let karmic = 0
  let soul = 0
  if (venus && sees(rahu, venus)) karmic += 1
  if (d9Venus && sees(find(d9, 'Ra'), d9Venus)) karmic += 1
  if (rahu && houseOf(rahu.rashi, asc) === 7) karmic += 1
  if (moon && ((rahu && sees(rahu, moon)) || (ketu && sees(ketu, moon)))) karmic += 1
  if (d9Venus && (weak(d9Venus) || d9VenusAfflicted)) karmic += 1
  if (lordHouse === 8) karmic += 1

  if (venus && jupiter && sees(jupiter, venus)) soul += 1
  if (d9VenusStrong) soul += 1
  if (moon && venus && (axis(moon.rashi, venus.rashi) === '5-9' || axis(moon.rashi, venus.rashi) === '3-11')) soul += 1
  const venusOnD9Lagna = !!d9Venus && !!d9Asc && houseOf(d9Venus.rashi, d9Asc) === 1
  if (venusOnD9Lagna || (d9Venus && d9LagnaLord && (sees(d9LagnaLord, d9Venus) || d9LagnaLord.id === 'Ve'))) soul += 1
  if (d9LordStrong && d9VenusStrong) soul += 1
  const ketuWithVenus = (!!venus && !!ketu && sees(ketu, venus)) || (!!d9Venus && !!find(d9, 'Ke') && sees(find(d9, 'Ke'), d9Venus))
  const jupiterOnThat = (!!jupiter && !!venus && sees(jupiter, venus)) || (!!find(d9, 'Ju') && !!d9Venus && sees(find(d9, 'Ju'), d9Venus))
  if (ketuWithVenus && jupiterOnThat) soul += 1

  let bond: MarriageBond = 'open'
  if (karmic >= 2 && soul >= 2) {
    bond = 'mixed'
    bondNotes.push(note(
      'class-bond-mixed',
      'An old debt and a soul bond are both here',
      'Both patterns are strong enough that this is not one label. Venus in the Navamsha decides it. Strength there lets the soul bond grow. Weakness there keeps the old debt in charge. Happy moments can exist in either. Lasting peace belongs to the soul bond.',
      'mixed',
    ))
  } else if (karmic >= 2) {
    bond = 'karmic'
    bondNotes.push(note(
      'class-bond-karmic',
      'An old account, not a peaceful bond',
      'At least two of these are present: Venus with Rahu, Rahu in the 7th house, Rahu or Ketu on the Moon, a weak Venus in the Navamsha, or the marriage lord in the 8th house. The start is fast and intense. Feeling is unstable, and decisions stall. Attraction has no contentment. Happy moments can keep arriving. The peace that stays does not. The purpose is an unpaid account. The bond changes when that account is finished, by separation or by the marriage becoming a different one. The first three years are the roughest. A child can settle the house. A child does not erase the account.',
      'caution',
    ))
  } else if (soul >= 2) {
    bond = 'soul'
    const beneficBody = (g: GrahaData) => {
      if (!d9SeventhLord || g.id === d9SeventhLord.id) return false
      if (g.id !== 'Ju' && g.id !== 'Ve' && g.id !== 'Mo') return false
      if (g.id === 'Mo' && g.isWaxingMoon === false) return false
      return true
    }
    const joinedBenefic = !!d9SeventhLord && (d9 ?? []).some(g => beneficBody(g) && g.rashi === d9SeventhLord.rashi)
    const aspectOnly = !!d9SeventhLord && !joinedBenefic && (d9 ?? []).some(g => beneficBody(g) && aspects(g, d9SeventhLord.rashi))
    const pure = d9SeventhLord?.dignity === 'exalted' && joinedBenefic
    const obliged = d9SeventhLord?.dignity === 'exalted' && aspectOnly
    const lead = pure
      ? 'In the Navamsha, the marriage lord is exalted and sitting with a helpful planet. That is a clean soul bond. '
      : obliged
        ? 'In the Navamsha, the marriage lord is exalted and a helpful planet only sees it. An old obligation stays on that soul bond. '
        : ''
    bondNotes.push(note(
      'class-bond-soul',
      pure ? 'A soul bond, with a helpful planet beside it' : obliged ? 'A soul bond, with an old obligation' : 'A soul bond',
      `${lead}The start is slow. Emotion is quiet. Decisions do not need a debate. Both people should be able to say that life became easier, and both should mean the same life. Venus with Ketu, under Jupiter, is a past-life spiritual pair: inner growth matters more than display.`,
      'supportive',
    ))
  }

  const ageMoved = [saturn, rahu, ketu].some(g =>
    !!g && (houseOf(g.rashi, asc) === 7 || sees(g, venus) || sees(g, lord)),
  )
  if (bond !== 'open' && ageMoved) {
    navNotes.push(note(
      'class-age-moved',
      'No year for meeting or ending',
      'Saturn, Rahu, or Ketu reaches Venus, the marriage lord, or the 7th house, so the usual ages shift. Early life is still family karma. The years after that are still emotional learning. Neither stretch names the year two people meet, or the year an old bond ends.',
      'mixed',
    ))
  }

  if (d9Venus && d9Asc && houseOf(d9Venus.rashi, d9Asc) === 8) {
    navNotes.push(note(
      'class-d9-venus-8',
      'Venus in the 8th of the Navamsha',
      `${d9Venus.dignity === 'exalted' ? 'Venus is exalted, and the 8th still wins the argument. ' : ''}Venus in the 8th house of the Navamsha is suffering carried inside the marriage. Strength makes that suffering easier to name. It does not move the house.`,
      'caution',
    ))
  }

  if (d9Venus && ((find(d9, 'Sa') && joined(d9Venus, find(d9, 'Sa'))) || (find(d9, 'Ke') && joined(d9Venus, find(d9, 'Ke'))))) {
    navNotes.push(note(
      'class-d9-venus-sa-ke',
      'Navamsha Venus with Saturn or Ketu',
      `The marriage loses its everyday pleasure, the part that makes a household feel worth it. What remains is a hard purification: wide differences, conflict, and a turn toward the spiritual that arrives because ease did not. The marriage lord does not have to be in the 6th, 8th, or 12th for this.${lordHouse === 8 ? ' The marriage lord is in the 8th, which belongs to the same hard pattern.' : ''}${moon && ((rahu && sees(rahu, moon)) || (ketu && sees(ketu, moon))) ? ' Rahu or Ketu on the Moon keeps feelings unsteady while that purification runs.' : ''} People who live this often end up guiding others. That comes from the heat. It is not a remedy to start with.`,
      'caution',
    ))
  }

  const d9VenusMarked = !!d9Venus && (
    d9VenusStrong
    || d9Venus.dignity === 'debilitated'
    || dignityBand(d9Venus, false) === 'weak'
    || !!d9Venus.isRetro
    || !!(find(d9, 'Ra') && sees(find(d9, 'Ra'), d9Venus))
  )
  if (d9Venus && d9VenusMarked) {
    const cond = dignityBand(d9Venus, false) === 'strong'
      ? 'Venus is strong in the Navamsha. Love is something this person can feel, not only an idea.'
      : d9Venus.dignity === 'debilitated'
        ? 'Venus is fallen in the Navamsha. Love is an effort before it becomes the climate of the life.'
        : dignityBand(d9Venus, false) === 'weak'
          ? 'Venus is weak in the Navamsha. Love is an effort before it becomes the climate of the life.'
          : ''
    const retro = d9Venus.isRetro
      ? ' Venus is retrograde, moving backward, and that carries into the Navamsha. This is an unfinished love from before this life. Strength does not close that account.'
      : ''
    const node = find(d9, 'Ra') && sees(find(d9, 'Ra'), d9Venus) ? ' Rahu on Navamsha Venus makes the attraction obsessive, like an old pull that will not let go.' : ''
    navNotes.push(note('class-d9-venus', 'How love is experienced', `${cond}${retro}${node}`.trim(), d9VenusStrong && !d9Venus.isRetro ? 'supportive' : d9VenusAfflicted || d9Venus.isRetro ? 'caution' : 'mixed'))
  }

  if (d9SeventhLord) {
    const influencers: { id: GrahaId; word: string }[] = [
      { id: 'Ju', word: 'a spiritual partner' },
      { id: 'Ve', word: 'a romantic soulmate' },
      { id: 'Sa', word: 'a duty marriage' },
      { id: 'Ra', word: 'a karmic-bond partner' },
    ]
    const hit = influencers.find(row => {
      const g = find(d9, row.id)
      return !!g && g.id !== d9SeventhLord.id && sees(g, d9SeventhLord)
    })
    if (hit) {
      navNotes.push(note(
        `class-d9-seventh-${hit.id}`,
        `The deeper marriage lord is with ${gn(hit.id)}`,
        `The Navamsha marriage lord describes the partner at a deeper level. ${gn(hit.id)} touches it, so the partner is ${hit.word}.`,
        hit.id === 'Ju' || hit.id === 'Ve' ? 'supportive' : 'mixed',
      ))
    }
  }

  if (moon && lord && lordId !== 'Mo' && (joined(moon, lord) || (aspects(moon, lord.rashi) && aspects(lord, moon.rashi)) || exchange(moon, lord))) {
    navNotes.push(note(
      'class-moon-lord-mutual',
      'Moon and the 7th lord see each other',
      'They sit together, exchange signs, or each sees the other. That two-way link is a soul connection in the birth chart. One planet seeing the other, with no return, would not have been enough.',
      'supportive',
    ))
  } else if (moon && lord && lordId !== 'Mo' && (aspects(lord, moon.rashi) || aspects(moon, lord.rashi))) {
    navNotes.push(note(
      'class-moon-lord-one-way',
      'Moon and the 7th lord meet only one way',
      'One sees the other, and the look is not returned. That is not a full soul link.',
      'mixed',
    ))
  }

  if (lordId === 'Mo' && moon) {
    const moonHouse = houseOf(moon.rashi, asc)
    const star = nakName(moon.nakshatraIndex)
    const signLord = find(chart.grahas, LORDS[moon.rashi])
    const watchers = chart.grahas.filter(g => g.id !== 'Mo' && aspects(g, moon.rashi)).map(g => gn(g.id))
    const paksha = moon.isWaxingMoon === false ? 'waning' : moon.isWaxingMoon === true ? 'waxing' : 'of unstated phase'
    navNotes.push(note(
      'class-moon-is-lord',
      'The Moon itself rules marriage',
      `Cancer is on the 7th, so the Moon is the marriage lord. It sits in ${rn(moon.rashi)}${star ? `, ${star}` : ''}, house ${moonHouse}${KENDRA.has(moonHouse) ? ', a corner house' : ''}, ${paksha}. The lord of that sign is ${signLord ? `${gn(signLord.id)} in ${rn(signLord.rashi)}, ${plainStrength(signLord.dignity)}` : 'not on the chart'}. ${watchers.length ? `${watchers.join(' and ')} see the Moon.` : 'No planet sees the Moon by aspect.'} These layers are the reading. The Moon is not a shortcut past them.`,
      'mixed',
    ))
  }

  if (venusOnD9Lagna || (d9Venus && d9LagnaLord && (d9LagnaLord.id === 'Ve' || sees(d9LagnaLord, d9Venus)))) {
    const how = venusOnD9Lagna
      ? 'Venus occupies the D9 lagna, the rising sign of the deeper marriage chart.'
      : d9LagnaLord?.id === 'Ve'
        ? 'Venus rules the Navamsha rising sign.'
        : 'Venus and the lord of the Navamsha rising sign see each other.'
    navNotes.push(note(
      'class-soul-contract',
      'Venus is tied to the deeper rising sign',
      `${how} That is a soul contract. The marriage is part of who this person is at a deeper level, not only an event in the birth chart.`,
      'supportive',
    ))
  }

  const veNak = venus?.nakshatraIndex
  const moNak = moon?.nakshatraIndex
  const d9VeNak = d9Venus?.nakshatraIndex
  if (veNak != null && nakName(veNak)) {
    const layers: string[] = []
    if (RAHU_NAKS.has(veNak)) layers.push('This is a Rahu birth star: the attraction is old and obsessive, and the emotions change often.')
    if (veNak === 16) {
      layers.push('Anuradha is Saturn’s birth star, and it still carries devotion. Duty comes before romance, and a separation is hard to make final.')
    } else {
      if (DUTY_NAKS.has(veNak)) layers.push('This is Saturn’s birth star: a marriage of duty. Commitment runs ahead of romance.')
      if (SOUL_NAKS.has(veNak)) layers.push('This birth star supports a soul bond: closeness, devotion, and a separation that is hard to make final.')
    }
    if (JUPITER_NAKS.has(veNak)) layers.push('This is Jupiter’s birth star: spiritual growth that stays tied to ordinary life.')
    if (KETU_NAKS.has(veNak)) layers.push('This is Ketu’s birth star: spiritual growth through letting go, not through comfort.')
    if (layers.length) {
      nakNotes.push(note(
        'class-venus-nak',
        `Venus in ${nakName(veNak)}`,
        layers.join(' '),
        RAHU_NAKS.has(veNak) ? 'caution' : 'mixed',
      ))
    }
  }

  if (veNak === 3 && moNak === 4) {
    nakNotes.push(note(
      'class-nak-pair-sustain',
      'Rohini Venus, Mrigashira Moon',
      'This pair is specific. It is not a rule about every fierce birth star. Venus in Rohini with the Moon in Mrigashira is a marriage that can last.',
      'supportive',
    ))
  }
  if (veNak === 5 && moNak === 7) {
    nakNotes.push(note(
      'class-nak-pair-break',
      'Ardra Venus, Pushya Moon',
      'This pair is specific. Venus in Ardra with the Moon in Pushya is an emotional disconnect. Do not extend it to every Rahu or Saturn birth star.',
      'caution',
    ))
  }

  const pairSet = new Set([veNak, moNak])
  if (pairSet.has(3) && pairSet.has(14)) {
    nakNotes.push(note('class-nak-memory-roh-swa', 'Rohini and Swati', 'Venus and the Moon occupy Rohini and Swati. A past-life emotional memory continues into this bond.', 'mixed'))
  }
  if (pairSet.has(16) && pairSet.has(3)) {
    nakNotes.push(note('class-nak-memory-anu-roh', 'Anuradha and Rohini', 'Venus and the Moon occupy Anuradha and Rohini. A deep karmic bond is repeating, not starting.', 'mixed'))
  }
  if (pairSet.has(21) && pairSet.has(26)) {
    nakNotes.push(note('class-nak-memory-shr-rev', 'Shravana and Revati', 'Venus and the Moon occupy Shravana and Revati. This is a soul connection that keeps an emotional memory. Missing the person can outlast the breakup.', 'mixed'))
  }

  const d1Lord = nakLord(veNak ?? undefined)
  const d9NakLord = nakLord(d9VeNak ?? undefined)
  if (d1Lord && d9NakLord) {
    if (d1Lord === d9NakLord) {
      nakNotes.push(note(
        'class-nak-same-lord',
        `Venus keeps ${gn(d1Lord)} as its birth-star lord in both charts`,
        'The same birth-star lord on Venus in the birth chart and in the Navamsha means a past-life relationship is continuing. The degree inside the Navamsha sign is what chooses that star.',
        'mixed',
      ))
    }
    if (d9NakLord === 'Ra') {
      nakNotes.push(note('class-d9-nak-rahu', 'Navamsha Venus in a Rahu birth star', 'Rahu ruling Venus’s birth star in the Navamsha is a loop: the lesson repeats instead of finishing.', 'caution'))
    } else if (d9NakLord === 'Ve' || d9NakLord === 'Ju') {
      nakNotes.push(note('class-d9-nak-benefic', `Navamsha Venus in a ${gn(d9NakLord)} birth star`, 'Venus or Jupiter ruling that birth star is a strong mark for a soul bond. The rest of the Navamsha 7th house still has to agree.', 'supportive'))
    }
  }

  if (venus?.isRetro && d1Lord && d9NakLord && d1Lord === d9NakLord && moon && nakLord(moNak ?? undefined) === d1Lord) {
    nakNotes.push(note(
      'class-retro-memory',
      'Backward Venus repeating a birth-star lord',
      'Venus is moving backward in the birth chart, so that backward motion is present in the Navamsha too. The Moon shares that birth-star lord, and both charts repeat it. A past-life love has not finished.',
      'mixed',
    ))
  }

  const ul = chart.arudhas?.A12
  if (ul) {
    const onUl = chart.grahas.filter(g => g.rashi === ul && ['Ju', 'Ve', 'Sa', 'Ra', 'Su', 'Ke'].includes(g.id))
    if (onUl.length) {
      const words: Record<string, string> = {
        Ju: 'a spiritual marriage',
        Ve: 'a romantic soulmate marriage',
        Sa: 'a duty marriage',
        Ra: 'an obsessive karmic marriage',
        Su: 'a status-oriented marriage',
        Ke: 'a detachment-oriented spiritual marriage',
      }
      navNotes.push(note(
        'class-ul',
        `The marriage point is in ${rn(ul)}`,
        `Upapada, the marriage point, is read in the birth chart. ${onUl.map(g => `${gn(g.id)} on it describes ${words[g.id]}`).join(' ')} When more than one planet sits there, they share the marriage. They do not cancel each other.`,
        'mixed',
      ))
    }
  }

  if (moon && ((rahu && sees(rahu, moon)) || (ketu && sees(ketu, moon)))) {
    strainNotes.push(note(
      'class-moon-node',
      'Rahu or Ketu is on the Moon',
      'Feelings in the marriage are unsteady. Misunderstandings come often, and the first three years are the roughest. After that the house can settle, and a child can settle more of it. How far that reaches still depends on the Navamsha, and on whatever else sees the Moon.',
      'mixed',
    ))
  }

  const hardOn7 = (g: GrahaData | undefined) => !!g && !!lord && (houseOf(g.rashi, asc) === 7 || g.rashi === lord.rashi)
  const touch7 = (g: GrahaData | undefined) => hardOn7(g) || (!!g && aspects(g, seventh))
  const hardCount = [mars, saturn, rahu].filter(hardOn7).length
  if (touch7(mars) && touch7(saturn) && touch7(rahu) && hardCount >= 2 && venus && !holdsAcross(venus, d9Venus)) {
    strainNotes.push(note(
      'class-triple-malefic',
      'Mars, Saturn, and Rahu damage the marriage, and Venus is weak',
      'All three reach the 7th, and at least two of them sit on the house or on its lord, while Venus has no strength. The bond is unstable. The near end is a marriage that continues as duty after the feeling has gone. Divorce is on the same spectrum. Physical loss of a spouse is the far end, and this line does not decide that.',
      'caution',
    ))
  }

  const severe = !!lord && weak(lord) && maleficsOn(lord, chart.grahas).some(g => g.rashi === lord.rashi) && !beneficOn(lord, chart.grahas)
  const d9Pap = !!d9Venus && ['Sa', 'Ra', 'Ke'].some(id => sees(find(d9, id as GrahaId), d9Venus))
  const path = chart.dashas?.vimshottari ? getDashaPathAt(chart.dashas.vimshottari) : []
  const rahuSaturn = path[0]?.lord === 'Ra' && path[1]?.lord === 'Sa'
  if (severe && d9Pap && rahuSaturn) {
    strainNotes.push(note(
      'class-irreversible',
      'Three marks of a bond that cannot restart',
      'The marriage lord is weak, sitting with a difficult planet, and no helpful planet is rescuing it. Navamsha Venus is under Saturn, Rahu, or Ketu. Rahu’s major period is running, with Saturn’s sub-period inside it. This is the point where compromise does not restart the marriage. All three had to be present. It describes this period. It is not a fate already carried out.',
      'caution',
    ))
  } else if (severe && d9Pap) {
    strainNotes.push(note(
      'class-strain-watch',
      'The structure is strained; this period is not the final one',
      'The marriage lord and Navamsha Venus both carry this damage. A bond that does not restart also needs Rahu’s major period with Saturn inside it. That period is the one to watch. Outside it, this is a warning, not an ending.',
      'caution',
    ))
  }

  const sun = find(chart.grahas, 'Su')
  const gender = chart.meta?.gender
  const touchesSign = (g: GrahaData | undefined, sign: number) =>
    !!g && (g.rashi === sign || aspects(g, sign))

  let remarriageSignal = pattern === 'second' || pattern === 'divorce'
  let multiplicity = pattern === 'many'

  const remarriageRefs = [
    seventh,
    moon ? signOf(moon.rashi, 7) : null,
    lord ? signOf(lord.rashi, 7) : null,
  ].filter((s): s is Rashi => s != null)

  if (remarriageRefs.some(sign => touchesSign(sun, sign) && touchesSign(rahu, sign))) {
    remarriageSignal = true
    patternNotes.push(note(
      'class-remarriage-sun-rahu',
      'Sun and Rahu on a seventh',
      gender === 'female'
        ? 'From the lagna, the Moon, or the 7th lord, a seventh is under both the Sun and Rahu. That is a classical second-bond signature in a woman’s chart. It does not say how the first bond ended.'
        : 'From the lagna, the Moon, or the 7th lord, a seventh is under both the Sun and Rahu. In a man’s chart this opens a second chapter in partnership — another serious bond or a life rebuilt after the first. It does not name death or divorce.',
      'caution',
    ))
  }

  if (saturn && moon && mars
    && houseOf(saturn.rashi, asc) === 7
    && houseOf(moon.rashi, asc) === 7
    && houseOf(mars.rashi, asc) === 7) {
    remarriageSignal = true
    patternNotes.push(note(
      'class-remarriage-three',
      'Saturn, Moon, and Mars in the 7th',
      'All three sit in the 7th. The classical remarriage yoga asks for this stack. If one were missing, it would not be read. The form of any first ending stays unnamed.',
      'caution',
    ))
  }

  if (lordHouse === 12) {
    multiplicity = true
    patternNotes.push(note(
      'class-multiplicity-twelfth',
      '7th lord in the 12th — more than one opening',
      'The 7th lord in the 12th opens more than one partnership door: distant bonds, foreign threads, or a second serious chapter. Count openings, not automatic weddings.',
      'mixed',
    ))
  }

  if (manyYoga) multiplicity = true

  const headline = pattern === 'linear'
    ? 'This marriage can grow in a straight line'
    : pattern === 'second'
      ? 'A later bond is the one that fits'
      : pattern === 'divorce'
        ? 'The birth chart, the Navamsha, and Venus are all unsteady'
        : pattern === 'many'
          ? 'This chart draws more than one bond'
          : bond === 'karmic'
            ? 'This marriage is paying an old account'
            : bond === 'soul'
              ? 'This marriage is a soul bond'
              : kind === 'physical'
                ? 'This marriage is chosen from the body and from means'
                : kind === 'mental'
                  ? 'This marriage is chosen from feeling'
                  : kind === 'soul'
                    ? 'Venus is leading this marriage'
                    : 'The kind of marriage is still mixed'

  const summary = [
    lord ? `${gn(lord.id)} rules the marriage house (7th) from ${rn(lord.rashi)}.` : '',
    venus ? `Venus is in ${rn(venus.rashi)}${nakName(veNak) ? `, ${nakName(veNak)}` : ''}.` : '',
    d9Venus ? `In Navamsha (D9, the deeper marriage chart), Venus is ${plainStrength(d9Venus.dignity)}${d9Asc ? `, and the deeper rising sign is ${rn(d9Asc)}` : ''}.` : 'Venus is not available in Navamsha (D9).',
  ].filter(Boolean).join(' ')

  return {
    headline,
    summary,
    principles: MARRIAGE_CLASS_PRINCIPLES,
    frame,
    kind: kindNotes,
    pillars: pillarNotes,
    pattern: patternNotes,
    bond: bondNotes,
    nakshatra: nakNotes,
    navamsha: navNotes,
    strain: strainNotes,
    flags: { kind, pattern, bond, remarriageSignal, multiplicity },
  }
}

/** How the two class readings sit in a match. */
export function compareMarriageClass(
  a: MarriageClassReading,
  b: MarriageClassReading,
  nameA: string,
  nameB: string,
): MarriedLifeNote[] {
  const notes: MarriedLifeNote[] = []
  if (a.flags.bond === 'karmic' && b.flags.bond === 'soul' || a.flags.bond === 'soul' && b.flags.bond === 'karmic') {
    const fast = a.flags.bond === 'karmic' ? nameA : nameB
    const slow = fast === nameA ? nameB : nameA
    notes.push(note(
      'class-pair-pace',
      'One chart wants heat, the other wants peace',
      `${fast} is an old account: fast, intense, and low in peace. ${slow} is a soul bond: slow and quiet. The paces do not match. The quieter person will feel the other’s urgency as pressure. The more urgent person will feel the other’s calm as absence.`,
      'caution',
    ))
  } else if (a.flags.bond !== 'open' && a.flags.bond === b.flags.bond) {
    notes.push(note(
      'class-pair-same-bond',
      a.flags.bond === 'karmic' ? 'Both charts are an old account' : a.flags.bond === 'soul' ? 'Both charts are a soul bond' : 'Both charts carry both layers',
      `${nameA} and ${nameB} have the same kind of bond. That does not make the marriage easy. It means they will recognize the pace.`,
      a.flags.bond === 'soul' ? 'supportive' : 'mixed',
    ))
  }

  if (a.flags.pattern === 'linear' && b.flags.pattern === 'linear') {
    notes.push(note(
      'class-pair-linear',
      'Both marriages are built to proceed in a line',
      'Neither chart is asking for a cycle of breakup and repair. The risk is boredom and unspoken rigidity, not disappearance.',
      'supportive',
    ))
  } else if (
    (a.flags.pattern === 'second' && b.flags.pattern === 'linear')
    || (b.flags.pattern === 'second' && a.flags.pattern === 'linear')
  ) {
    const completing = a.flags.pattern === 'second' ? nameA : nameB
    const steady = completing === nameA ? nameB : nameA
    notes.push(note(
      'class-pair-second-linear',
      'One chart is completing an earlier bond',
      `${completing} is the chart whose first bond is karmic completion. ${steady} is built for a linear marriage. This pairing fits when ${completing} has already finished that earlier chapter. It grinds when this relationship is still the first one.`,
      'mixed',
    ))
  } else if (a.flags.pattern === 'divorce' || b.flags.pattern === 'divorce') {
    const who = a.flags.pattern === 'divorce' && b.flags.pattern === 'divorce'
      ? 'Both charts'
      : a.flags.pattern === 'divorce' ? nameA : nameB
    notes.push(note(
      'class-pair-unstable',
      'Instability is in the pattern, not only in the fight',
      `${who} show D1, D9, and Venus unstable together. Do not time a separation until the type is named and the dasha agrees. Do not promise that a good week has repaired the pattern.`,
      'caution',
    ))
  }

  if (!notes.length) {
    notes.push(note(
      'class-pair-open',
      'The two marriage-types do not form one shared label',
      `Read ${nameA} and ${nameB} separately: kind of marriage, the three pillars, then D9. A shared label would be a convenience, not a finding.`,
      'mixed',
    ))
  }
  return notes
}
