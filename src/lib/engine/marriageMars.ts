// src/lib/engine/marriageMars.ts
// Mars in marriage: the fire that starts a bond and the will to keep it.
// A level is named only when the chart matches it. Debilitation alone is not immaturity.
// Manglik heat is fast energy, not a verdict that Mars is bad.
// Pure engine — no React/DB.

import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import type { LifeTone, MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'

export type MarsLevel = 'immature' | 'balanced' | 'transformative' | 'open'
export type MarsElement = 'fire' | 'water' | 'air' | 'earth'

export interface MarriageMarsFlags {
  level: MarsLevel
  manglik: boolean
  southSecond: boolean
  maturedByAge: boolean
  inSeventh: boolean
  element: MarsElement | null
}

export interface MarriageMarsReading {
  headline: string
  summary: string
  principles: string
  level: MarriedLifeNote[]
  placements: MarriedLifeNote[]
  pairs: MarriedLifeNote[]
  flags: MarriageMarsFlags
}

const LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const MANGLIK = new Set([1, 4, 7, 8, 12])
const DIGNIFIED: Dignity[] = ['exalted', 'moolatrikona', 'own']
const CAPABLE: Dignity[] = [...DIGNIFIED, 'great_friend', 'friend']
const RANK: Partial<Record<Dignity, number>> = {
  exalted: 6, moolatrikona: 5, own: 4, great_friend: 3, friend: 2, neutral: 1, enemy: 0, great_enemy: 0, debilitated: -1,
}

export const MARRIAGE_MARS_PRINCIPLES =
  'Mars is the fire of a marriage: the step that turns a love affair or a proposal into a wedding, the physical spark, the boundary, and the will to fight for the bond. Without that will, Venus can still love and the marriage can still fail. Mars does not break a marriage by itself, and it does not stop one by itself. It can break a proposal at the last step, and it can supply ego. It needs Venus for kindness, Jupiter for judgment, and Saturn for patience. Manglik placements (Mars in the 1st, 4th, 7th, 8th, or 12th house, and in the South Indian reading the 2nd) bring fast, reactive energy, not a bad planet. That heat is read more lightly after about thirty. In marriage the 8th is Mangalya: emotional intimacy, the hidden bond, not the bedroom. A woman’s chart is read for how she meets and redirects the partner’s energy. A man’s chart is read for how he moves toward her. Both charts are examined.'

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

function aspects(source: GrahaData, targetSign: number): boolean {
  if (source.rashi === targetSign) return false
  const diff = ((targetSign - source.rashi + 12) % 12) + 1
  if (diff === 7) return true
  if (source.id === 'Ma' && (diff === 4 || diff === 8)) return true
  if (source.id === 'Ju' && (diff === 5 || diff === 9)) return true
  if (source.id === 'Sa' && (diff === 3 || diff === 10)) return true
  if ((source.id === 'Ra' || source.id === 'Ke') && (diff === 5 || diff === 9)) return true
  return false
}

function elementOf(rashi: number): MarsElement {
  if (rashi === 1 || rashi === 5 || rashi === 9) return 'fire'
  if (rashi === 4 || rashi === 8 || rashi === 12) return 'water'
  if (rashi === 3 || rashi === 7 || rashi === 11) return 'air'
  return 'earth'
}

function capable(g: GrahaData | undefined): boolean {
  return !!g && !!g.dignity && CAPABLE.includes(g.dignity) && !g.isCombust
}

function dignified(g: GrahaData | undefined): boolean {
  return !!g && !!g.dignity && DIGNIFIED.includes(g.dignity) && !g.isCombust
}

function fallen(g: GrahaData | undefined): boolean {
  if (!g) return true
  return g.dignity === 'debilitated' || g.dignity === 'enemy' || g.dignity === 'great_enemy' || !!g.isCombust
}

function rankOf(g: GrahaData | undefined): number {
  if (!g?.dignity) return 1
  return RANK[g.dignity] ?? 1
}

function joined(a: GrahaData | undefined, b: GrahaData | undefined): boolean {
  return !!a && !!b && a.rashi === b.rashi
}

function sees(a: GrahaData | undefined, b: GrahaData | undefined): boolean {
  return !!a && !!b && (joined(a, b) || aspects(a, b.rashi))
}

function ageNow(chart: ChartOutput, now: Date): number | null {
  const raw = chart.meta?.birthDate
  if (!raw) return null
  const y = Number(String(raw).slice(0, 4))
  if (!Number.isFinite(y) || y < 1900) return null
  return now.getFullYear() - y
}

const ELEMENT_COPY: Record<MarsElement, string> = {
  fire: 'In a fire sign the reaction is quick and intense, like a flare.',
  water: 'In a water sign the aggression is emotional: hurt, tears, and a wound that stays.',
  air: 'In an air sign the fight is verbal: sharp words and a debate that does not stop.',
  earth: 'In an earth sign anger stays down, and when it finally comes it comes once and hard.',
}

export function analyzeMarriageMars(
  chart: ChartOutput | null | undefined,
  opts: { now?: Date } = {},
): MarriageMarsReading | null {
  const asc = chart?.lagnas?.ascRashi
  if (!chart || !asc) return null
  const grahas = chart.grahas ?? []
  const mars = find(grahas, 'Ma')
  if (!mars) {
    return {
      headline: 'Mars is not on this chart',
      summary: 'Without Mars the fire that starts and defends a marriage cannot be read.',
      principles: MARRIAGE_MARS_PRINCIPLES,
      level: [],
      placements: [],
      pairs: [],
      flags: { level: 'open', manglik: false, southSecond: false, maturedByAge: false, inSeventh: false, element: null },
    }
  }

  const now = opts.now ?? new Date()
  const house = houseOf(mars.rashi, asc)
  const element = elementOf(mars.rashi)
  const venus = find(grahas, 'Ve')
  const jupiter = find(grahas, 'Ju')
  const saturn = find(grahas, 'Sa')
  const moon = find(grahas, 'Mo')
  const rahu = find(grahas, 'Ra')
  const ketu = find(grahas, 'Ke')
  const lagnaLord = find(grahas, LORDS[asc])
  const seventhLord = find(grahas, LORDS[signOf(asc, 7)])
  const d9 = chart.vargas?.D9
  const d9Asc = chart.vargaLagnas?.D9
  const d9Mars = find(d9, 'Ma')

  const venusSupports = sees(venus, mars) || (!!venus && aspects(mars, venus.rashi))
  const saturnBalances = sees(saturn, mars) || (!!saturn && aspects(mars, saturn.rashi))
  const jupiterSees = sees(jupiter, mars)
  const withRahu = joined(mars, rahu)
  const withKetu = joined(mars, ketu)
  const withSaturn = joined(mars, saturn)
  const withMoon = joined(mars, moon)
  const maleficOn = grahas.some(g => g.id !== 'Ma' && (g.id === 'Sa' || g.id === 'Ra' || g.id === 'Ke' || g.id === 'Su') && (g.rashi === mars.rashi || aspects(g, mars.rashi)))
  const weakMoon = fallen(moon) || (!!moon && [6, 8, 12].includes(houseOf(moon.rashi, asc)))
  const manglik = MANGLIK.has(house)
  const southSecond = house === 2
  const inSeventh = house === 7
  const marsStrong = capable(mars)
  const age = ageNow(chart, now)
  const maturedByAge = manglik && age != null && age >= 30

  const transformative = dignified(mars) && jupiterSees && saturnBalances && !withRahu && !withKetu
  const balanced = marsStrong && (jupiterSees || venusSupports) && saturnBalances && !withRahu
  const immature = (inSeventh && maleficOn) || (!venusSupports && weakMoon) || ((manglik || southSecond) && !jupiterSees && !saturnBalances)
  const level: MarsLevel = transformative ? 'transformative' : balanced ? 'balanced' : immature ? 'immature' : 'open'

  const levelNotes: MarriedLifeNote[] = []
  const placements: MarriedLifeNote[] = []
  const pairs: MarriedLifeNote[] = []

  if (level === 'transformative') {
    levelNotes.push(note(
      'mars-transformative',
      'A refined Mars',
      'Mars is strong, Jupiter reaches it, and Saturn steadies it, without Rahu or Ketu sitting on it. This is a rare, purified Mars: focused, able to solve rather than only name the problem, with desire that can be used and does not rule the person. Conflict is carried by speech. Dedication to the marriage is the result.',
      'supportive',
    ))
  } else if (level === 'balanced') {
    levelNotes.push(note(
      'mars-balanced',
      'A balanced Mars',
      'Mars is strong, a benefic reaches it, and Saturn supplies patience. Attraction and physical compatibility can be real, and trouble is faced by both people rather than by one. This Mars protects. Passion and steadiness can sit in the same bond.',
      'supportive',
    ))
  } else if (level === 'immature') {
    levelNotes.push(note(
      'mars-immature',
      'A raw Mars',
      'This is not the same as a debilitated Mars. The energy is unrefined: fast, possessive, and reactive. Physical intimacy goes out of balance, anger answers before thought, and authority in the marriage turns quarrelsome. A weak Moon adds the possessiveness. Manglik heat before about thirty is this same rawness.',
      'caution',
    ))
  }

  levelNotes.push(note(
    'mars-element',
    `Mars reacts as ${element}`,
    ELEMENT_COPY[element],
    element === 'fire' || element === 'earth' ? 'caution' : 'mixed',
  ))

  if (manglik || southSecond) {
    placements.push(note(
      'mars-manglik',
      southSecond && !manglik ? 'The 2nd is Manglik in the South Indian reading' : 'Manglik heat is fast energy',
      `${southSecond && !manglik ? 'Mars is in the 2nd. The South Indian reading counts that house with the usual 1st, 4th, 7th, 8th, and 12th.' : `Mars is in the ${house === 1 ? '1st' : house === 2 ? '2nd' : house === 3 ? '3rd' : `${house}th`}.`} The person does not stay quiet where silence is needed, and the reply comes as soon as the sentence lands. The same placement keeps the hands and the mind at work. It is imbalanced pace, not a bad planet. If Mars stays imbalanced, Jupiter’s judgment and Venus’s kindness are disturbed with it.${maturedByAge ? ` The person is about ${age}. After thirty this heat is read more lightly. It does not disappear.` : ' Before about thirty the same heat is read as aggression and unready authority.'}`,
      maturedByAge ? 'mixed' : 'caution',
    ))
  }

  if (inSeventh) {
    const depth = venusSupports && capable(venus)
    placements.push(note(
      'mars-seventh',
      'Mars in the marriage house',
      `Attraction is quick, and so is the fight. The argument is about authority and “you are mine,” not about hatred. Desire here has ${depth ? 'depth, and depth can become real understanding' : 'less depth, so satisfaction stays about the self'}. The wish to marry can arrive early.`,
      depth ? 'mixed' : 'caution',
    ))
  }

  if (fallen(mars) && dignified(venus)) {
    placements.push(note(
      'mars-no-fight',
      'Love without the will to fight for it',
      'Venus is strong and Mars is not. This is the picture of couples who still love each other and still cannot make the marriage work. Venus keeps the affection. Mars is the part that would have fought for the bond, and that part is thin. In match-making this pair is read early, and it is not assumed to be a gift.',
      'caution',
    ))
  } else if (fallen(mars) && !manglik) {
    placements.push(note(
      'mars-quiet',
      'Peace without the spark',
      'Mars is quiet. The marriage can be peaceful and can also become a friendship with no excitement. A living bond needs this fire. Stability alone is Venus and Saturn. Understanding is Jupiter.',
      'mixed',
    ))
  } else if (level === 'immature') {
    placements.push(note(
      'mars-war',
      'Heat without a container',
      'Mars is active and not held. The marriage can become a running argument. The same planet, once Saturn and a benefic reach it, is what makes the bond lively instead.',
      'caution',
    ))
  }

  if (inSeventh && element === 'fire' && lagnaLord && rankOf(mars) > rankOf(lagnaLord)) {
    placements.push(note(
      'mars-ego',
      'Mars will not come down to an agreement',
      'Mars is in a fire sign, in the 7th, and stronger than the rising-sign lord. This describes a person who does not compromise, sets the bar where almost no one qualifies, and treats dominance as the terms of the marriage.',
      'caution',
    ))
  } else if (element === 'earth' && (level === 'immature' || manglik)) {
    placements.push(note(
      'mars-earth-trust',
      'The barrier is trust',
      'Mars in an earth sign, with this heat, does not hand trust to a partner. The block is psychological. It is not the open ego of a fire-sign Mars.',
      'mixed',
    ))
  }

  if ((level === 'immature' || (inSeventh && marsStrong)) && level !== 'transformative') {
    placements.push(note(
      'mars-possess',
      'Protection and control are the same heat',
      'A strong or raw Mars watches the partner: meals, work, health. At first it reads as care. Left without Venus and Saturn, the same watch becomes control, and the partner feels they cannot breathe. The line between the two is thin.',
      'caution',
    ))
  }

  const eighthLord = find(grahas, LORDS[signOf(asc, 8)])
  const eighthHot = grahas.some(g => houseOf(g.rashi, asc) === 8 && (g.id === 'Ma' || g.id === 'Sa' || g.id === 'Ra' || g.id === 'Ke'))
  const eighthHeld = !!eighthLord && capable(eighthLord) && !eighthHot
  if (eighthHot || eighthHeld || house === 8) {
    placements.push(note(
      'mars-mangalya',
      'The 8th is the hidden bond',
      `In marriage the 8th is Mangalya: emotional intimacy, not the bedroom. ${eighthHot || house === 8 ? 'Malefic heat on that house makes the hidden bond intense and uneven. The couple can still be tied, and the tie is not gentle.' : 'The 8th lord is capable and the house is not under Mars, Saturn, or the nodes. The hidden bond has a way to hold.'} Both charts are read for this. In a woman’s chart it is the more decisive of the two.`,
      eighthHot || house === 8 ? 'caution' : 'supportive',
    ))
  }

  const gender = chart.meta?.gender
  if (level !== 'open' && gender === 'female') {
    placements.push(note(
      'mars-hers',
      'Her Mars meets the partner’s energy',
      'In a woman’s chart Mars is how she meets what the partner brings: whether she can take it in and turn it, or only endure it. Recognition matters more than whether the planet is strong. What blocks that recognition is the thing to understand. One person is not claimed to remake the other.',
      'mixed',
    ))
  } else if (level !== 'open' && gender === 'male') {
    placements.push(note(
      'mars-his',
      'His Mars is how he moves toward her',
      'In a man’s chart Mars is his behavior toward his partner, the physical life of the marriage, and whether he tries to lead. Protection and authority are the same planet.',
      'mixed',
    ))
  }

  if (withSaturn || (!!saturn && aspects(mars, saturn.rashi) && aspects(saturn, mars.rashi))) {
    const saturnHolds = dignified(saturn) && !dignified(mars)
    const marsRushes = dignified(mars) && fallen(saturn)
    pairs.push(note(
      'mars-saturn',
      saturnHolds ? 'Saturn asks this Mars to slow down' : marsRushes ? 'Mars tries to make Saturn run' : 'Mars and Saturn suppress the anger',
      `Mars and Saturn are joined or opposed. The anger here is about the partner. ${saturnHolds ? 'Saturn is the stronger of the two, so patience is the demand. Issues can sit unresolved until that patience is actually used.' : marsRushes ? 'Mars is strong and Saturn is not. Mars tries to hurry a planet that cannot hurry, and long problems keep being made.' : 'Neither planet clearly rules the other. The anger stays down. Which one wins is not named from dignity alone.'}`,
      'caution',
    ))
  }

  if (d9Mars && d9Asc) {
    const d9House = houseOf(d9Mars.rashi, d9Asc)
    const d9Hot = MANGLIK.has(d9House) || joined(d9Mars, find(d9, 'Ra')) || joined(d9Mars, find(d9, 'Ke')) || d9Mars.dignity === 'debilitated'
    const d1Calm = level !== 'immature' && !withRahu && !withKetu
    if (d1Calm && d9Hot) {
      pairs.push(note(
        'mars-d9-turn',
        'Navamsha Mars is hotter than the birth chart',
        'Mars is quieter in the birth chart and heated in Navamsha. This is a marriage that changes the person: behavior toward parents and the partner can turn after the wedding. The early years carry the struggle. The change comes through that struggle.',
        'mixed',
      ))
    } else if (!d1Calm && !d9Hot && capable(d9Mars)) {
      pairs.push(note(
        'mars-d9-settle',
        'Navamsha Mars is quieter than the birth chart',
        'The birth chart shows the heat. Navamsha Mars is capable and not in a Manglik seat. Daily friction is real. The deeper chart has a way to settle it once the marriage is actually lived.',
        'mixed',
      ))
    }
  }

  if (withKetu) {
    const seventhWeak = fallen(seventhLord)
    pairs.push(note(
      'mars-ketu',
      'Mars with Ketu makes the bond hard to keep steady',
      `Distance and instability sit between the partners. Ketu here is ${jupiterSees ? 'leaning toward release, because Jupiter also reaches Mars' : 'not yet a release; enjoyment and detachment are still mixed'}. Ketu is not read as a second Mars.${inSeventh && (withSaturn || withRahu) && seventhWeak ? ' Mars is in the 7th with Saturn or Rahu, and the marriage lord is weak. The marriage becomes a running me-against-you.' : ''}`,
      'caution',
    ))
  }

  if (withRahu) {
    const rahuHeld = (jupiterSees || (venusSupports && capable(venus))) && dignified(mars)
    const directed = house === 10 || house === 11
    pairs.push(note(
      'mars-rahu',
      rahuHeld ? 'Mars and Rahu can walk through the obstacle together' : 'Mars and Rahu have no middle setting',
      rahuHeld
        ? `Mars is strong and a benefic reaches the pair${directed ? `, in the ${house}th, where Mars gets a direction` : ''}. This is one of the two possible endings: partners who stay beside each other through the obstacle. The same pair can become a spiritual path that one person leads and the other follows. Mars–Rahu pushes action in this life. It is not read first as a past-life debt.`
        : `Mars says act. Rahu says there is no limit. Desire, emotion, and behavior all run without a clear want, and satisfaction does not arrive. The person can picture an ideal partner and still not know the way there. ${directed ? `The ${house === 10 ? '10th gives Mars a direction of work' : '11th asks for a clear aim'}. That helps. It does not by itself balance the pair.` : 'Balance comes from a benefic glance, or from Mars in its own strength, not from Rahu sitting in a pleasant house.'} ${dignified(mars) && !jupiterSees ? 'With Mars strong and no benefic on the pair, power becomes a contest and the person’s word is treated as the rule.' : ''}`,
      rahuHeld ? 'mixed' : 'caution',
    ))
  }

  if (withMoon) {
    const turbulent = [1, 4, 8].includes(house) || (!!moon && [1, 4, 8].includes(houseOf(moon.rashi, asc)))
    pairs.push(note(
      'mars-moon',
      'Mars and the Moon are a Lakshmi pair',
      `Mars with the Moon is read as Lakshmi: prosperity in the marriage, and emotional bursts with it. ${turbulent ? 'The pair touches the 1st, 4th, or 8th, so the inside of the marriage can be stormy while the outside looks successful.' : 'The emotional burst is still part of the yoga, even when the house is not the 1st, 4th, or 8th.'} ${gender === 'female' ? 'In her chart she is the one who carries that prosperity into the home, and the family may not credit her for it.' : gender === 'male' ? 'In his chart the wife is read as bringing that rise, while emotional satisfaction can still be thin.' : 'The home form of this yoga stays the wife’s signification, and both charts are still checked.'} Emotional conflict stays high either way.`,
      'mixed',
    ))
  }

  const venusStrong = dignified(venus)
  const marsWeak = fallen(mars)
  if (marsStrong && venus && !venusStrong && !venusSupports) {
    pairs.push(note(
      'mars-venus-passion',
      'Passion without kindness',
      'Mars is strong and Venus is not, and Venus does not reach Mars. Physical attraction can exist while emotional connection stays thin. Over time the distance grows. Possessiveness does the distancing.',
      'caution',
    ))
  } else if (marsStrong && venusStrong && venusSupports && (level === 'balanced' || level === 'transformative')) {
    pairs.push(note(
      'mars-venus-both',
      'Love and passion can sit together',
      'Mars and Venus are both strong, and they reach each other, with the Mars level held. This is love and passion in the same bond. Even then, Mars with Venus is watched for control. Balance between the two people decides whether it stays kind.',
      'supportive',
    ))
  } else if (joined(mars, venus)) {
    pairs.push(note(
      'mars-venus-join',
      'Mars with Venus tightens the grip',
      'Mars and Venus together are read first for intimacy, and on the lived level they create distance through control and possessiveness. Whether Venus is strong does not remove that. What matters is whether the two people can actually understand each other.',
      'caution',
    ))
  }

  const path = chart.dashas?.vimshottari ? getDashaPathAt(chart.dashas.vimshottari, now.getTime()) : []
  if (path.some(p => p.lord === 'Ma')) {
    pairs.push(note(
      'mars-dasha',
      'Mars is running, so this natal Mars is louder',
      `A Mars period amplifies whatever the birth Mars already is. ${level === 'balanced' || level === 'transformative' ? 'Here that is initiative and a willingness to lead.' : level === 'immature' ? 'Here that is domination and a faster temper.' : 'Here the level is unsettled, so the period makes the same unsettled fire louder.'} It does not turn a raw Mars kind, or a held Mars raw, by the period alone.`,
      level === 'immature' ? 'caution' : 'mixed',
    ))
  }

  const headline = level === 'transformative'
    ? 'Mars can fight for the marriage without ruling it'
    : level === 'balanced'
      ? 'Mars can keep the marriage alive and steady'
      : level === 'immature'
        ? 'Mars is the raw heat in this marriage'
        : 'Mars is present, and its level is not settled'

  const summary = `Mars is ${level} in ${RASHI_NAMES[mars.rashi]}, house ${house}, reacting as ${element}.${manglik ? ' Manglik heat is on.' : ''}${maturedByAge ? ' Age softens that heat.' : ''}`

  return {
    headline,
    summary,
    principles: MARRIAGE_MARS_PRINCIPLES,
    level: levelNotes,
    placements,
    pairs,
    flags: { level, manglik: manglik || southSecond, southSecond, maturedByAge, inSeventh, element },
  }
}

export function compareMarriageMars(
  a: MarriageMarsReading,
  b: MarriageMarsReading,
  nameA: string,
  nameB: string,
): MarriedLifeNote[] {
  const notes: MarriedLifeNote[] = []
  const hot = (r: MarriageMarsReading) => r.flags.level === 'immature' || (r.flags.manglik && r.flags.level !== 'balanced' && r.flags.level !== 'transformative')
  const held = (r: MarriageMarsReading) => r.flags.level === 'balanced' || r.flags.level === 'transformative'
  if (hot(a) && hot(b)) {
    notes.push(note(
      'mars-pair-both',
      'Both charts try to lead',
      `${nameA} and ${nameB} both carry a raw or Manglik Mars. This is two people who each try to dominate. Conflict is the expected weather. A benefic and Saturn on either Mars are what would change that, not a label that they match.`,
      'caution',
    ))
  } else if (hot(a) !== hot(b)) {
    const raw = hot(a) ? nameA : nameB
    const other = hot(a) ? nameB : nameA
    const otherHeld = hot(a) ? held(b) : held(a)
    notes.push(note(
      'mars-pair-one',
      `${other} has to be able to meet ${raw}’s pace`,
      `${raw} carries the faster Mars. ${other} ${otherHeld ? 'has a Mars that Saturn and a benefic already hold, so there is somewhere for that pace to land' : 'does not show a Mars that can absorb it. Understanding the other person’s energy is the hard part, and the mismatch is not solved by calling only one of them Manglik'}.`,
      otherHeld ? 'mixed' : 'caution',
    ))
  }
  return notes
}
