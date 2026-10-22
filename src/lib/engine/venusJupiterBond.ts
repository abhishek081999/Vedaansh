// src/lib/engine/venusJupiterBond.ts
// Venus is closeness. Jupiter is depth. The marriage scenario is which of
// the two is actually strong, and what Rahu does when both are weak.
// A scenario is named only from this chart. Remedies are not offered for
// the immature pattern. Pure engine — no React/DB.

import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_LORDS, RASHI_NAMES } from '@/types/astrology'
import type { LifeTone, MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'

export type BondScenario = 'venus' | 'jupiter' | 'both-weak' | 'both-strong' | 'open'
export type BondPlanet = 'Ve' | 'Ju' | 'Ra' | 'Sa' | 'Mo'
export type PlanetWeight = 'strong' | 'weak' | 'thin'

export interface VenusJupiterFlags {
  scenario: BondScenario
  venus: PlanetWeight
  jupiter: PlanetWeight
  rahuAmplifies: boolean
  dominant: BondPlanet | null
}

export interface VenusJupiterReading {
  headline: string
  summary: string
  principles: string
  scenario: MarriedLifeNote[]
  support: MarriedLifeNote[]
  flags: VenusJupiterFlags
}

const LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const DIGNIFIED: Dignity[] = ['exalted', 'moolatrikona', 'own']
const CAPABLE: Dignity[] = [...DIGNIFIED, 'friend', 'great_friend']
const DUSTHANA = new Set([6, 8, 12])
const KENDRA = new Set([1, 4, 7, 10])

export const VENUS_JUPITER_PRINCIPLES =
  'Venus is the experience of closeness. Jupiter turns that experience into a direction the two can share. Closeness without depth dries out. Depth without closeness becomes duty with no juice. After marriage, about seven years pass before the two karmas are intertwined, so the partner’s chart starts to show in the life on that scale. A divisional strength stays quiet until guidance or practice activates it. Nakshatra exchange of the lagna lord and the 7th lord is read when their nakshatra lords have actually swapped.'

function houseOf(rashi: number, asc: number): number {
  return ((rashi - asc + 12) % 12) + 1
}

function signOf(asc: number, house: number): Rashi {
  return ((((asc - 1 + house - 1) % 12) + 1) as Rashi)
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

function weightOf(g: GrahaData | undefined, asc: number, grahas: GrahaData[]): PlanetWeight {
  if (!g) return 'weak'
  const house = houseOf(g.rashi, asc)
  const withNode = grahas.some(x => (x.id === 'Ra' || x.id === 'Ke') && x.id !== g.id && x.rashi === g.rashi)
  const maleficAspect = grahas.some(x => isMalefic(x.id) && x.id !== g.id && aspects(x, g.rashi))
  const fallen = g.dignity === 'debilitated' || g.dignity === 'enemy' || g.dignity === 'great_enemy' || !!g.isCombust
  if (fallen) return 'weak'
  if (DUSTHANA.has(house) && !dignified(g.dignity)) return 'weak'
  if (withNode && !dignified(g.dignity)) return 'weak'
  if (!dignified(g.dignity) && maleficAspect) return 'weak'
  if (dignified(g.dignity) && !g.isCombust && !withNode) return 'strong'
  if (capable(g.dignity) && !g.isCombust && !DUSTHANA.has(house) && !withNode && !maleficAspect) return 'strong'
  return 'thin'
}

function d9Weight(g: GrahaData | undefined, d9Asc: number | undefined, d9: GrahaData[] | undefined): PlanetWeight {
  if (!g || !d9Asc || !d9) return 'thin'
  const copy = find(d9, g.id)
  if (!copy) return 'thin'
  return weightOf(copy, d9Asc, d9)
}

export function analyzeVenusJupiterBond(chart: ChartOutput | null | undefined): VenusJupiterReading | null {
  const asc = chart?.lagnas?.ascRashi
  if (!chart || !asc) return null

  const grahas = chart.grahas ?? []
  const seventh = signOf(asc, 7)
  const lord = find(grahas, LORDS[seventh])
  const lagnaLord = find(grahas, LORDS[asc])
  const venus = find(grahas, 'Ve')
  const jupiter = find(grahas, 'Ju')
  const rahu = find(grahas, 'Ra')
  const saturn = find(grahas, 'Sa')
  const moon = find(grahas, 'Mo')
  const d9 = chart.vargas?.D9
  const d9Asc = chart.vargaLagnas?.D9

  const venusW = weightOf(venus, asc, grahas)
  const jupiterW = weightOf(jupiter, asc, grahas)
  const scenario: BondScenario = venusW === 'strong' && jupiterW === 'strong'
    ? 'both-strong'
    : venusW === 'strong' && jupiterW === 'weak'
      ? 'venus'
      : jupiterW === 'strong' && venusW === 'weak'
        ? 'jupiter'
        : venusW === 'weak' && jupiterW === 'weak'
          ? 'both-weak'
          : 'open'

  const rahuProminent = !!rahu && (
    KENDRA.has(houseOf(rahu.rashi, asc))
    || rahu.rashi === seventh
    || (!!venus && rahu.rashi === venus.rashi)
    || (!!jupiter && rahu.rashi === jupiter.rashi)
  )
  const rahuAmplifies = scenario === 'both-weak' && rahuProminent

  const score = (id: BondPlanet): number => {
    const g = find(grahas, id)
    if (!g) return 0
    let n = 0
    if (houseOf(g.rashi, asc) === 7) n += 3
    if (lord?.id === id) n += 2
    if (aspects(g, seventh)) n += 1
    if (lord && g.id !== lord.id && g.rashi === lord.rashi) n += 2
    if (dignified(g.dignity)) n += 1
    return n
  }
  const ranked = (['Ve', 'Ju', 'Ra', 'Sa', 'Mo'] as BondPlanet[])
    .map(id => ({ id, n: score(id) }))
    .sort((a, b) => b.n - a.n)
  const dominant = ranked[0].n >= 3 && ranked[0].n > ranked[1].n ? ranked[0].id : null

  const scenarioNotes: MarriedLifeNote[] = []
  const support: MarriedLifeNote[] = []

  if (scenario === 'venus') {
    scenarioNotes.push(note(
      'vj-venus',
      'Closeness without a common direction',
      'Venus is strong and Jupiter is weak. Attraction, travel, and physical closeness are real, and the early years can look like a complete couple. Around year three the turn often shows: talk thins and the two stop sharing one direction. Romance becomes routine with no shared aim under it. The form of the marriage remains; the substance does not. What used to be patience becomes an unwillingness to wait.',
      'caution',
    ))
  } else if (scenario === 'jupiter') {
    scenarioNotes.push(note(
      'vj-jupiter',
      'Duty without the juice of Venus',
      'Jupiter is strong and Venus is weak. Values, ethics, and responsibility hold. The two can run a household as a team, and the bond does not break for lack of duty. Romance, warmth, and easy physical affection are the missing part. Partners often read as a good spouse, not a romantic one. The life can seek warmth outside and then carry guilt, or stay and go quiet. Strong Jupiter alone is not a warm marriage.',
      'mixed',
    ))
  } else if (scenario === 'both-weak') {
    scenarioNotes.push(note(
      'vj-both-weak',
      'An immature experience of relationship',
      'Venus and Jupiter are both weak. The relationship pattern is still early: attraction is fast, expectations are high, disappointment is fast, and patience is thin. The purpose of the marriage was never clear. Stages often run from excitement, to “you complete me,” to the illusion breaking, to distance, then either suffering in place or leaving. Love is treated as possession, marriage as a fix, and the partner as the one at fault. Boredom, blame, and regret arrive quickly. A quick divorce, a series of bonds, or a quiet painful staying are all still open.',
      'caution',
    ))
  } else if (scenario === 'both-strong') {
    scenarioNotes.push(note(
      'vj-both-strong',
      'Closeness that has a direction',
      'Venus and Jupiter are both strong. Closeness and depth are in the same chart. Struggle is how the two learn, the aim is shared, and problems tend to bring them nearer. The marriage expands the person instead of merely housing them.',
      'supportive',
    ))
  } else {
    scenarioNotes.push(note(
      'vj-open',
      'Venus and Jupiter are not in a decisive pair',
      `Venus is ${venusW} and Jupiter is ${jupiterW}. The four marriage scenarios need one planet strong and the other weak, or both strong, or both weak. This chart is between those. Do not call it a paper pattern or a duty pattern from a middling planet.`,
      'mixed',
    ))
  }

  if (rahuAmplifies && rahu) {
    scenarioNotes.push(note(
      'vj-rahu',
      'Rahu amplifies a bond that has no direction',
      `Rahu is in ${RASHI_NAMES[rahu.rashi]}, prominent, while Venus and Jupiter are both weak. Rahu takes the few experiences Venus can give and enlarges them. There is no Jupiter to give them a meaning. Desire outruns judgment: obsessive attraction, relationships that do not respect a boundary, secret bonds, and emotional addiction. The person is looking for completeness, not for love, and each new bond makes the emptiness larger. Guilt arrives only when Jupiter finally wakes, which is late. The lessons still due are that experience is not a solution, attraction is not a soul bond, and a relationship will not complete the self.`,
      'caution',
    ))
  }

  const d9Venus = d9Weight(venus, d9Asc, d9)
  const d9Jupiter = d9Weight(jupiter, d9Asc, d9)
  if (d9Asc && scenario !== 'open') {
    if (scenario === 'both-weak' && d9Jupiter === 'strong') {
      scenarioNotes.push(note(
        'vj-d9-jupiter',
        'Navamsha Jupiter can still mature this',
        'In the birth chart Venus and Jupiter are weak, so events stay immature. Jupiter is strong in Navamsha (D9, the deeper marriage chart). That strength stays quiet until guidance or practice activates it. When it does, ethics appear, realization comes sooner, and the marriage has a way to survive. Navamsha does not cancel what the birth chart shows.',
        'mixed',
      ))
    } else if (d9Venus === 'weak' && d9Jupiter === 'weak' && scenario === 'both-strong') {
      scenarioNotes.push(note(
        'vj-d9-immature',
        'The day-to-day is a partnership. The soul account is not',
        'In the birth chart Venus and Jupiter can carry closeness and depth. In Navamsha (D9) both are weak. Daily life can look like a true partnership while maturity in relationship is still ahead.',
        'mixed',
      ))
    } else if (scenario === 'jupiter' && d9Jupiter === 'strong' && d9Venus === 'weak') {
      scenarioNotes.push(note(
        'vj-d9-duty',
        'Navamsha repeats the duty without the warmth',
        'Jupiter remains strong in Navamsha (D9) and Venus remains weak there. The polished look and the missing inner connection are the same story in both charts. A strong corner-house Jupiter in Navamsha does not supply the Venus this marriage lacks.',
        'mixed',
      ))
    }
  }

  const typeCopy: Record<BondPlanet, { title: string; detail: string }> = {
    Ve: {
      title: 'A Venus-led marriage',
      detail: 'Among Venus, Jupiter, Rahu, Saturn, and the Moon, Venus most clearly steers the marriage house (7th). The bond is run by attraction and lived closeness.',
    },
    Ju: {
      title: 'A Jupiter-led marriage',
      detail: 'Among those five planets on the marriage house (7th), Jupiter leads. The bond is run by meaning, forgiveness, and a longer view.',
    },
    Ra: {
      title: 'A Rahu-led marriage',
      detail: 'Among those five planets on the marriage house (7th), Rahu leads. The bond is pulled by craving, amplification, and an unfinished lesson.',
    },
    Sa: {
      title: 'A Saturn-led marriage',
      detail: 'Among those five planets on the marriage house (7th), Saturn leads. The bond is run by duty, delay, and a clear boundary.',
    },
    Mo: {
      title: 'A Moon-led marriage',
      detail: 'Among those five planets on the marriage house (7th), the Moon leads. The bond is run by emotional weather and the need to feel safe.',
    },
  }
  if (dominant) {
    scenarioNotes.push(note(`vj-type-${dominant}`, typeCopy[dominant].title, typeCopy[dominant].detail, dominant === 'Ra' ? 'caution' : 'mixed'))
  }

  const nakLord = (g: GrahaData | undefined): GrahaId | null => {
    if (!g || typeof g.nakshatraIndex !== 'number') return null
    return NAKSHATRA_LORDS[g.nakshatraIndex] ?? null
  }
  if (lagnaLord && lord && lagnaLord.id !== lord.id && nakLord(lagnaLord) === lord.id && nakLord(lord) === lagnaLord.id) {
    scenarioNotes.push(note(
      'vj-nakshatra-exchange',
      'Rising-sign lord and marriage-house lord exchange stars',
      `${gn(lagnaLord.id)} (rules the rising sign) sits in a nakshatra of ${gn(lord.id)}, and ${gn(lord.id)} (rules the marriage house) sits in a nakshatra of ${gn(lagnaLord.id)}. That star-swap is read like a sign exchange: self and partner live inside each other’s stars, even when the signs say something else.`,
      'mixed',
    ))
  }

  const problem = scenario === 'venus' || scenario === 'jupiter' || scenario === 'both-weak'
  if (problem && moon) {
    const ownSign = moon.rashi === 2 || moon.rashi === 4 || moon.dignity === 'own' || moon.dignity === 'exalted'
    const waxing = moon.isWaxingMoon === true
    const bindu = chart.ashtakavarga?.bav?.Mo?.bindus?.[moon.rashi - 1]
    const bav = typeof bindu === 'number' && bindu > 4
    const supports = [ownSign, waxing, bav].filter(Boolean).length
    if (supports >= 2 || (bav && ownSign)) {
      support.push(note(
        'vj-moon-support',
        'The Moon can steady the feelings',
        `The Moon ${ownSign ? 'is in its own ground' : 'is placed'}${waxing ? ', waxing' : ''}${bav ? `, with ${bindu} ashtakavarga points in its sign` : ''}. Where Venus and Jupiter are out of balance, a Moon like this can steady feelings. Rahu can still pull the mind toward restlessness. Stability is a capacity — used when the person is guided to use it.`,
        'supportive',
      ))
    }
  }

  if (problem && saturn && dignified(saturn.dignity) && !saturn.isCombust) {
    support.push(note(
      'vj-saturn-support',
      'Saturn can give the bond a boundary',
      'Saturn is dignified. In a marriage that is all closeness, or all duty, or neither, Saturn is the discipline and the limit. Structure is what it adds. It does not add romance.',
      'mixed',
    ))
  }

  if (problem && d9Jupiter === 'strong' && scenario !== 'both-weak') {
    support.push(note(
      'vj-d9-support',
      'Jupiter is strong in Navamsha (D9)',
      'Navamsha Jupiter carries ethics and a later realization. The marriage has a dharmic way to survive once that Jupiter is activated through guidance and practice — not by dropping a single remedy on the chart.',
      'supportive',
    ))
  }

  if (scenario === 'both-weak') {
    support.push(note(
      'vj-counsel',
      'This pattern is moved by guidance, not by a remedy',
      'Remedies do not move a marriage in which Venus and Jupiter are both weak. The person needs an outside guide, more than once. The same words from the partner do not land. One sitting does not produce the realization. Rahu’s demand for completeness can be turned toward curiosity, service, or a craft. That redirect is read from the chart in the sessions that follow. It is not a single instruction.',
      'mixed',
    ))
  }

  const headline = scenario === 'venus'
    ? 'Venus can bring them close. Jupiter is not giving it depth'
    : scenario === 'jupiter'
      ? 'Jupiter can run the marriage. Venus is not giving it warmth'
      : scenario === 'both-weak'
        ? rahuAmplifies
          ? 'Venus and Jupiter are weak, and Rahu is amplifying what remains'
          : 'Venus and Jupiter are both too weak to mature a marriage'
        : scenario === 'both-strong'
          ? 'Venus and Jupiter can make a bond that deepens'
          : 'Venus and Jupiter have not settled into one marriage pattern'

  const summary = dominant
    ? `Venus (closeness) is ${venusW}. Jupiter (shared meaning) is ${jupiterW}. Among Venus, Jupiter, Rahu, Saturn, and the Moon, ${gn(dominant)} most clearly steers the marriage house (7th).`
    : `Venus (closeness) is ${venusW}. Jupiter (shared meaning) is ${jupiterW}. None of Venus, Jupiter, Rahu, Saturn, or the Moon clearly leads the marriage house (7th), so the bond has no single driver from that set.`

  return {
    headline,
    summary,
    principles: VENUS_JUPITER_PRINCIPLES,
    scenario: scenarioNotes,
    support,
    flags: { scenario, venus: venusW, jupiter: jupiterW, rahuAmplifies, dominant },
  }
}

export function compareVenusJupiterBond(
  a: VenusJupiterReading,
  b: VenusJupiterReading,
  nameA: string,
  nameB: string,
): MarriedLifeNote[] {
  const notes: MarriedLifeNote[] = []
  const pair = new Set([a.flags.scenario, b.flags.scenario])
  if (a.flags.scenario === 'venus' && b.flags.scenario === 'jupiter' || a.flags.scenario === 'jupiter' && b.flags.scenario === 'venus') {
    notes.push(note(
      'vj-pair-complement',
      'One chart has the closeness, the other has the depth',
      `${nameA} is the ${a.flags.scenario} pattern and ${nameB} is the ${b.flags.scenario} pattern. Together they hold the two halves the class separates: experience and direction. Each chart alone is incomplete. The marriage works if the warmth and the meaning are actually shared, not left in separate people.`,
      'mixed',
    ))
  } else if (a.flags.scenario !== 'open' && a.flags.scenario === b.flags.scenario) {
    notes.push(note(
      'vj-pair-same',
      'Both charts are in the same Venus–Jupiter pattern',
      `${nameA} and ${nameB} are both ${a.flags.scenario === 'both-strong' ? 'carrying closeness and depth' : a.flags.scenario === 'both-weak' ? 'weak in Venus and in Jupiter' : a.flags.scenario === 'venus' ? 'close without a shared direction' : 'dutiful without the warmth'}. The pattern is doubled, not balanced by the other person.`,
      a.flags.scenario === 'both-strong' ? 'supportive' : 'caution',
    ))
  } else if (pair.has('both-weak')) {
    const who = a.flags.scenario === 'both-weak' ? nameA : nameB
    notes.push(note(
      'vj-pair-nursery',
      `${who} is still learning what a relationship is`,
      `${who} has Venus and Jupiter both weak. The other chart does not share that immaturity. The class would not expect one conversation, or a remedy, to mature it. Guidance has to be repeated, and it has to come from outside the couple.`,
      'caution',
    ))
  }
  return notes
}
