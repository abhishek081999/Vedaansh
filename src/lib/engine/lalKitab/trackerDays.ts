// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/trackerDays.ts
//  Calendar logic for the 43-day remedy tracker. Day 1 is the calendar
//  day the remedy was started, in the user's time zone; each later
//  calendar day is the next index. Only today's day can be ticked, and
//  an earlier day left unticked means the run was broken and must
//  restart. Pure — used by the API (enforcement) and the UI (display).
// ─────────────────────────────────────────────────────────────

/** True when `tz` is an IANA time zone this runtime understands. */
export function lkIsTimeZone(tz: string): boolean {
  if (!tz || tz.length > 64) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/** Calendar date (YYYY-MM-DD) of `d` in `tz`; falls back to UTC. */
export function lkCalendarDate(d: Date, tz: string): string {
  const zone = lkIsTimeZone(tz) ? tz : 'UTC'
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')}`
}

function dayNumber(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
}

/** 0-based index of today's day in a run started at `startedAt` (may exceed the run length). */
export function lkTrackerDayIndex(startedAt: Date, now: Date, tz: string): number {
  return Math.max(0, dayNumber(lkCalendarDate(now, tz)) - dayNumber(lkCalendarDate(startedAt, tz)))
}

export interface LkTrackerState {
  /** Today's 0-based day index. */
  todayIndex: number
  /** An earlier day was not ticked: the run is broken. */
  missed: boolean
  /** Today is past the last day of the run. */
  over: boolean
  /** Today's day can be ticked right now. */
  canTick: boolean
}

export function lkTrackerState(days: readonly boolean[], startedAt: Date, now: Date, tz: string): LkTrackerState {
  const todayIndex = lkTrackerDayIndex(startedAt, now, tz)
  const missed = days.slice(0, Math.min(todayIndex, days.length)).some((d) => !d)
  const over = todayIndex >= days.length
  return { todayIndex, missed, over, canTick: !missed && !over && !days[todayIndex] }
}
