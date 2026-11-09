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
import { fill, type EngineLang } from '@/lib/engine/lang'
import { gName, rName } from '@/lib/engine/divisionalLang'
import {
  KIND_LABEL_HI,
  MONTH_NAMES_HI,
  TRANSIT_CALENDAR_HI,
} from '@/lib/engine/locale/transitCalendar.hi'
import { termHi } from '@/i18n/jyotish'
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

function kindLabel(kind: SaturnMoonPhaseKind, lang: EngineLang): string {
  return lang === 'hi' ? KIND_LABEL_HI[kind] : KIND_LABEL[kind]
}

function monthName(month: number, lang: EngineLang): string {
  return lang === 'hi' ? MONTH_NAMES_HI[month - 1]! : MONTH_NAMES[month - 1]!
}

function eventLabel(ev: TransitEvent, lang: EngineLang): string {
  const name = lang === 'hi' ? gName(ev.planetId, 'hi') : (GRAHA_NAMES[ev.planetId] ?? ev.planetId)
  if (ev.type === 'sign_change') {
    const sign = lang === 'hi' ? rName(ev.sign as Rashi, 'hi') : (RASHI_NAMES[ev.sign as Rashi] ?? ev.sign)
    return `${name} → ${sign}`
  }
  if (ev.type === 'house_change') return `${name} H${ev.house}`
  if (ev.type === 'retrograde_start') {
    return lang === 'hi' ? `${name} ${TRANSIT_CALENDAR_HI.rx}` : `${name} Rx`
  }
  if (ev.type === 'retrograde_end') {
    return lang === 'hi' ? `${name} ${TRANSIT_CALENDAR_HI.dir}` : `${name} Dir`
  }
  if (ev.type === 'nakshatra_change') {
    const nak = lang === 'hi' ? termHi(ev.nakshatra) : ev.nakshatra
    return `${name} ${nak}`
  }
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
  lang?: EngineLang
}): TransitCalendarMonth {
  const { ascRashi, moonRashi, year, month } = input
  const lang: EngineLang = input.lang === 'hi' ? 'hi' : 'en'
  const nDays = daysInMonth(year, month)
  const start = utcNoon(year, month, 1)

  const rawEvents = calculatePersonalTransits(ascRashi, start, 1.05, lang)
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
        planetName: lang === 'hi' ? gName(ev.planetId, 'hi') : (GRAHA_NAMES[ev.planetId] ?? ev.planetId),
        type: ev.type,
        label: eventLabel(ev, lang),
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
      sadeSatiLabel: kindLabel(kind, lang),
      majorSnippet,
      flags,
    })
  }

  const monthLabel = `${monthName(month, lang)} ${year}`
  const summary =
    lang === 'hi'
      ? fill(TRANSIT_CALENDAR_HI.summary, { monthLabel, eventDays, ssDays })
      : `${monthLabel}: ${eventDays} major-event day(s); Saturn–Moon stress on ${ssDays} day(s).`

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
export function transitCalendarToHtml(
  cal: TransitCalendarMonth,
  nativeName?: string,
  lang: EngineLang = 'en',
): string {
  const hi = lang === 'hi'
  const html = hi ? TRANSIT_CALENDAR_HI.html : null
  const empty = '—'
  const rows = cal.days.map(d => {
    const ev = d.events.map(e => e.label).join('; ') || empty
    return `<tr>
      <td>${d.dateIso}</td>
      <td>${d.sadeSatiLabel}</td>
      <td style="font-size:11px">${d.majorSnippet}</td>
      <td style="font-size:11px">${ev}</td>
    </tr>`
  }).join('')

  const title = hi
    ? `${html!.titlePrefix} ${cal.monthLabel}`
    : `Gochar ${cal.monthLabel}`
  const heading = hi
    ? fill(html!.heading, { monthLabel: cal.monthLabel })
    : `Personal Gochar — ${cal.monthLabel}`
  const lagnaLabel = hi ? html!.lagna : 'Lagna'
  const moonLabel = hi ? html!.moon : 'Moon'
  const thDate = hi ? html!.thDate : 'Date'
  const thSaMoon = hi ? html!.thSaMoon : 'Sa–Moon'
  const thMajors = hi ? html!.thMajors : 'Ju/Sa/Ra/Ke'
  const thEvents = hi ? html!.thEvents : 'Events'
  const footer = hi
    ? html!.footer
    : 'Vedaansh · Educational timing only · Confirm with dasha'

  return `<!DOCTYPE html><html lang="${hi ? 'hi' : 'en'}"><head><meta charset="utf-8"/><title>${title}</title>
<style>
body{font-family:Georgia,serif;padding:24px;color:#222}
h1{font-size:1.4rem;margin:0 0 4px}
.meta{color:#666;font-size:0.85rem;margin-bottom:1rem}
table{width:100%;border-collapse:collapse;font-size:12px}
th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;vertical-align:top}
th{background:#f5f0e6}
@media print{body{padding:0}}
</style></head><body>
<h1>${heading}</h1>
<div class="meta">${nativeName ? `${nativeName} · ` : ''}${lagnaLabel} R${cal.ascRashi} · ${moonLabel} R${cal.moonRashi}<br/>${cal.summary}</div>
<table>
<thead><tr><th>${thDate}</th><th>${thSaMoon}</th><th>${thMajors}</th><th>${thEvents}</th></tr></thead>
<tbody>${rows}</tbody>
</table>
<p style="margin-top:1.5rem;font-size:11px;color:#888">${footer}</p>
</body></html>`
}
