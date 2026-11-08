// ─────────────────────────────────────────────────────────────
//  src/lib/engine/planetaryRemedies.ts
//  Planetary energies and their general remedies (ग्रहों की ऊर्जा और उपाय)
//  Teaching: planet → nakshatra deity → exact energy; behavioural,
//  spiritual, daan and seva remedies for weak/afflicted grahas.
// ─────────────────────────────────────────────────────────────

import type { GrahaData, GrahaId, ShadbalaResult } from '@/types/astrology'
import { NAKSHATRA_NAMES } from '@/types/astrology'
import { NAKSHATRA_DEITY } from './nakshatraAdvanced'
import { fill, type EngineLang } from './lang'
import { NAKSHATRA_DEITY_HI, NAKSHATRA_HI } from '@/i18n/jyotish'
import {
  PLANET_REMEDY_TEACHINGS_HI,
  REMEDY_CORE_PRINCIPLE_HI,
  REMEDY_INSIGHT_HI,
  REMEDY_REASON_HI,
} from './locale/planetaryRemedies.hi'

export type RemedyGrahaId = 'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke'

export const REMEDY_GRAHAS: RemedyGrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

export interface PlanetRemedyTeaching {
  grahaId: RemedyGrahaId
  name: string
  sanskrit: string
  /** Deities named in the teaching (the nakshatra deity is added per chart). */
  deities: string[]
  /** Signs in life that the planet is weak or afflicted. */
  indications: string[]
  behavioral: string[]
  spiritual: string[]
  donation: string[]
  seva: string[]
  /** Important cautions / teacher notes. */
  notes: string[]
  duration?: string
}

export const REMEDY_CORE_PRINCIPLE = {
  title: 'Multiple deities for each planet',
  steps: [
    'The planet itself',
    'The nakshatra the planet is sitting in',
    'The exact energy the planet is trying to communicate',
  ],
  keyRule:
    'Always check the nakshatra of the planet — the deity of that nakshatra gives the EXACT energy needed for the remedy.',
} as const

export const PLANET_REMEDY_TEACHINGS: Record<RemedyGrahaId, PlanetRemedyTeaching> = {
  Su: {
    grahaId: 'Su',
    name: 'Sun',
    sanskrit: 'Surya',
    deities: ['Vishnu', 'Ram'],
    indications: [
      'Poor relationship with father (mental or physical distance)',
      'Problems with government departments',
      'Conflict with bosses / seniors in corporate',
      'Suppliers creating problems in business',
      'Low confidence, inability to take decisions',
      'Lack of respect',
      'Spitting while speaking (थूक निकलना)',
    ],
    behavioral: [
      'Watch the sunrise daily (minimum 40 days to start)',
      'Offer Arghya (water) to the Sun',
      'Danda pranam (दंडवत प्रणाम) to the rising Sun',
      'Do Parikrama of the Sun',
      'Treat father with full respect — speak lovingly even if you cannot serve physically',
      'Never urinate on government property',
      'Do not litter on government property (parks, buildings, etc.)',
      'Be 100% punctual — respect time',
    ],
    spiritual: [
      'Visit a Vishnu or Ram temple daily',
      'Offer one flower (Kanak kusuma / Champa type — no thorny rose)',
      'Surya Namaskar — 12-cycle version (not the 7-pose version)',
      'Bhastrika Pranayama (healthy people only; not during pregnancy or with high BP)',
      'Chant "Om Grahanam Sura Namah" — 108 or 1000 times',
      'Aditya Gayatri mantra',
      'Aditya Hridaya Stotra',
      'Surya Sukta',
    ],
    donation: ['Jaggery (Gur)', 'Wheat', 'Copper', 'Red cloth'],
    seva: [
      'Serve father, serve teachers',
      'Give full respect to colleagues and employees',
    ],
    notes: [],
    duration: 'Minimum 40 days, ideally 90 days',
  },
  Mo: {
    grahaId: 'Mo',
    name: 'Moon',
    sanskrit: 'Chandra',
    deities: ['Shiva', 'Devi'],
    indications: [
      'Mental stress, anxiety',
      'Insomnia — stays up watching mobile / TV at night',
      'Wastes water (taps left running)',
      'Female health issues',
      'Poor relationship with mother',
    ],
    behavioral: [
      'Drink sufficient water — keep the body hydrated',
      'Keep water in a silver glass overnight and drink it in the morning',
      'Never waste water — turn off taps, fix leaks',
      'Plant trees and plants',
      'Sleep early — if sleep does not come, do mental (maanas) japa with eyes closed',
      'Serve mother with love',
    ],
    spiritual: [
      'Visit Shiva and Devi temples for darshan',
      'Pour water on the Shiva linga from a silver glass',
    ],
    donation: ['Milk'],
    seva: ['Serve mother'],
    notes: [
      'Never offer milk to Shiva from a copper vessel (तांबे के पात्र से दूध नहीं) — use brass, silver, steel or an earthen pot.',
    ],
  },
  Ma: {
    grahaId: 'Ma',
    name: 'Mars',
    sanskrit: 'Mangal',
    deities: [],
    indications: [
      'Lack of discipline, quick anger, irritability',
      'Accidents, surgery issues',
    ],
    behavioral: [
      'Daily exercise — walk, swim',
      'Keep discipline — be punctual',
      'Properly clean and store knives and weapons (especially on Dussehra)',
      'Control anger and build patience',
      'Never fight or quarrel unnecessarily',
    ],
    spiritual: [],
    donation: ['Blood donation'],
    seva: ['Honour ex-soldiers — felicitate them or donate stationery to their offices'],
    notes: [],
  },
  Me: {
    grahaId: 'Me',
    name: 'Mercury',
    sanskrit: 'Budh',
    deities: ['Saraswati', 'Neel Saraswati', 'Vishnu', 'Ganesha'],
    indications: [],
    behavioral: [
      'Never lie (no falsehood)',
      'Journaling — write as much as possible',
      'Avoid foul language (no gaali-galoch)',
      'Control unnecessary speech',
    ],
    spiritual: [
      'Visit a Vishnu temple',
      'Visit a Ganesha temple',
      'Release green parrots or birds — only in a safe location away from eagles / vultures',
    ],
    donation: [
      'Donate books — old books, or Gita Press publications (Hanuman Chalisa, Sundarkand) to temples, NGOs or children',
      'Plant Durva grass',
      'Plant green plants',
    ],
    seva: [],
    notes: [],
  },
  Ju: {
    grahaId: 'Ju',
    name: 'Jupiter',
    sanskrit: 'Guru',
    deities: [],
    indications: [
      'Pride / ego (self-pride or self-obsession)',
      'Financial miscalculation',
      'Wrong guidance received',
    ],
    behavioral: [
      'Read religious scriptures — pick any one and read continuously',
      'Spread knowledge — share what you know',
      'Balance ego — manage and reduce pride',
    ],
    spiritual: [],
    donation: [
      'Give scholarships if affordable; if not, pay even one month’s school fee for a maid’s child (~₹500–1500)',
    ],
    seva: ['Serve teachers — respect teachers fully'],
    notes: [],
  },
  Ve: {
    grahaId: 'Ve',
    name: 'Venus',
    sanskrit: 'Shukra',
    deities: [],
    indications: [
      'Messy appearance',
      'Messy house (clothes thrown everywhere)',
      'Disrespect to women',
      'Relationship problems',
    ],
    behavioral: [
      'Respect wife / spouse (or all females if unmarried)',
      'Respect all women — inside and outside the home',
      'Keep personal appearance clean and well-maintained',
      'Keep the house clean and organised — everything in its proper place',
      'Visit art galleries or participate in the arts',
    ],
    spiritual: [],
    donation: [],
    seva: [],
    notes: [],
  },
  Sa: {
    grahaId: 'Sa',
    name: 'Saturn',
    sanskrit: 'Shani',
    deities: [],
    indications: [
      'Laziness, lack of discipline',
      'Cannot keep promises',
      'Shows off a lot (dikhawa) but does not follow through',
    ],
    behavioral: [
      'Abandon laziness completely',
      'Be disciplined and punctual',
      'Polish your own shoes yourself',
      'Clean your own toilet / bathroom — no shame in this',
      'Clean temples and ashrams when you visit (sweep occasionally)',
      'Never insult labourers or workers',
      'Give full respect to colleagues — private job, government, or your own workers / servants',
      'Keep your promises',
    ],
    spiritual: [],
    donation: ['Donate to an old age home'],
    seva: ['Serve the elderly (budhon ki seva)'],
    notes: [
      '"Weak" Saturn means debilitated, retrograde, in an enemy sign, or wrongly placed.',
      'Weak Shani people show off a lot (dikhawa) but do not follow through — avoid this.',
    ],
  },
  Ra: {
    grahaId: 'Ra',
    name: 'Rahu',
    sanskrit: 'Rahu',
    deities: ['Saraswati', 'Bhairav', 'Shiva', 'Hanuman'],
    indications: [
      'Fake identity (different persona at home, office, with friends)',
      'Creates illusions, exaggerates stories',
      'Spreading confusion / doubt',
    ],
    behavioral: [
      'Quit all addictions (nasha)',
      'Stop maintaining a fake identity — be the same person everywhere',
      'Respect foreign cultures — do not speak ill of other religions',
      'Do research — desktop research, technical knowledge building',
      'Stop spreading illusions — do not exaggerate stories',
      'Clean your own toilet / bathroom',
    ],
    spiritual: [],
    donation: [],
    seva: [],
    notes: [
      'Foreign culture is relative to you — e.g. for a Hindu, speaking ill of Muslims, Christians or Buddhists disrespects Rahu.',
    ],
  },
  Ke: {
    grahaId: 'Ke',
    name: 'Ketu',
    sanskrit: 'Ketu',
    deities: ['Bhairav', 'Ganesha', 'Lakshmi'],
    indications: [],
    behavioral: [
      'Practice meditation (Dhyana)',
      'Stay silent as much as possible',
      'Read religious books and scriptures',
      'Reduce attachments (asakti kam karo) — reduce worldly clinging',
    ],
    spiritual: ['Worship Ganesha (Ganapati upasana)'],
    donation: ['Donate fodder at a Gaushala (cow shelter)'],
    seva: [],
    notes: [],
  },
}

// ─────────────────────────────────────────────────────────────
//  Chart assessment
// ─────────────────────────────────────────────────────────────

export type RemedyNeed = 'high' | 'moderate' | 'low'

export interface PlanetRemedyAssessment {
  grahaId: RemedyGrahaId
  teaching: PlanetRemedyTeaching
  need: RemedyNeed
  /** Weighted affliction score (higher = more remedial attention). */
  score: number
  reasons: string[]
  nakshatraIndex: number
  nakshatraName: string
  /** Deity of the nakshatra the planet occupies — the exact energy for the remedy. */
  nakshatraDeity: string
}

export interface PlanetaryRemediesResult {
  planets: PlanetRemedyAssessment[]
  /** Planets with high need, most afflicted first. */
  priority: RemedyGrahaId[]
  insight: string
}

const NODES: GrahaId[] = ['Ra', 'Ke']

export function assessRemedyNeed(
  g: GrahaData,
  shadbala?: ShadbalaResult | null,
): { score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 0
  const add = (pts: number, reason: string) => {
    score += pts
    reasons.push(reason)
  }

  if (g.dignity === 'debilitated') add(3, 'Debilitated')
  else if (g.dignity === 'great_enemy') add(2, 'In great enemy sign')
  else if (g.dignity === 'enemy') add(1.5, 'In enemy sign')

  if (g.isCombust) add(2, 'Combust (asta)')
  // Nodes are always retrograde; only flag vakri for the seven visible grahas.
  if (g.isRetro && !NODES.includes(g.id)) add(g.id === 'Sa' ? 1.5 : 1, 'Retrograde (vakri)')
  if (g.yuddha?.isWarring && g.yuddha.loser === g.id) add(1.5, 'Lost planetary war')
  if (g.gandanta?.isGandanta) add(1, 'Gandanta')
  if (g.mrityuBhaga?.isMrityuBhaga) add(1, 'Mrityu Bhaga degree')

  const sb = shadbala?.planets[g.id]
  if (sb && !NODES.includes(g.id)) {
    if (sb.qualityBand === 'weak') add(1.5, 'Weak Shadbala')
    else if (!sb.isStrong) add(0.75, 'Shadbala below required')
  }
  if (shadbala?.weakest === g.id) add(0.5, 'Weakest graha by Shadbala')

  return { score: Math.round(score * 100) / 100, reasons }
}

function needFromScore(score: number): RemedyNeed {
  if (score >= 3) return 'high'
  if (score >= 1) return 'moderate'
  return 'low'
}

/** Core principle box in the requested language. */
export function getRemedyCorePrinciple(lang: EngineLang = 'en'): { title: string; steps: readonly string[]; keyRule: string } {
  return lang === 'hi' ? REMEDY_CORE_PRINCIPLE_HI : REMEDY_CORE_PRINCIPLE
}

/** Teaching card for one graha in the requested language (grahaId unchanged). */
export function getPlanetRemedyTeaching(id: RemedyGrahaId, lang: EngineLang = 'en'): PlanetRemedyTeaching {
  const en = PLANET_REMEDY_TEACHINGS[id]
  return lang === 'hi' ? { grahaId: id, ...PLANET_REMEDY_TEACHINGS_HI[id] } : en
}

function localizeRemedies(r: PlanetaryRemediesResult, lang: EngineLang): PlanetaryRemediesResult {
  if (lang !== 'hi') return r
  const planets = r.planets.map((p) => ({
    ...p,
    teaching: getPlanetRemedyTeaching(p.grahaId, 'hi'),
    reasons: p.reasons.map((x) => REMEDY_REASON_HI[x] ?? x),
    nakshatraName: NAKSHATRA_HI[p.nakshatraIndex] ?? p.nakshatraName,
    nakshatraDeity: NAKSHATRA_DEITY_HI[p.nakshatraIndex] ?? p.nakshatraDeity,
  }))
  const top = planets[0]
  const insight =
    r.priority.length > 0
      ? fill(REMEDY_INSIGHT_HI.priority, { names: r.priority.map((id) => PLANET_REMEDY_TEACHINGS_HI[id].name).join(', ') })
      : top && top.score > 0
        ? fill(REMEDY_INSIGHT_HI.top, { name: top.teaching.name })
        : REMEDY_INSIGHT_HI.none
  return { planets, priority: r.priority, insight }
}

export function computePlanetaryRemedies(
  grahas: GrahaData[],
  shadbala?: ShadbalaResult | null,
  lang: EngineLang = 'en',
): PlanetaryRemediesResult {
  const planets: PlanetRemedyAssessment[] = []
  for (const id of REMEDY_GRAHAS) {
    const g = grahas.find((x) => x.id === id)
    if (!g) continue
    const { score, reasons } = assessRemedyNeed(g, shadbala)
    const nakIdx = ((g.nakshatraIndex % 27) + 27) % 27
    planets.push({
      grahaId: id,
      teaching: PLANET_REMEDY_TEACHINGS[id],
      need: needFromScore(score),
      score,
      reasons,
      nakshatraIndex: nakIdx,
      nakshatraName: NAKSHATRA_NAMES[nakIdx],
      nakshatraDeity: NAKSHATRA_DEITY[nakIdx],
    })
  }

  planets.sort(
    (a, b) => b.score - a.score || REMEDY_GRAHAS.indexOf(a.grahaId) - REMEDY_GRAHAS.indexOf(b.grahaId),
  )
  const priority = planets.filter((p) => p.need === 'high').map((p) => p.grahaId)

  const top = planets[0]
  const insight =
    priority.length > 0
      ? `${priority.map((id) => PLANET_REMEDY_TEACHINGS[id].name).join(', ')} need${priority.length === 1 ? 's' : ''} the most remedial attention. Start with behavioural remedies for at least 40 days.`
      : top && top.score > 0
        ? `No severely afflicted graha. ${top.teaching.name} shows the most strain — behavioural remedies are enough.`
        : 'No significant affliction found — remedies below serve as general lifestyle guidance.'

  return localizeRemedies({ planets, priority, insight }, lang)
}

// ─────────────────────────────────────────────────────────────
//  Running dasha — remedies for the active period lords
// ─────────────────────────────────────────────────────────────

export type DashaRemedyLevel = 'Mahadasha' | 'Antardasha' | 'Pratyantardasha'

export interface DashaLordRemedy {
  /** Every running level this lord rules (a lord can repeat, e.g. Sa/Sa). */
  levels: DashaRemedyLevel[]
  assessment: PlanetRemedyAssessment
}

const DASHA_LEVELS: DashaRemedyLevel[] = ['Mahadasha', 'Antardasha', 'Pratyantardasha']

/**
 * Remedies for the running Maha → Antar → Pratyantar lords, in that order.
 * The same lord at several levels appears once with all its levels.
 */
export function computeDashaLordRemedies(
  lords: string[],
  grahas: GrahaData[],
  shadbala?: ShadbalaResult | null,
): DashaLordRemedy[] {
  const all = computePlanetaryRemedies(grahas, shadbala).planets
  const out: DashaLordRemedy[] = []
  lords.slice(0, DASHA_LEVELS.length).forEach((lord, i) => {
    const existing = out.find((r) => r.assessment.grahaId === lord)
    if (existing) {
      existing.levels.push(DASHA_LEVELS[i])
      return
    }
    const assessment = all.find((p) => p.grahaId === lord)
    if (assessment) out.push({ levels: [DASHA_LEVELS[i]], assessment })
  })
  return out
}
