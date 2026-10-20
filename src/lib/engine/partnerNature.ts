// src/lib/engine/partnerNature.ts
// The 7th describes how this person behaves in marriage and the partner
// the chart draws. Moon, Venus, Jupiter, Saturn, Rahu, Ketu, and Mars are
// read only when they actually touch that marriage. One chart is enough.
// The second chart confirms whose behavior is being described.
// Pure engine — no React/DB.

import type { ChartOutput, Dignity, Gender, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import type { LifeTone, MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'

export type PartnerPlanet = 'Mo' | 'Ve' | 'Ju' | 'Sa' | 'Ra' | 'Ke' | 'Ma'

export interface PartnerNatureFlags {
  incomplete: boolean
  cold: boolean
  contacts: PartnerPlanet[]
}

export interface PartnerNatureReading {
  headline: string
  summary: string
  principles: string
  portrait: MarriedLifeNote[]
  planets: MarriedLifeNote[]
  flags: PartnerNatureFlags
}

const PLANETS: PartnerPlanet[] = ['Mo', 'Ve', 'Ju', 'Sa', 'Ra', 'Ke', 'Ma']

const LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const DIGNIFIED: Dignity[] = ['exalted', 'moolatrikona', 'own']
const CAPABLE: Dignity[] = [...DIGNIFIED, 'friend', 'great_friend']
const DUSTHANA = new Set([6, 8, 12])

const WORK: Record<PartnerPlanet, { title: string; work: string }> = {
  Mo: {
    title: 'Moon — the feeling',
    work: 'The Moon is the emotional state of the marriage: what feels safe, and whether a feeling is actually received.',
  },
  Ve: {
    title: 'Venus — the love',
    work: 'Venus is love, affection, romance, and the attraction that starts the bond.',
  },
  Ju: {
    title: 'Jupiter — the protection',
    work: 'Jupiter is wisdom, protection, and the dharma the marriage is willing to live.',
  },
  Sa: {
    title: 'Saturn — the duty',
    work: 'Saturn is duty, patience, and delay. Responsibility can be present while the feeling stays slow.',
  },
  Ra: {
    title: 'Rahu — the hunger',
    work: 'Rahu is unconventional desire, obsession, and the illusion around the partner.',
  },
  Ke: {
    title: 'Ketu — the distance',
    work: 'Ketu is detachment and a past-life pattern. Closeness can exist and still feel out of reach.',
  },
  Ma: {
    title: 'Mars — the heat',
    work: 'Mars is passion, courage, and the physical bond, including how conflict is met.',
  },
}

export const PARTNER_NATURE_PRINCIPLES =
  'The 7th house is read from one chart. It shows how this person behaves inside a marriage and the partner that behavior draws. An emotionally thin partner can be seen here before the other chart is opened. The second chart confirms whose behavior is the one to work with. Incompleteness of love is also read from one chart: when the Moon and Venus are both weak, the partner who would complete the feeling is not the partner this 7th draws. Moon, Venus, Jupiter, Saturn, Rahu, Ketu, and Mars are the planets that have to be asked about the marriage, beyond the 7th and its lord, and only when they actually touch it.'

function houseOf(rashi: number, asc: number): number {
  return ((rashi - asc + 12) % 12) + 1
}

function signOf(asc: number, house: number): Rashi {
  return ((((asc - 1 + house - 1) % 12) + 1) as Rashi)
}

function gn(id: GrahaId | string): string {
  return GRAHA_NAMES[id as GrahaId] ?? id
}

function find(list: GrahaData[], id: GrahaId): GrahaData | undefined {
  return list.find(g => g.id === id)
}

function note(id: string, title: string, detail: string, tone: LifeTone): MarriedLifeNote {
  return { id, title, detail, tone }
}

function spouse(gender: Gender | undefined): string {
  if (gender === 'female') return 'husband'
  if (gender === 'male') return 'wife'
  return 'partner'
}

function dignified(d: Dignity | undefined): boolean {
  return !!d && DIGNIFIED.includes(d)
}

function capable(d: Dignity | undefined): boolean {
  return !!d && CAPABLE.includes(d)
}

function isMalefic(id: GrahaId): boolean {
  return id === 'Su' || id === 'Ma' || id === 'Sa' || id === 'Ra' || id === 'Ke'
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

function weak(g: GrahaData | undefined, asc: number, grahas: GrahaData[]): boolean {
  if (!g) return true
  const house = houseOf(g.rashi, asc)
  const withNode = grahas.some(x => (x.id === 'Ra' || x.id === 'Ke') && x.id !== g.id && x.rashi === g.rashi)
  const maleficAspect = grahas.some(x => isMalefic(x.id) && x.id !== g.id && aspects(x, g.rashi))
  const fallen = g.dignity === 'debilitated' || g.dignity === 'enemy' || g.dignity === 'great_enemy' || !!g.isCombust
  if (fallen) return true
  if (DUSTHANA.has(house) && !dignified(g.dignity)) return true
  if (withNode && !dignified(g.dignity)) return true
  if (!dignified(g.dignity) && maleficAspect) return true
  if (dignified(g.dignity) && !g.isCombust && !withNode) return false
  if (capable(g.dignity) && !g.isCombust && !DUSTHANA.has(house) && !withNode && !maleficAspect) return false
  return false
}

export function analyzePartnerNature(chart: ChartOutput | null | undefined): PartnerNatureReading | null {
  const asc = chart?.lagnas?.ascRashi
  if (!chart || !asc) return null

  const grahas = chart.grahas ?? []
  const seventh = signOf(asc, 7)
  const lord = find(grahas, LORDS[seventh])
  const who = spouse(chart.meta?.gender)
  const moon = find(grahas, 'Mo')
  const venus = find(grahas, 'Ve')
  const incomplete = weak(moon, asc, grahas) && weak(venus, asc, grahas)

  const contacts: PartnerPlanet[] = []
  const planets: MarriedLifeNote[] = []
  let cold = false

  for (const id of PLANETS) {
    const g = find(grahas, id)
    if (!g) continue
    const occupies = g.rashi === seventh
    const isLord = lord?.id === id
    const joined = !!lord && lord.id !== id && lord.rashi === g.rashi
    const sees = aspects(g, seventh)
    if (!occupies && !isLord && !joined && !sees) continue
    contacts.push(id)
    if ((id === 'Sa' || id === 'Ke') && (occupies || joined)) cold = true
    const how = [
      occupies ? 'occupies the 7th' : '',
      isLord ? 'is the 7th lord' : '',
      joined ? `sits with the 7th lord, ${gn(lord!.id)}` : '',
      sees ? 'aspects the 7th' : '',
    ].filter(Boolean).join(', and ')
    const thin = (id === 'Sa' || id === 'Ke') && (occupies || joined)
      ? ` The ${who} this chart draws can be present and still emotionally unavailable. That reading is already here.`
      : ''
    planets.push(note(
      `partner-${id.toLowerCase()}`,
      WORK[id].title,
      `${gn(id)} ${how}. ${WORK[id].work}${thin}`,
      thin ? 'caution' : 'mixed',
    ))
  }

  const occupants = grahas.filter(g => g.rashi === seventh && g.id !== lord?.id)
  const sitting = occupants.length
    ? `${occupants.map(g => gn(g.id)).join(' and ')} ${occupants.length === 1 ? 'sits' : 'sit'} in the 7th.`
    : 'The 7th is empty of planets.'
  const lordLine = lord
    ? `The 7th lord, ${gn(lord.id)}, is in ${RASHI_NAMES[lord.rashi]}, house ${houseOf(lord.rashi, asc)}${lord.dignity ? `, ${lord.dignity}` : ''}${lord.isCombust ? ', combust' : ''}.`
    : 'The 7th lord is not on this chart.'

  const portrait: MarriedLifeNote[] = [note(
    'partner-seventh',
    'The 7th is the native and the partner',
    `The 7th is ${RASHI_NAMES[seventh]}. ${sitting} ${lordLine} This house is how this person behaves inside a marriage, and it is the ${who} the chart draws. The other chart confirms whose behavior is the one to work with.`,
    'mixed',
  )]

  if (incomplete) {
    portrait.push(note(
      'partner-incomplete',
      'The love stays incomplete',
      `The Moon and Venus are both weak. Incompleteness of love is visible from this chart alone. The ${who} who would give a complete love is not the ${who} this 7th draws. The feeling stays empty. What is expressed is not met. What was expected to be understood in a particular way is not understood.`,
      'caution',
    ))
  }

  const headline = incomplete
    ? 'This chart already shows a love that stays incomplete'
    : cold
      ? `The 7th draws a ${who} who can be present and still hard to feel`
      : `The 7th draws the ${who} from this chart alone`

  const summary = contacts.length
    ? `${PLANETS.filter(id => contacts.includes(id)).map(gn).join(', ')} touch the marriage.`
    : 'None of Moon, Venus, Jupiter, Saturn, Rahu, Ketu, or Mars touches the 7th. The house itself still describes the partner.'

  return {
    headline,
    summary,
    principles: PARTNER_NATURE_PRINCIPLES,
    portrait,
    planets,
    flags: { incomplete, cold, contacts },
  }
}

export function comparePartnerNature(
  a: PartnerNatureReading,
  b: PartnerNatureReading,
  nameA: string,
  nameB: string,
): MarriedLifeNote[] {
  const notes: MarriedLifeNote[] = []
  if (a.flags.incomplete && b.flags.incomplete) {
    notes.push(note(
      'partner-pair-both',
      'Both charts carry an incomplete love',
      `${nameA} and ${nameB} each show a Moon and a Venus too weak to draw a completing love. The gap is in both people. Cross-reading still asks whose behavior is being lived in a given season.`,
      'caution',
    ))
  } else if (a.flags.incomplete || b.flags.incomplete) {
    const who = a.flags.incomplete ? nameA : nameB
    const other = a.flags.incomplete ? nameB : nameA
    notes.push(note(
      'partner-pair-one',
      `${who}’s chart already shows the incomplete love`,
      `The pattern is in ${who}’s 7th. ${other}’s chart is the confirmation: it shows whether the behavior being lived belongs there. The discovery did not require the second chart.`,
      'caution',
    ))
  }
  if (a.flags.cold !== b.flags.cold) {
    const who = a.flags.cold ? nameA : nameB
    const other = a.flags.cold ? nameB : nameA
    notes.push(note(
      'partner-pair-cold',
      `${who}’s 7th describes the thinner feeling`,
      `${who} has Saturn or Ketu on the marriage, so the emotionally unavailable partner is already described there. ${other}’s chart is where that behavior is confirmed or found to belong to the other person.`,
      'mixed',
    ))
  }
  return notes
}
