// ─────────────────────────────────────────────────────────────
//  src/lib/chart/zonedNow.ts
//  Wall-clock "now" in a chart's own IANA timezone.
//  /api/chart/calculate reads birthDate/birthTime as local time
//  in `timezone`, so a transit "now" must be expressed in that
//  same zone, not in IST or the browser's zone.
// ─────────────────────────────────────────────────────────────

export interface ZonedDateTime {
  /** YYYY-MM-DD */
  date: string
  /** HH:MM:SS (24h) */
  time: string
}

function safeZone(timeZone: string | undefined): string {
  if (!timeZone) return 'UTC'
  try {
    new Intl.DateTimeFormat('en-US', { timeZone })
    return timeZone
  } catch {
    return 'UTC'
  }
}

export function zonedDateTime(timeZone: string | undefined, at: Date = new Date()): ZonedDateTime {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: safeZone(timeZone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '00'
  // Some engines still emit "24" at midnight despite h23.
  const hour = get('hour') === '24' ? '00' : get('hour')
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${hour}:${get('minute')}:${get('second')}`,
  }
}

/** Today's date (YYYY-MM-DD) in the given timezone. */
export function zonedToday(timeZone: string | undefined, at: Date = new Date()): string {
  return zonedDateTime(timeZone, at).date
}

/**
 * The instant at which the wall clock in `timeZone` reads `date` `time`.
 * Inverse of zonedDateTime (to the second). For a time skipped by a DST
 * jump, returns the instant one offset later.
 */
export function zonedWallToDate(date: string, time: string, timeZone: string | undefined): Date {
  const [y, mo, d] = date.split('-').map(Number)
  const [h = 0, mi = 0, s = 0] = time.split(':').map(Number)
  const wallUtc = Date.UTC(y, (mo || 1) - 1, d || 1, h, mi, s)
  const offsetAt = (instant: number) => {
    const z = zonedDateTime(timeZone, new Date(instant))
    const [zy, zmo, zd] = z.date.split('-').map(Number)
    const [zh, zmi, zs] = z.time.split(':').map(Number)
    return Date.UTC(zy, zmo - 1, zd, zh, zmi, zs) - instant
  }
  let instant = wallUtc - offsetAt(wallUtc)
  instant = wallUtc - offsetAt(instant)
  return new Date(instant)
}
