// ─────────────────────────────────────────────────────────────
//  src/lib/engine/transitCalendar.ts
//  Personal monthly gochar calendar (events + Saturn–Moon flags)
// ─────────────────────────────────────────────────────────────

import {
  calculatePersonalTransits,
  getCurrentTransitPositions,
  type TransitEvent,
} from '@/lib/engine/transits'
import {
  classifySaturnFromMoon,
  type SaturnMoonPhaseKind,
} from '@/lib/engine/sadeSati'
import { GRAHA_NAMES, RASHI_NAMES, type GrahaId, type Rashi } from '@/types/astrology'
import { SWISSEPH_IDS, dateToJD, getPlanetPosition, signOf } from '@/lib/engine/ephemeris'

export interface TransitCalendarDayEvent {
  planetId: GrahaId
  planetName: string
  type: TransitEvent['type']
  label: string
  isMajor: boolean
}

export interface TransitCalendarDay {
  dateIso: string
  day: number
  events: TransitCalendarDayEvent[]
  sadeSatiKind: SaturnMoonPhaseKind
  sadeSatiLabel: string
  majorSnippet: string
  flags: string[]
}

export interface TransitCalendarMonth {
  year: number
  month: number // 1–12
  monthLabel: string
  ascRashi: Rashi
  moonRashi: Rashi
  days: TransitCalendarDay[]
  summary: string
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const KIND_LABEL: Record<SaturnMoonPhaseKind, string> = {
  sade_sati_rising: 'SS Rising',
  sade_sati_peak: 'SS Peak',
  sade_sati_setting: 'SS Setting',
  kantaka: 'Kantaka',
  ashtama: 'Ashtama',
  clear: 'Clear',
}

const MAJOR: GrahaId[] = ['Ju', 'Sa', 'Ra', 'Ke']

function utcNoon(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function saturnKindOnDay(moonRashi: Rashi, date: Date): SaturnMoonPhaseKind {
  const jd = dateToJD(date)
  const pos = getPlanetPosition(jd, SWISSEPH_IDS.Sa, true)
  const saRashi = signOf(pos.longitude) as Rashi
  const house = ((saRashi - moonRashi + 12) % 12) + 1
  return classifySaturnFromMoon(house)
}

function eventLabel(ev: TransitEvent): string {
  const name = GRAHA_NAMES[ev.planetId] ?? ev.planetId
  if (ev.type === 'sign_change') return `${name} → ${RASHI_NAMES[ev.sign as Rashi] ?? ev.sign}`
  if (ev.type === 'house_change') return `${name} H${ev.house}`
  if (ev.type === 'retrograde_start') return `${name} Rx`
  if (ev.type === 'retrograde_end') return `${name} Dir`
  if (ev.type === 'nakshatra_change') return `${name} ${ev.nakshatra}`
  return `${name} ${ev.type.replace(/_/g, ' ')}`
}

/**
 * Build a personal gochar month for lagna + Moon.
 */
export function buildTransitMonthCalendar(input: {
  ascRashi: Rashi
  moonRashi: Rashi
  year: number
  month: number // 1–12
}): TransitCalendarMonth {
  const { ascRashi, moonRashi, year, month } = input
  const nDays = daysInMonth(year, month)
  const start = utcNoon(year, month, 1)

  const rawEvents = calculatePersonalTransits(ascRashi, start, 1.05)
  const byDate = new Map<string, TransitEvent[]>()
  for (const ev of rawEvents) {
    if (!ev.date.startsWith(`${year}-${String(month).padStart(2, '0')}`)) continue
    const list = byDate.get(ev.date) ?? []
    list.push(ev)
    byDate.set(ev.date, list)
  }

  const days: TransitCalendarDay[] = []
  let ssDays = 0
  let eventDays = 0

  for (let d = 1; d <= nDays; d += 1) {
    const date = utcNoon(year, month, d)
    const dateIso = toIso(year, month, d)
    const kind = saturnKindOnDay(moonRashi, date)
    const dayEvents = (byDate.get(dateIso) ?? [])
      .filter(ev => MAJOR.includes(ev.planetId) || ev.isMajor)
      .slice(0, 6)
      .map(ev => ({
        planetId: ev.planetId,
        planetName: GRAHA_NAMES[ev.planetId] ?? ev.planetId,
        type: ev.type,
        label: eventLabel(ev),
        isMajor: ev.isMajor,
      }))

    const positions = getCurrentTransitPositions(ascRashi, date)
      .filter(p => MAJOR.includes(p.planetId))
    const majorSnippet = positions
      .map(p => `${p.planetId}:${rashiShort(p.sign)}/H${p.house}${p.isRetro ? '℞' : ''}`)
      .join(' · ')

    const flags: string[] = []
    if (kind !== 'clear') {
      flags.push(kind)
      ssDays += 1
    }
    if (dayEvents.length) {
      flags.push('events')
      eventDays += 1
    }

    days.push({
      dateIso,
      day: d,
      events: dayEvents,
      sadeSatiKind: kind,
      sadeSatiLabel: KIND_LABEL[kind],
      majorSnippet,
      flags,
    })
  }

  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`
  const summary = `${monthLabel}: ${eventDays} major-event day(s); Saturn–Moon stress on ${ssDays} day(s).`

  return {
    year,
    month,
    monthLabel,
    ascRashi,
    moonRashi,
    days,
    summary,
  }
}

function rashiShort(sign: number): string {
  const short = ['', 'Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi']
  return short[sign] ?? `R${sign}`
}

/** Compact HTML for print / PDF-lite month ephemeris. */
export function transitCalendarToHtml(cal: TransitCalendarMonth, nativeName?: string): string {
  const rows = cal.days.map(d => {
    const ev = d.events.map(e => e.label).join('; ') || '—'
    return `<tr>
      <td>${d.dateIso}</td>
      <td>${d.sadeSatiLabel}</td>
      <td style="font-size:11px">${d.majorSnippet}</td>
      <td style="font-size:11px">${ev}</td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Gochar ${cal.monthLabel}</title>
<style>
body{font-family:Georgia,serif;padding:24px;color:#222}
h1{font-size:1.4rem;margin:0 0 4px}
.meta{color:#666;font-size:0.85rem;margin-bottom:1rem}
table{width:100%;border-collapse:collapse;font-size:12px}
th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;vertical-align:top}
th{background:#f5f0e6}
@media print{body{padding:0}}
</style></head><body>
<h1>Personal Gochar — ${cal.monthLabel}</h1>
<div class="meta">${nativeName ? `${nativeName} · ` : ''}Lagna R${cal.ascRashi} · Moon R${cal.moonRashi}<br/>${cal.summary}</div>
<table>
<thead><tr><th>Date</th><th>Sa–Moon</th><th>Ju/Sa/Ra/Ke</th><th>Events</th></tr></thead>
<tbody>${rows}</tbody>
</table>
<p style="margin-top:1.5rem;font-size:11px;color:#888">Vedaansh · Educational timing only · Confirm with dasha</p>
</body></html>`
}
