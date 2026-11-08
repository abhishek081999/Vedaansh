// ─────────────────────────────────────────────────────────────
//  src/lib/engine/chaturthamsaAnalysis.ts
//  Chaturthamsha (D4) — home, happiness, personal space, relocation
//  Class methodology: lagna hierarchy, key triad, houses, dasha moves
// ─────────────────────────────────────────────────────────────

import type {
  ChartOutput,
  Dignity,
  GrahaData,
  GrahaId,
  Rashi,
} from '@/types/astrology'
import {
  RASHI_SANSKRIT,
} from '@/types/astrology'
import { dignityText, fill, gName, pick, rName, type EngineLang } from '@/lib/engine/divisionalLang'
import {
  D4_DASHA_LEVEL_HI,
  D4_HOUSE_THEMES_HI,
  D4_LAGNA_PLANET_HI,
  D4_LAGNA_SIGN_FLAVOR_HI,
  D4_PURPOSE_HI,
  D4_RAHU_SIGN_EXTRAS_HI,
  D4_TEXT_HI,
} from '@/lib/engine/locale/chaturthamsa.hi'
import { hasParasharaAspect } from '@/lib/engine/aspects'
import { getDashaPathAt } from '@/lib/engine/dasha/current'

export type D4Tone = 'supportive' | 'challenging' | 'mixed' | 'neutral'

export type D4SignalStrength = 'occupation' | 'lord' | 'aspect' | 'sign'

export interface ChaturthamsaInsight {
  kind: 'strength' | 'caution' | 'highlight' | 'info'
  title: string
  text: string
}

export interface ChaturthamsaPlanetRow {
  id: GrahaId
  name: string
  rashi: Rashi
  rashiName: string
  house: number
  dignity: Dignity
  isRetro: boolean
  theme: string
  interpretation: string
}

export interface ChaturthamsaLagnaOccupant {
  id: GrahaId
  name: string
  isRetro: boolean
  reading: string
  signExtras: string[]
}

export interface ChaturthamsaAspectOnLagna {
  id: GrahaId
  name: string
  fromHouse: number
  fromRashiName: string
  note: string
  /** Aspects work at roughly 30–40% of occupation strength. */
  relativeStrength: 'partial'
}

export interface ChaturthamsaLagnaHeart {
  lagna: Rashi
  lagnaName: string
  lagnaSanskrit: string
  lagnaEmpty: boolean
  occupants: ChaturthamsaLagnaOccupant[]
  lagnaLord: {
    id: GrahaId
    name: string
    house: number
    rashi: Rashi
    rashiName: string
    dignity: Dignity
    isRetro: boolean
    conjunctIds: GrahaId[]
    conjunctNames: string[]
    reading: string
  }
  aspectsOnLagna: ChaturthamsaAspectOnLagna[]
  signFlavor: string
  /** Strongest available signal for the emotional “heart”. */
  primarySignal: {
    strength: D4SignalStrength
    label: string
    detail: string
  }
  nodesOnLagna: boolean
  heartDisturbed: boolean
}

export interface ChaturthamsaKeyTriadMember {
  role: 'moon' | 'fourthLord' | 'jupiter'
  roleLabel: string
  id: GrahaId
  name: string
  house: number
  rashi: Rashi
  rashiName: string
  dignity: Dignity
  isRetro: boolean
  tone: D4Tone
  reading: string
}

export interface ChaturthamsaHouseRow {
  house: number
  rashi: Rashi
  rashiName: string
  lordId: GrahaId
  lordName: string
  occupants: { id: GrahaId; name: string; isRetro: boolean }[]
  theme: string
  reading: string
  tone: D4Tone
}

export interface ChaturthamsaDashaLordOverlay {
  level: number
  levelLabel: string
  lord: GrahaId
  lordName: string
  start: string
  end: string
  d4House: number | null
  d4RashiName: string | null
  tone: D4Tone
  note: string
}

export interface ChaturthamsaRelocation {
  eighthOccupants: { id: GrahaId; name: string }[]
  eighthLordPeriodActive: boolean
  sixthEighthDashaLink: boolean
  dashaLords: ChaturthamsaDashaLordOverlay[]
  pathLabel: string
  headline: string
  detail: string
  tone: D4Tone
  highlightHouses: number[]
}

export interface ChaturthamsaAffinityNote {
  pair: string
  title: string
  text: string
  tone: D4Tone
}

export interface ChaturthamsaConflictFlag {
  id: string
  title: string
  text: string
  tone: D4Tone
}

export interface ChaturthamsaAnalysis {
  d4Lagna: Rashi
  d4LagnaName: string
  d4LagnaSanskrit: string
  summary: string
  purpose: string
  heart: ChaturthamsaLagnaHeart
  keyTriad: ChaturthamsaKeyTriadMember[]
  planets: ChaturthamsaPlanetRow[]
  houses: ChaturthamsaHouseRow[]
  focusedHouses: ChaturthamsaHouseRow[]
  relocation: ChaturthamsaRelocation | null
  affinityGuide: ChaturthamsaAffinityNote[]
  conflictFlags: ChaturthamsaConflictFlag[]
  insights: ChaturthamsaInsight[]
  retrogradeNotes: string[]
}

const CLASSICAL_ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

const SIGN_LORDS: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const STRONG_DIGNITY: Dignity[] = ['exalted', 'moolatrikona', 'own']
const WEAK_DIGNITY: Dignity[] = ['debilitated', 'great_enemy', 'enemy']
const MALEFICS: GrahaId[] = ['Ma', 'Sa', 'Ra', 'Ke']

const DASHA_LEVEL_LABELS = ['', 'Maha', 'Antar', 'Pratyantar', 'Sukshma', 'Prana', 'Deha'] as const

const FOCUS_HOUSES = [3, 4, 6, 8, 9, 11] as const

const D4_PURPOSE =
  'Chaturthamsha expands the 4th house: what brings contentment, how personal space feels, property tone, and whether home life can be shared peacefully.'

const LAGNA_SIGN_FLAVOR: Record<Rashi, string> = {
  1: 'Mars-ruled lagna — decisive personal space; prefers built or claimed territory.',
  2: 'Venus-ruled lagna — comfort, beauty, and value in the home.',
  3: 'Mercury-ruled lagna — curious, communicative domestic style; likes variety nearby.',
  4: 'Moon-ruled lagna — emotionally sensitive home; needs nurturing atmosphere.',
  5: 'Sun-ruled lagna — dignity, boundaries, and assembly space around the house.',
  6: 'Mercury-ruled lagna — detail, service, and discernment in living arrangements.',
  7: 'Venus-ruled lagna — partnership and aesthetics shape what feels like home.',
  8: 'Mars-ruled lagna — intense, private, transformative personal space.',
  9: 'Jupiter-ruled lagna — faith, counsel, and expansive shelter themes.',
  10: 'Saturn-ruled lagna — structured, enduring, sometimes guarded residence.',
  11: 'Saturn-ruled lagna — networked, unconventional, or future-facing home setup.',
  12: 'Jupiter-ruled lagna — rest, retreat, and soft boundaries around the heart.',
}

const HOUSE_THEMES: Record<number, string> = {
  1: 'Personal space, heart, and what you obsess over at home',
  2: 'Family resources, speech at home, and domestic values',
  3: 'Communication, courage, and verbal expression in the house',
  4: 'Internal happiness — what quietly contentment looks like',
  5: 'Creativity, romance display, and joy projected from home',
  6: 'Conflict sources, friction, and betrayal themes in marriage/home',
  7: 'Partner as roommate — shared living chemistry',
  8: 'Upheaval, secrets, inheritance, and residence change pressure',
  9: 'Father’s habits as seen through the home lens; higher beliefs',
  10: 'Public service / karma as a path to happiness',
  11: 'Desire fulfillment and gains that touch the home',
  12: 'Sleep, absence from home, and private losses of comfort',
}

type LagnaBaseReading = { general: string; traits: string[] }

const LAGNA_PLANET_READINGS: Partial<Record<GrahaId, LagnaBaseReading>> = {
  Ke: {
    general:
      'Ketu on the D4 lagna makes personal space binary — either fully open-hearted or closed. Diplomacy is hard; bonding is total once trust exists. Contentment grows when Jupiter’s counsel or spiritual knowledge softens attachment and aversion.',
    traits: [
      'Fights over small things, yet bonds are hard to break',
      'Breakups feel intense; memories linger',
      'Struggles to share room/personal space; can feel trapped living with others',
      'Chooses house and vehicles by vibe more than specs',
    ],
  },
  Ra: {
    general:
      'Rahu on the D4 lagna drives endless wanting — competitive accumulation, big-ticket electronics and oversized household items, and hasty property decisions. Comfort with outsiders can exceed ease with family.',
    traits: [
      'Never fully satisfied with what is already in the house',
      'Inclined toward “ultra” gadgets and larger-than-needed appliances',
      'Attracted to mysterious or unconventional helpers',
      'May trust outside society more than familiar circles',
    ],
  },
  Sa: {
    general:
      'Saturn on the D4 lagna favors old, lasting, antique, or stone-style homes and hoards unique durable items from insecurity. Attraction to hard-to-read people is common.',
    traits: [
      'House fills with aged or long-lasting objects',
      'Avoids waste; keeps what feels secure',
      'Roommate/partner dynamics can turn duty-heavy if Saturn also ties the lagna lord',
    ],
  },
  Me: {
    general:
      'Mercury on the D4 lagna links happiness and sorrow to the maternal side, favors apartments and prominent balconies/living areas, and connects the person to many people (media, marketing, HR). Food presentation can be fussy.',
    traits: [
      'Maternal family themes color property and documents',
      'Wants visible balcony / living space and a view from above',
      'Picky about how food looks and is served',
      'Strong mass/public connection through the 4th significations',
    ],
  },
  Ju: {
    general:
      'Jupiter on the D4 lagna seeks solutions through temples, counselors, or wisdom. Prefers ground-floor living and a deity-forward entrance; home shrine often sits on the main level.',
    traits: [
      'Turns to faith or counsel when home life is stressed',
      'Ground floor / easy access preferred over stairs',
      'Wants the house to open onto a sacred or counsel-oriented presence',
    ],
  },
  Ma: {
    general:
      'Mars on the D4 lagna wants self-built territory — hills, plots, villas — and runs the house like a commander. Layout changes, renovations, DIY repairs, and watercraft/boat themes are classic.',
    traits: [
      '“Not my house until I build or reshape it”',
      'Frequent rearranging of beds, windows, and doors',
      'Keeps tools ready; opens machines to fix them',
      'Enjoys boats, cruises, or water-linked recreation',
    ],
  },
  Ve: {
    general:
      'Venus on the D4 lagna needs beauty, lawns, and market-adjacent living — branded stores and malls nearby. Comfort and aesthetic polish define “home.”',
    traits: [
      'House must feel beautiful and welcoming',
      'Prefers access to shopping and lifestyle hubs',
      'With Rahu or Aquarius flavor, entertainment/bar zones may stand out',
    ],
  },
  Su: {
    general:
      'Sun on the D4 lagna creates access and boundary themes — official-quarter feel, trees, controlled entry. The house often hosts gatherings, halls, or program space.',
    traits: [
      'Guests may be met downstairs rather than invited into the inner home',
      'Security or blocked boundaries depending on sign',
      'Community hall / assembly energy in or under the house',
    ],
  },
  Mo: {
    general:
      'Moon on the D4 lagna heightens emotional sensitivity at home. Well-placed Moon softens the atmosphere; difficult pressure can amplify domestic conflict.',
    traits: [
      'Very specific about comfort and emotional tone',
      'Needs a pleasant, nurturing domestic field',
      'Irritability rises if Mars or Saturn press the Moon',
    ],
  },
}

const RAHU_SIGN_EXTRAS: Partial<Record<Rashi, string>> = {
  1: 'In Aries: heavy-duty or adventure vehicles and rugged survival gear.',
  3: 'In Gemini: multiples of Mercury items — windows, curtains, mirrors, earphones, stationery.',
  7: 'In Libra: obsessive focus on spouse/partner comfort and presence.',
  9: 'In Sagittarius: during trouble, visits many temples and deities.',
}

const D4_TEXT_EN: Record<keyof typeof D4_TEXT_HI, string> = {
  exKeScorpio: 'In Scorpio lagna: persistent, repetitive requests (“ghuna”) until needs are met; desire stress runs high.',
  exJuPisces: 'In Pisces: natural healing empathy; often believes rest/sleep will resolve problems.',
  exVeRahu: 'Venus with Rahu or Aquarius lagna: entertainment / bar-area prominence and intoxicated social themes need mindful boundaries.',
  exSuLeo: 'Leo lagna: blocked boundaries — visiting the inner house can feel difficult.',
  exSuCap: 'Capricorn lagna: heavy security or gatekeeping before guests enter.',
  exMeAq: 'Mercury in Aquarius lagna: collecting habits (plants, information); may track family news like a private investigator.',
  lcSa: 'With Saturn: insecurity, delays, and overthinking around commitment or home decisions.',
  lcMoSa: 'Saturn–Moon (Vish-style) with the lagna lord: emotional dryness despite material comfort; marriage decisions stall through analysis.',
  lcKe: 'With Ketu: communication gaps, avoidance, or abrupt withdrawal under domestic stress.',
  lcRa: 'With Rahu: obsessive pursuit of whatever house the lagna lord occupies.',
  lcMeSa: 'Saturn–Mercury: over-analysis of feelings; loyalty fears can surface.',
  lcNames: 'Conjoined {names} — blend those graha natures into the lagna lord’s happiness story.',
  lcAlone: '{lord} alone steers the emotional address of D4.',
  aspMe: 'Mercury’s aspect eases communication around home issues (partial influence).',
  aspJu: 'Jupiter’s aspect offers counsel and contentment support (partial).',
  aspSa: 'Saturn’s aspect can dry emotions or add duty pressure on personal space (partial).',
  aspMa: 'Mars’s aspect heats the domestic field — irritability or renovation drive (partial).',
  aspMo: 'Moon’s aspect sensitizes the heart of the chart (partial).',
  aspVe: 'Venus’s aspect softens aesthetics and partnership comfort (partial).',
  aspSu: 'Sun’s aspect adds authority and boundary themes (partial).',
  aspOther: '{planet} aspects the D4 lagna at reduced strength versus occupation.',
  occupiedLabel: 'Lagna occupied by {names}',
  emptyLabel: 'Empty lagna — follow {lord} (lord) in house {house}',
  emptyDetail: '{lord} in {rashi} (H{house}) is the emotional address. {reading}',
  houseFallbackD4: 'D4 house {house}',
  houseFallback: 'House {house}',
  themeEnd: '{theme}.',
  houseEmpty: 'No planet here — read the lord of {rashi} for quieter results.',
  occupiedBy: 'Occupied by {names}.',
  h4MoSag: 'Moon in Sagittarius here: internal happiness through devotion, bhajans, or uplifting song.',
  h4Mo: 'Moon here: emotional nourishment is the private happiness key.',
  h4JuRa: 'Jupiter–Rahu: public image of virtue may differ from private house reality — read carefully.',
  h6VeRa: 'Venus–Rahu: heightened risk of partner friction, separation themes, or betrayal anxiety.',
  h6: 'Watch this house for sources of marital or domestic conflict.',
  h8: 'Family secrets, inheritance surprises, or residence upheaval can surface in related dashas.',
  h8Me: 'Mercury here: unexpected property or document developments possible in difficult periods.',
  h8MaKe: 'Mars–Ketu: sharp verbal conflict risk; physical violence is not automatic — context matters.',
  h9: 'Father’s habits and vices can mirror through this house.',
  h9SaRa: 'Saturn–Rahu: caution around father’s intoxicant or boundary issues.',
  h11SuAq: 'Sun in Aquarius: house may have two practical entrances (front and back access).',
  h11: 'Desire fulfillment linked to home and social gains.',
  h3: 'Strong placement here supports poetic or forceful verbal expression at home.',
  fNodesTitle: 'Nodes on the D4 heart',
  fNodesText: 'Rahu or Ketu on any divisional lagna disturbs that chart’s heart. Expect struggle themes around personal space, contentment, or shared living until wisdom softens the node.',
  fMoonTitle: 'Moon under difficult pressure',
  fMoonText: 'Mars or Saturn conjunct/aspecting the D4 Moon can amplify domestic irritability, raised voices, or emotional volatility at home.',
  fDomesticTitle: 'Domestic conflict caution',
  fDomesticText: 'Difficult planets on the Moon with difficult planets also in the D4 4th can point to serious conflict at home. Read with D1 and lived context — this is a caution flag, not a verdict.',
  fMoMaTitle: 'Moon–Mars heat on lagna',
  fMoMaText: 'Moon–Mars together on the D4 lagna often shows day-long crankiness in the shared space.',
  fVeMaSaTitle: 'Passion + duty stress on the axis',
  fVeMaSaText: 'Venus–Mars on lagna with Saturn in the 7th can mark intense partner dynamics and mutual boundary conflict. Your safety comes first, and counselling can help. This is not a fixed outcome.',
  fMaSaTitle: 'Mars–Saturn 1/7 tension',
  fMaSaText: 'Mars–Saturn across the lagna–7th axis correlates with hardness, control fights, and domestic intensity. Soften with clear agreements and space.',
  aMaVeTitle: 'Mars lagna ↔ Venus lagna',
  aMaVeText: 'When one partner’s D4 lagna holds Mars and the other’s Venus, chemistry and passion in shared space run high — natural Mars–Venus pull.',
  aJuSaTitle: 'Jupiter lagna ↔ Saturn lagna',
  aJuSaText: 'Jupiter–Saturn lagna pairing often shows large, well-staffed, branded homes — yet Saturn’s insecurity can remain under the comfort.',
  aMoSuTitle: 'Moon in Leo (with Sun)',
  aMoSuText: 'Moon with Sun / Leo themes on D4 lagna supports a spacious, comfort-rich house when otherwise free of difficult influences.',
  aNativeMaTitle: 'Your D4 Mars lagna',
  aNativeMaText: 'You thrive with partners who respect renovation drive and personal command of space — Venus-leaning partners often match the heat.',
  aNativeVeTitle: 'Your D4 Venus lagna',
  aNativeVeText: 'Aesthetic harmony and market-adjacent living matter; Mars lagna partners can feel exciting if respect stays mutual.',
  aNativeJuTitle: 'Your D4 Jupiter lagna',
  aNativeJuText: 'Counsel, faith, and ground-floor calm matter; Saturn lagna partners may co-build status homes with residual worry.',
  r8Holds: 'D4 8th holds {names} — residence change pressure when their dashas run',
  r8None: 'No planet in D4 8th — use 8th lord dashas and 6/8 links for move timing',
  rNoPath: 'Vimshottari path unavailable on this chart — compute dashas to time relocation.',
  rNote: '{lord} in D4 H{house} ({rashi})',
  rNoteMissing: '{lord} — D4 placement missing',
  rNote8: ' — 8th house period: residence change is more likely.',
  rNoteLord8: ' — dasha of the D4 8th lord: watch relocation.',
  rLevelFallback: 'L{level}',
  rPath: 'Current path {path}',
  rWindow: 'Relocation window active',
  rWindowText: 'A running dasha lord sits in the D4 8th, is the 8th lord, or rules a planet there — place change is more likely.',
  rStrong: 'Strong relocation window',
  rLink: '6/8 dasha link — move possible',
  rLinkText: 'Mahadasha lord and Antardasha lord stand in a 6/8 relationship in D4 — a strong indicator for residence change.',
  r8Time: 'D4 8th occupants ({names}) time moves when their periods run.',
  rNone: 'No strong 8th / 6–8 relocation flag in the current path — still watch gochar and D1 4th/8th.',
  prHeart: '{planet} on the D4 heart',
  prIn: '{planet} in {rashi} (D4 H{house}, {dignity}).',
  prRetro: 'Retrograde: desire and demands intensify — obsessive persistence until the need is met.',
  tMoon: 'Moon — emotional field',
  tFourth: '4th lord — happiness vector',
  tJupiter: 'Jupiter — santosh (contentment)',
  tMissing: '{planet} missing from D4 graha set.',
  tIn: '{planet} in {rashi} H{house} ({dignity}).',
  tJuBad: ' Troubled Jupiter in D4: even with money, people, or children, contentment can spoil — restore santosh through wisdom and counsel.',
  tJuGood: ' Jupiter supports satisfaction with what the house already holds.',
  tMoBad: ' Challenged Moon: emotional resilience at home needs care.',
  tMoGood: ' Moon supports a livable emotional climate.',
  tFourthText: ' The 4th lord’s house shows where true contentment (or conflict) is sought — H{house} themes dominate.',
  tFourth10: ' Happiness through public service / karma is highlighted.',
  tRetro: ' Retrograde intensifies the craving tied to this role.',
  sumJuBad: 'Watch Jupiter for contentment gaps even when outer life looks full.',
  sumJuGood: 'Moon, 4th lord, and Jupiter frame whether the house feels enough.',
  sumTail: '{signal}. {content} D4 asks: what makes this person happy, and can you share a room with them?',
  occColors: '{planet} colors the D4 heart.',
  occRetro: 'Retrograde intensifies insistence and obsessive wanting.',
  lordSits: '{lord} sits in {rashi} (H{house}, {dignity}).',
  lordMissing: '{lord} placement unavailable.',
  lord10: 'Happiness sought through public service / karma.',
  retroNote: 'Retrograde {planet} in house {house}: obsessive, persistent demands around that house’s themes — intensity that is hard to ignore.',
  iEmptyTitle: 'Empty D4 lagna',
  iEmptyText: 'No planet occupies the heart — the lagna lord’s house and conjunctions tell the emotional story at full strength. Aspects on lagna work at roughly 30–40%.',
  iAspTitle: 'Aspects on empty lagna',
  iAspItem: '{planet} from H{house}: {note}',
  iJuBadTitle: 'Contentment (Jupiter) stressed',
  iJuGoodTitle: 'Jupiter supports santosh',
  iRetroTitle: 'Retrograde intensity',
}

interface D4Ctx {
  T: Record<keyof typeof D4_TEXT_HI, string>
  HT: Record<number, string>
  g: (id: GrahaId) => string
  r: (x: Rashi) => string
  dig: (d: Dignity) => string
  names: (list: GrahaData[]) => string
  general: (id: GrahaId) => string | undefined
  lang: EngineLang
}

function d4Ctx(lang: EngineLang): D4Ctx {
  const g = (id: GrahaId) => gName(id, lang)
  return {
    T: pick(D4_TEXT_EN, D4_TEXT_HI as Record<keyof typeof D4_TEXT_HI, string>, lang),
    HT: pick(HOUSE_THEMES, D4_HOUSE_THEMES_HI, lang),
    g,
    r: (x: Rashi) => rName(x, lang),
    dig: (d: Dignity) => dignityText(d, lang),
    names: (list: GrahaData[]) => list.map((x) => g(x.id)).join(', '),
    general: (id: GrahaId) => (lang === 'hi' ? D4_LAGNA_PLANET_HI[id] : LAGNA_PLANET_READINGS[id]?.general),
    lang,
  }
}

function wholeSignHouseSign(ascRashi: Rashi, house: number): Rashi {
  return (((ascRashi - 1 + house - 1) % 12) + 1) as Rashi
}

function houseOf(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

/** Sign-count from A to B: 1 = same … 12 = 12th from A. */
export function signCount(fromRashi: number, toRashi: number): number {
  return ((toRashi - fromRashi + 12) % 12) + 1
}

function formatDashaDate(value: Date | string | number): string {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toISOString().slice(0, 10)
}

function toneFromDignity(d: Dignity, house: number): D4Tone {
  if (STRONG_DIGNITY.includes(d) && ![6, 8, 12].includes(house)) return 'supportive'
  if (WEAK_DIGNITY.includes(d) || [6, 8, 12].includes(house)) return 'challenging'
  if ([1, 4, 5, 7, 9, 10].includes(house)) return 'mixed'
  return 'neutral'
}

function planetById(grahas: GrahaData[], id: GrahaId): GrahaData | undefined {
  return grahas.find((g) => g.id === id)
}

function conjunctIds(grahas: GrahaData[], target: GrahaData): GrahaId[] {
  return grahas.filter((g) => g.id !== target.id && g.rashi === target.rashi).map((g) => g.id)
}

function buildSignExtras(id: GrahaId, lagna: Rashi, occupants: GrahaId[], L: D4Ctx): string[] {
  const { T } = L
  const extras: string[] = []
  if (id === 'Ke' && lagna === 8) extras.push(T.exKeScorpio)
  if (id === 'Ra') {
    const ra = (L.lang === 'hi' ? D4_RAHU_SIGN_EXTRAS_HI : RAHU_SIGN_EXTRAS)[lagna]
    if (ra) extras.push(ra)
  }
  if (id === 'Ju' && lagna === 12) extras.push(T.exJuPisces)
  if (id === 'Ve' && (lagna === 11 || occupants.includes('Ra'))) extras.push(T.exVeRahu)
  if (id === 'Su' && lagna === 5) extras.push(T.exSuLeo)
  if (id === 'Su' && lagna === 10) extras.push(T.exSuCap)
  if (id === 'Me' && lagna === 11) extras.push(T.exMeAq)
  return extras
}

function lordConjunctionReading(lordId: GrahaId, conjuncts: GrahaId[], L: D4Ctx): string {
  const { T } = L
  const parts: string[] = []
  if (conjuncts.includes('Sa')) parts.push(T.lcSa)
  if (conjuncts.includes('Mo') && conjuncts.includes('Sa')) parts.push(T.lcMoSa)
  if (conjuncts.includes('Ke')) parts.push(T.lcKe)
  if (conjuncts.includes('Ra')) parts.push(T.lcRa)
  if (conjuncts.includes('Me') && conjuncts.includes('Sa')) parts.push(T.lcMeSa)
  if (!parts.length) {
    const names = conjuncts.map((id) => L.g(id)).join(', ')
    if (names) parts.push(fill(T.lcNames, { names }))
    else parts.push(fill(T.lcAlone, { lord: L.g(lordId) }))
  }
  return parts.join(' ')
}

function aspectNote(id: GrahaId, L: D4Ctx): string {
  const { T } = L
  if (id === 'Me') return T.aspMe
  if (id === 'Ju') return T.aspJu
  if (id === 'Sa') return T.aspSa
  if (id === 'Ma') return T.aspMa
  if (id === 'Mo') return T.aspMo
  if (id === 'Ve') return T.aspVe
  if (id === 'Su') return T.aspSu
  return fill(T.aspOther, { planet: L.g(id) })
}

function buildPrimarySignal(heart: Omit<ChaturthamsaLagnaHeart, 'primarySignal'>, L: D4Ctx): ChaturthamsaLagnaHeart['primarySignal'] {
  const { T } = L
  if (heart.occupants.length) {
    const names = heart.occupants.map((o) => o.name).join(', ')
    return {
      strength: 'occupation',
      label: fill(T.occupiedLabel, { names }),
      detail: heart.occupants.map((o) => o.reading).join(' '),
    }
  }
  const lord = heart.lagnaLord
  return {
    strength: 'lord',
    label: fill(T.emptyLabel, { lord: lord.name, house: lord.house }),
    detail: fill(T.emptyDetail, { lord: lord.name, rashi: lord.rashiName, house: lord.house, reading: lord.reading }),
  }
}

function buildHouseReading(
  house: number,
  occupants: GrahaData[],
  rashi: Rashi,
  L: D4Ctx,
): { reading: string; tone: D4Tone } {
  const { T } = L
  const theme = L.HT[house] ?? fill(T.houseFallbackD4, { house })
  const names = L.names(occupants)
  const bits: string[] = [fill(T.themeEnd, { theme })]

  if (!occupants.length) {
    bits.push(fill(T.houseEmpty, { rashi: L.r(rashi) }))
    return { reading: bits.join(' '), tone: 'neutral' }
  }

  bits.push(fill(T.occupiedBy, { names }))

  if (house === 4) {
    if (occupants.some((g) => g.id === 'Mo' && g.rashi === 9)) {
      bits.push(T.h4MoSag)
    } else if (occupants.some((g) => g.id === 'Mo')) {
      bits.push(T.h4Mo)
    }
    if (occupants.some((g) => g.id === 'Ju') && occupants.some((g) => g.id === 'Ra')) {
      bits.push(T.h4JuRa)
    }
  }

  if (house === 6) {
    if (occupants.some((g) => g.id === 'Ve') && occupants.some((g) => g.id === 'Ra')) {
      bits.push(T.h6VeRa)
    } else {
      bits.push(T.h6)
    }
  }

  if (house === 8) {
    bits.push(T.h8)
    if (occupants.some((g) => g.id === 'Me')) bits.push(T.h8Me)
    if (occupants.some((g) => g.id === 'Ma') && occupants.some((g) => g.id === 'Ke')) bits.push(T.h8MaKe)
  }

  if (house === 9) {
    bits.push(T.h9)
    if (occupants.some((g) => g.id === 'Sa') && occupants.some((g) => g.id === 'Ra')) bits.push(T.h9SaRa)
  }

  if (house === 11) {
    if (occupants.some((g) => g.id === 'Su' && g.rashi === 11)) {
      bits.push(T.h11SuAq)
    } else {
      bits.push(T.h11)
    }
  }

  if (house === 3) {
    bits.push(T.h3)
  }

  const maleficHit = occupants.filter((g) => MALEFICS.includes(g.id)).length
  const tone: D4Tone =
    house === 6 || house === 8
      ? maleficHit >= 2 ? 'challenging' : 'mixed'
      : house === 4 && maleficHit === 0
        ? 'supportive'
        : maleficHit >= 2
          ? 'challenging'
          : 'mixed'

  return { reading: bits.join(' '), tone }
}

function buildConflictFlags(
  asc: Rashi,
  grahas: GrahaData[],
  heart: ChaturthamsaLagnaHeart,
  L: D4Ctx,
): ChaturthamsaConflictFlag[] {
  const { T } = L
  const flags: ChaturthamsaConflictFlag[] = []
  const lagnaOcc = grahas.filter((g) => houseOf(g.rashi, asc) === 1)
  const fourth = grahas.filter((g) => houseOf(g.rashi, asc) === 4)
  const seventh = grahas.filter((g) => houseOf(g.rashi, asc) === 7)

  if (heart.nodesOnLagna) {
    flags.push({ id: 'nodes-lagna', title: T.fNodesTitle, text: T.fNodesText, tone: 'challenging' })
  }

  const moon = planetById(grahas, 'Mo')
  if (moon) {
    const moonHouse = houseOf(moon.rashi, asc)
    const pressed = grahas.some(
      (g) =>
        (g.id === 'Ma' || g.id === 'Sa') &&
        (g.rashi === moon.rashi || hasParasharaAspect(g.rashi, g.id, moon.rashi)),
    )
    if (pressed) {
      flags.push({ id: 'moon-malefic', title: T.fMoonTitle, text: T.fMoonText, tone: 'challenging' })
    }
    if (pressed && fourth.some((g) => MALEFICS.includes(g.id))) {
      flags.push({ id: 'domestic-stress', title: T.fDomesticTitle, text: T.fDomesticText, tone: 'challenging' })
    }
    if (moonHouse === 1 && grahas.some((g) => g.id === 'Ma' && g.rashi === moon.rashi)) {
      flags.push({ id: 'moon-mars-lagna', title: T.fMoMaTitle, text: T.fMoMaText, tone: 'challenging' })
    }
  }

  const hasVeMa = lagnaOcc.some((g) => g.id === 'Ve') && lagnaOcc.some((g) => g.id === 'Ma')
  const saOn7 = seventh.some((g) => g.id === 'Sa')
  if (hasVeMa && saOn7) {
    flags.push({ id: 've-ma-sa-axis', title: T.fVeMaSaTitle, text: T.fVeMaSaText, tone: 'challenging' })
  }

  const maSaAxis =
    (lagnaOcc.some((g) => g.id === 'Ma') && seventh.some((g) => g.id === 'Sa')) ||
    (lagnaOcc.some((g) => g.id === 'Sa') && seventh.some((g) => g.id === 'Ma'))
  if (maSaAxis) {
    flags.push({ id: 'mars-saturn-axis', title: T.fMaSaTitle, text: T.fMaSaText, tone: 'challenging' })
  }

  return flags
}

function buildAffinityGuide(occupants: GrahaId[], L: D4Ctx): ChaturthamsaAffinityNote[] {
  const { T } = L
  const notes: ChaturthamsaAffinityNote[] = [
    { pair: 'Ma–Ve', title: T.aMaVeTitle, text: T.aMaVeText, tone: 'supportive' },
    { pair: 'Ju–Sa', title: T.aJuSaTitle, text: T.aJuSaText, tone: 'mixed' },
    { pair: 'Mo–Su', title: T.aMoSuTitle, text: T.aMoSuText, tone: 'supportive' },
  ]

  if (occupants.includes('Ma')) {
    notes.push({ pair: 'native-Ma', title: T.aNativeMaTitle, text: T.aNativeMaText, tone: 'mixed' })
  }
  if (occupants.includes('Ve')) {
    notes.push({ pair: 'native-Ve', title: T.aNativeVeTitle, text: T.aNativeVeText, tone: 'mixed' })
  }
  if (occupants.includes('Ju')) {
    notes.push({ pair: 'native-Ju', title: T.aNativeJuTitle, text: T.aNativeJuText, tone: 'mixed' })
  }

  return notes
}

function buildRelocation(
  chart: ChartOutput,
  grahas: GrahaData[],
  asc: Rashi,
  L: D4Ctx,
): ChaturthamsaRelocation | null {
  const { T } = L
  const eighth = grahas.filter((g) => houseOf(g.rashi, asc) === 8)
  const eighthLordId = SIGN_LORDS[wholeSignHouseSign(asc, 8)]
  const byId = new Map(grahas.map((g) => [g.id, g]))
  const levels: readonly string[] = L.lang === 'hi' ? D4_DASHA_LEVEL_HI : DASHA_LEVEL_LABELS

  const nodes = chart.dashas?.vimshottari
  if (!nodes?.length) {
    return {
      eighthOccupants: eighth.map((g) => ({ id: g.id, name: L.g(g.id) })),
      eighthLordPeriodActive: false,
      sixthEighthDashaLink: false,
      dashaLords: [],
      pathLabel: '',
      headline: eighth.length
        ? fill(T.r8Holds, { names: L.names(eighth) })
        : T.r8None,
      detail: T.rNoPath,
      tone: eighth.length ? 'mixed' : 'neutral',
      highlightHouses: eighth.length ? [8] : [],
    }
  }

  const path = getDashaPathAt(nodes)
  if (!path.length) return null

  const dashaLords: ChaturthamsaDashaLordOverlay[] = path.slice(0, 4).map((seg) => {
    const lord = seg.lord as GrahaId
    const g = byId.get(lord)
    const house = g ? houseOf(g.rashi, asc) : null
    const tone: D4Tone =
      house === 8 || house === 6 ? 'challenging'
        : house === 4 || house === 1 ? 'mixed'
          : 'neutral'
    let note = g
      ? fill(T.rNote, { lord: L.g(lord), house: house ?? '', rashi: L.r(g.rashi) })
      : fill(T.rNoteMissing, { lord: L.g(lord) })
    if (house === 8) note += T.rNote8
    if (lord === eighthLordId) note += T.rNoteLord8
    return {
      level: seg.level,
      levelLabel: levels[seg.level] ?? fill(T.rLevelFallback, { level: seg.level }),
      lord,
      lordName: L.g(lord) ?? String(lord),
      start: formatDashaDate(seg.start),
      end: formatDashaDate(seg.end),
      d4House: house,
      d4RashiName: g ? L.r(g.rashi) : null,
      tone,
      note,
    }
  })

  const maha = dashaLords[0]
  const antar = dashaLords[1]
  let sixthEighthDashaLink = false
  if (maha && antar) {
    const a = byId.get(maha.lord)
    const b = byId.get(antar.lord)
    if (a && b) {
      const fwd = signCount(a.rashi, b.rashi)
      const rev = signCount(b.rashi, a.rashi)
      sixthEighthDashaLink = fwd === 6 || fwd === 8 || rev === 6 || rev === 8
    }
  }

  const eighthLordPeriodActive = dashaLords.some(
    (l) => l.lord === eighthLordId || l.d4House === 8 || eighth.some((g) => g.id === l.lord),
  )

  const pathLabel = dashaLords.map((l) => l.lordName).join(' / ')
  const highlights = Array.from(
    new Set(
      dashaLords.map((l) => l.d4House).filter((h): h is number => h != null && (h === 6 || h === 8)),
    ),
  )

  let tone: D4Tone = 'neutral'
  let headline = fill(T.rPath, { path: pathLabel })
  const details: string[] = []

  if (eighthLordPeriodActive) {
    tone = 'challenging'
    headline = T.rWindow
    details.push(T.rWindowText)
  }
  if (sixthEighthDashaLink) {
    tone = 'challenging'
    headline = eighthLordPeriodActive ? T.rStrong : T.rLink
    details.push(T.rLinkText)
  }
  if (!details.length) {
    details.push(
      eighth.length
        ? fill(T.r8Time, { names: L.names(eighth) })
        : T.rNone,
    )
  }

  return {
    eighthOccupants: eighth.map((g) => ({ id: g.id, name: L.g(g.id) })),
    eighthLordPeriodActive,
    sixthEighthDashaLink,
    dashaLords,
    pathLabel,
    headline,
    detail: details.join(' '),
    tone,
    highlightHouses: highlights.length ? highlights : eighth.length ? [8] : [],
  }
}

function buildPlanetRow(g: GrahaData, asc: Rashi, L: D4Ctx): ChaturthamsaPlanetRow {
  const { T } = L
  const house = houseOf(g.rashi, asc)
  const general = L.general(g.id)
  const stop = L.lang === 'hi' ? '।' : '.'
  const theme = house === 1
    ? (general?.split(stop)[0] ?? fill(T.prHeart, { planet: L.g(g.id) }))
    : (L.HT[house] ?? fill(T.houseFallbackD4, { house }))
  const parts = [
    fill(T.prIn, { planet: L.g(g.id), rashi: L.r(g.rashi), house, dignity: L.dig(g.dignity) }),
    house === 1 && general ? general : null,
    g.isRetro ? T.prRetro : null,
  ].filter(Boolean)
  return {
    id: g.id,
    name: L.g(g.id),
    rashi: g.rashi,
    rashiName: L.r(g.rashi),
    house,
    dignity: g.dignity,
    isRetro: Boolean(g.isRetro),
    theme,
    interpretation: parts.join(' '),
  }
}

function buildKeyTriad(grahas: GrahaData[], asc: Rashi, L: D4Ctx): ChaturthamsaKeyTriadMember[] {
  const { T } = L
  const fourthLordId = SIGN_LORDS[wholeSignHouseSign(asc, 4)]
  const specs: { role: ChaturthamsaKeyTriadMember['role']; roleLabel: string; id: GrahaId }[] = [
    { role: 'moon', roleLabel: T.tMoon, id: 'Mo' },
    { role: 'fourthLord', roleLabel: T.tFourth, id: fourthLordId },
    { role: 'jupiter', roleLabel: T.tJupiter, id: 'Ju' },
  ]

  return specs.map(({ role, roleLabel, id }) => {
    const g = planetById(grahas, id)
    if (!g) {
      return {
        role,
        roleLabel,
        id,
        name: L.g(id),
        house: 1,
        rashi: asc,
        rashiName: L.r(asc),
        dignity: 'neutral' as Dignity,
        isRetro: false,
        tone: 'neutral' as D4Tone,
        reading: fill(T.tMissing, { planet: L.g(id) }),
      }
    }
    const house = houseOf(g.rashi, asc)
    const tone = toneFromDignity(g.dignity, house)
    const afflicted =
      WEAK_DIGNITY.includes(g.dignity) ||
      [6, 8, 12].includes(house) ||
      conjunctIds(grahas, g).some((c) => MALEFICS.includes(c))

    let reading = fill(T.tIn, { planet: L.g(id), rashi: L.r(g.rashi), house, dignity: L.dig(g.dignity) })
    if (role === 'jupiter') {
      reading += afflicted ? T.tJuBad : T.tJuGood
    } else if (role === 'moon') {
      reading += afflicted ? T.tMoBad : T.tMoGood
    } else {
      reading += fill(T.tFourthText, { house })
      if (house === 10) {
        reading += T.tFourth10
      }
    }
    if (g.isRetro) reading += T.tRetro

    return {
      role,
      roleLabel,
      id,
      name: L.g(id),
      house,
      rashi: g.rashi,
      rashiName: L.r(g.rashi),
      dignity: g.dignity,
      isRetro: Boolean(g.isRetro),
      tone,
      reading,
    }
  })
}

function buildSummary(heart: ChaturthamsaLagnaHeart, triad: ChaturthamsaKeyTriadMember[], L: D4Ctx): string {
  const { T } = L
  const ju = triad.find((t) => t.role === 'jupiter')
  const signal = heart.primarySignal.label
  const content = ju && ju.tone === 'challenging' ? T.sumJuBad : T.sumJuGood
  return fill(T.sumTail, { signal, content })
}

/**
 * Analyze Chaturthamsha (D4) from chart vargas.
 * Returns null if D4 data is missing. `lang` switches display text only.
 */
export function analyzeChaturthamsa(chart: ChartOutput, lang: EngineLang = 'en'): ChaturthamsaAnalysis | null {
  const asc = chart.vargaLagnas?.D4 as Rashi | undefined
  const grahas = chart.vargas?.D4
  if (!asc || !grahas?.length) return null

  const L = d4Ctx(lang)
  const { T } = L
  const lagnaOccGrahas = grahas.filter((g) => houseOf(g.rashi, asc) === 1)
  const lagnaEmpty = lagnaOccGrahas.length === 0
  const lagnaLordId = SIGN_LORDS[asc]
  const lordG = planetById(grahas, lagnaLordId)
  const lordHouse = lordG ? houseOf(lordG.rashi, asc) : 1
  const lordConjuncts = lordG ? conjunctIds(grahas, lordG) : []

  const occupants: ChaturthamsaLagnaOccupant[] = lagnaOccGrahas.map((g) => {
    const extras = buildSignExtras(
      g.id,
      asc,
      lagnaOccGrahas.map((x) => x.id),
      L,
    )
    const reading = [
      L.general(g.id) ?? fill(T.occColors, { planet: L.g(g.id) }),
      g.isRetro ? T.occRetro : null,
      ...extras,
    ]
      .filter(Boolean)
      .join(' ')
    return {
      id: g.id,
      name: L.g(g.id),
      isRetro: Boolean(g.isRetro),
      reading,
      signExtras: extras,
    }
  })

  const aspectsOnLagna: ChaturthamsaAspectOnLagna[] = grahas
    .filter((g) => houseOf(g.rashi, asc) !== 1 && hasParasharaAspect(g.rashi, g.id, asc))
    .map((g) => ({
      id: g.id,
      name: L.g(g.id),
      fromHouse: houseOf(g.rashi, asc),
      fromRashiName: L.r(g.rashi),
      note: aspectNote(g.id, L),
      relativeStrength: 'partial' as const,
    }))

  const nodesOnLagna = lagnaOccGrahas.some((g) => g.id === 'Ra' || g.id === 'Ke')

  const heartBase: Omit<ChaturthamsaLagnaHeart, 'primarySignal'> = {
    lagna: asc,
    lagnaName: L.r(asc),
    lagnaSanskrit: lang === 'hi' ? L.r(asc) : RASHI_SANSKRIT[asc],
    lagnaEmpty,
    occupants,
    lagnaLord: {
      id: lagnaLordId,
      name: L.g(lagnaLordId),
      house: lordHouse,
      rashi: lordG?.rashi ?? asc,
      rashiName: L.r(lordG?.rashi ?? asc),
      dignity: lordG?.dignity ?? 'neutral',
      isRetro: Boolean(lordG?.isRetro),
      conjunctIds: lordConjuncts,
      conjunctNames: lordConjuncts.map((id) => L.g(id)),
      reading: [
        lordG
          ? fill(T.lordSits, { lord: L.g(lagnaLordId), rashi: L.r(lordG.rashi), house: lordHouse, dignity: L.dig(lordG.dignity) })
          : fill(T.lordMissing, { lord: L.g(lagnaLordId) }),
        lordConjunctionReading(lagnaLordId, lordConjuncts, L),
        lordHouse === 10 ? T.lord10 : null,
      ]
        .filter(Boolean)
        .join(' '),
    },
    aspectsOnLagna,
    signFlavor: (lang === 'hi' ? D4_LAGNA_SIGN_FLAVOR_HI : LAGNA_SIGN_FLAVOR)[asc],
    nodesOnLagna,
    heartDisturbed: nodesOnLagna,
  }

  const heart: ChaturthamsaLagnaHeart = {
    ...heartBase,
    primarySignal: buildPrimarySignal(heartBase, L),
  }

  const planets = CLASSICAL_ORDER
    .map((id) => planetById(grahas, id))
    .filter((g): g is GrahaData => Boolean(g))
    .map((g) => buildPlanetRow(g, asc, L))

  const houses: ChaturthamsaHouseRow[] = []
  for (let h = 1; h <= 12; h++) {
    const rashi = wholeSignHouseSign(asc, h)
    const occ = grahas.filter((g) => houseOf(g.rashi, asc) === h)
    const { reading, tone } = buildHouseReading(h, occ, rashi, L)
    const lordId = SIGN_LORDS[rashi]
    houses.push({
      house: h,
      rashi,
      rashiName: L.r(rashi),
      lordId,
      lordName: L.g(lordId),
      occupants: occ.map((g) => ({ id: g.id, name: L.g(g.id), isRetro: Boolean(g.isRetro) })),
      theme: L.HT[h] ?? fill(T.houseFallback, { house: h }),
      reading,
      tone,
    })
  }

  const focusedHouses = houses.filter((h) => (FOCUS_HOUSES as readonly number[]).includes(h.house))
  const keyTriad = buildKeyTriad(grahas, asc, L)
  const relocation = buildRelocation(chart, grahas, asc, L)
  const conflictFlags = buildConflictFlags(asc, grahas, heart, L)
  const affinityGuide = buildAffinityGuide(occupants.map((o) => o.id), L)

  const retrogradeNotes = grahas
    .filter((g) => g.isRetro)
    .map((g) => fill(T.retroNote, { planet: L.g(g.id), house: houseOf(g.rashi, asc) }))

  const insights: ChaturthamsaInsight[] = []
  insights.push({
    kind: 'highlight',
    title: heart.primarySignal.label,
    text: heart.primarySignal.detail,
  })
  if (heart.lagnaEmpty) {
    insights.push({ kind: 'info', title: T.iEmptyTitle, text: T.iEmptyText })
  }
  if (heart.aspectsOnLagna.length && heart.lagnaEmpty) {
    insights.push({
      kind: 'info',
      title: T.iAspTitle,
      text: heart.aspectsOnLagna.map((a) => fill(T.iAspItem, { planet: a.name, house: a.fromHouse, note: a.note })).join(' '),
    })
  }
  for (const flag of conflictFlags) {
    insights.push({ kind: 'caution', title: flag.title, text: flag.text })
  }
  const ju = keyTriad.find((t) => t.role === 'jupiter')
  if (ju && ju.tone === 'challenging') {
    insights.push({ kind: 'caution', title: T.iJuBadTitle, text: ju.reading })
  } else if (ju && ju.tone === 'supportive') {
    insights.push({ kind: 'strength', title: T.iJuGoodTitle, text: ju.reading })
  }
  if (relocation && (relocation.eighthLordPeriodActive || relocation.sixthEighthDashaLink)) {
    insights.push({ kind: 'caution', title: relocation.headline, text: relocation.detail })
  }
  for (const note of retrogradeNotes.slice(0, 3)) {
    insights.push({ kind: 'info', title: T.iRetroTitle, text: note })
  }

  return {
    d4Lagna: asc,
    d4LagnaName: L.r(asc),
    d4LagnaSanskrit: lang === 'hi' ? L.r(asc) : RASHI_SANSKRIT[asc],
    summary: buildSummary(heart, keyTriad, L),
    purpose: pick(D4_PURPOSE, D4_PURPOSE_HI, lang),
    heart,
    keyTriad,
    planets,
    houses,
    focusedHouses,
    relocation,
    affinityGuide,
    conflictFlags,
    insights,
    retrogradeNotes,
  }
}
