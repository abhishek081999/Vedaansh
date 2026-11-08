// ─────────────────────────────────────────────────────────────
//  src/lib/engine/tattvaPrediction.ts
//  Tattva (element) prediction layer — trikona load, Agni/Artha/
//  Vayu/Moksha flavors, Active vs Reactive dasha spice, Moon
//  forecast gate, life-stability modality, dasha remedies.
//  Educational synthesis — not medical, legal, or event certainty.
// ─────────────────────────────────────────────────────────────

import type { DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { signModality, type SignModality } from '@/lib/engine/dashamsaClassical'
import { getCurrentDasha } from '@/lib/engine/dasha/vimshottari'
import {
  NATURAL_HOUSE_KARAKAS,
  getNaturalKarakasForHouse,
  type HouseNumber1to12,
} from '@/lib/engine/naturalHouseKarakas'
import { RASHI_LORDS, HOUSE_THEMES } from '@/lib/engine/houseInterpretations'
import { RASHI_PROFILES } from '@/lib/engine/rashiInterpretations'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { HOUSE_THEMES_HI } from '@/lib/engine/locale/interpretations.hi'
import {
  AGNI_COPY_HI,
  EDUCATIONAL_NOTE_HI,
  HOUSE_KARAKA_THEMES_HI,
  KARAKA_PRACTICE_HI,
  MODALITY_HI,
  MONEY_COPY_HI,
  RASHI_FIRST_REMEDY_HI,
  TATTVA_HI as TH,
  TRI_DEF_HI,
} from '@/lib/engine/locale/tattvaPrediction.hi'

/** Classical nine for tattva scoring (exclude Ur/Ne/Pl). */
export const TATTVA_GRAHAS: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

export type TattvaId = 'agni' | 'prithvi' | 'vayu' | 'jal'
export type TrikonaId = 'dharma' | 'artha' | 'kama' | 'moksha'
export type AgniInitiationMode = 'survival' | 'sustenance' | 'purpose' | 'mixed'
export type MoneyMode = 'lineage' | 'grind' | 'peak_karma'
export type DashaEnergy = 'active' | 'reactive'
export type PredictMode = 'full' | 'guidance'
export type PredictionTone = 'favorable' | 'supportive' | 'mixed' | 'caution'

export interface TattvaHouseOccupant {
  id: GrahaId
  name: string
  house: number
  rashi: Rashi
  rashiName: string
}

export interface TrikonaScore {
  id: TrikonaId
  tattva: TattvaId
  label: string
  sanskrit: string
  houses: readonly number[]
  planetCount: number
  occupants: TattvaHouseOccupant[]
  headline: string
  detail: string
}

export interface AgniInitiation {
  mode: AgniInitiationMode
  label: string
  detail: string
  houseFocus: number | null
  tone: PredictionTone
}

export interface MoneyTypeReading {
  mode: MoneyMode
  house: 2 | 6 | 10
  label: string
  detail: string
  planetCount: number
  dominant: boolean
}

export interface NetworkReading {
  planetCount: number
  load: 'quiet' | 'moderate' | 'strong'
  rahuInAirTrikona: boolean
  headline: string
  detail: string
  tone: PredictionTone
}

export interface MokshaReading {
  planetCount: number
  house4Count: number
  house8Count: number
  house12Count: number
  fourEightTension: boolean
  headline: string
  detail: string
  tone: PredictionTone
}

export interface DashaFlavorLevel {
  level: 'maha' | 'antar'
  lord: GrahaId
  lordName: string
  rashi: Rashi | null
  rashiName: string | null
  energy: DashaEnergy | null
  note: string
}

export interface DashaFlavor {
  levels: DashaFlavorLevel[]
  spiceNote: string
  ketuMahadasha: boolean
  sunMahadasha: boolean
  moonInPath: boolean
}

export interface LifeStability {
  d1: { movable: number; fixed: number; dual: number; dominant: SignModality; note: string }
  d10: { movable: number; fixed: number; dual: number; dominant: SignModality; note: string } | null
  headline: string
}

export interface TattvaRemedy {
  id: string
  title: string
  text: string
  tone: PredictionTone
  blockedByKetu?: boolean
}

/** Three-strand house remedy: house × natural karaka × rashi (lord). */
export interface HouseRemedyComposition {
  house: HouseNumber1to12
  houseThemes: string
  rashi: Rashi
  rashiName: string
  rashiLord: GrahaId
  rashiLordName: string
  /** Primary naisargika karakas for the house */
  karakas: GrahaId[]
  karakaNames: string[]
  /** Extra session-aware significators (e.g. Ve/Ke for H12) */
  secondaryKarakas: GrahaId[]
  occupants: TattvaHouseOccupant[]
  /** Why this house was prioritized */
  priorityReason: string
  strands: {
    house: string
    karaka: string
    rashi: string
  }
  /** Combined educational remedy paragraph */
  synthesis: string
  /** Soft 10th-house Sun vs Saturn tip when relevant */
  tenthCareerNote: string | null
  moonBlocked: boolean
  tone: PredictionTone
}

export interface TattvaPredictionResult {
  educationalNote: string
  dominantTrikona: TrikonaId
  trikonas: TrikonaScore[]
  agni: AgniInitiation
  money: MoneyTypeReading[]
  network: NetworkReading
  moksha: MokshaReading
  dashaFlavor: DashaFlavor
  predictMode: PredictMode
  predictModeNote: string
  lifeStability: LifeStability
  remedies: TattvaRemedy[]
  /** Auto-prioritized house × karaka × rashi packs */
  houseRemedies: HouseRemedyComposition[]
  headlines: string[]
}

export interface AnalyzeTattvaPredictionInput {
  grahas: GrahaData[]
  ascRashi: Rashi
  dashaNodes?: DashaNode[]
  /** Dashamsha planet rashis when available */
  d10Grahas?: GrahaData[]
  d10Asc?: Rashi
  now?: Date
  /** Output language (default English). */
  lang?: EngineLang
}

const EDUCATIONAL_NOTE =
  'Educational tattva synthesis from signs, houses, and dasha — concept over rigid formula. ' +
  'Active/Reactive is spice (initiative vs reaction), not profit/loss. Not medical, legal, or event certainty.'

const TRI_DEF: {
  id: TrikonaId
  tattva: TattvaId
  label: string
  sanskrit: string
  houses: readonly number[]
}[] = [
  { id: 'dharma', tattva: 'agni', label: 'Dharma · Fire', sanskrit: 'Agni Tattva', houses: [1, 5, 9] },
  { id: 'artha', tattva: 'prithvi', label: 'Artha · Earth', sanskrit: 'Prithvi Tattva', houses: [2, 6, 10] },
  { id: 'kama', tattva: 'vayu', label: 'Kama · Air', sanskrit: 'Vayu Tattva', houses: [3, 7, 11] },
  { id: 'moksha', tattva: 'jal', label: 'Moksha · Water', sanskrit: 'Jal Tattva', houses: [4, 8, 12] },
]

const AGNI_COPY: Record<Exclude<AgniInitiationMode, 'mixed'>, { label: string; detail: string }> = {
  survival: {
    label: 'Survival initiation',
    detail:
      'Aries / 1st-house fire: starts come in energy packets — need-driven bursts, zigzag stamina. Some starts survive; some do not.',
  },
  sustenance: {
    label: 'Sustenance initiation',
    detail:
      'Leo / 5th-house fire: prefers maintaining the throne — change is costly; energy is steadier (Sun-like), not Aries spikes.',
  },
  purpose: {
    label: 'Purpose / parampara initiation',
    detail:
      'Sagittarius / 9th-house fire: internal flame — philosophy, long travel, guru-lineage, destiny-scale purpose rather than visible heat.',
  },
}

const MONEY_COPY: Record<MoneyMode, { label: string; detail: string }> = {
  lineage: {
    label: '2nd-house money',
    detail: 'Resources stored or received through lineage, birthplace, and accumulated stock.',
  },
  grind: {
    label: '6th-house money',
    detail: 'Earned through daily hard work, service, debt/disease/enemy themes (rog–rin–shatru).',
  },
  peak_karma: {
    label: '10th-house money',
    detail: 'Peak-effort karma income — condensed, hard-earned status at the height of labor.',
  },
}

function houseOf(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function wholeSignHouseSign(ascRashi: Rashi, house: number): Rashi {
  return (((ascRashi - 1 + house - 1) % 12) + 1) as Rashi
}

function isOddSign(rashi: Rashi): boolean {
  return rashi % 2 === 1
}

function classicalGrahas(grahas: GrahaData[]): GrahaData[] {
  const set = new Set<string>(TATTVA_GRAHAS)
  return grahas.filter((g) => set.has(g.id))
}

function gName(id: GrahaId, lang: EngineLang): string {
  return (lang === 'hi' ? GRAHA_HI[id] : GRAHA_NAMES[id]) ?? id
}

function rName(r: Rashi, lang: EngineLang): string {
  return lang === 'hi' ? RASHI_HI[r] : RASHI_NAMES[r]
}

function houseThemesText(house: HouseNumber1to12, lang: EngineLang): string {
  return lang === 'hi' ? HOUSE_KARAKA_THEMES_HI[house] : NATURAL_HOUSE_KARAKAS[house].themes
}

function findGraha(grahas: GrahaData[], id: GrahaId): GrahaData | undefined {
  return grahas.find((g) => g.id === id)
}

function asGrahaId(lord: string): GrahaId | null {
  return (TATTVA_GRAHAS as string[]).includes(lord) ? (lord as GrahaId) : null
}

const SIGN_LORDS: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

/** Educational karaka practice hints (session + classical flavour). */
const KARAKA_PRACTICE: Partial<Record<GrahaId, string>> = {
  Su: 'Surya — early rising, temple/dharma seva, honest authority, avoid late nights',
  Mo: 'Chandra — clean food/home, mother/elder care, calm discourse (not during Ketu MD)',
  Ma: 'Mangal — disciplined effort, protect boundaries, channel heat into service not quarrel',
  Me: 'Budha — clear speech, skill study, truthful paperwork and learning',
  Ju: 'Guru — teaching/dana, mentorship, scripture or ethical counsel',
  Ve: 'Shukra — beauty with restraint, relationship harmony, restful private space',
  Sa: 'Shani — patience, routine duty, long service, accept time’s structure',
  Ra: 'Rahu — reality-check unconventional ambition; avoid intoxicating shortcuts',
  Ke: 'Ketu — detachment, research/moksha study, jnana over emotional activation',
}

/** Session extras beyond the naisargika table. */
function secondaryKarakasForHouse(house: HouseNumber1to12): GrahaId[] {
  if (house === 12) return ['Ve', 'Ke'] // bedroom / moksha / “seeing in the dark”
  if (house === 9) return ['Su'] // temples already with Ju; Su reinforces
  return []
}

function karakaStrand(house: HouseNumber1to12, karakas: GrahaId[], secondary: GrahaId[], lang: EngineLang = 'en'): string {
  const all = [...new Set([...karakas, ...secondary])]
  if (lang === 'hi') {
    return fill(TH.karakaStrand, {
      h: house,
      themes: HOUSE_KARAKA_THEMES_HI[house],
      names: all.map((id) => gName(id, 'hi')).join(', '),
      practices: all.map((id) => KARAKA_PRACTICE_HI[id]).filter(Boolean).join('। '),
    })
  }
  const practices = all
    .map((id) => KARAKA_PRACTICE[id])
    .filter(Boolean)
  const names = all.map((id) => GRAHA_NAMES[id] ?? id).join(', ')
  const themes = NATURAL_HOUSE_KARAKAS[house].themes
  return `Natural karakas for H${house} (${themes}): ${names}. ${practices.join('. ')}.`
}

function rashiStrand(rashi: Rashi, lord: GrahaId, lang: EngineLang = 'en'): string {
  if (lang === 'hi') {
    const lordHi = gName(lord, 'hi')
    const hint = RASHI_FIRST_REMEDY_HI[rashi] ?? fill(TH.rashiHintFallback, { rashi: RASHI_HI[rashi], lord: lordHi })
    return fill(TH.rashiStrand, { rashi: RASHI_HI[rashi], lord: lordHi, hint })
  }
  const profile = RASHI_PROFILES[rashi]
  const lordName = GRAHA_NAMES[lord] ?? lord
  const rashiHint = profile?.remedies?.[0]
    ?? `Honour ${RASHI_NAMES[rashi]} qualities through its lord ${lordName}.`
  const lordRow = RASHI_LORDS.find((r) => r.number === rashi)
  return `Sign on the house: ${RASHI_NAMES[rashi]} (lord ${lordRow?.lordEnglish ?? lordName}). ${rashiHint}`
}

function houseStrand(house: HouseNumber1to12, lang: EngineLang = 'en'): string {
  if (lang === 'hi') {
    return fill(TH.houseStrand, { h: house, short: HOUSE_THEMES_HI[house]?.shortThemes ?? HOUSE_KARAKA_THEMES_HI[house] })
  }
  const theme = HOUSE_THEMES[house]
  const short = theme?.shortThemes ?? NATURAL_HOUSE_KARAKAS[house].themes
  return `House H${house} — ${short}. Support this bhava’s topics directly (environment, duty, and relationships tied to it).`
}

function tenthCareerNote(
  house: HouseNumber1to12,
  occupants: TattvaHouseOccupant[],
  grahas: GrahaData[],
  lang: EngineLang = 'en',
): string | null {
  if (house !== 10) return null
  const su = findGraha(grahas, 'Su')
  const sa = findGraha(grahas, 'Sa')
  const sunIn10 = occupants.some((o) => o.id === 'Su')
  const satIn10 = occupants.some((o) => o.id === 'Sa')
  // Soft heuristic: Sun dignity or occupancy → managerial; else Saturn routine
  const sunStrong =
    sunIn10 ||
    su?.dignity === 'exalted' ||
    su?.dignity === 'own' ||
    su?.dignity === 'moolatrikona'
  if (sunStrong && !satIn10) {
    if (lang === 'hi') return TH.tenthSun
    return '10th tip: managerial / authority flavour — tendency Sun (leadership, government/senior duty) more than pure Saturn grind.'
  }
  if (satIn10 || sa) {
    if (lang === 'hi') return TH.tenthSaturn
    return '10th tip: routine service / long grind — tendency Saturn (patience, structure). If promotions and authority rise, gradually emphasise Sun.'
  }
  if (lang === 'hi') return TH.tenthDefault
  return '10th tip: Saturn for routine karma; Sun when the role is managerial or publicly authoritative.'
}

/**
 * Compose one house’s remedy from (1) house, (2) natural karakas, (3) rashi/lord.
 */
export function composeHouseRemedy(input: {
  house: number
  grahas: GrahaData[]
  ascRashi: Rashi
  ketuMahadasha?: boolean
  priorityReason?: string
  lang?: EngineLang
}): HouseRemedyComposition | null {
  if (input.house < 1 || input.house > 12) return null
  const lang = input.lang ?? 'en'
  const house = input.house as HouseNumber1to12
  const rashi = wholeSignHouseSign(input.ascRashi, house)
  const rashiLord = SIGN_LORDS[rashi]
  const karakas = getNaturalKarakasForHouse(house)
  const secondary = secondaryKarakasForHouse(house)
  const occupants = occupantsInHouses(input.grahas, input.ascRashi, [house], lang)
  const moonInMix = [...karakas, ...secondary, rashiLord].includes('Mo')
  const moonBlocked = !!(input.ketuMahadasha && moonInMix)

  const strands = {
    house: houseStrand(house, lang),
    karaka: karakaStrand(house, karakas, secondary, lang),
    rashi: rashiStrand(rashi, rashiLord, lang),
  }

  let synthesis = lang === 'hi'
    ? fill(TH.synthesis, strands)
    :
    `Combine all three: ${strands.house} ${strands.karaka} ${strands.rashi} ` +
    'Use the triad together — sign alone or karaka (natural indicator) alone is weaker than the full braid.'

  if (moonBlocked) {
    synthesis += lang === 'hi' ? TH.synthesisMoonBlocked :
      ' Ketu Mahadasha active: skip Moon-nourishing practices in this pack; prefer Ketu/jnana and non-Moon karakas (natural indicator).'
  }

  const tone: PredictionTone =
    house === 6 || house === 8 || house === 12 || moonBlocked ? 'caution' : 'supportive'

  return {
    house,
    houseThemes: houseThemesText(house, lang),
    rashi,
    rashiName: rName(rashi, lang),
    rashiLord,
    rashiLordName: gName(rashiLord, lang),
    karakas,
    karakaNames: karakas.map((id) => gName(id, lang)),
    secondaryKarakas: secondary,
    occupants,
    priorityReason: input.priorityReason ?? (lang === 'hi' ? fill(TH.userSelected, { h: house }) : `User-selected H${house}`),
    strands,
    synthesis,
    tenthCareerNote: tenthCareerNote(house, occupants, input.grahas, lang),
    moonBlocked,
    tone,
  }
}

/** Pick up to `limit` houses that most need educational remedy framing. */
export function prioritizeRemedyHouses(
  grahas: GrahaData[],
  ascRashi: Rashi,
  moksha: MokshaReading,
  money: MoneyTypeReading[],
  limit = 4,
  lang: EngineLang = 'en',
): { house: HouseNumber1to12; reason: string }[] {
  const hi = lang === 'hi'
  const scored: { house: HouseNumber1to12; score: number; reason: string }[] = []

  for (let h = 1; h <= 12; h++) {
    const house = h as HouseNumber1to12
    const occ = occupantsInHouses(grahas, ascRashi, [house])
    let score = occ.length
    let reason = hi
      ? fill(occ.length ? TH.reasonPlanets : TH.reasonEmpty, { h: house, n: occ.length })
      : occ.length ? `${occ.length} planet(s) in house ${house}` : `Empty H${house}`

    if (house === 6 || house === 8 || house === 12) {
      score += 1.5 + occ.length * 0.5
      reason = hi ? fill(TH.reasonDusthana, { h: house, n: occ.length }) : `Dusthana H${house} · ${occ.length} occupant(s)`
    }
    if (moksha.fourEightTension && (house === 4 || house === 8)) {
      score += 2
      reason = hi ? fill(TH.reasonTension, { h: house }) : `4–8 tension · H${house}`
    }
    const moneyLead = money.find((m) => m.dominant && m.house === house)
    if (moneyLead) {
      score += 1.25
      reason = hi ? fill(TH.reasonMoney, { h: house }) : `Lead money type · H${house}`
    }
    scored.push({ house, score, reason })
  }

  scored.sort((a, b) => b.score - a.score || a.house - b.house)
  return scored.slice(0, limit).map(({ house, reason }) => ({ house, reason }))
}

function buildHouseRemedies(
  grahas: GrahaData[],
  ascRashi: Rashi,
  moksha: MokshaReading,
  money: MoneyTypeReading[],
  ketuMahadasha: boolean,
  lang: EngineLang = 'en',
): HouseRemedyComposition[] {
  const picks = prioritizeRemedyHouses(grahas, ascRashi, moksha, money, 4, lang)
  const out: HouseRemedyComposition[] = []
  for (const p of picks) {
    const c = composeHouseRemedy({
      house: p.house,
      grahas,
      ascRashi,
      ketuMahadasha,
      priorityReason: p.reason,
      lang,
    })
    if (c) out.push(c)
  }
  return out
}

function modalityCounts(grahas: GrahaData[]): { movable: number; fixed: number; dual: number; dominant: SignModality } {
  let movable = 0
  let fixed = 0
  let dual = 0
  for (const g of classicalGrahas(grahas)) {
    const m = signModality(g.rashi)
    if (m === 'movable') movable++
    else if (m === 'fixed') fixed++
    else dual++
  }
  const dominant: SignModality =
    movable >= fixed && movable >= dual ? 'movable' : fixed >= dual ? 'fixed' : 'dual'
  return { movable, fixed, dual, dominant }
}

function modalityNote(dom: SignModality, movable: number, fixed: number, dual: number, lang: EngineLang = 'en'): string {
  if (lang === 'hi') {
    const tpl = dom === 'movable' ? TH.modalityMovable : dom === 'fixed' ? TH.modalityFixed : TH.modalityDual
    return fill(tpl, { movable, fixed, dual })
  }
  if (dom === 'movable') {
    return `Chara-heavy (${movable} movable vs ${fixed} fixed / ${dual} dual) — life tends to reinvent on short cycles.`
  }
  if (dom === 'fixed') {
    return `Sthira-heavy (${fixed} fixed) — fewer outer changes; patterns stick.`
  }
  return `Dwiswabhava-heavy (${dual} dual) — some tracks stay fixed while others renegotiate.`
}

function occupantsInHouses(
  grahas: GrahaData[],
  ascRashi: Rashi,
  houses: readonly number[],
  lang: EngineLang = 'en',
): TattvaHouseOccupant[] {
  const want = new Set(houses)
  const out: TattvaHouseOccupant[] = []
  for (const g of classicalGrahas(grahas)) {
    const house = houseOf(g.rashi, ascRashi)
    if (!want.has(house)) continue
    out.push({
      id: g.id,
      name: lang === 'hi' ? GRAHA_HI[g.id] ?? g.name : GRAHA_NAMES[g.id] ?? g.name,
      house,
      rashi: g.rashi,
      rashiName: lang === 'hi' ? RASHI_HI[g.rashi] ?? g.rashiName : RASHI_NAMES[g.rashi] ?? g.rashiName,
    })
  }
  return out.sort((a, b) => a.house - b.house || a.id.localeCompare(b.id))
}

function countInHouse(occupants: TattvaHouseOccupant[], house: number): number {
  return occupants.filter((o) => o.house === house).length
}

function buildTrikonas(grahas: GrahaData[], ascRashi: Rashi, lang: EngineLang = 'en'): TrikonaScore[] {
  return TRI_DEF.map((def) => {
    const occupants = occupantsInHouses(grahas, ascRashi, def.houses, lang)
    const planetCount = occupants.length
    if (lang === 'hi') {
      const lines = TH[def.id]
      const band = planetCount >= 4 ? 0 : planetCount >= 2 ? 1 : 2
      const tri = TRI_DEF_HI[def.id]!
      return {
        id: def.id,
        tattva: def.tattva,
        label: tri.label,
        sanskrit: tri.sanskrit,
        houses: def.houses,
        planetCount,
        occupants,
        headline: lines[band]!,
        detail: `${fill(TH.triDetail, { houses: def.houses.join(', '), n: planetCount })} ${TH[`${def.id}Detail`]}`,
      }
    }
    let headline = `${def.label}: light load`
    let detail = `Houses ${def.houses.join(', ')} hold ${planetCount} classical planet(s).`

    if (def.id === 'dharma') {
      headline =
        planetCount >= 4
          ? 'Fire/Dharma runs loud — initiation and action themes dominate'
          : planetCount >= 2
            ? 'Fire/Dharma is active — starts and purpose matter'
            : 'Fire/Dharma is quieter — action may need external spark'
      detail = `${detail} Agni flavors: survival (H1), sustenance (H5), purpose (H9).`
    } else if (def.id === 'artha') {
      headline =
        planetCount >= 4
          ? 'Earth/Artha heavy — resources and livelihood are central'
          : planetCount >= 2
            ? 'Earth/Artha engaged — money and work structures matter'
            : 'Earth/Artha lighter — wealth themes may need activation'
      detail = `${detail} Money types: lineage (H2), grind (H6), peak karma (H10).`
    } else if (def.id === 'kama') {
      headline =
        planetCount >= 4
          ? 'Air/Kama strong — speech, partners, and networks amplify'
          : planetCount >= 2
            ? 'Air/Kama present — communication and alliances matter'
            : 'Air/Kama quieter — networking may need conscious effort'
      detail = `${detail} H3 speech/skills, H7 partners, H11 groups and gains.`
    } else {
      headline =
        planetCount >= 4
          ? 'Water/Moksha loaded — emotional and liberation themes intensify'
          : planetCount >= 2
            ? 'Water/Moksha active — impressions and inner work matter'
            : 'Water/Moksha lighter — emotional depth may be background'
      detail = `${detail} H4 heart/home, H8 crisis/research, H12 liberation.`
    }

    return {
      id: def.id,
      tattva: def.tattva,
      label: def.label,
      sanskrit: def.sanskrit,
      houses: def.houses,
      planetCount,
      occupants,
      headline,
      detail,
    }
  })
}

function buildAgni(grahas: GrahaData[], ascRashi: Rashi, dharma: TrikonaScore, lang: EngineLang = 'en'): AgniInitiation {
  const hi = lang === 'hi'
  const c1 = countInHouse(dharma.occupants, 1)
  const c5 = countInHouse(dharma.occupants, 5)
  const c9 = countInHouse(dharma.occupants, 9)
  const max = Math.max(c1, c5, c9)

  // Also nudge by natural fire signs sitting as those houses
  const h1Sign = wholeSignHouseSign(ascRashi, 1)
  const h5Sign = wholeSignHouseSign(ascRashi, 5)
  const h9Sign = wholeSignHouseSign(ascRashi, 9)
  const fireBoost = (sign: Rashi, base: number) => base + (sign === 1 || sign === 5 || sign === 9 ? 0.25 : 0)

  const scores = [
    { mode: 'survival' as const, house: 1, score: fireBoost(h1Sign, c1) + (h1Sign === 1 ? 0.5 : 0) },
    { mode: 'sustenance' as const, house: 5, score: fireBoost(h5Sign, c5) + (h5Sign === 5 ? 0.5 : 0) },
    { mode: 'purpose' as const, house: 9, score: fireBoost(h9Sign, c9) + (h9Sign === 9 ? 0.5 : 0) },
  ]
  scores.sort((a, b) => b.score - a.score)

  if (max === 0 && scores[0]!.score < 0.5) {
    return {
      mode: 'mixed',
      label: hi ? TH.agniQuietLabel : 'Initiation pattern mixed / quiet',
      detail: hi ? TH.agniQuietDetail :
        'Few planets in the Dharma trikona (trine houses: 1, 5, 9) — initiation style follows lagna and dasha lords more than fire-house load.',
      houseFocus: null,
      tone: 'mixed',
    }
  }

  const top = scores[0]!
  const second = scores[1]!
  if (Math.abs(top.score - second.score) < 0.15 && top.score > 0) {
    return {
      mode: 'mixed',
      label: hi ? TH.agniMixedLabel : 'Mixed fire initiation',
      detail: hi
        ? fill(TH.agniMixedDetail, { a: top.house, b: second.house, first: AGNI_COPY_HI[top.mode].label, second: AGNI_COPY_HI[second.mode].label })
        : `H${top.house} and H${second.house} compete — blend ${AGNI_COPY[top.mode].label.toLowerCase()} with ${AGNI_COPY[second.mode].label.toLowerCase()}.`,
      houseFocus: top.house,
      tone: 'mixed',
    }
  }

  const copy = hi ? AGNI_COPY_HI[top.mode] : AGNI_COPY[top.mode]
  return {
    mode: top.mode,
    label: copy.label,
    detail: copy.detail,
    houseFocus: top.house,
    tone: 'supportive',
  }
}

function buildMoney(artha: TrikonaScore, lang: EngineLang = 'en'): MoneyTypeReading[] {
  const copy = lang === 'hi' ? MONEY_COPY_HI : MONEY_COPY
  const modes: { mode: MoneyMode; house: 2 | 6 | 10 }[] = [
    { mode: 'lineage', house: 2 },
    { mode: 'grind', house: 6 },
    { mode: 'peak_karma', house: 10 },
  ]
  const rows = modes.map(({ mode, house }) => {
    const planetCount = countInHouse(artha.occupants, house)
    return {
      mode,
      house,
      label: copy[mode].label,
      detail: copy[mode].detail,
      planetCount,
      dominant: false,
    }
  })
  const max = Math.max(...rows.map((r) => r.planetCount), 0)
  if (max > 0) {
    for (const r of rows) {
      if (r.planetCount === max) r.dominant = true
    }
  }
  return rows
}

function buildNetwork(kama: TrikonaScore, lang: EngineLang = 'en'): NetworkReading {
  const hi = lang === 'hi'
  const planetCount = kama.planetCount
  const rahuInAirTrikona = kama.occupants.some((o) => o.id === 'Ra')
  const load: NetworkReading['load'] =
    planetCount >= 4 ? 'strong' : planetCount >= 2 ? 'moderate' : 'quiet'
  let headline = hi ? TH.networkQuiet[0]! : 'Network / speech load is quiet'
  let detail = hi ? TH.networkQuiet[1]! : 'Few planets in 3–7–11 — alliances and audiences may need deliberate cultivation.'
  let tone: PredictionTone = 'mixed'

  if (load === 'strong') {
    headline = hi ? TH.networkStrong[0]! : 'Strong Vayu network — speech, partners, groups amplify'
    detail = hi ? TH.networkStrong[1]! :
      'Multiple planets in 3–7–11 favor communication, partnerships, and large audiences. Social reach themes can dominate.'
    tone = 'supportive'
  } else if (load === 'moderate') {
    headline = hi ? TH.networkModerate[0]! : 'Moderate air trikona (trine houses: 1, 5, 9) — connections matter in selected areas'
    detail = hi ? TH.networkModerate[1]! : 'Enough 3–7–11 occupancy for meaningful alliances without total network identity.'
    tone = 'supportive'
  }

  if (rahuInAirTrikona) {
    detail += hi ? TH.networkRahu :
      ' Rahu in this triangle amplifies outsider / unconventional reach (neighbors → partners → networks).'
    tone = load === 'quiet' ? 'mixed' : 'favorable'
  }

  return { planetCount, load, rahuInAirTrikona, headline, detail, tone }
}

function buildMoksha(moksha: TrikonaScore, lang: EngineLang = 'en'): MokshaReading {
  const hi = lang === 'hi'
  const house4Count = countInHouse(moksha.occupants, 4)
  const house8Count = countInHouse(moksha.occupants, 8)
  const house12Count = countInHouse(moksha.occupants, 12)
  const fourEightTension = house4Count >= 1 && house8Count >= 1
  let headline = hi ? TH.mokshaBackground[0]! : 'Moksha trikona is background'
  let detail = hi ? TH.mokshaBackground[1]! : 'H4/H8/H12 are lightly occupied — emotional impressions may be quieter.'
  let tone: PredictionTone = 'mixed'

  if (moksha.planetCount >= 4) {
    headline = hi ? TH.mokshaLoaded[0]! : 'Moksha triangle loaded — deep impressions and liberation themes'
    detail = hi ? TH.mokshaLoaded[1]! : 'Water houses carry several planets — home/heart, crisis/research, and release all speak.'
    tone = 'caution'
  } else if (moksha.planetCount >= 2) {
    headline = hi ? TH.mokshaActive[0]! : 'Moksha themes are active'
    detail = hi ? TH.mokshaActive[1]! : 'Enough water-house occupancy for emotional sanskara and inner work to matter.'
    tone = 'mixed'
  }

  if (fourEightTension) {
    headline = hi ? TH.mokshaTension : '4th–8th tension flagged'
    detail += hi ? TH.mokshaTensionDetail :
      ' When 8th-house pressure rises, the 4th (heart/home) often feels it; a strong 4th also supports weathering 8th storms. Over-indulging 4th comforts can stall 8th research/depth.'
    tone = 'caution'
  }

  return {
    planetCount: moksha.planetCount,
    house4Count,
    house8Count,
    house12Count,
    fourEightTension,
    headline,
    detail,
    tone,
  }
}

function energyForRashi(rashi: Rashi): DashaEnergy {
  return isOddSign(rashi) ? 'active' : 'reactive'
}

function buildDashaFlavor(
  grahas: GrahaData[],
  dashaNodes: DashaNode[] | undefined,
  now: Date,
  lang: EngineLang = 'en',
): DashaFlavor {
  const hi = lang === 'hi'
  const levels: DashaFlavorLevel[] = []
  let ketuMahadasha = false
  let sunMahadasha = false
  let moonInPath = false

  if (dashaNodes?.length) {
    const path = getCurrentDasha(dashaNodes, now)
    const maha = path[0]
    const antar = path[1]
    if (maha) {
      const lord = asGrahaId(maha.lord)
      if (lord === 'Ke') ketuMahadasha = true
      if (lord === 'Su') sunMahadasha = true
      if (lord === 'Mo') moonInPath = true
      if (lord) {
        const g = findGraha(grahas, lord)
        const rashi = g?.rashi ?? null
        const energy = rashi != null ? energyForRashi(rashi) : null
        levels.push({
          level: 'maha',
          lord,
          lordName: gName(lord, lang),
          rashi,
          rashiName: rashi != null ? rName(rashi, lang) : null,
          energy,
          note: hi
            ? energy === 'active' ? TH.mahaActive : energy === 'reactive' ? TH.mahaReactive : TH.mahaUnknown
            :
            energy === 'active'
              ? 'Odd-sign placement — initiative / create-action flavor this Mahadasha (spice, not sole verdict).'
              : energy === 'reactive'
                ? 'Even-sign placement — respond / react flavor this Mahadasha (spice, not sole verdict).'
                : 'Lord position unavailable for Active/Reactive spice.',
        })
      }
    }
    if (antar) {
      const lord = asGrahaId(antar.lord)
      if (lord === 'Mo') moonInPath = true
      if (lord) {
        const g = findGraha(grahas, lord)
        const rashi = g?.rashi ?? null
        const energy = rashi != null ? energyForRashi(rashi) : null
        levels.push({
          level: 'antar',
          lord,
          lordName: gName(lord, lang),
          rashi,
          rashiName: rashi != null ? rName(rashi, lang) : null,
          energy,
          note: hi
            ? energy === 'active' ? TH.antarActive : energy === 'reactive' ? TH.antarReactive : TH.antarUnknown
            :
            energy === 'active'
              ? 'Antardasha in odd sign — easier to initiate within the mahadasha frame.'
              : energy === 'reactive'
                ? 'Antardasha in even sign — results often come as response to what already started.'
                : 'Antar lord position unavailable.',
        })
      }
    }
  }

  return {
    levels,
    spiceNote: hi ? TH.spiceNote :
      'Odd = Active (you initiate); Even = Reactive (you respond). Supporting flavor only — never the main dish.',
    ketuMahadasha,
    sunMahadasha,
    moonInPath,
  }
}

function buildRemedies(flavor: DashaFlavor, predictMode: PredictMode, lang: EngineLang = 'en'): TattvaRemedy[] {
  const out: TattvaRemedy[] = []
  const hi = lang === 'hi'

  if (predictMode === 'guidance' || flavor.moonInPath) {
    const blocked = flavor.ketuMahadasha
    out.push({
      id: 'moon-sadhana',
      title: hi ? (blocked ? TH.moonBlockedTitle : TH.moonTitle) : blocked ? 'Moon period inside Ketu Mahadasha' : 'Moon Mahadasha / Antardasha',
      text: hi ? (blocked ? TH.moonBlockedText : TH.moonText) : blocked
        ? 'Do not stack Moon-nourishing remedies while Ketu rules the mahadasha — prefer moksha-trikona (trine houses: 1, 5, 9) / jnana practices instead. Firm event forecasts stay soft.'
        : 'Prefer quiet sadhana and listening to a stable guru/katha over firm event predictions — the mind shifts daily. Discourse nourishes Chandra (emotions).',
      tone: blocked ? 'caution' : 'supportive',
      blockedByKetu: blocked,
    })
  }

  if (flavor.ketuMahadasha) {
    out.push({
      id: 'ketu-moksha',
      title: hi ? TH.ketuTitle : 'Ketu Mahadasha protocol',
      text: hi ? TH.ketuText : 'Lean into moksha-trikona (trine houses: 1, 5, 9) practices and tattva-jñāna / Advaita-leaning study. Avoid Moon-activation remedies during this period.',
      tone: 'supportive',
    })
  }

  if (flavor.sunMahadasha) {
    out.push({
      id: 'sun-dharma',
      title: hi ? TH.sunTitle : 'Sun Mahadasha protocol',
      text: hi ? TH.sunText : 'Orient to dharma and moral clarity (Rāma-like principles); personal sacrifice often improves results. Late nights weaken Surya — keep early rhythm.',
      tone: 'supportive',
    })
  }

  out.push({
    id: 'karaka-formula',
    title: hi ? TH.formulaTitle : 'House × karaka × rashi',
    text: hi ? TH.formulaText : 'When a house troubles, combine (a) the sign on that house, (b) the natural karaka (natural indicator), and (c) the house itself — three strands give stronger educational remedy framing than any one alone. See composed packs below.',
    tone: 'mixed',
  })

  return out
}

/**
 * Chart-conditioned tattva prediction pack.
 * Returns null only when ascendant or grahas are missing.
 */
export function analyzeTattvaPrediction(
  input: AnalyzeTattvaPredictionInput,
): TattvaPredictionResult | null {
  const { grahas, ascRashi, dashaNodes, d10Grahas, d10Asc, now = new Date(), lang = 'en' } = input
  if (!grahas?.length || !ascRashi) return null
  const hi = lang === 'hi'

  const trikonas = buildTrikonas(grahas, ascRashi, lang)
  const byId = Object.fromEntries(trikonas.map((t) => [t.id, t])) as Record<TrikonaId, TrikonaScore>
  const dominantTrikona = [...trikonas].sort((a, b) => b.planetCount - a.planetCount)[0]!.id

  const agni = buildAgni(grahas, ascRashi, byId.dharma, lang)
  const money = buildMoney(byId.artha, lang)
  const network = buildNetwork(byId.kama, lang)
  const moksha = buildMoksha(byId.moksha, lang)
  const dashaFlavor = buildDashaFlavor(grahas, dashaNodes, now, lang)

  const predictMode: PredictMode = dashaFlavor.moonInPath ? 'guidance' : 'full'
  const predictModeNote = predictModeText(predictMode, lang)

  const d1Counts = modalityCounts(grahas)
  const d1Note = modalityNote(d1Counts.dominant, d1Counts.movable, d1Counts.fixed, d1Counts.dual, lang)
  let d10Block: LifeStability['d10'] = null
  if (d10Grahas?.length && d10Asc) {
    const c = modalityCounts(d10Grahas)
    d10Block = {
      ...c,
      note: modalityNote(c.dominant, c.movable, c.fixed, c.dual, lang),
    }
  }

  const lifeStability: LifeStability = {
    d1: { ...d1Counts, note: d1Note },
    d10: d10Block,
    headline: hi
      ? d10Block
        ? fill(TH.stabilityD10, { d1: MODALITY_HI[d1Counts.dominant]!, d10: MODALITY_HI[d10Block.dominant]! })
        : fill(TH.stabilityD1, { d1: MODALITY_HI[d1Counts.dominant]!, note: d1Note })
      : d10Block
      ? `D1 ${d1Counts.dominant} · D10 ${d10Block.dominant} — compare career change tempo with life map`
      : `D1 ${d1Counts.dominant} — ${d1Note}`,
  }

  const remedies = buildRemedies(dashaFlavor, predictMode, lang)
  const houseRemedies = buildHouseRemedies(
    grahas,
    ascRashi,
    moksha,
    money,
    dashaFlavor.ketuMahadasha,
    lang,
  )

  const headlines: string[] = [
    byId[dominantTrikona].headline,
    agni.label,
    network.headline,
    moksha.headline,
  ]
  if (predictMode === 'guidance') {
    headlines.unshift(hi ? TH.headlineGuidance : 'Moon period — guidance mode (soft predictions)')
  }
  const maha = dashaFlavor.levels.find((l) => l.level === 'maha')
  if (maha?.energy) {
    headlines.push(hi ? fill(TH.headlineMd, { lord: maha.lordName, energy: dashaEnergyLabel(maha.energy, 'hi') }) : `MD ${maha.lordName}: ${maha.energy} spice`)
  }
  if (houseRemedies[0]) {
    headlines.push(hi ? fill(TH.headlineRemedy, { h: houseRemedies[0].house, rashi: houseRemedies[0].rashiName }) : `Remedy focus H${houseRemedies[0].house} · ${houseRemedies[0].rashiName}`)
  }

  return {
    educationalNote: hi ? EDUCATIONAL_NOTE_HI : EDUCATIONAL_NOTE,
    dominantTrikona,
    trikonas,
    agni,
    money,
    network,
    moksha,
    dashaFlavor,
    predictMode,
    predictModeNote,
    lifeStability,
    remedies,
    houseRemedies,
    headlines,
  }
}

/** Compact dasha-panel helper — flavor + Moon gate only. */
export function analyzeTattvaDashaOverlay(
  grahas: GrahaData[],
  dashaNodes: DashaNode[] | undefined,
  now: Date = new Date(),
  lang: EngineLang = 'en',
): Pick<TattvaPredictionResult, 'dashaFlavor' | 'predictMode' | 'predictModeNote' | 'remedies'> | null {
  if (!grahas?.length) return null
  const dashaFlavor = buildDashaFlavor(grahas, dashaNodes, now, lang)
  const predictMode: PredictMode = dashaFlavor.moonInPath ? 'guidance' : 'full'
  return {
    dashaFlavor,
    predictMode,
    predictModeNote: predictModeText(predictMode, lang),
    remedies: buildRemedies(dashaFlavor, predictMode, lang),
  }
}

function predictModeText(predictMode: PredictMode, lang: EngineLang): string {
  if (lang === 'hi') return predictMode === 'guidance' ? TH.guidanceNote : TH.fullNote
  return predictMode === 'guidance'
    ? 'Moon is in the current Mahadasha or Antardasha path — firm event predictions are softened; show sadhana guidance instead.'
    : 'Current dasha path is not Moon-led — full educational prediction pack is available (still not certainty).'
}

export function tattvaToneColor(tone: PredictionTone): string {
  if (tone === 'favorable') return 'var(--teal)'
  if (tone === 'supportive') return 'var(--gold)'
  if (tone === 'caution') return 'var(--rose)'
  return 'var(--text-muted)'
}

export function dashaEnergyLabel(energy: DashaEnergy, lang: EngineLang = 'en'): string {
  if (lang === 'hi') return energy === 'active' ? TH.active : TH.reactive
  return energy === 'active' ? 'Active' : 'Reactive'
}
