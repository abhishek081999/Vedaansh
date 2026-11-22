/**
 * src/lib/engine/muhurtaIcs.ts
 * Build a minimal ICS calendar file for auspicious windows.
 */

export interface IcsEventInput {
  title: string
  description?: string
  start: Date
  end: Date
  location?: string
  /** All-day event on the local civil date `date` (YYYY-MM-DD); start/end are ignored. */
  allDay?: { date: string }
  /** Stable UID so re-importing a calendar updates events instead of duplicating them. */
  uid?: string
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** UTC stamp YYYYMMDDTHHMMSSZ */
export function toIcsUtc(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  )
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

/** YYYYMMDD for an all-day DTSTART / DTEND. */
function icsDate(ymd: string): string {
  return ymd.replace(/-/g, '')
}

function nextDay(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + 1))
  return `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}`
}

/** RFC 5545 line folding: at most 75 octets per line, never splitting a character. */
export function foldIcsLine(line: string): string {
  const enc = new TextEncoder()
  if (enc.encode(line).length <= 75) return line
  const out: string[] = []
  let cur = ''
  let bytes = 0
  for (const ch of line) {
    const n = enc.encode(ch).length
    const limit = out.length === 0 ? 75 : 74
    if (bytes + n > limit) {
      out.push(cur)
      cur = ''
      bytes = 0
    }
    cur += ch
    bytes += n
  }
  out.push(cur)
  return out.join('\r\n ')
}

export function buildMuhurtaIcs(events: IcsEventInput[], calName = 'Vedaansh Muhurta', prodId = 'Muhurta'): string {
  const now = toIcsUtc(new Date())
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//Vedaansh//${prodId}//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcs(calName)}`,
  ]

  events.forEach((ev, i) => {
    const uid = ev.uid ?? `muhurta-${now}-${i}@vedaansh`
    lines.push('BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${now}`)
    if (ev.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${icsDate(ev.allDay.date)}`, `DTEND;VALUE=DATE:${nextDay(ev.allDay.date)}`, 'TRANSP:TRANSPARENT')
    } else {
      lines.push(`DTSTART:${toIcsUtc(ev.start)}`, `DTEND:${toIcsUtc(ev.end)}`)
    }
    lines.push(`SUMMARY:${escapeIcs(ev.title)}`)
    if (ev.description) lines.push(`DESCRIPTION:${escapeIcs(ev.description)}`)
    if (ev.location) lines.push(`LOCATION:${escapeIcs(ev.location)}`)
    lines.push('END:VEVENT')
  })

  lines.push('END:VCALENDAR')
  return lines.map(foldIcsLine).join('\r\n')
}

export function downloadIcs(filename: string, icsBody: string): void {
  const blob = new Blob([icsBody], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
