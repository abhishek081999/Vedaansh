// src/lib/engine/karmicDebt.ts
// Karma-rina in marriage. A note appears only when that mark is on the chart.
// The bond ending is not read as a death. No remedy is offered for this debt.
// Pure engine — no React/DB.

import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { gName, pick, rName } from '@/lib/engine/divisionalLang'
import { KD_HI } from '@/lib/engine/locale/karmicDebt.hi'
import type { LifeTone, MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'

export interface KarmicDebtFlags {
  present: boolean
  marks: number
  complete: boolean
  saturnPays: boolean
  understanding: boolean
}

export interface KarmicDebtReading {
  headline: string
  summary: string
  principles: string
  debt: MarriedLifeNote[]
  release: MarriedLifeNote[]
  flags: KarmicDebtFlags
}

const LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const DIGNIFIED: Dignity[] = ['exalted', 'moolatrikona', 'own']

export const KARMIC_DEBT_PRINCIPLES =
  'A karmic debt in marriage is paid by one partner, by the other, or by both. It ends when the account is finished: the bond closes, or, if other debts remain, contact and shared work stop while the cord can still be felt. No remedy cancels this. Both charts have to be read.'

function houseOf(rashi: number, asc: number): number {
  return ((rashi - asc + 12) % 12) + 1
}

function signOf(asc: number, house: number): Rashi {
  return ((((asc - 1 + house - 1) % 12) + 1) as Rashi)
}

function rn(r: number, lang: EngineLang = 'en'): string {
  if (lang === 'en') return RASHI_NAMES[r as Rashi] ?? `R${r}`
  return rName(r as Rashi, lang) ?? `R${r}`
}

function gn(id: GrahaId | string, lang: EngineLang = 'en'): string {
  if (lang === 'en') return GRAHA_NAMES[id as GrahaId] ?? id
  return gName(id as GrahaId, lang)
}

function find(list: GrahaData[] | undefined, id: GrahaId): GrahaData | undefined {
  return list?.find(g => g.id === id)
}

function note(id: string, title: string, detail: string, tone: LifeTone): MarriedLifeNote {
  return { id, title, detail, tone }
}

function kdNote(
  id: string,
  titleKey: string,
  detailKey: string,
  tone: LifeTone,
  values: Record<string, string | number>,
): MarriedLifeNote {
  const row = KD_HI.notes[id as keyof typeof KD_HI.notes] as Record<string, string>
  return { id, title: fill(row[titleKey], values), detail: fill(row[detailKey], values), tone }
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

function influences(source: GrahaData | undefined, sign: number): boolean {
  if (!source) return false
  return source.rashi === sign || aspects(source, sign)
}

export function analyzeKarmicDebt(chart: ChartOutput | null | undefined, lang: EngineLang = 'en'): KarmicDebtReading | null {
  const asc = chart?.lagnas?.ascRashi
  if (!chart || !asc) return null

  const grahas = chart.grahas ?? []
  const seventh = signOf(asc, 7)
  const lord = find(grahas, LORDS[seventh])
  const venus = find(grahas, 'Ve')
  const rahu = find(grahas, 'Ra')
  const saturn = find(grahas, 'Sa')
  const d9 = chart.vargas?.D9
  const d9Asc = chart.vargaLagnas?.D9
  const path = chart.dashas?.vimshottari ? getDashaPathAt(chart.dashas.vimshottari) : []

  const h = (g: GrahaData | undefined) => (g ? houseOf(g.rashi, asc) : null)
  const ties = (planet: GrahaData | undefined, house: number): boolean => {
    if (!planet) return false
    const sign = signOf(asc, house)
    if (LORDS[sign] === planet.id) return true
    if (planet.rashi === sign) return true
    const houseLord = find(grahas, LORDS[sign])
    return !!houseLord && houseLord.id !== planet.id && houseLord.rashi === planet.rashi
  }

  const debt: MarriedLifeNote[] = []
  const release: MarriedLifeNote[] = []
  let marks = 0

  const venusRahu = !!venus && !!rahu && (venus.rashi === rahu.rashi || aspects(rahu, venus.rashi) || aspects(venus, rahu.rashi))
  if (venusRahu && venus && rahu) {
    marks += 1
    debt.push(lang === 'hi'
      ? kdNote('karma-venus-rahu', 'title', 'detail', 'caution', { ve: gn('Ve', lang), ra: gn('Ra', lang) })
      : note(
        'karma-venus-rahu',
        'Rahu is on Venus',
        `${gn('Ve')} and ${gn('Ra')} are in contact. This is a debt that feels like passion. Wanting and owing are hard to tell apart. Confusion about whether to marry, and the feeling “I cannot leave,” belong to this contact.`,
        'caution',
      ))
  }

  const rahuOnSeventh = !!rahu && (h(rahu) === 7 || (!!lord && rahu.rashi === lord.rashi))
  if (rahuOnSeventh) {
    marks += 1
    const occupies = rahu && h(rahu) === 7
    debt.push(lang === 'hi'
      ? kdNote(
        'karma-rahu-seventh',
        'title',
        occupies ? 'detailOccupies' : 'detailWithLord',
        'caution',
        {},
      )
      : note(
        'karma-rahu-seventh',
        'Rahu on the marriage',
        occupies
          ? 'Rahu occupies the 7th. The marriage itself is the account being paid. The bond can feel forced even when it was chosen.'
          : 'Rahu sits with the 7th lord. The person who carries the partnership also carries the debt. Obsessive attachment is the felt form.',
        'caution',
      ))
  }

  const maleficHouses = [6, 7, 8].filter(house => grahas.some(g => isMalefic(g.id) && h(g) === house))
  const houseLords = [6, 7, 8].map(house => find(grahas, LORDS[signOf(asc, house)]))
  const lordsJoined = houseLords.filter((a, i) => houseLords.some((b, j) => j > i && !!a && !!b && a.id !== b.id && a.rashi === b.rashi))
  const dashaHouses = [6, 7, 8].filter(house => path.slice(0, 2).some(p => ties(find(grahas, p.lord as GrahaId), house)))
  const heavy = maleficHouses.length >= 2 || lordsJoined.length > 0 || dashaHouses.length >= 2
  if (heavy) {
    marks += 1
    const howEn = maleficHouses.length >= 2
      ? `Malefics occupy the ${maleficHouses.map(n => (n === 6 ? '6th' : n === 7 ? '7th' : '8th')).join(' and ')}.`
      : lordsJoined.length
        ? 'The lords of the 6th, 7th, and 8th are sitting together.'
        : `The running period ties the ${dashaHouses.join(' and ')}.`
    const howHi = maleficHouses.length >= 2
      ? fill(KD_HI.dusthanaHow.malefics, { houses: maleficHouses.map(n => KD_HI.houseLabel[n]).join(' और ') })
      : lordsJoined.length
        ? KD_HI.dusthanaHow.lordsJoined
        : fill(KD_HI.dusthanaHow.dasha, { houses: dashaHouses.map(n => KD_HI.houseLabel[n]).join(' और ') })
    debt.push(lang === 'hi'
      ? kdNote('karma-dusthana', 'title', 'detail', 'caution', { how: howHi })
      : note(
        'karma-dusthana',
        'The 6th, 7th, and 8th are active together',
        `${howEn} The debt houses are heavily active: conflict, the marriage, and what is hidden under it. Bitterness, blame, and exhaustion are the ordinary texture. The relationship feels like a burden because it is one.`,
        'caution',
      ))
  }

  if (d9Asc) {
    const d9Seventh = signOf(d9Asc, 7)
    const d9Lord = lord ? find(d9, lord.id) : undefined
    const reflected = d9Seventh === seventh || (!!d9Lord && houseOf(d9Lord.rashi, d9Asc) === 7)
    const d9Ketu = find(d9, 'Ke')
    const d9SeventhLord = find(d9, LORDS[d9Seventh])
    const ketuOnD9 = !!d9Ketu && (
      houseOf(d9Ketu.rashi, d9Asc) === 7
      || aspects(d9Ketu, d9Seventh)
      || (!!d9SeventhLord && d9Ketu.rashi === d9SeventhLord.rashi)
    )
    if (reflected && !ketuOnD9) {
      marks += 1
      debt.push(lang === 'hi'
        ? kdNote('karma-d9-ketu', 'title', 'detail', 'caution', { sign: rn(d9Seventh, lang) })
        : note(
          'karma-d9-ketu',
          'Navamsha repeats the 7th, and Ketu is not cutting it',
          `The D9 7th is ${rn(d9Seventh)}, repeating the marriage account, and Ketu is not on that house or its lord. Without Ketu the soul chart keeps the bond instead of releasing it. The emotional cord can remain after the two have separated.`,
          'caution',
        ))
    }
  }

  const rahuSaturnPeriod = path.length >= 2 && (
    (path[0].lord === 'Ra' && path[1].lord === 'Sa') || (path[0].lord === 'Sa' && path[1].lord === 'Ra')
  )
  const bothOnSeventh = influences(rahu, seventh) && influences(saturn, seventh)
  if (rahuSaturnPeriod || bothOnSeventh) {
    marks += 1
    debt.push(lang === 'hi'
      ? kdNote(
        'karma-rahu-saturn',
        rahuSaturnPeriod ? 'titlePeriod' : 'titleBoth',
        rahuSaturnPeriod ? 'detailPeriod' : 'detailBoth',
        'caution',
        rahuSaturnPeriod
          ? { maha: gn(path[0].lord, lang), antar: gn(path[1].lord, lang) }
          : {},
      )
      : note(
        'karma-rahu-saturn',
        rahuSaturnPeriod ? 'A Rahu–Saturn period is running' : 'Rahu and Saturn both reach the 7th',
        rahuSaturnPeriod
          ? `${gn(path[0].lord)} mahadasha with ${gn(path[1].lord)} antardasha is when a debt marriage opens or comes due. Communication and shared work are what stop when the payment finishes.`
          : 'Rahu and Saturn both reach the 7th. Their periods are when this debt is triggered. Outside those periods the account is still there. It is not the event.',
        'caution',
      ))
  }

  const present = marks >= 2
  const sat2 = ties(saturn, 2)
  const sat4 = ties(saturn, 4)
  const sat8 = ties(saturn, 8)
  const saturnPays = sat2 && sat4 && sat8
  const activated = (house: number) => {
    const sign = signOf(asc, house)
    const houseLord = find(grahas, LORDS[sign])
    const beneficThere = grahas.some(g => isBenefic(g) && h(g) === house)
    const period = path.slice(0, 2).some(p => ties(find(grahas, p.lord as GrahaId), house))
    return beneficThere || (!!houseLord && dignified(houseLord.dignity) && !houseLord.isCombust) || period
  }
  const fifth = activated(5)
  const ninth = activated(9)
  const understanding = fifth && ninth
  const complete = saturnPays && understanding

  if (sat2 || sat4 || sat8) {
    const seatsEn = [sat2 ? '2nd' : '', sat4 ? '4th' : '', sat8 ? '8th' : ''].filter(Boolean)
    const seatsHi = [sat2 ? KD_HI.releaseSeats[2] : '', sat4 ? KD_HI.releaseSeats[4] : '', sat8 ? KD_HI.releaseSeats[8] : ''].filter(Boolean)
    release.push(lang === 'hi'
      ? kdNote(
        'karma-saturn-pay',
        saturnPays ? 'titleFull' : 'titlePart',
        saturnPays ? 'detailFull' : 'detailPart',
        saturnPays ? 'mixed' : 'caution',
        { seats: seatsHi.join(' और ') },
      )
      : note(
        'karma-saturn-pay',
        saturnPays ? 'Saturn is paying the debt through home, family, and the 8th' : 'Saturn has part of the payment',
        saturnPays
          ? 'Saturn is tied to the 2nd, the 4th, and the 8th. Family, the home, and the crisis house are all in the payment. That is the structural side of a debt being worked, not a sign that it has already finished.'
          : `Saturn reaches the ${seatsEn.join(' and ')}. The payment is complete only when Saturn covers the 2nd, the 4th, and the 8th. This is a part payment.`,
        saturnPays ? 'mixed' : 'caution',
      ))
  }

  if (fifth || ninth) {
    const fifthHi = fifth ? KD_HI.understanding.fifthOn : KD_HI.understanding.fifthOff
    const ninthHi = ninth ? KD_HI.understanding.ninthOn : KD_HI.understanding.ninthOff
    release.push(lang === 'hi'
      ? kdNote(
        'karma-understanding',
        understanding ? 'titleBoth' : 'titleOne',
        understanding ? 'detailBoth' : 'detailOne',
        understanding ? 'supportive' : 'mixed',
        understanding ? {} : { fifth: fifthHi, ninth: ninthHi },
      )
      : note(
        'karma-understanding',
        understanding ? 'Realization and a chosen understanding are both available' : 'Only one of the understanding houses is awake',
        understanding
          ? 'The 5th is the house of realization and the 9th is higher understanding that is acceptable rather than forced. Both are active. The debt can be seen for what it is.'
          : `${fifth ? 'The 5th is active, so realization is available.' : 'The 5th is quiet, so the debt is not yet understood.'} ${ninth ? 'The 9th is active, so a chosen view of the bond is available.' : 'The 9th is quiet, so whatever continues is closer to compulsion than to understanding.'}`,
        understanding ? 'supportive' : 'mixed',
      ))
  }

  if (present && complete) {
    release.push(lang === 'hi'
      ? kdNote('karma-complete', 'title', 'detail', 'mixed', {})
      : note(
        'karma-complete',
        'The debt has a way to finish',
        'Saturn covers the 2nd, 4th, and 8th, and the 5th and 9th are both active. The account can complete. Completion is the end of the charge, which may be separation or a bond that no longer feels owed. It is not a promise that the two stay.',
        'mixed',
      ))
  } else if (present) {
    release.push(lang === 'hi'
      ? kdNote('karma-open', 'title', 'detail', 'caution', {})
      : note(
        'karma-open',
        'The debt is still being paid',
        'The marriage marks of a karmic debt are present, and the completion set is not. No remedy substitutes for the payment. The cord, the guilt, and the blame continue until Saturn’s houses and the 5th and 9th have both done their work. If other debts remain when this one ends, what stops is communication and shared work. This does not indicate a death.',
        'caution',
      ))
  }

  if (!present && marks === 0) {
    debt.push(lang === 'hi'
      ? kdNote('karma-clear', 'title', 'detail', 'supportive', {})
      : note(
        'karma-clear',
        'This chart is not carrying the debt stack',
        'Rahu is not on Venus or the 7th, the 6th–7th–8th are not activated together, and a Rahu–Saturn marriage period is not the signature. One partner’s chart can still hold the debt. Both charts have to be read.',
        'supportive',
      ))
  } else if (!present) {
    debt.push(lang === 'hi'
      ? kdNote('karma-partial', 'title', 'detail', 'mixed', {})
      : note(
        'karma-partial',
        'One debt mark, not the full account',
        'A single mark is on the chart. Karmic debt in marriage is a stack, and one mark is not enough to call the marriage a debt. The other person’s chart still has to be read before deciding who, if anyone, is paying.',
        'mixed',
      ))
  } else {
    debt.unshift(lang === 'hi'
      ? kdNote('karma-account', 'title', 'detail', 'caution', {})
      : note(
        'karma-account',
        'This marriage is an account being paid',
        'Two or more debt marks are present. Someone is paying: this person, the partner, or both. The felt life of that payment is confusion about the decision, a forced quality, passion that will not release, bitterness, guilt, and blame. After a separation the cord can still be there. No remedy closes the account.',
        'caution',
      ))
  }

  const flags: KarmicDebtFlags = { present, marks, complete, saturnPays, understanding }
  const headline = lang === 'en'
    ? (present && complete
      ? 'A karmic debt is on this marriage, and it has a way to finish'
      : present
        ? 'This marriage is paying a karmic debt'
        : marks === 1
          ? 'One karmic-debt mark is present'
          : 'The karmic-debt stack is not on this chart')
    : (present && complete
      ? KD_HI.headlines.presentComplete
      : present
        ? KD_HI.headlines.present
        : marks === 1
          ? KD_HI.headlines.oneMark
          : KD_HI.headlines.clear)
  const summary = lang === 'en'
    ? (present
      ? `${marks} debt marks are present. ${complete ? 'Saturn’s payment houses and the 5th and 9th are both available, so the account can complete.' : 'The completion set is not together, so the payment is still open.'}`
      : marks === 1
        ? 'One mark is not the full debt. The other chart still has to be read.'
        : 'These debt combinations are absent here. The partner’s chart can still carry them.')
    : (present
      ? fill(complete ? KD_HI.summary.presentComplete : KD_HI.summary.presentOpen, { marks })
      : marks === 1
        ? KD_HI.summary.oneMark
        : KD_HI.summary.clear)

  return {
    headline,
    summary,
    principles: pick(KARMIC_DEBT_PRINCIPLES, KD_HI.principles, lang),
    debt,
    release,
    flags,
  }
}

export function compareKarmicDebt(
  a: KarmicDebtReading,
  b: KarmicDebtReading,
  nameA: string,
  nameB: string,
  lang: EngineLang = 'en',
): MarriedLifeNote[] {
  const notes: MarriedLifeNote[] = []
  if (a.flags.present && b.flags.present) {
    const completionEn = a.flags.complete && b.flags.complete
      ? 'Both also have a way for the account to finish.'
      : 'Where the completion set is missing, that person’s side of the debt is still open.'
    const completionHi = a.flags.complete && b.flags.complete ? KD_HI.completionBoth : KD_HI.completionOneOpen
    notes.push(lang === 'hi'
      ? kdNote('karma-pair-mutual', 'title', 'detail', 'caution', { nameA, nameB, completion: completionHi })
      : note(
        'karma-pair-mutual',
        'Both charts are paying',
        `${nameA} and ${nameB} each carry a karmic-debt stack. Both are paying. A remedy on one chart does not clear the other. ${completionEn}`,
        'caution',
      ))
  } else if (a.flags.present || b.flags.present) {
    const payer = a.flags.present ? nameA : nameB
    const other = a.flags.present ? nameB : nameA
    const done = (a.flags.present ? a : b).flags.complete
    const doneEn = done ? `${payer} also has a way for that payment to finish.` : 'The payment is still open, and no remedy on either chart cancels it.'
  notes.push(lang === 'hi'
      ? kdNote('karma-pair-one', 'title', 'detail', 'mixed', {
        payer,
        other,
        done: done ? fill(KD_HI.doneComplete, { payer }) : KD_HI.doneOpen,
      })
      : note(
        'karma-pair-one',
        `${payer} is carrying the debt`,
        `${payer}’s chart holds the debt stack. ${other}’s chart does not. ${payer} is paying into the marriage. ${doneEn} Both charts are needed for this.`,
        'mixed',
      ))
  } else {
    notes.push(lang === 'hi'
      ? kdNote('karma-pair-clear', 'title', 'detail', 'supportive', { nameA, nameB })
      : note(
        'karma-pair-clear',
        'Neither chart shows the full debt',
        `${nameA} and ${nameB} were both checked. Neither has two or more of the debt marks. A hard marriage between them is not, on these rules, an unpaid karmic account.`,
        'supportive',
      ))
  }
  return notes
}
