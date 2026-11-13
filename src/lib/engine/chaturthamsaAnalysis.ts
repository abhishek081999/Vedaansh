// ─────────────────────────────────────────────────────────────
//  src/lib/engine/chaturthamsaAnalysis.ts
//  Chaturthamsha (D4) — heart, home, happiness, property, relocation
//  Class: lagna hierarchy, key triad, locality/property tone, décor
//  patterns, devotion-on-lagna, 6/8/12 + 4/9 dasha moves, affinity
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
  /** Current path lord(s) in D4 6 / 8 / 12 — class move / abroad window. */
  dusthanaDashaActive: boolean
  /** MD–AD involve D4 4th and 9th lords (or sit in 4 and 9). */
  fourthNinthLink: boolean
  /** Moon–Saturn MD/AD: build or renovate rather than only move. */
  moonSaturnBuild: boolean
  /** Twelfth-house / 12th-lord period: abroad or far from birthplace. */
  twelfthAbroad: boolean
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

export interface ChaturthamsaPattern {
  id: string
  title: string
  text: string
  tone: D4Tone
}

export interface ChaturthamsaPropertyNote {
  id: string
  planetIds: GrahaId[]
  title: string
  locality: string
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
  propertyNotes: ChaturthamsaPropertyNote[]
  patterns: ChaturthamsaPattern[]
  devotionHints: string[]
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
  'Chaturthamsha is the heart chart: what truly lives inside (regrets, unspoken love, who you confide in under stress), how personal space and property feel, mother / home climate, and whether you can share a room in peace. Krishna is classically linked with reading the heart; D3 covers mind-fights while living together.'

const LAGNA_SIGN_FLAVOR: Record<Rashi, string> = {
  1: 'Mars-ruled lagna — decisive personal space; prefers built or claimed territory; military / command layouts appeal.',
  2: 'Venus-ruled lagna — comfort, beauty, and value in the home; market-adjacent living.',
  3: 'Mercury-ruled lagna — curious, communicative domestic style; parks, green belts, and lively variety nearby.',
  4: 'Moon-ruled lagna — emotionally sensitive home; needs nurturing atmosphere and water / food markets nearby.',
  5: 'Sun-ruled lagna — dignity, boundaries, and assembly space; Ram / Surya devotion tone; keep respectful distance in shared quarters.',
  6: 'Mercury-ruled lagna — hygiene, routine, and discernment; cleaning and order can become obsessive.',
  7: 'Venus-ruled lagna — partnership and aesthetics shape what feels like home.',
  8: 'Mars-ruled lagna — intense, private, transformative personal space.',
  9: 'Jupiter-ruled lagna — faith, counsel, temples, trees, and expansive shelter; sattvic neighbors matter.',
  10: 'Saturn-ruled lagna — structured, enduring residence; prefers modest or industrial fringe over glossy society feel.',
  11: 'Saturn-ruled lagna — high-tech, automated, future-facing home; machines and “press-button” comfort.',
  12: 'Jupiter-ruled lagna — rest, retreat, giving heart; soft boundaries and temple / nature proximity.',
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
      'Ketu on the D4 lagna makes personal space binary — either fully open-hearted or closed. Diplomacy is hard; bonding is total once trust exists. Contentment grows when Jupiter’s counsel or spiritual knowledge softens attachment and aversion. Ketu in the D4 4th (or lagna) can mark a sanyasi-like rootlessness — settling in one house stays hard.',
    traits: [
      'Fights over small things, yet bonds are hard to break',
      'Breakups feel intense; memories linger',
      'Struggles to share room/personal space; can feel trapped living with others',
      'Chooses house and vehicles by vibe more than specs',
      'Outskirts, barren plots, crooked lanes, or dead-end homes when Ketu is very strong',
    ],
  },
  Ra: {
    general:
      'Rahu on the D4 lagna drives endless wanting — competitive accumulation, big-ticket electronics and oversized household items, and hasty property decisions. Comfort with outsiders can exceed ease with family. Classically linked with Varaha: antiques, layered patterned paintings, and illusion-rich décor attract.',
    traits: [
      'Never fully satisfied with what is already in the house',
      'Inclined toward “ultra” gadgets and larger-than-needed appliances',
      'Jacuzzi / bar / smoking-zone style amenities when Rahu is prominent',
      'Attracted to mysterious or unconventional helpers',
      'May trust outside society more than familiar circles',
    ],
  },
  Sa: {
    general:
      'Saturn on the D4 lagna favors old, lasting, antique, or stone-style homes and hoards unique durable items from insecurity. Glossy “society” feel rarely settles the heart — modest or industrial fringe nearby often feels more real.',
    traits: [
      'House fills with aged or long-lasting objects',
      'Avoids waste; keeps what feels secure',
      'Industrial belt, construction sites, workers, and household staff when Saturn is strong',
      'Roommate/partner dynamics can turn duty-heavy if Saturn also ties the lagna lord',
    ],
  },
  Me: {
    general:
      'Mercury on the D4 lagna links happiness and sorrow to the maternal side, favors apartments and prominent balconies/living areas, and connects the person to many people (media, marketing, HR). Strong Mercury can mark flat-building / selling or finance people in the home.',
    traits: [
      'Maternal family themes color property and documents',
      'Wants visible balcony / living space and a view from above',
      'Picky about how food looks and is served',
      'Strong mass/public connection through the 4th significations',
    ],
  },
  Ju: {
    general:
      'Jupiter on the D4 lagna seeks solutions through temples, counselors, or wisdom. Prefers large homes near temples, wide roads, trees, and sattvic neighbors — without that atmosphere the person may refuse the property. Ground-floor living and a deity-forward entrance are classic.',
    traits: [
      'Turns to faith or counsel when home life is stressed',
      'Ground floor / easy access preferred over stairs',
      'Wants the house to open onto a sacred or counsel-oriented presence',
      'Gemini Jupiter lagna adds parks, breeze, and lively green belts',
    ],
  },
  Ma: {
    general:
      'Mars on the D4 lagna wants self-built territory — hills, plots, villas — and runs the house like a commander. Heart-deity skew toward Hanuman / Ram bhakti. Official / military-quarter layouts and fully equipped command spaces appeal. Layout changes, renovations, DIY repairs, and watercraft themes are classic.',
    traits: [
      '“Not my house until I build or reshape it”',
      'Frequent rearranging of beds, windows, and doors',
      'Keeps tools ready; opens machines to fix them',
      'Enjoys boats, cruises, or water-linked recreation',
      'With Saturn, builder / estate-lord tone: factories and large tracts',
    ],
  },
  Ve: {
    general:
      'Venus on the D4 lagna needs beauty, lawns, and city-center / bazaar living — jewelry shops, cafés, upscale restaurants, and offices nearby. Comfort and aesthetic polish define “home.” With Rahu: royal high-rise / Park Avenue tone; with Aquarius lagna: nightlife-friendly décor.',
    traits: [
      'House must feel beautiful and welcoming',
      'Prefers access to shopping and lifestyle hubs',
      'With Rahu or Aquarius flavor, entertainment/bar zones may stand out',
    ],
  },
  Su: {
    general:
      'Sun on the D4 lagna creates access and boundary themes — official-quarter feel, trees, controlled entry. Devotion skew toward Ram / Surya Narayan. Shared living needs respectful distance — too close to the Sun burns. The house often hosts gatherings, halls, or program space.',
    traits: [
      'Guests may be met downstairs rather than invited into the inner home',
      'Security or blocked boundaries depending on sign',
      'Community hall / assembly energy in or under the house',
    ],
  },
  Mo: {
    general:
      'Moon on the D4 lagna heightens emotional sensitivity at home and skews devotion toward Krishna or Shiva / Sati. Moon has no classical enemy — the heart tends more liberal when unafflicted. Food markets, grocers, and water bodies nearby feel like home.',
    traits: [
      'Very specific about comfort and emotional tone',
      'Needs a pleasant, nurturing domestic field',
      'Irritability rises if Mars or Saturn press the Moon',
      'With Mars, rejects dead-quiet neighborhoods — wants bustle and activity',
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
  h4JuMo: 'Jupiter–Moon in the 4th: mother is talkative, often with a thin/sharp voice; home fills with conversation.',
  h4SaMa: 'Saturn–Mars in the 4th: heavy property holdings; civil engineer / builder / dealer tone; antiques (brass, watercolours) when in Sagittarius.',
  h4Ke: 'Ketu in the 4th: sanyasi pattern — wandering heart, hard to settle in one house.',
  h6VeRa: 'Venus–Rahu: heightened risk of partner friction, separation themes, or betrayal anxiety.',
  h6: 'Watch this house for sources of marital or domestic conflict.',
  h8: 'Family secrets, inheritance surprises, or residence upheaval can surface in related dashas. D4 8th dashas often open spirituality after heartbreak.',
  h8Me: 'Mercury here: unexpected property or document developments possible in difficult periods.',
  h8MaKe: 'Mars–Ketu: sharp verbal conflict risk; physical violence is not automatic — context matters.',
  h8VeRa: 'Venus–Rahu in the 8th: love can feel all-consuming; breakups cut deep — read as intensity, not fate.',
  h9: 'Father’s habits and vices can mirror through this house.',
  h9SaRa: 'Saturn–Rahu: luxury/antique addiction; a museum-like room of glass, cutlery, or antiques may appear; caution around father’s intoxicant or boundary issues.',
  h9SaSc: 'Saturn in Scorpio in the 9th: father strict on studies; Devi bhakti tone is common.',
  h11SuAq: 'Sun in Aquarius: house may have two practical entrances (front and back access).',
  h11Mo: 'Moon in the 11th: overhead water / fountain or cascade feature often appears at home.',
  h11: 'Desire fulfillment linked to home and social gains.',
  h3: 'Strong placement here supports poetic or forceful verbal expression at home.',
  h3Su: 'Sun in the 3rd: prominent staircase — wooden steps, photo walls on landings.',
  h5MeCp: 'Mercury in Capricorn in the 5th: CA / finance aspirants or professionals in the family circle.',
  h5Temple: 'Strong 5th (esp. with Jupiter): temple-building / head-priest of the household or village shrine themes (Jaimini 5th link).',
  h12MaAq: 'Mars in Aquarius in the 12th: bedtime games, web series, or detective / suspense pull before sleep.',
  fNodesTitle: 'Nodes on the D4 heart',
  fNodesText: 'Rahu or Ketu on any divisional lagna disturbs that chart’s heart. Expect struggle themes around personal space, contentment, or shared living until wisdom softens the node.',
  fMoonTitle: 'Moon under difficult pressure',
  fMoonText: 'Mars or Saturn conjunct/aspecting the D4 Moon can amplify domestic irritability, raised voices, or emotional volatility at home.',
  fDomesticTitle: 'Domestic conflict caution',
  fDomesticText: 'Difficult planets on the Moon with difficult planets also in the D4 4th can point to serious conflict at home. Read with D1 and lived context — this is a caution flag, not a verdict.',
  fMoMaTitle: 'Moon–Mars heat on lagna',
  fMoMaText: 'Moon–Mars together on the D4 lagna often shows day-long crankiness in the shared space — and a refusal of dead-quiet neighborhoods.',
  fVeMaSaTitle: 'Passion + duty stress on the axis',
  fVeMaSaText: 'Venus–Mars on lagna with Saturn in the 7th can mark intense partner dynamics and mutual boundary conflict. Your safety comes first, and counselling can help. This is not a fixed outcome.',
  fMaSaTitle: 'Mars–Saturn 1/7 tension',
  fMaSaText: 'Mars–Saturn across the lagna–7th axis correlates with hardness, control fights, and domestic intensity. Soften with clear agreements and space.',
  fHeartHeavyTitle: 'Heart heaviness caution',
  fHeartHeavyText: 'When the D4 Moon and key triad are heavily pressed, chronic low mood or a sense that the house “cuts” can appear. Seek support; this is a care flag, not a prediction of harm.',
  fSaKeLagnaTitle: 'Saturn–Ketu on the heart',
  fSaKeLagnaText: 'Saturn–Ketu on D4 lagna (esp. Scorpio): neglected domestic order — messy bedroom, delayed laundry, fermented/astringent drink preferences. Soften with routine, not shame.',
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
  aSignMatchTitle: 'Matching D4 lagna sign',
  aSignMatchText: 'Whoever’s birth (or chart) ascendant matches your D4 lagna sign tends to live in your heart — energy syncs. Prioritize D4 for “can we share a home?”; if fights persist while living together, check D3 for the conflict axis.',
  aD3CrossTitle: 'D3 cross-check for cohabitation fights',
  aD3CrossText: 'Mind-match and roommate-match differ. Shared roof with constant quarrels → D4 for heart fit, D3 for where speech/conflict lands.',
  r8Holds: 'D4 8th holds {names} — residence change pressure when their dashas run',
  r8None: 'No planet in D4 8th — use 8th lord dashas and 6/8 links for move timing',
  rNoPath: 'Vimshottari path unavailable on this chart — compute dashas to time relocation.',
  rNote: '{lord} in D4 H{house} ({rashi})',
  rNoteMissing: '{lord} — D4 placement missing',
  rNote8: ' — 8th house period: residence change is more likely.',
  rNoteLord8: ' — dasha of the D4 8th lord: watch relocation.',
  rNote12: ' — 12th house period: abroad or far from birthplace more likely.',
  rNote6: ' — 6th house period: friction that can push a move.',
  rLevelFallback: 'L{level}',
  rPath: 'Current path {path}',
  rWindow: 'Relocation window active',
  rWindowText: 'A running dasha lord sits in the D4 8th, is the 8th lord, or rules a planet there — place change is more likely.',
  rStrong: 'Strong relocation window',
  rLink: '6/8 dasha link — move possible',
  rLinkText: 'Mahadasha lord and Antardasha lord stand in a 6/8 relationship in D4 — a strong indicator for residence change.',
  rDusthana: 'D4 6/8/12 dasha active — home change pressure',
  rDusthanaText: 'A running path lord occupies D4 dusthana (6, 8, or 12) — class rule for residence change; 12th favors abroad or distance.',
  r49: '4th–9th dasha link — place change',
  r49Text: 'Current MD/AD involve the D4 4th and 9th lords (or sit in 4 and 9) — home change is favored.',
  rMoSa: 'Moon–Saturn path — build or renovate',
  rMoSaText: 'Moon–Saturn mahadasha/antardasha often marks constructing a house or major renovation, not only relocating.',
  r12: 'Twelfth-period abroad / distance window',
  r12Text: 'D4 12th occupant or 12th lord in the current path — timing for going abroad or living far from the birthplace.',
  rMeChild: 'Mercury period — child / park neighborhood',
  rMeChildText: 'Mercury dasha in D4 pulls toward neighborhoods with children at play and parks; if those significations already exist locally, the “move” may be bringing children into the picture instead.',
  r8Time: 'D4 8th occupants ({names}) time moves when their periods run.',
  rNone: 'No strong 8th / 6–8 relocation flag in the current path — still watch gochar and D1 4th/8th.',
  propJuTitle: 'Jupiter property tone',
  propJu: 'Large home near temple, good locality, wide roads, and many trees.',
  propVeTitle: 'Venus property tone',
  propVe: 'City-center / bazaar home — jewelry shops, cafés, upscale restaurants, offices nearby.',
  propMoTitle: 'Moon property tone',
  propMo: 'Food-market locale — grocers, eateries, pond or water body nearby.',
  propSaTitle: 'Saturn property tone',
  propSa: 'Industrial belt — ongoing construction, laborers, servants at home.',
  propKeTitle: 'Ketu property tone',
  propKe: 'Outskirts or barren land; crooked lane; dead-end plot.',
  propRaTitle: 'Rahu property tone',
  propRa: 'Home amenities lean luxury-vice: bar, jacuzzi, smoking zones.',
  propRaVeTitle: 'Rahu–Venus property tone',
  propRaVe: 'Ultra-luxury high-rise / royal apartment character.',
  propJuKeTitle: 'Jupiter–Ketu property tone',
  propJuKe: 'Farm compound — hedged fields with the house amid cropland.',
  propSaMaTitle: 'Saturn–Mars property tone',
  propSaMa: 'Builder / estate lord — factories, workshops, large owned tracts; multiple properties.',
  propMeTitle: 'Mercury property tone',
  propMe: 'Flat-builder / seller — builds units to sell; apartment commerce.',
  propSthanaTitle: 'Strong sthana-bala real-estate lean',
  propSthana: 'Positional strength (sthana-bala) above ~150 virupa on a key graha supports real-estate accumulation — buying and holding property over speculative markets.',
  patVeKeLeoTitle: 'Venus–Ketu in Leo (living space)',
  patVeKeLeo: 'Minimalist furniture; dislikes oversized sofas that kill space; bare-tree décor; half-figure or intriguing separation-themed art.',
  patMaLiTitle: 'Mars in Libra (living décor)',
  patMaLi: 'Army-officer living-room tone — swords/arms display, or mechanical pendulum clocks and watches as “machines” in the living area.',
  patMoRa2Title: 'Moon–Rahu in the 2nd',
  patMoRa2: 'Often affluent family background; when activated, appetite/indulgence can run heavy — keep boundaries kind.',
  patL4H10Title: '4th lord in the 10th',
  patL4H10: 'Domestic blame-game around cleaning and misplaced items — “you moved my things while tidying.” Soften with clear shared systems.',
  patKeCyberTitle: 'Ketu on D4 lagna — security break archetype',
  patKeCyber: 'Ketu on the heart often “breaks” Mars-type security — cyber-security / investigation careers can suit the lagna’s agenda (symbolic fit, not a job guarantee).',
  patMa12DetectTitle: 'Mars in 12th Aquarius — detective pull',
  patMa12Detect: 'Suspense files, detective stories, games, or web series into sleep — investigation fascination from childhood is common.',
  patJuGemTitle: 'Jupiter in Gemini on D4 lagna',
  patJuGem: 'Inner urge to explain and teach; home must feel airy with parks and green — Gemini = park, Jupiter = air/liveliness.',
  patL1H8Title: 'Lagna lord in the 8th',
  patL1H8: 'Class hallmark of deep occult / prominent astrologer charts — heart agenda meets hidden knowledge (confirm with whole chart).',
  devMa: 'Mars on the D4 heart: Hanuman / Ram bhakti — “Ram lives in the chest.”',
  devMo: 'Moon on the D4 heart: Shiva / Sati or, most often, Krishna devotion.',
  devSu: 'Sun on the D4 heart: Ram / Surya Narayan devotion; keep respectful distance in shared living.',
  devJu: 'Jupiter on the D4 heart: temple, nature, and sattvic neighbors are non-negotiable for the home.',
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
  tFourth10: ' Happiness through public service / karma is highlighted. Domestic blame around tidying can appear when the 4th lord sits in the 10th.',
  tRetro: ' Retrograde intensifies the craving tied to this role.',
  sumJuBad: 'Watch Jupiter for contentment gaps even when outer life looks full.',
  sumJuGood: 'Moon, 4th lord, and Jupiter frame whether the house feels enough.',
  sumTail: '{signal}. {content} D4 asks: what lives in this heart, what home soothes it, and can you share a room with them?',
  occColors: '{planet} colors the D4 heart.',
  occRetro: 'Retrograde intensifies insistence and obsessive wanting.',
  lordSits: '{lord} sits in {rashi} (H{house}, {dignity}).',
  lordMissing: '{lord} placement unavailable.',
  lord10: 'Happiness sought through public service / karma; watch domestic blame-games around order and cleaning.',
  retroNote: 'Retrograde {planet} in house {house}: obsessive, persistent demands around that house’s themes — intensity that is hard to ignore.',
  iEmptyTitle: 'Empty D4 lagna',
  iEmptyText: 'No planet occupies the heart — the lagna lord’s house and conjunctions tell the emotional story at full strength. Aspects on lagna work at roughly 30–40%.',
  iAspTitle: 'Aspects on empty lagna',
  iAspItem: '{planet} from H{house}: {note}',
  iJuBadTitle: 'Contentment (Jupiter) stressed',
  iJuGoodTitle: 'Jupiter supports santosh',
  iRetroTitle: 'Retrograde intensity',
  iPropTitle: 'Property / locality tone',
  iPatTitle: 'D4 pattern',
  iDevTitle: 'Heart devotion',
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
    if (occupants.some((g) => g.id === 'Ju') && occupants.some((g) => g.id === 'Mo')) {
      bits.push(T.h4JuMo)
    }
    if (occupants.some((g) => g.id === 'Sa') && occupants.some((g) => g.id === 'Ma')) {
      bits.push(T.h4SaMa)
    }
    if (occupants.some((g) => g.id === 'Ke')) bits.push(T.h4Ke)
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
    if (occupants.some((g) => g.id === 'Ve') && occupants.some((g) => g.id === 'Ra')) bits.push(T.h8VeRa)
  }

  if (house === 9) {
    bits.push(T.h9)
    if (occupants.some((g) => g.id === 'Sa') && occupants.some((g) => g.id === 'Ra')) bits.push(T.h9SaRa)
    if (occupants.some((g) => g.id === 'Sa' && g.rashi === 8)) bits.push(T.h9SaSc)
  }

  if (house === 11) {
    if (occupants.some((g) => g.id === 'Su' && g.rashi === 11)) {
      bits.push(T.h11SuAq)
    } else if (occupants.some((g) => g.id === 'Mo')) {
      bits.push(T.h11Mo)
    } else {
      bits.push(T.h11)
    }
  }

  if (house === 3) {
    bits.push(T.h3)
    if (occupants.some((g) => g.id === 'Su')) bits.push(T.h3Su)
  }

  if (house === 5) {
    if (occupants.some((g) => g.id === 'Me' && g.rashi === 10)) bits.push(T.h5MeCp)
    if (occupants.some((g) => g.id === 'Ju' || g.id === 'Su')) bits.push(T.h5Temple)
  }

  if (house === 12) {
    if (occupants.some((g) => g.id === 'Ma' && g.rashi === 11)) bits.push(T.h12MaAq)
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

  if (lagnaOcc.some((g) => g.id === 'Sa') && lagnaOcc.some((g) => g.id === 'Ke')) {
    flags.push({ id: 'sa-ke-lagna', title: T.fSaKeLagnaTitle, text: T.fSaKeLagnaText, tone: 'challenging' })
  }

  const moonPressedHard =
    moon &&
    grahas.filter(
      (g) =>
        (g.id === 'Ma' || g.id === 'Sa' || g.id === 'Ra' || g.id === 'Ke') &&
        (g.rashi === moon.rashi || hasParasharaAspect(g.rashi, g.id, moon.rashi)),
    ).length >= 2
  if (moonPressedHard && fourth.some((g) => MALEFICS.includes(g.id))) {
    flags.push({ id: 'heart-heavy', title: T.fHeartHeavyTitle, text: T.fHeartHeavyText, tone: 'challenging' })
  }

  return flags
}

function buildAffinityGuide(occupants: GrahaId[], L: D4Ctx): ChaturthamsaAffinityNote[] {
  const { T } = L
  const notes: ChaturthamsaAffinityNote[] = [
    { pair: 'sign-match', title: T.aSignMatchTitle, text: T.aSignMatchText, tone: 'supportive' },
    { pair: 'd3-cross', title: T.aD3CrossTitle, text: T.aD3CrossText, tone: 'mixed' },
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

function isD4Prominent(g: GrahaData, asc: Rashi): boolean {
  const h = houseOf(g.rashi, asc)
  if (h === 1 || h === 4) return true
  if (STRONG_DIGNITY.includes(g.dignity) && [5, 7, 9, 10].includes(h)) return true
  return false
}

function buildDevotionHints(grahas: GrahaData[], asc: Rashi, L: D4Ctx): string[] {
  const { T } = L
  const lagnaOcc = grahas.filter((g) => houseOf(g.rashi, asc) === 1)
  const hints: string[] = []
  if (lagnaOcc.some((g) => g.id === 'Ma')) hints.push(T.devMa)
  if (lagnaOcc.some((g) => g.id === 'Mo')) hints.push(T.devMo)
  if (lagnaOcc.some((g) => g.id === 'Su')) hints.push(T.devSu)
  if (lagnaOcc.some((g) => g.id === 'Ju')) hints.push(T.devJu)
  return hints
}

function buildPropertyNotes(
  chart: ChartOutput,
  grahas: GrahaData[],
  asc: Rashi,
  L: D4Ctx,
): ChaturthamsaPropertyNote[] {
  const { T } = L
  const notes: ChaturthamsaPropertyNote[] = []
  const byId = (id: GrahaId) => planetById(grahas, id)
  const prom = (id: GrahaId) => {
    const g = byId(id)
    return g ? isD4Prominent(g, asc) : false
  }

  if (prom('Ju')) notes.push({ id: 'prop-ju', planetIds: ['Ju'], title: T.propJuTitle, locality: T.propJu, tone: 'supportive' })
  if (prom('Ve')) notes.push({ id: 'prop-ve', planetIds: ['Ve'], title: T.propVeTitle, locality: T.propVe, tone: 'supportive' })
  if (prom('Mo')) notes.push({ id: 'prop-mo', planetIds: ['Mo'], title: T.propMoTitle, locality: T.propMo, tone: 'mixed' })
  if (prom('Sa')) notes.push({ id: 'prop-sa', planetIds: ['Sa'], title: T.propSaTitle, locality: T.propSa, tone: 'mixed' })
  if (prom('Ke')) notes.push({ id: 'prop-ke', planetIds: ['Ke'], title: T.propKeTitle, locality: T.propKe, tone: 'challenging' })
  if (prom('Ra')) notes.push({ id: 'prop-ra', planetIds: ['Ra'], title: T.propRaTitle, locality: T.propRa, tone: 'mixed' })
  if (prom('Me')) notes.push({ id: 'prop-me', planetIds: ['Me'], title: T.propMeTitle, locality: T.propMe, tone: 'mixed' })

  if (prom('Ra') && prom('Ve')) {
    notes.push({ id: 'prop-ra-ve', planetIds: ['Ra', 'Ve'], title: T.propRaVeTitle, locality: T.propRaVe, tone: 'supportive' })
  }
  if (prom('Ju') && prom('Ke')) {
    notes.push({ id: 'prop-ju-ke', planetIds: ['Ju', 'Ke'], title: T.propJuKeTitle, locality: T.propJuKe, tone: 'mixed' })
  }
  if (prom('Sa') && prom('Ma')) {
    notes.push({ id: 'prop-sa-ma', planetIds: ['Sa', 'Ma'], title: T.propSaMaTitle, locality: T.propSaMa, tone: 'supportive' })
  }

  const shadbalaPlanets = chart.shadbala?.planets
  if (shadbalaPlanets) {
    const strong = Object.values(shadbalaPlanets).some((p) => (p.sthanaBala ?? 0) >= 150)
    if (strong) {
      notes.push({
        id: 'prop-sthana',
        planetIds: [],
        title: T.propSthanaTitle,
        locality: T.propSthana,
        tone: 'supportive',
      })
    }
  }

  return notes
}

function buildPatterns(grahas: GrahaData[], asc: Rashi, L: D4Ctx): ChaturthamsaPattern[] {
  const { T } = L
  const out: ChaturthamsaPattern[] = []
  const lagnaOcc = grahas.filter((g) => houseOf(g.rashi, asc) === 1)
  const fourthLordId = SIGN_LORDS[wholeSignHouseSign(asc, 4)]
  const fourthLord = planetById(grahas, fourthLordId)
  const lagnaLordId = SIGN_LORDS[asc]
  const lagnaLord = planetById(grahas, lagnaLordId)

  const ve = planetById(grahas, 'Ve')
  const ke = planetById(grahas, 'Ke')
  if (ve && ke && ve.rashi === ke.rashi && ve.rashi === 5) {
    out.push({ id: 've-ke-leo', title: T.patVeKeLeoTitle, text: T.patVeKeLeo, tone: 'mixed' })
  }

  const ma = planetById(grahas, 'Ma')
  if (ma && ma.rashi === 7) {
    out.push({ id: 'ma-libra', title: T.patMaLiTitle, text: T.patMaLi, tone: 'mixed' })
  }

  const mo = planetById(grahas, 'Mo')
  const ra = planetById(grahas, 'Ra')
  if (mo && ra && mo.rashi === ra.rashi && houseOf(mo.rashi, asc) === 2) {
    out.push({ id: 'mo-ra-2', title: T.patMoRa2Title, text: T.patMoRa2, tone: 'mixed' })
  }

  if (fourthLord && houseOf(fourthLord.rashi, asc) === 10) {
    out.push({ id: 'l4-h10', title: T.patL4H10Title, text: T.patL4H10, tone: 'mixed' })
  }

  if (lagnaOcc.some((g) => g.id === 'Ke')) {
    out.push({ id: 'ke-cyber', title: T.patKeCyberTitle, text: T.patKeCyber, tone: 'mixed' })
  }

  if (ma && houseOf(ma.rashi, asc) === 12 && ma.rashi === 11) {
    out.push({ id: 'ma-12-aq', title: T.patMa12DetectTitle, text: T.patMa12Detect, tone: 'mixed' })
  }

  if (lagnaOcc.some((g) => g.id === 'Ju') && asc === 3) {
    out.push({ id: 'ju-gem-lagna', title: T.patJuGemTitle, text: T.patJuGem, tone: 'supportive' })
  }

  if (lagnaLord && houseOf(lagnaLord.rashi, asc) === 8) {
    out.push({ id: 'l1-h8', title: T.patL1H8Title, text: T.patL1H8, tone: 'mixed' })
  }

  return out
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

  const twelfthLordId = SIGN_LORDS[wholeSignHouseSign(asc, 12)]
  const fourthLordId = SIGN_LORDS[wholeSignHouseSign(asc, 4)]
  const ninthLordId = SIGN_LORDS[wholeSignHouseSign(asc, 9)]
  const twelfth = grahas.filter((g) => houseOf(g.rashi, asc) === 12)

  const nodes = chart.dashas?.vimshottari
  if (!nodes?.length) {
    return {
      eighthOccupants: eighth.map((g) => ({ id: g.id, name: L.g(g.id) })),
      eighthLordPeriodActive: false,
      sixthEighthDashaLink: false,
      dusthanaDashaActive: false,
      fourthNinthLink: false,
      moonSaturnBuild: false,
      twelfthAbroad: false,
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
      house === 8 || house === 6 || house === 12 ? 'challenging'
        : house === 4 || house === 1 || house === 9 ? 'mixed'
          : 'neutral'
    let note = g
      ? fill(T.rNote, { lord: L.g(lord), house: house ?? '', rashi: L.r(g.rashi) })
      : fill(T.rNoteMissing, { lord: L.g(lord) })
    if (house === 8) note += T.rNote8
    if (house === 12) note += T.rNote12
    if (house === 6) note += T.rNote6
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

  const dusthanaDashaActive = dashaLords.some(
    (l) => l.d4House === 6 || l.d4House === 8 || l.d4House === 12,
  )

  const pathLords = new Set(dashaLords.slice(0, 2).map((l) => l.lord))
  const fourthNinthLink =
    (pathLords.has(fourthLordId) && pathLords.has(ninthLordId)) ||
    Boolean(
      maha && antar &&
      ((maha.d4House === 4 && antar.d4House === 9) || (maha.d4House === 9 && antar.d4House === 4)),
    )

  const moonSaturnBuild =
    Boolean(maha && antar) &&
    ((maha!.lord === 'Mo' && antar!.lord === 'Sa') || (maha!.lord === 'Sa' && antar!.lord === 'Mo'))

  const twelfthAbroad = dashaLords.some(
    (l) => l.lord === twelfthLordId || l.d4House === 12 || twelfth.some((g) => g.id === l.lord),
  )

  const mercuryChildPeriod = dashaLords.slice(0, 2).some((l) => l.lord === 'Me')

  const pathLabel = dashaLords.map((l) => l.lordName).join(' / ')
  const highlights = Array.from(
    new Set(
      dashaLords
        .map((l) => l.d4House)
        .filter((h): h is number => h != null && (h === 6 || h === 8 || h === 12 || h === 4 || h === 9)),
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
  if (dusthanaDashaActive && !eighthLordPeriodActive && !sixthEighthDashaLink) {
    tone = 'challenging'
    headline = T.rDusthana
    details.push(T.rDusthanaText)
  }
  if (fourthNinthLink) {
    tone = 'challenging'
    if (!details.length) headline = T.r49
    details.push(T.r49Text)
  }
  if (moonSaturnBuild) {
    if (!details.length) {
      tone = 'mixed'
      headline = T.rMoSa
    }
    details.push(T.rMoSaText)
  }
  if (twelfthAbroad) {
    if (!details.length) {
      tone = 'challenging'
      headline = T.r12
    }
    details.push(T.r12Text)
  }
  if (mercuryChildPeriod) {
    details.push(T.rMeChildText)
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
    dusthanaDashaActive,
    fourthNinthLink,
    moonSaturnBuild,
    twelfthAbroad,
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
  const propertyNotes = buildPropertyNotes(chart, grahas, asc, L)
  const patterns = buildPatterns(grahas, asc, L)
  const devotionHints = buildDevotionHints(grahas, asc, L)

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
  for (const hint of devotionHints.slice(0, 2)) {
    insights.push({ kind: 'highlight', title: T.iDevTitle, text: hint })
  }
  for (const note of propertyNotes.slice(0, 2)) {
    insights.push({ kind: 'info', title: note.title || T.iPropTitle, text: note.locality })
  }
  for (const pat of patterns.slice(0, 2)) {
    insights.push({ kind: 'info', title: pat.title || T.iPatTitle, text: pat.text })
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
  if (
    relocation &&
    (relocation.eighthLordPeriodActive ||
      relocation.sixthEighthDashaLink ||
      relocation.dusthanaDashaActive ||
      relocation.fourthNinthLink ||
      relocation.twelfthAbroad)
  ) {
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
    propertyNotes,
    patterns,
    devotionHints,
    relocation,
    affinityGuide,
    conflictFlags,
    insights,
    retrogradeNotes,
  }
}
