// ─────────────────────────────────────────────────────────────
//  src/lib/engine/transitPredictions.ts
//  Written predictions from a transit forecast — overview, per
//  life area, month by month and per window (expect / do / avoid).
//  Pure text synthesis over TransitForecastReport + slow-planet
//  house themes; no ephemeris calls of its own.
// ─────────────────────────────────────────────────────────────

import { GRAHA_NAMES, type GrahaId } from '@/types/astrology'
import { FORECAST_AREAS, type ForecastAreaId } from '@/lib/engine/transitForecastAreas'
import { TRANSIT_INTERPRETATIONS } from '@/lib/engine/transits'
import type {
  ForecastPoint,
  ForecastTrackSegment,
  ForecastWindow,
  TransitForecastReport,
} from '@/lib/engine/transitForecast'

export type PredictionTone = 'supportive' | 'mixed' | 'pressure'

export interface AreaPrediction {
  id: ForecastAreaId
  label: string
  tone: PredictionTone
  verdict: string
  now: string
  ahead: string
  themes: string[]
  doList: string[]
  avoidList: string[]
}

export interface MonthPrediction {
  month: string // YYYY-MM
  score: number
  tone: PredictionTone
  headline: string
  text: string
  bestArea: string
  watchArea: string
  events: string[]
}

export interface WindowPrediction {
  kind: ForecastWindow['kind']
  startIso: string
  endIso: string
  title: string
  expect: string
  doList: string[]
  avoidList: string[]
}

export interface ForecastPredictions {
  overview: string[]
  areas: AreaPrediction[]
  months: MonthPrediction[]
  windows: WindowPrediction[]
}

type ForecastCore = Omit<TransitForecastReport, 'predictions'>

// ── Phrase banks ─────────────────────────────────────────────

interface AreaVoice {
  noun: string
  good: string
  hard: string
  doGood: string[]
  avoidGood: string[]
  doHard: string[]
  avoidHard: string[]
}

const VOICE: Record<ForecastAreaId, AreaVoice> = {
  career: {
    noun: 'career and public standing',
    good: 'recognition, promotions, new responsibilities and visible progress at work',
    hard: 'heavier workload, scrutiny from seniors and slower results for the effort you put in',
    doGood: ['Pitch for the role, raise or project you want', 'Launch work that needs visibility', 'Meet decision-makers and mentors'],
    avoidGood: ['Coasting on past wins', 'Over-committing to every opportunity'],
    doHard: ['Document your work and deliver steadily', 'Strengthen skills quietly', 'Keep relations with authority clean'],
    avoidHard: ['Impulsive resignations or job switches', 'Open conflict with bosses', 'Cutting corners on compliance'],
  },
  wealth: {
    noun: 'money, savings and gains',
    good: 'income growth, profitable deals, returns on earlier effort and support from networks',
    hard: 'unexpected expenses, delayed payments and pressure on savings',
    doGood: ['Negotiate fees and salary', 'Invest in long-term, well-researched assets', 'Collect pending dues'],
    avoidGood: ['Lifestyle inflation', 'Lending without paperwork'],
    doHard: ['Build a cash buffer and track spending', 'Clear high-interest debt first', 'Review insurance and contracts'],
    avoidHard: ['Speculation and leveraged bets', 'Large unplanned purchases', 'Signing guarantees for others'],
  },
  relationships: {
    noun: 'partnership, marriage and close bonds',
    good: 'warmth, commitment, new connections and smoother cooperation with partners',
    hard: 'misunderstandings, distance or tests of commitment in close relationships',
    doGood: ['Have the important conversation or proposal', 'Plan shared goals and time together', 'Formalise good partnerships'],
    avoidGood: ['Taking a partner for granted', 'Rushing contracts without review'],
    doHard: ['Listen before reacting', 'Give space and keep promises small and kept', 'Seek counsel before big decisions'],
    avoidHard: ['Ultimatums and decisions in anger', 'Starting partnerships in a hurry', 'Airing disputes publicly'],
  },
  home: {
    noun: 'home, family and inner peace',
    good: 'family harmony, comfort, property or vehicle gains and emotional ease',
    hard: 'domestic friction, renovation or relocation stress and worries about parents',
    doGood: ['Buy, renovate or settle home matters', 'Host family and mend old rifts', 'Invest in comfort and rest'],
    avoidGood: ['Neglecting elders’ needs'],
    doHard: ['Keep routines calm at home', 'Check property papers carefully', 'Spend time with your mother/elders'],
    avoidHard: ['Hasty property deals or moves', 'Bringing work stress home'],
  },
  health: {
    noun: 'health and vitality',
    good: 'good energy, confidence and quick recovery',
    hard: 'fatigue, stress-related complaints and lower resistance',
    doGood: ['Start a fitness or diet routine', 'Take on physically demanding goals'],
    avoidGood: ['Overexertion just because energy is high'],
    doHard: ['Prioritise sleep and regular check-ups', 'Reduce stimulants and overwork', 'Use breath-work or meditation'],
    avoidHard: ['Ignoring early symptoms', 'Risky sports and rash driving', 'Elective procedures without second opinions'],
  },
  growth: {
    noun: 'learning, faith and higher purpose',
    good: 'study success, guidance from teachers, travel and spiritual progress',
    hard: 'doubt, friction with mentors or institutions and delayed study results',
    doGood: ['Enrol in courses or certifications', 'Plan pilgrimage or long-distance travel', 'Seek a teacher or mentor'],
    avoidGood: ['Dogmatism'],
    doHard: ['Keep up quiet daily practice', 'Revise fundamentals', 'Serve elders and teachers'],
    avoidHard: ['Abandoning studies midway', 'Arguing with gurus or authorities'],
  },
}

const MONTH_OPENERS: Record<PredictionTone, string[]> = {
  supportive: ['A productive, forward-moving month.', 'Momentum is with you this month.', 'A favourable month to act on plans.'],
  mixed: ['A month of mixed signals — choose priorities carefully.', 'Steady rather than spectacular.', 'An even month; consistent effort pays.'],
  pressure: ['A demanding month — pace yourself.', 'Expect friction and slower results this month.', 'A month for patience and consolidation.'],
}

// ── Helpers ──────────────────────────────────────────────────

function toneOf(score: number): PredictionTone {
  if (score >= 56) return 'supportive'
  if (score <= 44) return 'pressure'
  return 'mixed'
}

function fmtMonth(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso.slice(0, 7)}-15T12:00:00Z`))
}

function fmtDay(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`))
}

function fmtRange(a: string, b: string): string {
  return `${fmtDay(a)} – ${fmtDay(b)}`
}

function grahaName(id?: GrahaId): string {
  return id ? GRAHA_NAMES[id] ?? id : ''
}

function avg(values: number[]): number {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : 50
}

/** First `n` comma-separated phrases of a voice string, joined naturally. */
function lead(s: string, n = 1): string {
  return s.split(',').map(x => x.trim()).filter(Boolean).slice(0, n).join(' and ')
}

function lowerFirst(s: string): string {
  return s ? s[0].toLowerCase() + s.slice(1) : s
}

/** Weakest contiguous stretch (≥3 samples) of an area series. */
function weakestStretch(points: ForecastPoint[], id: ForecastAreaId): { startIso: string; endIso: string; avg: number } | null {
  const series = points.map(p => p.areas[id].score)
  const thr = Math.min(44, [...series].sort((a, b) => a - b)[Math.floor(series.length * 0.2)] ?? 44)
  let best: { s: number; e: number; a: number } | null = null
  let start = -1
  for (let i = 0; i <= series.length; i += 1) {
    const ok = i < series.length && series[i] <= thr
    if (ok && start < 0) start = i
    if (!ok && start >= 0) {
      if (i - start >= 3) {
        const a = avg(series.slice(start, i))
        if (!best || a < best.a) best = { s: start, e: i - 1, a }
      }
      start = -1
    }
  }
  return best ? { startIso: points[best.s].dateIso, endIso: points[best.e].dateIso, avg: Math.round(best.a) } : null
}

/** Slow-planet themes for houses of an area that are occupied right now. */
function areaThemes(id: ForecastAreaId, tracks: ForecastTrackSegment[], asOfIso: string): string[] {
  const def = FORECAST_AREAS.find(a => a.id === id)
  if (!def) return []
  const houses = new Set([...def.primary, ...def.secondary])
  const out: string[] = []
  for (const t of tracks) {
    if (t.planet === 'Ma') continue
    if (!(t.startIso <= asOfIso && asOfIso < t.endIso)) continue
    if (!houses.has(t.houseFromLagna)) continue
    const theme = TRANSIT_INTERPRETATIONS[t.planet]?.[t.houseFromLagna]
    if (theme) out.push(`${GRAHA_NAMES[t.planet]} in your ${t.houseFromLagna}${ordSuffix(t.houseFromLagna)} house (${t.signName}, until ${fmtDay(t.endIso)}): ${theme}`)
  }
  return out
}

function ordSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] ?? s[v] ?? s[0]
}

// ── Builders ─────────────────────────────────────────────────

function buildOverview(r: ForecastCore, areaAvg: Array<{ label: string; v: number }>): string[] {
  // The headline already leads the hero, so the overview starts with the drivers.
  const out: string[] = []
  const plus = r.now.drivers.filter(d => d.impact > 0).slice(0, 2)
  const minus = r.now.drivers.filter(d => d.impact < 0).slice(0, 2)
  if (plus.length || minus.length) {
    const parts: string[] = []
    if (plus.length) parts.push(`support comes from ${plus.map(d => `${d.planetName} (${d.houseFromMoon}${ordSuffix(d.houseFromMoon)} from Moon)`).join(' and ')}`)
    if (minus.length) parts.push(`pressure comes from ${minus.map(d => `${d.planetName} (${d.houseFromMoon}${ordSuffix(d.houseFromMoon)} from Moon)`).join(' and ')}`)
    out.push(`Right now ${parts.join(', while ')}.`)
  }
  if (r.now.md) {
    const lords = [r.now.md, r.now.ad].filter((x, i, a): x is GrahaId => !!x && a.indexOf(x) === i)
    const lordDrivers = r.now.drivers.filter(d => lords.includes(d.planet))
    const state = lordDrivers.length
      ? lordDrivers.map(d => `${d.planetName} is ${d.status === 'favourable' ? 'well placed' : d.status === 'vedha' ? 'obstructed' : 'under strain'} in transit`).join('; ')
      : 'their transits are neutral'
    out.push(`You are running ${grahaName(r.now.md)} Mahadasha / ${grahaName(r.now.ad)} Antardasha — ${state}, so dasha results ${lordDrivers.some(d => d.impact < 0) ? 'need more effort to show' : 'can manifest readily'}.`)
  }
  const sorted = [...areaAvg].sort((a, b) => b.v - a.v)
  const fav = r.windows.filter(w => w.kind === 'favourable').sort((a, b) => b.avg - a.avg)[0]
  const caution = r.windows.filter(w => w.kind === 'caution').sort((a, b) => a.avg - b.avg)[0]
  const yearBits = [`Over the period, ${sorted[0].label.toLowerCase()} is your strongest area and ${sorted[sorted.length - 1].label.toLowerCase()} needs the most care.`]
  if (fav) yearBits.push(`The best stretch is ${fmtRange(fav.startIso, fav.endIso)}.`)
  if (caution) yearBits.push(`The toughest is ${fmtRange(caution.startIso, caution.endIso)} — plan lighter commitments then.`)
  out.push(yearBits.join(' '))
  return out
}

function buildAreas(r: ForecastCore): AreaPrediction[] {
  return r.areaOutlooks.map(o => {
    const v = VOICE[o.id]
    const tone = toneOf(o.now)
    const verdict = tone === 'supportive'
      ? `Favourable for ${v.noun}.`
      : tone === 'pressure' ? `A testing phase for ${v.noun}.` : `Mixed conditions for ${v.noun}.`
    const nowText = tone === 'supportive'
      ? `Expect ${v.good}.`
      : tone === 'pressure' ? `Expect ${v.hard}.` : `Some ${lead(v.good)} is possible, alongside ${lead(v.hard)}.`
    const trend = o.trend === 'rising' ? ' Conditions improve over the coming weeks.'
      : o.trend === 'falling' ? ' Conditions soften over the coming weeks — use the present window.' : ''
    const ahead: string[] = []
    if (o.bestWindow) ahead.push(`Peak period: ${fmtRange(o.bestWindow.startIso, o.bestWindow.endIso)} — the best time for ${lead(v.good)}.`)
    if (o.nextDoubleTransitIso) {
      ahead.push(o.nextDoubleTransitIso <= r.asOfIso
        ? 'Jupiter and Saturn both influence this area now (double transit) — concrete events are likely.'
        : `Jupiter + Saturn double transit from ${fmtDay(o.nextDoubleTransitIso)} — a classic trigger for concrete events here.`)
    }
    const weak = weakestStretch(r.points, o.id)
    if (weak) ahead.push(`Go carefully ${fmtRange(weak.startIso, weak.endIso)}, when ${lead(v.hard)} is more likely.`)
    if (!ahead.length) ahead.push('No sharp peaks or dips ahead — results follow effort.')

    return {
      id: o.id,
      label: o.label,
      tone,
      verdict,
      now: `${nowText}${trend}`,
      ahead: ahead.join(' '),
      themes: [...areaThemes(o.id, r.tracks, r.asOfIso), ...o.notes].slice(0, 4),
      doList: tone === 'pressure' ? v.doHard : v.doGood,
      avoidList: tone === 'pressure' ? v.avoidHard : v.avoidGood,
    }
  })
}

function buildMonths(r: ForecastCore): MonthPrediction[] {
  const groups = new Map<string, ForecastPoint[]>()
  for (const p of r.points) {
    const k = p.dateIso.slice(0, 7)
    groups.set(k, [...(groups.get(k) ?? []), p])
  }
  let i = 0
  const out: MonthPrediction[] = []
  for (const [month, pts] of groups) {
    if (pts.length < 2 && out.length > 0) continue // partial trailing month
    const score = Math.round(avg(pts.map(p => p.overall)))
    const tone = toneOf(score)
    const areaScores = FORECAST_AREAS.map(a => ({ a, v: avg(pts.map(p => p.areas[a.id].score)) })).sort((x, y) => y.v - x.v)
    const best = areaScores[0]
    const watch = areaScores[areaScores.length - 1]
    const evs = r.events.filter(e => e.dateIso.slice(0, 7) === month)
    const slowEvs = evs.filter(e => e.kind === 'dasha' || ['Ju', 'Sa', 'Ra', 'Ke'].includes(e.planet))
    const opener = MONTH_OPENERS[tone][i % MONTH_OPENERS[tone].length]
    const sentences = [
      opener,
      `${best.a.label} is the bright spot — ${lowerFirst(lead(VOICE[best.a.id].good, 2))}.`,
    ]
    if (watch.v <= 46) sentences.push(`Watch ${watch.a.label.toLowerCase()}: ${lead(VOICE[watch.a.id].hard)}.`)
    if (slowEvs.length) sentences.push(`Turning point${slowEvs.length > 1 ? 's' : ''}: ${slowEvs.map(e => `${e.label} (${fmtDay(e.dateIso).replace(/ \d{4}$/, '')})`).join('; ')}.`)
    const dt = FORECAST_AREAS.filter(a => pts.some(p => p.areas[a.id].doubleTransit))
    if (dt.length) sentences.push(`Double transit active on ${dt.map(a => a.label.toLowerCase()).join(', ')}.`)
    out.push({
      month,
      score,
      tone,
      headline: `${fmtMonth(month)} · ${tone === 'supportive' ? 'Supportive' : tone === 'pressure' ? 'Challenging' : 'Mixed'}`,
      text: sentences.join(' '),
      bestArea: best.a.label,
      watchArea: watch.a.label,
      events: [...evs].sort((a, b) => a.dateIso.localeCompare(b.dateIso)).map(e => `${fmtDay(e.dateIso).replace(/ \d{4}$/, '')} — ${e.label}`),
    })
    i += 1
  }
  return out
}

function buildWindowPredictions(r: ForecastCore): WindowPrediction[] {
  return r.windows.map(w => {
    const v = VOICE[w.leadArea]
    const good = w.kind === 'favourable'
    return {
      kind: w.kind,
      startIso: w.startIso,
      endIso: w.endIso,
      title: `${good ? 'Opportunity' : 'Caution'} · ${w.leadAreaLabel} · ${fmtRange(w.startIso, w.endIso)}`,
      expect: good
        ? `${w.summary} Expect ${v.good}.`
        : `${w.summary} Expect ${v.hard}.`,
      doList: good ? v.doGood : v.doHard,
      avoidList: good ? v.avoidGood : v.avoidHard,
    }
  })
}

export function buildForecastPredictions(r: ForecastCore): ForecastPredictions {
  const areaAvg = r.areaOutlooks.map(o => ({ label: o.label, v: o.avg }))
  return {
    overview: buildOverview(r, areaAvg),
    areas: buildAreas(r),
    months: buildMonths(r),
    windows: buildWindowPredictions(r),
  }
}
