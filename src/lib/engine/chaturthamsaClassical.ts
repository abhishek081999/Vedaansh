// ─────────────────────────────────────────────────────────────
//  src/lib/engine/chaturthamsaClassical.ts
//  Chaturthamsha (D4) — BPHS / Phaladeepika / Saravali sukhaphala
//  Property, mother, conveyances, domestic peace, fortune of home.
//  Pure: no React, DB, or network.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, Dignity, GrahaId, Rashi } from '@/types/astrology'
import type { ClassicalNote } from '@/lib/engine/classicalInterpretations'
import { houseNotes as houseNotesL, planetInHouseNotes, planetInSignNotes, rashiNotes as rashiNotesL } from '@/lib/engine/divisionalClassicalHi'
import { dignityText, fill, gName, pick, rName, type EngineLang } from '@/lib/engine/divisionalLang'
import {
  D4C_FOURTH_LORD_PHALA_HI,
  D4C_GRADE_HI,
  D4C_GRADE_NAME_HI,
  D4C_OCCUPANT_HI,
  D4C_TEXT_HI,
} from '@/lib/engine/locale/chaturthamsaClassical.hi'
import { hasParasharaAspect } from '@/lib/engine/aspects'
import {
  type ChaturthamsaAnalysis,
  type ChaturthamsaPlanetRow,
  type D4Tone,
  signCount,
} from '@/lib/engine/chaturthamsaAnalysis'

const CLASSICAL: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const BENEFICS: GrahaId[] = ['Ju', 'Ve', 'Mo', 'Me']
const MALEFICS: GrahaId[] = ['Su', 'Ma', 'Sa', 'Ra', 'Ke']

const SIGN_LORDS: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

/** BPHS digbala: Moon/Venus gain directional strength in the 4th. */
const DIGBALA_IN_FOURTH: GrahaId[] = ['Mo', 'Ve']

export type SukhaGrade = 'ordinary' | 'comfortable' | 'prosperous' | 'royal'

const GRADE_LABEL: Record<SukhaGrade, string> = {
  ordinary: 'Ordinary sukhaphala — home comfort is workable; peace grows by patience more than by property.',
  comfortable: 'Comfortable sukhaphala — dwelling and emotional shelter can be named; effort and dashas still decide the height.',
  prosperous: 'Prosperous sukhaphala — property, conveyances, and domestic peace are a real promise, especially in the 4th lord’s periods.',
  royal: 'Royal sukhaphala — lands, vehicles, and lasting comfort are strongly indicated when D1 agrees; protect the 4th from difficult planet dashas.',
}

/** BPHS-style results of the 4th lord by house — read inside Chaturthamsha. */
const FOURTH_LORD_PHALA: Record<number, { headline: string; prediction: string }> = {
  1: {
    headline: '4th lord in the 1st — self as shelter',
    prediction:
      'BPHS lens: the happiness-lord in the D4 lagna ties comfort to the person’s own body and will. Property and peace improve when the person leads the household rather than waiting for others to provide it.',
  },
  2: {
    headline: '4th lord in the 2nd — family wealth as home',
    prediction:
      'BPHS lens: domestic peace feeds (and is fed by) family resources, food, and speech. Inheritance, kutumba funds, or a voice-based trade can buy or keep the house.',
  },
  3: {
    headline: '4th lord in the 3rd — effort and short moves',
    prediction:
      'BPHS lens: happiness through courage, siblings, writing, or short journeys. The home may be built by own hands; residence can shift with ventures rather than settle early.',
  },
  4: {
    headline: '4th lord in the 4th — pure bandhu/sukha',
    prediction:
      'BPHS lens: strongest seat for mother-comfort, lands, and conveyances when the lord is dignified. The person is identified with the dwelling itself; protect this lord in dasha for lasting sukha.',
  },
  5: {
    headline: '4th lord in the 5th — joy and counsel at home',
    prediction:
      'BPHS lens: home happiness through children, mantra, creativity, or counsel. Property may come via speculative gains or a child’s fortune; emotional peace needs purposeful play.',
  },
  6: {
    headline: '4th lord in the 6th — service and conflict at home',
    prediction:
      'BPHS lens: domestic peace contested by debts, illness, or rivals. Comfort returns through service, healing, or defeating opposition. Mother or property disputes need careful handling.',
  },
  7: {
    headline: '4th lord in the 7th — partner as dwelling',
    prediction:
      'BPHS lens: happiness and property through spouse, partners, or trade. Living far from birthplace or in the partner’s sphere is classical; marital peace becomes the home climate.',
  },
  8: {
    headline: '4th lord in the 8th — upheaval and inheritance',
    prediction:
      'BPHS lens: residence changes, inheritance, occult research, or shared property mark the story. Longevity of comfort is uneven — transformations unlock the house more than a straight purchase.',
  },
  9: {
    headline: '4th lord in the 9th — fortune and dharma in shelter',
    prediction:
      'BPHS lens: fortunate dwelling, father/guru-backed property, or a home that supports pilgrimage and higher learning. Virtue and elders protect sukha.',
  },
  10: {
    headline: '4th lord in the 10th — status built as home',
    prediction:
      'BPHS lens: public karma builds conveyances, institutions, or official quarters. Emotional peace depends on whether the work feels like shelter; government or career housing themes rise.',
  },
  11: {
    headline: '4th lord in the 11th — gains fulfill the home',
    prediction:
      'BPHS lens: desires and income buy comfort. Networks, elder siblings, or friendships enlarge the dwelling; titles matter less than the gains that furnish the house.',
  },
  12: {
    headline: '4th lord in the 12th — foreign or costly shelter',
    prediction:
      'BPHS lens: expenses, foreign lands, hospitals, ashrams, or bed-comfort themes. Peace is thinner unless the lord is strong; charity and retreat are the clean use of this placement.',
  },
}

const FOURTH_OCCUPANT_PHALA: Partial<Record<GrahaId, string>> = {
  Su: 'BPHS / Phaladeepika: Sun in the 4th unsettles domestic peace; conveyances possible; mother’s health needs care. Distant residence themes rise when under pressure.',
  Mo: 'BPHS: Moon in the 4th — digbala for the mind’s shelter. Strong Moon settles mother-comfort and emotional home; weak Moon makes sukha mood-dependent.',
  Ma: 'BPHS: Mars in the 4th heats land and vehicles; construction and courage build the house. Domestic conflict is the tax when Mars is under pressure.',
  Me: 'BPHS: Mercury in the 4th favors learning foundations, documents, and trade linked to property. Dual signs can mean more than one dwelling track.',
  Ju: 'BPHS: Jupiter in the 4th blesses lands, counsel, and contentment (santosh). Elders and dharma protect the home when Jupiter is free of difficult influences.',
  Ve: 'BPHS: Venus in the 4th — digbala for comfort. Beauty, vehicles, and pleasant domestic life; luxury trades and refined dwelling fit.',
  Sa: 'BPHS: Saturn in the 4th delays then hardens property. Stone, labor, and endurance; early emotional dryness can mature into lasting structures.',
  Ra: 'Rahu in the 4th amplifies unconventional dwelling, foreign taste, or obsessive accumulation at home. Scandal or restlessness is the risk when impure.',
  Ke: 'Ketu in the 4th detaches from ordinary home comfort; spiritual or ancestral property themes. Breaks in residence become the path to mastery of shelter.',
}

export interface ChaturthamsaClassicalFactor {
  label: string
  points: number
  note: string
}

export interface ChaturthamsaClassicalYoga {
  id: string
  name: string
  formed: boolean
  source: string
  detail: string
  tone: D4Tone
}

export interface ChaturthamsaPlanetPhala {
  id: GrahaId
  name: string
  d4House: number
  d4Rashi: Rashi
  d4RashiName: string
  dignity: Dignity
  role: string | null
  homeLens: string
  houseTeaching: string | null
  houseClassical: ClassicalNote[]
  signClassical: ClassicalNote[]
  priority: boolean
}

export interface ChaturthamsaClassical {
  framing: string
  sources: string[]
  predictions: string[]
  sukhaphala: {
    grade: SukhaGrade
    gradeLabel: string
    score: number
    headline: string
    text: string
    factors: ChaturthamsaClassicalFactor[]
  }
  fourthLord: {
    id: GrahaId
    name: string
    house: number
    rashiName: string
    dignity: Dignity
    headline: string
    prediction: string
  }
  fourthHouse: {
    rashi: Rashi
    rashiName: string
    occupants: string[]
    houseNotes: ClassicalNote[]
    rashiNotes: ClassicalNote[]
    occupantPhala: { id: GrahaId; name: string; text: string }[]
  }
  d1Agreement: {
    agrees: boolean
    d1FourthLord: GrahaId
    d1FourthLordName: string
    d4FourthLord: GrahaId
    text: string
  }
  yogas: ChaturthamsaClassicalYoga[]
  phala: ChaturthamsaPlanetPhala[]
  domains: {
    property: string
    motherComfort: string
    conveyances: string
    relocation: string
    contentment: string
  }
  caution: string
}

function houseSign(asc: Rashi, house: number): Rashi {
  return (((asc - 1 + house - 1) % 12) + 1) as Rashi
}

function houseOf(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function dignityPoints(d: Dignity): number {
  switch (d) {
    case 'exalted': return 18
    case 'moolatrikona': return 16
    case 'own': return 14
    case 'great_friend': return 8
    case 'friend': return 6
    case 'neutral': return 2
    case 'enemy': return -6
    case 'great_enemy': return -10
    case 'debilitated': return -14
    default: return 0
  }
}

function housePoints(house: number): number {
  if ([1, 4, 7, 10].includes(house)) return 8
  if ([5, 9].includes(house)) return 6
  if (house === 11) return 7
  if ([6, 8, 12].includes(house)) return -6
  return 2
}

function gradeFromScore(score: number): SukhaGrade {
  if (score >= 72) return 'royal'
  if (score >= 55) return 'prosperous'
  if (score >= 38) return 'comfortable'
  return 'ordinary'
}

function byIdMap(planets: ChaturthamsaPlanetRow[]): Map<GrahaId, ChaturthamsaPlanetRow> {
  return new Map(planets.map((p) => [p.id, p]))
}

const D4C_TEXT_EN: Record<keyof typeof D4C_TEXT_HI, string> = {
  fLordDig: '4th lord dignity in D4',
  fLordDigNote: '{planet} is {dignity} in {rashi} (H{house}).',
  fLordHouse: '4th lord’s D4 house',
  fLordHouseNote: '4th lord in house {house}.',
  fLagnaLord: 'D4 lagna lord dignity',
  fLagnaLordNote: '{planet} ({dignity}) steers the heart of Chaturthamsha.',
  fMoon: 'Moon (emotional shelter)',
  fMoonNote: 'Moon in D4 H{house} {rashi} — {dignity}.',
  fJupiter: 'Jupiter (santosh)',
  fJupiterNote: 'Jupiter in D4 H{house} — contentment with what the house holds.',
  fDigbala: 'Digbala in the 4th (Mo/Ve)',
  fDigbalaNote: '{names} gain directional strength in the 4th — classic for comfort and conveyances.',
  fVargottama: 'Vargottama 4th lord (D1↔D4)',
  fVargottamaNote: '{planet} repeats the same sign in D1 and D4 — property/sukha promise is consistent.',
  fMalefic: 'Difficult planets in D4 4th',
  fMaleficNote: '{names} press domestic peace — Phaladeepika warns on sukha when the 4th is heated.',
  fDrishti: 'Helpful drishti on D4 4th',
  fDrishtiNote: 'Jupiter, Venus, Moon, or Mercury aspects the 4th — classical relief for mother-comfort and property.',
  fNodes: 'Nodes on D4 lagna',
  fNodesNote: 'BPHS tradition: nodes on a varga lagna disturb that division’s heart — struggle around personal space and sukha.',
  yGkName: 'Gaja-Kesari flavor (Moon–Jupiter)',
  yGkYes: 'Moon and Jupiter link in D4 ({moon} / {jupiter}) — classical support for dignity, counsel, and a spacious emotional home.',
  yGkNo: 'Moon and Jupiter are not in a classical Gaja-Kesari link in D4.',
  yPariName: 'Parivartana 1↔4',
  yPariYes: 'Lagna lord and 4th lord exchange in D4 — self and shelter fuse; property and identity rise together.',
  yPariNo: 'No 1–4 lord exchange in D4.',
  yMaKeName: 'Mars–Ketu in the 4th',
  yMaKeYes: 'Mars–Ketu in the D4 4th: sharp domestic speech, renovation heat, or abrupt breaks in residence — weigh with D1 before predicting violence.',
  yMaKeNo: 'Mars–Ketu do not co-occupy the D4 4th.',
  yVishName: 'Saturn–Moon (Vish-style) in D4',
  yVishYes: 'Saturn with Moon in D4: material structures may rise while emotional dryness and overthinking about home/commitment linger.',
  yVishNo: 'Saturn and Moon are not conjunct in D4.',
  yNodesName: 'Rahu/Ketu on D4 lagna',
  yNodesYes: 'Nodes occupy the Chaturthamsha lagna — the division’s heart is disturbed until wisdom softens attachment and aversion.',
  yNodesNo: 'D4 lagna is free of the nodes.',
  yDigName: 'Sukha digbala (Moon/Venus in 4th)',
  yDigYes: 'Moon and/or Venus in the D4 4th — directional strength for conveyances, aesthetics, and mother-comfort.',
  yDigNo: 'Neither Moon nor Venus sits in the D4 4th for digbala.',
  srcBphsPd: 'BPHS · Phaladeepika',
  srcBphsYoga: 'BPHS yoga',
  srcCaution: 'Classical caution',
  srcPdPop: 'Phaladeepika · popular yoga tradition',
  srcVarga: 'BPHS varga principle',
  srcDigbala: 'BPHS Digbala',
  homeLensFallback: '{planet} in D4 H{house} ({rashi}) colors home and happiness through its karakatva.',
  propGood: 'Property: {planet} in house {house} with workable dignity supports lands/house ownership; confirm with D1 4th and D16 for vehicles.',
  propDus: 'Property: 4th lord in dusthana (difficult houses: 6, 8, 12) H{house} — ownership may come through struggle, inheritance, foreign soil, or delayed purchase.',
  propMid: 'Property: follow {planet} in D4 H{house} with the D1 4th lord for timing of lands and dwelling.',
  motherGood: 'Mother / emotional comfort: Moon is supportive in Chaturthamsha — nurture and domestic peace are available when dashas agree.',
  motherBad: 'Mother / emotional comfort: difficult planets on the D4 4th caution early or ongoing strain around mother-comfort — read with D1 Moon and 4th.',
  motherMid: 'Mother / emotional comfort: mixed — weigh Moon, 4th lord, and helpful planets on the 4th together.',
  convVe: 'Conveyances: Venus in the D4 4th is a classical vehicle/comfort signature (pair with D16).',
  convMaSu: 'Conveyances: Sun/Mars influence on the 4th can give vehicles with heat, status, or machinery — maintenance and temper matter.',
  convMid: 'Conveyances: check Venus, 4th lord, and Shodasamsha (D16) for cars and luxuries; D4 shows the comfort climate around them.',
  relocNow: 'Relocation: current dasha flags a move window — {headline}. Classical texts time residence change from the 4th/8th complex and their lords’ periods.',
  reloc8: 'Relocation: 8th-house links in D4 support residence change in related dashas (BPHS āyu/transformation house applied to shelter).',
  relocNone: 'Relocation: no strong current 8th/6–8 flag — still watch 4th-lord and 8th-lord periods for moves.',
  contGood: 'Contentment (santosh): Jupiter is supportive in D4 — the person can feel “enough” when wisdom and counsel are honored.',
  contBad: 'Contentment: troubled Jupiter in D4 — even with assets, satisfaction may spoil until counsel, dharma, or temple/wisdom practices restore santosh.',
  contMid: 'Contentment: Jupiter’s D4 condition is mixed — santosh depends on dasha and how the 4th lord is used.',
  agreeYes: '{planet} is 4th lord in both D1 and D4 — birth-chart shelter promise and Chaturthamsha fortune point the same graha.',
  agreeNo: 'D1 4th lord is {d1}; inside D4 the 4th lord is {d4}. Use D1 for the life-level promise and D4 for how home fortune unfolds.',
  predLord: '{headline}. {prediction}',
  predLordFallback: '{planet} as D4 4th lord in house {house} steers sukhaphala.',
  predYoga: '{name}: {detail}',
  occFallback: '{planet} in the D4 4th colors bandhu/sukha through its nature.',
  framing: 'Bṛhat Parāśara Horā Śāstra’s Shodashavarga assigns Chaturthamsha (D4) to the fortune of home and fixed comforts — an expansion of Bandhu/Sukha Bhava (mother, lands, conveyances, emotional peace). Phaladeepika and Saravali 4th-house phala are read on D4 placements; Digbala of Moon/Venus in the 4th is weighed. This tab does not replace D1 — it grades sukhaphala on top of the rashi promise.',
  src1: 'BPHS — Shodashavarga (Chaturthamsha); Bandhu/Sukha Bhava; Digbala; graha-in-bhava phala',
  src2: 'Phaladeepika — 4th house (mother, property, domestic peace); planet-in-house',
  src3: 'Saravali / Brihat Jataka — rashi natures applied to D4 lagna and 4th',
  src4: 'Jātaka tradition — Vargottama, Parivartana, Gaja-Kesari flavor in the varga',
  sukhaHeadline: 'Sukhaphala {score}/100 · {grade}',
  sukhaText: 'Counted factors: 4th-lord dignity and house, D4 lagna-lord dignity, Moon and Jupiter, Mo/Ve digbala in the 4th, Vargottama of the D1 4th lord, difficult planets in the 4th, helpful drishti (aspect), and nodes on the D4 lagna. This is a comfort/property grade — not a street address.',
  lordHeadlineFallback: '4th lord {planet}',
  caution: 'Confirm D1 first. Chaturthamsha does not replace the birth chart — BPHS uses it for the fortune of shelter on top of the rashi 4th. Pair vehicles with D16 and marriage peace with D9 when those questions dominate.',
  roleFourth: '4th lord',
  roleLagna: 'D4 lagna lord',
  roleMoon: 'Moon (mind/sukha)',
  roleJupiter: 'Jupiter (santosh)',
  roleIn4: 'in D4 4th',
}

function roleFor(
  id: GrahaId,
  fourthLordId: GrahaId,
  lagnaLordId: GrahaId,
  fourthOcc: Set<GrahaId>,
  T: Record<keyof typeof D4C_TEXT_HI, string>,
): string | null {
  if (id === fourthLordId) return T.roleFourth
  if (id === lagnaLordId) return T.roleLagna
  if (id === 'Mo') return T.roleMoon
  if (id === 'Ju') return T.roleJupiter
  if (fourthOcc.has(id)) return T.roleIn4
  return null
}

/**
 * Classical Chaturthamsha reading.
 * BPHS Shodashavarga assigns D4 to fortune of home/property (bandhu–sukha expansion).
 * Phaladeepika / Saravali bhava phala of the 4th are applied inside D4.
 */
export function buildChaturthamsaClassical(
  analysis: ChaturthamsaAnalysis,
  chart: ChartOutput,
  lang: EngineLang = 'en',
): ChaturthamsaClassical | null {
  const T = pick(D4C_TEXT_EN, D4C_TEXT_HI as Record<keyof typeof D4C_TEXT_HI, string>, lang)
  const FLP = pick(FOURTH_LORD_PHALA, D4C_FOURTH_LORD_PHALA_HI, lang)
  const OCC = pick(FOURTH_OCCUPANT_PHALA, D4C_OCCUPANT_HI as Partial<Record<GrahaId, string>>, lang)
  const dig = (d: Dignity) => dignityText(d, lang)
  const g = (id: GrahaId) => gName(id, lang)
  const d1Asc = chart.lagnas?.ascRashi
  if (!d1Asc || !analysis.planets.length) return null

  const byId = byIdMap(analysis.planets)
  const d4Asc = analysis.d4Lagna
  const fourthSign = houseSign(d4Asc, 4)
  const fourthLordId = SIGN_LORDS[fourthSign]
  const lagnaLordId = SIGN_LORDS[d4Asc]
  const fourthLord = byId.get(fourthLordId)
  const lagnaLord = byId.get(lagnaLordId)
  const moon = byId.get('Mo')
  const jupiter = byId.get('Ju')
  const venus = byId.get('Ve')
  if (!fourthLord) return null

  const fourthOccIds = new Set(
    analysis.planets.filter((p) => p.house === 4).map((p) => p.id),
  )

  const d1FourthSign = houseSign(d1Asc, 4)
  const d1FourthLordId = SIGN_LORDS[d1FourthSign]
  const d1FourthLordGraha = chart.grahas?.find((g) => g.id === d1FourthLordId)
  const d4OfD1FourthLord = byId.get(d1FourthLordId)

  // ── Sukhaphala score ───────────────────────────────────────
  const factors: ChaturthamsaClassicalFactor[] = []
  let score = 40

  const flDig = dignityPoints(fourthLord.dignity)
  score += flDig
  factors.push({
    label: T.fLordDig,
    points: flDig,
    note: fill(T.fLordDigNote, { planet: fourthLord.name, dignity: dig(fourthLord.dignity), rashi: fourthLord.rashiName, house: fourthLord.house }),
  })

  const flHouse = housePoints(fourthLord.house)
  score += flHouse
  factors.push({
    label: T.fLordHouse,
    points: flHouse,
    note: FLP[fourthLord.house]?.headline ?? fill(T.fLordHouseNote, { house: fourthLord.house }),
  })

  if (lagnaLord) {
    const ll = dignityPoints(lagnaLord.dignity)
    score += Math.round(ll * 0.6)
    factors.push({
      label: T.fLagnaLord,
      points: Math.round(ll * 0.6),
      note: fill(T.fLagnaLordNote, { planet: lagnaLord.name, dignity: dig(lagnaLord.dignity) }),
    })
  }

  if (moon) {
    const mo = dignityPoints(moon.dignity) + (moon.house === 4 ? 6 : 0)
    score += Math.round(mo * 0.5)
    factors.push({
      label: T.fMoon,
      points: Math.round(mo * 0.5),
      note: fill(T.fMoonNote, { house: moon.house, rashi: moon.rashiName, dignity: dig(moon.dignity) }),
    })
  }

  if (jupiter) {
    const juPts = dignityPoints(jupiter.dignity) + ([1, 4, 5, 9, 10].includes(jupiter.house) ? 4 : 0)
    score += Math.round(juPts * 0.45)
    factors.push({
      label: T.fJupiter,
      points: Math.round(juPts * 0.45),
      note: fill(T.fJupiterNote, { house: jupiter.house }),
    })
  }

  const digbalaHit = analysis.planets.filter((p) => p.house === 4 && DIGBALA_IN_FOURTH.includes(p.id))
  if (digbalaHit.length) {
    score += 6
    factors.push({
      label: T.fDigbala,
      points: 6,
      note: fill(T.fDigbalaNote, { names: digbalaHit.map((p) => p.name).join(', ') }),
    })
  }

  const vargottamaFourth =
    d1FourthLordGraha && d4OfD1FourthLord && d1FourthLordGraha.rashi === d4OfD1FourthLord.rashi
  if (vargottamaFourth) {
    score += 8
    factors.push({
      label: T.fVargottama,
      points: 8,
      note: fill(T.fVargottamaNote, { planet: g(d1FourthLordId) }),
    })
  }

  const maleficsInFourth = analysis.planets.filter((p) => p.house === 4 && MALEFICS.includes(p.id))
  if (maleficsInFourth.length) {
    const pen = -5 * maleficsInFourth.length
    score += pen
    factors.push({
      label: T.fMalefic,
      points: pen,
      note: fill(T.fMaleficNote, { names: maleficsInFourth.map((p) => p.name).join(', ') }),
    })
  }

  const beneficsAspectFourth = analysis.planets.some(
    (p) => BENEFICS.includes(p.id) && p.house !== 4 && hasParasharaAspect(p.rashi, p.id, fourthSign),
  )
  if (beneficsAspectFourth) {
    score += 5
    factors.push({
      label: T.fDrishti,
      points: 5,
      note: T.fDrishtiNote,
    })
  }

  if (analysis.heart.nodesOnLagna) {
    score -= 8
    factors.push({
      label: T.fNodes,
      points: -8,
      note: T.fNodesNote,
    })
  }

  score = Math.max(5, Math.min(98, score))
  const grade = gradeFromScore(score)

  // ── Yogas ──────────────────────────────────────────────────
  const yogas: ChaturthamsaClassicalYoga[] = []

  if (moon && jupiter) {
    const sc = signCount(moon.rashi, jupiter.rashi)
    const gk = sc === 1 || sc === 7 || [5, 9].includes(sc) || hasParasharaAspect(jupiter.rashi, 'Ju', moon.rashi)
    yogas.push({
      id: 'gaja-kesari-d4',
      name: T.yGkName,
      formed: gk,
      source: T.srcBphsPd,
      detail: gk
        ? fill(T.yGkYes, { moon: rName(moon.rashi, lang), jupiter: rName(jupiter.rashi, lang) })
        : T.yGkNo,
      tone: gk ? 'supportive' : 'neutral',
    })
  }

  const exchange14 =
    lagnaLord && fourthLord
    && lagnaLord.house === 4
    && fourthLord.house === 1
  yogas.push({
    id: 'parivartana-1-4',
    name: T.yPariName,
    formed: Boolean(exchange14),
    source: T.srcBphsYoga,
    detail: exchange14 ? T.yPariYes : T.yPariNo,
    tone: exchange14 ? 'supportive' : 'neutral',
  })

  const keMaFourth = fourthOccIds.has('Ke') && fourthOccIds.has('Ma')
  yogas.push({
    id: 'mars-ketu-fourth',
    name: T.yMaKeName,
    formed: keMaFourth,
    source: T.srcCaution,
    detail: keMaFourth ? T.yMaKeYes : T.yMaKeNo,
    tone: keMaFourth ? 'challenging' : 'neutral',
  })

  const saMo = analysis.planets.some((p) => p.id === 'Sa')
    && moon
    && (byId.get('Sa')!.rashi === moon.rashi)
  yogas.push({
    id: 'vish-yoga-d4',
    name: T.yVishName,
    formed: Boolean(saMo),
    source: T.srcPdPop,
    detail: saMo ? T.yVishYes : T.yVishNo,
    tone: saMo ? 'mixed' : 'neutral',
  })

  yogas.push({
    id: 'nodes-lagna',
    name: T.yNodesName,
    formed: analysis.heart.nodesOnLagna,
    source: T.srcVarga,
    detail: analysis.heart.nodesOnLagna ? T.yNodesYes : T.yNodesNo,
    tone: analysis.heart.nodesOnLagna ? 'challenging' : 'supportive',
  })

  const veMoFourth = digbalaHit.length >= 1 && (fourthOccIds.has('Ve') || fourthOccIds.has('Mo'))
  yogas.push({
    id: 'sukha-digbala',
    name: T.yDigName,
    formed: veMoFourth,
    source: T.srcDigbala,
    detail: veMoFourth ? T.yDigYes : T.yDigNo,
    tone: veMoFourth ? 'supportive' : 'neutral',
  })

  // ── Planet phala cards ─────────────────────────────────────
  const priorityIds = new Set<GrahaId>([fourthLordId, lagnaLordId, 'Mo', 'Ju'])
  for (const id of fourthOccIds) priorityIds.add(id)

  const phala: ChaturthamsaPlanetPhala[] = []
  for (const id of CLASSICAL) {
    const row = byId.get(id)
    if (!row) continue
    const houseNotes = planetInHouseNotes(id, row.house, lang)
    const signNotes = planetInSignNotes(id, row.rashi, row.dignity, lang)
    const occupant = OCC[id]
    const homeLens =
      row.house === 4 && occupant
        ? occupant
        : houseNotes[0]?.text
          ?? fill(T.homeLensFallback, { planet: g(id), house: row.house, rashi: row.rashiName })
    phala.push({
      id,
      name: g(id),
      d4House: row.house,
      d4Rashi: row.rashi,
      d4RashiName: row.rashiName,
      dignity: row.dignity,
      role: roleFor(id, fourthLordId, lagnaLordId, fourthOccIds, T),
      homeLens,
      houseTeaching: houseNotesL(row.house, lang)[0]?.text ?? null,
      houseClassical: houseNotes,
      signClassical: signNotes,
      priority: priorityIds.has(id),
    })
  }

  // ── Domain predictions ─────────────────────────────────────
  const flPhala = FLP[fourthLord.house]
  const property =
    [4, 11, 2, 9].includes(fourthLord.house) && dignityPoints(fourthLord.dignity) >= 2
      ? fill(T.propGood, { planet: fourthLord.name, house: fourthLord.house })
      : [6, 8, 12].includes(fourthLord.house)
        ? fill(T.propDus, { house: fourthLord.house })
        : fill(T.propMid, { planet: fourthLord.name, house: fourthLord.house })

  const motherComfort =
    moon && (moon.house === 4 || dignityPoints(moon.dignity) >= 6)
      ? T.motherGood
      : maleficsInFourth.length
        ? T.motherBad
        : T.motherMid

  const conveyances =
    venus && venus.house === 4
      ? T.convVe
      : fourthOccIds.has('Ma') || fourthOccIds.has('Su')
        ? T.convMaSu
        : T.convMid

  const relocation =
    analysis.relocation?.eighthLordPeriodActive || analysis.relocation?.sixthEighthDashaLink
      ? fill(T.relocNow, { headline: analysis.relocation.headline })
      : fourthLord.house === 8 || fourthOccIds.size && analysis.planets.some((p) => p.house === 8)
        ? T.reloc8
        : T.relocNone

  const contentment =
    jupiter && dignityPoints(jupiter.dignity) >= 6 && ![6, 8, 12].includes(jupiter.house)
      ? T.contGood
      : jupiter && (dignityPoints(jupiter.dignity) < 0 || [6, 8, 12].includes(jupiter.house))
        ? T.contBad
        : T.contMid

  const agrees = d1FourthLordId === fourthLordId
  const d1Agreement = {
    agrees,
    d1FourthLord: d1FourthLordId,
    d1FourthLordName: g(d1FourthLordId),
    d4FourthLord: fourthLordId,
    text: agrees
      ? fill(T.agreeYes, { planet: g(d1FourthLordId) })
      : fill(T.agreeNo, { d1: g(d1FourthLordId), d4: g(fourthLordId) }),
  }

  const formedYogas = yogas.filter((y) => y.formed)
  const predictions: string[] = [
    flPhala
      ? fill(T.predLord, { headline: flPhala.headline, prediction: flPhala.prediction })
      : fill(T.predLordFallback, { planet: fourthLord.name, house: fourthLord.house }),
    d1Agreement.text,
    property,
    motherComfort,
    contentment,
  ]
  if (formedYogas[0]) {
    predictions.push(fill(T.predYoga, { name: formedYogas[0].name, detail: formedYogas[0].detail }))
  }
  if (analysis.relocation && (analysis.relocation.eighthLordPeriodActive || analysis.relocation.sixthEighthDashaLink)) {
    predictions.push(relocation)
  }

  const fourthHouseNotes = houseNotesL(4, lang)
  const fourthRashiNotes = rashiNotesL(fourthSign, lang)
  const occupantPhala = analysis.planets
    .filter((p) => p.house === 4)
    .map((p) => ({
      id: p.id,
      name: p.name,
      text: OCC[p.id] ?? fill(T.occFallback, { planet: p.name }),
    }))

  return {
    framing: T.framing,
    sources: [T.src1, T.src2, T.src3, T.src4],
    predictions,
    sukhaphala: {
      grade,
      gradeLabel: lang === 'hi' ? D4C_GRADE_HI[grade] : GRADE_LABEL[grade],
      score,
      headline: fill(T.sukhaHeadline, { score, grade: lang === 'hi' ? D4C_GRADE_NAME_HI[grade] : grade }),
      text: T.sukhaText,
      factors,
    },
    fourthLord: {
      id: fourthLordId,
      name: fourthLord.name,
      house: fourthLord.house,
      rashiName: fourthLord.rashiName,
      dignity: fourthLord.dignity,
      headline: flPhala?.headline ?? fill(T.lordHeadlineFallback, { planet: fourthLord.name }),
      prediction: flPhala?.prediction ?? fourthLord.interpretation,
    },
    fourthHouse: {
      rashi: fourthSign,
      rashiName: rName(fourthSign, lang),
      occupants: analysis.planets.filter((p) => p.house === 4).map((p) => p.name),
      houseNotes: fourthHouseNotes,
      rashiNotes: fourthRashiNotes,
      occupantPhala,
    },
    d1Agreement,
    yogas,
    phala,
    domains: {
      property,
      motherComfort,
      conveyances,
      relocation,
      contentment,
    },
    caution: T.caution,
  }
}
