// src/lib/engine/marriageHouses.ts
// Class notes: eight houses of the marriage system, and the three-layer
// activation that decides whether a period can actually produce a wedding.
// A house note appears when that house is holding or strained.
// A period note appears only from the Vimshottari lords on the chart.
// Pure engine — no React/DB.

import type { ChartOutput, Dignity, Gender, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import type { LifeTone, MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'

export type HouseHealth = 'holding' | 'thin' | 'strained'

export interface MarriageHousesFlags {
  health: Record<number, HouseHealth>
  fourthStrained: boolean
  seventhHolding: boolean
  trineBalanced: boolean
  relationshipBalanced: boolean
  triangularActive: boolean
  bindingActive: boolean
  loveMarriage: boolean
  d9Silent: boolean
}

export interface MarriageHousesReading {
  headline: string
  summary: string
  principles: string
  houses: MarriedLifeNote[]
  groups: MarriedLifeNote[]
  activation: MarriedLifeNote[]
  flags: MarriageHousesFlags
}

const EIGHT = [1, 2, 4, 5, 7, 8, 9, 11, 12] as const
const TRINE = [1, 5, 9]
const RELATION = [4, 7, 8, 12]
const BINDING = [2, 8, 11]
const TRIANGULAR = [1, 5, 9]
const DIVORCE_AXIS = [1, 7, 8, 12]

const LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const DIGNIFIED: Dignity[] = ['exalted', 'moolatrikona', 'own']

const COMPLEMENT: Record<number, string> = {
  1: 'a direct will and the nerve to begin',
  2: 'steadiness, provision, and speech that does not cut',
  3: 'skill, nerve, and the willingness to ask',
  4: 'a felt sense of home',
  5: 'affection, romance, and a reason to create',
  6: 'the ability to work a problem without making it the marriage',
  7: 'an equal who can meet in public',
  8: 'the nerve to share a secret and stay through a crisis',
  9: 'a principle that outlasts a mood',
  10: 'duty that is visible',
  11: 'a hope that can be finished, and a circle that helps',
  12: 'room for the other person, and the willingness to be quiet',
}

export const MARRIAGE_HOUSES_PRINCIPLES =
  'Marriage is eight houses. The 7th completes what the self lacks and then steps aside; the 8th is the test that follows. A disturbed 4th is enough to make a marriage unstable even when the 7th is quiet. The 9th, not romance, is what carries a bond through decades. The 12th is sacrifice, surrender, silence, and shared practice. Timing needs the person to be ready, the 5th and 7th and the significator to be in period — Venus for a man, Jupiter for a woman — and the binding houses 2, 8, and 11 to answer as well. Jupiter and Saturn in transit can confirm a period that is already open. That double transit returns every few years, so it does not time a wedding by itself.'

function houseOf(rashi: number, asc: number): number {
  return ((rashi - asc + 12) % 12) + 1
}

function signOf(asc: number, house: number): Rashi {
  return ((((asc - 1 + house - 1) % 12) + 1) as Rashi)
}

function rn(r: number): string {
  return RASHI_NAMES[r as Rashi] ?? `R${r}`
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

function dignified(d: Dignity | undefined): boolean {
  return !!d && DIGNIFIED.includes(d)
}

function weak(g: GrahaData | undefined): boolean {
  if (!g) return true
  return g.dignity === 'debilitated' || g.dignity === 'enemy' || g.dignity === 'great_enemy' || !!g.isCombust
}

function isBenefic(g: GrahaData): boolean {
  if (g.id === 'Ju' || g.id === 'Ve') return true
  if (g.id === 'Mo') return g.isWaxingMoon !== false
  if (g.id === 'Me') return !weak(g)
  return false
}

function isMalefic(g: GrahaData): boolean {
  return g.id === 'Su' || g.id === 'Ma' || g.id === 'Sa' || g.id === 'Ra' || g.id === 'Ke'
}

function ordinalHouse(n: number): string {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
}

export function analyzeMarriageHouses(chart: ChartOutput | null | undefined): MarriageHousesReading | null {
  const asc = chart?.lagnas?.ascRashi
  if (!chart || !asc) return null

  const grahas = chart.grahas ?? []
  const gender = chart.meta?.gender
  const d9 = chart.vargas?.D9
  const d9Asc = chart.vargaLagnas?.D9

  const occupants = (house: number) => grahas.filter(g => houseOf(g.rashi, asc) === house && (isBenefic(g) || isMalefic(g)))

  const healthOf = (house: number): HouseHealth => {
    const sign = signOf(asc, house)
    const lord = find(grahas, LORDS[sign])
    const occ = occupants(house)
    const malOcc = occ.filter(g => isMalefic(g) && g.id !== lord?.id)
    const benOcc = occ.filter(isBenefic)
    if (!lord) return 'thin'
    if (lord.dignity === 'debilitated' || lord.isCombust) return 'strained'
    if (malOcc.length > 0 && benOcc.length === 0 && !dignified(lord.dignity)) return 'strained'
    if (dignified(lord.dignity) && !lord.isCombust && malOcc.length === 0) return 'holding'
    if (benOcc.length > 0 && !weak(lord)) return 'holding'
    return 'thin'
  }

  const health: Record<number, HouseHealth> = {}
  for (const h of EIGHT) health[h] = healthOf(h)

  const count = (houses: number[], kind: HouseHealth) => houses.filter(h => health[h] === kind).length
  const trineBalanced = count(TRINE, 'strained') === 0 && count(TRINE, 'holding') >= 2
  const relationshipBalanced = count(RELATION, 'strained') === 0 && count(RELATION, 'holding') >= 3
  const fourthStrained = health[4] === 'strained'
  const seventhHolding = health[7] === 'holding'
  const axisStrained = count(DIVORCE_AXIS, 'strained') >= 2

  const ties = (planet: GrahaData | undefined, house: number): boolean => {
    if (!planet) return false
    const sign = signOf(asc, house)
    if (LORDS[sign] === planet.id) return true
    if (planet.rashi === sign) return true
    const lord = find(grahas, LORDS[sign])
    return !!lord && lord.id !== planet.id && lord.rashi === planet.rashi
  }

  const path = chart.dashas?.vimshottari ? getDashaPathAt(chart.dashas.vimshottari) : []
  const periodGraha = (index: number) => {
    const id = path[index]?.lord
    return id ? find(grahas, id as GrahaId) : undefined
  }
  const md = periodGraha(0)
  const ad = periodGraha(1)
  const tiedByPeriod = (houses: number[]) => houses.filter(h => ties(md, h) || ties(ad, h))
  const triTied = tiedByPeriod(TRIANGULAR)
  const bindTied = tiedByPeriod(BINDING)
  const triangularActive = triTied.length >= 2
  const bindingActive = bindTied.length >= 2

  const karakaId: GrahaId | null = gender === 'male' ? 'Ve' : gender === 'female' ? 'Ju' : null
  const karaka = karakaId ? find(grahas, karakaId) : undefined
  const karakaInPeriod = !!karakaId && path.some(p => p.lord === karakaId)
  const karakaJoined = !!karaka && (!!md && md.id !== karaka.id && md.rashi === karaka.rashi || !!ad && ad.id !== karaka.id && ad.rashi === karaka.rashi)
  const fifthOn = ties(md, 5) || ties(ad, 5)
  const seventhOn = ties(md, 7) || ties(ad, 7)
  const manifestCount = [fifthOn, seventhOn, karakaInPeriod || karakaJoined].filter(Boolean).length
  const loveMarriage = fifthOn && seventhOn

  const d9SeventhSign = d9Asc ? signOf(d9Asc, 7) : null
  const d9SeventhLord = d9SeventhSign ? find(d9, LORDS[d9SeventhSign]) : undefined
  const d9SeventhHouse = d9SeventhLord && d9Asc ? houseOf(d9SeventhLord.rashi, d9Asc) : null
  const d9Karaka = karakaId ? find(d9, karakaId) : find(d9, 'Ve')
  const d9KarakaHit = !!d9Karaka && (weak(d9Karaka) || (d9 ?? []).some(g => g.id !== d9Karaka.id && g.rashi === d9Karaka.rashi && isMalefic(g)))
  const d9Silent = !!d9Asc && (!!d9SeventhLord && (weak(d9SeventhLord) || (d9SeventhHouse != null && [6, 8, 12].includes(d9SeventhHouse))) || d9KarakaHit)

  const flags: MarriageHousesFlags = {
    health,
    fourthStrained,
    seventhHolding,
    trineBalanced,
    relationshipBalanced,
    triangularActive,
    bindingActive,
    loveMarriage,
    d9Silent,
  }

  const houses: MarriedLifeNote[] = []
  const groups: MarriedLifeNote[] = []
  const activation: MarriedLifeNote[] = []

  const seventhSign = signOf(asc, 7)
  houses.push(note(
    'houses-seventh',
    'The 7th completes you, then steps aside',
    `The 7th is ${rn(seventhSign)}. It is the incomplete part of this person, and the partner is asked to bring ${COMPLEMENT[seventhSign]}. The match is complementing: what is aggressive here wants calm there, and the reverse. ${health[7] === 'holding' ? 'This 7th can complete the meeting.' : health[7] === 'strained' ? 'This 7th is under strain, so the missing piece arrives with friction.' : 'This 7th is neither a clear strength nor a clear break.'} Once the marriage exists, the 7th has done its work. The real test is the 8th: how the two hold each other when something actually goes wrong.`,
    health[7] === 'holding' ? 'supportive' : health[7] === 'strained' ? 'caution' : 'mixed',
  ))

  const role = (house: number, title: string, holding: string, strained: string) => {
    const state = health[house]
    if (state === 'thin') return
    houses.push(note(
      `houses-${house}`,
      title,
      `The ${ordinalHouse(house)} is ${rn(signOf(asc, house))}. ${state === 'holding' ? holding : strained}`,
      state === 'holding' ? 'supportive' : 'caution',
    ))
  }

  role(
    1,
    '1st house — who is getting married',
    'The lagna can hold a self inside a partnership. Readiness is present: this person has an identity that can stand next to someone else.',
    'The question “am I ready for a partner?” is not settled. Identity wobbles in the place a marriage would ask it to be stable.',
  )
  role(
    2,
    '2nd house — two families, and the words between them',
    'Family, food, and speech can carry a union. Two households have a chance of becoming one kutumb without the marriage being spent on a single sentence.',
    'This is where marriages break without the 7th being involved: family pressure, money, or one wrong word. The 2nd is not holding the union of the two lines.',
  )
  if (fourthStrained) {
    houses.push(note(
      'houses-fourth-divorce',
      'The 4th is unbalanced — a condition of divorce',
      `The 4th is ${rn(signOf(asc, 4))}, and it is not holding emotional security. The class treats a disturbed 4th as mandatory in a divorce reading. Many unstable marriages come from this house alone. ${seventhHolding ? 'The 7th is holding, so it is not the source of that instability.' : 'Check the 7th as well, but do not wait for it to be broken before taking the 4th seriously.'}`,
      'caution',
    ))
  } else if (health[4] === 'holding') {
    role(
      4,
      '4th house — emotional protection',
      'Emotional security has a seat. The home can protect the marriage instead of spending it.',
      '',
    )
  }
  role(
    5,
    '5th house — the feeling before the vow',
    'Romance, affection, and a past-life warmth toward the incoming person are available. Purva punya is on the side of the bond.',
    'The feeling that should precede marriage is tangled. Attraction and the sense of “I have known you” do not have a clean seat.',
  )
  if (health[8] !== 'thin') {
    const bride = gender === 'female'
      ? ' For the person entering the other household, this is where the life changes shape after the wedding.'
      : ' This is the ground-level support: secrets, intensity, and whether the two stay when the problem is real.'
    role(
      8,
      '8th house — the test after the wedding',
      `The 7th has stepped aside. The 8th can hold the intimacy and the crisis.${bride}`,
      `The 7th can still arrange a wedding. The 8th is where it is lived, and this 8th is strained: secrets, transformation, and support in trouble are the weak point.${bride}`,
    )
  }
  role(
    9,
    '9th house — what outlasts love',
    'Principles, duty, and a shared view of life are available. Love can carry a few years. A long marriage — the kind that reaches a silver or golden jubilee — is this house doing its work after attraction has become roles, children, and obligations.',
    'No relationship survives on love alone, and this 9th is not carrying the principles that would replace it. After the early years, duty and perspective have nowhere steady to stand.',
  )
  role(
    11,
    '11th house — making the marriage happen',
    'Desires around marriage can finish. This house is what turns the wish into an event and lets the marriage produce a gain.',
    'The wish for marriage does not have a door. Timing and fulfillment are blocked at the 11th even when the 7th looks willing.',
  )
  role(
    12,
    '12th house — sacrifice, surrender, and room',
    'The 12th here can do its marriage work: sacrifice, surrender, silence, and enough personal space that the two do not consume each other. Shared practice belongs to this house. Bedroom life is one room inside it, not the whole house.',
    'The 12th is strained, so sacrifice turns into absence and space turns into a withdrawal. The marriage’s own pain sits here. Silence is no longer respect. It is distance.',
  )

  if (trineBalanced) {
    groups.push(note(
      'houses-trine',
      'A value-based marriage',
      'The 1st, 5th, and 9th are carrying their weight. The class reads that as a couple whose aim is “we move forward,” with the self meaning the couple. The marriage is held by dharma: growth together, and a refusal to abandon the bond when a season is hard.',
      'supportive',
    ))
  } else if (count(TRINE, 'strained') >= 2) {
    groups.push(note(
      'houses-trine-thin',
      'Self-development is not the bond’s center',
      'Two of the 1st, 5th, and 9th are strained. The class’s value-based marriage — growing as a couple, staying because the direction is shared — does not have its three houses.',
      'caution',
    ))
  }

  if (relationshipBalanced) {
    groups.push(note(
      'houses-relationship',
      'The relationship is the priority',
      'The 4th, 7th, 8th, and 12th are holding. The class reads a couple who put the bond first and carry the wider family with them. These charts are also the more troubled ones: the commitment is real, and so is the work.',
      'mixed',
    ))
  }

  if (axisStrained) {
    groups.push(note(
      'houses-divorce-axis',
      'The self–partner–crisis–release axis is strained',
      'The 1st, 7th, 8th, and 12th are one axis: self, partnership, intimacy under crisis, and detachment. Two or more of them are strained. The class notes that the same mahadasha can give the marriage and later the divorce. The difference is in the finer periods, not in a second yoga.',
      'caution',
    ))
  }

  const held = EIGHT.filter(h => health[h] === 'holding').length
  const strained = EIGHT.filter(h => health[h] === 'strained').length
  groups.push(note(
    'houses-cover',
    'Why a second chart is required',
    `${held} of the eight houses are holding and ${strained} are strained. A single chart rarely balances all eight. Match-making exists so another person covers the houses this chart does not. Three or four houses balanced between the two charts are enough for the marriage to be workable.`,
    strained > held ? 'caution' : 'mixed',
  ))

  if (path.length && md) {
    const names = path.slice(0, 3).map(p => gn(p.lord)).join(' → ')
    if (triangularActive && bindingActive) {
      activation.push(note(
        'houses-both-energies',
        'The decision and the binding are both on',
        `${names} ties the triangular houses (${triTied.map(ordinalHouse).join(', ')}) and the binding houses (${bindTied.map(ordinalHouse).join(', ')}). The class says a marriage is decided from 1, 5, and 9, and it actually happens only when 2, 8, and 11 answer as well. Both are answering in this period.`,
        'supportive',
      ))
    } else if (triangularActive) {
      activation.push(note(
        'houses-triangle-only',
        'The marriage can be decided and still not happen',
        `${names} ties ${triTied.map(ordinalHouse).join(' and ')}. That is the triangular energy: the decision. The binding houses 2, 8, and 11 are not in this period. The class’s explanation of a “right dasha” with no wedding is exactly this gap.`,
        'mixed',
      ))
    } else if (bindingActive) {
      activation.push(note(
        'houses-binding-only',
        'The form is available before the decision',
        `${names} ties ${bindTied.map(h => `the ${ordinalHouse(h)}`).join(' and ')}. Those houses are what turn a decision into a marriage. The 1st, 5th, and 9th are not both in the period, so the will to marry is not what this dasha is switching on.`,
        'mixed',
      ))
    }

    const readiness = ties(md, 1) || ties(ad, 1)
      || path.some(p => p.lord === 'Mo')
      || (!!md && chart.grahas.some(g => g.id === 'Mo' && g.rashi === md.rashi))
      || (!!d9Asc && path.some(p => p.lord === LORDS[d9Asc]))
    if (readiness) {
      activation.push(note(
        'houses-readiness',
        'Inner readiness, not the wedding date',
        `${names} touches the lagna, the Moon, or the Navamsha lagna lord. The class calls that the preparation: the person becomes psychologically able to marry. It is not the timing of the wedding. In a chart where the wedding date is known, this pattern is what the seven years before the marriage tend to show.`,
        'mixed',
      ))
    }

    if (manifestCount >= 2) {
      const who = karakaId === 'Ju'
        ? 'Jupiter is the significator in a woman’s chart.'
        : karakaId === 'Ve'
          ? 'Venus is the significator in a man’s chart.'
          : 'Venus is the significator in a man’s chart and Jupiter in a woman’s. This chart does not say which.'
      activation.push(note(
        'houses-manifest',
        'A relationship can form in this period',
        `${who} Two or more of the 5th, the 7th, and that significator are tied to ${names}. The class treats that as enough for a relationship to become visible. ${ (ties(md, 2) || ties(ad, 2)) && (ties(md, 11) || ties(ad, 11)) ? 'The 2nd and the 11th are also in the period, which is what converts the relationship into a marriage.' : 'Marriage itself still wants the 2nd and the 11th. Without them this is a relationship, not yet a household.' }`,
        'mixed',
      ))
    }

    const saturnInPeriod = path.some(p => p.lord === 'Sa')
    const eighthInPeriod = ties(md, 8) || ties(ad, 8)
    if (saturnInPeriod && eighthInPeriod) {
      activation.push(note(
        'houses-saturn-eighth',
        'Saturn and the 8th bind the contract',
        'Saturn is in the period and the 8th is tied to it. The class gives those two the structural binding: marriage as a contract, with maturity, fairness, patience, and karmic weight, not only as love. The 8th is the emotional contract underneath the social one.',
        'mixed',
      ))
    }

    const stable = ties(md, 7) || ties(md, 2) || ties(md, 11)
    const struggle = ties(md, 6) || ties(md, 8) || ties(md, 12)
    if (md && stable && !struggle) {
      activation.push(note(
        'houses-dasha-stable',
        'This mahadasha can hold a relationship',
        `${gn(md.id)} is tied to the 7th, the 2nd, or the 11th by lordship, occupation, or company. The class reads a stable relationship from that link, whichever planet is running.`,
        'supportive',
      ))
    } else if (md && struggle) {
      activation.push(note(
        'houses-dasha-struggle',
        'This mahadasha struggles the marriage',
        `${gn(md.id)} is tied to the 6th, 8th, or 12th. The class reads strain in the marriage from that link. Stability comes later and wants Saturn’s patience. ${stable ? 'The same planet also touches a marriage house, so the period contains both the bond and the bill.' : ''}`,
        'caution',
      ))
    }

    const mdD9 = md ? find(d9, md.id) : undefined
    if (mdD9?.dignity === 'exalted') {
      activation.push(note(
        'houses-dasha-d9',
        'The mahadasha lord is exalted in D9',
        `${gn(md!.id)} is exalted in Navamsha. The class reads a high-quality marriage from that dignity, whichever planet is running. The period has to be open in D1 as well. Exaltation in D9 does not invent a wedding the houses have not allowed.`,
        'supportive',
      ))
    }

    if (loveMarriage) {
      activation.push(note(
        'houses-love',
        'The 5th and the 7th are both in this period',
        'Feeling and partnership are tied to the same dasha. The class reads a high probability of a love marriage: the bond is chosen from affection, not only arranged around the 7th.',
        'mixed',
      ))
    }
  }

  if (d9Silent) {
    const why = d9SeventhLord && weak(d9SeventhLord)
      ? `The D9 7th lord, ${gn(d9SeventhLord.id)}, is weak.`
      : d9SeventhHouse != null && [6, 8, 12].includes(d9SeventhHouse)
        ? `The D9 7th lord sits in the ${ordinalHouse(d9SeventhHouse)} of Navamsha.`
        : 'Venus or Jupiter is afflicted in Navamsha.'
    activation.push(note(
      'houses-d9-silent',
      'Navamsha can let a marriage period pass',
      `${why} The class’s reason a correct-looking dasha produces no wedding is this: in D9 the significator is hit, or the 7th lord has gone quiet. D1 can be willing. D9 is not answering.`,
      'caution',
    ))
  }

  if ((fourthStrained || axisStrained) && path.length >= 3) {
    activation.push(note(
      'houses-finer',
      'The same period can marry and later divide',
      `The running periods are ${path.slice(0, 4).map(p => gn(p.lord)).join(' → ')}. When the 4th or the 1–7–8–12 axis is already strained, the class does not call a divorce from the mahadasha alone. The split between the wedding and the ending sits in these finer lords.`,
      'caution',
    ))
  } else if ((fourthStrained || axisStrained) && path.length > 0 && path.length < 3) {
    activation.push(note(
      'houses-finer',
      'Finer periods are not on this chart',
      `${path.map(p => gn(p.lord)).join(' → ')} is as deep as the stored dasha goes. The class looks to sukshma and prana before separating a wedding from a divorce inside one mahadasha. That split cannot be read from the levels present here.`,
      'mixed',
    ))
  }

  const headline = fourthStrained
    ? 'The 4th house can unsettle the marriage without the 7th’s help'
    : trineBalanced
      ? 'The 1st, 5th, and 9th can carry a value-based marriage'
      : relationshipBalanced
        ? 'The relationship houses are the priority, and they will be worked'
        : triangularActive && bindingActive
          ? 'This period both decides a marriage and binds it'
          : 'The 7th only begins the marriage. Eight houses carry it.'

  const summary = path.length
    ? `${gn(path[0].lord)} is running. ${triangularActive && bindingActive ? 'Triangular and binding houses are both in the period.' : triangularActive ? 'The decision houses are in the period and the binding houses are not.' : bindingActive ? 'The binding houses are in the period and the decision houses are not.' : 'This period is not carrying both the decision and the binding.'}`
    : `The 7th is ${rn(seventhSign)}. The period that would activate these houses is not on this chart.`

  return {
    headline,
    summary,
    principles: MARRIAGE_HOUSES_PRINCIPLES,
    houses,
    groups,
    activation,
    flags,
  }
}

export function compareMarriageHouses(
  a: MarriageHousesReading,
  b: MarriageHousesReading,
  nameA: string,
  nameB: string,
): MarriedLifeNote[] {
  const notes: MarriedLifeNote[] = []
  const covers = (from: MarriageHousesReading, onto: MarriageHousesReading) =>
    EIGHT.filter(h => onto.flags.health[h] === 'strained' && from.flags.health[h] === 'holding')
  const aCovers = covers(a, b)
  const bCovers = covers(b, a)
  const total = aCovers.length + bCovers.length
  if (total >= 3) {
    notes.push(note(
      'houses-pair-cover',
      'The two charts cover each other',
      `${nameA} holds ${aCovers.length ? aCovers.map(ordinalHouse).join(', ') : 'none'} of the houses ${nameB} strains. ${nameB} holds ${bCovers.length ? bCovers.map(ordinalHouse).join(', ') : 'none'} of the houses ${nameA} strains. ${total} houses are covered between them. The class treats three or four such covers as enough for the marriage to work. Ashtakoot is this complementary balancing in another language.`,
      'supportive',
    ))
  } else if (EIGHT.some(h => a.flags.health[h] === 'strained' || b.flags.health[h] === 'strained')) {
    notes.push(note(
      'houses-pair-gap',
      'The weak houses are still mostly uncovered',
      `Only ${total} strained house${total === 1 ? '' : 's'} ${total === 1 ? 'is' : 'are'} held by the other chart. The class does not ask for all eight to be perfect. It does ask that the partner supply what this chart cannot. That supply is thin here.`,
      'caution',
    ))
  }

  if (a.flags.fourthStrained && b.flags.fourthStrained) {
    notes.push(note(
      'houses-pair-fourth',
      'Both 4th houses are unbalanced',
      `${nameA} and ${nameB} each carry the class’s divorce condition in the 4th: emotional security is missing on both sides. A quiet 7th in either chart does not remove it.`,
      'caution',
    ))
  } else if (a.flags.fourthStrained || b.flags.fourthStrained) {
    const who = a.flags.fourthStrained ? nameA : nameB
    const other = a.flags.fourthStrained ? nameB : nameA
    notes.push(note(
      'houses-pair-fourth',
      'One 4th house has to be carried',
      `${who}’s 4th is unbalanced. ${other} is the chart that has to supply emotional protection, because the class allows a marriage to fail from the 4th alone.`,
      'mixed',
    ))
  }

  if (a.flags.trineBalanced && b.flags.relationshipBalanced || b.flags.trineBalanced && a.flags.relationshipBalanced) {
    notes.push(note(
      'houses-pair-styles',
      'One chart grows, the other holds the bond',
      'One chart’s 1st, 5th, and 9th are the value-based pattern. The other’s 4th, 7th, 8th, and 12th put the relationship first. Together they cover the two priorities the class separates.',
      'supportive',
    ))
  }

  return notes
}
