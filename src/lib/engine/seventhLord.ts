// src/lib/engine/seventhLord.ts
// Notes on the 7th lord's house, a few marriage combinations,
// female remarriage shortcuts, and the three age bands, based on classical texts.
// A note is emitted only when the chart forms that condition.
// Sensitive themes (death, livelihood, orientation) are worded as gentle tendencies, never verdicts.
// Pure engine — no React/DB.

import type { ChartOutput, Dignity, Gender, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { D30 } from '@/lib/engine/vargas'
import type { LifeTone, MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'

export type MarriageAgeBand = 'timely' | 'delayed' | 'late' | 'open'

export interface SeventhLordFlags {
  lordHouse: number | null
  exchange: boolean
  band: MarriageAgeBand
  jupiterSeventh: boolean
  saturnNinth: boolean
}

export interface SeventhLordReading {
  headline: string
  summary: string
  principles: string
  placement: MarriedLifeNote[]
  combinations: MarriedLifeNote[]
  timing: MarriedLifeNote[]
  flags: SeventhLordFlags
}

const LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const WAR = new Set<GrahaId>(['Ma', 'Me', 'Ju', 'Ve', 'Sa'])
const KENDRA = new Set([1, 4, 7, 10])
const TRIKONA = new Set([1, 5, 9])
const WATER = new Set([4, 8, 12])
const AIR = new Set([3, 7, 11])
const DIGNIFIED: Dignity[] = ['exalted', 'moolatrikona', 'own']

export const SEVENTH_LORD_PRINCIPLES =
  'The 7th is the marriage, the partner, and the mirror of what the lagna lacks. It is also a house classically tied to endings and loss, to roads away from home, and to property far from the birthplace. An exchange between the lagna lord and the 7th lord feels like a known person and still needs other support before a wedding can be expected. Manglik heat (Mars in a sensitive house) is said to ease after about 28. Read D1 with D9, and for a woman add D4 when the wedding period is the question.'

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

function isMalefic(id: GrahaId): boolean {
  return id === 'Su' || id === 'Ma' || id === 'Sa' || id === 'Ra' || id === 'Ke'
}

function isBenefic(g: GrahaData): boolean {
  if (g.id === 'Ju' || g.id === 'Ve') return true
  if (g.id === 'Mo') return g.isWaxingMoon !== false
  if (g.id === 'Me') return !weak(g)
  return false
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

function sees(source: GrahaData | undefined, target: GrahaData | undefined): boolean {
  if (!source || !target) return false
  return source.rashi === target.rashi || aspects(source, target.rashi)
}

function influences(source: GrahaData | undefined, sign: number): boolean {
  if (!source) return false
  return source.rashi === sign || aspects(source, sign)
}

function ordinal(n: number): string {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
}

function atWar(a: GrahaData | undefined, b: GrahaData | undefined): boolean {
  if (!a || !b || a.id === b.id) return false
  if (!WAR.has(a.id) || !WAR.has(b.id)) return false
  if (a.rashi !== b.rashi) return false
  if (typeof a.lonSidereal !== 'number' || typeof b.lonSidereal !== 'number') return false
  let diff = Math.abs(a.lonSidereal - b.lonSidereal)
  if (diff > 180) diff = 360 - diff
  return diff <= 1
}

export function analyzeSeventhLord(chart: ChartOutput | null | undefined): SeventhLordReading | null {
  const asc = chart?.lagnas?.ascRashi
  if (!chart || !asc) return null

  const grahas = chart.grahas ?? []
  const gender: Gender | undefined = chart.meta?.gender
  const seventh = signOf(asc, 7)
  const lordId = LORDS[seventh]
  const lord = find(grahas, lordId)
  const lagnaLord = find(grahas, LORDS[asc])
  const venus = find(grahas, 'Ve')
  const mars = find(grahas, 'Ma')
  const saturn = find(grahas, 'Sa')
  const jupiter = find(grahas, 'Ju')
  const moon = find(grahas, 'Mo')
  const sun = find(grahas, 'Su')
  const rahu = find(grahas, 'Ra')
  const mercury = find(grahas, 'Me')
  const d9 = chart.vargas?.D9
  const d9Asc = chart.vargaLagnas?.D9
  const path = chart.dashas?.vimshottari ? getDashaPathAt(chart.dashas.vimshottari) : []

  const h = (g: GrahaData | undefined) => (g ? houseOf(g.rashi, asc) : null)
  const maleficsOn = (g: GrahaData | undefined) =>
    g ? grahas.filter(x => x.id !== g.id && x.rashi === g.rashi && isMalefic(x.id)) : []
  const severe = !!lord && (weak(lord) || lord.isCombust || maleficsOn(lord).length >= 2)
  const lordHouse = h(lord)

  const placement: MarriedLifeNote[] = []
  const combinations: MarriedLifeNote[] = []
  const timing: MarriedLifeNote[] = []

  const exchange = !!lagnaLord && !!lord && lagnaLord.id !== lord.id && h(lagnaLord) === 7 && lordHouse === 1
  if (exchange && lagnaLord && lord) {
    placement.push(note(
      'seventh-exchange',
      'Lagna lord and 7th lord exchange',
      `${gn(lagnaLord.id)} is in the 7th and ${gn(lord.id)} is in the lagna. The person stays close to the partner’s side and the match feels already known, often from the existing circle. The exchange does not by itself produce the wedding. It needs the rest of the chart to support it.`,
      'mixed',
    ))
  }

  if (lagnaLord && weak(lagnaLord) && grahas.some(g => isMalefic(g.id) && (h(g) === 7 || aspects(g, seventh)))) {
    placement.push(note(
      'seventh-multi-weak-lagna',
      'A weak lagna and a malefic 7th',
      'The lagna lord is weak, and a malefic occupies or aspects the 7th. Classical texts read the possibility of more than one marriage from this pair, as a tendency and not a verdict. One of the two conditions alone is not enough.',
      'caution',
    ))
  }

  const lordPeriod = !!lord && path.some(p => p.lord === lord.id)
  if (severe && lord && lordPeriod) {
    placement.push(note(
      'seventh-lord-period',
      'The 7th lord’s period is a hard one for the partner',
      `${gn(lord.id)} is severely afflicted and its period is running now. Classical texts place strain and suffering on the partner in this dasha and antardasha, and the 7th is a house classically tied to endings and loss. Read it as a hard period to get through together. This does not mean a death is indicated.`,
      'caution',
    ))
  }

  const sixthLord = find(grahas, LORDS[signOf(asc, 6)])
  if (lord && sixthLord && lord.id !== sixthLord.id && lord.rashi === sixthLord.rashi) {
    const mercurial = lord.id === 'Me' || sixthLord.id === 'Me' || (!!mercury && mercury.rashi === lord.rashi)
    const jupiterSees = !!jupiter && (jupiter.rashi === lord.rashi || aspects(jupiter, lord.rashi))
    placement.push(note(
      'seventh-with-sixth',
      '7th lord with the 6th lord',
      `${gn(lord.id)} sits with ${gn(sixthLord.id)}. Classical texts read a second bond alongside the marriage. ${mercurial ? 'Mercury is in the mix, so whatever crosses the line tends to stay private. ' : ''}${jupiterSees ? 'Jupiter also sees it, so the same yoga can be a deep bond kept inside a boundary, or an influential tie, rather than a physical affair.' : 'No benefic is clearly holding it inside a boundary, so it is only a tendency and not a sign of an affair.'}`,
      'caution',
    ))
  }

  if (lord && lordHouse != null) {
    const seat = `${gn(lord.id)} is in the ${ordinal(lordHouse)} (${rn(lord.rashi)})`
    const byHouse: Record<number, { title: string; detail: string; tone: LifeTone }> = {
      1: {
        title: '7th lord in the lagna',
        detail: `${seat}. The person is tied to the partner and can marry inside a known circle. Without the full exchange, this is closeness, not yet a promise that the wedding occurs.`,
        tone: 'mixed',
      },
      2: {
        title: '7th lord in the 2nd',
        detail: `${seat}. Judgment can get clouded by desire. ${severe ? 'The affliction is severe, so desire and money matters can tangle: wanting something badly may start to steer financial choices. This is a tendency about priorities, not a statement about how anyone earns a living.' : 'Short of a severe affliction, this is restlessness in the mind, not something that touches livelihood.'} The 7th is the 10th from the 10th, so it echoes the career, but career themes are best read from the 10th house itself.`,
        tone: 'caution',
      },
      3: {
        title: '7th lord in the 3rd',
        detail: `${seat}. Effort and struggle in the marriage are the most dependable result. Classical texts also tie this seat to blurred lines with relatives, which is a tendency toward closeness in the wider family and not a prediction about any one relationship.`,
        tone: 'caution',
      },
      4: {
        title: '7th lord in the 4th',
        detail: `${seat}. This is a strong seat. The spouse brings comfort, and children tend to come easily, sometimes sooner than planned. Classical texts picture a family of more than one child. Read this as a gentle tendency, not a headcount.`,
        tone: 'supportive',
      },
      5: {
        title: '7th lord in the 5th',
        detail: `${seat}. The partner tends to come from a thinner financial background. Early marriage and a love marriage are both more available. They still need the 11th house of gains to come through. ${find(grahas, LORDS[signOf(asc, 11)]) && dignified(find(grahas, LORDS[signOf(asc, 11)])?.dignity) ? 'The 11th lord has strength, so that support is present.' : 'The 11th lord is not strong, so the love-marriage line is waiting on gains and timing.'}`,
        tone: 'mixed',
      },
      6: {
        title: '7th lord in the 6th',
        detail: `${seat}. Cousins come closer than siblings. ${gender === 'male' && venus && (weak(venus) || maleficsOn(venus).length > 0) ? 'Venus is also disturbed. In a man’s chart classical texts read some strain around family-building. This is a symbolic tendency, not a medical finding.' : ''}${gender === 'female' ? `In a woman’s chart this seat tends to delay marriage. ${jupiter && aspects(jupiter, seventh) ? 'Jupiter sees the 7th, which shortens the delay without erasing it.' : 'Without Jupiter’s aspect the delay is more likely to be felt in full.'}` : ''}`,
        tone: 'mixed',
      },
      7: {
        title: '7th lord in the 7th',
        detail: `${seat}. A spouse from a good family is indicated from this seat, and that still holds when the lord is a malefic. The cost is loneliness in the search: several proposals fall away before one stays.`,
        tone: isMalefic(lord.id) ? 'mixed' : 'supportive',
      },
      8: {
        title: '7th lord in the 8th',
        detail: `${seat}. Marriage brings money, in proportion to the life the person already has. An age difference is part of the pattern. No number of years can be read from this seat alone. ${gender === 'female' ? 'In a woman’s chart the early stretch of the marriage is the hard part.' : ''}`,
        tone: 'mixed',
      },
      9: {
        title: '7th lord in the 9th',
        detail: gender === 'female'
          ? `${seat}. In a woman’s chart this seat should be read with care and only alongside the rest of the chart. Classical texts associate it with a husband whose private life may not match his public one. This is a tendency, not a verdict.`
          : `${seat}. In a man’s chart this is a strong seat and points to an excellent partner. In a woman’s chart the same seat is read with more care and only alongside the rest of the chart.`,
        tone: gender === 'female' ? 'caution' : 'supportive',
      },
      10: {
        title: '7th lord in the 10th',
        detail: `${seat}. The partner supports the work, and the career tends to grow after marriage. An organization, an agency, or a foreign professional link belongs to this seat.`,
        tone: 'supportive',
      },
      11: {
        title: '7th lord in the 11th',
        detail: `${seat}. A good partner is indicated, and so is a bond that may stay unofficial: a deep emotional tie, or a friendship that crosses the usual line. It is not automatically an affair. ${severe ? 'The affliction is severe, so desire and money matters can tangle. Take it as a tendency to watch, not a fixed outcome.' : ''}`,
        tone: 'mixed',
      },
      12: {
        title: '7th lord in the 12th',
        detail: `${seat}. More than one partner is possible. A second marriage, when it comes, follows a hard ending of the first: classical texts speak of a painful separation or a long delay. This does not mean a death is indicated. It more often points to an earlier bond that did not end cleanly.`,
        tone: 'caution',
      },
    }
    const row = byHouse[lordHouse]
    if (row && !(lordHouse === 1 && exchange)) {
      placement.push(note(`seventh-h-${lordHouse}`, row.title, row.detail, row.tone))
    }
  }

  if (rahu && (h(rahu) === 7 || (lord && sees(rahu, lord) && (lordHouse === 9 || lordHouse === 12)))) {
    combinations.push(note(
      'seventh-foreign',
      'The 7th points away from the birthplace',
      'The 7th is the far side of the lagna. With Rahu on it, or the 7th lord carried to the 9th or 12th under Rahu, classical texts read foreign travel, settlement, or property away from the place of birth, and a life that can leave home.',
      'mixed',
    ))
  } else if (lordHouse === 12 || (find(grahas, 'Ke') && h(find(grahas, 'Ke')) === 7)) {
    combinations.push(note(
      'seventh-leaves-home',
      'The 7th can take the person out of the house',
      'The 7th lord in the 12th, or Ketu in the 7th, is a classical mark for leaving home and for a path that bends. Marriage is one of the doors. It is not the only one.',
      'mixed',
    ))
  }

  if (venus && moon && venus.rashi === moon.rashi) {
    combinations.push(note(
      'seventh-venus-moon',
      'Venus with the Moon',
      'The partner is strongly supportive. Trouble, when it comes, takes the form of a protective untruth: something softened so the other person does not flare. It is not the malicious kind.',
      'supportive',
    ))
  }

  const capricornCase = asc === 10 && !!saturn && h(saturn) === 1 && !!mars && mars.rashi === 4 && h(mars) === 7
  const mutual = !!mars && !!saturn && aspects(mars, saturn.rashi) && aspects(saturn, mars.rashi)
  if (capricornCase) {
    combinations.push(note(
      'seventh-capricorn-mars',
      'Capricorn lagna, Saturn in the lagna, Mars fallen in the 7th',
      'Saturn sees the fallen Mars from the lagna, and Mars sees Saturn back. Classical texts treat this as their strongest mark for desire or relationships that do not follow the path family expects. This is a tendency only and says nothing definite about who a person is.',
      'caution',
    ))
  } else if (mutual) {
    combinations.push(note(
      'seventh-mars-saturn',
      'Mars and Saturn see each other',
      'Mars and Saturn in mutual aspect can carry a mild pull toward desire or relationships that do not follow the path family expects, in any lagna. The weight is ordinary here. It becomes heavy only when the lagna is Capricorn, Saturn sits in that lagna, and Mars is fallen in the 7th. This is a tendency, not a verdict.',
      'mixed',
    ))
  }

  if (jupiter && (h(jupiter) === 7 || h(jupiter) === 2 || h(jupiter) === 4)) {
    const inSeventh = h(jupiter) === 7
    const withMoon = !!moon && moon.rashi === jupiter.rashi
    combinations.push(note(
      'seventh-jupiter',
      inSeventh ? 'Jupiter in the 7th' : `Jupiter in the ${ordinal(h(jupiter)!)}`,
      `${inSeventh ? 'Jupiter in the 7th gives a good married life, good children, and a good partner, and it protects the marriage on the surface. ' : 'Jupiter in the 2nd or the 4th feeds the same private restlessness. '}The other side, in classical texts, is a feeling that one partner may not be enough, with guilt arriving alongside the restlessness. ${withMoon ? 'The Moon is with Jupiter, which expands that restlessness.' : ''}`,
      'mixed',
    ))
  }

  if (mars && h(mars) === 4) {
    const ruchakaSign = mars.rashi === 1 || mars.rashi === 8 || mars.rashi === 10
    combinations.push(note(
      'seventh-mars-fourth',
      ruchakaSign ? 'Mars in the 4th — Ruchaka, and a family cash strain' : 'Mars in the 4th takes domestic peace and gives property',
      ruchakaSign
        ? 'Mars is in the 4th in Aries, Scorpio, or Capricorn, so Ruchaka (a classical yoga of strength and drive) is available. Classical texts still read a lasting financial strain in family life. The yoga does not cancel that strain.'
        : 'Mars in the 4th, outside its own signs and outside Capricorn, is classically seen as a thief of family happiness. Land, property, and a vehicle tend to come in exchange.',
      'mixed',
    ))
  }

  if (gender === 'female') {
    const refs = [
      seventh,
      moon ? signOf(moon.rashi, 7) : null,
      lord ? signOf(lord.rashi, 7) : null,
    ].filter((s): s is Rashi => s != null)
    if (refs.some(sign => influences(sun, sign) && influences(rahu, sign))) {
      combinations.push(note(
        'seventh-remarriage-sun-rahu',
        'Sun and Rahu on a 7th',
        'From the lagna, the Moon, or the 7th lord, the 7th is under both the Sun and Rahu. In a woman’s chart classical texts read a strong possibility of remarriage. They do not say how the first bond ends, and this does not mean a death is indicated.',
        'caution',
      ))
    }
    const ascDeg = chart.lagnas?.ascDegree
    if (typeof ascDeg === 'number' && Number.isFinite(ascDeg)) {
      const d30 = D30(ascDeg)
      if (d30 === 10 || d30 === 11) {
        combinations.push(note(
          'seventh-remarriage-d30',
          'Lagna in Saturn’s trimshamsha',
          'The ascendant degree falls in Saturn’s portion of D30. In a woman’s chart classical texts treat this placement as a strong sign of remarriage. How the first bond ends is a separate question the chart does not answer here.',
          'caution',
        ))
      }
    }
    if (saturn && saturn.isRetro && LORDS[signOf(asc, 11)] === 'Sa' && h(saturn) === 7) {
      combinations.push(note(
        'seventh-remarriage-retro-saturn',
        'Retrograde Saturn rules the 11th and sits in the 7th',
        'Both conditions are present: Saturn is retrograde, and Saturn is the 11th lord in the 7th. In a woman’s chart that pair is a classical sign of remarriage. Either condition alone does not make it.',
        'caution',
      ))
    }
    if (saturn && moon && mars && h(saturn) === 7 && h(moon) === 7 && h(mars) === 7) {
      combinations.push(note(
        'seventh-remarriage-three',
        'Saturn, Moon, and Mars in the 7th',
        'This remarriage yoga needs all three in the 7th, and all three are there. If one were missing, the yoga would not apply. It remains a tendency, not a certainty.',
        'caution',
      ))
    }
  }

  const maleficIn = (base: number, houses: number[]) =>
    houses.some(house => grahas.some(g => isMalefic(g.id) && houseOf(g.rashi, base) === house))
  const fromLagna = maleficIn(asc, [7, 8, 9])
  const fromMoon = !!moon && maleficIn(moon.rashi, [7, 8, 9])
  if (fromLagna && fromMoon) {
    combinations.push(note(
      'seventh-malefic-789',
      'Malefics in the 7th, 8th, or 9th from lagna and Moon',
      'A malefic sits in the 7th, 8th, or 9th counted from the lagna, and again counted from the Moon. Classical texts read that as strain around marriage, both before and after the wedding, with peace of mind being what is most tested.',
      'caution',
    ))
  }

  if (saturn && h(saturn) === 9) {
    combinations.push(note(
      'seventh-saturn-ninth',
      'Saturn in the 9th',
      `Saturn occupies the 9th${saturn.dignity === 'exalted' ? ', exalted' : ''}. Dignity does not cancel this D1 rule. Classical texts read difficulties in married life for a man or a woman. This is a rule of the main chart (D1), not of the Navamsha.`,
      'caution',
    ))
  }

  const eighthHits: string[] = []
  const eighthSign = (base: number) => signOf(base, 8)
  const hit = (base: number) => grahas.some(g => isMalefic(g.id) && g.rashi === eighthSign(base))
  if (hit(asc)) eighthHits.push('the lagna')
  if (moon && hit(moon.rashi)) eighthHits.push('the Moon')
  if (venus && hit(venus.rashi)) eighthHits.push('Venus')
  if (eighthHits.length) {
    combinations.push(note(
      'seventh-eighth-private',
      'A malefic in an 8th of private life',
      `The 8th from ${eighthHits.join(', ')} holds a malefic. Classical texts read the intensity of private life from these three 8ths together, not from the lagna alone. In plain terms, private life may be intense or unconventional, which is a tendency and not a judgment.`,
      'mixed',
    ))
  }

  if (atWar(lagnaLord, lord)) {
    combinations.push(note(
      'seventh-yuddha',
      'Lagna lord and 7th lord are in planetary war',
      `${lagnaLord ? gn(lagnaLord.id) : 'The lagna lord'} and ${lord ? gn(lord.id) : 'the 7th lord'} are within a degree in the same sign. Classical texts call this planetary war (two planets within a degree) and see it as unfavourable for marriage, whichever planet is ahead.`,
      'caution',
    ))
  }

  const d9Saturn = find(d9, 'Sa')
  if (d9Asc && d9Saturn && houseOf(d9Saturn.rashi, d9Asc) === 7) {
    combinations.push(note(
      'seventh-d9-saturn',
      'Saturn in the 7th of D9',
      'Navamsha Saturn in the 7th leans toward an unconventional marriage: caste, religion, age, or circumstance. The later difficulty classical texts name is trust.',
      'caution',
    ))
  }

  if (venus?.rashi === 3) {
    combinations.push(note(
      'seventh-venus-gemini',
      'Venus in Gemini',
      'Professionally this Venus can climb, and the person is drawn to art, craft, and song. Married life is the part that may be strained. Career success does not by itself repair the marriage.',
      'caution',
    ))
  } else if (venus && AIR.has(venus.rashi)) {
    combinations.push(note(
      'seventh-venus-air',
      'Venus in an air sign',
      `Venus is in ${rn(venus.rashi)}. Libra and Aquarius are the air signs classical texts call workable for marriage.`,
      'supportive',
    ))
  }

  if (venus && weak(venus) && venus.dignity === 'debilitated') {
    const vh = h(venus)
    if (vh != null && (KENDRA.has(vh) || TRIKONA.has(vh))) {
      combinations.push(note(
        'seventh-venus-fallen-angle',
        'Fallen Venus in a kendra or trikona',
        `Venus is debilitated in the ${ordinal(vh)}. The fall is real, yet classical texts still give good marriage results from a kendra (angular house) or a trikona (trine). Venus should not be written off for the debilitation alone.`,
        'mixed',
      ))
    }
  }

  if (venus?.nakshatraIndex === 21) {
    const balanced = (!!jupiter && sees(jupiter, venus)) || grahas.some(g => g.id !== 'Ve' && g.rashi === venus.rashi && isBenefic(g))
    combinations.push(note(
      'seventh-venus-shravana',
      'Venus in Shravana',
      `Venus in Shravana reduces marital bliss. ${balanced ? 'A benefic is with Venus or Jupiter sees it, so the reduction is softened.' : 'No balancing planet is on Venus, so the reduction stands.'}`,
      balanced ? 'mixed' : 'caution',
    ))
  }

  if (sun && venus && sun.rashi === venus.rashi && (sun.rashi === 1 || sun.rashi === 5)) {
    const running = path[1]?.lord === 'Su' || path[1]?.lord === 'Ve'
    combinations.push(note(
      'seventh-sun-venus-fire',
      'Sun and Venus together in a fire sign',
      `The Sun and Venus are together in ${rn(sun.rashi)}. Sagittarius is excluded from this rule. ${running ? 'Their antardasha is running, which is when classical texts read marriage strain building toward a break.' : 'When the Sun or Venus becomes the antardasha, classical texts read marriage strain building toward a break.'} This is a tendency, not a certainty.`,
      'caution',
    ))
  }

  const dk = grahas.find(g => g.charaKaraka === 'DK')
  if (dk && h(dk) === 8) {
    combinations.push(note(
      'seventh-dk-eighth',
      'Darakaraka in the 8th',
      `${gn(dk.id)} is the darakaraka (the planet that signifies the spouse) and sits in the 8th. The Jaimini system reads difficulties for the marriage from that seat. A transit of Jupiter, or Jupiter and Saturn together, onto the darakaraka by Jaimini aspect is the timing mark. No transit date can be given from the natal position alone.`,
      'caution',
    ))
  }

  if (grahas.some(g => isMalefic(g.id) && [3, 6, 11].includes(houseOf(g.rashi, asc)))) {
    combinations.push(note(
      'seventh-upachaya-malefic',
      'Malefics in the 3rd, 6th, or 11th',
      'A malefic in the 3rd, 6th, or 11th is not a cause for worry. These are growth houses (upachaya: 3rd, 6th, 11th), where a malefic tends to do well over time. It does not point to trouble in marriage.',
      'supportive',
    ))
  }

  const trikonaBenefics = [1, 5, 9].filter(house => grahas.some(g => isBenefic(g) && h(g) === house))
  if (trikonaBenefics.length >= 2) {
    combinations.push(note(
      'seventh-trikona-benefic',
      'Benefics in the trines',
      `Benefics occupy the ${trikonaBenefics.map(ordinal).join(' and ')}. Classical texts read that as support for a happy married life.`,
      'supportive',
    ))
  }

  if (gender === 'female' && chart.vargaLagnas?.D4 && path.length) {
    const d4Asc = chart.vargaLagnas.D4
    const d4 = chart.vargas?.D4
    const tied = path.slice(0, 3).some(p => {
      const g = find(d4, p.lord as GrahaId)
      if (!g) return LORDS[signOf(d4Asc, 4)] === p.lord || LORDS[signOf(d4Asc, 10)] === p.lord
      const house = houseOf(g.rashi, d4Asc)
      return house === 4 || house === 10 || LORDS[signOf(d4Asc, 4)] === p.lord || LORDS[signOf(d4Asc, 10)] === p.lord
    })
    if (tied) {
      combinations.push(note(
        'seventh-d4-disturbance',
        'D4’s 4th or 10th is in this period',
        `For a woman the wedding disturbs the 4th (home and settled life). In the Chaturthamsha (D4) chart, the running period ${path.slice(0, 3).map(p => gn(p.lord)).join(' → ')} ties to the 4th or the 10th. This is usually visible by the third level of the dasha (pratyantar), and a finer period is rarely needed.`,
        'mixed',
      ))
    }
  }

  const occupiedBy = (houses: number[], ids: GrahaId[]) =>
    houses.filter(house => grahas.some(g => ids.includes(g.id) && h(g) === house))
  const heavy = (house: number) => grahas.some(g => (g.id === 'Sa' || g.id === 'Ma' || g.id === 'Me') && h(g) === house)
  const normalHits = [
    ![1, 7, 2, 8].some(heavy),
    !grahas.some(g => isBenefic(g) && g.isRetro),
    !!venus && !venus.isCombust,
    gender === 'male' && !!moon && [1, 2, 3, 7, 8, 9].includes(h(moon)!),
    gender === 'female' && !!sun && [1, 2, 3, 7, 8, 9].includes(h(sun)!),
    moon?.isWaxingMoon === true && (h(moon) === 5 || h(moon) === 7),
    !!venus && WATER.has(venus.rashi) && grahas.some(g => g.id !== 'Ve' && g.rashi === venus.rashi),
  ].filter(Boolean).length

  const manglik = !!mars && [1, 4, 7, 8, 12].includes(h(mars)!)
  const twelfthDouble = grahas.some(g => isMalefic(g.id) && h(g) === 12) && grahas.some(g => isMalefic(g.id) && h(g) !== 12 && aspects(g, signOf(asc, 12)))
  const venusSeventhAfflicted = !!venus && grahas.some(g => isMalefic(g.id) && (g.rashi === signOf(venus.rashi, 7) || aspects(g, signOf(venus.rashi, 7))))
  const delayHits = [
    occupiedBy([1, 7, 2, 8], ['Sa', 'Ma']).length >= 2,
    !!lord && (dignified(lord.dignity) || lord.dignity === 'friend' || lord.dignity === 'great_friend') && maleficsOn(lord).length > 0,
    grahas.some(g => isBenefic(g) && g.isRetro),
    !!venus?.isCombust,
    manglik,
    twelfthDouble,
    venusSeventhAfflicted,
  ].filter(Boolean).length

  const sunMoonClose = !!sun && !!moon && sun.rashi === moon.rashi && (
    typeof sun.lonSidereal !== 'number' || typeof moon.lonSidereal !== 'number' || Math.abs(sun.lonSidereal - moon.lonSidereal) <= 10 || Math.abs(sun.lonSidereal - moon.lonSidereal) >= 350
  )
  const eighthLord = find(grahas, LORDS[signOf(asc, 8)])
  const lateHits = [
    sunMoonClose || (!!sun && !!moon && weak(sun) && weak(moon)),
    !!saturn && dignified(saturn.dignity) && (KENDRA.has(h(saturn)!) || aspects(saturn, seventh)),
    gender === 'male' && !!saturn && !!venus && sees(saturn, venus),
    gender === 'female' && !!mars && weak(mars),
    !!lagnaLord && h(lagnaLord) === 12,
    lordHouse === 8 || h(eighthLord) === 7,
  ].filter(Boolean).length

  let band: MarriageAgeBand = 'open'
  if (lateHits >= 3) band = 'late'
  else if (delayHits >= 3) band = 'delayed'
  else if (normalHits >= 4) band = 'timely'

  if (band === 'timely') {
    timing.push(note(
      'seventh-band-timely',
      'The conditions of a timely marriage',
      'Enough of the timely set is present: the lagna, 2nd, 7th, and 8th are not under Saturn, Mars, or Mercury together, Venus is not combust, and the Moon or Sun placement suited to the person’s gender, or a waxing Moon, is cooperating. Classical texts place this band around 21 to 28. It is a band, not a birthday.',
      'supportive',
    ))
  } else if (band === 'delayed') {
    timing.push(note(
      'seventh-band-delayed',
      'The conditions of a delayed marriage',
      `Several delay marks are present: malefics on the marriage houses, a strong but afflicted 7th lord, retrograde benefics, combust Venus, a doubled 12th, or the 7th from Venus under pressure. Classical texts place this band around 28 to 32. ${manglik ? 'Mars is in a manglik house, whose heat is said to ease after about 28.' : ''}`,
      'mixed',
    ))
  } else if (band === 'late') {
    timing.push(note(
      'seventh-band-late',
      'Very late, or not at all',
      'The late set is active: the Sun and Moon are crowded or both weak, Saturn is heavy, the lagna lord is in the 12th, or the 7th and 8th lords have swapped seats. In a man’s chart Saturn on Venus belongs here. In a woman’s chart a weak Mars belongs here. Classical texts read either a marriage after about 35, or a life that stays unmarried by choice or circumstance. Both remain open until the dasha supports one of them.',
      'caution',
    ))
  }

  const flags: SeventhLordFlags = {
    lordHouse,
    exchange,
    band,
    jupiterSeventh: h(jupiter) === 7,
    saturnNinth: h(saturn) === 9,
  }

  const headline = exchange
    ? 'Rising sign and marriage house have traded ruling planets'
    : lordHouse === 4
      ? 'Marriage-house lord in the 4th can bring comfort at home'
      : lordHouse === 12
        ? 'Marriage-house lord in the 12th opens more than one bond'
        : band === 'late'
          ? 'The marriage clock sits in the late age band'
          : lord
            ? `${gn(lord.id)} carries the marriage house from the ${ordinal(lordHouse ?? 0)}`
            : 'The planet ruling the marriage house is not on this chart'

  const summary = lord
    ? `${gn(lord.id)} rules the marriage house (7th) from ${rn(seventh)} and sits in ${rn(lord.rashi)}. ${band === 'open' ? 'The age band is not decisive from the marks on this chart.' : band === 'timely' ? 'The timely age band has the stronger count.' : band === 'delayed' ? 'The delayed age band has the stronger count.' : 'The late age band has the stronger count.'}`
    : 'Without the planet ruling the marriage house (7th), those house results cannot be read.'

  return { headline, summary, principles: SEVENTH_LORD_PRINCIPLES, placement, combinations, timing, flags }
}

export function compareSeventhLord(
  a: SeventhLordReading,
  b: SeventhLordReading,
  nameA: string,
  nameB: string,
): MarriedLifeNote[] {
  const notes: MarriedLifeNote[] = []
  if (a.flags.band !== 'open' && b.flags.band !== 'open' && a.flags.band !== b.flags.band) {
    notes.push(note(
      'seventh-pair-band',
      'The marriage clocks are in different bands',
      `${nameA} sits in the ${a.flags.band} band and ${nameB} in the ${b.flags.band} band. A match is still possible, though classical texts would not call it the smooth, same-year kind.`,
      'mixed',
    ))
  } else if (a.flags.band !== 'open' && a.flags.band === b.flags.band) {
    notes.push(note(
      'seventh-pair-band',
      'The marriage clocks agree',
      `${nameA} and ${nameB} both fall in the ${a.flags.band} band. Timing pressure is shared rather than carried by one chart.`,
      a.flags.band === 'late' ? 'caution' : 'supportive',
    ))
  }
  if (a.flags.saturnNinth && b.flags.saturnNinth) {
    notes.push(note(
      'seventh-pair-saturn-ninth',
      'Both charts have Saturn in the 9th',
      'Saturn in the 9th troubles married life in a man’s chart and a woman’s chart. Both people bring that D1 mark.',
      'caution',
    ))
  }
  return notes
}
