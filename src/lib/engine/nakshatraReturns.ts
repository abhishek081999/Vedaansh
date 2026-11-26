// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nakshatraReturns.ts
//  Moon-star timing from Swiss Ephemeris (server only — uses sweph):
//   • moonNakshatraSpans: exact Moon nakshatra entry/exit times
//   • janmaNakshatraDays: each monthly return of the Moon to the birth star
//   • vedicBirthdays: the star birthday — Moon in the birth star while
//     the Sun is in its natal sidereal sign
//   • moonCalendarMonth: Moon's star at ~sunrise (06:00 local) for each day
// ─────────────────────────────────────────────────────────────

import type { AyanamshaMode, Rashi } from '@/types/astrology'
import { getAyanamsha, getPlanetPosition, SWISSEPH_IDS, toSidereal } from './ephemeris'

const NAK_SPAN = 360 / 27
const JD_UNIX_EPOCH = 2440587.5
const MS_PER_DAY = 86_400_000
/** Moon moves ≤ ~15.4°/day, so a 6 h step can never skip a 13.33° star. */
const MOON_STEP_DAYS = 0.25
const SUN_STEP_DAYS = 1
const BISECT_EPS_DAYS = 1 / 1440 // one minute

export const jdFromMs = (ms: number) => ms / MS_PER_DAY + JD_UNIX_EPOCH
export const msFromJd = (jd: number) => (jd - JD_UNIX_EPOCH) * MS_PER_DAY

/** Sidereal longitude sampler; injectable so the scanners stay testable. */
export type LonSampler = (jd: number) => number

export function ephemerisSampler(body: 'Mo' | 'Su', mode: AyanamshaMode): LonSampler {
  const id = SWISSEPH_IDS[body]
  return (jd: number) => toSidereal(getPlanetPosition(jd, id, false).longitude, getAyanamsha(jd, mode))
}

const nakOf = (lon: number) => Math.min(26, Math.floor((((lon % 360) + 360) % 360) / NAK_SPAN))
const rashiOf = (lon: number) => (Math.floor((((lon % 360) + 360) % 360) / 30) + 1) as Rashi

/** Find the moment `classify` changes between a (value va) and b. */
function bisect<T>(a: number, b: number, va: T, classify: (jd: number) => T): number {
  let lo = a, hi = b
  while (hi - lo > BISECT_EPS_DAYS) {
    const mid = (lo + hi) / 2
    if (classify(mid) === va) lo = mid
    else hi = mid
  }
  return hi
}

export interface Span {
  index: number
  startJd: number
  endJd: number
  /** true when the span was cut by the scan window (real start/end lie outside). */
  clippedStart: boolean
  clippedEnd: boolean
}

function scanSpans(
  startJd: number,
  endJd: number,
  step: number,
  classify: (jd: number) => number,
): Span[] {
  const spans: Span[] = []
  let curIdx = classify(startJd)
  let curStart = startJd
  let clippedStart = true
  let t = startJd
  while (t < endJd) {
    const next = Math.min(t + step, endJd)
    const v = classify(next)
    if (v !== curIdx) {
      const edge = bisect(t, next, curIdx, classify)
      spans.push({ index: curIdx, startJd: curStart, endJd: edge, clippedStart, clippedEnd: false })
      // A boundary is crossed at most once per step for both Moon (6 h) and Sun (1 d).
      curIdx = v
      curStart = edge
      clippedStart = false
    }
    t = next
  }
  spans.push({ index: curIdx, startJd: curStart, endJd, clippedStart, clippedEnd: true })
  return spans
}

export function moonNakshatraSpans(startJd: number, endJd: number, moon: LonSampler): Span[] {
  return scanSpans(startJd, endJd, MOON_STEP_DAYS, jd => nakOf(moon(jd)))
}

export function sunRashiSpans(startJd: number, endJd: number, sun: LonSampler): Span[] {
  return scanSpans(startJd, endJd, SUN_STEP_DAYS, jd => rashiOf(sun(jd)))
}

export interface TimedWindow {
  start: string // ISO instant
  end: string
}

const toWindow = (s: { startJd: number; endJd: number }): TimedWindow => ({
  start: new Date(msFromJd(s.startJd)).toISOString(),
  end: new Date(msFromJd(s.endJd)).toISOString(),
})

/** Every return of the Moon to the birth star from `fromMs` over `days` days. */
export function janmaNakshatraDays(
  birthNak: number,
  fromMs: number,
  days: number,
  moon: LonSampler,
): TimedWindow[] {
  const start = jdFromMs(fromMs)
  return moonNakshatraSpans(start, start + days, moon)
    .filter(s => s.index === birthNak)
    .map(toWindow)
}

export interface VedicBirthday {
  year: number
  /** Sun's stay in the natal sidereal sign that begins in this year. */
  solarMonth: TimedWindow
  /** Moon in the birth star during that solar month (0, 1 or 2 times). */
  occurrences: TimedWindow[]
}

/**
 * Star birthday: the day the Moon is back in the birth nakshatra while the
 * Sun is in its natal sidereal sign. The star can fall twice in one solar
 * month; both are returned and the UI says that family tradition decides.
 */
export function vedicBirthdays(
  birthNak: number,
  natalSunRashi: Rashi,
  fromYear: number,
  years: number,
  moon: LonSampler,
  sun: LonSampler,
): VedicBirthday[] {
  const out: VedicBirthday[] = []
  for (let y = fromYear; y < fromYear + years; y++) {
    const yStart = jdFromMs(Date.UTC(y, 0, 1))
    // Scan a little past the year so a sign entered in late December is complete.
    const signSpans = sunRashiSpans(yStart, yStart + 400, sun)
      .filter(s => s.index === natalSunRashi && !s.clippedStart && s.startJd < jdFromMs(Date.UTC(y + 1, 0, 1)))
    const month = signSpans[0]
    if (!month) continue
    const occurrences = moonNakshatraSpans(month.startJd, month.endJd, moon)
      .filter(s => s.index === birthNak)
      .map(toWindow)
    out.push({ year: y, solarMonth: toWindow(month), occurrences })
  }
  return out
}

export interface MoonCalendarDay {
  /** Local civil date YYYY-MM-DD. */
  date: string
  /** Moon's star at 06:00 local time (≈ sunrise, the day's governing star). */
  nakshatraIndex: number
  /** Star changes during the local day, if any. */
  changes: Array<{ at: string; toIndex: number }>
}

/**
 * Day-by-day Moon star for a calendar month. `tzOffsetMinutes` is the
 * viewer's offset east of UTC (IST = +330).
 */
export function moonCalendarMonth(
  year: number,
  month: number,
  tzOffsetMinutes: number,
  moon: LonSampler,
): MoonCalendarDay[] {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const localMidnightMs = (d: number) => Date.UTC(year, month - 1, d) - tzOffsetMinutes * 60_000
  const start = jdFromMs(localMidnightMs(1))
  const spans = moonNakshatraSpans(start, start + daysInMonth + 1, moon)
  const idxAt = (jd: number) => spans.find(s => jd >= s.startJd && jd < s.endJd)?.index ?? nakOf(moon(jd))

  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1
    const dayStart = jdFromMs(localMidnightMs(d))
    const dayEnd = dayStart + 1
    const changes = spans
      .filter(s => !s.clippedStart && s.startJd > dayStart && s.startJd < dayEnd)
      .map(s => ({ at: new Date(msFromJd(s.startJd)).toISOString(), toIndex: s.index }))
    return {
      date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      nakshatraIndex: idxAt(dayStart + 0.25),
      changes,
    }
  })
}
