// src/lib/engine/marriageVivah.ts
// Marriage method from the Venus–Jupiter case class.
// A note appears only when that mark is on the chart.
// Harm is read from Mars. A bond is not a debt.
// A mental-crisis mark asks for a clinician. It does not forecast self-harm.
// Pure engine — no React/DB.

import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_LORDS, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import type { LifeTone, MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'

export type HarmChannel = 'body' | 'speech' | 'sexual' | 'work'

export interface MarriageVivahFlags {
  marsHarm: boolean
  channels: HarmChannel[]
  mercuryReplay: boolean
  starExchange: boolean
  punarvasu: boolean
  laterBond: boolean
  bandhan: boolean
  transformationChain: boolean
  serviceChain: boolean
  blind: boolean
  guidesOthers: boolean
  crisis: boolean
  jupiterHolds: boolean
}

export interface MarriageVivahReading {
  headline: string
  summary: string
  principles: string
  harm: MarriedLifeNote[]
  pattern: MarriedLifeNote[]
  debt: MarriedLifeNote[]
  flags: MarriageVivahFlags
}

const LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const DUSTHANA = new Set([6, 8, 12])
const KETU_NAK = new Set([0, 9, 18])
const DIGNIFIED: Dignity[] = ['exalted', 'moolatrikona', 'own', 'friend', 'great_friend']
const ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

export const MARRIAGE_VIVAH_PRINCIPLES =
  'Venus is experience and closeness. Jupiter is meaning and the move from me to we. Closeness without Jupiter dries out. Jupiter without Venus is duty without warmth. Both weak is an immature bond, and a prominent Rahu amplifies it. Both strong can deepen. Harm inside a marriage is read from Mars alone: the body when Mars sees the 1st, speech when Mars sees the 2nd, and sexual harm when that Mars is weak and on the marriage. Saturn can delay or deny. It does not describe abuse. A later marriage is still Venus, and Venus has to meet the spouse’s house. The 9th is the second-bond house. The star gives direction and the period gives time. Punarvasu repeats the same shape. A star exchange swaps the two planets’ significations. The 8th is marital longevity and the 9th is fortune, so an exchange between them disturbs the longevity with what should have been a blessing. Every marriage is a bond. A debt is extra. The birth chart is the event. Navamsha is maturity, and it stays quiet until guidance or practice wakes it. About seven years pass before the two karmas intertwine. The reading moves from the rising sign to houses 2, 4, 5, 7, 8, and 9, the marriage lord and the glances on the 7th, then the Navamsha, the period, and the transit.'

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

function ordinal(n: number): string {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
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

function nakLord(g: GrahaData | undefined): GrahaId | null {
  if (!g || typeof g.nakshatraIndex !== 'number') return null
  return NAKSHATRA_LORDS[g.nakshatraIndex] ?? null
}

function nakName(g: GrahaData | undefined): string | null {
  if (!g || typeof g.nakshatraIndex !== 'number') return null
  return NAKSHATRA_NAMES[g.nakshatraIndex] ?? null
}

function nakIndexFromLon(lon: number): number {
  const x = ((lon % 360) + 360) % 360
  return Math.min(26, Math.floor((x * 27) / 360))
}

function weakMars(mars: GrahaData, grahas: GrahaData[]): boolean {
  if (mars.dignity === 'debilitated' || mars.dignity === 'enemy' || mars.dignity === 'great_enemy' || mars.isCombust) return true
  return grahas.some(g => (g.id === 'Ra' || g.id === 'Ke') && g.rashi === mars.rashi)
}

function jupiterHolds(jupiter: GrahaData, asc: number, grahas: GrahaData[]): boolean {
  if (jupiter.isCombust) return false
  if (jupiter.dignity === 'debilitated' || jupiter.dignity === 'enemy' || jupiter.dignity === 'great_enemy') return false
  if (!jupiter.dignity || !DIGNIFIED.includes(jupiter.dignity)) return false
  if (DUSTHANA.has(houseOf(jupiter.rashi, asc))) return false
  if (grahas.some(g => (g.id === 'Ra' || g.id === 'Ke') && g.rashi === jupiter.rashi)) return false
  return true
}

function emptyFlags(): MarriageVivahFlags {
  return {
    marsHarm: false,
    channels: [],
    mercuryReplay: false,
    starExchange: false,
    punarvasu: false,
    laterBond: false,
    bandhan: false,
    transformationChain: false,
    serviceChain: false,
    blind: false,
    guidesOthers: false,
    crisis: false,
    jupiterHolds: false,
  }
}

export function analyzeMarriageVivah(chart: ChartOutput | null | undefined): MarriageVivahReading | null {
  const asc = chart?.lagnas?.ascRashi
  if (!chart || !asc) return null

  const grahas = chart.grahas ?? []
  const seventh = signOf(asc, 7)
  const lord = find(grahas, LORDS[seventh])
  const lagnaLord = find(grahas, LORDS[asc])
  const mars = find(grahas, 'Ma')
  const mercury = find(grahas, 'Me')
  const venus = find(grahas, 'Ve')
  const jupiter = find(grahas, 'Ju')
  const moon = find(grahas, 'Mo')
  const sun = find(grahas, 'Su')
  const d9 = chart.vargas?.D9
  const d9Asc = chart.vargaLagnas?.D9
  const flags = emptyFlags()
  const harm: MarriedLifeNote[] = []
  const pattern: MarriedLifeNote[] = []
  const debt: MarriedLifeNote[] = []

  if (mars) {
    const marsHouse = houseOf(mars.rashi, asc)
    const onSeventh = marsHouse === 7 || aspects(mars, seventh) || (!!lord && mars.rashi === lord.rashi)
    if (onSeventh && weakMars(mars, grahas)) {
      const channels: HarmChannel[] = []
      if (marsHouse === 7 || aspects(mars, asc)) channels.push('body')
      if (marsHouse === 7 || aspects(mars, signOf(asc, 2))) channels.push('speech')
      if (marsHouse === 7 || marsHouse === 8 || marsHouse === 12 || aspects(mars, signOf(asc, 8))) channels.push('sexual')
      if (marsHouse === 7 || marsHouse === 10 || aspects(mars, signOf(asc, 10))) channels.push('work')
      const withRahu = grahas.some(g => g.id === 'Ra' && (g.rashi === mars.rashi || aspects(mars, g.rashi)))
      const where = marsHouse === 7
        ? 'Mars sits in the marriage house'
        : lord && mars.rashi === lord.rashi
          ? `Mars sits with ${gn(lord.id)}, the marriage lord`
          : 'Mars sees the marriage house'
      const how = mars.dignity === 'debilitated'
        ? 'debilitated'
        : mars.isCombust
          ? 'combust'
          : mars.dignity === 'enemy' || mars.dignity === 'great_enemy'
            ? 'in a hostile sign'
            : 'with a node'
      const channelText = channels.length
        ? `The channels open here are ${channels.map(c => c === 'sexual' ? 'sexual harm' : c === 'body' ? 'the body' : c === 'speech' ? 'speech' : 'the work').join(', ')}.`
        : 'The link is the marriage lord, without a separate glance to the body or the speech.'
      flags.marsHarm = true
      flags.channels = channels
      harm.push(note(
        'vivah-mars',
        'Mars is the harm indicator',
        `${where}, and it is ${how}. Mars is the planet this method uses for abuse inside a marriage. Saturn can delay or deny the bond. It does not describe abuse. Rahu can obsess, and the act is still Mars. ${channelText}${withRahu ? ' Rahu is with that Mars, which makes the same reading sharper.' : ''} A dignified Mars can be courage. This Mars is not that.`,
        'caution',
      ))

      if (channels.includes('work')) {
        const vipreet = [6, 8, 12].some(house => {
          const dusthanaLord = find(grahas, LORDS[signOf(asc, house)])
          if (!dusthanaLord) return false
          const placed = houseOf(dusthanaLord.rashi, asc)
          return placed !== house && DUSTHANA.has(placed)
        })
        harm.push(note(
          'vivah-work',
          'The same Mars touches the work',
          `Mars also reaches the 10th. The marriage difficulty touches the career.${vipreet ? ' The lord of a difficult house (6th, 8th, or 12th) sits in another such house, so the work can still rise through that adversity. The career is where the person can save themselves when the bond cannot.' : ' The work is touched. It is not cancelled by that glance alone.'}`,
          vipreet ? 'mixed' : 'caution',
        ))
      }
    }
  }

  if (mercury?.isRetro) {
    const mercuryHouse = houseOf(mercury.rashi, asc)
    const linked = [2, 6, 7, 8].includes(mercuryHouse) || aspects(mercury, seventh) || (!!lord && mercury.rashi === lord.rashi)
    if (linked) {
      flags.mercuryReplay = true
      const family = mercuryHouse === 2 || mercuryHouse === 6 || mercuryHouse === 8
      harm.push(note(
        'vivah-mercury',
        'Retrograde Mercury replays the charges',
        `Mercury is retrograde in the ${ordinal(mercuryHouse)} house. On a marriage, that replays old charges: what was done, what the parents are like, a comparison with an earlier partner. The partner can cast themselves as the injured one.${family ? ' In this house the partner’s family can carry more of that story than the partner does.' : ''} This is harm by speech, beside whatever Mars is doing.`,
        'caution',
      ))
    }
  }

  const exchanges: Array<[GrahaData, GrahaData]> = []
  for (let i = 0; i < ORDER.length; i += 1) {
    for (let j = i + 1; j < ORDER.length; j += 1) {
      const a = find(grahas, ORDER[i])
      const b = find(grahas, ORDER[j])
      if (!a || !b) continue
      if (nakLord(a) === b.id && nakLord(b) === a.id) exchanges.push([a, b])
    }
  }
  const focus = new Set<GrahaId>([lord?.id, lagnaLord?.id, 'Mo', 'Ve', 'Ju', 'Ra', 'Ke'].filter((id): id is GrahaId => !!id))
  const relevant = exchanges.filter(([a, b]) => {
    const ha = houseOf(a.rashi, asc)
    const hb = houseOf(b.rashi, asc)
    return focus.has(a.id) || focus.has(b.id) || [1, 7, 8, 9].includes(ha) || [1, 7, 8, 9].includes(hb)
  }).slice(0, 3)

  if (relevant.length) flags.starExchange = true
  for (const [a, b] of relevant) {
    const ha = houseOf(a.rashi, asc)
    const hb = houseOf(b.rashi, asc)
    const fortune = (ha === 8 && hb === 9) || (ha === 9 && hb === 8)
    const moonKetu = (a.id === 'Mo' && b.id === 'Ke') || (a.id === 'Ke' && b.id === 'Mo')
    pattern.push(note(
      `vivah-exchange-${a.id}-${b.id}`,
      `${gn(a.id)} and ${gn(b.id)} exchange stars`,
      `${gn(a.id)} sits in ${nakName(a) ?? 'a star'} of ${gn(b.id)}, house ${ha}. ${gn(b.id)} sits in ${nakName(b) ?? 'a star'} of ${gn(a.id)}, house ${hb}. What one signifies passes to the other.${fortune ? ' These are the 8th and the 9th: marital longevity and fortune. The blessing disturbs the longevity of the marriage.' : ''}${moonKetu ? ' Emotion and the mother mix with Ketu’s detachment. A child can bring that earlier wound back into the room.' : ''}`,
      fortune || moonKetu ? 'caution' : 'mixed',
    ))
  }

  const ascDegree = chart.lagnas?.ascDegree
  if (typeof ascDegree === 'number' && Number.isFinite(ascDegree)) {
    const idx = nakIndexFromLon(ascDegree)
    const starLordId = NAKSHATRA_LORDS[idx]
    const starLord = find(grahas, starLordId)
    const sub = nakLord(starLord)
    if (starLord && sub) {
      const placed = houseOf(starLord.rashi, asc)
      if (sub === 'Ke' || sub === 'Ra' || DUSTHANA.has(placed) || starLord.dignity === 'debilitated') {
        pattern.push(note(
          'vivah-lagna-star',
          'The rising star carries its lord’s condition',
          `The rising sign is in ${NAKSHATRA_NAMES[idx]}, a star of ${gn(starLordId)}. ${gn(starLordId)} sits in the ${ordinal(placed)} house${nakName(starLord) ? `, in ${nakName(starLord)}` : ''}, ruled by ${gn(sub)}. The personality carries that condition into the marriage. It is not only a house story.`,
          sub === 'Ke' || sub === 'Ra' || DUSTHANA.has(placed) ? 'caution' : 'mixed',
        ))
      }
    }
  }

  const seventhOccupants = grahas.filter(g => houseOf(g.rashi, asc) === 7)
  const punarSources = [mars, venus, lord, ...seventhOccupants].filter((g): g is GrahaData => !!g && g.nakshatraIndex === 6)
  const punarIds = [...new Set(punarSources.map(g => g.id))]
  if (punarIds.length) {
    flags.punarvasu = true
    pattern.push(note(
      'vivah-punarvasu',
      'Punarvasu repeats the same shape',
      `${punarIds.map(gn).join(' and ')} ${punarIds.length > 1 ? 'are' : 'is'} in Punarvasu. That star means the same thing returns. A later bond tends to repeat the shape of the earlier one unless Jupiter is actually giving the marriage a new direction.`,
      'caution',
    ))
  }

  const ninthLord = find(grahas, LORDS[signOf(asc, 9)])
  const laterReason = lord && houseOf(lord.rashi, asc) === 9
    ? `${gn(lord.id)}, the marriage lord, is in the 9th`
    : venus && houseOf(venus.rashi, asc) === 9
      ? 'Venus is in the 9th'
      : ninthLord && houseOf(ninthLord.rashi, asc) === 7
        ? `${gn(ninthLord.id)}, the 9th lord, is in the marriage house`
        : ninthLord && venus && ninthLord.rashi === venus.rashi
          ? `${gn(ninthLord.id)}, the 9th lord, sits with Venus`
          : ninthLord && lord && ninthLord.id !== lord.id && ninthLord.rashi === lord.rashi
            ? `${gn(ninthLord.id)}, the 9th lord, sits with the marriage lord`
            : null
  if (laterReason) {
    flags.laterBond = true
    const venusStar = nakName(venus)
    pattern.push(note(
      'vivah-later',
      'A later bond is still read from Venus',
      `${laterReason}. Any later marriage — second or after — is read from Venus, and Venus has to meet the spouse’s house. The 9th is the second-bond house. ${venus ? `Venus is in ${RASHI_NAMES[venus.rashi]}${venusStar ? `, ${venusStar}` : ''}, which is the direction.` : 'Venus is not on this chart, so the direction cannot be named.'} The period of Venus, or of its star lord, is the timing. This marks where to look. It does not by itself promise another wedding.`,
      'mixed',
    ))
  }

  if (jupiter && jupiterHolds(jupiter, asc, grahas)) {
    const linked = houseOf(jupiter.rashi, asc) === 7
      || aspects(jupiter, seventh)
      || (!!venus && (jupiter.rashi === venus.rashi || aspects(jupiter, venus.rashi)))
      || (!!lord && jupiter.rashi === lord.rashi)
    if (linked) {
      flags.jupiterHolds = true
      pattern.push(note(
        'vivah-jupiter-holds',
        'Jupiter can give the closeness a direction',
        'Jupiter is strong and it reaches the marriage. Its work is the move from me to we, a purpose larger than either person, and pleasure turned into a practice. Where that Jupiter is awake, an argument can stay constructive: one person understands, or is brought to understand, and trouble increases the closeness.',
        'supportive',
      ))
    }
  }

  if (lagnaLord && d9 && d9Asc && aspects(lagnaLord, asc)) {
    const d9Lord = find(d9, lagnaLord.id)
    if (d9Lord && houseOf(d9Lord.rashi, d9Asc) === 7) {
      flags.bandhan = true
      debt.push(note(
        'vivah-bandhan',
        'The soul bond chose a partner',
        `${gn(lagnaLord.id)} rules the rising sign, sees the rising sign, and in Navamsha sits in the 7th. The method reads a soul bond that chose a partner. Every marriage has a bond of this kind, made when a soul is tired of being alone. A debt is a separate chain, and it is not on every marriage.`,
        'mixed',
      ))
    }
  }

  const eighthLord = find(grahas, LORDS[signOf(asc, 8)])
  const fifthLord = find(grahas, LORDS[signOf(asc, 5)])
  if (lord && eighthLord && houseOf(lord.rashi, asc) === 8 && houseOf(eighthLord.rashi, asc) === 6) {
    flags.transformationChain = true
    debt.push(note(
      'vivah-rin-transform',
      'One debt is transformation paid as service',
      `${gn(lord.id)}, the marriage lord, is in the 8th, and ${gn(eighthLord.id)}, the 8th lord, is in the 6th. The method reads that chain as a debt of transformation paid as service. The bond can exist without this chain. Here the chain is present.`,
      'caution',
    ))
  }
  if (fifthLord && ninthLord && houseOf(fifthLord.rashi, asc) === 6 && houseOf(ninthLord.rashi, asc) === 6) {
    flags.serviceChain = true
    debt.push(note(
      'vivah-rin-service',
      'A later debt can be service alone',
      `${gn(fifthLord.id)} rules the 5th and ${gn(ninthLord.id)} rules the 9th, and both sit in the 6th. The method reads a later bond whose debt is service, without the 8th-house transformation in front of it.`,
      'mixed',
    ))
  }

  const d9Venus = find(d9, 'Ve')
  const d9Rahu = find(d9, 'Ra')
  if (d9Venus && d9Rahu && d9Venus.rashi === d9Rahu.rashi) {
    debt.push(note(
      'vivah-d9-service',
      'Navamsha repeats a service debt',
      `In Navamsha, Venus and Rahu are together${d9Venus.rashi === 7 ? ' in Libra, Venus’s own sign' : ` in ${RASHI_NAMES[d9Venus.rashi]}`}. That confirms a debt paid through relationship and service, not only through the birth chart.`,
      'mixed',
    ))
  }

  const moonOnKetu = !!moon && typeof moon.nakshatraIndex === 'number' && KETU_NAK.has(moon.nakshatraIndex)
  const moonKetuExchange = exchanges.some(([a, b]) => (a.id === 'Mo' && b.id === 'Ke') || (a.id === 'Ke' && b.id === 'Mo'))
  const crisisMarked = !!lord && houseOf(lord.rashi, asc) === 8 && (moonOnKetu || moonKetuExchange)
  const moonInEighth = !!moon && houseOf(moon.rashi, asc) === 8
  const d9Sun = find(d9, 'Su')
  const sunInD9Eighth = !!d9Sun && !!d9Asc && houseOf(d9Sun.rashi, d9Asc) === 8
  if (moonInEighth && sunInD9Eighth) {
    flags.blind = true
    debt.push(note(
      'vivah-blind',
      'The person can see someone else’s marriage',
      'The Moon is in the 8th of the birth chart, and the Sun is in the 8th of Navamsha. The method reads someone who can advise another person’s marriage and cannot see their own. Ahead and behind, in their own bond, stay dark.',
      'caution',
    ))
  } else if (!crisisMarked && (moonInEighth || (!!sun && houseOf(sun.rashi, asc) === 8))) {
    debt.push(note(
      'vivah-dim',
      'One’s own marriage is seen through the 8th',
      `${moonInEighth ? 'The Moon is in the 8th.' : 'The Sun is in the 8th.'} Marriage is seen through crisis and what is hidden. Judgment about one’s own bond is the part that goes dim.`,
      'mixed',
    ))
  }

  if (LORDS[signOf(asc, 3)] === 'Ju' && LORDS[signOf(asc, 12)] === 'Ju' && jupiter && typeof jupiter.nakshatraIndex === 'number' && KETU_NAK.has(jupiter.nakshatraIndex)) {
    flags.guidesOthers = true
    debt.push(note(
      'vivah-guides',
      'Guides others, and not the self',
      `Jupiter rules both the 3rd and the 12th and sits in ${nakName(jupiter) ?? 'a star of Ketu'}. The method reads someone who can heal and guide other people and cannot do the same for themselves. A teacher’s initiation belongs to this pattern.`,
      'mixed',
    ))
  }

  if (crisisMarked) {
    flags.crisis = true
    debt.push(note(
      'vivah-crisis',
      'The mind can lose its footing in the marriage',
      'The marriage lord is in the 8th, and the Moon is tied to Ketu. The method reads detachment, crisis, and a loss of safety inside the marriage. Bring in a clinician. This is not a forecast that the person will harm themselves. If someone is in immediate danger, contact local emergency services or the 988 Suicide and Crisis Lifeline.',
      'caution',
    ))
  }

  if (flags.marsHarm || flags.crisis) {
    harm.push(note(
      'vivah-counsel',
      'This part needs support, not a remedy',
      'Where harm is marked, or the mind is in crisis, steady support from outside the couple matters most, and it helps to repeat it. The same words from the partner often do not land. A remedy is not the tool for this part. A clinician comes before any astrological guidance when the crisis mark is present.',
      'mixed',
    ))
  }

  const marks = [
    flags.marsHarm ? 'Mars as harm' : '',
    flags.mercuryReplay ? 'retrograde Mercury' : '',
    flags.starExchange ? 'a star exchange' : '',
    flags.punarvasu ? 'Punarvasu repetition' : '',
    flags.laterBond ? 'a later-bond house' : '',
    flags.bandhan ? 'a confirmed soul bond' : '',
    flags.transformationChain ? 'a transformation debt' : '',
    flags.serviceChain ? 'a service debt' : '',
    flags.blind ? 'blindness in one’s own marriage' : '',
    flags.guidesOthers ? 'guidance that does not turn inward' : '',
    flags.crisis ? 'a crisis of the mind' : '',
    flags.jupiterHolds ? 'Jupiter holding the direction' : '',
  ].filter(Boolean)

  const headline = flags.crisis
    ? 'The marriage can put the mind in crisis'
    : flags.marsHarm
      ? 'Mars on the marriage is the harm indicator'
      : flags.transformationChain || flags.serviceChain
        ? 'A marriage debt is present, separate from the bond'
        : flags.blind
          ? 'The person sees marriage more clearly for other people'
          : flags.jupiterHolds && marks.length === 1
            ? 'Jupiter reaches the marriage and can give it a direction'
            : marks.length
              ? 'The marriage method has marks on this chart'
              : 'The marriage method has no extra mark on this chart'

  const summary = marks.length
    ? `On this chart: ${marks.join(', ')}.`
    : 'Mars is not the harm indicator here, and the debt chains, the star exchange, and Punarvasu are not on the marriage.'

  return { headline, summary, principles: MARRIAGE_VIVAH_PRINCIPLES, harm, pattern, debt, flags }
}

export function compareMarriageVivah(
  a: MarriageVivahReading,
  b: MarriageVivahReading,
  nameA: string,
  nameB: string,
): MarriedLifeNote[] {
  const notes: MarriedLifeNote[] = []
  const marsWho = [a.flags.marsHarm ? nameA : '', b.flags.marsHarm ? nameB : ''].filter(Boolean)
  if (marsWho.length) {
    notes.push(note(
      'vivah-pair-mars',
      'Harm stays on the chart that has the weak Mars',
      `${marsWho.join(' and ')} ${marsWho.length > 1 ? 'carry' : 'carries'} Mars as the harm indicator on the marriage. The other chart does not erase it. That person is best supported from outside the couple.`,
      'caution',
    ))
  }
  const crisisWho = [a.flags.crisis ? nameA : '', b.flags.crisis ? nameB : ''].filter(Boolean)
  if (crisisWho.length) {
    notes.push(note(
      'vivah-pair-crisis',
      'A mental-crisis mark needs a clinician',
      `${crisisWho.join(' and ')} ${crisisWho.length > 1 ? 'have' : 'has'} the marriage lord in the 8th with the Moon tied to Ketu. Matching does not treat that. A clinician comes first. If someone is in immediate danger, contact local emergency services or the 988 Suicide and Crisis Lifeline.`,
      'caution',
    ))
  }
  return notes
}
