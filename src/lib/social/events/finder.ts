// ─────────────────────────────────────────────────────────────
//  src/lib/social/events/finder.ts   (server-only: uses sweph)
//  Content-calendar event finder for the Social Studio.
//
//  • Vrats      — Ekadashi (both pakshas), Purnima, Amavasya at sunrise;
//                 Pradosh (Trayodashi at pradosh kaal); Sankashti
//                 (Krishna Chaturthi at moonrise).
//  • Festivals  — FESTIVAL_RULES matched on amanta masa + tithi at the
//                 rule's observance instant; solar ones on Sun ingress.
//  • Sankranti / ingress / retrograde — calculatePersonalTransits(1, …),
//                 then refined to the exact instant so dates are local (IST).
//
//  Day rules: a tithi "prevails" on civil day d if it is current at d's
//  observance instant. If a tithi is current at no instant (kshaya), it is
//  assigned to the day during which it begins and ends. If it prevails at two
//  consecutive instants (vriddhi), the first day is used (smarta convention).
//  Lahiri ayanamsha throughout; default location New Delhi.
// ─────────────────────────────────────────────────────────────

import { addDays, format as formatDate, parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import type { GrahaId, Rashi } from '@/types/astrology'
import { RASHI_SANSKRIT } from '@/types/astrology'
import {
  SWISSEPH_IDS,
  dateToJD,
  getAyanamsha,
  getPlanetPosition,
  jdToDate,
  ketuLongitude,
  signOf,
  toSidereal,
} from '@/lib/engine/ephemeris'
import { getTithi } from '@/lib/engine/nakshatra'
import { getMoonrise, getSunrise, getSunset } from '@/lib/engine/sunrise'
import { getLunarMonth, type LunarMasa } from '@/lib/engine/panchangVishesh'
import { calculatePersonalTransits } from '@/lib/engine/transits'
import {
  ADHIKA_EKADASHI_NAMES,
  EKADASHI_NAMES,
  FESTIVAL_RULES,
  SOLAR_FESTIVAL_RULES,
  type FestivalObserve,
} from './festivals'

// ── Public types ─────────────────────────────────────────────

export type CalendarEventKind = 'vrat' | 'festival' | 'sankranti' | 'ingress' | 'retro_start' | 'retro_end'

export interface CalendarEvent {
  id:     string
  /** Local civil date YYYY-MM-DD (location timezone) */
  date:   string
  kind:   CalendarEventKind
  title:  string
  deva:   string
  planet?: GrahaId
  sign?:   Rashi
  detail?: string
  /** Exact instant (ISO) for ingress / station / sankranti events */
  at?:     string
  /** Amanta lunar month for vrats / festivals ("Adhika Jyeshtha" when intercalary) */
  masa?:   string
  suggestedTemplates: string[]
}

export interface EventLocation {
  id:   string
  name: string
  lat:  number
  lng:  number
  tz:   string
}

export const EVENT_LOCATIONS: Record<'delhi' | 'ujjain', EventLocation> = {
  delhi:  { id: 'delhi',  name: 'New Delhi', lat: 28.6139, lng: 77.2090, tz: 'Asia/Kolkata' },
  ujjain: { id: 'ujjain', name: 'Ujjain',    lat: 23.1765, lng: 75.7885, tz: 'Asia/Kolkata' },
}

export const MAX_EVENT_RANGE_DAYS = 62

// ── Astronomy helpers ────────────────────────────────────────

const norm360 = (x: number) => ((x % 360) + 360) % 360
const wrap180 = (x: number) => { const n = norm360(x); return n > 180 ? n - 360 : n }

function sunMoonAtJd(jd: number): { sun: number; moon: number } {
  const ayan = getAyanamsha(jd, 'lahiri')
  const sun = toSidereal(getPlanetPosition(jd, SWISSEPH_IDS.Su).longitude, ayan)
  const moon = toSidereal(getPlanetPosition(jd, SWISSEPH_IDS.Mo).longitude, ayan)
  return { sun, moon }
}

function tithiAt(instant: Date): number {
  const { sun, moon } = sunMoonAtJd(dateToJD(instant))
  return getTithi(moon, sun).number
}

/** Refine to the exact new moon near `jd` (elongation = 0). */
function refineNewMoon(jd: number): number {
  let t = jd
  for (let i = 0; i < 12; i += 1) {
    const { sun, moon } = sunMoonAtJd(t)
    const e = wrap180(moon - sun)
    if (Math.abs(e) < 1e-5) break
    t -= e / 12.19
  }
  return t
}

interface MasaInfo { masa: LunarMasa; adhika: boolean }
const masaCache = new Map<number, MasaInfo>()

/** Amanta masa at an instant, with adhika detection from the bracketing new moons. */
function masaAt(instant: Date): MasaInfo {
  const jd = dateToJD(instant)
  const { sun, moon } = sunMoonAtJd(jd)
  const prevNm = refineNewMoon(jd - norm360(moon - sun) / 12.19)
  const key = Math.round(prevNm * 4)
  const hit = masaCache.get(key)
  if (hit) return hit

  const atPrev = sunMoonAtJd(prevNm)
  const nextNm = refineNewMoon(prevNm + 29.53)
  const atNext = sunMoonAtJd(nextNm)
  // Exact at the new moon, so getLunarMonth's back-projection is a no-op.
  const masa = getLunarMonth(atPrev.sun, atPrev.sun).amanta
  const info: MasaInfo = { masa, adhika: signOf(atPrev.sun) === signOf(atNext.sun) }
  if (masaCache.size > 500) masaCache.clear()
  masaCache.set(key, info)
  return info
}

const masaLabel = (m: MasaInfo) => (m.adhika ? `Adhika ${m.masa}` : m.masa)

// ── Day grid ─────────────────────────────────────────────────

interface DayInfo {
  date:     string
  weekday:  number          // 0 = Sunday
  instants: Record<FestivalObserve, Date>
  tithi:    Partial<Record<FestivalObserve, number>>
}

function buildDays(from: string, to: string, loc: EventLocation): DayInfo[] {
  // One padding day each side for vriddhi / kshaya checks.
  const start = addDays(parseISO(from), -1)
  const end = addDays(parseISO(to), 1)
  const days: DayInfo[] = []
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const date = formatDate(d, 'yyyy-MM-dd')
    const next = formatDate(addDays(d, 1), 'yyyy-MM-dd')
    const sunrise = getSunrise(date, loc.lat, loc.lng, loc.tz)
    const sunset = getSunset(date, loc.lat, loc.lng, loc.tz)
    const nextSunrise = getSunrise(next, loc.lat, loc.lng, loc.tz)
    const moonrise = getMoonrise(date, loc.lat, loc.lng, loc.tz)
    days.push({
      date,
      weekday: new Date(`${date}T12:00:00Z`).getUTCDay(),
      instants: {
        sunrise,
        madhyahna: new Date((sunrise.getTime() + sunset.getTime()) / 2),
        // Aparahna = 4th fifth of the daytime; sample its middle.
        aparahna:  new Date(sunrise.getTime() + 0.7 * (sunset.getTime() - sunrise.getTime())),
        // Pradosh kaal ≈ 6 ghatis after sunset; sample its middle.
        pradosh:  new Date(sunset.getTime() + 72 * 60_000),
        nishita:  new Date((sunset.getTime() + nextSunrise.getTime()) / 2),
        moonrise: moonrise ?? new Date(sunset.getTime() + 3 * 3_600_000),
      },
      tithi: {},
    })
  }
  return days
}

function tithiOf(day: DayInfo, mode: FestivalObserve): number {
  const cached = day.tithi[mode]
  if (cached !== undefined) return cached
  const t = tithiAt(day.instants[mode])
  day.tithi[mode] = t
  return t
}

const forward = (a: number, b: number) => (b - a + 30) % 30

interface TithiMatch {
  /** Index into days (padding excluded) */
  i:  number
  /** An instant at which the target tithi is current — used for masa lookup */
  at: Date
}

/** Days (padding excluded) on which `target` tithi is observed. */
function matchTithiDays(days: DayInfo[], mode: FestivalObserve, target: number): TithiMatch[] {
  const out: TithiMatch[] = []
  for (let i = 1; i < days.length - 1; i += 1) {
    const prev = tithiOf(days[i - 1], mode)
    const cur = tithiOf(days[i], mode)
    if (cur === target) {
      if (prev !== target) out.push({ i, at: days[i].instants[mode] })
      continue
    }
    const next = tithiOf(days[i + 1], mode)
    const toTarget = forward(cur, target)
    if (toTarget > 0 && toTarget < forward(cur, next)) {
      // Kshaya tithi: find when it begins between this and the next instant,
      // so the month is read inside the tithi itself (matters at new moon).
      let lo = days[i].instants[mode].getTime()
      let hi = days[i + 1].instants[mode].getTime()
      for (let k = 0; k < 18; k += 1) {
        const mid = (lo + hi) / 2
        if (forward(cur, tithiAt(new Date(mid))) >= toTarget) hi = mid
        else lo = mid
      }
      out.push({ i, at: new Date(hi + 60_000) })
    }
  }
  return out
}

// ── Vrats ────────────────────────────────────────────────────

const WEEKDAY_PRADOSH: Record<number, string> = { 1: 'Som Pradosh', 2: 'Bhauma Pradosh', 6: 'Shani Pradosh' }

function findVrats(days: DayInfo[]): CalendarEvent[] {
  const events: CalendarEvent[] = []
  const push = ({ i, at }: TithiMatch, slug: string, title: string, deva: string, detail: string) => {
    const day = days[i]
    const m = masaAt(at)
    events.push({
      id: `vrat:${slug}:${day.date}`,
      date: day.date,
      kind: 'vrat',
      title,
      deva,
      detail,
      masa: masaLabel(m),
      suggestedTemplates: ['vrat'],
    })
  }

  for (const [tithi, paksha] of [[11, 'shukla'], [26, 'krishna']] as const) {
    for (const match of matchTithiDays(days, 'sunrise', tithi)) {
      const m = masaAt(match.at)
      const name = m.adhika ? ADHIKA_EKADASHI_NAMES[paksha] : EKADASHI_NAMES[m.masa][paksha]
      push(match, `ekadashi-${paksha}`, `${name} Ekadashi`, 'Vishnu',
        `${paksha === 'shukla' ? 'Shukla' : 'Krishna'} Ekadashi of ${masaLabel(m)}; parana on Dwadashi after sunrise.`)
    }
  }
  for (const match of matchTithiDays(days, 'sunrise', 15)) {
    push(match, 'purnima', 'Purnima', 'Chandra & Satyanarayana', 'Full Moon at sunrise.')
  }
  for (const match of matchTithiDays(days, 'sunrise', 30)) {
    push(match, 'amavasya', 'Amavasya', 'Pitrs', 'New Moon at sunrise; tarpan for the ancestors.')
  }
  for (const match of matchTithiDays(days, 'moonrise', 19)) {
    const title = days[match.i].weekday === 2 ? 'Angaraki Sankashti Chaturthi' : 'Sankashti Chaturthi'
    push(match, 'sankashti', title, 'Ganesha', 'Krishna Chaturthi at moonrise; fast ends after sighting the Moon.')
  }
  for (const [tithi, paksha] of [[13, 'shukla'], [28, 'krishna']] as const) {
    for (const match of matchTithiDays(days, 'pradosh', tithi)) {
      const title = WEEKDAY_PRADOSH[days[match.i].weekday] ?? 'Pradosh Vrat'
      push(match, `pradosh-${paksha}`, title, 'Shiva', 'Trayodashi in pradosh kaal (after sunset).')
    }
  }
  return events
}

// ── Lunar festivals ──────────────────────────────────────────

function findLunarFestivals(days: DayInfo[]): CalendarEvent[] {
  const events: CalendarEvent[] = []
  for (const rule of FESTIVAL_RULES) {
    for (const { i, at } of matchTithiDays(days, rule.observe, rule.tithi)) {
      const day = days[i]
      const m = masaAt(at)
      if (m.adhika || m.masa !== rule.masa) continue
      events.push({
        id: `festival:${rule.id}:${day.date}`,
        date: day.date,
        kind: 'festival',
        title: rule.name,
        deva: rule.deva,
        detail: rule.detail,
        masa: m.masa,
        suggestedTemplates: ['festival'],
      })
    }
  }
  return events
}

// ── Transits: sankranti, ingress, retrograde ─────────────────

const GRAHA_DEVA: Record<string, string> = {
  Su: 'Surya', Mo: 'Chandra', Ma: 'Mangal', Me: 'Budha', Ju: 'Brihaspati',
  Ve: 'Shukra', Sa: 'Shani', Ra: 'Rahu', Ke: 'Ketu',
}

function siderealLon(pid: GrahaId, jd: number): { lon: number; retro: boolean } {
  if (pid === 'Ke') {
    const r = getPlanetPosition(jd, SWISSEPH_IDS.Ra, true)
    return { lon: ketuLongitude(r.longitude), retro: r.isRetro }
  }
  const p = getPlanetPosition(jd, SWISSEPH_IDS[pid as keyof typeof SWISSEPH_IDS], true)
  return { lon: p.longitude, retro: p.isRetro }
}

/** Exact JD within the UTC day `date` at which `pick` changes value. */
function refineInstant<T>(pid: GrahaId, date: string, pick: (s: { lon: number; retro: boolean }) => T): number {
  let lo = dateToJD(new Date(`${date}T00:00:00Z`))
  let hi = lo + 1
  const before = pick(siderealLon(pid, lo))
  if (pick(siderealLon(pid, hi)) === before) return lo + 0.5
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2
    if (pick(siderealLon(pid, mid)) === before) lo = mid
    else hi = mid
  }
  return hi
}

function findTransitEvents(from: string, to: string, loc: EventLocation): CalendarEvent[] {
  const start = addDays(parseISO(from), -2)
  const startUtc = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()))
  const spanDays = Math.round((parseISO(to).getTime() - start.getTime()) / 86_400_000) + 3
  // calculatePersonalTransits uses SEFLG_SIDEREAL with the global sid mode — pin Lahiri.
  getAyanamsha(dateToJD(startUtc), 'lahiri')
  const raw = calculatePersonalTransits(1, startUtc, spanDays / 30)

  const events: CalendarEvent[] = []
  const seen = new Set<string>()
  for (const ev of raw) {
    if (ev.planetId === 'Mo') continue
    // With Lagna = Aries, house_change and sign_change coincide (the engine
    // drops the sign_change duplicate), so accept both as an ingress.
    const isSign = ev.type === 'sign_change' || ev.type === 'house_change'
    const isRetro = ev.type === 'retrograde_start' || ev.type === 'retrograde_end'
    if (!isSign && !isRetro) continue
    if (isRetro && (ev.planetId === 'Ra' || ev.planetId === 'Ke' || ev.planetId === 'Su')) continue

    const jd = isSign
      ? refineInstant(ev.planetId, ev.date, (s) => signOf(s.lon))
      : refineInstant(ev.planetId, ev.date, (s) => s.retro)
    const at = jdToDate(jd)
    const date = formatInTimeZone(at, loc.tz, 'yyyy-MM-dd')
    const time = formatInTimeZone(at, loc.tz, 'HH:mm')
    const sign = (isSign ? signOf(siderealLon(ev.planetId, jd + 1e-4).lon) : ev.sign) as Rashi
    const kind: CalendarEventKind = isSign
      ? (ev.planetId === 'Su' ? 'sankranti' : 'ingress')
      : (ev.type === 'retrograde_start' ? 'retro_start' : 'retro_end')

    const key = `${kind}:${ev.planetId}:${sign}:${date}`
    if (seen.has(key)) continue
    seen.add(key)

    const signName = RASHI_SANSKRIT[sign]
    const graha = GRAHA_DEVA[ev.planetId] ?? ev.planetId
    const title = kind === 'sankranti'
      ? `${signName} Sankranti`
      : kind === 'ingress'
        ? `${graha} enters ${signName}`
        : kind === 'retro_start'
          ? `${graha} turns Vakri (retrograde) in ${signName}`
          : `${graha} turns Margi (direct) in ${signName}`

    events.push({
      id: `${kind}:${ev.planetId}-${sign}:${date}`,
      date,
      kind,
      title,
      deva: graha,
      planet: ev.planetId,
      sign,
      at: at.toISOString(),
      detail: `${kind === 'retro_start' || kind === 'retro_end' ? 'Station' : 'Ingress'} at ${time} IST (Lahiri).`,
      suggestedTemplates: kind === 'sankranti' ? ['sankranti'] : kind === 'ingress' ? ['gochar'] : ['retrograde'],
    })
  }
  return events
}

/** Solar festivals: on the ingress day, or the next day if the ingress is after sunset. */
function findSolarFestivals(sankrantis: CalendarEvent[], loc: EventLocation): CalendarEvent[] {
  const out: CalendarEvent[] = []
  for (const ev of sankrantis) {
    if (ev.kind !== 'sankranti' || !ev.sign || !ev.at) continue
    const sunset = getSunset(ev.date, loc.lat, loc.lng, loc.tz)
    const date = new Date(ev.at) > sunset ? formatDate(addDays(parseISO(ev.date), 1), 'yyyy-MM-dd') : ev.date
    for (const rule of SOLAR_FESTIVAL_RULES) {
      if (rule.sign !== ev.sign) continue
      out.push({
        id: `festival:${rule.id}:${date}`,
        date,
        kind: 'festival',
        title: rule.name,
        deva: rule.deva,
        sign: rule.sign,
        planet: 'Su',
        detail: rule.detail,
        suggestedTemplates: ['festival'],
      })
    }
  }
  return out
}

// ── Entry point ──────────────────────────────────────────────

const KIND_ORDER: Record<CalendarEventKind, number> = {
  festival: 0, sankranti: 1, vrat: 2, ingress: 3, retro_start: 4, retro_end: 5,
}

export function findCalendarEvents(
  from: string,
  to: string,
  loc: EventLocation = EVENT_LOCATIONS.delhi,
): CalendarEvent[] {
  const inRange = (e: CalendarEvent) => e.date >= from && e.date <= to
  const days = buildDays(from, to, loc)
  const transits = findTransitEvents(from, to, loc)
  const all = [
    ...findVrats(days),
    ...findLunarFestivals(days),
    ...transits,
    ...findSolarFestivals(transits, loc),
  ].filter(inRange)
  return all.sort((a, b) =>
    a.date.localeCompare(b.date) || KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.title.localeCompare(b.title),
  )
}
