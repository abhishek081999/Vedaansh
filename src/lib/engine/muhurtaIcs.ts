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

export function buildMuhurtaIcs(events: IcsEventInput[], calName = 'Vedaansh Muhurta'): string {
  const now = toIcsUtc(new Date())
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vedaansh//Muhurta//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcs(calName)}`,
  ]

  events.forEach((ev, i) => {
    const uid = `muhurta-${now}-${i}@vedaansh`
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${toIcsUtc(ev.start)}`,
      `DTEND:${toIcsUtc(ev.end)}`,
      `SUMMARY:${escapeIcs(ev.title)}`,
    )
    if (ev.description) lines.push(`DESCRIPTION:${escapeIcs(ev.description)}`)
    if (ev.location) lines.push(`LOCATION:${escapeIcs(ev.location)}`)
    lines.push('END:VEVENT')
  })

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
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
