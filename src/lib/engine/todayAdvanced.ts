// ─────────────────────────────────────────────────────────────
//  src/lib/engine/todayAdvanced.ts
//  Advanced lenses for Today's Reading. Each one answers a question the
//  Moon-and-gochar summary cannot:
//    Kakshya      — WHEN inside a sign does a transit give its result?
//                   (3°45' sub-divisions, Prastara bindus; the Moon's
//                   kakshya windows are an intraday timing tool)
//    Sudarshana   — do Lagna, Moon and Sun all agree about a planet?
//    Day timeline — hora-by-hora score personalised with your chart, and
//                   the best slot for each kind of activity using YOUR
//                   house lords (10th for career, 7th for partnership...)
//  Pure engine: no ephemeris, DB or React.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { RASHI_LORDS } from '@/lib/engine/houseInterpretations'
import { GOCHAR_FAVOURABLE, houseFrom, isGocharPlanet } from '@/lib/engine/gocharRules'
import { KAKSHYA_LORDS, KAKSHYA_SPAN_DEG, kakshyaIndexFromDegree } from '@/lib/engine/ashtakavargaKakshya'
import type { DashaDay, GocharRow, MoonDay, TodayPanchangInput, TodayTransitGraha } from '@/lib/engine/todayReading'
import type { PredictionNatalInput } from '@/lib/engine/todayPredictions'

// ── Input / output contracts ─────────────────────────────────

export interface AdvancedNatalInput extends Omit<PredictionNatalInput, 'ashtakavarga'> {
  ashtakavarga?: {
    bav: Record<string, { bindus: number[] }>
    sav: number[]
    /** Needed for Kakshya; absent on charts calculated before Prastara was stored. */
    prastara?: Record<string, { byContributor: Record<string, number[]> }>
  }
}

export interface BuildAdvancedInput {
  natal: AdvancedNatalInput
  transit: TodayTransitGraha[]
  panchang: TodayPanchangInput
  reading: { moon: MoonDay; gochar: GocharRow[]; dasha: DashaDay[] }
  now?: Date
}

export type Tone3 = 'good' | 'mixed' | 'caution'

export interface KakshyaRow {
  planet: GrahaId
  planetName: string
  rashiName: string
  degreeInSign: number
  kakshyaLord: string
  /** null when the chart has no Prastara data. */
  hasBindu: boolean | null
  bav: number
  sav: number
  verdict: 'strong' | 'steady' | 'weak'
  note: string
}

export interface MoonKakshyaWindow {
  startIso: string
  endIso: string
  rashiName: string
  kakshyaLord: string
  favourable: boolean
  current: boolean
}

export interface SudarshanaRow {
  planet: GrahaId
  planetName: string
  houses: { lagna: number; moon: number; sun: number }
  good: number
  verdict: 'Confirmed supportive' | 'Mostly supportive' | 'Mostly testing' | 'Confirmed testing'
}

export interface HoraSegment {
  lord: GrahaId
  lordName: string
  startIso: string
  endIso: string
  score: number
  tone: Tone3
  current: boolean
  past: boolean
  /** Short reasons: choghadiya, Rahu overlap, strong/weak lord, personal house lord. */
  notes: string[]
  avoid: boolean
}

export interface ActivitySlot {
  activity: string
  slot: HoraSegment | null
  /** Why this hora suits the activity, in terms of the user's own chart. */
  why: string
}

export interface TodayAdvanced {
  kakshya: { rows: KakshyaRow[]; moonWindows: MoonKakshyaWindow[] } | null
  sudarshana: { rows: SudarshanaRow[]; summary: string[] }
  timeline: { segments: HoraSegment[]; best: HoraSegment[]; activities: ActivitySlot[] } | null
}

// ── Helpers ──────────────────────────────────────────────────

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const ms = (iso: string) => Date.parse(iso)
const BAV_PLANETS = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const
const BENEFIC = new Set<GrahaId>(['Ju', 'Ve', 'Me', 'Mo'])
const HORA_LORDS = new Set<GrahaId>(['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'])
const lordOfSign = (rashi: number): GrahaId => RASHI_LORDS[(rashi - 1 + 12) % 12].lord
const kakshyaName = (l: string) => (l === 'As' ? 'Lagna' : GRAHA_NAMES[l as GrahaId] ?? l)

// ── 1. Kakshya ───────────────────────────────────────────────

function buildKakshya(input: BuildAdvancedInput, nowMs: number): TodayAdvanced['kakshya'] {
  const av = input.natal.ashtakavarga
  if (!av) return null
  const rows: KakshyaRow[] = []

  for (const planet of BAV_PLANETS) {
    const t = input.transit.find(g => g.id === planet)
    if (!t) continue
    const idx = kakshyaIndexFromDegree(t.degree)
    const lord = KAKSHYA_LORDS[idx]
    const bav = av.bav[planet]?.bindus?.[t.rashi - 1] ?? 0
    const sav = av.sav[t.rashi - 1] ?? 0
    const pr = av.prastara?.[planet]?.byContributor?.[lord]
    const hasBindu = pr ? pr[t.rashi - 1] === 1 : null

    const verdict: KakshyaRow['verdict'] =
      bav >= 5 && hasBindu !== false ? 'strong'
        : bav <= 3 && hasBindu !== true ? 'weak'
          : 'steady'
    const where = `${t.degree.toFixed(1)}° ${RASHI_NAMES[t.rashi]}`
    const note = hasBindu === null
      ? `${GRAHA_NAMES[planet]} at ${where}: ${bav} bindus in this sign.`
      : hasBindu
        ? `${GRAHA_NAMES[planet]} at ${where} is in ${kakshyaName(lord)}'s kakshya, which carries a bindu: its results can land cleanly now.`
        : `${GRAHA_NAMES[planet]} at ${where} is in ${kakshyaName(lord)}'s kakshya with no bindu: its results are held back until it moves on.`
    rows.push({
      planet, planetName: GRAHA_NAMES[planet], rashiName: RASHI_NAMES[t.rashi],
      degreeInSign: Math.round(t.degree * 10) / 10, kakshyaLord: kakshyaName(lord),
      hasBindu, bav, sav, verdict, note,
    })
  }

  // The Moon changes kakshya every ~7 hours: walk its longitude forward 24h.
  const moonWindows: MoonKakshyaWindow[] = []
  const tm = input.transit.find(g => g.id === 'Mo')
  const moPrastara = av.prastara?.Mo?.byContributor
  if (tm && moPrastara && tm.speed && tm.speed > 0) {
    const horizonMs = nowMs + 24 * 3_600_000
    let lon: number = tm.lonSidereal
    let t: number = nowMs
    while (t < horizonMs && moonWindows.length < 10) {
      const nextBoundary: number = (Math.floor(lon / KAKSHYA_SPAN_DEG + 1e-9) + 1) * KAKSHYA_SPAN_DEG
      const end: number = Math.min(horizonMs, t + ((nextBoundary - lon) / tm.speed) * 86_400_000)
      // Classify the segment by its midpoint: its start sits exactly on a kakshya boundary,
      // where floating-point error could otherwise pick the previous kakshya.
      const midLon: number = (((lon + ((end - t) / 86_400_000) * tm.speed / 2) % 360) + 360) % 360
      const rashi = (Math.floor(midLon / 30) + 1) as Rashi
      const degInSign: number = midLon % 30
      const lord = KAKSHYA_LORDS[kakshyaIndexFromDegree(degInSign)]
      const favourable = moPrastara[lord]?.[rashi - 1] === 1
      const prev = moonWindows[moonWindows.length - 1]
      if (prev && prev.favourable === favourable && prev.rashiName === RASHI_NAMES[rashi]) {
        prev.endIso = new Date(end).toISOString()
      } else {
        moonWindows.push({
          startIso: new Date(t).toISOString(), endIso: new Date(end).toISOString(),
          rashiName: RASHI_NAMES[rashi], kakshyaLord: kakshyaName(lord), favourable, current: moonWindows.length === 0,
        })
      }
      lon += ((end - t) / 86_400_000) * tm.speed
      t = end
    }
  }

  return { rows, moonWindows }
}

// ── 2. Sudarshana Chakra ─────────────────────────────────────

function buildSudarshana(input: BuildAdvancedInput): TodayAdvanced['sudarshana'] {
  const natalBy = (id: GrahaId) => input.natal.grahas.find(g => g.id === id)
  const lagna = input.natal.lagnas.ascRashi
  const moonSign = natalBy('Mo')?.rashi
  const sunSign = natalBy('Su')?.rashi
  if (!moonSign || !sunSign) return { rows: [], summary: [] }

  const rows: SudarshanaRow[] = []
  for (const planet of ['Su', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'] as const) {
    const t = input.transit.find(g => g.id === planet)
    if (!t || !isGocharPlanet(planet)) continue
    const houses = {
      lagna: houseFrom(t.rashi, lagna),
      moon: houseFrom(t.rashi, moonSign),
      sun: houseFrom(t.rashi, sunSign),
    }
    const fav = GOCHAR_FAVOURABLE[planet]
    // From the Moon the table is applied with Vedha (already resolved in the reading).
    const moonRow = input.reading.gochar.find(r => r.planet === planet)
    const moonGood = moonRow ? moonRow.status === 'favourable' : fav.includes(houses.moon)
    const good = (fav.includes(houses.lagna) ? 1 : 0) + (moonGood ? 1 : 0) + (fav.includes(houses.sun) ? 1 : 0)
    rows.push({
      planet, planetName: GRAHA_NAMES[planet], houses, good,
      verdict: good === 3 ? 'Confirmed supportive' : good === 2 ? 'Mostly supportive' : good === 1 ? 'Mostly testing' : 'Confirmed testing',
    })
  }

  const summary: string[] = []
  const names = (v: SudarshanaRow['verdict']) => rows.filter(r => r.verdict === v).map(r => r.planetName)
  const sup = names('Confirmed supportive')
  const test = names('Confirmed testing')
  if (sup.length) summary.push(`${sup.join(', ')} ${sup.length > 1 ? 'are' : 'is'} supportive from Lagna, Moon and Sun alike: the most dependable good influence${sup.length > 1 ? 's' : ''} today.`)
  if (test.length) summary.push(`${test.join(', ')} ${test.length > 1 ? 'are' : 'is'} testing from all three reference points: the most dependable pressure${test.length > 1 ? 's' : ''} today.`)
  if (!sup.length && !test.length) summary.push('The three reference points disagree about most planets today, so no single influence dominates.')
  return { rows, summary }
}

// ── 3. Day timeline ──────────────────────────────────────────

interface ActivityDef { activity: string; houses: number[]; generic: GrahaId[] }

const ACTIVITIES: ActivityDef[] = [
  { activity: 'Career & authority', houses: [10, 1], generic: ['Su', 'Ju', 'Sa'] },
  { activity: 'Money & deals', houses: [2, 11], generic: ['Ju', 'Ve', 'Me'] },
  { activity: 'Partnership & love', houses: [7], generic: ['Ve', 'Mo'] },
  { activity: 'Study & communication', houses: [5, 3], generic: ['Me', 'Ju'] },
  { activity: 'New beginnings', houses: [1], generic: ['Su', 'Mo', 'Ju'] },
  { activity: 'Legal, rivals & conflict', houses: [6], generic: ['Ma', 'Sa'] },
]

function buildTimeline(input: BuildAdvancedInput, nowMs: number): TodayAdvanced['timeline'] {
  const { natal, panchang, reading } = input
  const table = panchang.horaTable ?? []
  if (table.length === 0) return null

  const lagna = natal.lagnas.ascRashi
  const natalBy = (id: GrahaId) => natal.grahas.find(g => g.id === id)
  const avoidSpans = [
    { label: 'Rahu Kalam', ...panchang.rahuKalam },
    { label: 'Yamaganda', ...panchang.yamaganda },
    { label: 'Gulika Kalam', ...panchang.gulikaKalam },
  ].map(a => ({ label: a.label, start: ms(a.start), end: ms(a.end) })).filter(a => Number.isFinite(a.start) && Number.isFinite(a.end))
  const slots = [...(panchang.choghadiya?.day ?? []), ...(panchang.choghadiya?.night ?? [])]
  const abhijit = panchang.abhijitMuhurta ? { start: ms(panchang.abhijitMuhurta.start), end: ms(panchang.abhijitMuhurta.end) } : null

  // House lords of this lagna, so horas can be matched to the user's own chart.
  const houseLord = (h: number): GrahaId => lordOfSign((((lagna - 1 + h - 1) % 12) + 1))

  const segments: HoraSegment[] = table.filter(h => HORA_LORDS.has(h.lord)).map((h): HoraSegment => {
    const start = ms(h.start)
    const end = ms(h.end)
    const mid = (start + end) / 2
    const notes: string[] = []
    let s = 50

    if (BENEFIC.has(h.lord)) s += 6
    else s -= 3

    const g = natalBy(h.lord)
    if (g) {
      if (['exalted', 'own', 'moolatrikona'].includes(g.dignity)) { s += 9; notes.push(`${GRAHA_NAMES[h.lord]} is strong in your chart`) }
      else if (g.dignity === 'debilitated') { s -= 9; notes.push(`${GRAHA_NAMES[h.lord]} is weak in your chart`) }
    }
    const ratio = natal.shadbala?.planets?.[h.lord]?.ratio
    if (typeof ratio === 'number') s += ratio >= 1.15 ? 5 : ratio < 0.85 ? -5 : 0

    if (h.lord === 'Mo') s += reading.moon.chandraQuality === 'good' ? 7 : reading.moon.chandraQuality === 'bad' ? -7 : 0
    else {
      const row = reading.gochar.find(r => r.planet === h.lord)
      if (row) s += row.status === 'favourable' ? 6 : row.status === 'unfavourable' ? -6 : -1
    }

    const slot = slots.find(c => mid >= ms(c.start) && mid < ms(c.end))
    if (slot) {
      s += slot.quality === 'good' ? 7 : slot.quality === 'avoid' ? -9 : 0
      notes.push(`${slot.name} choghadiya`)
    }
    const hit = avoidSpans.find(a => mid >= a.start && mid < a.end)
    if (hit) { s -= 14; notes.push(hit.label) }
    if (abhijit && mid >= abhijit.start && mid < abhijit.end) { s += 10; notes.push('Abhijit Muhurta') }

    const score = Math.round(clamp(s, 5, 95))
    const owned = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter(x => houseLord(x) === h.lord)
    if (owned.length) notes.push(`rules your ${owned.slice(0, 3).map(x => `${x}${x === 1 ? 'st' : x === 2 ? 'nd' : x === 3 ? 'rd' : 'th'}`).join('/')}`)

    return {
      lord: h.lord, lordName: GRAHA_NAMES[h.lord], startIso: h.start, endIso: h.end,
      score, tone: score >= 62 ? 'good' : score < 42 ? 'caution' : 'mixed',
      current: nowMs >= start && nowMs < end, past: end <= nowMs, notes,
      avoid: Boolean(hit) || slot?.quality === 'avoid',
    }
  })

  const upcoming = segments.filter(s => !s.past)
  const best = [...upcoming].filter(s => !s.avoid).sort((a, b) => b.score - a.score).slice(0, 3)
    .sort((a, b) => ms(a.startIso) - ms(b.startIso))

  // Spread the picks: if a purpose's best hora is already taken by an earlier purpose and a
  // nearly-as-good alternative exists, take the alternative so the plan is not one slot repeated.
  const taken = new Set<string>()
  const activities: ActivitySlot[] = ACTIVITIES.map(def => {
    const personal = new Set(def.houses.map(houseLord))
    const ranked = upcoming
      .filter(s => !s.avoid && s.score >= 48)
      .map(s => ({ s, fit: s.score + (personal.has(s.lord) ? 14 : 0) + (def.generic.includes(s.lord) ? 8 : 0) }))
      .filter(x => personal.has(x.s.lord) || def.generic.includes(x.s.lord))
      .sort((a, b) => b.fit - a.fit)
    const top = ranked[0]
    const alt = top ? ranked.find(x => !taken.has(x.s.startIso) && x.fit >= top.fit - 8) : undefined
    const pick = (alt ?? top)?.s ?? null
    if (pick) taken.add(pick.startIso)
    const housesTxt = def.houses.map(h => `${h}${h === 1 ? 'st' : h === 2 ? 'nd' : h === 3 ? 'rd' : 'th'}`).join('/')
    const why = pick
      ? personal.has(pick.lord)
        ? `${pick.lordName} is the lord of your ${housesTxt} house${def.houses.length > 1 ? 's' : ''}, so its hora speaks for this area of your life.`
        : `${pick.lordName} is the natural significator for this, and it scores well for you today.`
      : 'No clear hora remains today that is both suitable and clear of Rahu, Yamaganda and Gulika.'
    return { activity: def.activity, slot: pick, why }
  })

  return { segments, best, activities }
}

// ── Main ─────────────────────────────────────────────────────

export function buildTodayAdvanced(input: BuildAdvancedInput): TodayAdvanced {
  const now = input.now ?? new Date()
  const nowMs = now.getTime()
  return {
    kakshya: buildKakshya(input, nowMs),
    sudarshana: buildSudarshana(input),
    timeline: buildTimeline(input, nowMs),
  }
}
