// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/read.ts
//  Join a whole-sign chart with Nadi houses, existing bhava
//  themes, rashi notes, and graha karakas.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaId, NodeMode, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import {
  RASHI_LORDS,
  getHouseTheme,
  getPlanetInHouse,
  isClassicalGraha,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { getNaturalKarakasForHouse } from '@/lib/engine/naturalHouseKarakas'
import { getPlanetInSign, getRashiCoreSummary, getRashiInHouse, rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import {
  NADI_HOUSES,
  NADI_LORD_LINKS,
  NADI_MALEFIC_LIVING_RULE,
  NADI_PAPA_GRAHAS,
  NADI_PILLARS,
  type NadiHouseProfile,
  type NadiLordLink,
} from '@/lib/engine/nadi/houses'
import { NADI_GRAHAS, nadiAfflictedBy, type NadiGrahaProfile } from '@/lib/engine/nadi/grahas'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import {
  NADI_KHAARAB_THEME,
  findKhaarabYogas,
  type NadiKhaarabYoga,
} from '@/lib/engine/nadi/yogas'
import {
  findMarriageYogas,
  marriageNote,
  type NadiMarriageYoga,
} from '@/lib/engine/nadi/marriage'
import {
  findNadiCareer,
  NADI_CAREER_CONTEXT,
  type NadiCareerReading,
} from '@/lib/engine/nadi/career'
import {
  findNadiSnapshots,
  findWealthWindows,
  type NadiSnapshot,
  type NadiWealthWindow,
} from '@/lib/engine/nadi/snapshots'
import { readRetrograde } from '@/lib/engine/nadi/retrograde'
import { readBcp, type BcpReading } from '@/lib/engine/nadi/bcp'
import { NADI_GEM_NOTE, gemReference, gemstoneNotes, type NadiGemRow } from '@/lib/engine/nadi/gems'
import { NADI_DEGREE_NOTE, degreeTimingNotes } from '@/lib/engine/nadi/degrees'
import { NADI_DUSTHANA_NOTE, dusthanaReversalNotes } from '@/lib/engine/nadi/dusthana'
import { NADI_NAVAMSHA_NOTE, navamshaPredictionNotes } from '@/lib/engine/nadi/navamsha'
import {
  dashamshaCareerNotes,
  NADI_DASHAMSHA_NOTE,
  NADI_NEIGHBORHOOD_NOTE,
  neighborhoodNotes,
} from '@/lib/engine/nadi/dashamsha'
import { NADI_WEALTH_TIMING_NOTE, wealthTimingNotes } from '@/lib/engine/nadi/wealth'
import { NADI_SPECIAL_NOTE, specialDegreeNotes } from '@/lib/engine/nadi/special'
import {
  NADI_PROPERTY_NOTE,
  NADI_VEHICLE_NOTE,
  nadiNodeNote,
  propertyNotes,
  vehicleNotes,
} from '@/lib/engine/nadi/property'
import { NADI_SHASHTIAMSA_NOTE, shashtiamsaNotes } from '@/lib/engine/nadi/shashtiamsa'
import { NADI_BHRIGU_NOTE, bhriguBhavaNotes } from '@/lib/engine/nadi/bhrigu'
import { readNadiLife, type NadiLifeReading } from '@/lib/engine/nadi/life'
import {
  NADI_PLACEMENT_NOTE,
  nadiHouseLine,
  readNadiPlacements,
  type NadiPlacement,
} from '@/lib/engine/nadi/placements'

export type { NadiPlacement }
import { NADI_MARRIAGE_RULE_NOTE, readChartLectures } from '@/lib/engine/nadi/marriageRules'
import { readNadiFuture, type NadiDashaNode, type NadiFutureReading } from '@/lib/engine/nadi/future'
import {
  NADI_NODE_TRANSIT,
  NADI_SATURN_TRANSIT,
  NADI_SLOW_TRANSIT_NOTE,
  hardTransitNotes,
  saturnTransitGroups,
  slowTransitNotes,
} from '@/lib/engine/nadi/transits'
import {
  NADI_CAREER_WORK,
  NADI_JUPITER_TRANSIT,
  NADI_ROTATION_NOTE,
  deathIndicators,
  educationNotes,
  healthFlags,
  houseCountedFrom,
  jupiterTransitGroups,
  navamshaLabel,
  parivartanaWealth,
  rotateRelatives,
  uniformNotes,
  type NadiDeathIndicator,
  type NadiRotatedRelative,
} from '@/lib/engine/nadi/rotation'

export interface NadiGrahaPlacement {
  id: ClassicalGrahaId
  rashi: Rashi
  dignity?: string
  isRetro?: boolean
  isCombust?: boolean
  degree?: number
}

export interface NadiChartInput {
  ascRashi: Rashi
  grahas: NadiGrahaPlacement[]
  /** Navamsha sign of each graha, for the shloka 731 death indicator. */
  navamsha?: Partial<Record<ClassicalGrahaId, Rashi>>
  /** Lords of the Vimshottari periods running now. */
  dashaLords?: ClassicalGrahaId[]
  /** Navamsha read as its own chart. */
  navamshaChart?: { ascRashi: Rashi; grahas: NadiGrahaPlacement[] }
  /** Dashamsha read for career. */
  dashamshaChart?: { ascRashi: Rashi; grahas: NadiGrahaPlacement[] }
  /** Chaturthamsha read for property. */
  chaturthamsha?: { ascRashi: Rashi; grahas: NadiGrahaPlacement[] }
  /** Shodashamsha read for vehicles. */
  shodashamsha?: { ascRashi: Rashi; grahas: NadiGrahaPlacement[] }
  /** Shashtiamsa read with the same rules as the birth chart. */
  shashtiamsa?: { ascRashi: Rashi; grahas: NadiGrahaPlacement[] }
  /** True nodes are the Nadi reading. Mean nodes are only noted. */
  nodeMode?: NodeMode
  /** Arudha of the 9th falls in the lagna. */
  ninthArudhaInLagna?: boolean
  /** Sign of the 9th arudha. */
  ninthArudha?: Rashi
  /** Sarvashtakavarga bindus, index 0 = Aries. */
  sav?: readonly number[]
  /** Local birth date, YYYY-MM-DD. Used for the running year. */
  birthDate?: string
  /** Clock for the running year. Defaults to now. */
  asOf?: Date
  /** Arudha lagna sign, for Jupiter sitting there. */
  arudhaLagna?: Rashi
  /** Upapada, the arudha of the 12th. */
  upapada?: Rashi
  /** Degree of the lagna inside its sign, 0–30. */
  ascDegree?: number
  gender?: 'male' | 'female' | 'other'
  /** Sidereal longitude of the Bhrigu Bindu. */
  bhriguBindu?: number
  /** Moon’s nakshatra index, 0–26. */
  moonNakshatra?: number
  nakshatras?: Partial<Record<ClassicalGrahaId, number>>
  /** Vimshottari tree, used for the periods still ahead. */
  dashaNodes?: readonly NadiDashaNode[]
}

export interface NadiOccupantReading {
  id: ClassicalGrahaId
  name: string
  retro: boolean
  dignity: string | null
  nadiNote: string | null
  signNote: string | null
  classicalHouseNote: string | null
  professions: string[]
  bodyParts: string[]
  afflictedBy: string[]
  /** House, lordship, and sign read together. */
  prediction: string
}

export interface NadiHouseReading {
  house: HouseNumber
  name: string
  sign: Rashi
  signName: string
  signNature: string | null
  signInHouse: string | null
  /** The sign’s own number, read as a natural house. */
  naturalHouse: HouseNumber
  naturalHouseLabel: string
  lord: GrahaId
  lordName: string
  lordHouse: HouseNumber | null
  profile: NadiHouseProfile
  classicalThemes: string[]
  naturalKarakas: GrahaId[]
  occupants: NadiOccupantReading[]
  papaPresent: boolean
  activeRules: string[]
  roles: string[]
  /** Sign, lord, and occupants of this house read together. */
  prediction: string
}

export interface NadiLinkReading {
  id: string
  reading: string
}

export interface NadiTiming {
  id: string
  event: string
  house: HouseNumber
  lordName: string
  running: boolean
}

export type NadiRelativeReading = NadiRotatedRelative
export type NadiDeathReading = NadiDeathIndicator

export interface NadiChartReading {
  pillars: typeof NADI_PILLARS
  maleficRule: string
  houses: NadiHouseReading[]
  placementNote: string
  placements: NadiPlacement[]
  links: NadiLinkReading[]
  parivartana: { a: HouseNumber; b: HouseNumber }[]
  relatives: NadiRelativeReading[]
  rotationNote: string
  timings: NadiTiming[]
  deathIndicators: NadiDeathReading[]
  healthFlags: string[]
  wealthNotes: string[]
  uniformNotes: string[]
  colorNotes: string[]
  remedyNotes: string[]
  gemNote: string
  gemReference: NadiGemRow[]
  gemNotes: string[]
  decisionNotes: string[]
  degreeNote: string
  degreeNotes: string[]
  navamshaNote: string
  navamshaNotes: string[]
  dusthanaNote: string
  dusthanaNotes: string[]
  dashamshaNote: string
  dashamshaNotes: string[]
  neighborhoodNote: string
  neighborhoodNotes: string[]
  propertyNote: string
  propertyNotes: string[]
  vehicleNote: string
  vehicleNotes: string[]
  shashtiamsaNote: string
  shashtiamsaNotes: string[]
  bhriguHouse: HouseNumber
  bhriguNote: string
  bhriguNotes: string[]
  life: NadiLifeReading
  marriageRuleNote: string
  marriageRuleNotes: string[]
  afflictedNotes: string[]
  yearNotes: string[]
  dhanNotes: string[]
  nodeNote: string | null
  sunNote: string | null
  saturnRetroNote: string | null
  retrogradeNotes: string[]
  pitruNote: string | null
  marsSouthNote: string | null
  jupiterGroups: string[]
  saturnTransit: typeof NADI_SATURN_TRANSIT
  saturnGroups: string[]
  nodeTransit: typeof NADI_NODE_TRANSIT
  slowTransitNote: string
  slowTransitNotes: string[]
  foreignSettlement: boolean
  jupiterTransit: typeof NADI_JUPITER_TRANSIT
  khaarabTheme: string
  yogas: NadiKhaarabYoga[]
  marriageYogas: NadiMarriageYoga[]
  marriageNote: string | null
  career: NadiCareerReading
  careerContext: string
  bcp: BcpReading | null
  snapshots: NadiSnapshot[]
  wealthWindows: NadiWealthWindow[]
  wealthTimingNote: string
  wealthTiming: string[]
  hardTransitNotes: string[]
  specialNote: string
  specialNotes: string[]
  future: NadiFutureReading
}

export interface NadiRelativeDef {
  id: string
  label: string
  house: HouseNumber
}

export const NADI_RELATIVES: readonly NadiRelativeDef[] = [
  { id: 'mother', label: 'Mother', house: 4 },
  { id: 'father', label: 'Father', house: 10 },
  { id: 'children', label: 'Children', house: 5 },
  { id: 'spouse', label: 'Spouse', house: 7 },
  { id: 'younger', label: 'Younger siblings', house: 3 },
  { id: 'elder', label: 'Elder siblings', house: 11 },
  { id: 'maternal', label: 'Maternal uncle / aunt', house: 6 },
]

const HOUSES: HouseNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export { houseCountedFrom }

const STRONG_DIGNITY = new Set(['exalted', 'own', 'moolatrikona'])

function vargaGrahas(chart: ChartOutput, key: string): NadiGrahaPlacement[] {
  return (chart.vargas?.[key] ?? []).flatMap((g) => {
    if (!isClassicalGraha(g.id)) return []
    return [{
      id: g.id,
      rashi: g.rashi,
      dignity: g.dignity,
      isRetro: g.isRetro,
      degree: g.degree,
    }]
  })
}

export function readNadiChart(chart: ChartOutput): NadiChartReading {
  const navamsha: Partial<Record<ClassicalGrahaId, Rashi>> = {}
  for (const g of chart.vargas?.D9 ?? []) {
    if (isClassicalGraha(g.id)) navamsha[g.id] = g.rashi
  }
  const dashaLords = getDashaPathAt(chart.dashas?.vimshottari ?? [])
    .map((node) => node.lord)
    .filter(isClassicalGraha)

  const d9Asc = chart.vargaLagnas?.D9
  const d9Grahas = vargaGrahas(chart, 'D9')
  const d10Asc = chart.vargaLagnas?.D10
  const d10Grahas = vargaGrahas(chart, 'D10')
  const d4Asc = chart.vargaLagnas?.D4
  const d4Grahas = vargaGrahas(chart, 'D4')
  const d16Asc = chart.vargaLagnas?.D16
  const d16Grahas = vargaGrahas(chart, 'D16')
  const d60Asc = chart.vargaLagnas?.D60
  const d60Grahas = vargaGrahas(chart, 'D60')

  const arudha = chart.arudhasBphs ?? chart.arudhas
  return readNadiHouses({
    ascRashi: chart.lagnas.ascRashi,
    grahas: chart.grahas.flatMap((g) => {
      if (!isClassicalGraha(g.id)) return []
      return [{
        id: g.id,
        rashi: g.rashi,
        dignity: g.dignity,
        isRetro: g.isRetro,
        isCombust: g.isCombust,
        degree: g.degree,
      }]
    }),
    navamsha,
    dashaLords,
    navamshaChart: d9Asc ? { ascRashi: d9Asc, grahas: d9Grahas } : undefined,
    dashamshaChart: d10Asc ? { ascRashi: d10Asc, grahas: d10Grahas } : undefined,
    chaturthamsha: d4Asc ? { ascRashi: d4Asc, grahas: d4Grahas } : undefined,
    shodashamsha: d16Asc ? { ascRashi: d16Asc, grahas: d16Grahas } : undefined,
    shashtiamsa: d60Asc ? { ascRashi: d60Asc, grahas: d60Grahas } : undefined,
    nodeMode: chart.meta.settings.nodeMode,
    ninthArudhaInLagna: arudha?.A9 === chart.lagnas.ascRashi,
    ninthArudha: arudha?.A9,
    sav: chart.ashtakavarga?.sav,
    birthDate: chart.meta.birthDate,
    ascDegree: chart.lagnas.ascDegreeInRashi,
    arudhaLagna: arudha?.AL,
    upapada: arudha?.A12,
    bhriguBindu: chart.lagnas.bhriguBindu,
    moonNakshatra: chart.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex,
    nakshatras: Object.fromEntries(
      chart.grahas.flatMap((g) => (isClassicalGraha(g.id) ? [[g.id, g.nakshatraIndex]] : [])),
    ) as Partial<Record<ClassicalGrahaId, number>>,
    gender: chart.meta.gender,
    dashaNodes: chart.dashas?.vimshottari,
  })
}

export function readNadiHouses(input: NadiChartInput): NadiChartReading {
  const asc = input.ascRashi
  const grahas = input.grahas.filter((g) => isClassicalGraha(g.id))

  const houseOf = (rashi: Rashi) => wholeSignHouseFromLagna(asc, rashi)
  const occupantsOf = (house: HouseNumber) => grahas.filter((g) => houseOf(g.rashi) === house)

  const lordOf = (house: HouseNumber): ClassicalGrahaId => {
    const sign = rashiForHouseFromLagna(asc, house)
    return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
  }

  const lordHouseOf = (house: HouseNumber): HouseNumber | null => {
    const placed = grahas.find((g) => g.id === lordOf(house))
    if (!placed) return null
    return houseOf(placed.rashi)
  }

  const placements = readNadiPlacements({ ascRashi: asc, grahas })
  const predictionOf = new Map(placements.map((row) => [row.id, row.prediction]))
  const houses = HOUSES.map((house) => readHouse(
    house,
    asc,
    occupantsOf(house),
    lordHouseOf(house),
    predictionOf,
    nadiHouseLine({ ascRashi: asc, house, lordHouse: lordHouseOf(house), placements }),
  ))

  const links = NADI_LORD_LINKS.flatMap((link) => (
    linkFires(link, lordHouseOf, occupantsOf) ? [{ id: link.id, reading: link.reading }] : []
  ))

  const parivartana: { a: HouseNumber; b: HouseNumber }[] = []
  for (const a of HOUSES) {
    const b = lordHouseOf(a)
    if (b == null || b === a || a > b) continue
    if (lordHouseOf(b) === a) parivartana.push({ a, b })
  }

  const retrograde = readRetrograde({ ascRashi: asc, grahas, parivartana })
  const saturnRetroNote = retrograde.saturn

  const travel = lordsConnected(3, 12, lordHouseOf)
  const ninthJoins = lordsConnected(3, 9, lordHouseOf) || lordsConnected(9, 12, lordHouseOf)
  if (travel && ninthJoins) {
    links.push({ id: '3-9-12-settle', reading: 'The 3rd, 9th, and 12th are linked: foreign settlement, not only a trip.' })
  }
  if (occupantsOf(5).some((g) => g.id === 'Ra') || occupantsOf(9).some((g) => g.id === 'Ra')) {
    links.push({ id: 'rahu-foreign-study', reading: 'Rahu in the 5th or 9th: foreign education is likely.' })
  }
  const second = occupantsOf(2)
  if (second.some((g) => g.id === 'Sa') && second.some((g) => g.id === 'Ke')) {
    links.push({ id: 'sa-ke-2', reading: 'Saturn with Ketu in the 2nd: the saved wealth is at risk, including a business that collapses into debt.' })
  } else if (second.some((g) => g.id === 'Ke')) {
    links.push({ id: 'ketu-2', reading: 'Ketu in the 2nd: a break in the family’s money. Selling gold, or using up what was saved, is the form checked.' })
  }

  const relatives = rotateRelatives(occupantsOf)
  const dasha = new Set(input.dashaLords ?? [])
  const timings: NadiTiming[] = relatives.flatMap((rel) => {
    const rows: { suffix: string; event: string; house: HouseNumber }[] = [
      { suffix: 'career', event: 'career', house: rel.careerHouse },
      { suffix: 'marriage', event: 'marriage', house: rel.marriageHouse },
    ]
    if (rel.id === 'mother') {
      rows.push({ suffix: 'health', event: 'kidneys, blood sugar, or uterus', house: rel.marriageHouse })
    }
    return rows.map((row) => {
      const lord = lordOf(row.house)
      return {
        id: `${rel.id}-${row.suffix}`,
        event: `${rel.label}: ${row.event}`,
        house: row.house,
        lordName: GRAHA_NAMES[lord],
        running: dasha.has(lord),
      }
    })
  })
  timings.push({
    id: 'second-marriage',
    event: 'Second marriage (9th house; a formal marriage)',
    house: 9,
    lordName: GRAHA_NAMES[lordOf(9)],
    running: dasha.has(lordOf(9)),
  })
  if (occupantsOf(2).some((g) => g.id === 'Ra')) {
    timings.push({
      id: 'children-foreign',
      event: 'Children: foreign or technical career (Rahu in the 2nd)',
      house: 2,
      lordName: 'Rahu',
      running: dasha.has('Ra'),
    })
  }

  const sun = grahas.find((g) => g.id === 'Su')
  const afflicted = (id: ClassicalGrahaId) => {
    const placed = grahas.find((g) => g.id === id)
    if (!placed) return false
    return nadiAfflictedBy(id, occupantsOf(houseOf(placed.rashi)).map((g) => g.id)).length > 0
  }

  const yogas = [
    ...findKhaarabYogas({ chart: 'D1', ascRashi: asc, grahas, dashaLords: input.dashaLords }),
    ...(input.navamshaChart
      ? findKhaarabYogas({
        chart: 'D9',
        ascRashi: input.navamshaChart.ascRashi,
        grahas: input.navamshaChart.grahas,
        dashaLords: input.dashaLords,
      })
      : []),
  ]
  if (yogas.filter((yoga) => yoga.id.endsWith('-su-ra')).length >= 2) {
    for (const yoga of yogas) {
      if (yoga.id.endsWith('-su-ra')) {
        yoga.effect += ' It is present in both the birth chart and Navamsha, so the downfall is read as severe.'
      }
    }
  }

  const marriageYogas = [
    ...findMarriageYogas({ chart: 'D1', ascRashi: asc, grahas }),
    ...(input.navamshaChart
      ? findMarriageYogas({ chart: 'D9', ascRashi: input.navamshaChart.ascRashi, grahas: input.navamshaChart.grahas })
      : []),
  ]
  const bcp = readBcp({
    ascRashi: asc,
    grahas,
    parivartana,
    birthDate: input.birthDate,
    asOf: input.asOf,
  })
  const bhrigu = bhriguBhavaNotes({ ascRashi: asc, grahas, parivartana })
  const lectures = readChartLectures({
    ascRashi: asc,
    grahas,
    sav: input.sav,
    upapada: input.upapada,
    runningYear: bcp?.runningYear,
  })

  return {
    pillars: NADI_PILLARS,
    maleficRule: NADI_MALEFIC_LIVING_RULE,
    houses,
    placementNote: NADI_PLACEMENT_NOTE,
    placements,
    links,
    parivartana,
    relatives,
    rotationNote: NADI_ROTATION_NOTE,
    timings,
    deathIndicators: deathIndicators(
      relatives,
      (house) => GRAHA_NAMES[lordOf(house)],
      (house) => navamshaLabel(input.navamsha?.[lordOf(house)]),
    ),
    healthFlags: healthFlags(occupantsOf),
    wealthNotes: parivartanaWealth(parivartana),
    uniformNotes: uniformNotes(lordOf(10), occupantsOf(10).map((g) => g.id)),
    colorNotes: colorNotes(grahas),
    remedyNotes: remedyNotes(afflicted, grahas),
    gemNote: NADI_GEM_NOTE,
    gemReference: gemReference(),
    gemNotes: gemstoneNotes({ ascRashi: asc, grahas, dashaLords: input.dashaLords }),
    decisionNotes: decisionNotes(input.dashaLords ?? [], parivartana, lordOf),
    degreeNote: NADI_DEGREE_NOTE,
    degreeNotes: degreeTimingNotes({ ascRashi: asc, grahas, birthDate: input.birthDate }),
    navamshaNote: NADI_NAVAMSHA_NOTE,
    navamshaNotes: navamshaPredictionNotes({
      ascRashi: asc,
      grahas,
      navamshaLagna: input.navamshaChart?.ascRashi,
      navamshaGrahas: input.navamshaChart?.grahas,
      dashaLords: input.dashaLords,
    }),
    dusthanaNote: NADI_DUSTHANA_NOTE,
    dusthanaNotes: dusthanaReversalNotes({ ascRashi: asc, grahas, parivartana }),
    dashamshaNote: NADI_DASHAMSHA_NOTE,
    dashamshaNotes: dashamshaCareerNotes({
      dashamsha: input.dashamshaChart,
      dashaLords: input.dashaLords,
    }),
    neighborhoodNote: NADI_NEIGHBORHOOD_NOTE,
    neighborhoodNotes: neighborhoodNotes({ ascRashi: asc, grahas, parivartana }),
    propertyNote: NADI_PROPERTY_NOTE,
    propertyNotes: propertyNotes({
      chaturthamsha: input.chaturthamsha,
      dashaLords: input.dashaLords,
    }),
    vehicleNote: NADI_VEHICLE_NOTE,
    vehicleNotes: vehicleNotes({
      shodashamsha: input.shodashamsha,
      dashaLords: input.dashaLords,
    }),
    shashtiamsaNote: NADI_SHASHTIAMSA_NOTE,
    shashtiamsaNotes: shashtiamsaNotes({ shashtiamsa: input.shashtiamsa }),
    bhriguHouse: bhrigu.house,
    bhriguNote: NADI_BHRIGU_NOTE,
    bhriguNotes: bhrigu.notes,
    life: readNadiLife({ ascRashi: asc, grahas }),
    marriageRuleNote: NADI_MARRIAGE_RULE_NOTE,
    marriageRuleNotes: lectures.marriage,
    afflictedNotes: lectures.afflicted,
    yearNotes: lectures.years,
    dhanNotes: lectures.wealth,
    nodeNote: nadiNodeNote(input.nodeMode),
    sunNote: sun && STRONG_DIGNITY.has(sun.dignity ?? '')
      ? 'A strong Sun: the father has an established living, and the native may leave a course or a job because that setup is already there.'
      : null,
    saturnRetroNote,
    retrogradeNotes: retrograde.others,
    pitruNote: ancestralNote(grahas),
    marsSouthNote: input.dashaLords?.includes('Ma')
      ? 'Mars is running: travel toward the south, or a temple in the south, is checked.'
      : null,
    jupiterGroups: jupiterTransitGroups(grahas),
    saturnTransit: NADI_SATURN_TRANSIT,
    saturnGroups: saturnTransitGroups(grahas),
    nodeTransit: NADI_NODE_TRANSIT,
    slowTransitNote: NADI_SLOW_TRANSIT_NOTE,
    slowTransitNotes: slowTransitNotes({
      ascRashi: asc,
      grahas,
      arudhaLagna: input.arudhaLagna,
      gender: input.gender,
    }),
    foreignSettlement: travel && ninthJoins,
    jupiterTransit: NADI_JUPITER_TRANSIT,
    khaarabTheme: NADI_KHAARAB_THEME,
    yogas,
    marriageYogas,
    marriageNote: marriageNote(marriageYogas),
    career: findNadiCareer({
      ascRashi: asc,
      grahas,
      parivartana,
      navamsha: input.navamsha,
      ninthArudhaInLagna: input.ninthArudhaInLagna,
      dashaLords: input.dashaLords,
    }),
    careerContext: NADI_CAREER_CONTEXT,
    bcp,
    snapshots: findNadiSnapshots({
      ascRashi: asc,
      grahas,
      parivartana,
      dashaLords: input.dashaLords,
    }),
    wealthWindows: findWealthWindows({
      ascRashi: asc,
      grahas,
      parivartana,
      dashaLords: input.dashaLords,
    }),
    wealthTimingNote: NADI_WEALTH_TIMING_NOTE,
    wealthTiming: wealthTimingNotes({
      ascRashi: asc,
      grahas,
      navamsha: input.navamsha,
      sav: input.sav,
      ninthArudha: input.ninthArudha,
      runningHouse: bcp?.house,
      arudhaLagna: input.arudhaLagna,
      dashaLords: input.dashaLords,
      parivartana,
      bhriguBindu: input.bhriguBindu,
      moonNakshatra: input.moonNakshatra,
      nakshatras: input.nakshatras,
    }),
    hardTransitNotes: hardTransitNotes({
      ascRashi: asc,
      grahas,
      navamsha: input.navamsha,
      navamshaLagna: input.navamshaChart?.ascRashi,
    }),
    specialNote: NADI_SPECIAL_NOTE,
    specialNotes: specialDegreeNotes({
      ascRashi: asc,
      ascDegree: input.ascDegree,
      grahas,
      navamsha: input.navamsha,
      navamshaLagna: input.navamshaChart?.ascRashi,
      dashaLords: input.dashaLords,
      parivartana,
    }),
    future: readNadiFuture({
      ascRashi: asc,
      grahas,
      parivartana,
      birthDate: input.birthDate,
      asOf: input.asOf,
      runningYear: bcp?.runningYear ?? null,
      yearNotes: lectures.years,
      degreeNotes: degreeTimingNotes({ ascRashi: asc, grahas, birthDate: input.birthDate }),
      afflictedNotes: lectures.afflicted,
      wealthTiming: wealthTimingNotes({
        ascRashi: asc,
        grahas,
        navamsha: input.navamsha,
        sav: input.sav,
        ninthArudha: input.ninthArudha,
        runningHouse: bcp?.house,
        arudhaLagna: input.arudhaLagna,
        dashaLords: input.dashaLords,
        parivartana,
        bhriguBindu: input.bhriguBindu,
        moonNakshatra: input.moonNakshatra,
        nakshatras: input.nakshatras,
      }),
      sav: input.sav,
      ninthArudha: input.ninthArudha,
      navamsha: input.navamsha,
      navamshaChart: input.navamshaChart,
      dashamshaChart: input.dashamshaChart,
      chaturthamsha: input.chaturthamsha,
      shodashamsha: input.shodashamsha,
      moonNakshatra: input.moonNakshatra,
      nakshatras: input.nakshatras,
      dashaNodes: input.dashaNodes,
      khaarabPlanets: [...new Set(yogas.flatMap((yoga) => yoga.planets))],
    }),
  }
}

function decisionNotes(
  dashaLords: readonly ClassicalGrahaId[],
  parivartana: readonly { a: HouseNumber; b: HouseNumber }[],
  lordOf: (house: HouseNumber) => ClassicalGrahaId,
): string[] {
  const lines: string[] = []
  const sixth = lordOf(6)
  if ((dashaLords.includes('Ra') && dashaLords.includes('Sa')) || dashaLords.includes(sixth)) {
    lines.push('This period is read as a poor time for a major decision, a deal, or a new project.')
  }
  const exchanging = new Set<ClassicalGrahaId>()
  for (const pair of parivartana) {
    exchanging.add(lordOf(pair.a))
    exchanging.add(lordOf(pair.b))
  }
  if (dashaLords.some((lord) => exchanging.has(lord))) {
    lines.push('A planet of the exchange is running. A decision made in this period is read as supported.')
  }
  return lines
}

function readHouse(
  house: HouseNumber,
  asc: Rashi,
  occupants: NadiGrahaPlacement[],
  lordHouse: HouseNumber | null,
  predictionOf: ReadonlyMap<ClassicalGrahaId, string>,
  prediction: string,
): NadiHouseReading {
  const sign = rashiForHouseFromLagna(asc, house)
  const profile = NADI_HOUSES[house]
  const theme = getHouseTheme(house)
  const lord = RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
  const ids = occupants.map((g) => g.id)
  const papaPresent = ids.some((id) => (NADI_PAPA_GRAHAS as readonly string[]).includes(id))
  const natural = NADI_HOUSES[sign as HouseNumber]

  const activeRules = [...profile.rules]
  if (papaPresent) activeRules.unshift(NADI_MALEFIC_LIVING_RULE)
  if (house === 1 && !papaPresent && occupants.some((g) => NADI_GRAHAS[g.id].nature === 'benefic')) {
    activeRules.unshift('Benefics in the lagna support health, fame, and the body.')
  }
  if (house === 5) activeRules.push(...educationNotes(ids))
  if (house === 2 || house === 7) {
    for (const id of ids) {
      activeRules.push(`${GRAHA_NAMES[id]} in the ${house === 2 ? '2nd' : '7th'}: income through ${NADI_CAREER_WORK[id]}.`)
    }
  }
  if (house === 4 && ids.includes('Su')) {
    activeRules.push('Sun in the 4th: government quarters, or a government link for the father or the spouse.')
  }

  return {
    house,
    name: profile.name,
    sign,
    signName: RASHI_NAMES[sign],
    signNature: getRashiCoreSummary(sign),
    signInHouse: getRashiInHouse(sign, house),
    naturalHouse: sign as HouseNumber,
    naturalHouseLabel: natural.name,
    lord,
    lordName: GRAHA_NAMES[lord],
    lordHouse,
    profile,
    classicalThemes: theme?.coreThemes ?? [],
    naturalKarakas: getNaturalKarakasForHouse(house),
    occupants: occupants.map((g) => occupantReading(g, house, ids, predictionOf.get(g.id) ?? '')),
    papaPresent,
    activeRules,
    roles: rolesOfHouse(house),
    prediction,
  }
}

function occupantReading(
  g: NadiGrahaPlacement,
  house: HouseNumber,
  ids: ClassicalGrahaId[],
  prediction: string,
): NadiOccupantReading {
  const graha: NadiGrahaProfile = NADI_GRAHAS[g.id]
  return {
    id: g.id,
    name: GRAHA_NAMES[g.id],
    retro: !!g.isRetro,
    dignity: g.dignity ?? null,
    nadiNote: NADI_HOUSES[house].occupants[g.id] ?? null,
    signNote: getPlanetInSign(g.id, g.rashi, 'summary'),
    classicalHouseNote: getPlanetInHouse(g.id, house, 'summary'),
    professions: graha.professions.slice(0, 3),
    bodyParts: graha.bodyParts,
    afflictedBy: nadiAfflictedBy(g.id, ids),
    prediction,
  }
}

function colorNotes(grahas: NadiGrahaPlacement[]): string[] {
  const lines: string[] = []
  for (const g of grahas) {
    if (g.dignity !== 'debilitated') continue
    const profile = NADI_GRAHAS[g.id]
    lines.push(`${GRAHA_NAMES[g.id]} is weak: donate its items, and do not make ${profile.color.toLowerCase()} the main colour.`)
  }
  for (const g of grahas) {
    if (!STRONG_DIGNITY.has(g.dignity ?? '')) continue
    const profile = NADI_GRAHAS[g.id]
    lines.push(`${GRAHA_NAMES[g.id]} is strong: keep ${profile.color.toLowerCase()} close.`)
  }
  return lines.slice(0, 4)
}

function remedyNotes(
  afflicted: (id: ClassicalGrahaId) => boolean,
  grahas: NadiGrahaPlacement[],
): string[] {
  const notes: string[] = []
  if (afflicted('Ma') && afflicted('Ve')) {
    notes.push('Mars and Venus are both afflicted: this method asks for a visit to a dialysis centre, sponsoring treatment for someone who cannot pay.')
  }
  const mars = grahas.find((g) => g.id === 'Ma')
  if (mars && STRONG_DIGNITY.has(mars.dignity ?? '')) {
    notes.push('Mars is strong: physical training and meditation are the named outlets.')
  }
  return notes
}

function ancestralNote(grahas: NadiGrahaPlacement[]): string | null {
  const saturn = grahas.find((g) => g.id === 'Sa')
  if (!saturn) return null
  const strong = saturn.rashi === 7 || saturn.rashi === 10 || saturn.rashi === 11
  const co = grahas.filter((g) => g.rashi === saturn.rashi).map((g) => g.id)
  const afflicted = saturn.rashi === 1 || nadiAfflictedBy('Sa', co).length > 0
  if (strong && afflicted) {
    return 'Saturn is strong by sign and afflicted. Inherited comfort and an ancestral strain are both checked.'
  }
  if (strong) return 'Saturn is strong. Ancestral work is read as already done, so early comfort is the form checked.'
  if (afflicted) return 'Saturn is weak. Ancestral debt, or a family effort that was left unfinished, is the form checked.'
  return 'Saturn is the ancestors. The sign is ordinary, so the family background is read as neither inherited comfort nor inherited debt.'
}

function linkFires(
  link: NadiLordLink,
  lordHouseOf: (house: HouseNumber) => HouseNumber | null,
  occupantsOf: (house: HouseNumber) => NadiGrahaPlacement[],
): boolean {
  if (link.kind === 'malefics-in') {
    return occupantsOf(link.a).some((g) => (NADI_PAPA_GRAHAS as readonly string[]).includes(g.id))
  }
  const aInB = lordHouseOf(link.a) === link.b
  if (link.kind === 'one-way') return aInB
  return aInB || lordHouseOf(link.b) === link.a
}

function lordsConnected(
  a: HouseNumber,
  b: HouseNumber,
  lordHouseOf: (house: HouseNumber) => HouseNumber | null,
): boolean {
  const ha = lordHouseOf(a)
  const hb = lordHouseOf(b)
  if (ha == null || hb == null) return false
  return ha === b || hb === a || ha === hb
}

export function rolesOfHouse(house: HouseNumber): string[] {
  const roles: string[] = []
  if (house === 10) roles.push('Native’s career', 'Mother-in-law')
  if (house === 7) roles.push('Native’s marriage')
  if (house === 9) roles.push('Second marriage', 'Spouse’s younger siblings')
  if (house === 12) roles.push('Paternal uncle / aunt')
  for (const rel of NADI_RELATIVES) {
    if (houseCountedFrom(rel.house, 10) === house) roles.push(`${rel.label}’s career`)
    if (houseCountedFrom(rel.house, 7) === house) roles.push(`${rel.label}’s marriage`)
    if (house === rel.house) roles.push(rel.label)
  }
  return [...new Set(roles)]
}
