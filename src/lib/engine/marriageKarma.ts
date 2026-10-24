// src/lib/engine/marriageKarma.ts
// Marriage debt (rina) versus one karmic mark versus an open chart.
// A debt is not read as a death, and a running 6th lord is not a divorce verdict.
// Pure engine — no React/DB.

import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import type { LifeTone, MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'

export interface MarriageKarmaFlags {
  kind: 'rina' | 'karma' | 'open'
  jupiterMeans: boolean
  venusExalted: boolean
  lagna: Rashi
  lagnaLord: GrahaId
  lagnaLordSign: Rashi
}

export interface MarriageKarmaReading {
  name: string
  debt: MarriedLifeNote[]
  venus: MarriedLifeNote[]
  period: MarriedLifeNote[]
  flags: MarriageKarmaFlags
}

const LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const STRONG: Dignity[] = ['exalted', 'moolatrikona', 'own']

function houseOf(rashi: number, asc: number): number {
  return ((rashi - asc + 12) % 12) + 1
}

function signOf(asc: number, house: number): Rashi {
  return ((((asc - 1 + house - 1) % 12) + 1) as Rashi)
}

function find(list: GrahaData[] | undefined, id: GrahaId): GrahaData | undefined {
  return list?.find(g => g.id === id)
}

function strong(d: Dignity | undefined): boolean {
  return !!d && STRONG.includes(d)
}

function note(id: string, title: string, detail: string, tone: LifeTone): MarriedLifeNote {
  return { id, title, detail, tone }
}

function gn(id: GrahaId): string {
  return GRAHA_NAMES[id] ?? id
}

export function analyzeMarriageKarma(chart: ChartOutput): MarriageKarmaReading | null {
  const asc = chart.lagnas?.ascRashi
  if (!asc) return null

  const grahas = chart.grahas ?? []
  const d9 = chart.vargas?.D9
  const d9Asc = chart.vargaLagnas?.D9
  const venus = find(grahas, 'Ve')
  const rahu = find(grahas, 'Ra')
  const saturn = find(grahas, 'Sa')
  const jupiter = find(grahas, 'Ju')
  const mars = find(grahas, 'Ma')
  const sun = find(grahas, 'Su')
  const lordId = LORDS[asc]
  const lord = find(grahas, lordId)
  const seventh = signOf(asc, 7)
  const seventhLordId = LORDS[seventh]
  const seventhLord = find(grahas, seventhLordId)
  const sixthLord = LORDS[signOf(asc, 6)]
  const md = chart.dashas?.vimshottari?.[0]?.lord as GrahaId | undefined

  const venusRahuOnSeventh = !!venus && !!rahu && venus.rashi === seventh && rahu.rashi === seventh
  const rahuOnSeventh = !!rahu && rahu.rashi === seventh
  const venusWithSaturn = !!venus && !!saturn && venus.rashi === saturn.rashi
  const d9KetuOnSeventh = !!d9Asc && !!find(d9, 'Ke') && houseOf(find(d9, 'Ke')!.rashi, d9Asc) === 7
  const rina = venusRahuOnSeventh || (rahuOnSeventh && venusWithSaturn)
  const kind: MarriageKarmaFlags['kind'] = rina ? 'rina' : d9KetuOnSeventh ? 'karma' : 'open'
  const jupiterMeans = !!venus && venus.dignity === 'exalted' && strong(jupiter?.dignity)
  const venusExalted = venus?.dignity === 'exalted'
  const fifthSees = !!sun && houseOf(sun.rashi, asc) === 5 && strong(sun.dignity)
  const ninthSees = !!jupiter && houseOf(jupiter.rashi, asc) === 9 && strong(jupiter.dignity)
  const completion = !!saturn && houseOf(saturn.rashi, asc) === 2 && !!mars && houseOf(mars.rashi, asc) === 8 && fifthSees && ninthSees

  const debt: MarriedLifeNote[] = []
  const venusNotes: MarriedLifeNote[] = []
  const period: MarriedLifeNote[] = []

  if (rina) {
    debt.push(note(
      'karma-rina',
      'This marriage carries a debt',
      'Venus and a difficult planet sit on the partnership. The account is paid by staying, by separating the work, or by both. This does not indicate a death. A busy 8th house is not a sign of one either.',
      'caution',
    ))
  } else if (kind === 'karma') {
    debt.push(note(
      'karma-only',
      'One karmic mark, not the whole debt',
      'Ketu in the Navamsha 7th is one mark on the partnership. It does not, by itself, turn the birth chart into a karmic-debt stack.',
      'mixed',
    ))
  } else {
    debt.push(note(
      'karma-open',
      'No marriage debt is stacked here',
      'The 7th is not carrying Venus with Rahu, and the Navamsha 7th is not marked by Ketu alone as a debt. The chart stays open.',
      'supportive',
    ))
  }

  if (seventhLord && houseOf(seventhLord.rashi, asc) === 2) {
    debt.push(note(
      'karma-seventh-in-second',
      'The 7th lord sits in the 2nd',
      `${gn(seventhLordId)} rules marriage and sits in the household. The partnership is worked through family, speech, and shared money.`,
      'mixed',
    ))
  }

  if (jupiterMeans) {
    venusNotes.push(note(
      'karma-jupiter-means',
      'Jupiter gives the exalted Venus a meaning',
      'Venus is exalted, and Jupiter is strong enough to give that Venus a meaning. This is still a compromised marriage if the rest of the stack is heavy. Exaltation is not a promise of a perfect spouse.',
      'mixed',
    ))
  } else if (venus && (venus.dignity === 'debilitated' || venus.dignity === 'enemy' || venus.dignity === 'great_enemy')) {
    venusNotes.push(note(
      'karma-venus-weak',
      'A weak Venus is not the verdict',
      'Venus is weak in this chart. That does not, by itself, condemn the marriage. Jupiter, the 7th lord, and the Navamsha still have to be read.',
      'mixed',
    ))
  }

  if (completion) {
    debt.push(note(
      'karma-completion',
      'Saturn on the household can complete',
      'Saturn sits with the household, Mars holds the 8th, and the 5th and the 9th can see the work. That is completion: a realization. The 8th is the account being closed, not a death.',
      'mixed',
    ))
  }

  if (rina && md && md === sixthLord) {
    period.push(note(
      'karma-separation-clock',
      `${gn(md)} is the separator in this period`,
      `${gn(md)} rules the 6th and is running. In a debt chart that period carries conflict: duty, argument, and a separate judgment about whether the two keep sharing the work. The period does not close the marriage by itself.`,
      'caution',
    ))
  }

  return {
    name: chart.meta?.name ?? 'This chart',
    debt,
    venus: venusNotes,
    period,
    flags: {
      kind,
      jupiterMeans,
      venusExalted: !!venusExalted,
      lagna: asc,
      lagnaLord: lordId,
      lagnaLordSign: lord?.rashi ?? asc,
    },
  }
}

export function compareMarriageKarma(
  a: MarriageKarmaReading,
  b: MarriageKarmaReading,
  nameA: string,
  nameB: string,
): MarriedLifeNote[] {
  const notes: MarriedLifeNote[] = []
  const debt = a.flags.kind === 'rina' ? a : b.flags.kind === 'rina' ? b : null
  const open = a.flags.kind === 'open' ? a : b.flags.kind === 'open' ? b : null
  if (debt && open && debt !== open) {
    const debtName = debt === a ? nameA : nameB
    const openName = open === a ? nameA : nameB
    notes.push(note(
      'karma-pair-one',
      'The debt sits in one chart',
      `${debtName} carries the marriage debt. ${openName} does not. The account is not shared evenly, so the open chart is asked to meet a stack it did not bring.`,
      'caution',
    ))
  }
  const lordInOtherLagna = a.flags.lagnaLordSign === b.flags.lagna || b.flags.lagnaLordSign === a.flags.lagna
  if (lordInOtherLagna) {
    notes.push(note(
      'karma-pair-lagna',
      'A lagna lord sits in the other lagna',
      `${nameA}’s rising-sign lord and ${nameB}’s lagna meet. One person’s identity is standing in the other’s rising sign, so the debt and the self are not read in isolation.`,
      'mixed',
    ))
  }
  return notes
}
