// ─────────────────────────────────────────────────────────────
//  src/lib/engine/aiPromptTopics.ts
//  Topic "studies" for the AI prompt: career, love, marriage, wealth,
//  health, education, children, spirituality. Each study gives the AI
//  (1) the classical method to follow, (2) the chart data that method
//  needs, already extracted (houses, lords, aspects, karakas, vargas,
//  dasha activation), and (3) for Gold+, Vedaansh's own engine readings.
//
//  Pure: no React / DB / Redis. Only engines that are already used by
//  client panels (no Swiss Ephemeris).
// ─────────────────────────────────────────────────────────────

import {
  RASHI_NAMES,
  type ChartOutput,
  type DashaNode,
  type GrahaData,
  type GrahaId,
  type Rashi,
  type UserPlan,
} from '@/types/astrology'
import type { EngineLang } from '@/lib/engine/lang'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { CLASSICAL, DRISHTI_NOTE, RASHI_LORD, aspectersOf, conjunctWith, aspectsSign, day, gname, houseFrom, shadbalaRupas, signOfHouse, table } from '@/lib/engine/aiPromptFormat'
import { analyzeCareerProfession } from '@/lib/engine/careerProfession'
import { analyzeCareerMethod } from '@/lib/engine/careerMethod'
import { analyzeCareerChange } from '@/lib/engine/careerChange'
import { analyzeMarriedLife } from '@/lib/engine/marriedLifeAnalysis'
import { analyzeClassicalMarriage } from '@/lib/engine/classicalMarriage'
import { analyzeMarriageHouses } from '@/lib/engine/marriageHouses'
import { analyzeSeventhLord } from '@/lib/engine/seventhLord'
import { analyzeSeventhAxis } from '@/lib/engine/seventhAxis'
import { analyzeMarriageClass } from '@/lib/engine/marriageClass'
import { analyzeMarriageVivah } from '@/lib/engine/marriageVivah'
import { analyzeMarriageMars } from '@/lib/engine/marriageMars'
import { analyzeMarriageKarma } from '@/lib/engine/marriageKarma'
import { analyzeJaiminiMarriage } from '@/lib/engine/jaiminiMarriageAnalysis'
import { analyzeKarmicDebt } from '@/lib/engine/karmicDebt'
import { analyzeDivorceEnergy } from '@/lib/engine/divorceEnergy'
import { analyzeMarriageCaseBrief } from '@/lib/engine/marriageCaseBrief'
import { analyzePartnerNature } from '@/lib/engine/partnerNature'
import { analyzeVenusMarriage } from '@/lib/engine/venusMarriage'
import { analyzeVenusJupiterBond } from '@/lib/engine/venusJupiterBond'
import { analyzeIntimateLife } from '@/lib/engine/intimateLife'
import { analyzeChaturthamsa } from '@/lib/engine/chaturthamsaAnalysis'
import { getLagnaSpiritualProfile } from '@/lib/engine/lagnaSpirituality'
import { getLagnaCharacterProfile } from '@/lib/engine/lagnaCharacter'
import { buildLagnaCheatSheet } from '@/lib/engine/lagnaCheatSheet'
import { getNakshatraTeaching } from '@/lib/engine/nakshatraTeaching'
import { lkAgeYears, lkCycleAt, lkYearOfLife, readLalKitab } from '@/lib/engine/lalKitab'
import {
  analyzeVastuZones, dashaVastuFocus, digBalaBand, digBalaShash, doshaIndication, lagnaDirection,
  DIG_BALA_DIRECTION, VASTU_ZONES_8,
} from '@/lib/engine/astroVastu'

export const AI_TOPICS = ['personality', 'career', 'love', 'marriage', 'wealth', 'health', 'education', 'children', 'spirituality', 'lalKitab', 'vastu'] as const
export type AiTopic = (typeof AI_TOPICS)[number]

interface EngineReading {
  title: string
  run: (chart: ChartOutput, lang: EngineLang, now: Date) => unknown
}

interface TopicDef {
  title: string
  /** Houses that carry the topic, most important first. */
  houses: number[]
  /** Natural significators. */
  karakas: GrahaId[]
  /** Jaimini chara karakas to read (by role). */
  charaKarakas?: string[]
  /** Divisional charts to examine, most important first. */
  vargas: string[]
  /** Classical method for the AI, as numbered steps. */
  method: string[]
  questions: string[]
  readings?: EngineReading[]
  /** Extra computed data block specific to this topic. */
  extra?: (chart: ChartOutput) => string
}

const TOPICS: Record<AiTopic, TopicDef> = {
  personality: {
    title: 'Personality and mind',
    houses: [1, 4, 5, 3, 9, 10],
    karakas: ['Mo', 'Su', 'Me', 'Ju', 'Ma'],
    charaKarakas: ['AK'],
    vargas: ['D9'],
    method: [
      'Lagna (body and temperament): its sign, element and modality, the Lagna nakshatra, planets in the Lagna and planets aspecting it. The Lagna lord\'s house, dignity and strength show where the person puts their life energy.',
      'Moon (manas, the mind): its sign, nakshatra and pada, house, waxing or waning state (paksha bala), Shadbala, conjunctions and aspects. A strong, waxing, well-aspected Moon gives a steady mind; Saturn, Rahu or Ketu with the Moon colour the mind with worry, intensity or detachment. Use the Moon data and Kemadruma check below.',
      'Sun (atma, ego and confidence), Mercury (thinking and speaking style), Jupiter (values, faith, wisdom), Mars (drive, courage, anger), Venus (taste, affection, pleasure), Saturn (fears, discipline, endurance): read each from its dignity, house and Shadbala in rupas.',
      'The 4th house shows emotional security and the heart, the 5th intelligence and creativity, the 3rd courage and initiative, the 9th beliefs, the 10th how they act in the world.',
      'Jaimini: the Atmakaraka (AK) shows the soul\'s core desire and lesson. Compare the Lagna (the real self) with the Arudha Lagna (AL, how others see them).',
      'Balance: use the element, modality and guna counts below for the overall temperament (for example mostly fire = energetic and direct; mostly fixed = steady but stubborn; mostly tamasic emphasis = heavier, needs discipline).',
      'Navamsha (D9) Lagna and the Moon in D9 show the inner nature that matures with age, especially after marriage and the early 30s.',
      'Describe strengths, blind spots, emotional patterns, how they handle stress and conflict, how they think and decide, and how they relate to others. Show how the mind shifts in the Moon\'s and the Lagna lord\'s dashas.',
      'This is a reflective personality reading, not psychology: do not diagnose mental health conditions. If something sounds like real distress, suggest talking to a qualified professional.',
    ],
    questions: [
      'What is my core personality, and what drives me?',
      'How does my mind work: how do I think, feel and decide?',
      'What are my emotional patterns, and how do I handle stress?',
      'What are my main strengths and blind spots?',
      'How do others see me compared with who I really am (Lagna vs Arudha Lagna)?',
    ],
    extra: mindData,
    readings: [
      { title: 'Lagna character profile', run: (c, l) => getLagnaCharacterProfile(c.lagnas.ascRashi, l) },
      { title: 'Lagna cheat sheet (functional nature of planets)', run: (c, l) => buildLagnaCheatSheet(c.lagnas.ascRashi, c.grahas, l) },
      { title: 'Moon nakshatra teaching', run: (c, l) => { const mo = c.grahas.find((g) => g.id === 'Mo'); return mo ? getNakshatraTeaching(mo.nakshatraIndex, l) : null } },
      { title: 'Lagna nakshatra teaching', run: (c, l) => getNakshatraTeaching(Math.floor((((c.lagnas.ascDegree % 360) + 360) % 360) / (360 / 27)), l) },
    ],
  },
  career: {
    title: 'Career and profession',
    houses: [10, 6, 2, 11, 1, 7],
    karakas: ['Su', 'Sa', 'Me', 'Ju'],
    charaKarakas: ['AmK', 'AK'],
    vargas: ['D10', 'D9'],
    method: [
      'Read the 10th house, its lord and occupants from the Lagna, then from the Moon and the Sun; the strongest of the three shows the dominant work theme.',
      'Judge the 10th lord: dignity, house placement, Shadbala in rupas, aspects received, and which houses it links to the 10th (2nd and 11th = income, 6th = service and competition, 7th = business and partnerships, 12th = foreign work).',
      'Use the navamsha sign of the 10th lord and the strongest planet aspecting the 10th to name the field (Parashari karmesh-navamsha method).',
      'Read the Amatyakaraka (AmK) and its sign/house in D1 and D10 as the Jaimini career pointer.',
      'Confirm in D10: its Lagna and lord, the D10 placement of the D1 10th lord, and planets in the D10 kendras and trikonas.',
      'Check SAV bindus of the 10th and 11th houses (28+ supports effort paying off) and any Raja/Dhana yogas involving the 10th lord.',
      'Time career changes with the dasha activation table below: periods of the 10th lord, AmK, planets in or aspecting the 10th, and the Sun/Saturn.',
      'Give practical directions (job vs business, sectors, timing) and say which indicators support each.',
    ],
    questions: [
      'Which careers or industries suit me best, and why?',
      'Am I better suited for a job, business, or independent profession?',
      'When are the strongest periods for promotion or a job change in the next 5 years?',
      'Is foreign work or settlement indicated for my career?',
      'Is this a good time to switch jobs or careers, and which field should I move into?',
    ],
    readings: [
      { title: 'Career and profession reading', run: (c, l, now) => analyzeCareerProfession(c, now, l) },
      { title: 'Career method (step-by-step classical analysis)', run: (c, l, now) => analyzeCareerMethod(c, now, l) },
      { title: 'Career change and switch (stability, switch/growth/caution windows, job vs business, risks)', run: (c, l, now) => analyzeCareerChange(c, now, l) },
    ],
  },
  love: {
    title: 'Love life and relationships',
    houses: [5, 7, 11, 1, 8, 12],
    karakas: ['Ve', 'Mo', 'Ma', 'Ra'],
    charaKarakas: ['DK'],
    vargas: ['D9'],
    method: [
      'The 5th house shows romance and attraction, the 7th committed partnership, the 11th fulfilment of desires, the 8th intimacy and hidden bonds, the 12th bed pleasures.',
      'Judge Venus (love and attraction), the Moon (emotional needs) and Mars (passion); note dignity, house, aspects and any affliction by Saturn, Rahu or Ketu.',
      'Check 5th–7th lord links (exchange, conjunction, mutual aspect): a classical pointer to love that leads to marriage.',
      'Read the Darakaraka (DK) and the 7th from it, and Venus and the 5th/7th lords in D9 for the deeper pattern of relationships.',
      'Describe the emotional style and needs, attraction patterns, and recurring relationship lessons, with the data behind each.',
      'Time romantic phases with the dasha activation table (Venus, Moon, 5th and 7th lords, DK, Rahu).',
    ],
    questions: [
      'What is my emotional and romantic nature?',
      'What kind of partner am I drawn to, and what kind is good for me?',
      'Is love marriage indicated in my chart?',
      'Which upcoming periods are favourable for new relationships?',
    ],
    readings: [
      { title: 'Partner nature', run: (c, l) => analyzePartnerNature(c, l) },
      { title: 'Venus and marriage', run: (c, l) => analyzeVenusMarriage(c, l) },
      { title: 'Venus–Jupiter bond', run: (c, l) => analyzeVenusJupiterBond(c, l) },
      { title: 'Intimacy and closeness', run: (c, l) => analyzeIntimateLife(c, l) },
    ],
  },
  marriage: {
    title: 'Marriage and married life',
    houses: [7, 2, 8, 4, 12, 1, 11],
    karakas: ['Ve', 'Ju', 'Mo'],
    charaKarakas: ['DK'],
    vargas: ['D9'],
    method: [
      'Promise: judge the 7th house, its lord and occupants, and Venus (and Jupiter, the traditional husband significator in a female chart). The 2nd (family) and 8th (longevity of marriage, in-laws) support the reading.',
      'Afflictions: note malefics in or aspecting the 7th/8th, Manglik placement of Mars (houses 1, 2, 4, 7, 8, 12 from Lagna, Moon and Venus) with its cancellations, and 7th lord in a dusthana (6, 8, 12).',
      'Jaimini: read the Upapada (UL = A12), the 2nd from UL, and the Darakaraka (DK) for the nature and sustenance of marriage.',
      'Navamsha (D9): its Lagna, 7th house and lord, Venus and the D9 placement of the D1 7th lord. A planet in the same sign in D1 and D9 (vargottama) gives firm results.',
      'Spouse: describe likely nature, background and the direction or distance of the spouse from the 7th lord, DK and planets in the 7th.',
      'Timing: use the dasha activation table (7th lord, Venus, DK, planets in the 7th, lord of the sign holding UL) together with the age range the chart suggests; say if early or delayed marriage is indicated.',
      'Married life: harmony, children link (5th), and points that need care, with traditional remedies where weak.',
    ],
    questions: [
      'When is marriage most likely, and which dasha periods support it?',
      'What will my spouse be like (nature, profession, background)?',
      'Is there Manglik dosha, and is it cancelled?',
      'How will my married life be, and what should I take care of?',
    ],
    readings: [
      { title: 'Marriage case brief', run: (c, l) => analyzeMarriageCaseBrief(c, { skipGocharScan: true, lang: l }) },
      { title: 'Married life overview', run: (c, l) => analyzeMarriedLife(c, l) },
      { title: 'Classical marriage rules', run: (c, l) => analyzeClassicalMarriage(c, l) },
      { title: 'Marriage houses (2, 4, 7, 8, 12)', run: (c, l) => analyzeMarriageHouses(c, l) },
      { title: '7th lord', run: (c, l) => analyzeSeventhLord(c, l) },
      { title: '7th house axis', run: (c, l) => analyzeSeventhAxis(c, l) },
      { title: 'Marriage class and type', run: (c, l) => analyzeMarriageClass(c, l) },
      { title: 'Vivah (timing and promise)', run: (c, l) => analyzeMarriageVivah(c, l) },
      { title: 'Mars and Manglik', run: (c, l, now) => analyzeMarriageMars(c, { now }, l) },
      { title: 'Marriage karma', run: (c, l) => analyzeMarriageKarma(c, l) },
      { title: 'Jaimini marriage (UL, DK)', run: (c, l) => analyzeJaiminiMarriage(c, l) },
      { title: 'Karmic debt', run: (c, l) => analyzeKarmicDebt(c, l) },
      { title: 'Separation pressure', run: (c, l) => analyzeDivorceEnergy(c, l) },
    ],
  },
  wealth: {
    title: 'Wealth and finance',
    houses: [2, 11, 5, 9, 1, 10, 8],
    karakas: ['Ju', 'Ve', 'Me'],
    vargas: ['D2', 'D4', 'D9'],
    method: [
      'The 2nd house is accumulated wealth, the 11th gains and income, the 5th and 9th fortune and speculation, the 8th sudden or inherited money, the 12th expenses.',
      'Find Dhana yogas: links (conjunction, exchange, mutual aspect) between lords of 1, 2, 5, 9 and 11; Lakshmi and Raja yogas from the yoga list.',
      'Read the Indu Lagna (the wealth lagna) and planets in it and in the 11th from it; the Hora Lagna and Sri Lagna support the reading.',
      'Jaimini: the 2nd and 11th from the Arudha Lagna (AL) show visible wealth and gains; A11 shows how gains come.',
      'Compare SAV bindus of the 11th vs the 12th house (11th > 12th suggests income exceeds expense).',
      'Confirm in D2 (Hora): planets in the Sun hora vs Moon hora; and D4 for property and fixed assets.',
      'Time financial growth with the dasha activation table (2nd/11th lords, Jupiter, Dhana yoga planets).',
      'Do not give investment advice; speak in terms of tendencies and timing.',
    ],
    questions: [
      'What are my main sources of income and wealth?',
      'Which periods are strongest for financial growth?',
      'Is property or inheritance indicated?',
      'What spending or loss patterns should I watch for?',
    ],
    readings: [
      { title: 'Chaturthamsha (D4: property and fortune)', run: (c, l) => analyzeChaturthamsa(c, l) },
    ],
  },
  health: {
    title: 'Health and vitality',
    houses: [1, 6, 8, 12, 3],
    karakas: ['Su', 'Mo', 'Sa', 'Ma'],
    vargas: ['D30', 'D9', 'D3'],
    method: [
      'The Lagna and its lord show constitution and vitality; the Sun shows vital force and the Moon the mind and fluids.',
      'The 6th house shows illness and recovery, the 8th chronic or hidden conditions, the 12th hospitalisation; note planets and lords there and their strength.',
      'Relate signs and planets to body parts and Ayurvedic doshas (Vata: Saturn, Mercury, Rahu; Pitta: Sun, Mars, Ketu; Kapha: Moon, Venus, Jupiter).',
      'Note planets flagged as Mrityu bhaga or Gandanta, and weak Shadbala planets, as areas to look after.',
      'Use D30 (Trimshamsha) for vulnerabilities and D3 for general wellbeing.',
      'Time periods needing care with the dasha activation table (6th/8th lords and malefics linked to the Lagna).',
      'IMPORTANT: this is traditional reflection, not diagnosis. Always advise seeing a qualified doctor for any health concern, and never predict death or a specific disease.',
    ],
    questions: [
      'What is my general constitution (Ayurvedic dosha tendency)?',
      'Which areas of health should I look after?',
      'Which periods ask for more care, and what lifestyle habits suit my chart?',
    ],
  },
  education: {
    title: 'Education and learning',
    houses: [4, 5, 2, 9, 3],
    karakas: ['Me', 'Ju'],
    vargas: ['D24', 'D9'],
    method: [
      'The 4th house shows formal schooling, the 5th intelligence and degrees, the 9th higher learning, the 2nd early education and speech.',
      'Judge Mercury (intellect, analysis) and Jupiter (wisdom, teachers): dignity, house, aspects and Shadbala.',
      'Link the 4th/5th/9th lords with the 10th to suggest subjects that lead to a career.',
      'Confirm in D24 (Siddhamsha): its Lagna, the D24 placement of the D1 4th, 5th and 9th lords, and Mercury and Jupiter there.',
      'Time studies, exams and higher education with the dasha activation table.',
    ],
    questions: [
      'Which subjects or fields of study suit me?',
      'Is higher education or study abroad indicated?',
      'When are good periods for exams and further study?',
    ],
  },
  children: {
    title: 'Children and progeny',
    houses: [5, 9, 11, 2],
    karakas: ['Ju'],
    vargas: ['D7', 'D9'],
    method: [
      'The 5th house, its lord and occupants show children; the 9th (5th from 5th) supports; Jupiter is the karaka.',
      'Read the 5th house and Jupiter from the Lagna and from the Moon; note malefics or nodes affecting the 5th and their cancellations.',
      'Count SAV bindus of the 5th house and Jupiter\'s own Ashtakavarga bindus in the 5th.',
      'Confirm in D7 (Saptamsha): its Lagna, 5th house and lord, Jupiter and the D7 placement of the D1 5th lord.',
      'Jaimini: A5 (Mantra pada) and the Putrakaraka role of Jupiter.',
      'Time childbirth with the dasha activation table (5th/9th lords, Jupiter). Be gentle and never predict infertility; suggest medical advice where relevant.',
    ],
    questions: [
      'What does my chart say about children?',
      'Which periods are favourable for having a child?',
      'What will my relationship with my children be like?',
    ],
  },
  spirituality: {
    title: 'Spirituality and inner path',
    houses: [9, 12, 5, 8, 4, 1],
    karakas: ['Ke', 'Ju', 'Sa', 'Mo'],
    charaKarakas: ['AK'],
    vargas: ['D20', 'D9', 'D60'],
    method: [
      'The 9th house shows dharma and the guru, the 12th moksha and letting go, the 5th mantra and devotion, the 8th occult and transformation, the 4th inner peace.',
      'Atmakaraka (AK) is the soul\'s desire; its navamsha sign is the Karakamsha. Planets in the Karakamsha and the 12th from it show the spiritual path and ishta devata (Jaimini).',
      'Ketu shows detachment and past-life mastery; Jupiter wisdom; Saturn renunciation and discipline.',
      'Note Pravrajya/sannyasa-type combinations (4+ planets in one sign including a strong 10th lord) and moksha-trikona (4, 8, 12) emphasis.',
      'Confirm in D20 (Vimshamsha) for practice and in D60 for past karma.',
      'Suggest suitable practices (mantra, meditation, seva, pilgrimage) and the periods when inner work deepens.',
    ],
    questions: [
      'What is my spiritual path and which practice suits me?',
      'What does my Atmakaraka and Karakamsha say about my soul\'s purpose?',
      'Who could be my ishta devata according to Jaimini?',
    ],
    readings: [
      { title: 'Lagna spiritual profile', run: (c, l) => getLagnaSpiritualProfile(c.lagnas.ascRashi, l) },
    ],
  },
  lalKitab: {
    title: 'Lal Kitab',
    houses: [1, 4, 7, 10, 2, 8, 11, 12],
    karakas: ['Ju', 'Sa', 'Ma', 'Ra', 'Ke'],
    vargas: ['D1'],
    method: [
      'Build the Lal Kitab Teva: keep each planet in its house from the Lagna, then drop signs so house 1 is always Aries.',
      'Note pakka ghar (permanent house), uchcha/neech by house, sleeping houses and planets, kayam and dharmi states.',
      'Read aspects one way forward (full 1→7 / 4→10, half 3→9 / 3→11 / 5→9, quarter 2→6 / 6→12) and takkar (8th ahead).',
      'Check doshas (grahan, Mangal badh, Manglik, Guru chandal) and rin (karmic debts) from the Teva facts.',
      'Year of life = completed age + 1. Find the 35-year cycle planet and the Varshphal house remap for that year.',
      'Give remedies only for planets that need them (hard or mixed). One remedy per planet; respect prohibitions. Remedies are traditional practices, not medical or legal advice.',
    ],
    questions: [
      'What does my Lal Kitab Teva say about the strongest good and hard placements?',
      'Which debts or doshas show in this chart, and what traditional remedies fit?',
      'What does this year of life (Varshphal) highlight?',
    ],
    extra: lalKitabData,
  },
  vastu: {
    title: 'Vastu (home and property)',
    houses: [4, 1, 2, 9, 11, 12],
    karakas: ['Ma', 'Mo', 'Ve', 'Sa', 'Ju'],
    vargas: ['D4', 'D9'],
    method: [
      'Use the Astro-Vastu frame below: houses map to directions from the Lagna (1st = East, 4th = North, 7th = West, 10th = South), so a planet\'s house gives its direction in the home.',
      'The 4th house, its lord and Mars (bhumi karaka) show the home and property itself; the Moon shows peace at home; Venus comforts and vehicles; Saturn old or delayed property. Confirm with the Chaturthamsha (D4).',
      'Read each zone score: its ruling planet\'s dignity and Dig Bala, and any malefic sitting in the light north-east quadrant. Strong zones are where to work, keep valuables and spend time; weak zones need clearing and remedies first.',
      'Dig Bala in shashtiamsa (0–60) tells which directions each planet supports. Name the directions of the strongest and weakest planets.',
      'Use the running dasha focus: the Mahadasha and Antardasha lords point to their zones. Say what to activate or balance now and what changes in the next periods.',
      'Ask the user for what the chart cannot show: main-door direction, where the kitchen, master bedroom, toilets, pooja room, staircase and water tank sit, and the plot size. Then judge each placement against classical rules (kitchen SE, master bedroom SW, pooja NE, toilets NW/W, no toilet, kitchen or staircase in NE or the centre).',
      'Keep remedies practical and gentle (decluttering, light, colour, element objects, placement changes, the zone planet\'s mantra). Do not advise demolition or major construction without an on-site Vastu consultant, and do not promise outcomes.',
    ],
    questions: [
      'Which directions of my home are strongest and weakest for me, and why?',
      'Which direction should my main door, bedroom and work desk face?',
      'What should I focus on in my home during my current dasha?',
      'Which simple Vastu remedies fit my chart?',
    ],
    extra: vastuData,
  },
}

const ZONE_DOSHAS: { zone: string; name: string }[] = [
  { zone: 'NE', name: 'Ishan (NE) dosha' },
  { zone: 'SE', name: 'Agni (SE) dosha' },
  { zone: 'SW', name: 'Nairiti (SW) dosha' },
  { zone: 'NW', name: 'Vayu (NW) dosha' },
]

function vastuData(chart: ChartOutput): string {
  const asc = chart.lagnas.ascRashi as number
  const zones = analyzeVastuZones(chart.grahas, asc, VASTU_ZONES_8, chart.shadbala)
  const sorted = [...zones].sort((a, b) => b.score - a.score)
  const zoneLines = VASTU_ZONES_8.map((z, i) => {
    const s = zones[i]
    const occ = s.occupantIds.length ? s.occupantIds.join(', ') : 'none'
    return `- ${z.id} (ruler ${z.ruling}${z.coRuling ? ` + ${z.coRuling}` : ''}): ${s.score}% · planets here: ${occ}`
  })
  const digLines = Object.entries(DIG_BALA_DIRECTION).map(([id, dir]) => {
    const v = digBalaShash(chart.shadbala, id)
    return `- ${id}: ${v === undefined ? 'n/a' : v.toFixed(1)} / 60 (${digBalaBand(v)}; full strength facing ${dir})`
  })
  const doshaLines = ZONE_DOSHAS.map(d => `- ${d.name}: ${doshaIndication(d.zone, zones) === 'indicated' ? 'indicated by the chart' : 'not indicated'}`)
  const focus = dashaVastuFocus(chart.dashas?.vimshottari, zones)
  const day = (d: Date) => d.toISOString().slice(0, 10)
  const focusLines = focus
    ? [
        `- Mahadasha ${focus.maha.lord} → ${focus.maha.zone} (${focus.maha.zoneScore}%, ${focus.maha.action}) until ${day(focus.maha.end)}`,
        ...(focus.antar ? [`- Antardasha ${focus.antar.lord} → ${focus.antar.zone} (${focus.antar.zoneScore}%, ${focus.antar.action}) until ${day(focus.antar.end)}`] : []),
        ...focus.upcoming.map(u => `- Next: ${u.lord} → ${u.zone} (${u.zoneScore}%, ${u.action}) ${day(u.start)} to ${day(u.end)}`),
      ]
    : ['- Not available']
  return [
    '**Astro-Vastu zones (Lagna frame: 1st = East, 4th = North, 7th = West, 10th = South)**',
    ...zoneLines,
    `Strongest: ${sorted[0].id} (${sorted[0].score}%). Weakest: ${sorted[sorted.length - 1].id} (${sorted[sorted.length - 1].score}%).`,
    `Main door favoured by the Lagna sign: ${lagnaDirection(asc)}.`,
    '',
    '**Dig Bala (directional strength, shashtiamsa)**',
    ...digLines,
    '',
    '**Zone doshas from the chart**',
    ...doshaLines,
    '',
    '**Dasha focus (Vimshottari lord → zone)**',
    ...focusLines,
  ].join('\n')
}

function lalKitabData(chart: ChartOutput): string {
  const age = lkAgeYears(chart.meta?.birthDate ?? '')
  const year = lkYearOfLife(age)
  const cycle = lkCycleAt(year)
  const r = readLalKitab(chart, { lang: 'en', ageYears: age })
  const houses = LK_HOUSES_INLINE(r)
  const findings = r.findings.slice(0, 10).map((f) => `- [${f.effect}] ${f.label}: ${f.text}`).join('\n')
  const remedies = r.remedies.top.slice(0, 5).map((c) => `- ${c.planet}: ${c.upay.text}`).join('\n')
  const doshaRin = r.findings
    .filter((f) => f.id.startsWith('dosha.') || f.id.startsWith('rin.'))
    .slice(0, 8)
    .map((f) => `- ${f.label}: ${f.text}`)
    .join('\n')
  return [
    '**Lal Kitab Teva (house 1 = Aries)**',
    '',
    houses,
    '',
    `**States:** chart types ${r.states.chartTypes.join(', ') || 'ordinary'}; kayam ${r.states.kayam.join(', ') || 'none'}; dharmi ${r.states.dharmi.join(', ') || 'none'}; sleeping planets ${r.states.sleepingPlanets.join(', ') || 'none'}`,
    `**Year of life ${year}** (age ${age}): cycle planet ${cycle.planet} (year ${cycle.yearInSpan} of ${cycle.spanYears}, next ${cycle.next})`,
    '',
    '**Top findings**',
    findings || '- none',
    '',
    '**Doshas and debts**',
    doshaRin || '- none flagged',
    '',
    '**Top remedies (traditional; not medical or legal advice)**',
    remedies || '- none needed',
  ].join('\n')
}

function LK_HOUSES_INLINE(r: ReturnType<typeof readLalKitab>): string {
  return table(
    ['Planet', 'House', 'Dignity', 'State'],
    r.planets.map((p) => [
      gname(p.id),
      p.house,
      p.dignities.join(', ') || '—',
      [p.kayam ? 'kayam' : '', p.dharmi ? 'dharmi' : '', p.sleeping ? 'asleep' : ''].filter(Boolean).join(', ') || '—',
    ]),
  )
}

// ── chart helpers ────────────────────────────────────────────

function ordinal(n: number): string {
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`
}

function grahaById(chart: ChartOutput, id: GrahaId): GrahaData | undefined {
  return chart.grahas.find((g) => g.id === id)
}

function shadbalaOf(chart: ChartOutput, id: GrahaId): string {
  return shadbalaRupas(chart.shadbala?.planets?.[id])
}

function charaKarakaGraha(chart: ChartOutput, role: string): GrahaId | null {
  const v = chart.karakas?.[role]
  return typeof v === 'string' ? (v as GrahaId) : null
}

const ROLE_NAMES: Record<string, string> = {
  AK: 'Atmakaraka', AmK: 'Amatyakaraka', DK: 'Darakaraka', PK: 'Pitrikaraka', PiK: 'Putrikaraka', MK: 'Matrikaraka', BK: 'Bhratrikaraka', GK: 'Gnatikaraka',
}

function houseTable(chart: ChartOutput, houses: number[], compact = false): string {
  const asc = chart.lagnas.ascRashi
  const sav = chart.ashtakavarga?.sav
  const rows = houses.map((h) => {
    const sign = signOfHouse(asc, h)
    const lord = RASHI_LORD[sign]
    const lordG = grahaById(chart, lord)
    const occupants = chart.grahas.filter((g) => CLASSICAL.includes(g.id) && g.rashi === sign).map((g) => gname(g.id)).join(', ') || '—'
    const aspecting = aspectersOf(chart.grahas, sign).map((g) => gname(g.id)).join(', ') || '—'
    const lordAspecters = lordG ? aspectersOf(chart.grahas, lordG.rashi, lord).map((g) => gname(g.id)).join(', ') || '—' : '—'
    return [
      h,
      RASHI_NAMES[sign],
      gname(lord),
      lordG ? `H${houseFrom(asc, lordG.rashi)} ${RASHI_NAMES[lordG.rashi]}, ${lordG.dignity}${lordG.isRetro ? ', R' : ''}${lordG.isCombust ? ', combust' : ''}` : '—',
      shadbalaOf(chart, lord),
      lordAspecters,
      occupants,
      aspecting,
      sav?.[sign - 1] ?? '—',
    ]
  })
  const t = table(['House', 'Sign', 'Lord', 'Lord placed (house, sign, dignity)', 'Lord Shadbala (rupas)', 'Lord aspected by', 'Occupants', 'House aspected by', 'SAV'], rows)
  return compact ? t : [t, '', `_${DRISHTI_NOTE}_`].join('\n')
}

function karakaTable(chart: ChartOutput, ids: GrahaId[], roles: string[] = []): string {
  const asc = chart.lagnas.ascRashi
  const d9 = chart.vargas?.D9
  const rows: unknown[][] = []
  const seen = new Set<string>()
  const add = (id: GrahaId, label: string) => {
    const g = grahaById(chart, id)
    if (!g) return
    seen.add(label)
    const nav = d9?.find((x) => x.id === id)
    rows.push([
      label,
      `${RASHI_NAMES[g.rashi]} H${houseFrom(asc, g.rashi)}`,
      g.dignity,
      `${g.nakshatraName} ${g.pada}`,
      nav ? `${RASHI_NAMES[nav.rashi]}${nav.rashi === g.rashi ? ' (vargottama)' : ''}` : '—',
      shadbalaOf(chart, id),
      aspectersOf(chart.grahas, g.rashi, id).map((x) => gname(x.id)).join(', ') || '—',
    ])
  }
  for (const id of ids) add(id, gname(id))
  for (const role of roles) {
    const id = charaKarakaGraha(chart, role)
    if (id) add(id, `${ROLE_NAMES[role] ?? role} (${role}) = ${gname(id)}`)
  }
  return table(['Significator', 'Sign & house', 'Dignity', 'Nakshatra', 'Navamsha sign', 'Shadbala (rupas)', 'Aspected by'], rows)
}

function vargaFocus(chart: ChartOutput, key: string, topicHouses: number[]): string {
  const vg = chart.vargas?.[key]
  const vl = chart.vargaLagnas?.[key] as Rashi | undefined
  if (!vg?.length || !vl) return `- **${key}:** not included on this plan or chart.`
  const asc = chart.lagnas.ascRashi
  const placed = vg
    .filter((g) => CLASSICAL.includes(g.id))
    .map((g) => `${gname(g.id)} ${RASHI_NAMES[g.rashi]} H${houseFrom(vl, g.rashi)}${g.dignity && g.dignity !== 'neutral' ? ` (${g.dignity})` : ''}`)
    .join(', ')
  const lordLines = topicHouses.slice(0, 3).map((h) => {
    const lord = RASHI_LORD[signOfHouse(asc, h)]
    const inV = vg.find((g) => g.id === lord)
    return inV ? `D1 ${ordinal(h)} lord ${gname(lord)} → ${key} H${houseFrom(vl, inV.rashi)} ${RASHI_NAMES[inV.rashi]} (${inV.dignity})` : null
  }).filter(Boolean)
  const vLagnaLord = RASHI_LORD[vl]
  const vLagnaLordG = vg.find((g) => g.id === vLagnaLord)
  return [
    `- **${key}** Lagna ${RASHI_NAMES[vl]} (lord ${gname(vLagnaLord)}${vLagnaLordG ? ` in ${key} H${houseFrom(vl, vLagnaLordG.rashi)}` : ''}).`,
    `  - Planets: ${placed}`,
    ...lordLines.map((l) => `  - ${l}`),
  ].join('\n')
}

/** Why a planet matters for this topic: lordship, occupation, aspect, karaka role. */
function topicLinks(chart: ChartOutput, def: TopicDef): Map<GrahaId, string[]> {
  const asc = chart.lagnas.ascRashi
  const links = new Map<GrahaId, string[]>()
  const push = (id: GrahaId, why: string) => {
    if (!links.has(id)) links.set(id, [])
    const arr = links.get(id)!
    if (!arr.includes(why)) arr.push(why)
  }
  for (const h of def.houses.slice(0, 3)) {
    const sign = signOfHouse(asc, h)
    push(RASHI_LORD[sign], `lord of H${h}`)
    for (const g of chart.grahas) {
      if (!CLASSICAL.includes(g.id)) continue
      if (g.rashi === sign) push(g.id, `in H${h}`)
      else if (aspectsSign(g, sign)) push(g.id, `aspects H${h}`)
    }
  }
  for (const k of def.karakas) push(k, 'natural karaka')
  for (const role of def.charaKarakas ?? []) {
    const id = charaKarakaGraha(chart, role)
    if (id) push(id, role)
  }
  return links
}

function activationTable(chart: ChartOutput, def: TopicDef, now: number, limit = 24): string {
  const vim = chart.dashas?.vimshottari
  if (!vim?.length) return ''
  const links = topicLinks(chart, def)
  const horizon = now + 12 * 365.25 * 86_400_000
  const ms = (v: Date | string) => new Date(v).getTime()
  const rows: unknown[][] = []
  const current = getDashaPathAt(vim, now)
  for (const md of vim) {
    if (ms(md.end) <= now || ms(md.start) >= horizon) continue
    for (const ad of md.children ?? ([] as DashaNode[])) {
      if (ms(ad.end) <= now || ms(ad.start) >= horizon) continue
      const mdWhy = links.get(md.lord as GrahaId)
      const adWhy = links.get(ad.lord as GrahaId)
      if (!mdWhy && !adWhy) continue
      const score = (mdWhy?.length ?? 0) + (adWhy?.length ?? 0)
      rows.push([
        `${gname(md.lord)}–${gname(ad.lord)}${current[1] === ad ? ' ← current' : ''}`,
        day(ad.start),
        day(ad.end),
        [mdWhy ? `MD ${gname(md.lord)}: ${mdWhy.join(', ')}` : null, adWhy ? `AD ${gname(ad.lord)}: ${adWhy.join(', ')}` : null].filter(Boolean).join('; '),
        score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low',
      ])
    }
  }
  if (!rows.length) return ''
  return [
    '**Dasha activation (Vimshottari antardashas in the next 12 years whose lords are linked to this topic)**',
    '',
    table(['Period (MD–AD)', 'Start', 'End', 'Why it is linked', 'Link strength'], rows.slice(0, limit)),
  ].join('\n')
}

// ── personality and mind data ────────────────────────────────

const ELEMENT: Record<Rashi, string> = { 1: 'Fire', 2: 'Earth', 3: 'Air', 4: 'Water', 5: 'Fire', 6: 'Earth', 7: 'Air', 8: 'Water', 9: 'Fire', 10: 'Earth', 11: 'Air', 12: 'Water' }
const MODALITY: Record<Rashi, string> = { 1: 'Movable', 2: 'Fixed', 3: 'Dual', 4: 'Movable', 5: 'Fixed', 6: 'Dual', 7: 'Movable', 8: 'Fixed', 9: 'Dual', 10: 'Movable', 11: 'Fixed', 12: 'Dual' }
/** BPHS: Sun, Moon, Jupiter sattvic; Mercury, Venus rajasic; Mars, Saturn tamasic (nodes treated as tamasic). */
const GUNA: Partial<Record<GrahaId, string>> = { Su: 'Sattva', Mo: 'Sattva', Ju: 'Sattva', Me: 'Rajas', Ve: 'Rajas', Ma: 'Tamas', Sa: 'Tamas', Ra: 'Tamas', Ke: 'Tamas' }
const NAKSHATRA_SPAN = 360 / 27
const NAK_LORDS: GrahaId[] = ['Ke', 'Ve', 'Su', 'Mo', 'Ma', 'Ra', 'Ju', 'Sa', 'Me']

function tally(items: string[]): string {
  const counts = new Map<string, number>()
  for (const i of items) counts.set(i, (counts.get(i) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ')
}

function mindData(chart: ChartOutput): string {
  const asc = chart.lagnas.ascRashi
  const grahas = chart.grahas.filter((g) => CLASSICAL.includes(g.id))
  const mo = grahas.find((g) => g.id === 'Mo')
  const su = grahas.find((g) => g.id === 'Su')
  const out: string[] = ['### Mind and temperament data']

  // Lagna
  const ascNak = Math.floor((((chart.lagnas.ascDegree % 360) + 360) % 360) / NAKSHATRA_SPAN)
  const inLagna = grahas.filter((g) => g.rashi === asc).map((g) => gname(g.id)).join(', ') || 'none'
  out.push('', `- **Lagna:** ${RASHI_NAMES[asc]} (${ELEMENT[asc]}, ${MODALITY[asc]}), nakshatra lord ${gname(NAK_LORDS[ascNak % 9])}; planets in Lagna: ${inLagna}; Lagna aspected by: ${aspectersOf(chart.grahas, asc).map((g) => gname(g.id)).join(', ') || 'none'}.`)
  const al = chart.arudhas?.AL
  if (al) out.push(`- **Arudha Lagna (public image):** ${RASHI_NAMES[al]} (H${houseFrom(asc, al)} from Lagna, ${ELEMENT[al]}).`)

  // Moon
  if (mo) {
    const elong = su ? (((mo.lonSidereal - su.lonSidereal) % 360) + 360) % 360 : null
    const waxing = mo.isWaxingMoon ?? (elong != null ? elong < 180 : undefined)
    const fromFull = elong != null ? Math.abs(180 - elong) : null
    const conj = conjunctWith(chart.grahas, mo).map((g) => gname(g.id))
    const asp = aspectersOf(chart.grahas, mo.rashi, 'Mo').map((g) => gname(g.id))
    const touches = new Set([...conj, ...asp])
    const afflictions = [
      touches.has('Saturn') ? 'Saturn (heaviness, worry, seriousness; Vish/Punarphoo yoga when conjunct)' : null,
      touches.has('Rahu') ? 'Rahu (restlessness, obsession; Grahan yoga when conjunct)' : null,
      touches.has('Ketu') ? 'Ketu (detachment, intuition, emotional distance; Grahan yoga when conjunct)' : null,
      touches.has('Mars') ? 'Mars (quick emotions, irritability, courage)' : null,
    ].filter(Boolean)
    const supports = [touches.has('Jupiter') ? 'Jupiter (Gaja Kesari-type support, optimism)' : null, touches.has('Venus') ? 'Venus (softness, artistic feeling)' : null, touches.has('Mercury') ? 'Mercury (quick, curious mind)' : null].filter(Boolean)

    // Kemadruma: no planet (other than Sun and nodes) in the 2nd or 12th from the Moon, nor with it.
    const flank = (n: number) => (((mo.rashi - 1 + n) % 12) + 12) % 12 + 1
    const helpers = grahas.filter((g) => !['Su', 'Mo', 'Ra', 'Ke'].includes(g.id))
    const flanked = helpers.some((g) => g.rashi === flank(1) || g.rashi === flank(-1) || g.rashi === mo.rashi)
    const moonKendraFromLagna = [1, 4, 7, 10].includes(houseFrom(asc, mo.rashi))
    const kendraFromMoon = helpers.some((g) => [1, 4, 7, 10].includes(houseFrom(mo.rashi, g.rashi)))
    const kemadruma = flanked
      ? 'not present (a planet is with the Moon or in the 2nd/12th from it)'
      : `present${moonKendraFromLagna || kendraFromMoon ? `, but cancelled (${[moonKendraFromLagna ? 'Moon in a kendra from Lagna' : null, kendraFromMoon ? 'planet in a kendra from the Moon' : null].filter(Boolean).join('; ')})` : ' and not cancelled'}`

    out.push(
      `- **Moon (mind):** ${RASHI_NAMES[mo.rashi]} H${houseFrom(asc, mo.rashi)}, ${mo.nakshatraName} pada ${mo.pada}, ${mo.dignity}; ${waxing == null ? '' : waxing ? 'waxing (Shukla)' : 'waning (Krishna)'}${elong != null ? `, ${Math.round(elong)}° from the Sun (${Math.round(fromFull!)}° from full)` : ''}; Shadbala ${shadbalaRupas(chart.shadbala?.planets?.Mo)}.`,
      `- **With the Moon:** ${conj.join(', ') || 'none'}. **Aspecting the Moon:** ${asp.join(', ') || 'none'}.`,
      `- **Moon afflictions:** ${afflictions.join('; ') || 'none from Saturn, Rahu, Ketu or Mars'}. **Moon supports:** ${supports.join('; ') || 'none'}.`,
      `- **Kemadruma yoga:** ${kemadruma}.`,
      `- **4th house (heart):** ${RASHI_NAMES[signOfHouse(asc, 4)]}, lord ${gname(RASHI_LORD[signOfHouse(asc, 4)])}; occupants ${grahas.filter((g) => g.rashi === signOfHouse(asc, 4)).map((g) => gname(g.id)).join(', ') || 'none'}.`,
    )
  }

  // Balance (Lagna + 9 grahas)
  const points: { rashi: Rashi; id?: GrahaId }[] = [{ rashi: asc }, ...grahas.map((g) => ({ rashi: g.rashi, id: g.id }))]
  out.push(
    `- **Element balance** (Lagna + 9 planets): ${tally(points.map((p) => ELEMENT[p.rashi]))}.`,
    `- **Modality balance:** ${tally(points.map((p) => MODALITY[p.rashi]))}.`,
    `- **Guna emphasis:** Lagna lord ${gname(RASHI_LORD[asc])} (${GUNA[RASHI_LORD[asc]] ?? '—'}), Moon sign lord ${mo ? `${gname(RASHI_LORD[mo.rashi])} (${GUNA[RASHI_LORD[mo.rashi]] ?? '—'})` : '—'}, planets in Lagna ${grahas.filter((g) => g.rashi === asc).map((g) => `${gname(g.id)} (${GUNA[g.id]})`).join(', ') || 'none'}; all planets: ${tally(grahas.map((g) => GUNA[g.id] ?? '—'))}.`,
  )
  return out.join('\n')
}

// ── generic engine-reading renderer ──────────────────────────

const SKIP_KEYS = new Set(['id', 'ids', 'key', 'color', 'colour', 'icon', 'href', 'slug', 'css', 'className', 'glyph', 'emoji', 'svg', 'path', 'lang'])
const GRAHA_CODE = /^(Su|Mo|Ma|Me|Ju|Ve|Sa|Ra|Ke)$/
const TITLE_KEYS = ['title', 'name', 'label', 'heading', 'headline', 'planet', 'house']

function humanize(key: string): string {
  const s = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ').toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function scalar(v: unknown): string | null {
  if (v == null) return null
  if (v instanceof Date) return day(v)
  if (typeof v === 'string') {
    const t = v.trim()
    if (!t) return null
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(t) ? day(t) : t.replace(/\s+/g, ' ')
  }
  if (typeof v === 'number') return Number.isFinite(v) ? String(Math.round(v * 100) / 100) : null
  if (typeof v === 'boolean') return v ? 'yes' : 'no'
  return null
}

/** Walks any engine reading object and renders it as nested Markdown bullets. */
export function renderReading(value: unknown, maxChars = 14_000): string {
  const lines: string[] = []
  let size = 0
  const seen = new Set<string>()
  let truncated = false

  const emit = (depth: number, text: string) => {
    if (truncated) return
    const line = `${'  '.repeat(depth)}- ${text}`
    if (size + line.length > maxChars) {
      truncated = true
      return
    }
    lines.push(line)
    size += line.length + 1
  }

  const walk = (v: unknown, depth: number, label?: string) => {
    if (truncated || depth > 6) return
    let sv = scalar(v)
    if (sv != null && label) {
      if (typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 12 && /rashi|sign/i.test(label)) sv = RASHI_NAMES[v as Rashi]
      else if (typeof v === 'string' && GRAHA_CODE.test(v)) sv = gname(v)
    }
    if (sv != null) {
      if (sv.length > 40) {
        if (seen.has(sv)) return
        seen.add(sv)
      }
      emit(depth, label ? `${label}: ${sv}` : sv)
      return
    }
    if (Array.isArray(v)) {
      if (!v.length) return
      const prims = v.map(scalar)
      if (prims.every((p) => p != null) && prims.join(', ').length < 300) {
        emit(depth, label ? `${label}: ${prims.join(', ')}` : prims.join(', '))
        return
      }
      if (label) emit(depth, `**${label}**`)
      for (const item of v) walk(item, label ? depth + 1 : depth)
      return
    }
    if (v && typeof v === 'object') {
      const obj = v as Record<string, unknown>
      const entries = Object.entries(obj).filter(([k, x]) => !SKIP_KEYS.has(k) && x != null && x !== '' && typeof x !== 'function')
      if (!entries.length) return
      const titleKey = TITLE_KEYS.find((k) => scalar(obj[k]) != null)
      const head = titleKey ? scalar(obj[titleKey]) : null
      let inner = depth
      if (label || head) {
        emit(depth, `**${[label, head].filter(Boolean).join(': ')}**`)
        inner = depth + 1
      }
      for (const [k, x] of entries) {
        if (k === titleKey) continue
        walk(x, inner, humanize(k))
      }
    }
  }

  walk(value, 0)
  if (truncated) lines.push('- … (shortened to keep the prompt within AI context limits)')
  return lines.join('\n')
}

// ── public ───────────────────────────────────────────────────

export interface TopicOptions {
  plan: UserPlan
  lang: EngineLang
  now: number
  /** Compact study: method, key houses, significators, mind data, top dasha periods. No engine readings. */
  short?: boolean
}

export function topicTitle(topic: AiTopic): string {
  return TOPICS[topic].title
}

export function buildTopicStudy(chart: ChartOutput, topic: AiTopic, opts: TopicOptions): string {
  const def = TOPICS[topic]
  if (!chart.lagnas?.ascRashi) return ''
  if (opts.short) {
    const short: string[] = [
      `## Focus: ${def.title}`,
      '',
      ...def.method.map((m, i) => `${i + 1}. ${m}`),
      '',
      houseTable(chart, def.houses, true),
      '',
      karakaTable(chart, def.karakas, def.charaKarakas),
    ]
    const extra = def.extra?.(chart)
    if (extra) short.push('', extra)
    const activation = activationTable(chart, def, opts.now, 8)
    if (activation) short.push('', activation)
    short.push('', `Questions: ${def.questions.slice(0, 3).join(' / ')}`)
    return short.join('\n')
  }
  const out: string[] = [
    `## Focus study: ${def.title}`,
    '',
    '### Method to follow',
    '',
    ...def.method.map((m, i) => `${i + 1}. ${m}`),
    '',
    `### Key houses for ${def.title.toLowerCase()} (whole sign from Lagna)`,
    '',
    houseTable(chart, def.houses),
    '',
    '### Significators',
    '',
    karakaTable(chart, def.karakas, def.charaKarakas),
    '',
    '### Divisional charts for this topic',
    '',
    ...def.vargas.map((v) => vargaFocus(chart, v, def.houses)),
  ]

  if (def.extra) {
    const extra = def.extra(chart)
    if (extra) out.push('', extra)
  }

  const activation = activationTable(chart, def, opts.now)
  if (activation) out.push('', activation)

  if (def.readings?.length) {
    if (opts.plan === 'free') {
      out.push('', `_Vedaansh's detailed ${def.title.toLowerCase()} readings are part of Gold and are not included here._`)
    } else {
      const now = new Date(opts.now)
      for (const r of def.readings) {
        let data: unknown = null
        try {
          data = r.run(chart, opts.lang, now)
        } catch {
          data = null
        }
        if (!data) continue
        const body = renderReading(data)
        if (body) out.push('', `### Vedaansh reading: ${r.title}`, '', body)
      }
    }
  }

  out.push('', `### Questions to explore (${def.title.toLowerCase()})`, '', ...def.questions.map((q) => `- ${q}`))
  return out.join('\n')
}
