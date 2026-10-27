// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/career.ts
//  Career from the birth chart, in the order taught:
//  exchange, then three planets in one house, then Saturn’s
//  conjunction, then Saturn’s trine, then a vargottama or
//  exalted planet, then the 10th. Rashi exchange only.
//  A retrograde planet is counted in the sign it occupies.
//  Saturn with the Moon is read as agriculture, dairy, food, or land.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { getDignity } from '@/lib/engine/dignity'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { nadiAfflictedBy } from '@/lib/engine/nadi/grahas'
import { NADI_CAREER_WORK } from '@/lib/engine/nadi/rotation'
import { nadiClosenessClause, nadiConjunctionGrade, nadiConjunct, type NadiYogaPlacement } from '@/lib/engine/nadi/yogas'

export const NADI_CAREER_CONTEXT =
  'Read the size of the result against the place of birth. The chart is the floor.'

const HOUSE_CAREER: Record<HouseNumber, string> = {
  1: 'the native’s own name and effort',
  2: 'food, a family business, a hotel, or accumulated wealth',
  3: 'writing, courage, or short journeys',
  4: 'property, rent, vehicles, or a family business in land',
  5: 'speculation, markets, or education',
  6: 'medicine, law, or consulting, with service and comfort around the person',
  7: 'business or a partnership, including one already established',
  8: 'inheritance, occult work, or wealth from the spouse’s family, with little need to earn it',
  9: 'luck, teaching, spiritual work, or trade across countries, often with little personal effort',
  10: 'rank and a public position',
  11: 'gains, a windfall, or a desire that is met',
  12: 'life abroad, an overseas career, or spiritual withdrawal',
}

const MEGA_CAREER: Partial<Record<HouseNumber, string>> = {
  1: 'a self-made name',
  5: 'speculation, the stock market, or gaming',
  6: 'a doctor or a lawyer',
}

const PAIR_CAREER: Record<string, string> = {
  '1-2': 'A name that carries a business, and wealth with it.',
  '2-4': 'Food or a family business, or property and rent.',
  '4-12': 'Property abroad, and a life settled overseas.',
  '5-11': 'Speculation, markets, or a windfall such as a lottery.',
  '9-12': 'A career abroad, trade across countries, or a teaching post.',
  '9-10': 'Government work, politics, or a family business.',
  '10-11': 'A high post, such as a director.',
  '10-12': 'Work abroad, or an import-export business.',
}

const WEALTH_HOUSES = new Set<HouseNumber>([2, 9, 11])
const STRONG = new Set(['exalted', 'own', 'moolatrikona'])
const DUSTHANA = new Set<HouseNumber>([6, 8, 12])
const SATURN_ORDER: readonly ClassicalGrahaId[] = ['Ra', 'Ke', 'Ma', 'Ve', 'Ju', 'Su', 'Me', 'Mo']

export interface NadiCareerReading {
  priority: 1 | 2 | 3 | 4 | 5
  lines: string[]
  wealth: string | null
  lucky: string | null
  exams: string | null
  notes: string[]
}

export interface NadiCareerInput {
  ascRashi: Rashi
  grahas: readonly NadiYogaPlacement[]
  parivartana: readonly { a: HouseNumber; b: HouseNumber }[]
  navamsha?: Partial<Record<ClassicalGrahaId, Rashi>>
  ninthArudhaInLagna?: boolean
  dashaLords?: readonly ClassicalGrahaId[]
}

export function findNadiCareer(input: NadiCareerInput): NadiCareerReading {
  const lucky = input.ninthArudhaInLagna
    ? 'The arudha of the 9th falls in the lagna. Wealth is read as unearned, from the father or through marriage, and things arrive with little personal effort.'
    : null
  const notes = sideNotes(input)
  const exams = examNote(input)
  const core = careerCore(input)
  return { ...core, lucky, exams, notes }
}

function careerCore(input: NadiCareerInput): Pick<NadiCareerReading, 'priority' | 'lines' | 'wealth'> {
  if (input.parivartana.length > 0) {
    const lines = ['An exchange is present, so career is read from those houses. The 10th is set aside.']
    let wealth = false
    for (const pair of input.parivartana) {
      const key = pair.a < pair.b ? `${pair.a}-${pair.b}` : `${pair.b}-${pair.a}`
      const named = PAIR_CAREER[key]
      const either = `${HOUSE_CAREER[pair.a]}; or ${HOUSE_CAREER[pair.b]}`
      lines.push(
        named
          ? `Exchange of the ${ordinal(pair.a)} and the ${ordinal(pair.b)}. ${named} Either may show: ${either}.`
          : `Exchange of the ${ordinal(pair.a)} and the ${ordinal(pair.b)}. Either may show: ${either}.`,
      )
      const lords = new Set([lordOf(input.ascRashi, pair.a), lordOf(input.ascRashi, pair.b)])
      if (lords.has('Sa') && lords.has('Ve')) {
        lines.push('The exchanging lords are Saturn and Venus. Cloth, jewelry, hotels, vehicles, finance, or medicine is read ahead of a mere conjunction, and it is read as wealth.')
      }
      if (lords.has('Sa') && lords.has('Ma')) {
        lines.push('The exchanging lords are Saturn and Mars. Engineering is read ahead of a trine.')
      }
      if (pair.a === 5 && pair.b === 9) {
        lines.push('Exchange of the 5th and the 9th. A high government post is one option.')
      }
      if (lords.has('Su') && lords.has('Sa')) {
        lines.push('Sun and Saturn are the exchanging lords. This is the one exchange read as under pressure. The houses are still the career.')
      }
      if ((pair.a === 12 || pair.b === 12) && !/abroad|overseas|import-export/.test(named ?? '')) {
        lines.push('The 12th is in the exchange. Work or settlement away from home is checked.')
      }
      if ((pair.a === 4 || pair.b === 4) && jupiterStrong(input)) {
        lines.push('The 4th is in the exchange, and Jupiter is strong. Property and a vehicle are read as supported.')
      }
      if (WEALTH_HOUSES.has(pair.a) || WEALTH_HOUSES.has(pair.b)) wealth = true
    }
    return {
      priority: 1,
      lines,
      wealth: wealth ? 'The 2nd, 9th, or 11th is in the exchange. That is read as large wealth.' : null,
    }
  }

  const byHouse = housesOf(input)
  const crowds = [...byHouse.entries()].filter(([, list]) => list.length >= 3)
  const decisive = crowds.filter(([house]) => house !== 1)
  if (decisive.length > 0) {
    const lines = decisive.map(([house, list]) => {
      const dusthana = house === 6 || house === 8 || house === 12
        ? ' A crowd here is read as success in that house’s work.'
        : ''
      return `${list.map((g) => GRAHA_NAMES[g.id]).join(', ')} sit together in the ${ordinal(house)}. Career is read from that house: ${MEGA_CAREER[house] ?? HOUSE_CAREER[house]}.${dusthana}`
    })
    if (decisive.length > 1) lines.push('More than one house holds three planets. Dashamsha is used to choose between them.')
    return { priority: 2, lines, wealth: null }
  }

  const fifth = fifthSupports(input)
  const conjunct = saturnContacts(input.grahas, 'yuti')
  if (conjunct.length > 0) {
    return {
      priority: 3,
      lines: [
        `Saturn is conjunct ${namesOf(conjunct)}. That contact is read ahead of a trine.`,
        ...conjunct.map((id) => {
          const clause = nadiClosenessClause(nadiConjunctionGrade(input.grahas, ['Sa', id]))
          const line = saturnLine(id, fifth)
          return clause ? `${line} ${clause}` : line
        }),
      ],
      wealth: null,
    }
  }

  const trine = saturnContacts(input.grahas, 'trine')
  if (trine.length > 0) {
    return {
      priority: 4,
      lines: [
        `In the 5th or 9th sign from Saturn: ${namesOf(trine)}. A conjunction would come ahead of this.`,
        ...trine.map((id) => saturnLine(id, fifth)),
      ],
      wealth: null,
    }
  }

  const special: string[] = []
  for (const g of input.grahas) {
    const vargottama = input.navamsha?.[g.id] === g.rashi
    const exalted = placedDignity(g) === 'exalted'
    if (!vargottama && !exalted) continue
    const how = vargottama && exalted ? 'vargottama and exalted' : vargottama ? 'vargottama' : 'exalted'
    special.push(`${GRAHA_NAMES[g.id]} is ${how}. Career is read from that planet: ${NADI_CAREER_WORK[g.id]}.`)
  }
  if (special.length > 0) return { priority: 5, lines: special, wealth: null }

  const tenthSign = rashiForHouseFromLagna(input.ascRashi, 10)
  const tenthLord = RASHI_LORDS.find((row) => row.number === tenthSign)?.lord ?? 'Su'
  const occupants = (byHouse.get(10) ?? []).map((g) => GRAHA_NAMES[g.id])
  const where = occupants.length === 0
    ? ''
    : occupants.length === 1
      ? `, where ${occupants[0]} sits,`
      : `, where ${occupants.join(', ')} sit,`
  const missing = [
    'No exchange',
    'no group of three',
    'no Saturn career pair',
    input.navamsha ? 'no vargottama planet' : null,
    'no exalted planet',
  ].filter((part): part is string => part !== null).join(', ')
  return {
    priority: 5,
    lines: [
      `${missing}. Career is read from the 10th${where} and from its lord ${GRAHA_NAMES[tenthLord]}.`,
    ],
    wealth: null,
  }
}

function saturnLine(id: ClassicalGrahaId, fifth: boolean): string {
  if (id === 'Ra') {
    return 'IT, computers, or other technology. The same contact can take the work abroad. In that field it supports the career. Outside it, breaks and obstacles are checked.'
  }
  if (id === 'Ke') {
    return fifth
      ? 'IT or technology. The 5th supports study, so law stays open. Outside that field, breaks are checked.'
      : 'IT or technology. The 5th does not add a law course. Outside that field, breaks are checked.'
  }
  if (id === 'Ma') {
    return fifth
      ? 'Engineering or other technical work. The 5th supports study, so surgery stays open as the rare form.'
      : 'Engineering or other technical work.'
  }
  if (id === 'Ve') {
    return fifth
      ? 'Cloth, jewelry, hotels, vehicles, or other luxury goods. The 5th supports study, so finance or medicine is read beside that business. The pair is also read as wealth.'
      : 'Cloth, jewelry, hotels, vehicles, or other luxury goods. The 5th does not add a long course, so the business form is the one to read. The pair is also read as wealth.'
  }
  if (id === 'Ju') return 'Teaching, consulting, astrology, or the law.'
  if (id === 'Su') {
    return 'A government post, for the native or for the father. The father’s health and the heart are under pressure, and a court case is checked.'
  }
  if (id === 'Mo') {
    return 'Agriculture, dairy, food, or land. A change of city or country is also checked.'
  }
  return 'Business, journalism, banking, teaching, or other Mercury work.'
}

function saturnContacts(grahas: readonly NadiYogaPlacement[], kind: 'yuti' | 'trine'): ClassicalGrahaId[] {
  const saturn = grahas.find((g) => g.id === 'Sa')
  if (!saturn) return []
  const fifth = countedSign(saturn.rashi, 5)
  const ninth = countedSign(saturn.rashi, 9)
  const found = SATURN_ORDER.filter((id) => {
    const other = grahas.find((g) => g.id === id)
    if (!other) return false
    if (kind === 'yuti') return nadiConjunct(grahas, ['Sa', id]) !== null
    return other.rashi === fifth || other.rashi === ninth
  })
  if (kind === 'trine' && found.length === 1 && found[0] === 'Ma') return []
  return found
}

function sideNotes(input: NadiCareerInput): string[] {
  const notes: string[] = []
  const birth = nadiConjunct(input.grahas, ['Ma', 'Ve']) !== null
  const navamsha = input.navamsha?.Ma != null && input.navamsha.Ma === input.navamsha.Ve
  if (birth || navamsha) {
    const where = birth && navamsha
      ? 'in the birth chart and in Navamsha'
      : birth
        ? 'in the birth chart'
        : 'in Navamsha'
    notes.push(`Mars with Venus ${where}: the living is read as luxury, apart from the profession.`)
  }

  const saturn = input.grahas.find((g) => g.id === 'Sa')
  const jupiter = input.grahas.find((g) => g.id === 'Ju')
  if (saturn && jupiter) {
    const saturnState = saturn.rashi === 7 ? 'exalted' : saturn.rashi === 10 || saturn.rashi === 11 ? 'own' : null
    const jupiterState = jupiter.rashi === 4 ? 'exalted' : jupiter.rashi === 9 || jupiter.rashi === 12 ? 'own' : null
    if (saturnState && jupiterState) {
      notes.push(saturnState === 'exalted' && jupiterState === 'own'
        ? 'Saturn is exalted and Jupiter is in its own sign. Inherited wealth is the strong form of this pair, with little need to earn it.'
        : 'Saturn and Jupiter are each in exaltation or their own sign. Wealth is read as inherited, with little need to earn it.')
    }
  }
  if (jupiter && wholeSignHouseFromLagna(input.ascRashi, jupiter.rashi) === 4) {
    notes.push('Jupiter in the 4th: an SUV is the vehicle read for this chart.')
  }
  if (nadiConjunct(input.grahas, ['Su', 'Me', 'Ve'])) {
    const sun = input.grahas.find((g) => g.id === 'Su')
    const sunStrong = sun?.rashi === 1 || sun?.rashi === 5
    notes.push(sunStrong
      ? 'Sun, Mercury, and Venus together, with the Sun strong: the father is read as wealthy. In a woman’s chart the same reading is taken for the father-in-law.'
      : 'Sun, Mercury, and Venus are together, and the Sun is not strong, so the wealthy-father reading is not taken.')
  }
  const running = new Set((input.dashaLords ?? []).slice(0, 3))
  const pressured = new Set<ClassicalGrahaId>()
  const supportive = new Set<ClassicalGrahaId>()
  for (const pair of input.parivartana) {
    const lords = [lordOf(input.ascRashi, pair.a), lordOf(input.ascRashi, pair.b)]
    const target = lords.includes('Su') && lords.includes('Sa') ? pressured : supportive
    for (const id of lords) target.add(id)
  }
  if ([...running].some((id) => pressured.has(id))) {
    notes.push('A lord of the Sun and Saturn exchange is in the running period. The result is read as under pressure.')
  } else if ([...running].some((id) => supportive.has(id))) {
    notes.push('A lord of the exchange is in the running period, so the career result is read now.')
  }
  const first = input.grahas.filter((g) => wholeSignHouseFromLagna(input.ascRashi, g.rashi) === 1)
  if (first.length >= 3) {
    notes.push('The 1st holds a crowd. Sport or physical work is the form. It does not name one profession by itself.')
  }
  const study = studyPath(input)
  if (study) notes.push(study)
  if (nadiConjunct(input.grahas, ['Su', 'Me'])) {
    const sun = input.grahas.find((g) => g.id === 'Su')
    if (sun) {
      const house = wholeSignHouseFromLagna(input.ascRashi, sun.rashi)
      notes.push(`Sun with Mercury weakens the ${ordinal(house)}. Work is read from that house.`)
    }
  }
  return notes
}

function examNote(input: NadiCareerInput): string | null {
  const fifth = lordState(input, 5)
  const ninth = lordState(input, 9)
  if (!fifth.placed || !ninth.placed) return null
  if (fifth.strong && ninth.strong) return null
  return 'The 5th lord and the 9th lord are not both strong. A competitive exam is not the result read from this chart.'
}

function jupiterStrong(input: NadiCareerInput): boolean {
  const jupiter = input.grahas.find((g) => g.id === 'Ju')
  if (!jupiter) return false
  return STRONG.has(placedDignity(jupiter)) && nadiAfflictedBy('Ju', coOccupants(input, jupiter.rashi)).length === 0
}

function studyPath(input: NadiCareerInput): string | null {
  const sign = rashiForHouseFromLagna(input.ascRashi, 5)
  const lord = lordOf(input.ascRashi, 5)
  const nodesInFifth = input.grahas.some((g) => (g.id === 'Ra' || g.id === 'Ke') && g.rashi === sign)
  const lordWithNode = input.grahas.some((g) => (g.id === 'Ra' || g.id === 'Ke') && nadiConjunct(input.grahas, [lord, g.id]) != null)
  const lordWithSaturn = nadiConjunct(input.grahas, ['Sa', lord]) != null
  if (nodesInFifth || lordWithNode || lordWithSaturn) {
    return 'The 5th is under pressure. Where a planet offers both a trained post and a practical trade, the practical trade is the one to read.'
  }
  const jupiter = input.grahas.find((g) => g.id === 'Ju')
  const jupiterReady = jupiter != null && jupiterStrong(input) && !DUSTHANA.has(wholeSignHouseFromLagna(input.ascRashi, jupiter.rashi))
  if (fifthSupports(input) || jupiterReady) {
    return 'The 5th supports study. Where a planet offers both a trained post and a practical trade, the trained post is the one to read.'
  }
  return null
}

function coOccupants(input: NadiCareerInput, sign: Rashi): ClassicalGrahaId[] {
  return input.grahas.filter((g) => g.rashi === sign).map((g) => g.id)
}

function fifthSupports(input: NadiCareerInput): boolean {
  const fifth = lordState(input, 5)
  return fifth.placed && fifth.strong
}

function lordState(input: NadiCareerInput, house: HouseNumber): { placed: boolean; strong: boolean } {
  const lord = lordOf(input.ascRashi, house)
  const placed = input.grahas.find((g) => g.id === lord)
  if (!placed) return { placed: false, strong: false }
  const houseOfLord = wholeSignHouseFromLagna(input.ascRashi, placed.rashi)
  const co = input.grahas.filter((g) => g.rashi === placed.rashi).map((g) => g.id)
  const strong = STRONG.has(placedDignity(placed))
    && !DUSTHANA.has(houseOfLord)
    && nadiAfflictedBy(lord, co).length === 0
  return { placed: true, strong }
}

function housesOf(input: NadiCareerInput): Map<HouseNumber, NadiYogaPlacement[]> {
  const byHouse = new Map<HouseNumber, NadiYogaPlacement[]>()
  for (const g of input.grahas) {
    const house = wholeSignHouseFromLagna(input.ascRashi, g.rashi)
    const list = byHouse.get(house) ?? []
    list.push(g)
    byHouse.set(house, list)
  }
  return byHouse
}

function lordOf(asc: Rashi, house: HouseNumber): ClassicalGrahaId {
  const sign = rashiForHouseFromLagna(asc, house)
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}

function namesOf(ids: readonly ClassicalGrahaId[]): string {
  return ids.map((id) => GRAHA_NAMES[id]).join(' and ')
}

function placedDignity(g: NadiYogaPlacement): string {
  if (g.dignity) return g.dignity
  return getDignity(g.id, g.rashi, g.degree ?? 15)
}

function countedSign(start: Rashi, nth: number): Rashi {
  return (((start - 1 + (nth - 1)) % 12) + 1) as Rashi
}

function ordinal(n: number): string {
  const mod = n % 10
  if (mod === 1 && n !== 11) return `${n}st`
  if (mod === 2 && n !== 12) return `${n}nd`
  if (mod === 3 && n !== 13) return `${n}rd`
  return `${n}th`
}
