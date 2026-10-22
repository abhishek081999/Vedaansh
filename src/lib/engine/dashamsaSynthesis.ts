// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dashamsaSynthesis.ts
//  D10 Synthesis — A10, profession card, gochara windows,
//  job vs business, foreign/transfer, Vimsopaka, Muntha year,
//  employer/boss, and a copyable career brief.
//  Pure relative to chart inputs; pass transitPositions from the API.
// ─────────────────────────────────────────────────────────────

import type {
  ChartOutput,
  Dignity,
  GrahaId,
  Rashi,
} from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SHORT } from '@/types/astrology'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { getMunthaRashi } from '@/lib/engine/tajika'
import {
  buildCareerFormula,
  getCareerIndicators,
  getMatchingCombosForChart,
} from '@/lib/engine/nakshatraProfession'
import type { CareerTone, DashamsaAnalysis } from '@/lib/engine/dashamsaAnalysis'
import {
  aspectsSign,
  type DashamsaClassical,
} from '@/lib/engine/dashamsaClassical'

const CLASSICAL: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const HEAVY: GrahaId[] = ['Ju', 'Sa', 'Ra', 'Ke', 'Su', 'Ma']

const SIGN_LORDS: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const BOSS_NATURE: Record<GrahaId, string> = {
  Su: 'Authority as king — father-figure, state, or a proud leader',
  Mo: 'Public-facing or changeable boss — maternal, popular, mood-led',
  Ma: 'Commander boss — direct, technical, competitive, or military',
  Me: 'Merchant or analyst boss — deals, documents, and skill',
  Ju: 'Mentor boss — counsel, law, banking, or a teacher-patron',
  Ve: 'Refined boss — arts, luxury, diplomacy, or pleasant patronage',
  Sa: 'Institutional boss — slow, strict, endurance-based hierarchy',
  Ra: 'Unconventional or foreign boss — sudden, ambitious, opaque',
  Ke: 'Specialist or detached boss — little court, deep skill',
  Ur: '', Ne: '', Pl: '',
}

const TRACK_COPY = {
  service: 'Service / employment track — status through a post, hierarchy, or the state.',
  business: 'Business / trade track — clients, partners, and own venture carry the livelihood.',
  hybrid: 'Hybrid track — both a post and a side or partnered venture are live.',
} as const

export type CareerTrack = keyof typeof TRACK_COPY

export interface TransitHit {
  id: GrahaId
  name: string
  signName: string
  house: number
  isRetro: boolean
  tone: CareerTone
  note: string
}

export interface DashaWindow {
  id: string
  title: string
  lord: GrahaId
  lordName: string
  levelLabel: string
  start: string
  end: string
  live: boolean
  careerNote: string
}

export interface ProfessionField {
  field: string
  sources: string[]
}

export interface DashamsaSynthesis {
  framing: string
  headline: string
  a10: {
    rashi: Rashi
    rashiName: string
    rashiShort: string
    houseFromLagna: number
    houseFromD10: number
    lord: GrahaId
    lordName: string
    occupants: { id: GrahaId; name: string }[]
    aspectors: { id: GrahaId; name: string }[]
    headline: string
    prediction: string
    source: string
    bphsNote: string | null
  }
  profession: {
    headline: string
    doThis: string
    livelihoodPlanet: string
    digpalaFields: string[]
    fields: ProfessionField[]
    agreement: string
    nakshatraSummary: string
    confidence: 'high' | 'medium' | 'split'
    sources: string[]
  }
  track: {
    id: CareerTrack
    headline: string
    prediction: string
    factors: string[]
    source: string
  }
  foreign: {
    active: boolean
    score: number
    headline: string
    prediction: string
    factors: string[]
    directionAdvice: string | null
  }
  boss: {
    lordId: GrahaId
    lordName: string
    house: number
    dignity: Dignity
    nature: string
    prediction: string
    source: string
  }
  vimsopaka: {
    available: boolean
    tenthLord: { id: GrahaId; name: string; d10Points: number; dashavarga: number; strength: string } | null
    lagnaLord: { id: GrahaId; name: string; d10Points: number; dashavarga: number; strength: string } | null
    headline: string
    prediction: string
  }
  annual: {
    year: number
    age: number
    munthaRashi: Rashi
    munthaName: string
    houseFromD10: number
    headline: string
    prediction: string
    source: string
    openSolarReturn: boolean
  }
  transit: {
    asOf: string
    available: boolean
    hits: TransitHit[]
    headline: string
    prediction: string
  }
  windows: DashaWindow[]
  brief: {
    title: string
    markdown: string
    plain: string
    sections: { heading: string; body: string }[]
  }
}

function houseFrom(planetRashi: Rashi, from: Rashi): number {
  return ((planetRashi - from + 12) % 12) + 1
}

function houseSign(asc: Rashi, house: number): Rashi {
  return (((asc - 1 + house - 1) % 12) + 1) as Rashi
}

function formatDay(value: Date | string | number): string {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toISOString().slice(0, 10)
}

function completedAge(birthDate: string, asOf: Date): number {
  const b = new Date(birthDate.includes('T') ? birthDate : `${birthDate}T12:00:00Z`)
  if (Number.isNaN(b.getTime())) return 0
  let age = asOf.getUTCFullYear() - b.getUTCFullYear()
  const m = asOf.getUTCMonth() - b.getUTCMonth()
  if (m < 0 || (m === 0 && asOf.getUTCDate() < b.getUTCDate())) age -= 1
  return Math.max(0, age)
}

function transitTone(house: number, id: GrahaId): CareerTone {
  if ([1, 10, 11].includes(house)) return id === 'Sa' || id === 'Ra' ? 'mixed' : 'supportive'
  if ([6, 8, 12].includes(house)) return 'challenging'
  if ([2, 5, 9].includes(house)) return 'mixed'
  return 'neutral'
}

function transitNote(id: GrahaId, house: number, retro: boolean): string {
  const base: Record<number, string> = {
    1: 'Activates livelihood identity and how the native owns the post.',
    2: 'Touches income expression and status speech from work.',
    3: 'Pushes effort, skill, and short professional moves.',
    4: 'Tests peace with the occupation and workplace rooting.',
    5: 'Lights reputation, students, and creative authority.',
    6: 'Rivals, deadlines, and service load rise.',
    7: 'Partners, clients, and public dealing accelerate.',
    8: 'Secrets, endings, and research karma open.',
    9: 'Mentors, right direction, and long transfers.',
    10: 'Direct hit on work karma and visible status.',
    11: 'Gains, awards, and network fruit.',
    12: 'Closures, foreign chapters, or behind-the-scenes work.',
  }
  const extra = id === 'Ju' && [1, 2, 5, 9, 10, 11].includes(house)
    ? ' Jupiter transit favors expansion when the house is clean.'
    : id === 'Sa' && [10, 11].includes(house)
      ? ' Saturn demands durable results before it pays.'
      : id === 'Ra' && [10, 11].includes(house)
        ? ' Rahu amplifies ambition — watch shortcuts.'
        : ''
  return `${base[house] ?? 'Career house is touched.'}${extra}${retro ? ' Retrograde: review before leaping.' : ''}`
}

/** Pure: map current rashis into D10 houses. */
export function mapTransitsToD10(
  positions: { id: GrahaId; rashi: Rashi; isRetro?: boolean }[],
  d10Lagna: Rashi,
): TransitHit[] {
  return positions
    .filter((p) => CLASSICAL.includes(p.id))
    .map((p) => {
      const house = houseFrom(p.rashi, d10Lagna)
      return {
        id: p.id,
        name: GRAHA_NAMES[p.id],
        signName: RASHI_NAMES[p.rashi],
        house,
        isRetro: Boolean(p.isRetro),
        tone: transitTone(house, p.id),
        note: transitNote(p.id, house, Boolean(p.isRetro)),
      }
    })
    .filter((h) => HEAVY.includes(h.id) || [1, 6, 7, 8, 9, 10, 11, 12].includes(h.house))
    .sort((a, b) => {
      const rank = (h: number) => ([10, 11, 1, 6, 7, 9, 8, 12].indexOf(h) + 1) || 20
      return rank(a.house) - rank(b.house)
    })
}

function collectFields(classical: DashamsaClassical, chart: ChartOutput): ProfessionField[] {
  const map = new Map<string, Set<string>>()
  const add = (field: string, source: string) => {
    const key = field.trim()
    if (!key) return
    let set = map.get(key)
    if (!set) {
      set = new Set()
      map.set(key, set)
    }
    set.add(source)
  }

  const winnerFields = new Set(classical.livelihood.winner.fields)
  for (const f of classical.livelihood.winner.fields) add(f, 'Phaladeepika')
  for (const f of classical.livelihood.candidates.slice(0, 2).flatMap((c) => c.fields.slice(0, 2))) {
    if (!winnerFields.has(f)) add(f, 'Phaladeepika support')
  }
  for (const f of classical.mahatEmphasis.winner.fields.slice(0, 3)) add(f, 'D10 mahatphala')
  for (const f of classical.phala?.lagna.careers.slice(0, 6) ?? []) add(f, 'D10 lagna rashi')

  try {
    const indicators = getCareerIndicators(chart)
    for (const ind of indicators.slice(0, 3)) {
      for (const f of ind.profile.careerFields.slice(0, 3)) add(f, `${ind.label} nakshatra`)
    }
    for (const combo of getMatchingCombosForChart(chart).slice(0, 4)) {
      add(combo.expression, 'Planet–nakshatra combo')
    }
  } catch {
    // chart stubs in unit tests may omit nakshatra fields
  }

  return [...map.entries()]
    .map(([field, sources]) => ({ field, sources: [...sources] }))
    .sort((a, b) => b.sources.length - a.sources.length || a.field.localeCompare(b.field))
}

function buildTrack(analysis: DashamsaAnalysis, classical: DashamsaClassical): DashamsaSynthesis['track'] {
  const h7 = analysis.houses[6]!
  const h10 = analysis.houses[9]!
  const h2 = analysis.houses[1]!
  const h11 = analysis.houses[10]!
  const factors: string[] = []
  let service = 0
  let business = 0

  if (h10.occupants.length) {
    service += 2
    factors.push(`D10 10th occupied by ${h10.occupants.map((o) => o.name).join(', ')} — visible post / duty.`)
  }
  if (h7.occupants.length) {
    business += 2
    factors.push(`D10 7th occupied by ${h7.occupants.map((o) => o.name).join(', ')} — clients and partners.`)
  }

  const tenth = classical.tenthLord
  if ([1, 10].includes(tenth.house)) {
    service += 2
    factors.push(`10th lord in H${tenth.house} — self-made or kingly service.`)
  }
  if (tenth.house === 7) {
    business += 3
    factors.push('10th lord in the 7th — trade and partnership as the profession.')
  }
  if ([2, 11].includes(tenth.house)) {
    business += 1
    service += 1
    factors.push(`10th lord in H${tenth.house} — income and gains from work (either track).`)
  }

  const seventhLord = analysis.planets.find((p) => p.id === h7.lord)
  if (seventhLord && [1, 10, 11].includes(seventhLord.d10House)) {
    business += 2
    factors.push(`7th lord ${seventhLord.name} in H${seventhLord.d10House} — partnered or client-facing rise.`)
  }

  if (h2.occupants.some((o) => o.id === 'Me' || o.id === 'Ve') || h11.occupants.length >= 2) {
    business += 1
    factors.push('2nd / 11th emphasis — commercial expression and gains.')
  }

  const sunIn10 = h10.occupants.some((o) => o.id === 'Su')
  const satIn10 = h10.occupants.some((o) => o.id === 'Sa')
  if (sunIn10 || satIn10) {
    service += 2
    factors.push(`${sunIn10 ? 'Sun' : 'Saturn'} in D10 10th — employment / institutional authority.`)
  }

  const id: CareerTrack =
    Math.abs(service - business) <= 1 && service > 0 && business > 0
      ? 'hybrid'
      : business > service
        ? 'business'
        : 'service'

  return {
    id,
    headline: TRACK_COPY[id],
    prediction:
      id === 'hybrid'
        ? 'Keep a stable post while building a client or product line. Do not force a pure employee or pure founder identity.'
        : id === 'business'
          ? 'Counsel toward trade, practice, consulting, or a venture with partners. Hierarchy alone will feel thin.'
          : 'Counsel toward a named post, government, corporate ladder, or institutional duty. Own venture is secondary unless the 7th activates later.',
    factors,
    source: 'BPHS — 10th (karma/post) vs 7th (partners/trade); 2nd–11th for commercial fruit',
  }
}

function buildForeign(analysis: DashamsaAnalysis, classical: DashamsaClassical): DashamsaSynthesis['foreign'] {
  const factors: string[] = []
  let score = 0
  if (analysis.direction.foreignTheme || analysis.lagnaDigpala.id === 'varuna') {
    score += 3
    factors.push(`Lagna Digpala ${analysis.lagnaDigpala.name} — West / overseas livelihood flavor.`)
  }
  const tenthDig = analysis.keyLords[1]?.digpala
  if (tenthDig?.id === 'varuna') {
    score += 2
    factors.push(`10th lord Digpala Varuna — work karma itself leans foreign.`)
  }
  const h9 = analysis.houses[8]!
  const h12 = analysis.houses[11]!
  if (h9.occupants.length) {
    score += 1
    factors.push(`D10 9th occupied — long travel, mentors abroad, or right-direction postings.`)
  }
  if (h12.occupants.length) {
    score += 2
    factors.push(`D10 12th occupied — foreign, hospitals, ashrams, or behind-the-curtain work.`)
  }
  if (classical.tenthLord.house === 12 || classical.tenthLord.house === 9) {
    score += 2
    factors.push(`10th lord in H${classical.tenthLord.house} — transfer / distant karma.`)
  }
  if (analysis.planets.some((p) => p.id === 'Ra' && [9, 10, 12].includes(p.d10House))) {
    score += 1
    factors.push('Rahu in D10 9th/10th/12th — unconventional or foreign status.')
  }

  const active = score >= 3
  return {
    active,
    score,
    headline: active
      ? 'Foreign / transfer theme is live'
      : score > 0
        ? 'Mild foreign or distant-work lean'
        : 'Domestic / local livelihood lean',
    prediction: active
      ? 'Prefer West or overseas geography for study, posting, or business when Digpala Varuna or the 9th/12th are hot. Time transfers with 9th/12th-lord dashas and Varuna planets.'
      : score > 0
        ? 'Distant work or short foreign chapters can appear; they are not the whole livelihood story.'
        : 'Primary livelihood reads domestic. Foreign chapters need dasha support from the 9th/12th or Rahu.',
    factors,
    directionAdvice: analysis.direction.advice,
  }
}

function buildBoss(analysis: DashamsaAnalysis): DashamsaSynthesis['boss'] {
  const tenth = analysis.keyLords[1]!
  const nature = BOSS_NATURE[tenth.id] || `${tenth.name} colors the authority figure.`
  return {
    lordId: tenth.id,
    lordName: tenth.name,
    house: tenth.d10House,
    dignity: tenth.d10Dignity,
    nature,
    prediction: `Phaladeepika treats the 10th as the king and the work. In Dashamsha, ${tenth.name} (${tenth.d10Dignity.replace(/_/g, ' ')}) in H${tenth.d10House} under ${tenth.digpalaName} shows the kind of boss, patron, or institutional face the native meets. ${nature}. Digpala ${tenth.digpalaName} adds how that authority behaves.`,
    source: 'Phaladeepika — 10th lord as king / profession significator, read in D10',
  }
}

function buildVimsopaka(
  chart: ChartOutput,
  tenthId: GrahaId,
  lagnaLordId: GrahaId,
): DashamsaSynthesis['vimsopaka'] {
  const vim = chart.vimsopaka
  if (!vim?.planets) {
    return {
      available: false,
      tenthLord: null,
      lagnaLord: null,
      headline: 'Vimsopaka not on this chart payload',
      prediction: 'Recalculate the chart to attach dashavarga strength for the career lords.',
    }
  }
  const pack = (id: GrahaId) => {
    const p = vim.planets[id]
    if (!p) return null
    return {
      id,
      name: GRAHA_NAMES[id],
      d10Points: Number(p.vargaContributions?.D10 ?? 0),
      dashavarga: p.dashavarga,
      strength: p.strength,
    }
  }
  const tenthLord = pack(tenthId)
  const lagnaLord = pack(lagnaLordId)
  const strong = (tenthLord?.d10Points ?? 0) >= 10 || (lagnaLord?.d10Points ?? 0) >= 10
  return {
    available: true,
    tenthLord,
    lagnaLord,
    headline: strong
      ? 'Career lords carry real Vimsopaka weight in D10'
      : 'Career lords are moderate in D10 Vimsopaka',
    prediction: [
      tenthLord
        ? `10th lord ${tenthLord.name}: D10 contribution ${tenthLord.d10Points}/20 · dashavarga ${tenthLord.dashavarga}/20 (${tenthLord.strength.replace(/_/g, ' ')}).`
        : null,
      lagnaLord
        ? `D10 lagna lord ${lagnaLord.name}: D10 contribution ${lagnaLord.d10Points}/20 · dashavarga ${lagnaLord.dashavarga}/20.`
        : null,
      'BPHS dashavarga: when D10 dignity of the karma lords is high, professional fruit holds under pressure.',
    ].filter(Boolean).join(' '),
  }
}

function buildAnnual(chart: ChartOutput, d10Lagna: Rashi, asOf: Date): DashamsaSynthesis['annual'] {
  const birth = chart.meta?.birthDate ?? '2000-01-01'
  const age = chart.varshaphal?.completedAge ?? completedAge(birth, asOf)
  const year = chart.varshaphal?.returnYear ?? asOf.getUTCFullYear()
  const muntha = (chart.varshaphal?.munthaRashi ?? getMunthaRashi(chart.lagnas.ascRashi, age)) as Rashi
  const houseFromD10 = houseFrom(muntha, d10Lagna)
  const yearThemes: Record<number, string> = {
    1: 'Year theme: reclaim the professional identity — title, branding, or a fresh start in livelihood.',
    2: 'Year theme: income speech and family status from work; renegotiate pay or commercial voice.',
    3: 'Year theme: effort, skill upgrades, and short career moves or side projects.',
    4: 'Year theme: workplace peace, property linked to work, or emotional fit with the job.',
    5: 'Year theme: reputation, students, creative authority, or speculative career bets.',
    6: 'Year theme: competition, workload, health vs job, and clearing service debts.',
    7: 'Year theme: partners, clients, contracts, and public dealing.',
    8: 'Year theme: transformation of the post — research, crisis, or a chapter ending.',
    9: 'Year theme: mentors, dharma in work, long transfer, or higher training.',
    10: 'Year theme: peak karma year — promotion, visible duty, or a defining project.',
    11: 'Year theme: gains, awards, and network fruit from prior work.',
    12: 'Year theme: foreign posting, sabbatical, closure, or behind-the-scenes labor.',
  }
  return {
    year,
    age,
    munthaRashi: muntha,
    munthaName: RASHI_NAMES[muntha],
    houseFromD10,
    headline: `Muntha ${RASHI_NAMES[muntha]} · D10 house ${houseFromD10} · age ${age}`,
    prediction: `${yearThemes[houseFromD10] ?? 'Annual Muntha touches the career chart.'} This is the Tajika year pointer read against Dashamsha houses — open Solar Return for the full Varshaphal D10 chart.`,
    source: 'Tajika Muntha (1 rashi/year) mapped to D10 houses',
    openSolarReturn: true,
  }
}

function buildWindows(
  chart: ChartOutput,
  careerLords: GrahaId[],
): DashaWindow[] {
  const nodes = chart.dashas?.vimshottari ?? []
  if (!nodes.length) return []
  const path = getDashaPathAt(nodes)
  const labels = ['', 'Maha', 'Antar', 'Pratyantar', 'Sukshma', 'Prana']
  const out: DashaWindow[] = []
  const seen = new Set<string>()

  for (const seg of path.slice(0, 4)) {
    const lord = seg.lord as GrahaId
    if (!careerLords.includes(lord) && !CLASSICAL.includes(lord)) continue
    const key = `${seg.level}-${lord}-live`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      id: key,
      title: `${labels[seg.level] ?? 'Dasha'} ${GRAHA_NAMES[lord]}`,
      lord,
      lordName: GRAHA_NAMES[lord],
      levelLabel: labels[seg.level] ?? `L${seg.level}`,
      start: formatDay(seg.start),
      end: formatDay(seg.end),
      live: true,
      careerNote: careerLords.includes(lord)
        ? 'Career significator is running now.'
        : `Active dasha lord in D10 context until ${formatDay(seg.end)}.`,
    })
  }

  // Next mahadashas that are career lords
  const now = Date.now()
  for (const maha of nodes) {
    const lord = maha.lord as GrahaId
    if (!careerLords.includes(lord)) continue
    const start = new Date(maha.start).getTime()
    if (start <= now) continue
    const key = `maha-next-${lord}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      id: key,
      title: `Next Maha ${GRAHA_NAMES[lord]}`,
      lord,
      lordName: GRAHA_NAMES[lord],
      levelLabel: 'Maha',
      start: formatDay(maha.start),
      end: formatDay(maha.end),
      live: false,
      careerNote: 'Upcoming mahadasha of a career significator.',
    })
    if (out.filter((w) => !w.live).length >= 3) break
  }

  return out.slice(0, 7)
}

function buildBrief(parts: {
  name: string
  headline: string
  a10: DashamsaSynthesis['a10']
  profession: DashamsaSynthesis['profession']
  track: DashamsaSynthesis['track']
  foreign: DashamsaSynthesis['foreign']
  boss: DashamsaSynthesis['boss']
  annual: DashamsaSynthesis['annual']
  classical: DashamsaClassical
  transit: DashamsaSynthesis['transit']
  windows: DashaWindow[]
}): DashamsaSynthesis['brief'] {
  const sections = [
    {
      heading: 'Summary',
      body: parts.headline,
    },
    {
      heading: 'Profession',
      body: `${parts.profession.doThis}\n${parts.profession.agreement}\nConfidence: ${parts.profession.confidence}.`,
    },
    {
      heading: 'A10 · public title',
      body: parts.a10.prediction,
    },
    {
      heading: 'Mahatphala',
      body: `${parts.classical.mahatphala.headline} (score ${parts.classical.mahatphala.score}). ${parts.classical.tenthLord.prediction}`,
    },
    {
      heading: 'D10 rashi & planet phala',
      body: [
        `Lagna ${parts.classical.phala.lagna.rashiName} (${parts.classical.phala.lagna.keyword}): ${(parts.classical.phala.lagna.careers.slice(0, 4).join('; ') || 'see classical notes')}.`,
        ...parts.classical.phala.priorityPlanets.slice(0, 3).map((p) => p.careerLens),
      ].join('\n'),
    },
    {
      heading: 'Job vs business',
      body: `${parts.track.headline}\n${parts.track.prediction}`,
    },
    {
      heading: 'Foreign / transfer',
      body: `${parts.foreign.headline}\n${parts.foreign.prediction}`,
    },
    {
      heading: 'Boss / patron',
      body: parts.boss.prediction,
    },
    {
      heading: 'This year (Muntha)',
      body: `${parts.annual.headline}\n${parts.annual.prediction}`,
    },
    {
      heading: 'Current D10 gochara',
      body: parts.transit.available
        ? `${parts.transit.headline}\n${parts.transit.hits.slice(0, 5).map((h) => `${h.name} in D10 H${h.house} (${h.signName}) — ${h.note}`).join('\n')}`
        : 'Transit snapshot unavailable.',
    },
    {
      heading: 'Timing windows',
      body: parts.windows.map((w) => `${w.title} ${w.start}→${w.end}${w.live ? ' [LIVE]' : ''} — ${w.careerNote}`).join('\n') || 'No dasha windows.',
    },
  ]

  const markdown = [
    `# ${parts.name} — Dashamsha career brief`,
    '',
    ...sections.flatMap((s) => [`## ${s.heading}`, s.body, '']),
    '_Generated by Vedaansh D10 Synthesis. Classical sources: BPHS, Phaladeepika, Jaimini, Tajika Muntha, Narada Digpalas._',
  ].join('\n')

  const plain = sections.map((s) => `${s.heading}\n${s.body}`).join('\n\n')

  return {
    title: `${parts.name} — Dashamsha career brief`,
    markdown,
    plain,
    sections,
  }
}

/**
 * Full D10 synthesis. Pass `transitPositions` in tests to avoid ephemeris I/O.
 */
export function buildDashamsaSynthesis(
  analysis: DashamsaAnalysis,
  classical: DashamsaClassical,
  chart: ChartOutput,
  opts?: {
    asOf?: Date
    transitPositions?: { id: GrahaId; rashi: Rashi; isRetro?: boolean }[]
  },
): DashamsaSynthesis | null {
  const d1Asc = chart.lagnas?.ascRashi
  if (!d1Asc) return null
  const asOf = opts?.asOf ?? new Date()
  const arudhas = chart.arudhasBphs ?? chart.arudhas
  if (!arudhas?.A10) return null

  const a10Rashi = arudhas.A10 as Rashi
  const a10Lord = SIGN_LORDS[a10Rashi]
  const occupants = analysis.planets
    .filter((p) => p.d1Rashi === a10Rashi)
    .map((p) => ({ id: p.id, name: p.name }))
  const aspectors = analysis.planets
    .filter((p) => aspectsSign(p.d1Rashi, p.id, a10Rashi))
    .map((p) => ({ id: p.id, name: p.name }))

  const a10 = {
    rashi: a10Rashi,
    rashiName: RASHI_NAMES[a10Rashi],
    rashiShort: RASHI_SHORT[a10Rashi],
    houseFromLagna: houseFrom(a10Rashi, d1Asc),
    houseFromD10: houseFrom(a10Rashi, analysis.d10Lagna),
    lord: a10Lord,
    lordName: GRAHA_NAMES[a10Lord],
    occupants,
    aspectors,
    headline: `A10 ${RASHI_NAMES[a10Rashi]} · H${houseFrom(a10Rashi, d1Asc)} from lagna`,
    prediction: [
      `Rajya Pada (A10) is ${RASHI_NAMES[a10Rashi]}, lord ${GRAHA_NAMES[a10Lord]}.`,
      'A10 is how the world names the career; the D10 10th is the work itself.',
      occupants.length
        ? `Planets on A10: ${occupants.map((o) => o.name).join(', ')} — they color the public title.`
        : 'No planet sits on A10 — title comes through the lord and aspects.',
      aspectors.length
        ? `Aspecting A10: ${aspectors.map((a) => a.name).join(', ')}.`
        : null,
      `From Dashamsha lagna, A10 falls in house ${houseFrom(a10Rashi, analysis.d10Lagna)} — status image relative to livelihood foundation.`,
    ].filter(Boolean).join(' '),
    source: 'Jaimini / Parashara — Arudha of the 10th (Rajya Pada)',
    bphsNote: chart.arudhasBphs && chart.arudhas && chart.arudhasBphs.A10 !== chart.arudhas.A10
      ? `BPHS-corrected A10 (${RASHI_NAMES[chart.arudhasBphs.A10 as Rashi]}) differs from raw (${RASHI_NAMES[chart.arudhas.A10 as Rashi]}). This reading uses the BPHS set.`
      : null,
  }

  const digpalaFields = [
    ...analysis.lagnaDigpala.professions.slice(0, 3),
    ...(analysis.keyLords[1]?.digpala.professions.slice(0, 2) ?? []),
  ]
  const fields = collectFields(classical, chart)
  for (const f of digpalaFields) {
    const hit = fields.find((x) => x.field === f)
    if (hit) hit.sources.push('Digpala')
    else fields.push({ field: f, sources: ['Digpala'] })
  }
  fields.sort((a, b) => b.sources.length - a.sources.length)

  let nakshatraSummary = ''
  try {
    nakshatraSummary = buildCareerFormula(chart).summary
  } catch {
    nakshatraSummary = 'Nakshatra career formula unavailable on this payload.'
  }

  const agrees = classical.mahatEmphasis.agrees
  const overlap = fields.filter((f) => f.sources.length >= 2)
  const confidence: 'high' | 'medium' | 'split' =
    agrees && overlap.length >= 2 ? 'high' : agrees || overlap.length >= 1 ? 'medium' : 'split'

  const profession = {
    headline: agrees
      ? `${classical.livelihood.winner.name} leads livelihood and D10 status`
      : `${classical.livelihood.winner.name} work · ${classical.mahatEmphasis.winner.name} status`,
    doThis: overlap.length
      ? `Prioritize: ${overlap.slice(0, 4).map((f) => f.field).join('; ')}.`
      : `Prioritize ${classical.livelihood.winner.fields.slice(0, 3).join('; ') || classical.livelihood.winner.name + ' significations'}.`,
    livelihoodPlanet: classical.livelihood.winner.name,
    digpalaFields: [...new Set(digpalaFields)].slice(0, 6),
    fields: fields.slice(0, 12),
    agreement: classical.mahatEmphasis.agreement,
    nakshatraSummary,
    confidence,
    sources: [
      'Phaladeepika livelihood',
      'Digpala profession lists',
      'Nakshatra profession engine',
      'D10 mahatphala lord',
      'D10 lagna rashi careers',
    ],
  }

  const track = buildTrack(analysis, classical)
  const foreign = buildForeign(analysis, classical)
  const boss = buildBoss(analysis)
  const lagnaLordId = SIGN_LORDS[analysis.d10Lagna]
  const tenthId = classical.tenthLord.id
  const vimsopaka = buildVimsopaka(chart, tenthId, lagnaLordId)
  const annual = buildAnnual(chart, analysis.d10Lagna, asOf)

  let transitHits: TransitHit[] = []
  let transitAvailable = false
  if (opts?.transitPositions?.length) {
    transitHits = mapTransitsToD10(opts.transitPositions, analysis.d10Lagna)
    transitAvailable = transitHits.length > 0
  }

  const hot = transitHits.filter((h) => [10, 11, 1, 6, 7].includes(h.house))
  const transit = {
    asOf: formatDay(asOf),
    available: transitAvailable,
    hits: transitHits,
    headline: transitAvailable
      ? hot.length
        ? `${hot.map((h) => h.name).join(', ')} activating D10 career houses`
        : 'Background gochara on the Dashamsha'
      : 'Transit snapshot unavailable',
    prediction: transitAvailable
      ? hot.length
        ? `Watch ${hot.map((h) => `${h.name} in H${h.house}`).join('; ')}. Gochara is cast into D10 houses from the Dashamsha lagna.`
        : 'No heavy planet is on D10 1/6/7/10/11 right now — timing leans on dasha more than gochara.'
      : 'Loading gochara from the ephemeris API, or open Transit with the Dashamsha lagna.',
  }

  const careerLords = [
    classical.livelihood.winner.id,
    classical.mahatEmphasis.winner.id,
    tenthId,
    ...(classical.amatyakaraka ? [classical.amatyakaraka.id] : []),
    a10Lord,
  ]
  const windows = buildWindows(chart, [...new Set(careerLords)])

  const headline = [
    profession.headline,
    `Mahatphala ${classical.mahatphala.gradeLabel} (${classical.mahatphala.score})`,
    track.id,
    foreign.active ? 'foreign lean' : null,
  ].filter(Boolean).join(' · ')

  const brief = buildBrief({
    name: chart.meta?.name || 'Chart',
    headline,
    a10,
    profession,
    track,
    foreign,
    boss,
    annual,
    classical,
    transit,
    windows,
  })

  return {
    framing:
      'One career desk: A10 for public title, Phaladeepika + Digpala + nakshatra for the work, BPHS track rules, foreign Digpala, boss from the 10th lord, Vimsopaka strength, Muntha year, D10 gochara, and dasha windows — then a copyable brief.',
    headline,
    a10,
    profession,
    track,
    foreign,
    boss,
    vimsopaka,
    annual,
    transit,
    windows,
    brief,
  }
}
