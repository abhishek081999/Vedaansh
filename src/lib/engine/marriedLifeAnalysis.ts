// src/lib/engine/marriedLifeAnalysis.ts
// Quality of married life from one chart.
// Four significators (Venus, 7th, 7th lord, D9 lagna) and the
// flavor / passion / longevity reading used in relationship matching.
// Pure engine — no React/DB.

import { fill, type EngineLang } from '@/lib/engine/lang'
import { dignityText, gName, rName } from '@/lib/engine/divisionalLang'
import { MLA_HI } from '@/lib/engine/locale/marriedLifeAnalysis.hi'
import type { ChartOutput, Dignity, DashaNode, Gender, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getDashaPathAt } from '@/lib/engine/dasha/current'

export type LifeTone = 'supportive' | 'caution' | 'mixed'

export interface MarriedLifeNote {
  id: string
  title: string
  detail: string
  tone: LifeTone
}

export interface SignificatorCard {
  id: 'venus' | 'seventh' | 'seventhLord' | 'd9Lagna'
  title: string
  question: string
  placement: string
  reading: string
  tone: LifeTone
}

export interface DimensionScore {
  id: 'flavor' | 'passion' | 'longevity' | 'blessing' | 'outcome'
  label: string
  planet: string
  score: number
  summary: string
}

export interface HouseSnapshot {
  house: number
  sign: Rashi
  signName: string
  lord: GrahaId
  lordName: string
  lordHouse: number
  occupants: string[]
  malefics: string[]
  tone: LifeTone
  reading: string
}

export interface ProposalSource {
  house: number
  signName: string
  relative: string
  detail: string
}

export interface MarriedLifeAnalysis {
  headline: string
  summary: string
  bondStyle: string
  dimensions: DimensionScore[]
  significators: SignificatorCard[]
  proposal: ProposalSource
  roles: MarriedLifeNote[]
  combinations: MarriedLifeNote[]
  jupiter: MarriedLifeNote[]
  marsAndNodes: MarriedLifeNote[]
  saturn: MarriedLifeNote[]
  remedies: MarriedLifeNote[]
  ethics: string
  seventh: HouseSnapshot
  fourth: HouseSnapshot
  tenth: HouseSnapshot
}

const SIGN_LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const MALEFICS: GrahaId[] = ['Su', 'Ma', 'Sa', 'Ra', 'Ke']
const KAAM = new Set([5, 7, 8, 12])
const KENDRA_TRINE = new Set([1, 4, 5, 7, 9, 10, 11])
const DUSTHANA = new Set([6, 8, 12])
const STRONG: Dignity[] = ['exalted', 'moolatrikona', 'own', 'great_friend']
const FRIENDLY: Dignity[] = ['friend']
const WEAK: Dignity[] = ['debilitated', 'enemy', 'great_enemy']

const PROPOSAL: Record<number, string> = {
  1: 'The person themselves — a self-started alliance, or a proposal from their own circle',
  2: 'Close family',
  3: 'A younger sibling or a neighbor',
  4: 'The mother',
  5: 'The mother’s family (for example a maternal grandfather)',
  6: 'The maternal uncle (mama)',
  7: 'The mother’s side, the father’s friend circle, or the person’s own choice',
  8: 'The in-laws, approaching from their side',
  9: 'The father and his relatives, including elders reached through that side',
  10: 'The father’s family',
  11: 'An elder sibling',
  12: 'A maternal aunt (mami), a grandmother, or similar elders',
}

const ETHICS =
  'Read this as a map of tendencies, not a verdict on someone’s character. A single combination is an influence. A specific event needs several combinations to agree. Hold it with honesty and a little detachment: astrology is for awareness and remedy, not for shaming desire or inducing guilt. D1 is the tree (apply remedies there); D9 is the fruit.'

function clamp(n: number): number {
  return Math.max(0, Math.min(10, n))
}

function rn(r: number, lang: EngineLang = 'en'): string {
  if (lang === 'en') return RASHI_NAMES[r as Rashi] ?? `R${r}`
  return rName(r as Rashi, lang) ?? `R${r}`
}

function gn(id: GrahaId, lang: EngineLang = 'en'): string {
  if (lang === 'en') return GRAHA_NAMES[id] ?? id
  return gName(id, lang)
}

export function wholeSignHouse(planetRashi: number, ascRashi: number): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

export function wholeSignHouseSign(ascRashi: number, house: number): Rashi {
  return (((ascRashi - 1 + house - 1) % 12) + 1) as Rashi
}

function findGraha(chart: ChartOutput, id: GrahaId): GrahaData | undefined {
  return chart.grahas.find(g => g.id === id)
}

function sameSign(a: GrahaData | undefined, b: GrahaData | undefined): boolean {
  return !!a && !!b && a.rashi === b.rashi
}

function houseOf(chart: ChartOutput, id: GrahaId): number | null {
  const g = findGraha(chart, id)
  const asc = chart.lagnas?.ascRashi
  if (!g || !asc) return null
  return wholeSignHouse(g.rashi, asc)
}

function occupants(chart: ChartOutput, house: number): GrahaData[] {
  const asc = chart.lagnas?.ascRashi
  if (!asc) return []
  return chart.grahas.filter(g => wholeSignHouse(g.rashi, asc) === house)
}

function dignityWord(d: Dignity | undefined, lang: EngineLang = 'en'): string {
  if (lang === 'en') {
    if (!d) return 'unknown dignity'
    return d.replace(/_/g, ' ')
  }
  if (!d) return MLA_HI.dignityUnknown
  return dignityText(d, lang)
}

function plainDignity(d: Dignity | undefined, lang: EngineLang = 'en'): string {
  if (lang === 'en') {
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
  const table = MLA_HI.plainDignity
  return (d && table[d]) ? table[d] : table.default
}

function holdsDignity(d: Dignity | undefined): boolean {
  return isStrong(d) || d === 'friend'
}

/** Birth-chart facts, then Navamsha strength. A strong Navamsha holds the planet. */
function acrossCharts(
  name: string,
  d1: GrahaData,
  house: number | null,
  d9: GrahaData | undefined,
  extra = '',
  lang: EngineLang = 'en',
): string {
  if (lang === 'en') {
    const birth = `In the birth chart ${name} is in ${rn(d1.rashi)}${house != null ? `, house ${house}` : ''}, ${plainDignity(d1.dignity)}${extra}`
    if (!d9) return `${birth}.`
    const deep = `In the Navamsha ${name} is in ${rn(d9.rashi)}, ${plainDignity(d9.dignity)}`
    const d9Strong = holdsDignity(d9.dignity)
    const d9Weak = isWeak(d9.dignity)
    const d1Strong = holdsDignity(d1.dignity)
    const d1Weak = isWeak(d1.dignity) || !!d1.isCombust
    let verdict = 'Neither chart is especially strong or weak.'
    if (d9Strong && d1Weak) verdict = 'The birth chart is weak and the Navamsha is strong, so the deeper chart holds it.'
    else if (d9Strong && d1Strong) verdict = 'Both charts are strong.'
    else if (d9Strong) verdict = 'The Navamsha is strong, so the deeper chart holds it.'
    else if (d9Weak && d1Strong) verdict = 'The birth chart looks strong and the Navamsha is weak, so that strength does not hold underneath.'
    else if (d9Weak) verdict = 'The Navamsha is weak, so this does not hold underneath.'
    else if (d1Weak) verdict = 'The birth chart is weak, and the Navamsha does not restore it.'
    else if (d1Strong) verdict = 'The birth chart is strong, and the Navamsha is ordinary.'
    return `${birth}. ${deep}. ${verdict}`
  }

  const T = MLA_HI.across
  const housePart = house != null ? fill(T.birthHouse, { house }) : ''
  const birth = fill(T.birth, {
    name,
    rashi: rn(d1.rashi, lang),
    housePart,
    dignity: plainDignity(d1.dignity, lang),
    extra,
  })
  if (!d9) return birth
  const deep = fill(T.navDeep, { name, rashi: rn(d9.rashi, lang), dignity: plainDignity(d9.dignity, lang) })
  const d9Strong = holdsDignity(d9.dignity)
  const d9Weak = isWeak(d9.dignity)
  const d1Strong = holdsDignity(d1.dignity)
  const d1Weak = isWeak(d1.dignity) || !!d1.isCombust
  let verdict: string = T.verdictNeutral
  if (d9Strong && d1Weak) verdict = T.d9StrongD1Weak
  else if (d9Strong && d1Strong) verdict = T.bothStrong
  else if (d9Strong) verdict = T.d9Strong
  else if (d9Weak && d1Strong) verdict = T.d9WeakD1Strong
  else if (d9Weak) verdict = T.d9Weak
  else if (d1Weak) verdict = T.d1Weak
  else if (d1Strong) verdict = T.d1Strong
  return `${birth} ${deep} ${verdict}`
}

function isStrong(d: Dignity | undefined): boolean {
  return !!d && STRONG.includes(d)
}

function isWeak(d: Dignity | undefined): boolean {
  return !!d && WEAK.includes(d)
}

function dignityDelta(d: Dignity | undefined): number {
  if (!d) return 0
  if (STRONG.includes(d)) return 2
  if (FRIENDLY.includes(d)) return 1
  if (d === 'debilitated') return -2
  if (WEAK.includes(d)) return -1
  return 0
}

function toneFromScore(score: number): LifeTone {
  if (score >= 7) return 'supportive'
  if (score <= 3) return 'caution'
  return 'mixed'
}

function partnerNoun(gender: Gender | undefined, lang: EngineLang = 'en'): string {
  if (lang === 'en') {
    if (gender === 'male') return 'wife'
    if (gender === 'female') return 'husband'
    return 'partner'
  }
  if (gender === 'male') return MLA_HI.partnerNoun.male
  if (gender === 'female') return MLA_HI.partnerNoun.female
  return MLA_HI.partnerNoun.other
}

function marriedNote(
  id: string,
  enTitle: string,
  enDetail: string,
  tone: LifeTone,
  lang: EngineLang,
  values?: Record<string, string | number>,
): MarriedLifeNote {
  if (lang === 'hi') {
    const row = MLA_HI.deepNotes[id as keyof typeof MLA_HI.deepNotes]
    if (row) {
      const detailOverride = values?.detail as string | undefined
      return {
        id,
        title: values?.title ? fill(String(values.title), values) : (values ? fill(row.title, values) : row.title),
        detail: detailOverride ?? (values ? fill(row.detail, values) : row.detail),
        tone,
      }
    }
  }
  return { id, title: enTitle, detail: enDetail, tone }
}

function venusFlavorLine(gender: Gender | undefined, lang: EngineLang = 'en'): string {
  if (lang === 'en') {
    if (gender === 'male') {
      return 'Venus is the flavor of married life: sexual vitality, and whether the wife feels attractive and romantic.'
    }
    if (gender === 'female') {
      return 'Venus is romantic attraction and the aesthetic of the bond. Jupiter, more than Venus, signifies the husband.'
    }
    return 'Venus is the flavor of the bond — romance, attraction, and the spice of married life.'
  }
  if (gender === 'male') return MLA_HI.venusFlavor.male
  if (gender === 'female') return MLA_HI.venusFlavor.female
  return MLA_HI.venusFlavor.other
}

export function marriageHouseSnapshot(chart: ChartOutput, house: number, topic: string, lang: EngineLang = 'en'): HouseSnapshot {
  const asc = (chart.lagnas?.ascRashi ?? 1) as Rashi
  const sign = wholeSignHouseSign(asc, house)
  const lord = SIGN_LORDS[sign]
  const lordGraha = findGraha(chart, lord)
  const lordHouse = lordGraha ? wholeSignHouse(lordGraha.rashi, asc) : house
  const occ = occupants(chart, house)
  const mal = occ.filter(g => MALEFICS.includes(g.id))
  let score = 5
  if (mal.length >= 2) score -= 2
  else if (mal.length === 1) score -= 1
  if (DUSTHANA.has(lordHouse)) score -= 2
  if (KENDRA_TRINE.has(lordHouse) && mal.length === 0) score += 1
  if (lordGraha?.isCombust) score -= 1
  score = clamp(score)
  const names = occ.map(g => gn(g.id, lang))
  const malNames = mal.map(g => gn(g.id, lang))
  const lordDig = lordGraha ? fill(MLA_HI.houseSnapshot.lordDig, { dignity: dignityWord(lordGraha.dignity, lang) }) : ''
  let reading: string
  if (lang === 'en') {
    reading = names.length
      ? `${topic}: ${rn(sign)} holds ${names.join(', ')}. Lord ${gn(lord)} sits in house ${lordHouse}${lordGraha ? ` (${dignityWord(lordGraha.dignity)})` : ''}.`
      : `${topic}: ${rn(sign)} is empty. Its lord ${gn(lord)} sits in house ${lordHouse}${lordGraha ? ` (${dignityWord(lordGraha.dignity)})` : ''}.`
  } else {
    const tpl = names.length ? MLA_HI.houseSnapshot.occupied : MLA_HI.houseSnapshot.empty
    reading = fill(tpl, {
      topic,
      sign: rn(sign, lang),
      names: names.join(', '),
      lord: gn(lord, lang),
      house: lordHouse,
      lordDig,
    })
  }
  return {
    house,
    sign,
    signName: rn(sign, lang),
    lord,
    lordName: gn(lord, lang),
    lordHouse,
    occupants: names,
    malefics: malNames,
    tone: toneFromScore(score),
    reading,
  }
}

export function libraProposal(ascRashi: number, lang: EngineLang = 'en'): ProposalSource {
  const house = wholeSignHouse(7, ascRashi)
  if (lang === 'en') {
    const relative = PROPOSAL[house] ?? 'Family elders'
    return {
      house,
      signName: 'Libra',
      relative,
      detail: `Libra falls in house ${house}. That house shows who is likely to bring the marriage proposal: ${relative}. Self-choice is common now, and this can combine with love or arranged patterns elsewhere in the chart.`,
    }
  }
  const relative = MLA_HI.proposalByHouse[house] ?? MLA_HI.proposalFallback
  return {
    house,
    signName: MLA_HI.libraSign,
    relative,
    detail: fill(MLA_HI.proposalDetail, { house, relative }),
  }
}

function runningLords(chart: ChartOutput): string[] {
  const nodes = chart.dashas?.vimshottari as DashaNode[] | undefined
  if (!nodes?.length) return []
  return getDashaPathAt(nodes).slice(0, 2).map(n => n.lord)
}

function d9Graha(chart: ChartOutput, id: GrahaId): GrahaData | undefined {
  return chart.vargas?.D9?.find(g => g.id === id)
}

function d10House(chart: ChartOutput, id: GrahaId): number | null {
  const asc = chart.vargaLagnas?.D10
  const g = chart.vargas?.D10?.find(p => p.id === id)
  if (!asc || !g) return null
  return wholeSignHouse(g.rashi, asc)
}

export function analyzeMarriedLife(chart: ChartOutput, lang: EngineLang = 'en'): MarriedLifeAnalysis | null {
  const asc = chart.lagnas?.ascRashi
  if (!asc) return null

  const gender = chart.meta?.gender
  const venus = findGraha(chart, 'Ve')
  const mars = findGraha(chart, 'Ma')
  const jupiter = findGraha(chart, 'Ju')
  const sun = findGraha(chart, 'Su')
  const moon = findGraha(chart, 'Mo')
  const mercury = findGraha(chart, 'Me')
  const saturn = findGraha(chart, 'Sa')
  const rahu = findGraha(chart, 'Ra')
  const ketu = findGraha(chart, 'Ke')

  const veH = venus ? wholeSignHouse(venus.rashi, asc) : null
  const maH = mars ? wholeSignHouse(mars.rashi, asc) : null
  const juH = jupiter ? wholeSignHouse(jupiter.rashi, asc) : null
  const suH = sun ? wholeSignHouse(sun.rashi, asc) : null
  const moH = moon ? wholeSignHouse(moon.rashi, asc) : null
  const saH = saturn ? wholeSignHouse(saturn.rashi, asc) : null
  const raH = rahu ? wholeSignHouse(rahu.rashi, asc) : null
  const keH = ketu ? wholeSignHouse(ketu.rashi, asc) : null

  const seventh = marriageHouseSnapshot(
    chart,
    7,
    lang === 'en' ? '7th house' : MLA_HI.houseTopics.seventh,
    lang,
  )
  const fourth = marriageHouseSnapshot(
    chart,
    4,
    lang === 'en' ? '4th house (heart and home)' : MLA_HI.houseTopics.fourth,
    lang,
  )
  const tenth = marriageHouseSnapshot(
    chart,
    10,
    lang === 'en' ? '10th house' : MLA_HI.houseTopics.tenth,
    lang,
  )
  const lord = findGraha(chart, seventh.lord)
  const lordH = lord ? wholeSignHouse(lord.rashi, asc) : seventh.lordHouse

  const withVenus = (id: GrahaId) => sameSign(venus, findGraha(chart, id))
  const yuti = {
    me: withVenus('Me'),
    ra: withVenus('Ra'),
    mo: withVenus('Mo'),
    ke: withVenus('Ke'),
    ma: withVenus('Ma'),
    su: withVenus('Su'),
    ju: withVenus('Ju'),
    sa: withVenus('Sa'),
  }

  // ── Scores ────────────────────────────────────────────────
  // Dignity is read in both charts. Navamsha strength is added on top of the birth chart.
  const d9Venus = d9Graha(chart, 'Ve')
  const d9Mars = d9Graha(chart, 'Ma')
  const d9Jupiter = d9Graha(chart, 'Ju')
  const d9LordPlanet = lord ? d9Graha(chart, lord.id) : undefined

  let flavor = 5 + (venus ? dignityDelta(venus.dignity) : -1)
  if (d9Venus) flavor += dignityDelta(d9Venus.dignity)
  if (veH && KENDRA_TRINE.has(veH)) flavor += 1
  if (veH && DUSTHANA.has(veH)) flavor -= 1
  if (venus?.isCombust) flavor -= 1
  if (yuti.mo || yuti.ju) flavor += 1
  if (yuti.ma) flavor += 1
  if (yuti.ra || yuti.ke) flavor -= 1
  flavor = clamp(flavor)

  let passion = 5
  if (yuti.ma) passion += 2
  if (maH && KAAM.has(maH)) passion += 1
  if (mars && isStrong(mars.dignity)) passion += 1
  if (mars && isWeak(mars.dignity)) passion -= 1
  if (d9Mars) passion += dignityDelta(d9Mars.dignity)
  if (sameSign(mars, rahu)) passion -= 2
  if (sameSign(mars, ketu)) passion -= 1
  if (mars?.rashi === 8 && maH === 7) passion -= 2
  if (juH === 1 || juH === 7) passion -= 1
  passion = clamp(passion)

  let longevity = 5
  if (KENDRA_TRINE.has(lordH)) longevity += 2
  if (DUSTHANA.has(lordH)) longevity -= 2
  if (lord && (sameSign(lord, saturn) || saH === 7)) longevity += 1
  if (lord && sameSign(lord, ketu)) longevity -= 1
  if (raH === 7) longevity -= 1
  if (jupiter && isStrong(jupiter.dignity)) longevity += 1
  if (jupiter && isWeak(jupiter.dignity)) longevity -= 1
  if (d9LordPlanet) longevity += dignityDelta(d9LordPlanet.dignity)
  if (lord?.isCombust) longevity -= 1
  longevity = clamp(longevity)

  let blessing = 5 + (jupiter ? dignityDelta(jupiter.dignity) : 0)
  if (d9Jupiter) blessing += dignityDelta(d9Jupiter.dignity)
  if (juH && [1, 5, 9].includes(juH)) blessing += 1
  if (juH && DUSTHANA.has(juH)) blessing -= 1
  if (yuti.ju && juH === 7) blessing -= 1
  blessing = clamp(blessing)

  const d9Asc = chart.vargaLagnas?.D9
  const d9Lord = d9Asc ? SIGN_LORDS[d9Asc] : null
  const d9LordGraha = d9Lord ? (d9Graha(chart, d9Lord) ?? findGraha(chart, d9Lord)) : undefined
  let outcome = 5
  if (d9Asc) {
    outcome += dignityDelta(d9LordGraha?.dignity)
    outcome += d9Venus ? Math.round(dignityDelta(d9Venus.dignity) / 2) : 0
  }
  outcome = clamp(outcome)

  const venusDisplay = lang === 'en' ? 'Venus' : gName('Ve', lang)
  const marsDisplay = lang === 'en' ? 'Mars' : gName('Ma', lang)
  const jupiterDisplay = lang === 'en' ? 'Jupiter' : gName('Ju', lang)
  const combustExtra = venus?.isCombust ? (lang === 'en' ? ', combust' : MLA_HI.dimSummary.combustExtra) : ''

  const passionLead = lang === 'en'
    ? 'Mars is sexual energy and how evenly desire is met. '
    : `${MLA_HI.dimSummary.passionLead} `
  const longevityLead = lang === 'en'
    ? `The 7th lord (${seventh.lordName}) shows whether the marriage survives or breaks. `
    : `${fill(MLA_HI.dimSummary.longevityLead, { lordName: seventh.lordName })} `
  const longevityTail = lang === 'en'
    ? ' Saturn’s duty can hold a bond after the first spark fades.'
    : MLA_HI.dimSummary.saturnDuty
  const longevityNoLord = lang === 'en'
    ? `The 7th lord (${seventh.lordName}) shows whether the marriage survives or breaks. It sits in house ${lordH}. Saturn’s duty can hold a bond after the first spark fades.`
    : `${fill(MLA_HI.dimSummary.longevityNoLord, { lordName: seventh.lordName, house: lordH })}${MLA_HI.dimSummary.saturnDuty}`
  const blessingLead = lang === 'en'
    ? 'Jupiter is trust, the vow before fire, and whether the couple can accept what comes. '
    : `${MLA_HI.dimSummary.blessingLead} `
  const d9LordDignity = d9Lord ? d9Graha(chart, d9Lord)?.dignity : undefined
  const outcomeSummary = !d9Asc
    ? (lang === 'en'
      ? 'Navamsha lagna is not on this chart, so the fruit of marriage cannot be read yet.'
      : MLA_HI.dimSummary.outcomeMissing)
    : lang === 'en'
      ? `Navamsha lagna is ${rn(d9Asc)} (lord ${d9Lord ? gn(d9Lord) : '—'}).${d9LordDignity ? ` That lord is ${plainDignity(d9LordDignity)} in the Navamsha.` : ''} This is the fruit of marriage. Remedies belong on the birth chart, not on D9.`
      : `${fill(MLA_HI.dimSummary.outcomeLead, { sign: rn(d9Asc, lang), lord: d9Lord ? gn(d9Lord, lang) : '—' })}${d9LordDignity ? fill(MLA_HI.dimSummary.outcomeLord, { dignity: plainDignity(d9LordDignity, lang) }) : ''}${MLA_HI.dimSummary.outcomeFruit}`

  const dimensions: DimensionScore[] = [
    {
      id: 'flavor',
      label: lang === 'en' ? 'Flavor' : MLA_HI.dimensions.flavor.label,
      planet: lang === 'en' ? 'Venus' : MLA_HI.dimensions.flavor.planet,
      score: flavor,
      summary: venus
        ? `${venusFlavorLine(gender, lang)} ${acrossCharts(venusDisplay, venus, veH, d9Venus, combustExtra, lang)}`
        : (lang === 'en' ? 'Venus is missing from this chart payload.' : MLA_HI.dimSummary.venusMissing),
    },
    {
      id: 'passion',
      label: lang === 'en' ? 'Passion' : MLA_HI.dimensions.passion.label,
      planet: lang === 'en' ? 'Mars' : MLA_HI.dimensions.passion.planet,
      score: passion,
      summary: mars
        ? passionLead + acrossCharts(marsDisplay, mars, maH, d9Mars, '', lang)
        : (lang === 'en' ? 'Mars is missing from this chart payload.' : MLA_HI.dimSummary.marsMissing),
    },
    {
      id: 'longevity',
      label: lang === 'en' ? 'Longevity' : MLA_HI.dimensions.longevity.label,
      planet: lang === 'en' ? '7th lord' : MLA_HI.dimensions.longevity.planet,
      score: longevity,
      summary: lord
        ? longevityLead + acrossCharts(seventh.lordName, lord, lordH, d9LordPlanet, '', lang) + longevityTail
        : longevityNoLord,
    },
    {
      id: 'blessing',
      label: lang === 'en' ? 'Blessing' : MLA_HI.dimensions.blessing.label,
      planet: lang === 'en' ? 'Jupiter' : MLA_HI.dimensions.blessing.planet,
      score: blessing,
      summary: jupiter
        ? blessingLead + acrossCharts(jupiterDisplay, jupiter, juH, d9Jupiter, '', lang)
        : (lang === 'en' ? 'Jupiter is missing from this chart payload.' : MLA_HI.dimSummary.jupiterMissing),
    },
    {
      id: 'outcome',
      label: lang === 'en' ? 'Fruit' : MLA_HI.dimensions.outcome.label,
      planet: lang === 'en' ? 'D9 lagna' : MLA_HI.dimensions.outcome.planet,
      score: outcome,
      summary: outcomeSummary,
    },
  ]

  // ── Significators ─────────────────────────────────────────
  const seventhTone: LifeTone = seventh.occupants.length === 0
    ? 'mixed'
    : seventh.tone
  const lordTone: LifeTone = DUSTHANA.has(lordH) ? 'caution' : KENDRA_TRINE.has(lordH) ? 'supportive' : 'mixed'
  const sigHi = MLA_HI.significators
  const navDignity = (d: Dignity | undefined) =>
    lang === 'en' ? ` · Navamsha ${plainDignity(d)}` : fill(sigHi.placementNav, { dignity: plainDignity(d, lang) })

  const significators: SignificatorCard[] = [
    {
      id: 'venus',
      title: lang === 'en' ? 'Venus (Shukra)' : sigHi.venus.title,
      question: lang === 'en' ? 'What is the quality — romance and attraction?' : sigHi.venus.question,
      placement: venus
        ? lang === 'en'
          ? `${rn(venus.rashi)} · house ${veH} · ${plainDignity(venus.dignity)}${d9Venus ? ` · Navamsha ${plainDignity(d9Venus.dignity)}` : ''}`
          : fill(sigHi.placementVenus, {
            sign: rn(venus.rashi, lang),
            house: veH ?? '—',
            dignity: plainDignity(venus.dignity, lang),
            nav: d9Venus ? navDignity(d9Venus.dignity) : '',
          })
        : (lang === 'en' ? 'Unavailable' : sigHi.unavailable),
      reading: dimensions[0].summary,
      tone: toneFromScore(flavor),
    },
    {
      id: 'seventh',
      title: lang === 'en' ? '7th house' : sigHi.seventh.title,
      question: lang === 'en' ? 'Will marriage happen?' : sigHi.seventh.question,
      placement: lang === 'en'
        ? `${seventh.signName} · lord ${seventh.lordName}${seventh.occupants.length ? ` · ${seventh.occupants.join(', ')}` : ' · empty'}`
        : fill(sigHi.placementSeventh, {
          sign: seventh.signName,
          lord: seventh.lordName,
          occ: seventh.occupants.length ? fill(sigHi.occJoined, { names: seventh.occupants.join(', ') }) : sigHi.placementEmpty,
        }),
      reading: seventh.occupants.length
        ? (lang === 'en'
          ? `${seventh.reading} Planets here describe the spouse and the event of marriage.`
          : fill(sigHi.seventhOccupied, { reading: seventh.reading }))
        : (lang === 'en'
          ? `${seventh.reading} An empty 7th does not deny marriage; time it from the 7th lord, Venus, and dasha.`
          : fill(sigHi.seventhEmpty, { reading: seventh.reading })),
      tone: seventhTone,
    },
    {
      id: 'seventhLord',
      title: lang === 'en' ? '7th lord' : sigHi.seventhLord.title,
      question: lang === 'en' ? 'Will the marriage survive or break?' : sigHi.seventhLord.question,
      placement: lord
        ? lang === 'en'
          ? `${gn(lord.id)} in ${rn(lord.rashi)} · house ${lordH} · ${plainDignity(lord.dignity)}${d9LordPlanet ? ` · Navamsha ${plainDignity(d9LordPlanet.dignity)}` : ''}`
          : fill(sigHi.placementLord, {
            lord: gn(lord.id, lang),
            sign: rn(lord.rashi, lang),
            house: lordH,
            dignity: plainDignity(lord.dignity, lang),
            nav: d9LordPlanet ? navDignity(d9LordPlanet.dignity) : '',
          })
        : seventh.lordName,
      reading: DUSTHANA.has(lordH)
        ? (lang === 'en'
          ? `${seventh.lordName} in house ${lordH} puts strain on continuity.${d9LordPlanet && holdsDignity(d9LordPlanet.dignity) ? ' The Navamsha is strong, so the deeper chart still holds the bond.' : ' The bond can still last, but separation, illness, or distance themes need an honest look.'}`
          : fill(sigHi.lordDusthana, {
            lord: seventh.lordName,
            house: lordH,
            navStrong: d9LordPlanet && holdsDignity(d9LordPlanet.dignity) ? sigHi.lordDusthanaNav : sigHi.lordDusthanaNoNav,
          }))
        : (lang === 'en'
          ? `${seventh.lordName} in house ${lordH} ${KENDRA_TRINE.has(lordH) ? 'supports a marriage that can be maintained.' : 'is a mixed seat — continuity depends on the lord’s strength in both charts.'}${d9LordPlanet && isWeak(d9LordPlanet.dignity) ? ' The Navamsha is weak, so that support does not hold underneath.' : ''}`
          : `${fill(KENDRA_TRINE.has(lordH) ? sigHi.lordKendra : sigHi.lordMixed, { lord: seventh.lordName, house: lordH })}${d9LordPlanet && isWeak(d9LordPlanet.dignity) ? sigHi.lordNavWeak : ''}`),
      tone: lordTone,
    },
    {
      id: 'd9Lagna',
      title: lang === 'en' ? 'Navamsha lagna' : sigHi.d9Lagna.title,
      question: lang === 'en' ? 'What is the fruit of the marriage?' : sigHi.d9Lagna.question,
      placement: d9Asc
        ? lang === 'en'
          ? `${rn(d9Asc)}${d9Venus ? ` · D9 Venus in ${rn(d9Venus.rashi)}` : ''}`
          : fill(sigHi.d9Placement, {
            sign: rn(d9Asc, lang),
            d9Venus: d9Venus ? fill(sigHi.d9VenusIn, { sign: rn(d9Venus.rashi, lang) }) : '',
          })
        : (lang === 'en' ? 'D9 lagna unavailable' : sigHi.d9Unavailable),
      reading: dimensions[4].summary,
      tone: toneFromScore(outcome),
    },
  ]

  // ── Planetary roles ───────────────────────────────────────
  const roles: MarriedLifeNote[] = [
    {
      id: 'role-venus',
      title: lang === 'en' ? 'Venus — flavor' : MLA_HI.roles.venus,
      detail: venusFlavorLine(gender, lang),
      tone: toneFromScore(flavor),
    },
    {
      id: 'role-jupiter',
      title: lang === 'en' ? 'Jupiter — trust' : MLA_HI.roles.jupiter,
      detail: lang === 'en'
        ? (gender === 'female'
          ? 'Jupiter signifies the husband in a woman’s chart, and the moral compass that keeps a vow intact. The relationship lasts while wisdom and principles are actually lived.'
          : 'Jupiter is the witness of the vow: commitment, blessings, and the ability to treat difficulty as something the couple can bear together.')
        : (gender === 'female' ? MLA_HI.roleDetails.jupiterFemale : MLA_HI.roleDetails.jupiterOther),
      tone: toneFromScore(blessing),
    },
    {
      id: 'role-mars',
      title: lang === 'en' ? 'Mars — passion' : MLA_HI.roles.mars,
      detail: lang === 'en'
        ? 'Mars is passion and sexual energy. It shows whether desire is mutual, or whether one person presses and the other withdraws.'
        : MLA_HI.roleDetails.mars,
      tone: toneFromScore(passion),
    },
    {
      id: 'role-sun',
      title: lang === 'en' ? 'Sun — ego' : MLA_HI.roles.sun,
      detail: lang === 'en'
        ? (sun
          ? `The Sun is individuality. A loud Sun (${rn(sun.rashi)}, house ${suH}) makes “winning” easier than a win-win marriage. Treating the partner as royalty is the classical softening of that ego.`
          : 'The Sun is individuality. Marriage needs a win-win; a dominant ego works against that.')
        : (sun
          ? fill(MLA_HI.roleDetails.sunLoud, { sign: rn(sun.rashi, lang), house: suH ?? '—' })
          : MLA_HI.roleDetails.sunGeneric),
      tone: (suH === 7 || yuti.su) ? 'caution' : 'mixed',
    },
  ]

  // ── Combinations ──────────────────────────────────────────
  const combinations: MarriedLifeNote[] = []

  if (yuti.me) {
    const meD10 = mercury ? d10House(chart, 'Me') : null
    const d10Line = meD10 == null
      ? 'The length of that worldly tie is read from Mercury in D10 when that chart is present.'
      : DUSTHANA.has(meD10)
        ? `Mercury in house ${meD10} of D10 keeps the worldly tie, including a debt between the two, short. It can end once the account is clear.`
        : KENDRA_TRINE.has(meD10)
          ? `Mercury in house ${meD10} of D10 holds the worldly tie through work and shared obligation.`
          : `Mercury in house ${meD10} of D10 leaves the length of the worldly tie mixed.`
    const d10LineHi = meD10 == null
      ? MLA_HI.d10Mercury.missing
      : DUSTHANA.has(meD10)
        ? fill(MLA_HI.d10Mercury.dusthana, { house: meD10 })
        : KENDRA_TRINE.has(meD10)
          ? fill(MLA_HI.d10Mercury.kendra, { house: meD10 })
          : fill(MLA_HI.d10Mercury.mixed, { house: meD10 })
    combinations.push(marriedNote(
      've-me',
      'Venus with Mercury — friendship first',
      `The bond is playful: outings, shared hobbies, clothes, skill, and a “test, then trust” courtship. Intimacy tends to be curious and frequent, with mental attraction mattering more than a single script. Messages and photos can carry it. Desire changes, so boredom and a wandering eye are the risk, along with a pending karmic or financial debt between the two. The texture is often sibling-like bickering. When the debt is cleared, a parting can be peaceful. ${d10Line}`,
      'mixed',
      lang,
      lang === 'hi' ? { d10Line: d10LineHi } : undefined,
    ))
  }

  if (yuti.ra) {
    combinations.push(marriedNote(
      've-ra',
      'Venus with Rahu — obsession',
      'This is the classic obsessive combination: high desire, grand gestures, luxury tastes, and a hunger that is hard to satisfy. Live-in arrangements before marriage are common, and rejection comes quickly if the fantasy breaks. Intimacy is private — the couple can act as husband and wife before any ceremony. Ketu’s detachment and Jupiter’s principles are what stabilize it. If Rahu is under pressure, the illusion can spread into poor choices in relationships.',
      'caution',
      lang,
    ))
  }

  if (yuti.mo || (moH != null && [7, 8, 12].includes(moH))) {
    const cancer = venus?.rashi === 4 || moon?.rashi === 4
    const veMoEn = [
      yuti.mo
        ? 'The partner is read as attractive and caring. The bond is emotional. Music and sweet songs belong with intimacy; monsoon and full-moon settings fit the fantasy.'
        : `The Moon in house ${moH} still colors private life, even without a direct Venus conjunction.`,
      gender === 'male'
        ? 'In a man’s chart the wife often takes a mothering, caregiving role. Equal happiness from mother and wife at the same time is difficult — one bond tends to dominate.'
        : 'Caregiving can turn into parenting the partner. The romance needs to stay adult, not only protective.',
      cancer
        ? 'Cancer on Venus or the Moon adds water: shared bathing, a tub, and romance that needs privacy and moonlight or open air.'
        : 'Open air and moonlight still suit this lunar romance when the Moon is tied to the 7th, 8th, or 12th.',
      yuti.ma
        ? 'Mars joining this Moon–Venus picture is a classical warning of attraction outside ordinary bonds (including people who are unavailable or vowed to celibacy). Handle that line with care, not gossip.'
        : '',
    ].filter(Boolean).join(' ')
    const veMoHi = lang === 'hi'
      ? [
        yuti.mo ? MLA_HI.veMo.yutiLead : fill(MLA_HI.veMo.houseLead, { house: moH ?? '—' }),
        gender === 'male' ? MLA_HI.veMo.maleCare : MLA_HI.veMo.femaleCare,
        cancer ? MLA_HI.veMo.cancerExtra : MLA_HI.veMo.moonRomance,
        yuti.ma ? MLA_HI.veMo.marsWarn : '',
      ].filter(Boolean).join(' ')
      : undefined
    combinations.push(marriedNote(
      've-mo',
      yuti.mo ? 'Venus with Moon — caregiver bond' : 'Moon in a private house',
      veMoEn,
      yuti.ma ? 'caution' : 'supportive',
      lang,
      lang === 'hi'
        ? {
          title: yuti.mo ? MLA_HI.deepNotes['ve-mo-yuti'].title : MLA_HI.deepNotes['ve-mo-house'].title,
          detail: veMoHi ?? '',
        }
        : undefined,
    ))
  }

  const venusInCancer = venus?.rashi === 4
  const moonInLibra = moon?.rashi === 7
  if (venusInCancer && moonInLibra && !yuti.mo) {
    combinations.push(marriedNote(
      've-mo-exchange',
      'Venus in Cancer, Moon in Libra',
      `Venus in the Moon’s sign and the Moon in Venus’s sign describe a caring, attractive partner. The bond takes a mothering tone. Romance wants water and privacy: shared bathing, a tub, moonlight.${juH === 4 || juH === 1 || juH === 5 || juH === 9 ? ' Jupiter in the home or a trine turns that care toward marriage.' : ''}`,
      'mixed',
      lang,
      lang === 'hi' ? { juHome: (juH === 4 || juH === 1 || juH === 5 || juH === 9) ? MLA_HI.veMo.juHome : '' } : undefined,
    ))
  } else if (venusInCancer && !yuti.mo && !(moH != null && [7, 8, 12].includes(moH))) {
    combinations.push(marriedNote(
      've-cancer',
      'Venus in Cancer',
      'Venus in Cancer makes the partner caring. Intimacy wants water and privacy: a bath, a tub, a closed room.',
      'mixed',
      lang,
    ))
  }

  if (yuti.ke) {
    combinations.push(marriedNote(
      've-ke',
      'Venus with Ketu — regret unless the soul agrees',
      'Others often ask what they saw in each other. The person can feel they should have waited. Ketu wants contact and then feels the lack of it. The relationship works when the two stay very close and match both emotionally and philosophically; otherwise it feels like pain delivered by the partner. Ketu also repeats the same relationship mistake instead of learning by variety.',
      'caution',
      lang,
    ))
    if (mars && (isStrong(mars.dignity) || (maH != null && [1, 4, 7, 10].includes(maH)))) {
      combinations.push(marriedNote(
        've-ke-mars',
        'Venus, Ketu, and strong Mars',
        'Strong Mars with Venus–Ketu intensifies intimacy toward the rough and the extreme. That can be consensual heat, or it can become harm. Consent and a shared spiritual frame are the difference.',
        'caution',
        lang,
      ))
    }
  }

  if (yuti.ma && !(yuti.su && veH === 7)) {
    combinations.push(marriedNote(
      've-ma',
      'Venus with Mars — passion',
      'Venus with Mars is not a curse. It is high romance and high passion: strong attraction, lust, and a kind of madness for each other. The risk is pace, not absence of love.',
      'supportive',
      lang,
    ))
  }

  if (yuti.ma && yuti.su && veH === 7) {
    const support = [raH === 12, moH === 5, sameSign(mars, rahu), saH === 7].filter(Boolean).length
    combinations.push({
      ...marriedNote(
        support >= 2 ? 've-ma-su-agreed' : 've-ma-su-alone',
        'Venus, Mars, and Sun in the 7th',
        support >= 2
          ? 'Venus, Mars, and the Sun in the 7th agree with the other marks in this chart. This points to a risk of physical domination in the home. If that matches real life, take it seriously and seek support.'
          : 'Venus, Mars, and the Sun in the 7th give rushed intimacy and a dominating tone. Physical harm is indicated only when other combinations agree.',
        'caution',
        lang,
      ),
      id: 've-ma-su',
    })
  }

  if (gender !== 'female' && yuti.su && yuti.me) {
    combinations.push(marriedNote(
      'su-me-ve',
      'Sun, Mercury, and Venus',
      'Sun with Mercury and Venus can show more than one partner known openly, in the style of a household where everyone knows, rather than a hidden affair. If smoking or intoxicants are also present, this combination is classically watched for strain on vitality and reproductive health. That is a caution to investigate with a physician, not a diagnosis from the chart alone.',
      'caution',
      lang,
    ))
  }

  const ninthLordId = SIGN_LORDS[wholeSignHouseSign(asc, 9)]
  const ninthLord = findGraha(chart, ninthLordId)
  if (ninthLord && wholeSignHouse(ninthLord.rashi, asc) === 7) {
    combinations.push(marriedNote(
      'ninth-in-seventh',
      '9th lord in the 7th',
      'The 9th lord in the 7th is the partner’s hand on this life: influence after the wedding, and a rise or a fall that follows it. A second marriage, or violence, is indicated only when other combinations agree.',
      'mixed',
      lang,
    ))
  }

  if (mercury && (houseOf(chart, 'Me') === 7 || yuti.me)) {
    combinations.push(marriedNote(
      'me-three',
      'Mercury and the count of bonds',
      'Mercury on the marriage story often marks about three significant relationships in a life. The mind samples; it does not absorb one lesson the way a repeated Ketu pattern does. During Mercury’s dasha this theme is louder.',
      'mixed',
      lang,
    ))
  }

  if (combinations.length > 1) {
    combinations.push(marriedNote(
      'all-traits',
      'Several combinations are live',
      'When more than one marriage combination is present, the traits are not alternatives. They all show up. Dasha decides which one is loud in a given year.',
      'mixed',
      lang,
    ))
  }

  // ── Jupiter ───────────────────────────────────────────────
  const jupiterNotes: MarriedLifeNote[] = []
  if (juH === 7) {
    jupiterNotes.push(marriedNote('ju-seventh-fidelity', 'Jupiter in the 7th is not a fidelity guarantee', 'Jupiter in the 7th asks for a partner from a trusted, principled family. It does not promise there will be no affair. A weak Jupiter is what lets principles slip.', 'mixed', lang))
    jupiterNotes.push(marriedNote('ju-seventh-expense', 'Wedding costs and the father', 'Jupiter in the 7th often means loans, or a father or father-figure funding the wedding.', 'mixed', lang))
  }
  if (juH === 1 || juH === 7) {
    jupiterNotes.push(marriedNote('ju-axis-cool', 'Jupiter on the 1–7 axis', 'Jupiter on the ascendant–7th axis can cool the body over the years: the couple stays for children or society while sexual contact fades. Jupiter makes the body feel heavy. A long marriage is not the same as a passionate one.', 'caution', lang))
  }
  if (jupiter && isWeak(jupiter.dignity)) {
    jupiterNotes.push(marriedNote('ju-weak', 'Weak Jupiter', 'A weak Jupiter is the trust problem: principles bend, and infidelity or broken promises become easier to justify.', 'caution', lang))
  } else if (jupiter && isStrong(jupiter.dignity)) {
    jupiterNotes.push(marriedNote('ju-strong', 'Strong Jupiter', 'A strong Jupiter helps the couple take a hard season as something to be borne, instead of turning every disappointment into a fight.', 'supportive', lang))
  }
  if (juH === 4) {
    jupiterNotes.push(marriedNote('ju-fourth', 'Jupiter in the 4th', 'Jupiter in the 4th puts the vow inside the home. The person wants the bond to become family soon.', 'mixed', lang))
  }
  if (juH != null && KAAM.has(juH)) {
    jupiterNotes.push(marriedNote('ju-kaam', 'Jupiter in a desire house', 'Jupiter in the 5th, 7th, 8th, or 12th (or those houses in Navamsha) skips the testing phase. Falling in love immediately becomes “this is my life partner.”', 'mixed', lang))
  }
  if (yuti.ju) {
    const juVeId = juH === 7 ? 'ju-ve-yuti-7' : juH != null && DUSTHANA.has(juH) ? 'ju-ve-yuti-dusthana' : 'ju-ve-yuti-other'
    jupiterNotes.push(marriedNote(
      juVeId,
      'Jupiter with Venus',
      juH === 7
        ? 'Jupiter and Venus together in the 7th disturb that house: desire runs high (Atikami), marital intimacy is harder, and the appetite can include other people. The pair is steadier in trines (1, 5, 9).'
        : juH != null && DUSTHANA.has(juH)
          ? 'Jupiter and Venus in a difficult house (the 6th, 8th, or 12th) can inflame desire (the classical Atikami), and attention can stray beyond the partnership. That house’s meaning is overwhelmed.'
          : 'Jupiter conjunct Venus inflames desire (Atikami). In a trine the same pair keeps the house’s meaning intact.',
      juH === 7 || (juH != null && DUSTHANA.has(juH)) ? 'caution' : 'mixed',
      lang,
    ))
  }

  const dashaLords = runningLords(chart)
  const vowLords: string[] = []
  for (const h of [7, 8, 12]) {
    const id = SIGN_LORDS[wholeSignHouseSign(asc, h)]
    const inD9 = d9Graha(chart, id)
    if (inD9?.rashi === 9) vowLords.push(gn(id))
  }
  if (vowLords.length) {
    const live = vowLords.some(name => dashaLords.some(l => gn(l as GrahaId, lang) === name || l === name))
    const lordsLabel = vowLords.join(', ')
    jupiterNotes.push(marriedNote(
      'sag-navamsa-vow',
      'Sagittarius Navamsha on a private-house lord',
      `${lordsLabel} ${vowLords.length > 1 ? 'fall' : 'falls'} in Sagittarius Navamsha as lord of the 7th, 8th, or 12th. A traditional teaching holds that straying during that planet’s dasha costs position and reputation. Sagittarius also holds unfulfilled vows — promises made to the divine that were never kept, which leave the person stuck. ${live ? 'That lord is in the current main or sub dasha period, so the warning is timely.' : 'The main and sub dasha periods of these lords are the ones to watch.'}`,
      'caution',
      lang,
      lang === 'hi'
        ? {
          lords: lordsLabel,
          fallVerb: vowLords.length > 1 ? 'गिरते हैं' : 'गिरता है',
          dashaNote: live ? 'वह स्वामी वर्तमान मुख्य या उप दशा में है, चेतावनी समय पर है।' : 'इन स्वामियों की मुख्य और उप दशा देखनी है।',
        }
        : undefined,
    ))
  }
  if (dashaLords.includes('Me') && dashaLords.includes('Ra')) {
    jupiterNotes.push(marriedNote('me-ra-dasha', 'Mercury–Rahu period', 'A Mercury–Rahu period, especially with heavy social display, is classically watched for the intellect getting pulled off its vow. It is a season for stricter boundaries, not a prophecy that betrayal is certain.', 'caution', lang))
  }

  // ── Mars, Rahu, Ketu ──────────────────────────────────────
  const marsAndNodes: MarriedLifeNote[] = []
  if (raH === 7) {
    marsAndNodes.push(marriedNote('ra-seventh', 'Rahu in the 7th', 'Rahu in the 7th wants a grand marriage and is rarely satisfied. Eyes wander. Without Jupiter’s steadiness the chart runs toward more than one partner.', 'caution', lang))
  }
  if (keH === 7) {
    marsAndNodes.push(marriedNote('ke-seventh', 'Ketu in the 7th', 'Ketu can make marriage happen quickly, then leave the person unsure how to conduct it — a throne without a method of rule. The bond needs a spiritual purpose. Jupiter and the Sun are the remedies named for this seat.', 'mixed', lang))
  }
  if (raH === 12) {
    marsAndNodes.push(marriedNote(
      'ra-twelfth',
      'Rahu in the 12th',
      `Rahu in the 12th${rahu?.rashi === 4 ? ' in Cancer' : ''} colors private life with obsession and a mind that does not settle. Bedroom and foreign/hidden themes dominate the spouse story.`,
      'caution',
      lang,
      lang === 'hi' ? { cancer: rahu?.rashi === 4 ? ' कर्क में' : '' } : undefined,
    ))
  }
  if (sameSign(mars, ketu)) {
    marsAndNodes.push(marriedNote('ma-ke', 'Mars with Ketu', 'Mars with Ketu makes intimacy irritable. A small domestic slight (food, a word) spoils the mood. Desire goes unmatched: one partner loses interest while the other presses. Age-gap marriages show this pattern often.', 'caution', lang))
  }
  if (sameSign(mars, rahu)) {
    marsAndNodes.push(marriedNote('ma-ra', 'Mars with Rahu', 'Mars with Rahu is thief-and-police energy: one person dominates by scheme, and the body can turn aggressive. Troubled, this combination carries a risk of violence in the relationship. Where the 7th and 12th agree, take harm in the relationship seriously and seek support rather than dismissing it as “a bit of temper”.', 'caution', lang))
  }
  if (moH === 5 && moon?.rashi === 9) {
    marsAndNodes.push(marriedNote('mo-sag-fifth', 'Moon in Sagittarius in the 5th', 'The Moon in Sagittarius in the 5th stays quiet for reputation. A hard marriage can be endured because honor feels louder than the harm.', 'caution', lang))
  }
  if (mars?.rashi === 8 && maH === 7) {
    marsAndNodes.push(marriedNote('ma-scorpio-seventh', 'Mars in Scorpio in the 7th', 'Mars in Scorpio in the 7th can be a painful seat: suffering around marriage, health strain or a need for surgery in the classical reading, and a life that changes sharply just before or after the wedding.', 'caution', lang))
  }

  // ── Saturn ────────────────────────────────────────────────
  const saturnNotes: MarriedLifeNote[] = []
  if (saH != null && (KAAM.has(saH) || saturn?.rashi === 7)) {
    saturnNotes.push(marriedNote('sa-kaam', 'Saturn on marriage', 'Saturn wants a traditional partner — classic, low-display beauty — and fears not being enough. The compensation is hard work and self-sacrifice, sometimes secret unconventional effort just to impress. What Saturn respects is a partner who is hard-working, low-maintenance, and practically supportive. The marriage lasts by duty even after romance thins. It asks for patience, not a spark every evening.', 'mixed', lang))
  }
  if (saH === 7 && saturn && (isStrong(saturn.dignity) || saturn.rashi === 7 || saturn.rashi === 10 || saturn.rashi === 11)) {
    saturnNotes.push(marriedNote('sa-seventh-wealth', 'Saturn supporting the 7th', 'A well-placed Saturn in the 7th can bring wealth through the partnership itself, because the bond is treated as work.', 'supportive', lang))
  }
  if (saH === 7 || saturn?.rashi === 7) {
    saturnNotes.push(marriedNote('sa-anxiety', 'Saturn and performance anxiety', 'Saturn in the 7th or in Libra often brings an inferiority complex in private life — fear of not satisfying the partner. Reassurance and unrushed intimacy matter more than technique.', 'caution', lang))
  }
  if (sun && saturn && ketu && sun.rashi === saturn.rashi && saturn.rashi === ketu.rashi) {
    const onSeventhLord = !!lord && lord.rashi === sun.rashi
    saturnNotes.push({
      ...marriedNote(
        onSeventhLord ? 'su-sa-ke-lord' : 'su-sa-ke',
        onSeventhLord ? '7th lord with Sun, Saturn, and Ketu' : 'Sun, Saturn, and Ketu',
        onSeventhLord
          ? 'The 7th lord sits with the Sun, Saturn, and Ketu. Long commitment is doubted. Intimacy is asked to feel healing. Fear of being judged about money enters private life. Speech turns harsh and needs to be slowed on purpose.'
          : 'The Sun, Saturn, and Ketu together make speech harsh. Intimacy wants a healing frame, and judgment about money can spoil it.',
        'caution',
        lang,
      ),
      id: 'su-sa-ke',
    })
  }
  if (saH === 2) {
    saturnNotes.push(marriedNote(
      sameSign(saturn, ketu) ? 'sa-second-ketu' : 'sa-second',
      'Saturn in the 2nd — do not lie',
      sameSign(saturn, ketu)
        ? 'Saturn with Ketu in the 2nd needs care: lies and family disputes could lead to a painful break from the family. Staying out of family fights matters, because blame tends to land here.'
        : 'Saturn in the 2nd makes false speech inside the family costly, so honesty matters here. Embarrassment follows quickly if it slips.',
      'caution',
      lang,
    ))
  }
  if (keH === 2) {
    saturnNotes.push(marriedNote('ke-second', 'Ketu in the 2nd', 'Ketu in the 2nd detaches the person from family. If it is very strong it can cut the lineage feeling entirely, while a lifelong hunger for that belonging never quite gets fed — often because closeness was missing from childhood.', 'mixed', lang))
  }

  // ── Remedies ──────────────────────────────────────────────
  const remedies: MarriedLifeNote[] = []
  if (dashaLords.includes('Me') && dashaLords.includes('Ra') && saturn && (saH === 7 || sameSign(saturn, venus))) {
    remedies.push(marriedNote('remedy-saturn-gift', 'Saturn — loosen a bond that should have ended', 'Mercury and Rahu are live, and Saturn is holding the bond. Giving away a Saturn object can loosen a tie that this period was ready to end. This is only appropriate when ending the bond is genuinely wanted.', 'mixed', lang))
  }
  if (yuti.su || suH === 7 || (lord && sameSign(lord, sun))) {
    remedies.push(marriedNote('remedy-sun', 'Sun — lower the ego', 'Treat the partner as king or queen. The old habit of “Maharani” or “Rajaji” is a practical remedy for Sun clashes, not mere courtesy.', 'supportive', lang))
  }
  if (yuti.ma || (maH != null && KAAM.has(maH)) || sameSign(mars, rahu) || sameSign(mars, ketu)) {
    remedies.push(marriedNote('remedy-mars', 'Mars — spend the heat', 'Give personal space, and burn Mars together in the body (a shared physical practice). Authority (Sun) or discipline (Saturn) contains Mars when speech and temper run ahead of care.', 'supportive', lang))
  }
  if (yuti.ke || keH === 7) {
    remedies.push(marriedNote('remedy-ketu', 'Ketu — a shared purpose', 'Visit a temple together. Ketu steadies when the relationship has a spiritual aim instead of only a sensory one. Jupiter and the Sun support Ketu in the 7th.', 'supportive', lang))
  }
  if (fourth.tone === 'caution') {
    remedies.push(marriedNote('remedy-fourth', '4th house — cool the home', 'An troubled 4th is served by water and by quiet service at home: cooling, cleaning, feeding, making the house feel safe. The 4th is the heart of domestic peace for both partners.', 'supportive', lang))
  }
  if (remedies.length === 0) {
    remedies.push(marriedNote('remedy-general', 'Choose the balancing chart', 'Libra is choice. A marriage that works is a conscious exchange of energy with someone whose chart balances yours and who will walk a principled path with you.', 'supportive', lang))
  }

  const bondBits: string[] = []
  if (yuti.me || houseOf(chart, 'Me') === 7) {
    bondBits.push(lang === 'en' ? 'Love-leaning and experimental: test, then trust.' : MLA_HI.bondBits.meLove)
  }
  if (juH != null && (juH === 5 || KAAM.has(juH))) {
    bondBits.push(lang === 'en' ? 'Jupiter wants a direct commitment, with little dating-as-trial.' : MLA_HI.bondBits.juDirect)
  }
  if (libraProposal(asc, lang).house === 7) {
    bondBits.push(lang === 'en' ? 'Libra on the 7th also allows a self-chosen partner.' : MLA_HI.bondBits.libraSelf)
  }
  const bondStyle = bondBits.length
    ? bondBits.join(' ')
    : (lang === 'en'
      ? 'No single love-versus-arranged signature dominates. The 7th lord’s dasha shows how the meeting actually arrives.'
      : MLA_HI.bondBits.default)

  const avg = Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length)
  const headline = lang === 'en'
    ? (avg >= 7
      ? 'Married life has real support'
      : avg >= 5
        ? 'Married life is workable, and it needs consciousness'
        : 'Married life carries structural strain')
    : (avg >= 7 ? MLA_HI.headlines.high : avg >= 5 ? MLA_HI.headlines.mid : MLA_HI.headlines.low)

  const summaryFourth = lang === 'en'
    ? (fourth.tone === 'caution'
      ? 'The 4th house shows friction at home — weigh that before matching.'
      : 'The 4th house is the domestic heart; keep it in the matching, not only the 7th.')
    : (fourth.tone === 'caution' ? MLA_HI.summary.fourthCaution : MLA_HI.summary.fourthOk)
  const summaryTenth = lang === 'en'
    ? (gender === 'female'
      ? (tenth.malefics.length
        ? `The 10th holds ${tenth.malefics.join(', ')}. In a woman’s chart that is career pressure and a difficult mother-in-law.`
        : 'The 10th is also the mother-in-law, as well as career. This 10th is not occupied by difficult planets.')
      : 'When this chart is matched, the bride’s 10th house shows the mother-in-law and both 4th houses show whether the home can stay peaceful.')
    : (gender === 'female'
      ? (tenth.malefics.length
        ? fill(MLA_HI.summary.tenthFemaleMal, { malefics: tenth.malefics.join(', ') })
        : MLA_HI.summary.tenthFemaleOk)
      : MLA_HI.summary.tenthOther)
  const summary = [
    lang === 'en'
      ? 'Marriage is read from four places: the 7th house (will it happen), the 7th lord (will it last), Venus (the flavor), and the Navamsha lagna (the fruit). Jupiter blesses; Mars is passion; the Sun is the ego that must yield.'
      : MLA_HI.summary.lead,
    bondStyle,
    summaryFourth,
    summaryTenth,
  ].join(' ')

  return {
    headline,
    summary,
    bondStyle,
    dimensions,
    significators,
    proposal: libraProposal(asc, lang),
    roles,
    combinations,
    jupiter: jupiterNotes,
    marsAndNodes,
    saturn: saturnNotes,
    remedies,
    ethics: lang === 'en' ? ETHICS : MLA_HI.ethics,
    seventh,
    fourth,
    tenth,
  }
}
