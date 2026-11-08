// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dashamsaAnalysis.ts
//  Dashamsha (D10) — advanced career / Digpala / livelihood analysis
//  Classical focus: BPHS + Narada Samhita Digpalas (prediction-grade)
// ─────────────────────────────────────────────────────────────

import type {
  ChartOutput,
  Dignity,
  GrahaData,
  GrahaId,
  Rashi,
} from '@/types/astrology'
import {
  GRAHA_NAMES,
  RASHI_NAMES,
  RASHI_SANSKRIT,
  RASHI_SHORT,
} from '@/types/astrology'
import { D10 } from '@/lib/engine/vargas'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { dignityText, fill, gName, pick, rName, type EngineLang } from '@/lib/engine/divisionalLang'
import { overlay } from '@/lib/engine/lang'
import {
  D10_HOUSE_DETAIL_HI,
  D10_HOUSE_THEMES_HI,
  D10_LAGNA_THEMES_HI,
  D10_PLANET_THEMES_HI,
  D10_PURPOSE_HI,
  D10_PURPOSE_PROTOCOL_HI,
  D10_TEXT_HI,
  DASHA_LEVEL_LABELS_HI,
  DIGPALA_META_HI,
  DIGPALA_PROFESSIONS_HI,
} from '@/lib/engine/locale/dashamsa.hi'

export type CareerTone = 'supportive' | 'challenging' | 'mixed' | 'neutral'

const CLASSICAL_ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

const SIGN_LORDS: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const STRONG_DIGNITY: Dignity[] = ['exalted', 'moolatrikona', 'own']
const WEAK_DIGNITY: Dignity[] = ['debilitated', 'great_enemy', 'enemy']

function wholeSignHouseSign(ascRashi: Rashi, house: number): Rashi {
  return (((ascRashi - 1 + house - 1) % 12) + 1) as Rashi
}

function houseOf(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function isOddSign(rashi: Rashi): boolean {
  return rashi % 2 === 1
}

export function signCount(fromRashi: number, toRashi: number): number {
  return ((toRashi - fromRashi + 12) % 12) + 1
}

/** Dashamsha part within the sign: 1–10 (each 3°). */
export function dashamshaPart(degreeInSign: number): number {
  const d = ((degreeInSign % 30) + 30) % 30
  return Math.min(10, Math.floor(d / 3) + 1)
}

export function dashamshaRashi(lon: number): Rashi {
  return D10(lon) as Rashi
}

// ── Digpalas (Narada Samhita — prediction-grade) ─────────────

export type DigpalaId =
  | 'indra'
  | 'agni'
  | 'yama'
  | 'rakshasa'
  | 'varuna'
  | 'vayu'
  | 'kubera'
  | 'ishana'
  | 'brahma'
  | 'ananta'

export interface DigpalaMeta {
  id: DigpalaId
  name: string
  nameSa: string
  direction: string
  directionSa: string
  /** Fixed planet lord when classical texts assign one; null for Brahma/Ananta. */
  rulingPlanet: GrahaId | null
  rulingPlanetNote: string
  signification: string
  detail: string
  /** Professions / fields classically indicated */
  professions: string[]
  /** Directional career advice (setup / transfer / job search) */
  directionAdvice: string
  /** What prediction systems watch for */
  predictionHook: string
  /** Degree bands within a 30° sign (paired Narada teaching for first five). */
  degreeBands: string | null
  /** Odd-sign part index 1–10 for this Digpala (even signs reverse). */
  oddPart: number
}

/**
 * Ten Digpalas in forward (odd-sign) order.
 * Part 1→Indra … Part 10→Ananta. Even signs reverse the sequence.
 */
export const DIGPALA_ORDER: DigpalaId[] = [
  'indra', 'agni', 'yama', 'rakshasa', 'varuna',
  'vayu', 'kubera', 'ishana', 'brahma', 'ananta',
]

export const DIGPALA_META: Record<DigpalaId, DigpalaMeta> = {
  indra: {
    id: 'indra',
    name: 'Indra',
    nameSa: 'इन्द्र',
    direction: 'East',
    directionSa: 'पूर्व',
    rulingPlanet: 'Su',
    rulingPlanetNote: 'Sun (अधिष्ठाता ग्रह)',
    signification: 'Power-house of energy — kingship, government, authority with money',
    detail:
      'Indra people need power along with income for satisfaction. Business kings and government-linked careers. Troubles often clear when work or transfer aligns to the East.',
    professions: ['Government / public office', 'Business leadership / “king” roles', 'Executive authority', 'Politics-adjacent power'],
    directionAdvice: 'Prefer East for office setup, transfer, or job search when Indra Digpala is active on lagna or 10th lord.',
    predictionHook: 'Authority + status timing; East-direction relief for career friction.',
    degreeBands: '0–3° & 27–30° (paired Narada note: first & last groups)',
    oddPart: 1,
  },
  agni: {
    id: 'agni',
    name: 'Agni',
    nameSa: 'अग्नि',
    direction: 'South-East',
    directionSa: 'दक्षिण-पूर्व',
    rulingPlanet: 'Ve',
    rulingPlanetNote: 'Venus',
    signification: 'Growth (ṛddhi–siddhi), remove pain/pressure, motivation & zest',
    detail:
      'Agni gives growth and clears mental pressure. Where energy, motivation, and “must do something” fire are needed — defense and other forces sit naturally here.',
    professions: ['Defense & armed forces', 'High-energy / motivational roles', 'Growth-oriented enterprise', 'Venusian creative drive under heat'],
    directionAdvice: 'South-East setup or posting supports growth and reduces career mental load.',
    predictionHook: 'Motivation surges; obstacle-removal periods; SE directional remedies.',
    degreeBands: '3–6° & 24–27°',
    oddPart: 2,
  },
  yama: {
    id: 'yama',
    name: 'Yama',
    nameSa: 'यम',
    direction: 'South',
    directionSa: 'दक्षिण',
    rulingPlanet: 'Ma',
    rulingPlanetNote: 'Mars',
    signification: 'Rules & regulations — once started, never retreats',
    detail:
      'Yama is the deity of no return: after entering this group, the person persists despite loss or defeat. Lawyers know they may lose and still fight; judges must decide; soldiers must advance on duty.',
    professions: ['Lawyers / advocates', 'Judges / magistrates', 'Government officers', 'Defense forces', 'Civil / electrical engineers', 'R&D that never quits mid-problem'],
    directionAdvice: 'South direction suits duty-bound, rule-bound, or high-persistence work.',
    predictionHook: 'Non-retreat career arcs; litigation stamina; engineering / research grind.',
    degreeBands: '6–9° & 21–24°',
    oddPart: 3,
  },
  rakshasa: {
    id: 'rakshasa',
    name: 'Rakshasa',
    nameSa: 'राक्षस',
    direction: 'South-West',
    directionSa: 'दक्षिण-पश्चिम',
    rulingPlanet: 'Ra',
    rulingPlanetNote: 'Rahu',
    signification: 'Uncomfortable among deities — breaks boundaries, shortcuts',
    detail:
      'Awkward among Digpalas: breaks traffic / paperwork boundaries — pays extra to clear a jam, oils the system when documents stall. Unconventional methods; ethical scrutiny required.',
    professions: ['Grey-area brokerage', 'Unconventional tech / disruption', 'Import–export loopholes', 'Roles that bypass standard queues'],
    directionAdvice: 'South-West careers can succeed via unconventional paths — watch legality and reputation cost.',
    predictionHook: 'Shortcut years; Rahu-style breakthroughs or scandals; SW directional risk.',
    degreeBands: '9–12° & 18–21°',
    oddPart: 4,
  },
  varuna: {
    id: 'varuna',
    name: 'Varuna',
    nameSa: 'वरुण',
    direction: 'West',
    directionSa: 'पश्चिम',
    rulingPlanet: 'Sa',
    rulingPlanetNote: 'Saturn / Moon (जल देवता)',
    signification: 'Overseas travel, foreign hardship, wellness, water trades',
    detail:
      'Classically “went West” = went abroad. Shows foreign travel comfort/discomfort and whether the path is wholesome (wellness). Shipping, cargo, fisheries, medicines.',
    professions: ['Overseas education / foreign posting', 'Shipping / cargo / fisheries', 'Medical & medicines', 'Water / wellness industries'],
    directionAdvice: 'West / foreign geography for study, business, or posting when Varuna marks lagna or key career lords.',
    predictionHook: 'Foreign chapters; travel friction; medical/shipping livelihood; lagna in 5th group often flags abroad themes.',
    degreeBands: '12–15° & 15–18° (middle pair)',
    oddPart: 5,
  },
  vayu: {
    id: 'vayu',
    name: 'Vayu',
    nameSa: 'वायु',
    direction: 'North-West',
    directionSa: 'उत्तर-पश्चिम',
    rulingPlanet: 'Mo',
    rulingPlanetNote: 'Saturn / Moon',
    signification: 'Everywhere like air — earn from knowledge & intelligence',
    detail:
      'Vayu is pervasive: livelihood from what you know — teachers, philosophers, writers, knowledge products.',
    professions: ['Teachers', 'Philosophers', 'Writers / authors', 'Knowledge products / content'],
    directionAdvice: 'North-West suits knowledge-diffusion work and mobile / multi-location teaching.',
    predictionHook: 'Knowledge-income seasons; publishing / teaching dashas.',
    degreeBands: null,
    oddPart: 6,
  },
  kubera: {
    id: 'kubera',
    name: 'Kubera',
    nameSa: 'कुबेर',
    direction: 'North',
    directionSa: 'उत्तर',
    rulingPlanet: 'Me',
    rulingPlanetNote: 'Mercury (बुद्धि से कमाई)',
    signification: 'God of wealth — intelligence-based earnings',
    detail:
      'Kubera’s treasury via buddhi: consultants, chartered accountants, and other intellect-priced services (not vague “counselor” — concrete expertise sold).',
    professions: ['Consultants', 'Chartered accountants', 'Finance / tax specialists', 'Intelligence-priced advisory'],
    directionAdvice: 'North direction favors wealth-skill professions and advisory practices.',
    predictionHook: 'Fee-based expertise peaks; Mercury dashas for CA / consulting rise.',
    degreeBands: null,
    oddPart: 7,
  },
  ishana: {
    id: 'ishana',
    name: 'Ishana',
    nameSa: 'ईशान',
    direction: 'North-East',
    directionSa: 'उत्तर-पूर्व',
    rulingPlanet: 'Ju',
    rulingPlanetNote: 'Jupiter',
    signification: 'Blessings, mentorship, spiritual earnings, banking',
    detail:
      'NE is the puja corner: blessings and mentors who carry you forward. Spiritual livelihood, priests/pandits, and bankers under Guru.',
    professions: ['Banking', 'Priests / pandits / spiritual teaching', 'Mentored professions', 'Temple / dharma economy'],
    directionAdvice: 'North-East supports blessed mentorship and sacred / banking workspaces.',
    predictionHook: 'Mentor arrival; Guru dasha fame; NE directional grace.',
    degreeBands: null,
    oddPart: 8,
  },
  brahma: {
    id: 'brahma',
    name: 'Brahma',
    nameSa: 'ब्रह्मा',
    direction: 'Below (Pātāla)',
    directionSa: 'अधः / पाताल',
    rulingPlanet: null,
    rulingPlanetNote: 'Ascendant lord (+ 4th-house link)',
    signification: 'Internal peace, creation, foundation — also “lower level” trials',
    detail:
      'Internal peace and satisfaction with one’s work, small or large. Creation (new institutions / nations / ventures). As “below,” can also show humble or humiliating chapters that forge the foundation.',
    professions: ['Founders / institution builders', 'Work that requires deep inner satisfaction', 'Foundation roles behind public fame'],
    directionAdvice: 'Read with 4th-house peace: if Brahma marks 10th lord, career is about creating + inner contentment, not only status.',
    predictionHook: 'Creation events; inner peace vs public glory; foundation fights (e.g. education battles when linked to H5).',
    degreeBands: null,
    oddPart: 9,
  },
  ananta: {
    id: 'ananta',
    name: 'Ananta',
    nameSa: 'अनन्त',
    direction: 'Above (Antarikṣa)',
    directionSa: 'ऊर्ध्व / अन्तरिक्ष',
    rulingPlanet: null,
    rulingPlanetNote: '10th house (sky / fame)',
    signification: 'Worldwide fame and reputation',
    detail:
      'Name and fame can go worldwide. Reputation built through work reaches universal scale when Ananta colors key lords or the 10th.',
    professions: ['Public figures', 'Global-brand builders', 'Nation-scale recognition roles'],
    directionAdvice: 'Not a compass direction — aim for scale: platforms, media, and public karma that travel far.',
    predictionHook: 'Fame spikes when Ananta planets or 10th/11th lords run dasha after a public event.',
    degreeBands: null,
    oddPart: 10,
  },
}

/**
 * Digpala for a planet from natal sign + degree-in-sign.
 * Odd signs: parts 1→10 = Indra→Ananta.
 * Even signs: reverse (part 1 = Ananta … part 10 = Indra).
 */
export function digpalaForPlacement(rashi: Rashi, degreeInSign: number, lang: EngineLang = 'en'): DigpalaMeta {
  const part = dashamshaPart(degreeInSign)
  const idx = isOddSign(rashi) ? part - 1 : 10 - part
  const id = DIGPALA_ORDER[idx]!
  return localizeDigpala(DIGPALA_META[id], lang)
}

/** Overlay Hindi Digpala copy; ids / Sanskrit / oddPart stay English-stable. */
export function localizeDigpala(meta: DigpalaMeta, lang: EngineLang = 'en'): DigpalaMeta {
  if (lang !== 'hi') return meta
  const hi = DIGPALA_META_HI[meta.id]
  const professions = DIGPALA_PROFESSIONS_HI[meta.id] ?? meta.professions
  // Cast: DigpalaHi may omit null-only fields; overlay only swaps string keys.
  return {
    ...overlay(meta, hi as Partial<Record<keyof DigpalaMeta, string>>, lang),
    professions,
  }
}

// ── Themes ───────────────────────────────────────────────────

export const D10_PURPOSE = {
  primary: 'Karma, livelihood (ājīvikā), occupation — respect earned through work',
  significations: [
    'What karma / occupation you will do',
    'Source of income and livelihood (ājīvikā)',
    'Business or job success and professional growth',
    'Whether work earns respect (karmic respect)',
    'Career karma, achievements, and awards',
  ],
  calculation: {
    formula: '30° ÷ 10 = 3° each Dashamsha part (group)',
    oddSigns: 'Odd signs: count from the same Rashi where the planet sits',
    evenSigns: 'Even signs: count from the 9th Rashi from the planet',
  },
  predictionProtocol: [
    'Digpala of D1 Lagna degree → livelihood direction & foreign/domestic flavor',
    '10th lord of D10 → Digpala of that lord (creation, fame, persistence, etc.)',
    '11th lord of D10 → gains/awards; watch its Mahadasha for recognition events',
    '8th house of D10 → ethical track of business (ethical vs unethical dealings)',
    'Overlay current Vimshottari lords on D10 houses for timing',
  ],
} as const

/** Extended house lore from classical classroom teaching. */
export const HOUSE_THEMES_D10: Record<number, string> = {
  1: 'Ājīvikā foundation — mental state about work, strength of career karma; strong lagna = strong livelihood base',
  2: 'Income from work, social status, how you express / present the business',
  3: 'Innovation & creation in business; networking; quality of professional relationships',
  4: 'Emotional attachment & mental peace / satisfaction from occupation (sukha of work)',
  5: 'Prestige & reputation shared; foundation; well-wishers; people who benefit from your work',
  6: 'Competition; obstacles & speed-breakers; capacity to face challenges in job/business',
  7: 'Associates, supporters, and partners in occupation',
  8: 'Business secrets; ethical vs unethical track; hidden dealings / bribes / new profit routes; new ventures; end of a business chapter',
  9: 'Mentorship, guidance, knowledge of the occupation; whether work stays on the right direction',
  10: 'All work-related karma; how reputation builds through that karma',
  11: 'Profits, awards, achievements from business/occupation',
  12: 'End of business; donations; social welfare; hidden enmities / ambushes',
}

export const HOUSE_DETAIL_D10: Record<number, string> = {
  1: 'If D10 lagna is strong, the foundation of livelihood is strong. Read mental readiness for the chosen karma here.',
  2: 'How money and status flow from the occupation — speech, branding, and commercial expression.',
  3: 'What you invent or create in the field; how you network and relate professionally (hello–hai quality of ties).',
  4: 'Not home sukha alone — sukha from occupation: emotionally attached? mentally satisfied? peace with the work?',
  5: 'Reputation you share; who benefits from your business; soft power and well-wishers.',
  6: 'Rivals and speed-breakers — and whether you have capacity to face them.',
  7: 'Who stands with you: partners, supporters, business associates.',
  8: 'Track of business: ethical or unethical; hidden secrets (who is squeezed, bribed, or newly monetized); also endings and new ventures.',
  9: 'Right mentors and right direction — knowledge of how the occupation should be done.',
  10: 'Total karmic load of work + reputation build-up across time.',
  11: 'Visible fruits: profit, awards, public achievement.',
  12: 'Closures, charity from business, social-welfare face, and hidden enmities.',
}

const DASHAMSA_LAGNA_THEMES: Record<Rashi, string> = {
  1: 'Initiative and competitive drive color livelihood — pioneering roles, startups, athletics, or military leadership.',
  2: 'Values, speech, and resources shape career — banking, arts, food, luxury trade, or voice-based work.',
  3: 'Communication and skill craft the profession — media, sales, writing, tech support, short-haul commerce.',
  4: 'Emotional security and place matter — real estate, vehicles, caregiving, homeland institutions.',
  5: 'Creativity and authority — entertainment, politics, education, speculative or leadership roles.',
  6: 'Service and precision — medicine, law support, analytics, competitive fields, process improvement.',
  7: 'Partnership and public dealing — consulting, law, diplomacy, client-facing business.',
  8: 'Research, crisis, and transformation — occult/tech research, insurance, surgery, investigative work.',
  9: 'Teaching, law, and distant horizons — academia, counsel, travel trade, publishing, dharma work.',
  10: 'Pure karma lagna — executive roles, government, management; status through visible duty.',
  11: 'Networks and gains — tech, social enterprise, large organizations, income through groups.',
  12: 'Foreign, hospitals, ashrams, or behind-the-scenes — export, healing, charity, isolation work.',
}

const PLANET_D10_THEMES: Record<GrahaId, string> = {
  Su: 'Authority, government, father figures, and how the soul seeks respect through work.',
  Mo: 'Public mood, care roles, and emotional climate of the workplace or livelihood.',
  Ma: 'Drive, engineering, defense, surgery, competition — how you fight for career goals.',
  Me: 'Commerce, writing, accounting, consulting — intellect as livelihood.',
  Ju: 'Counsel, banking, teaching, expansion — blessings and mentors in profession.',
  Ve: 'Arts, luxury, diplomacy, comfort industries — harmony and beauty at work.',
  Sa: 'Labor, structure, delay, endurance — long-haul careers and institutional roles.',
  Ra: 'Foreign, unconventional, tech/shadow markets — breakthrough or shortcut paths.',
  Ke: 'Specialist skill, detachment, research — mastery without craving the spotlight.',
  Ur: 'Sudden reform in career patterns.',
  Ne: 'Idealism or confusion in professional direction.',
  Pl: 'Power and rebirth through vocation.',
}


/** English sentence templates; Hindi twins in locale/dashamsa.hi.ts. */
const D10_TEXT_EN = {
  planetFallback: 'Career expression through this Dashamsha.',
  planetRoute: '{name} operates from {d1} (H{d1House}) into Dashamsha {d10} (H{d10House}), part {part}/10.',
  planetDigpala: 'Digpala {digpala} / {digpalaSa} ({direction}) — {signification}.',
  vargottama: 'Vargottama: natal and D10 signs align — career promise is consistent.',
  dignityIn: 'Dignity in D10: {dignity}.',
  roleMissing: '{role} placement unavailable.',
  roleDusthana: 'needs careful handling of conflict, secrecy, or endings',
  roleKendra: 'can act visibly in livelihood',
  roleOther: 'supports career through effort and timing',
  roleNote: '{role} ({name}) in D10 {rashi} H{house} under {digpala} — {tone}. {theme}',
  rolePredMissing: '{role}: Digpala unavailable.',
  rolePred: '{hook} Direction: {advice}',
  dashaNote: '{name} in D10 H{house} ({rashi}) · Digpala {digpala}',
  dashaMissing: '{name} — D10 placement missing',
  dasha11: ' — 11th lord period: watch awards, profits, and public recognition.',
  dasha10: ' — 10th lord period: work karma and reputation build-up accelerate.',
  careerWindow: '{level} {name} through {end} — watch D10 houses {houses}.',
  noVimshottari: 'No active Vimshottari path.',
  fameWindow: '{level} {name} can lift recognition (11th / Ananta themes) through {end}.',
  fameWindowAlt: 'No current dasha lord is the D10 11th lord — fame spikes more likely when 11th-lord dasha runs after a public event.',
  digpalaCount: '{n} planets in this Digpala',
  digpalaCountOne: '{n} planet in this Digpala',
  dirLagna: 'Lagna Digpala {name} ({dirSa}) sets the primary compass for livelihood.',
  dirVaruna: 'Varuna emphasis: overseas education, foreign posting, or West-direction business is a live theme.',
  dirTenth: '10th lord Digpala {name} refines where work karma actually lands.',
  srcLagna: 'Lagna Digpala {name}',
  srcTenth: '10th lord {name} → {digpala}',
  srcTenthPending: '10th lord Digpala pending',
  srcEleventh: '11th lord {name} → {digpala}',
  srcEleventhPending: '11th lord Digpala pending',
  respectPath: 'Respect and awards route through 11th lord {name} in house {house} ({digpala}).',
  respectWatch: 'Watch 11th lord Digpala and its dasha for when work earns public respect.',
  livHeadline: 'Livelihood flavor: {lagna} + {tenth}',
  tenthDigpalaFallback: '10th Digpala',
  ethMixed: 'Business track looks mixed — read secrets without assuming guilt',
  ethRakshasaHead: 'Unconventional / boundary-breaking track in D10 8th',
  ethRakshasaText: '8th house or its lord touches Rakshasa/Rahu themes — shortcuts, grey methods, or hidden dealings may appear. Check whether the person keeps ethics while breaking bureaucracy.',
  ethPressureHead: 'Pressure and secrecy around occupation',
  ethPressureText: 'Difficult planets in D10 8th intensify secrets, crises, and new-venture endings — not automatically unethical, but the track must be watched.',
  ethCleanHead: 'Cleaner ethical track indicated',
  ethCleanText: 'Empty 8th with a dignified 8th lord often keeps hidden dealings muted — still verify with dashas and D1.',
  ethLord: '8th lord {name} in house {house} under {digpala}.',
  ethLordMissing: '8th lord placement unavailable.',
  fameWorldwide: 'Ananta / sky themes — reputation can travel far',
  fameWide: 'Strong public-karma link — reputation builds beyond the local circle',
  fameLocal: 'Respect is earned; worldwide fame needs Ananta or strong 11th timing',
  fame11: '11th lord {name} in D10 H{house} ({digpala}) — awards and “father of the field” style recognition time with this lord’s dasha after a public event.',
  fame11Missing: '11th lord unavailable.',
  fameAnanta: 'Ananta Digpala on {names} points to name that can scale.',
  fameNoAnanta: 'No planet currently in Ananta Digpala — fame still possible via 10th/11th lords and public dashas.',
  fameTenth: '10th lord {name} under {digpala} sets how karma becomes reputation.',
  advLagna: 'D1 Lagna Digpala {name} ({direction}): {detail}',
  advTenth: 'D10 10th lord {name} Digpala {digpala}: {detail}',
  advBrahmaExtra: ' Creation + internal peace — founding work, not only status.',
  advFifthExtra: ' In D10 5th: education fights, prestige battles, or creative karma may color the 10th lord.',
  advTenthMissing: '10th lord Digpala unavailable.',
  advEleventh: 'D10 11th lord {name} under {digpala} in house {house}: profits and awards. Classroom rule — when a nation-scale or career-defining event hits during this lord’s dasha, fame often jumps.',
  advEleventhMissing: '11th lord reading unavailable.',
  creationSplit: 'Split signature: Brahma on 10th lord (create / inner peace) with Ananta or sky-linked 11th (worldwide name) — build first, fame follows.',
  creationBrahma: 'Brahma on 10th lord emphasizes creation and inner satisfaction over loud fame.',
  creationAnanta: 'Ananta on 11th lord favors awards and wide reputation when dasha supports.',
  creationCompare: 'Creation vs fame: compare 10th-lord Digpala (karma style) with 11th-lord Digpala (recognition style).',
  competition: '6th lord {name} in house {house} ({digpala}): how you face rivals and speed-breakers.',
  competitionMissing: '6th lord competition reading unavailable.',
  mentorOcc: 'D10 9th occupied by {names} — mentors and right-direction guidance are active.',
  mentorLord: 'D10 9th lord {name} steers mentorship and occupational knowledge.',
  noteProtocol: 'Always read Digpala of Lagna, 10th lord, and 11th lord before declaring profession.',
  noteDirection: 'Direction advice is a prediction tool (transfer / setup / foreign), not only symbolism.',
  noteLagnaLord: 'D10 Lagna lord {name} in house {house} shows how the person owns livelihood.',
  noteLagnaConfirm: 'Confirm D10 Lagna lord house for livelihood ownership.',
  roleLagna: 'D10 Lagna lord (livelihood self)',
  roleTenth: '10th lord (all work karma)',
  roleEleventh: '11th lord (profits & awards)',
  roleSixth: '6th lord (competition)',
  insightVgTitle: 'Vargottama in career chart',
  insightVgText: '{names} keep the same sign in D1 and D10 — professional expression matches natal promise.',
  insightWeakTitle: 'Weak dignity in D10',
  insightWeakText: '{names} lose strength in Dashamsha — deliver with more effort or supporting lords.',
  insightDashaTitle: 'Current dasha × D10',
  insightFameTitle: 'Fame window',
} as const

// ── Types ────────────────────────────────────────────────────

export interface DashamsaPlanetRow {
  id: GrahaId
  name: string
  d1Rashi: Rashi
  d1RashiName: string
  d1RashiShort: string
  d1Degree: number
  d10Rashi: Rashi
  d10RashiName: string
  d10RashiShort: string
  d10Degree: number
  partInSign: number
  d1House: number
  d10House: number
  d1Dignity: Dignity
  d10Dignity: Dignity
  isVargottama: boolean
  digpala: DigpalaMeta
  d10Dispositor: GrahaId
  d10DispositorName: string
  strengthScore: number
  theme: string
  interpretation: string
}

export interface DashamsaHouseOccupant {
  id: GrahaId
  name: string
  rashi: Rashi
  rashiShort: string
  dignity: Dignity
  digpalaName: string
  isVargottama: boolean
}

export interface DashamsaHouseRow {
  house: number
  rashi: Rashi
  rashiName: string
  rashiShort: string
  lord: GrahaId
  lordName: string
  theme: string
  detail: string
  occupants: DashamsaHouseOccupant[]
}

export interface DigpalaOccupant {
  id: GrahaId
  name: string
  partInSign: number
  d10House: number
  d10RashiShort: string
}

export interface DigpalaBucket {
  digpala: DigpalaMeta
  planets: DigpalaOccupant[]
}

export interface DashamsaInsight {
  kind: 'strength' | 'caution' | 'highlight' | 'info'
  title: string
  text: string
}

export interface DashamsaKeyLord {
  role: string
  id: GrahaId
  name: string
  d10Rashi: Rashi
  d10RashiName: string
  d10House: number
  d10Dignity: Dignity
  digpala: DigpalaMeta
  digpalaName: string
  isVargottama: boolean
  note: string
  predictionNote: string
}

export interface DashamsaDashaLordOverlay {
  level: number
  levelLabel: string
  lord: GrahaId
  lordName: string
  start: string
  end: string
  d10Rashi: Rashi | null
  d10RashiName: string | null
  d10House: number | null
  digpalaName: string | null
  tone: CareerTone
  note: string
  isEleventhLord: boolean
  isTenthLord: boolean
}

export interface DashamsaDashaOverlay {
  pathLabel: string
  lords: DashamsaDashaLordOverlay[]
  careerWindow: string
  fameWindow: string
  highlightHouses: number[]
}

/** Directional career advice from lagna Digpala + clustered Digpalas. */
export interface DashamsaDirectionReading {
  primaryDigpala: DigpalaMeta
  compass: string
  advice: string
  secondaryDirections: { digpala: DigpalaMeta; reason: string }[]
  foreignTheme: boolean
  notes: string[]
}

/** Profession sketch from Digpala + key lords. */
export interface DashamsaProfessionSketch {
  headline: string
  fields: string[]
  workStyle: string
  respectPath: string
  sources: string[]
}

/** Ethical / secrecy track from D10 8th. */
export interface DashamsaEthicsTrack {
  tone: CareerTone
  headline: string
  text: string
  occupants: { id: GrahaId; name: string; digpala: string }[]
  lordNote: string
}

/** Fame / Ananta pathway. */
export interface DashamsaFamePath {
  scale: 'local' | 'regional' | 'wide' | 'worldwide'
  headline: string
  text: string
  anantaPlanets: string[]
  eleventhLordNote: string
}

export interface DashamsaAdvanced {
  protocol: readonly string[]
  lagnaDigpalaReading: string
  tenthLordDigpalaReading: string
  eleventhLordReading: string
  creationVsFame: string
  competitionNote: string
  mentorshipNote: string
  notes: string[]
}

export interface DashamsaAnalysis {
  d10Lagna: Rashi
  d10LagnaName: string
  d10LagnaSanskrit: string
  d10LagnaTheme: string
  lagnaVargottama: boolean
  lagnaDigpala: DigpalaMeta
  planets: DashamsaPlanetRow[]
  houses: DashamsaHouseRow[]
  digpalaBuckets: DigpalaBucket[]
  vargottama: DashamsaPlanetRow[]
  strongInD10: DashamsaPlanetRow[]
  weakInD10: DashamsaPlanetRow[]
  keyLords: DashamsaKeyLord[]
  insights: DashamsaInsight[]
  dashaOverlay: DashamsaDashaOverlay | null
  direction: DashamsaDirectionReading
  profession: DashamsaProfessionSketch
  ethics: DashamsaEthicsTrack
  fame: DashamsaFamePath
  advanced: DashamsaAdvanced
  summary: string
  purpose: typeof D10_PURPOSE
}

function planetStrengthScore(p: {
  d10Dignity: Dignity
  isVargottama: boolean
  d10House: number
  digpala: DigpalaMeta
}): number {
  let s = 50
  if (STRONG_DIGNITY.includes(p.d10Dignity)) s += 22
  else if (WEAK_DIGNITY.includes(p.d10Dignity)) s -= 22
  if (p.isVargottama) s += 12
  if ([1, 4, 7, 10].includes(p.d10House)) s += 8
  if ([5, 9, 11].includes(p.d10House)) s += 5
  if ([6, 8, 12].includes(p.d10House)) s -= 6
  if (p.digpala.id === 'ananta' || p.digpala.id === 'indra' || p.digpala.id === 'kubera') s += 4
  if (p.digpala.id === 'rakshasa') s -= 2
  return Math.max(5, Math.min(98, s))
}

function buildPlanetInterpretation(
  p: DashamsaPlanetRow,
  planetThemes: Record<GrahaId, string>,
  lang: EngineLang,
): { theme: string; interpretation: string } {
  const T = pick(D10_TEXT_EN as Record<string, string>, D10_TEXT_HI as Record<string, string>, lang)
  const theme = planetThemes[p.id] ?? PLANET_D10_THEMES[p.id] ?? T.planetFallback
  const parts = [
    fill(T.planetRoute, {
      name: p.name, d1: p.d1RashiName, d1House: p.d1House, d10: p.d10RashiName, d10House: p.d10House, part: p.partInSign,
    }),
    fill(T.planetDigpala, {
      digpala: p.digpala.name, digpalaSa: p.digpala.nameSa, direction: p.digpala.direction, signification: p.digpala.signification,
    }),
    p.digpala.predictionHook,
    p.isVargottama ? T.vargottama : null,
    fill(T.dignityIn, { dignity: dignityText(p.d10Dignity, lang) }),
  ].filter(Boolean)
  return { theme, interpretation: parts.join(' ') }
}

function keyLordNote(
  role: string,
  row: DashamsaPlanetRow | undefined,
  house: number,
  houseThemes: Record<number, string>,
  lang: EngineLang,
): string {
  const T = pick(D10_TEXT_EN as Record<string, string>, D10_TEXT_HI as Record<string, string>, lang)
  if (!row) return fill(T.roleMissing, { role })
  const dusthana = [6, 8, 12].includes(row.d10House)
  const kendra = [1, 4, 7, 10].includes(row.d10House)
  const tone = dusthana ? T.roleDusthana : kendra ? T.roleKendra : T.roleOther
  return fill(T.roleNote, {
    role, name: row.name, rashi: row.d10RashiName, house: row.d10House, digpala: row.digpala.name,
    tone, theme: houseThemes[house] ?? '',
  })
}

function keyLordPrediction(role: string, row: DashamsaPlanetRow | undefined, lang: EngineLang): string {
  const T = pick(D10_TEXT_EN as Record<string, string>, D10_TEXT_HI as Record<string, string>, lang)
  if (!row) return fill(T.rolePredMissing, { role })
  return fill(T.rolePred, { hook: row.digpala.predictionHook, advice: row.digpala.directionAdvice })
}

function dashaToneForHouse(house: number | null): CareerTone {
  if (house == null) return 'neutral'
  if ([1, 10, 11].includes(house)) return 'supportive'
  if ([6, 8, 12].includes(house)) return 'challenging'
  if ([2, 5, 9].includes(house)) return 'mixed'
  return 'neutral'
}

const DASHA_LEVEL_LABELS = ['', 'Maha', 'Antar', 'Pratyantar', 'Sukshma', 'Prana', 'Deha'] as const

function formatDashaDate(value: Date | string | number): string {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toISOString().slice(0, 10)
}

function buildDashaOverlay(
  chart: ChartOutput,
  planets: DashamsaPlanetRow[],
  tenthLordId: GrahaId,
  eleventhLordId: GrahaId,
  lang: EngineLang,
): DashamsaDashaOverlay | null {
  const T = pick(D10_TEXT_EN as Record<string, string>, D10_TEXT_HI as Record<string, string>, lang)
  const levels = lang === 'hi' ? DASHA_LEVEL_LABELS_HI : DASHA_LEVEL_LABELS
  const nodes = chart.dashas?.vimshottari
  if (!nodes?.length) return null
  const path = getDashaPathAt(nodes)
  if (!path.length) return null

  const byId = new Map(planets.map((p) => [p.id, p]))
  const lords: DashamsaDashaLordOverlay[] = path.slice(0, 4).map((seg) => {
    const lord = seg.lord as GrahaId
    const row = byId.get(lord)
    const house = row?.d10House ?? null
    const tone = dashaToneForHouse(house)
    const isEleventhLord = lord === eleventhLordId
    const isTenthLord = lord === tenthLordId
    let note = row
      ? fill(T.dashaNote, { name: gName(lord, lang), house: row.d10House, rashi: row.d10RashiName, digpala: row.digpala.name })
      : fill(T.dashaMissing, { name: gName(lord, lang) })
    if (isEleventhLord) note += T.dasha11
    if (isTenthLord) note += T.dasha10
    return {
      level: seg.level,
      levelLabel: levels[seg.level] ?? `L${seg.level}`,
      lord,
      lordName: gName(lord, lang),
      start: formatDashaDate(seg.start),
      end: formatDashaDate(seg.end),
      d10Rashi: row?.d10Rashi ?? null,
      d10RashiName: row?.d10RashiName ?? null,
      d10House: house,
      digpalaName: row?.digpala.name ?? null,
      tone,
      note,
      isEleventhLord,
      isTenthLord,
    }
  })

  const highlightHouses = [...new Set(
    lords.map((l) => l.d10House).filter((h): h is number => h != null),
  )]

  const top = lords[0]
  const careerWindow = top
    ? fill(T.careerWindow, {
      level: top.levelLabel, name: top.lordName, end: top.end,
      houses: highlightHouses.join(', ') || '1, 10, 11',
    })
    : T.noVimshottari

  const fameLord = lords.find((l) => l.isEleventhLord)
    ?? lords.find((l) => l.d10House === 11 || l.digpalaName === 'Ananta' || l.digpalaName === 'अनन्त')
  const fameWindow = fameLord
    ? fill(T.fameWindow, { level: fameLord.levelLabel, name: fameLord.lordName, end: fameLord.end })
    : T.fameWindowAlt

  return {
    pathLabel: lords.map((l) => l.lordName).join(' / '),
    lords,
    careerWindow,
    fameWindow,
    highlightHouses: highlightHouses.length ? highlightHouses : [1, 10, 11],
  }
}

function buildDirection(
  lagnaDigpala: DigpalaMeta,
  planets: DashamsaPlanetRow[],
  tenth: DashamsaPlanetRow | undefined,
  lang: EngineLang,
): DashamsaDirectionReading {
  const T = pick(D10_TEXT_EN as Record<string, string>, D10_TEXT_HI as Record<string, string>, lang)
  const counts = new Map<DigpalaId, number>()
  for (const p of planets) {
    counts.set(p.digpala.id, (counts.get(p.digpala.id) ?? 0) + 1)
  }
  const secondary = [...counts.entries()]
    .filter(([id]) => id !== lagnaDigpala.id)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, n]) => ({
      digpala: localizeDigpala(DIGPALA_META[id], lang),
      reason: fill(n === 1 ? T.digpalaCountOne : T.digpalaCount, { n }),
    }))

  const foreignTheme =
    lagnaDigpala.id === 'varuna'
    || tenth?.digpala.id === 'varuna'
    || (counts.get('varuna') ?? 0) >= 2

  const notes: string[] = [
    fill(T.dirLagna, { name: lagnaDigpala.name, dirSa: lagnaDigpala.directionSa }),
    lagnaDigpala.directionAdvice,
  ]
  if (foreignTheme) notes.push(T.dirVaruna)
  if (tenth) notes.push(fill(T.dirTenth, { name: tenth.digpala.name }))

  return {
    primaryDigpala: lagnaDigpala,
    compass: `${lagnaDigpala.direction} (${lagnaDigpala.directionSa})`,
    advice: lagnaDigpala.directionAdvice,
    secondaryDirections: secondary,
    foreignTheme,
    notes,
  }
}

function buildProfession(
  lagnaDigpala: DigpalaMeta,
  tenth: DashamsaPlanetRow | undefined,
  eleventh: DashamsaPlanetRow | undefined,
  digpalaBuckets: DigpalaBucket[],
  lang: EngineLang,
): DashamsaProfessionSketch {
  const T = pick(D10_TEXT_EN as Record<string, string>, D10_TEXT_HI as Record<string, string>, lang)
  const fields = new Set<string>()
  for (const f of lagnaDigpala.professions) fields.add(f)
  if (tenth) for (const f of tenth.digpala.professions) fields.add(f)
  const heavy = digpalaBuckets.filter((b) => b.planets.length >= 2)
  for (const b of heavy) for (const f of b.digpala.professions.slice(0, 2)) fields.add(f)

  const sources = [
    fill(T.srcLagna, { name: lagnaDigpala.name }),
    tenth ? fill(T.srcTenth, { name: tenth.name, digpala: tenth.digpala.name }) : T.srcTenthPending,
    eleventh ? fill(T.srcEleventh, { name: eleventh.name, digpala: eleventh.digpala.name }) : T.srcEleventhPending,
  ]

  const workStyle = tenth
    ? `${tenth.digpala.name}: ${tenth.digpala.detail}`
    : lagnaDigpala.detail

  const respectPath = eleventh
    ? fill(T.respectPath, { name: eleventh.name, house: eleventh.d10House, digpala: eleventh.digpala.name })
    : T.respectWatch

  return {
    headline: fill(T.livHeadline, {
      lagna: lagnaDigpala.name,
      tenth: tenth?.digpala.name ?? T.tenthDigpalaFallback,
    }),
    fields: [...fields].slice(0, 10),
    workStyle,
    respectPath,
    sources,
  }
}

function buildEthics(
  houses: DashamsaHouseRow[],
  planets: DashamsaPlanetRow[],
  d10Lagna: Rashi,
  houseDetail: Record<number, string>,
  lang: EngineLang,
): DashamsaEthicsTrack {
  const T = pick(D10_TEXT_EN as Record<string, string>, D10_TEXT_HI as Record<string, string>, lang)
  const h8 = houses[7]!
  const eighthLordId = SIGN_LORDS[wholeSignHouseSign(d10Lagna, 8)]
  const eighthLord = planets.find((p) => p.id === eighthLordId)
  const occupants = h8.occupants.map((o) => {
    const row = planets.find((p) => p.id === o.id)
    return { id: o.id, name: o.name, digpala: row?.digpala.name ?? o.digpalaName }
  })
  const hasRahu = occupants.some((o) => o.id === 'Ra')
  const hasRakshasa = occupants.some((o) => o.digpala === 'Rakshasa' || o.digpala === 'राक्षस') || eighthLord?.digpala.id === 'rakshasa'
  const maleficHeavy = occupants.some((o) => o.id === 'Sa' || o.id === 'Ma' || o.id === 'Ra')

  let tone: CareerTone = 'neutral'
  let headline: string = T.ethMixed
  let text: string = houseDetail[8] ?? HOUSE_DETAIL_D10[8]!

  if (hasRakshasa || hasRahu) {
    tone = 'challenging'
    headline = T.ethRakshasaHead
    text = T.ethRakshasaText
  } else if (maleficHeavy) {
    tone = 'mixed'
    headline = T.ethPressureHead
    text = T.ethPressureText
  } else if (occupants.length === 0 && eighthLord && STRONG_DIGNITY.includes(eighthLord.d10Dignity)) {
    tone = 'supportive'
    headline = T.ethCleanHead
    text = T.ethCleanText
  }

  const lordNote = eighthLord
    ? fill(T.ethLord, { name: eighthLord.name, house: eighthLord.d10House, digpala: eighthLord.digpala.name })
    : T.ethLordMissing

  return { tone, headline, text, occupants, lordNote }
}

function buildFame(
  planets: DashamsaPlanetRow[],
  eleventh: DashamsaPlanetRow | undefined,
  tenth: DashamsaPlanetRow | undefined,
  lang: EngineLang,
): DashamsaFamePath {
  const T = pick(D10_TEXT_EN as Record<string, string>, D10_TEXT_HI as Record<string, string>, lang)
  const ananta = planets.filter((p) => p.digpala.id === 'ananta')
  const anantaNames = ananta.map((p) => p.name)
  let scale: DashamsaFamePath['scale'] = 'local'
  if (ananta.length >= 2 || tenth?.digpala.id === 'ananta' || eleventh?.digpala.id === 'ananta') {
    scale = 'worldwide'
  } else if (ananta.length === 1 || eleventh?.d10House === 10 || tenth?.d10House === 11) {
    scale = 'wide'
  } else if (eleventh && [1, 5, 9, 11].includes(eleventh.d10House)) {
    scale = 'regional'
  }

  const headline: string =
    scale === 'worldwide' ? T.fameWorldwide
      : scale === 'wide' ? T.fameWide
        : T.fameLocal

  const eleventhLordNote = eleventh
    ? fill(T.fame11, { name: eleventh.name, house: eleventh.d10House, digpala: eleventh.digpala.name })
    : T.fame11Missing

  const text = [
    anantaNames.length
      ? fill(T.fameAnanta, { names: anantaNames.join(', ') })
      : T.fameNoAnanta,
    tenth ? fill(T.fameTenth, { name: tenth.name, digpala: tenth.digpala.name }) : null,
  ].filter(Boolean).join(' ')

  return { scale, headline, text, anantaPlanets: anantaNames, eleventhLordNote }
}

function buildAdvanced(
  lagnaDigpala: DigpalaMeta,
  tenth: DashamsaPlanetRow | undefined,
  eleventh: DashamsaPlanetRow | undefined,
  sixth: DashamsaPlanetRow | undefined,
  ninthHouse: DashamsaHouseRow,
  lagnaLord: DashamsaPlanetRow | undefined,
  lang: EngineLang,
): DashamsaAdvanced {
  const T = pick(D10_TEXT_EN as Record<string, string>, D10_TEXT_HI as Record<string, string>, lang)
  const lagnaDigpalaReading = fill(T.advLagna, {
    name: lagnaDigpala.name, direction: lagnaDigpala.direction, detail: lagnaDigpala.detail,
  })

  const tenthLordDigpalaReading = tenth
    ? fill(T.advTenth, { name: tenth.name, digpala: tenth.digpala.name, detail: tenth.digpala.detail })
      + (tenth.digpala.id === 'brahma' ? T.advBrahmaExtra : '')
      + (tenth.d10House === 5 ? T.advFifthExtra : '')
    : T.advTenthMissing

  const eleventhLordReading = eleventh
    ? fill(T.advEleventh, { name: eleventh.name, digpala: eleventh.digpala.name, house: eleventh.d10House })
    : T.advEleventhMissing

  const creationVsFame: string =
    tenth?.digpala.id === 'brahma' && (eleventh?.digpala.id === 'ananta' || eleventh?.d10House === 10)
      ? T.creationSplit
      : tenth?.digpala.id === 'brahma'
        ? T.creationBrahma
        : eleventh?.digpala.id === 'ananta'
          ? T.creationAnanta
          : T.creationCompare

  const competitionNote = sixth
    ? fill(T.competition, { name: sixth.name, house: sixth.d10House, digpala: sixth.digpala.name })
    : T.competitionMissing

  const mentorshipNote =
    ninthHouse.occupants.length
      ? fill(T.mentorOcc, { names: ninthHouse.occupants.map((o) => o.name).join(', ') })
      : fill(T.mentorLord, { name: ninthHouse.lordName })

  const notes = [
    T.noteProtocol,
    T.noteDirection,
    lagnaLord
      ? fill(T.noteLagnaLord, { name: lagnaLord.name, house: lagnaLord.d10House })
      : T.noteLagnaConfirm,
  ]

  return {
    protocol: lang === 'hi' ? [...D10_PURPOSE_PROTOCOL_HI] : [...D10_PURPOSE.predictionProtocol],
    lagnaDigpalaReading,
    tenthLordDigpalaReading,
    eleventhLordReading,
    creationVsFame,
    competitionNote,
    mentorshipNote,
    notes,
  }
}

/**
 * Full Dashamsha analysis from a calculated chart.
 * Requires chart.vargas.D10 and chart.vargaLagnas.D10.
 */
export function analyzeDashamsa(chart: ChartOutput, lang: EngineLang = 'en'): DashamsaAnalysis | null {
  const d10Grahas = chart.vargas?.D10
  const d10Lagna = chart.vargaLagnas?.D10
  if (!d10Grahas?.length || !d10Lagna) return null

  const houseThemes = pick(HOUSE_THEMES_D10, D10_HOUSE_THEMES_HI, lang)
  const houseDetail = pick(HOUSE_DETAIL_D10, D10_HOUSE_DETAIL_HI, lang)
  const lagnaThemes = pick(DASHAMSA_LAGNA_THEMES, D10_LAGNA_THEMES_HI, lang)
  const planetThemes = pick(PLANET_D10_THEMES, D10_PLANET_THEMES_HI as Record<GrahaId, string>, lang)

  const d1Asc = chart.lagnas.ascRashi
  const d10ById = new Map<GrahaId, GrahaData>()
  for (const g of d10Grahas) d10ById.set(g.id, g)

  const lagnaDigpalaResolved = digpalaForPlacement(d1Asc, chart.lagnas.ascDegreeInRashi, lang)

  const planets: DashamsaPlanetRow[] = []

  for (const id of CLASSICAL_ORDER) {
    const d1 = chart.grahas.find((g) => g.id === id)
    const d10 = d10ById.get(id)
    if (!d1 || !d10) continue

    const partInSign = dashamshaPart(d1.degree)
    const digpala = digpalaForPlacement(d1.rashi, d1.degree, lang)
    const d10Dispositor = SIGN_LORDS[d10.rashi]
    const base = {
      id,
      name: gName(id, lang),
      d1Rashi: d1.rashi,
      d1RashiName: rName(d1.rashi, lang),
      d1RashiShort: lang === 'hi' ? rName(d1.rashi, lang) : RASHI_SHORT[d1.rashi],
      d1Degree: d1.degree,
      d10Rashi: d10.rashi,
      d10RashiName: rName(d10.rashi, lang),
      d10RashiShort: lang === 'hi' ? rName(d10.rashi, lang) : RASHI_SHORT[d10.rashi],
      d10Degree: d10.degree,
      partInSign,
      d1House: houseOf(d1.rashi, d1Asc),
      d10House: houseOf(d10.rashi, d10Lagna),
      d1Dignity: d1.dignity,
      d10Dignity: d10.dignity,
      isVargottama: d1.rashi === d10.rashi,
      digpala,
      d10Dispositor,
      d10DispositorName: gName(d10Dispositor, lang),
      strengthScore: 0,
      theme: '',
      interpretation: '',
    }
    base.strengthScore = planetStrengthScore(base)
    const { theme, interpretation } = buildPlanetInterpretation(base as DashamsaPlanetRow, planetThemes, lang)
    planets.push({ ...base, theme, interpretation })
  }

  const houses: DashamsaHouseRow[] = []
  for (let h = 1; h <= 12; h++) {
    const rashi = wholeSignHouseSign(d10Lagna, h)
    const lord = SIGN_LORDS[rashi]
    const occupants = planets
      .filter((p) => p.d10House === h)
      .map((p) => ({
        id: p.id,
        name: p.name,
        rashi: p.d10Rashi,
        rashiShort: p.d10RashiShort,
        dignity: p.d10Dignity,
        digpalaName: p.digpala.name,
        isVargottama: p.isVargottama,
      }))
    houses.push({
      house: h,
      rashi,
      rashiName: rName(rashi, lang),
      rashiShort: lang === 'hi' ? rName(rashi, lang) : RASHI_SHORT[rashi],
      lord,
      lordName: gName(lord, lang),
      theme: houseThemes[h]!,
      detail: houseDetail[h]!,
      occupants,
    })
  }

  const digpalaBuckets: DigpalaBucket[] = DIGPALA_ORDER.map((id) => {
    const digpala = localizeDigpala(DIGPALA_META[id], lang)
    const occ = planets
      .filter((p) => p.digpala.id === id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        partInSign: p.partInSign,
        d10House: p.d10House,
        d10RashiShort: p.d10RashiShort,
      }))
    return { digpala, planets: occ }
  })

  const vargottama = planets.filter((p) => p.isVargottama)
  const strongInD10 = planets.filter((p) => STRONG_DIGNITY.includes(p.d10Dignity))
  const weakInD10 = planets.filter((p) => WEAK_DIGNITY.includes(p.d10Dignity))

  const tenthLordId = SIGN_LORDS[wholeSignHouseSign(d10Lagna, 10)]
  const eleventhLordId = SIGN_LORDS[wholeSignHouseSign(d10Lagna, 11)]
  const sixthLordId = SIGN_LORDS[wholeSignHouseSign(d10Lagna, 6)]
  const lagnaLordId = SIGN_LORDS[d10Lagna]

  const tenth = planets.find((p) => p.id === tenthLordId)
  const eleventh = planets.find((p) => p.id === eleventhLordId)
  const sixth = planets.find((p) => p.id === sixthLordId)
  const lagnaLord = planets.find((p) => p.id === lagnaLordId)

  const T = pick(D10_TEXT_EN as Record<string, string>, D10_TEXT_HI as Record<string, string>, lang)
  const toKeyLord = (
    role: string,
    id: GrahaId,
    row: DashamsaPlanetRow | undefined,
    house: number,
  ): DashamsaKeyLord => ({
    role,
    id,
    name: gName(id, lang),
    d10Rashi: row?.d10Rashi ?? d10Lagna,
    d10RashiName: row?.d10RashiName ?? rName(d10Lagna, lang),
    d10House: row?.d10House ?? 1,
    d10Dignity: row?.d10Dignity ?? ('neutral' as Dignity),
    digpala: row?.digpala ?? localizeDigpala(DIGPALA_META.indra, lang),
    digpalaName: row?.digpala.name ?? '—',
    isVargottama: row?.isVargottama ?? false,
    note: keyLordNote(role, row, house, houseThemes, lang),
    predictionNote: keyLordPrediction(role, row, lang),
  })

  const keyLords: DashamsaKeyLord[] = [
    toKeyLord(T.roleLagna, lagnaLordId, lagnaLord, 1),
    toKeyLord(T.roleTenth, tenthLordId, tenth, 10),
    toKeyLord(T.roleEleventh, eleventhLordId, eleventh, 11),
    toKeyLord(T.roleSixth, sixthLordId, sixth, 6),
  ]

  const direction = buildDirection(lagnaDigpalaResolved, planets, tenth, lang)
  const profession = buildProfession(lagnaDigpalaResolved, tenth, eleventh, digpalaBuckets, lang)
  const ethics = buildEthics(houses, planets, d10Lagna, houseDetail, lang)
  const fame = buildFame(planets, eleventh, tenth, lang)
  const advanced = buildAdvanced(lagnaDigpalaResolved, tenth, eleventh, sixth, houses[8]!, lagnaLord, lang)

  const insights: DashamsaInsight[] = []
  insights.push({
    kind: 'info',
    title: lang === 'hi' ? 'दशमांश लग्न' : 'Dashamsha lagna',
    text: lang === 'hi'
      ? `${rName(d10Lagna, lang)} आजीविका की नींव तय करता है। ${lagnaThemes[d10Lagna]}`
      : `${RASHI_NAMES[d10Lagna]} (${RASHI_SANSKRIT[d10Lagna]}) sets ājīvikā foundation. ${lagnaThemes[d10Lagna]}`,
  })
  insights.push({
    kind: direction.foreignTheme ? 'highlight' : 'info',
    title: lang === 'hi'
      ? `लग्न दिग्पाल · ${lagnaDigpalaResolved.name}`
      : `Lagna Digpala · ${lagnaDigpalaResolved.name}`,
    text: advanced.lagnaDigpalaReading,
  })
  if (tenth) {
    insights.push({
      kind: tenth.digpala.id === 'brahma' || tenth.digpala.id === 'ananta' ? 'highlight' : 'strength',
      title: lang === 'hi'
        ? `दशमेश दिग्पाल · ${tenth.digpala.name}`
        : `10th lord Digpala · ${tenth.digpala.name}`,
      text: advanced.tenthLordDigpalaReading,
    })
  }
  if (eleventh) {
    insights.push({
      kind: 'highlight',
      title: lang === 'hi' ? 'एकादशेश · पुरस्कार एवं मान्यता समय' : '11th lord · awards & recognition timing',
      text: advanced.eleventhLordReading,
    })
  }
  insights.push({
    kind: 'info',
    title: lang === 'hi' ? 'सृजन बनाम यश' : 'Creation vs fame',
    text: advanced.creationVsFame,
  })
  insights.push({
    kind: ethics.tone === 'challenging' ? 'caution' : 'info',
    title: ethics.headline,
    text: ethics.text,
  })
  insights.push({
    kind: fame.scale === 'worldwide' || fame.scale === 'wide' ? 'strength' : 'info',
    title: fame.headline,
    text: fame.text,
  })
  if (vargottama.length) {
    insights.push({
      kind: 'strength',
      title: T.insightVgTitle,
      text: fill(T.insightVgText, { names: vargottama.map((p) => p.name).join(', ') }),
    })
  }
  if (weakInD10.length) {
    insights.push({
      kind: 'caution',
      title: T.insightWeakTitle,
      text: fill(T.insightWeakText, { names: weakInD10.map((p) => p.name).join(', ') }),
    })
  }

  const dashaOverlay = buildDashaOverlay(chart, planets, tenthLordId, eleventhLordId, lang)
  if (dashaOverlay) {
    insights.push({
      kind: 'info',
      title: T.insightDashaTitle,
      text: dashaOverlay.careerWindow,
    })
    insights.push({
      kind: 'highlight',
      title: T.insightFameTitle,
      text: dashaOverlay.fameWindow,
    })
  }

  const summaryParts = lang === 'hi'
    ? [
      `D10 लग्न ${rName(d10Lagna, lang)}`,
      `दिग्पाल ${lagnaDigpalaResolved.name}`,
      `दशमेश ${gName(tenthLordId, lang)}→${tenth?.digpala.name ?? '—'}`,
      `एकादशेश ${gName(eleventhLordId, lang)}`,
    ]
    : [
      `D10 Lagna ${RASHI_NAMES[d10Lagna]}`,
      `Digpala ${lagnaDigpalaResolved.name}`,
      `10L ${GRAHA_NAMES[tenthLordId]}→${tenth?.digpala.name ?? '—'}`,
      `11L ${GRAHA_NAMES[eleventhLordId]}`,
    ]
  if (dashaOverlay) {
    summaryParts.push(lang === 'hi' ? `दशा ${dashaOverlay.pathLabel}` : `Dasha ${dashaOverlay.pathLabel}`)
  }

  return {
    d10Lagna,
    d10LagnaName: rName(d10Lagna, lang),
    d10LagnaSanskrit: lang === 'hi' ? rName(d10Lagna, lang) : RASHI_SANSKRIT[d10Lagna],
    d10LagnaTheme: lagnaThemes[d10Lagna]!,
    lagnaVargottama: d1Asc === d10Lagna,
    lagnaDigpala: lagnaDigpalaResolved,
    planets,
    houses,
    digpalaBuckets,
    vargottama,
    strongInD10,
    weakInD10,
    keyLords,
    insights,
    dashaOverlay,
    direction,
    profession,
    ethics,
    fame,
    advanced,
    summary: summaryParts.join(' · '),
    purpose: lang === 'hi' ? (D10_PURPOSE_HI as unknown as typeof D10_PURPOSE) : D10_PURPOSE,
  }
}
