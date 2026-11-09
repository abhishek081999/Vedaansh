// src/lib/engine/partnerNature.ts
// The 7th describes how this person behaves in marriage and the partner
// the chart draws. Moon, Venus, Jupiter, Saturn, Rahu, Ketu, and Mars are
// read only when they actually touch that marriage. One chart is enough.
// The second chart confirms whose behavior is being described.
// Pure engine — no React/DB.

import type { ChartOutput, Dignity, Gender, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import type { LifeTone, MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'
import { DK_PLANET_PROFILES } from '@/lib/engine/jaiminiMarriageAnalysis'
import { dignityText, fill, pick, gName, rName, type EngineLang } from '@/lib/engine/divisionalLang'
import {
  APPEARANCE_BY_SIGN_HI,
  DIRECTION_BY_LORD_HOUSE_HI,
  FAMILY_BY_LORD_HOUSE_HI,
  PARTNER_NATURE_PRINCIPLES_HI,
  PN_TEXT_HI,
  WORK_HI,
} from '@/lib/engine/locale/partnerNature.hi'

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
  /** Appearance, family, direction, and DK portrait lines for classical predictions. */
  classical: MarriedLifeNote[]
  planets: MarriedLifeNote[]
  flags: PartnerNatureFlags
}

/** Soft appearance tone from the 7th sign — manner and look, not a medical claim. */
const APPEARANCE_BY_SIGN: Record<number, { title: string; detail: string }> = {
  1: { title: 'Partner manner — Aries 7th', detail: 'The partner tends to look and move with heat: athletic or restless presence, direct speech, and a face that shows drive more than stillness.' },
  2: { title: 'Partner manner — Taurus 7th', detail: 'The partner tends toward a steady, attractive build, a soft or measured voice, and a taste for comfort and beauty in how they present themselves.' },
  3: { title: 'Partner manner — Gemini 7th', detail: 'The partner tends toward a lively face, quick speech, and a youthful or dual manner — witty, changeable, and hard to pin to one look.' },
  4: { title: 'Partner manner — Cancer 7th', detail: 'The partner tends toward a soft, moonlit presence: rounder features, caring eyes, and a manner that protects home and feeling.' },
  5: { title: 'Partner manner — Leo 7th', detail: 'The partner tends toward a bright, noticeable presence: proud bearing, warm or dramatic expression, and a need to be seen.' },
  6: { title: 'Partner manner — Virgo 7th', detail: 'The partner tends toward a neat, precise look: careful dress, analytical speech, and a service-minded manner rather than show.' },
  7: { title: 'Partner manner — Libra 7th', detail: 'The partner tends toward balance and charm: fair or pleasing features, social grace, and a manner shaped around relating.' },
  8: { title: 'Partner manner — Scorpio 7th', detail: 'The partner tends toward intensity: piercing eyes, a private or magnetic manner, and a presence that does not stay on the surface.' },
  9: { title: 'Partner manner — Sagittarius 7th', detail: 'The partner tends toward an open, travelling look: frank speech, a longer frame, and a manner that seeks meaning or horizon.' },
  10: { title: 'Partner manner — Capricorn 7th', detail: 'The partner tends toward a serious, mature bearing: spare expression, durable build, and a manner built on duty and status.' },
  11: { title: 'Partner manner — Aquarius 7th', detail: 'The partner tends toward an unusual or detached look: cool manner, reformist speech, and a presence that does not follow the crowd.' },
  12: { title: 'Partner manner — Pisces 7th', detail: 'The partner tends toward a soft, dreamy presence: fluid features, compassionate eyes, and a manner that absorbs more than it asserts.' },
}

const FAMILY_BY_LORD_HOUSE: Record<number, { title: string; detail: string; tone: LifeTone }> = {
  1: { title: 'Family of the partner — self-made', detail: 'The 7th lord in the 1st points to a partner whose standing is tied to their own effort and identity more than to a heavy natal family name.', tone: 'mixed' },
  2: { title: 'Family of the partner — speech and wealth', detail: 'The 7th lord in the 2nd points to a partner from a family where speech, food, and money shape the household. Family values enter the marriage early.', tone: 'mixed' },
  3: { title: 'Family of the partner — siblings and effort', detail: 'The 7th lord in the 3rd points to a partner whose circle of siblings or neighbours is close — sometimes closer than the birth family proper. Resources may be thinner at the start.', tone: 'mixed' },
  4: { title: 'Family of the partner — home comfort', detail: 'The 7th lord in the 4th points to a partner who brings domestic ease and maternal-line support when the lord is capable.', tone: 'supportive' },
  5: { title: 'Family of the partner — good house', detail: 'The 7th lord in the 5th is a classical mark of a partner from a good family, with education or creative standing in the background.', tone: 'supportive' },
  6: { title: 'Family of the partner — service and contest', detail: 'The 7th lord in the 6th points to a partner whose family story includes service, debt, or competition. Cousin bonds can be strong; marriage may take longer to settle.', tone: 'caution' },
  7: { title: 'Family of the partner — known circle', detail: 'The 7th lord in the 7th points to a partner from a known or matching circle — the marriage amplifies partnership themes already in the family field.', tone: 'mixed' },
  8: { title: 'Family of the partner — transformation', detail: 'The 7th lord in the 8th points to a partner whose family carries sudden change, shared resources, or a private depth. Early married life can test the bond.', tone: 'caution' },
  9: { title: 'Family of the partner — fortune and father', detail: 'The 7th lord in the 9th points to a partner linked to fortune, father-line, or a guiding house — often a lift in standing after marriage when the lord is sound.', tone: 'supportive' },
  10: { title: 'Family of the partner — career house', detail: 'The 7th lord in the 10th points to a partner whose family or self is known through work and public role. Career support after marriage is the fruit when strong.', tone: 'mixed' },
  11: { title: 'Family of the partner — gains and elders', detail: 'The 7th lord in the 11th points to a partner from a networked or elder-sibling house — gains and friends enter with the marriage.', tone: 'supportive' },
  12: { title: 'Family of the partner — distant or foreign', detail: 'The 7th lord in the 12th points to a partner whose roots feel distant, foreign, or apart from the birth place — or a bond that pulls the person away from home.', tone: 'mixed' },
}

const DIRECTION_BY_LORD_HOUSE: Record<number, string> = {
  1: 'The partner’s life direction is close to the person’s own identity — marriage reshapes the self more than it relocates the person.',
  2: 'The partnership pulls toward family seat, speech, and local wealth rather than long exile.',
  3: 'Short moves, skills, and the sibling or neighbour field colour where the couple settles.',
  4: 'Home, mother-line, and a settled base are the direction the marriage seeks.',
  5: 'Romance, children, and creative purpose set the direction more than geography.',
  6: 'Service, workplace, or contest can decide where the couple must live or work.',
  7: 'The partner’s own path and public relating set the couple’s compass.',
  8: 'Sudden change, research, or shared crisis can relocate or transform the life together.',
  9: 'Long journeys, fortune, or the father’s field — including settlement away from birth — are open.',
  10: 'Career and public duty decide the place of living more than romance alone.',
  11: 'Networks, elder siblings, and desire-fulfillment pull the couple toward opportunity circles.',
  12: 'Foreign residence, ashram, or leaving the birth home is a live direction for this marriage.',
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

function gn(id: GrahaId | string, lang: EngineLang = 'en'): string {
  if (lang === 'en') return GRAHA_NAMES[id as GrahaId] ?? id
  return gName(id as GrahaId, lang)
}

function rn(r: Rashi, lang: EngineLang = 'en'): string {
  if (lang === 'en') return RASHI_NAMES[r] ?? `R${r}`
  return rName(r, lang)
}

function find(list: GrahaData[], id: GrahaId): GrahaData | undefined {
  return list.find(g => g.id === id)
}

function note(id: string, title: string, detail: string, tone: LifeTone): MarriedLifeNote {
  return { id, title, detail, tone }
}

function spouse(gender: Gender | undefined, lang: EngineLang = 'en'): string {
  if (lang === 'hi') {
    if (gender === 'female') return PN_TEXT_HI.spouse.female
    if (gender === 'male') return PN_TEXT_HI.spouse.male
    return PN_TEXT_HI.spouse.other
  }
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

export function analyzePartnerNature(chart: ChartOutput | null | undefined, lang: EngineLang = 'en'): PartnerNatureReading | null {
  const asc = chart?.lagnas?.ascRashi
  if (!chart || !asc) return null

  const grahas = chart.grahas ?? []
  const seventh = signOf(asc, 7)
  const lord = find(grahas, LORDS[seventh])
  const who = spouse(chart.meta?.gender, lang)
  const appearance = pick(APPEARANCE_BY_SIGN, APPEARANCE_BY_SIGN_HI, lang)
  const familyByLord = pick(FAMILY_BY_LORD_HOUSE, FAMILY_BY_LORD_HOUSE_HI, lang)
  const directionByLord = pick(DIRECTION_BY_LORD_HOUSE, DIRECTION_BY_LORD_HOUSE_HI, lang)
  const work = pick(WORK, WORK_HI, lang)
  const T = lang === 'hi' ? PN_TEXT_HI : null
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
    const how = lang === 'en'
      ? [
          occupies ? 'occupies the 7th' : '',
          isLord ? 'is the 7th lord' : '',
          joined ? `sits with the 7th lord, ${gn(lord!.id, lang)}` : '',
          sees ? 'aspects the 7th' : '',
        ].filter(Boolean).join(', and ')
      : [
          occupies ? T!.planetHow.occupies : '',
          isLord ? T!.planetHow.isLord : '',
          joined ? fill(T!.planetHow.joined, { lord: gn(lord!.id, lang) }) : '',
          sees ? T!.planetHow.aspects : '',
        ].filter(Boolean).join(`, ${T!.planetHow.joinedPrefix}`)
    const thin = (id === 'Sa' || id === 'Ke') && (occupies || joined)
      ? lang === 'en'
        ? ` The ${who} this chart draws can be present and still emotionally unavailable. That reading is already here.`
        : fill(T!.coldThin, { who })
      : ''
    planets.push(note(
      `partner-${id.toLowerCase()}`,
      work[id].title,
      `${gn(id, lang)} ${how}. ${work[id].work}${thin}`,
      thin ? 'caution' : 'mixed',
    ))
  }

  const occupants = grahas.filter(g => g.rashi === seventh && g.id !== lord?.id)
  const sittingEn = occupants.length
    ? `${occupants.map(g => gn(g.id, lang)).join(' and ')} ${occupants.length === 1 ? 'sits' : 'sit'} in the 7th.`
    : 'The 7th is empty of planets.'
  const sittingHi = occupants.length
    ? fill(
        occupants.length === 1 ? PN_TEXT_HI.sittingOne : PN_TEXT_HI.sittingMany,
        { names: occupants.map(g => gn(g.id, lang)).join(lang === 'hi' ? ' और ' : ' and ') },
      )
    : PN_TEXT_HI.empty7
  const sittingLine = lang === 'en' ? sittingEn : sittingHi
  const lordLine = lord
    ? lang === 'en'
      ? `The 7th lord, ${gn(lord.id, lang)}, is in ${RASHI_NAMES[lord.rashi]}, house ${houseOf(lord.rashi, asc)}${lord.dignity ? `, ${lord.dignity}` : ''}${lord.isCombust ? ', combust' : ''}.`
      : fill(PN_TEXT_HI.lordLine, {
          lord: gn(lord.id, lang),
          sign: rn(lord.rashi, lang),
          house: houseOf(lord.rashi, asc),
          dignity: lord.dignity ? `${PN_TEXT_HI.dignityPrefix}${dignityText(lord.dignity, lang)}` : '',
          combust: lord.isCombust ? PN_TEXT_HI.combust : '',
        })
    : lang === 'en' ? 'The 7th lord is not on this chart.' : PN_TEXT_HI.lordMissing

  const portrait: MarriedLifeNote[] = [note(
    'partner-seventh',
    lang === 'en' ? 'The 7th is the person and the partner' : PN_TEXT_HI.portraitTitle,
    lang === 'en'
      ? `The 7th is ${RASHI_NAMES[seventh]}. ${sittingLine} ${lordLine} This house is how this person behaves inside a marriage, and it is the ${who} the chart draws. The other chart confirms whose behavior is the one to work with.`
      : fill(PN_TEXT_HI.portraitLead, {
          sign: rn(seventh, lang),
          sitting: sittingLine,
          lordLine,
          who,
        }),
    'mixed',
  )]

  if (incomplete) {
    portrait.push(note(
      'partner-incomplete',
      lang === 'en' ? 'The love stays incomplete' : PN_TEXT_HI.incompleteTitle,
      lang === 'en'
        ? `The Moon and Venus are both weak. Incompleteness of love is visible from this chart alone. The ${who} who would give a complete love is not the ${who} this 7th draws. The feeling stays empty. What is expressed is not met. What was expected to be understood in a particular way is not understood.`
        : fill(PN_TEXT_HI.incompleteDetail, { who }),
      'caution',
    ))
  }

  const classical: MarriedLifeNote[] = []
  const appear = appearance[seventh]
  if (appear) {
    classical.push(note('partner-appear', appear.title, appear.detail, 'mixed'))
  }

  if (lord) {
    const lordHouse = houseOf(lord.rashi, asc)
    const family = familyByLord[lordHouse]
    if (family) {
      const dignityBit = dignified(lord.dignity)
        ? lang === 'en' ? ' The 7th lord is dignified, which steadies that family reading.' : PN_TEXT_HI.familyDignified
        : lord.dignity === 'debilitated' || lord.isCombust
          ? lang === 'en' ? ' The 7th lord is under strain, so the family fruit is harder to hold than the house alone suggests.' : PN_TEXT_HI.familyStrain
          : ''
      classical.push(note('partner-family', family.title, `${family.detail}${dignityBit}`, family.tone))
    }
    classical.push(note(
      'partner-direction',
      lang === 'en'
        ? `Direction of the marriage — 7th lord in house ${lordHouse}`
        : fill(PN_TEXT_HI.directionTitle, { house: lordHouse }),
      directionByLord[lordHouse] ?? (lang === 'en' ? 'The 7th lord’s house sets where the partnership tends to move.' : PN_TEXT_HI.directionFallback),
      'mixed',
    ))
  }

  const dkId = chart.karakas?.DK
  if (dkId && DK_PLANET_PROFILES[dkId]) {
    const profile = DK_PLANET_PROFILES[dkId]
    classical.push(note(
      'partner-dk',
      lang === 'en' ? `Darakaraka — ${gn(dkId, lang)}` : fill(PN_TEXT_HI.dkTitle, { lord: gn(dkId, lang) }),
      lang === 'en'
        ? `The marriage significator planet is ${gn(dkId, lang)}. Nature: ${profile.nature}. Watch: ${profile.hiddenChallenge}. Work: ${profile.karmicLesson}`
        : fill(PN_TEXT_HI.dkDetail, {
            lord: gn(dkId, lang),
            nature: profile.nature,
            challenge: profile.hiddenChallenge,
            lesson: profile.karmicLesson,
          }),
      'mixed',
    ))
  }

  const headline = incomplete
    ? lang === 'en' ? 'This chart already shows a love that stays incomplete' : PN_TEXT_HI.headlines.incomplete
    : cold
      ? lang === 'en'
        ? `The marriage house draws a ${who} who can be present and still hard to feel`
        : fill(PN_TEXT_HI.headlines.cold, { who })
      : lang === 'en'
        ? `The marriage house describes the ${who} from this chart alone`
        : fill(PN_TEXT_HI.headlines.default, { who })

  const summary = contacts.length
    ? lang === 'en'
      ? `${PLANETS.filter(id => contacts.includes(id)).map(id => gn(id, lang)).join(', ')} touch the marriage house (7th).`
      : fill(PN_TEXT_HI.summaryTouch, { names: PLANETS.filter(id => contacts.includes(id)).map(id => gn(id, lang)).join(', ') })
    : lang === 'en'
      ? 'None of Moon, Venus, Jupiter, Saturn, Rahu, Ketu, or Mars touches the marriage house (7th). The house itself still describes the partner.'
      : PN_TEXT_HI.summaryNone

  return {
    headline,
    summary,
    principles: pick(PARTNER_NATURE_PRINCIPLES, PARTNER_NATURE_PRINCIPLES_HI, lang),
    portrait,
    classical,
    planets,
    flags: { incomplete, cold, contacts },
  }
}

export function comparePartnerNature(
  a: PartnerNatureReading,
  b: PartnerNatureReading,
  nameA: string,
  nameB: string,
  lang: EngineLang = 'en',
): MarriedLifeNote[] {
  const notes: MarriedLifeNote[] = []
  if (a.flags.incomplete && b.flags.incomplete) {
    notes.push(note(
      'partner-pair-both',
      lang === 'en' ? 'Both charts carry an incomplete love' : PN_TEXT_HI.pairBothTitle,
      lang === 'en'
        ? `${nameA} and ${nameB} each show a Moon and a Venus too weak to draw a completing love. The gap is in both people. Cross-reading still asks whose behavior is being lived in a given season.`
        : fill(PN_TEXT_HI.pairBothDetail, { nameA, nameB }),
      'caution',
    ))
  } else if (a.flags.incomplete || b.flags.incomplete) {
    const who = a.flags.incomplete ? nameA : nameB
    const other = a.flags.incomplete ? nameB : nameA
    notes.push(note(
      'partner-pair-one',
      lang === 'en' ? `${who}’s chart already shows the incomplete love` : fill(PN_TEXT_HI.pairOneTitle, { who }),
      lang === 'en'
        ? `The pattern is in ${who}’s 7th. ${other}’s chart is the confirmation: it shows whether the behavior being lived belongs there. The discovery did not require the second chart.`
        : fill(PN_TEXT_HI.pairOneDetail, { who, other }),
      'caution',
    ))
  }
  if (a.flags.cold !== b.flags.cold) {
    const who = a.flags.cold ? nameA : nameB
    const other = a.flags.cold ? nameB : nameA
    notes.push(note(
      'partner-pair-cold',
      lang === 'en' ? `${who}’s 7th describes the thinner feeling` : fill(PN_TEXT_HI.pairColdTitle, { who }),
      lang === 'en'
        ? `${who} has Saturn or Ketu on the marriage, so the emotionally unavailable partner is already described there. ${other}’s chart is where that behavior is confirmed or found to belong to the other person.`
        : fill(PN_TEXT_HI.pairColdDetail, { who, other }),
      'mixed',
    ))
  }
  return notes
}
