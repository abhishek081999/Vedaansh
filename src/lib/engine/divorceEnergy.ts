// src/lib/engine/divorceEnergy.ts
// A marriage is held by three energies: Moon (feeling), Venus (attraction),
// Saturn (duty). Two down is a separation. All three down is a divorce.
// Sun, Mercury, Mars, and Rahu can speed that. They do not start it.
// Mars with Rahu on the 7th is struggle, not a divorce yoga.
// Rahu aspects only the 7th. No divorce date is computed.
// Pure engine — no React/DB.

import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_LORDS, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import type { LifeTone, MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'

export type SplitLevel = 'held' | 'strain' | 'separation' | 'divorce'

export interface DivorceEnergyFlags {
  level: SplitLevel
  moon: boolean
  venus: boolean
  saturn: boolean
  thread: 'Mo' | 'Ve' | 'Sa' | null
}

export interface DivorceEnergyReading {
  headline: string
  summary: string
  principles: string
  energies: MarriedLifeNote[]
  triggers: MarriedLifeNote[]
  flags: DivorceEnergyFlags
}

const LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const DIGNIFIED: Dignity[] = ['exalted', 'moolatrikona', 'own']
const CAPABLE: Dignity[] = [...DIGNIFIED, 'friend', 'great_friend']
const DUSTHANA = new Set([6, 8, 12])
const TRIGGERS: GrahaId[] = ['Su', 'Me', 'Ma', 'Ra']

export const DIVORCE_ENERGY_PRINCIPLES =
  'The first question is whether the marriage can still improve, and which energy is unbalanced. Feeling is the Moon. Attraction is Venus. Duty is Saturn. The class reads a separation when two of those are down, and a divorce when all three are down. The Sun, Mercury, Mars, and Rahu can speed a break that has already started. They do not begin it, and Mars with Rahu on the 7th is struggle rather than a divorce yoga. Rahu aspects only the 7th. The planets that bring a marriage are the ones that return when it separates. A reality check belongs to the first few years, and the strain often becomes visible around seven or eight years. This chart is not given a divorce date.'

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
  return false
}

function firm(g: GrahaData | undefined, asc: number, grahas: GrahaData[]): boolean {
  if (!g || g.isCombust) return false
  const withNode = grahas.some(x => (x.id === 'Ra' || x.id === 'Ke') && x.id !== g.id && x.rashi === g.rashi)
  if (withNode || DUSTHANA.has(houseOf(g.rashi, asc))) return false
  return dignified(g.dignity) || capable(g.dignity)
}

function onMarriage(g: GrahaData | undefined, seventh: number, lord: GrahaData | undefined): boolean {
  if (!g) return false
  if (g.rashi === seventh) return true
  if (lord && g.id !== lord.id && g.rashi === lord.rashi) return true
  return aspects(g, seventh)
}

function levelOf(down: number): SplitLevel {
  if (down >= 3) return 'divorce'
  if (down === 2) return 'separation'
  if (down === 1) return 'strain'
  return 'held'
}

const THREAD: Record<'Mo' | 'Ve' | 'Sa', string> = {
  Mo: 'Empathy is the thread still in the chart. Some feeling for the other person remains.',
  Ve: 'Affection is the thread still in the chart. Some care remains after the feeling and the duty have thinned.',
  Sa: 'Duty is the thread still in the chart. When feeling and attraction have thinned, duty is what keeps the two in the marriage: children, parents, or the family name.',
}

export function analyzeDivorceEnergy(chart: ChartOutput | null | undefined): DivorceEnergyReading | null {
  const asc = chart?.lagnas?.ascRashi
  if (!chart || !asc) return null

  const grahas = chart.grahas ?? []
  const seventh = signOf(asc, 7)
  const lord = find(grahas, LORDS[seventh])
  const moon = find(grahas, 'Mo')
  const venus = find(grahas, 'Ve')
  const saturn = find(grahas, 'Sa')
  const ketu = find(grahas, 'Ke')
  const rahu = find(grahas, 'Ra')
  const jupiter = find(grahas, 'Ju')
  const mars = find(grahas, 'Ma')

  const moonWeak = weak(moon, asc, grahas)
  const moonOverruled = !!moon && (
    (!!saturn && (saturn.rashi === moon.rashi || aspects(saturn, moon.rashi)))
    || (!!ketu && (ketu.rashi === moon.rashi || aspects(ketu, moon.rashi)))
  )
  const moonDown = moonWeak || moonOverruled
  const venusDown = weak(venus, asc, grahas)
  const saturnDown = weak(saturn, asc, grahas)
  const down = [moonDown, venusDown, saturnDown].filter(Boolean).length
  const level = levelOf(down)
  const holding = (['Mo', 'Ve', 'Sa'] as const).filter(id => (
    id === 'Mo' ? !moonDown : id === 'Ve' ? !venusDown : !saturnDown
  ))
  const thread = level === 'separation' && holding.length === 1 ? holding[0] : null

  const energies: MarriedLifeNote[] = []
  const triggers: MarriedLifeNote[] = []

  const whyMoon = moonOverruled && !moonWeak
    ? 'Saturn or Ketu has taken the Moon over, so the feeling thins even though the Moon is not fallen on its own.'
    : moonOverruled
      ? 'The Moon is weak, and Saturn or Ketu sits on that weakness.'
      : 'The Moon is weak, so the feeling was thin from the start.'
  const parts = [
    moonDown ? whyMoon : '',
    venusDown ? 'Venus is weak, so attraction and the rasa of the bond are not carrying it.' : '',
    saturnDown ? 'Saturn is weak, so duty and patience are not holding the structure.' : '',
  ].filter(Boolean)

  if (level === 'divorce') {
    energies.push(note(
      'split-divorce',
      'All three threads are down',
      `${parts.join(' ')} Emotion, attraction, and duty have all let go. The class reads that as divorce: the physical bond, the mental bond, and the soul bond no longer have an energy under them. A remedy aimed at Mars, Rahu, the Sun, or Mercury does not restore this. Those planets only speed a break whose roots are already gone. The useful question is whether a thread was missed, not which malefic to blame.`,
      'caution',
    ))
  } else if (level === 'separation' && thread) {
    energies.push(note(
      'split-separation',
      'Two energies are down. One thread remains',
      `${parts.join(' ')} ${THREAD[thread]} The class reads a separation here, with a way back through the thread that is still alive. It does not read a completed divorce.`,
      'caution',
    ))
  } else if (level === 'strain') {
    energies.push(note(
      'split-strain',
      'One energy is under strain',
      `${parts.join(' ')} One energy down is not a separation. The other two are still available. Improvement is the reading, and the strained energy is the one to work with.`,
      'mixed',
    ))
  } else {
    energies.push(note(
      'split-held',
      'The three energies are not in a break',
      'Fewer than two of Moon, Venus, and Saturn are down. The class does not read a separation from this balance. A hard planet on the 7th is still only a hard planet.',
      'supportive',
    ))
  }

  if ((level === 'held' || level === 'strain') && mars && rahu && mars.rashi === seventh && rahu.rashi === seventh) {
    energies.push(note(
      'split-mars-rahu',
      'Mars and Rahu on the 7th are the struggle, not the divorce',
      'Mars and Rahu occupy the 7th. The usual sentence is that the marriage must break. The class has watched this combination carry a long marriage: Mars brings effort and plain speech, Rahu brings an unconventional way through the problem, and the struggle itself is how Saturn and Jupiter grow a structure. It has to be endured. It is not a divorce yoga.',
      'mixed',
    ))
  } else if ((level === 'held' || level === 'strain') && onMarriage(mars, seventh, lord)) {
    energies.push(note(
      'split-mars',
      'Mars on the marriage is conflict, not a divorce',
      'Mars touches the 7th or its lord. That is fights, heat, and the effort to stay. In a large share of charts Mars touches this house and the marriage continues. Conflict is the sentence. Divorce is not.',
      'mixed',
    ))
  }

  const d9 = chart.vargas?.D9
  const d9Asc = chart.vargaLagnas?.D9
  if (d9Asc && d9 && (level === 'held' || level === 'strain')) {
    const d9Down = (['Mo', 'Ve', 'Sa'] as const).filter(id => weak(find(d9, id), d9Asc, d9)).length
    if (d9Down >= 2) {
      energies.push(note(
        'split-d9',
        'Navamsha disturbs a birth chart that still holds',
        'D1 still has more than one of the three energies available. In Navamsha, two or more of Moon, Venus, and Saturn are weak. The class allows a separation to show in the fruit of the marriage even when the birth chart looks held. D9 does not invent a divorce the birth chart has refused. It says the soul of the bond is under strain.',
        'mixed',
      ))
    }
  }

  if (level === 'separation' && firm(jupiter, asc, grahas)) {
    energies.push(note(
      'split-direction',
      'The paths can part while respect remains',
      'Jupiter is still strong while two energies are down. The class reads some of these as a parting of direction: feeling or duty can remain, and the two lives stop sharing one aim. A friendly separation is possible. It is the less common form. Most people in this pattern do not want to keep seeing each other.',
      'mixed',
    ))
  }

  if (venus && rahu && (venus.rashi === rahu.rashi || (typeof venus.nakshatraIndex === 'number' && NAKSHATRA_LORDS[venus.nakshatraIndex] === 'Ra'))) {
    const how = venus.rashi === rahu.rashi
      ? 'Venus is with Rahu'
      : `Venus is in ${NAKSHATRA_NAMES[venus.nakshatraIndex!]}, a nakshatra of Rahu`
    energies.push(note(
      'split-venus-rahu',
      'Rahu gives the marriage another influence',
      `${how}. The class reads an option of a bond outside the marriage, or a betrayal that arrives through the partner. It is a pattern of confusion and a pull to leave. It is not a finding that an affair has already happened, and it is not assigned to one of the two by default.`,
      'caution',
    ))
  }

  if (level === 'separation' || level === 'divorce') {
    const hit = TRIGGERS.filter(id => onMarriage(find(grahas, id), seventh, lord))
    if (hit.length) {
      triggers.push(note(
        'split-triggers',
        `${hit.map(gn).join(', ')} can speed the break`,
        `${hit.map(gn).join(', ')} touch the 7th or its lord. The Sun brings ego, Mercury brings speech that cuts, Mars brings heat, and Rahu brings dissatisfaction and another influence. The class is explicit that the Sun and Mercury do not divorce a chart by themselves, and that Mars and Rahu are the face of a break whose roots are Moon, Venus, or Saturn. Remedies aimed only at this face miss the energy that actually let go.`,
        'caution',
      ))
    }
    triggers.push(note(
      'split-legal',
      'A break of this kind goes through the law',
      `The 6th is the dispute and the 9th is the legal act, whether the parting is shared or contested. The 2nd and the 8th carry the family and the transformation around it. The 6th here is ${RASHI_NAMES[signOf(asc, 6)]}. This note does not time a filing or name a winner.`,
      'mixed',
    ))

    const path = chart.dashas?.vimshottari ? getDashaPathAt(chart.dashas.vimshottari) : []
    const lords = path.slice(0, 2).map(p => p.lord as GrahaId)
    const rootRunning = lords.filter(id => (id === 'Mo' && moonDown) || (id === 'Ve' && venusDown) || (id === 'Sa' && saturnDown))
    const faceRunning = lords.filter(id => TRIGGERS.includes(id))
    if (rootRunning.length || faceRunning.length) {
      const bits = [
        rootRunning.length ? `${rootRunning.map(gn).join(' and ')} is the root energy in the period` : '',
        faceRunning.length ? `${faceRunning.map(gn).join(' and ')} is a trigger in the period` : '',
      ].filter(Boolean).join('. ')
      triggers.push(note(
        'split-period',
        'The period matches the energy, not a divorce date',
        `${bits}. The class finds that the planets around the marriage return, sometimes in another order, when the marriage separates. This period is that kind of match. It is not a filing date.`,
        'mixed',
      ))
    }
  }

  const headline = level === 'divorce'
    ? 'Emotion, attraction, and duty are all down'
    : level === 'separation'
      ? `Two energies are down. ${thread ? gn(thread) : 'One thread'} is still holding`
      : level === 'strain'
        ? 'One marriage energy is under strain'
        : 'The three marriage energies are not in a break'

  const summary = `Moon ${moonDown ? 'down' : 'available'}. Venus ${venusDown ? 'down' : 'available'}. Saturn ${saturnDown ? 'down' : 'available'}.`

  return {
    headline,
    summary,
    principles: DIVORCE_ENERGY_PRINCIPLES,
    energies,
    triggers,
    flags: { level, moon: moonDown, venus: venusDown, saturn: saturnDown, thread },
  }
}

export function compareDivorceEnergy(
  a: DivorceEnergyReading,
  b: DivorceEnergyReading,
  nameA: string,
  nameB: string,
): MarriedLifeNote[] {
  const broken = (level: SplitLevel) => level === 'separation' || level === 'divorce'
  if (a.flags.level === 'divorce' && b.flags.level === 'divorce') {
    return [note(
      'split-pair-both',
      'Both charts have all three threads down',
      `${nameA} and ${nameB} each show Moon, Venus, and Saturn unable to hold a marriage. The break is in both people.`,
      'caution',
    )]
  }
  if (broken(a.flags.level) && broken(b.flags.level)) {
    return [note(
      'split-pair-both',
      'Both charts are in a separation pattern',
      `${nameA} is ${a.flags.level} and ${nameB} is ${b.flags.level}. Each chart already carries a collapse of the marriage energies. The second chart confirms it. It does not discover it.`,
      'caution',
    )]
  }
  if (broken(a.flags.level) || broken(b.flags.level)) {
    const who = broken(a.flags.level) ? nameA : nameB
    const other = broken(a.flags.level) ? nameB : nameA
    return [note(
      'split-pair-one',
      `${who}’s chart carries the break`,
      `The collapsed energy is in ${who}’s Moon, Venus, or Saturn. ${other}’s three energies are not in that pattern. The class would ask which energy can still improve before treating the parting as finished.`,
      'caution',
    )]
  }
  return []
}
